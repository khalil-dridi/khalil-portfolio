package com.khalildridi.career.mapper;

import com.khalildridi.career.dto.request.ExperienceRequest;
import com.khalildridi.career.dto.response.ExperienceResponse;
import com.khalildridi.career.entity.Experience;
import java.time.LocalDate;
import org.springframework.stereotype.Component;

@Component
public class ExperienceMapper {
    public Experience toEntity(ExperienceRequest r) { return new Experience(r.position().trim(), r.company().trim(), r.location().trim(), r.startDate(), r.endDate(), r.current(), r.description().trim(), r.companyWebsite().trim()); }
    public void update(Experience e, ExperienceRequest r) { e.update(r.position().trim(), r.company().trim(), r.location().trim(), r.startDate(), r.endDate(), r.current(), r.description().trim(), r.companyWebsite().trim()); }
    public ExperienceResponse toResponse(Experience e) { return new ExperienceResponse(e.getId(), e.getPosition(), e.getCompany(), e.getLocation(), e.getStartDate(), e.getEndDate(), e.getCurrent(), e.getDescription(), e.getCompanyWebsite()); }
}
