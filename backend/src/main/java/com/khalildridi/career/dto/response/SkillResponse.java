package com.khalildridi.career.dto.response;



public record SkillResponse(
        Long id,
        String name,
        String category,
        String level,
        String icon,
        String url
) {}
