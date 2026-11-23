package com.khalildridi.project.controller;

import com.khalildridi.project.dto.AdminProjectResponse;
import com.khalildridi.project.dto.ProjectCreateRequest;
import com.khalildridi.project.dto.ProjectMediaResponse;
import com.khalildridi.project.dto.ProjectUpdateRequest;
import com.khalildridi.project.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/projects")
public class AdminProjectController {
    private final ProjectService service;

    public AdminProjectController(ProjectService service) {
        this.service = service;
    }

    @GetMapping
    public List<AdminProjectResponse> projects() {
        return service.adminProjects();
    }

    @GetMapping("/{id}")
    public AdminProjectResponse project(@PathVariable Long id) {
        return service.adminProject(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminProjectResponse create(@Valid @RequestBody ProjectCreateRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public AdminProjectResponse update(@PathVariable Long id, @Valid @RequestBody ProjectUpdateRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProjectMediaResponse uploadImage(@PathVariable Long id, @RequestPart("file") MultipartFile file) {
        return service.uploadImage(id, file);
    }

    @DeleteMapping("/{id}/image")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteImage(@PathVariable Long id) {
        service.deleteImage(id);
    }

    @PostMapping(value = "/{id}/video", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProjectMediaResponse uploadVideo(@PathVariable Long id, @RequestPart("file") MultipartFile file) {
        return service.uploadVideo(id, file);
    }

    @DeleteMapping("/{id}/video")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteVideo(@PathVariable Long id) {
        service.deleteVideo(id);
    }
}
