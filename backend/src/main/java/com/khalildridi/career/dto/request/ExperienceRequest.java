package com.khalildridi.career.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record ExperienceRequest(
        @Size(max = 180) String position,
        @Size(max = 180) String company,
        @Size(max = 180) String location,
        LocalDate startDate,
        LocalDate endDate,
        Boolean current,
        String description,
        @Size(max = 2048) @Pattern(regexp = "(?:https?://[^\\s]+)?") String companyWebsite
) {}
