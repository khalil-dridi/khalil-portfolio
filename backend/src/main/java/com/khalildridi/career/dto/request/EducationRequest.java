package com.khalildridi.career.dto.request;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record EducationRequest(
        @NotBlank @Size(max = 180) String institution,
        @NotBlank @Size(max = 180) String degree,
        @NotBlank @Size(max = 180) String fieldOfStudy,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotNull Boolean current,
        @NotBlank String description,
        @NotBlank @Size(max = 2048) @Pattern(regexp = "https?://[^\\s]+") String institutionWebsite
) {}
