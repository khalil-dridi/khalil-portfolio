package com.khalildridi.career.dto.response;

import java.time.LocalDate;

public record ExperienceResponse(
        Long id,
        String position,
        String company,
        String location,
        LocalDate startDate,
        LocalDate endDate,
        Boolean current,
        String description,
        String companyWebsite
) {}
