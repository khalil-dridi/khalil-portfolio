package com.khalildridi.profile.controller;

import com.khalildridi.auth.config.*;
import com.khalildridi.auth.service.AdminUserDetailsService;
import com.khalildridi.profile.dto.*;
import com.khalildridi.profile.exception.ProfileNotFoundException;
import com.khalildridi.profile.service.ProfileService;
import com.khalildridi.profile.service.ProfileService.ImageContent;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers={ProfileController.class,AdminProfileController.class})
@Import({SecurityConfig.class,JwtConfig.class,ProfileExceptionHandler.class})
@TestPropertySource(properties={"app.security.cookie-secure=false","app.cors.allowed-origins=http://localhost:4200","app.security.jwt.secret=01234567890123456789012345678901"})
class ProfileControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean ProfileService service;
    @MockitoBean AdminUserDetailsService adminUserDetailsService;

    @Test void publicProfileIsAvailableWithoutAuthentication() throws Exception {
        when(service.publicProfile()).thenReturn(new PublicProfileResponse("Ada","Lovelace","Engineer","Bio","ada@example.com",null,"London",null,null,null,null,true));
        mvc.perform(get("/api/profile")).andExpect(status().isOk()).andExpect(jsonPath("$.firstName").value("Ada"));
    }
    @Test void publicImageHasMediaTypeCacheAndNosniffHeaders() throws Exception {
        when(service.image()).thenReturn(new ImageContent(new byte[]{1,2,3},"image/png"));
        mvc.perform(get("/api/profile/image")).andExpect(status().isOk()).andExpect(content().contentType("image/png"))
                .andExpect(header().string("Cache-Control",org.hamcrest.Matchers.allOf(org.hamcrest.Matchers.containsString("public"),org.hamcrest.Matchers.containsString("max-age=3600")))).andExpect(header().string("X-Content-Type-Options","nosniff"));
    }
    @Test void publicMissingProfileAndImageUseNotFoundResponse() throws Exception {
        when(service.publicProfile()).thenThrow(new ProfileNotFoundException()); when(service.image()).thenThrow(new ProfileNotFoundException());
        mvc.perform(get("/api/profile")).andExpect(status().isNotFound()).andExpect(jsonPath("$.status").value(404));
        mvc.perform(get("/api/profile/image")).andExpect(status().isNotFound());
    }
    @Test void adminRequestsRequireAuthenticationAndAdminRole() throws Exception {
        mvc.perform(get("/api/admin/profile")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/profile").header("Authorization","Bearer invalid-token")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/profile").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER")))).andExpect(status().isForbidden());
        when(service.adminProfile()).thenReturn(new AdminProfileResponse(1L,null,null,null,null,null,null,null,null,null,null,null,false,null,null));
        mvc.perform(get("/api/admin/profile").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(1));
    }
    @Test void adminUpdateValidatesRequestAndRequiresCsrf() throws Exception {
        mvc.perform(put("/api/admin/profile").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"bad\"}"))
                .andExpect(status().isBadRequest());
    }
    @Test void csrfProtectionRemainsEnabledInTheImportedApplicationSecurityConfiguration() throws Exception {
        mvc.perform(post("/api/auth/logout")).andExpect(status().isForbidden());
    }
    @Test void adminUpdateUploadAndDeleteWorkWithCsrf() throws Exception {
        when(service.update(any())).thenReturn(new AdminProfileResponse(1L,"Ada",null,null,null,null,null,null,null,null,null,null,true,null,null));
        mvc.perform(put("/api/admin/profile").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"firstName\":\"Ada\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.firstName").value("Ada"));
        when(service.upload(any())).thenReturn(new ProfileImageResponse("/api/profile/image","image/png"));
        mvc.perform(multipart("/api/admin/profile/image").file("file","image".getBytes()).with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))).with(csrf()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.contentType").value("image/png"));
        mvc.perform(delete("/api/admin/profile/image").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))).with(csrf()))
                .andExpect(status().isNoContent());
        verify(service).deleteImage();
    }
}
