package com.khalildridi.project.dto;

public record PublicProjectResponse(
        Long id,
        String title,
        String description,
        String technologies,
        String backgroundImageUrl,
        String demoVideoUrl,
        String githubUrl
) {
}
