package com.khalildridi.profile.controller;

import com.khalildridi.auth.config.*;
import com.khalildridi.auth.service.AdminUserDetailsService;
import com.khalildridi.profile.dto.*;
import com.khalildridi.profile.service.ProfileService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AdminProfileController.class)
@Import({SecurityConfig.class,JwtConfig.class,ProfileExceptionHandler.class})
@TestPropertySource(properties={"app.security.cookie-secure=false","app.cors.allowed-origins=http://localhost:4200","app.security.jwt.secret=01234567890123456789012345678901"})
class AdminProfileControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean ProfileService service;
    @MockitoBean AdminUserDetailsService adminUserDetailsService;
    private static final SimpleGrantedAuthority ADMIN=new SimpleGrantedAuthority("ROLE_ADMIN");

    @Test void adminReadRejectsAnonymousAndAcceptsAdministratorJwt() throws Exception {
        mvc.perform(get("/api/admin/profile")).andExpect(status().isUnauthorized());
        when(service.adminProfile()).thenReturn(new AdminProfileResponse(1L,"Ada",null,null,null,null,null,null,null,null,null,null,false,null,null));
        mvc.perform(get("/api/admin/profile").with(jwt().authorities(ADMIN))).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(1));
    }
    @Test void updateValidatesInput() throws Exception {
        mvc.perform(put("/api/admin/profile").with(jwt().authorities(ADMIN)).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"invalid\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }
    @Test void uploadAndDeleteAreAdministratorOnlyAndCsrfProtected() throws Exception {
        when(service.upload(any())).thenReturn(new ProfileImageResponse("/api/profile/image","image/png"));
        mvc.perform(multipart("/api/admin/profile/image").file("file","abc".getBytes()).with(jwt().authorities(ADMIN)).with(csrf()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.imageUrl").value("/api/profile/image"));
        mvc.perform(delete("/api/admin/profile/image").with(jwt().authorities(ADMIN)).with(csrf())).andExpect(status().isNoContent());
        verify(service).deleteImage();
    }
}
