package com.khalildridi.project.controller;

import com.khalildridi.project.dto.PublicProjectResponse;
import com.khalildridi.project.service.ProjectService;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    private final ProjectService service;

    public ProjectController(ProjectService service) {
        this.service = service;
    }

    @GetMapping
    public List<PublicProjectResponse> projects() {
        return service.publicProjects();
    }

    @GetMapping("/{id}")
    public PublicProjectResponse project(@PathVariable Long id) {
        return service.publicProject(id);
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<Resource> image(@PathVariable Long id) {
        ProjectService.MediaContent media = service.image(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(media.contentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePublic())
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header("X-Content-Type-Options", "nosniff")
                .body(media.resource());
    }

    @GetMapping("/{id}/video")
    public ResponseEntity<Resource> video(@PathVariable Long id) {
        ProjectService.MediaContent media = service.video(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(media.contentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePublic())
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header("X-Content-Type-Options", "nosniff")
                .body(media.resource());
    }
}
