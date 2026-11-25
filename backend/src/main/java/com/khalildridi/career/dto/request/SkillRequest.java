package com.khalildridi.career.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SkillRequest(
        @Size(max = 180) String name,
        @Size(max = 80) String category,
        @Size(max = 40) String level,
        @Size(max = 120) String icon,
        @Size(max = 2048) @Pattern(regexp = "(?:https?://[^\\s]+)?") String url
) {}
