package com.khalildridi.project.controller;

import com.khalildridi.auth.config.JwtConfig;
import com.khalildridi.auth.config.SecurityConfig;
import com.khalildridi.auth.service.AdminUserDetailsService;
import com.khalildridi.project.dto.AdminProjectResponse;
import com.khalildridi.project.dto.ProjectMediaResponse;
import com.khalildridi.project.dto.ProjectCreateRequest;
import com.khalildridi.project.dto.ProjectUpdateRequest;
import com.khalildridi.project.exception.ProjectNotFoundException;
import com.khalildridi.project.exception.ProjectMediaNotFoundException;
import com.khalildridi.project.exception.InvalidProjectMediaException;
import com.khalildridi.project.exception.ProjectMediaTooLargeException;
import com.khalildridi.project.exception.UnsupportedProjectMediaFormatException;
import com.khalildridi.project.exception.ProjectMediaStorageException;
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

    @Test void exercisesRemainingAdministrativeAndPublicRoutes() throws Exception {
        var adminResponse = new AdminProjectResponse(3L, "App", "Description", "Java", null, null, null,
                LocalDateTime.now(), LocalDateTime.now());
        when(service.adminProject(3L)).thenReturn(adminResponse);
        when(service.create(any(ProjectCreateRequest.class))).thenReturn(adminResponse);
        when(service.update(eq(3L), any(ProjectUpdateRequest.class))).thenReturn(adminResponse);
        when(service.uploadVideo(eq(3L), any())).thenReturn(new ProjectMediaResponse("/api/projects/3/video", "video/mp4"));
        when(service.publicProject(3L)).thenReturn(new PublicProjectResponse(3L, "App", "Description", "Java", null, null, null));
        when(service.image(3L)).thenReturn(new ProjectService.MediaContent(new ByteArrayResource(new byte[]{1}), "image/png"));

        mvc.perform(get("/api/admin/projects/3").with(jwt().authorities(admin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("App"));
        mvc.perform(post("/api/admin/projects").with(jwt().authorities(admin)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"App\",\"description\":\"Description\"}"))
                .andExpect(status().isCreated());
        mvc.perform(put("/api/admin/projects/3").with(jwt().authorities(admin)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"App\",\"description\":\"Updated\"}"))
                .andExpect(status().isOk());
        mvc.perform(multipart("/api/admin/projects/3/video").file("file", new byte[]{1})
                        .with(jwt().authorities(admin)).with(csrf()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.contentType").value("video/mp4"));
        mvc.perform(delete("/api/admin/projects/3/image").with(jwt().authorities(admin)).with(csrf()))
                .andExpect(status().isNoContent());
        mvc.perform(delete("/api/admin/projects/3/video").with(jwt().authorities(admin)).with(csrf()))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/projects/3")).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(3));
        mvc.perform(get("/api/projects/3/image").header("Range", "bytes=0-0"))
                .andExpect(status().isPartialContent()).andExpect(header().string("Accept-Ranges", "bytes"))
                .andExpect(header().string("Cache-Control", "max-age=3600, public"));
        verify(service).deleteImage(3L);
        verify(service).deleteVideo(3L);
    }

    @Test void mapsProjectMediaExceptionsToStructuredErrorResponses() throws Exception {
        when(service.publicProject(99L)).thenThrow(new ProjectNotFoundException(99L));
        mvc.perform(get("/api/projects/99")).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404)).andExpect(jsonPath("$.path").value("/api/projects/99"))
                .andExpect(jsonPath("$.timestamp").exists()).andExpect(jsonPath("$.error").value("Not Found"));

        when(service.image(99L)).thenThrow(new ProjectMediaNotFoundException());
        mvc.perform(get("/api/projects/99/image")).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Project media not found"));
        when(service.image(98L)).thenThrow(new ProjectMediaStorageException("disk", null));
        mvc.perform(get("/api/projects/98/image")).andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Project media storage failed"));
        when(service.image(97L)).thenThrow(new InvalidProjectMediaException("bad"));
        mvc.perform(get("/api/projects/97/image")).andExpect(status().isBadRequest());
        when(service.image(96L)).thenThrow(new ProjectMediaTooLargeException());
        mvc.perform(get("/api/projects/96/image")).andExpect(status().isPayloadTooLarge());
        when(service.image(95L)).thenThrow(new UnsupportedProjectMediaFormatException());
        mvc.perform(get("/api/projects/95/image")).andExpect(status().isUnsupportedMediaType());
    }
}
