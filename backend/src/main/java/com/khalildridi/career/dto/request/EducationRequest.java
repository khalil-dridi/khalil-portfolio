package com.khalildridi.career.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record EducationRequest(
        @Size(max = 180) String institution,
        @Size(max = 180) String degree,
        @Size(max = 180) String fieldOfStudy,
        LocalDate startDate,
        LocalDate endDate,
        Boolean current,
        String description,
        @Size(max = 2048) @Pattern(regexp = "(?:https?://[^\\s]+)?") String institutionWebsite
) {}
