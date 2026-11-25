package com.khalildridi.career.dto.response;

import java.time.LocalDate;

public record EducationResponse(
        Long id,
        String institution,
        String degree,
        String fieldOfStudy,
        LocalDate startDate,
        LocalDate endDate,
        Boolean current,
        String description,
        String institutionWebsite
) {}
