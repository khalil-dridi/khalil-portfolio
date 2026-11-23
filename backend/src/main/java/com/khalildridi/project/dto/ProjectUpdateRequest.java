package com.khalildridi.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProjectUpdateRequest(
        @NotBlank @Size(max = 180) String title,
        @NotBlank @Size(max = 65535) String description,
        @Size(max = 1000) String technologies,
        @Size(max = 2048) @Pattern(regexp = "(?i)(^$|^https?://(?:www\\.)?github\\.com/[^\\s]+$)") String githubUrl
) {
}
