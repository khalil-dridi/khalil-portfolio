package com.khalildridi.project.dto;

import java.time.LocalDateTime;

public record AdminProjectResponse(
        Long id,
        String title,
        String description,
        String technologies,
        String backgroundImageUrl,
        String demoVideoUrl,
        String githubUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
