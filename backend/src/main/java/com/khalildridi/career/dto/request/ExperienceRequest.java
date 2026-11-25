package com.khalildridi.career.dto.request;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record ExperienceRequest(
        @NotBlank @Size(max = 180) String position,
        @NotBlank @Size(max = 180) String company,
        @NotBlank @Size(max = 180) String location,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotNull Boolean current,
        @NotBlank String description,
        @NotBlank @Size(max = 2048) @Pattern(regexp = "https?://[^\\s]+") String companyWebsite
) {}
