package com.khalildridi.auth.service;

import com.khalildridi.auth.dto.LoginRequest;
import com.khalildridi.auth.entity.AdminUser;
import com.khalildridi.auth.exception.AdminAccountDisabledException;
import com.khalildridi.auth.exception.InvalidCredentialsException;
import com.khalildridi.auth.repository.AdminUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private AdminUserRepository adminUserRepository;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private JwtService jwtService;

    private AuthService authService;
    private AdminUser admin;

    @BeforeEach
    void setUp() {
        authService = new AuthService(authenticationManager, adminUserRepository, refreshTokenService, jwtService);
        admin = new AdminUser("admin@example.com", "password-hash");
        ReflectionTestUtils.setField(admin, "id", 1L);
    }

    @Test
    void logsInAndReturnsAccessTokenAndRefreshTokenForCookieTransport() {
        when(adminUserRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(refreshTokenService.createFor(admin)).thenReturn("opaque-refresh-token");
        when(jwtService.generateAccessToken("admin@example.com")).thenReturn("signed-access-token");
        when(jwtService.getAccessTokenExpirationSeconds()).thenReturn(900L);

        AuthSession session = authService.login(new LoginRequest(" ADMIN@example.com ", "correct-password"));

        assertThat(session.accessToken()).isEqualTo("signed-access-token");
        assertThat(session.refreshToken()).isEqualTo("opaque-refresh-token");
        assertThat(session.admin().email()).isEqualTo("admin@example.com");
        assertThat(session.admin().lastLoginAt()).isNotNull();
        verify(adminUserRepository).save(admin);
        verify(authenticationManager).authenticate(any());
    }

    @Test
    void hidesUnknownUserAndWrongPasswordBehindSameAuthenticationFailure() {
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("not exposed"));

        assertThatThrownBy(() -> authService.login(new LoginRequest("admin@example.com", "wrong-password")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void rejectsDisabledAdmin() {
        when(authenticationManager.authenticate(any()))
                .thenThrow(new DisabledException("not exposed"));

        assertThatThrownBy(() -> authService.login(new LoginRequest("admin@example.com", "password")))
                .isInstanceOf(AdminAccountDisabledException.class);
    }
}
