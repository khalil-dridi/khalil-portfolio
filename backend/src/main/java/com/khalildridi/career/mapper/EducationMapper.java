package com.khalildridi.career.mapper;

import com.khalildridi.career.dto.request.EducationRequest;
import com.khalildridi.career.dto.response.EducationResponse;
import com.khalildridi.career.entity.Education;
import java.time.LocalDate;
import org.springframework.stereotype.Component;

@Component
public class EducationMapper {
    public Education toEntity(EducationRequest r) { return new Education(trim(r.institution()), trim(r.degree()), trim(r.fieldOfStudy()), r.startDate(), r.endDate(), r.current(), trim(r.description()), trim(r.institutionWebsite())); }
    public void update(Education e, EducationRequest r) { e.update(trim(r.institution()), trim(r.degree()), trim(r.fieldOfStudy()), r.startDate(), r.endDate(), r.current(), trim(r.description()), trim(r.institutionWebsite())); }
    public EducationResponse toResponse(Education e) { return new EducationResponse(e.getId(), e.getInstitution(), e.getDegree(), e.getFieldOfStudy(), e.getStartDate(), e.getEndDate(), e.getCurrent(), e.getDescription(), e.getInstitutionWebsite()); }
    private String trim(String value) { return value == null ? null : value.trim(); }
}
