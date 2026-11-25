package com.khalildridi.career.dto.request;

import jakarta.validation.constraints.*;

public record SkillRequest(
        @NotBlank @Size(max = 180) String name,
        @NotBlank @Size(max = 80) String category,
        @NotBlank @Size(max = 40) String level,
        @NotBlank @Size(max = 120) String icon,
        @NotBlank @Size(max = 2048) @Pattern(regexp = "https?://[^\\s]+") String url
) {}
