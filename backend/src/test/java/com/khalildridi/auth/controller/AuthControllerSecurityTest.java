package com.khalildridi.auth.controller;

import com.khalildridi.auth.config.JwtConfig;
import com.khalildridi.auth.config.SecurityConfig;
import com.khalildridi.auth.entity.AdminUser;
import com.khalildridi.auth.dto.MeResponse;
import com.khalildridi.auth.repository.AdminUserRepository;
import com.khalildridi.auth.service.AdminUserDetailsService;
import com.khalildridi.auth.service.AuthService;
import com.khalildridi.auth.service.JwtService;
import com.khalildridi.auth.service.RefreshTokenService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.ApplicationContext;

import java.util.Optional;

import java.security.SecureRandom;
import java.util.Base64;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtConfig.class, AuthService.class, AdminUserDetailsService.class})
@TestPropertySource(properties = {
        "app.security.cookie-secure=false",
        "app.security.refresh-token-expiration=7d",
        "app.security.access-token-expiration=15m",
        "app.cors.allowed-origins=http://localhost:4200"
})
class AuthControllerSecurityTest {
    @DynamicPropertySource
    static void configureJwtKey(DynamicPropertyRegistry registry) {
        registry.add("app.security.jwt.secret", () ->
                Base64.getEncoder().encodeToString(new SecureRandom().generateSeed(32)));
    }

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AdminUserRepository adminUserRepository;

    @MockitoBean
    private RefreshTokenService refreshTokenService;

    @MockitoBean
    private JwtService jwtService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    void injectsTheSingleExplicitProviderManagerAndAuthenticatesWithRealBcrypt() {
        String password = "correct-password";
        AdminUser admin = new AdminUser("admin@example.com", passwordEncoder.encode(password));
        when(adminUserRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));

        assertThat(applicationContext.getBeansOfType(AuthenticationManager.class))
                .containsOnlyKeys("authenticationManager");
        assertThat(authenticationManager).isInstanceOf(ProviderManager.class);

        var authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated("admin@example.com", password)
        );

        assertThat(authentication.isAuthenticated()).isTrue();
        assertThat(authentication.getAuthorities())
                .extracting("authority")
                .contains("ROLE_ADMIN");
    }

    @Test
    void loginEndpointUsesTheRealAuthenticationManagerWithTheSameBcryptEncoder() throws Exception {
        String password = "correct-password";
        AdminUser admin = new AdminUser("admin@example.com", passwordEncoder.encode(password));
        when(adminUserRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(refreshTokenService.createFor(admin)).thenReturn("opaque-refresh-token");
        when(jwtService.generateAccessToken("admin@example.com")).thenReturn("signed-access-token");
        when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(900L);

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"ADMIN@example.com","password":"correct-password"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("signed-access-token"))
                .andExpect(jsonPath("$.refreshToken").doesNotExist());
    }

    @Test
    void realAuthenticationManagerRejectsInvalidPasswordAndUnknownUser() {
        AdminUser admin = new AdminUser(
                "admin@example.com",
                passwordEncoder.encode("correct-password")
        );
        when(adminUserRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(adminUserRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> authenticationManager.authenticate(
                        UsernamePasswordAuthenticationToken.unauthenticated(
                                "admin@example.com",
                                "wrong-password"
                        )))
                .isInstanceOf(org.springframework.security.authentication.BadCredentialsException.class);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> authenticationManager.authenticate(
                        UsernamePasswordAuthenticationToken.unauthenticated(
                                "missing@example.com",
                                "any-password"
                        )))
                .isInstanceOf(org.springframework.security.authentication.BadCredentialsException.class);
    }

    @Test
    void realAuthenticationManagerRejectsDisabledAdmin() {
        AdminUser admin = new AdminUser(
                "admin@example.com",
                passwordEncoder.encode("correct-password")
        );
        admin.disable();
        when(adminUserRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> authenticationManager.authenticate(
                        UsernamePasswordAuthenticationToken.unauthenticated(
                                "admin@example.com",
                                "correct-password"
                        )))
                .isInstanceOf(org.springframework.security.authentication.DisabledException.class);
    }

    @Test
    void deniesMeEndpointWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void permitsMeEndpointForAnAuthenticatedAdmin() throws Exception {
        when(adminUserRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(new AdminUser("admin@example.com", "not-used")));

        mockMvc.perform(get("/api/auth/me").with(jwt()
                        .jwt(token -> token.subject("admin@example.com"))
                        .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("admin@example.com"))
                .andExpect(content().string(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("passwordHash"))));
    }

    @Test
    void requiresAdminRoleForAdministrationEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/private")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void loginSetsHttpOnlyRefreshCookieAndDoesNotReturnItInJson() throws Exception {
        String password = "correct-password";
        AdminUser admin = new AdminUser("admin@example.com", passwordEncoder.encode(password));
        when(adminUserRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(refreshTokenService.createFor(admin)).thenReturn("private-refresh-value");
        when(jwtService.generateAccessToken("admin@example.com")).thenReturn("access-token");
        when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(900L);

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin@example.com","password":"correct-password"}
                                """))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie",
                        org.hamcrest.Matchers.allOf(
                                org.hamcrest.Matchers.containsString("refresh_token="),
                                org.hamcrest.Matchers.containsString("HttpOnly"),
                                org.hamcrest.Matchers.containsString("SameSite=Strict"),
                                org.hamcrest.Matchers.containsString("Path=/api/auth"))))
                .andExpect(jsonPath("$.accessToken").value("access-token"))
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(content().string(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("private-refresh-value"))));
    }

    @Test
    void requiresCsrfTokenForLogout() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/auth/logout").with(csrf()))
                .andExpect(status().isOk());
        verify(refreshTokenService).revoke(null);
    }
}
