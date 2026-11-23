package com.khalildridi.project.mapper;

import com.khalildridi.project.dto.AdminProjectResponse;
import com.khalildridi.project.dto.ProjectCreateRequest;
import com.khalildridi.project.dto.ProjectUpdateRequest;
import com.khalildridi.project.dto.PublicProjectResponse;
import com.khalildridi.project.entity.Project;
import org.springframework.stereotype.Component;

@Component
public class ProjectMapper {
    public Project toEntity(ProjectCreateRequest request) {
        return new Project(request.title().trim(), request.description().trim(),
                normalizeOptional(request.technologies()), normalizeOptional(request.githubUrl()));
    }

    public void update(Project project, ProjectUpdateRequest request) {
        project.updateDetails(request.title().trim(), request.description().trim(),
                normalizeOptional(request.technologies()), normalizeOptional(request.githubUrl()));
    }

    public PublicProjectResponse toPublic(Project project) {
        return new PublicProjectResponse(project.getId(), project.getTitle(), project.getDescription(),
                project.getTechnologies(), imageUrl(project), videoUrl(project), project.getGithubUrl());
    }

    public AdminProjectResponse toAdmin(Project project) {
        return new AdminProjectResponse(project.getId(), project.getTitle(), project.getDescription(),
                project.getTechnologies(), imageUrl(project), videoUrl(project), project.getGithubUrl(),
                project.getCreatedAt(), project.getUpdatedAt());
    }

    private String imageUrl(Project project) {
        return project.getBackgroundImagePath() == null ? null : "/api/projects/" + project.getId() + "/image";
    }

    private String videoUrl(Project project) {
        return project.getDemoVideoPath() == null ? null : "/api/projects/" + project.getId() + "/video";
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
