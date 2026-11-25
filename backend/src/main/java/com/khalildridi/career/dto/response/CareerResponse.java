package com.khalildridi.career.dto.response;

import java.util.List;

public record CareerResponse(List<SkillResponse> skills, List<ExperienceResponse> experiences, List<EducationResponse> education) {}
