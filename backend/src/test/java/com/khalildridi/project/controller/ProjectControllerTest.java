package com.khalildridi.project.controller;

import com.khalildridi.auth.config.JwtConfig;
import com.khalildridi.auth.config.SecurityConfig;
import com.khalildridi.auth.service.AdminUserDetailsService;
import com.khalildridi.project.dto.AdminProjectResponse;
import com.khalildridi.project.dto.ProjectMediaResponse;
import com.khalildridi.project.dto.PublicProjectResponse;
import com.khalildridi.project.service.ProjectService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest({ProjectController.class, AdminProjectController.class})
@Import({SecurityConfig.class, JwtConfig.class, ProjectExceptionHandler.class})
@TestPropertySource(properties={"app.security.cookie-secure=false", "app.cors.allowed-origins=http://localhost:4200", "app.security.jwt.secret=01234567890123456789012345678901"})
class ProjectControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean ProjectService service;
    @MockitoBean AdminUserDetailsService adminUserDetailsService;
    private final SimpleGrantedAuthority admin = new SimpleGrantedAuthority("ROLE_ADMIN");

    @Test void publicProjectsAreAnonymousAndAdminApiIsProtected() throws Exception {
        when(service.publicProjects()).thenReturn(List.of(new PublicProjectResponse(1L, "Site", "Description", null, null, null, null)));
        mvc.perform(get("/api/projects")).andExpect(status().isOk()).andExpect(jsonPath("$[0].title").value("Site"));
        mvc.perform(get("/api/admin/projects")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/projects").with(jwt())).andExpect(status().isForbidden());
        when(service.adminProjects()).thenReturn(List.of(new AdminProjectResponse(1L, "Site", "Description", null, null, null, null, LocalDateTime.now(), LocalDateTime.now())));
        mvc.perform(get("/api/admin/projects").with(jwt().authorities(admin))).andExpect(status().isOk());
    }

    @Test void validatesCreateAndAcceptsAdministratorCrudAndMultipartRoutes() throws Exception {
        mvc.perform(post("/api/admin/projects").with(jwt().authorities(admin)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\" \",\"description\":\"Desc\"}"))
                .andExpect(status().isBadRequest());
        verify(service, never()).create(any());

        when(service.uploadImage(eq(1L), any())).thenReturn(new ProjectMediaResponse("/api/projects/1/image", "image/png"));
        mvc.perform(multipart("/api/admin/projects/1/image").file("file", new byte[]{1})
                        .with(jwt().authorities(admin)).with(csrf()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.mediaUrl").value("/api/projects/1/image"));
        mvc.perform(delete("/api/admin/projects/1").with(jwt().authorities(admin)).with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test void mediaRetrievalSetsContentTypeAndSupportsSpringResourceRanges() throws Exception {
        when(service.image(1L)).thenReturn(new ProjectService.MediaContent(new ByteArrayResource(new byte[]{1, 2}), "image/png"));
        mvc.perform(get("/api/projects/1/image")).andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
        when(service.video(1L)).thenReturn(new ProjectService.MediaContent(new ByteArrayResource(new byte[]{0, 1, 2, 3, 4}), "video/mp4"));
        mvc.perform(get("/api/projects/1/video").header("Range", "bytes=1-3"))
                .andExpect(status().isPartialContent()).andExpect(header().string("Content-Range", "bytes 1-3/5"))
                .andExpect(content().bytes(new byte[]{1, 2, 3}));
    }
}
