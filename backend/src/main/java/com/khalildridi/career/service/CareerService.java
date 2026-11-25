package com.khalildridi.career.service;

import com.khalildridi.career.dto.request.*;
import com.khalildridi.career.dto.response.*;
import com.khalildridi.career.entity.*;
import com.khalildridi.career.exception.EducationNotFoundException;
import com.khalildridi.career.exception.ExperienceNotFoundException;
import com.khalildridi.career.exception.SkillNotFoundException;
import com.khalildridi.career.mapper.*;
import com.khalildridi.career.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class CareerService {
    private final SkillRepository skills; private final ExperienceRepository experiences; private final EducationRepository education;
    private final SkillMapper skillMapper; private final ExperienceMapper experienceMapper; private final EducationMapper educationMapper;
    public CareerService(SkillRepository skills, ExperienceRepository experiences, EducationRepository education, SkillMapper skillMapper, ExperienceMapper experienceMapper, EducationMapper educationMapper) {
        this.skills=skills; this.experiences=experiences; this.education=education; this.skillMapper=skillMapper; this.experienceMapper=experienceMapper; this.educationMapper=educationMapper;
    }
    @Transactional(readOnly=true) public CareerResponse career() { return new CareerResponse(skillList(), experienceList(), educationList()); }
    @Transactional(readOnly=true) public List<SkillResponse> skillList(){ return skills.findAllByOrderByIdAsc().stream().map(skillMapper::toResponse).toList(); }
    @Transactional(readOnly=true) public List<ExperienceResponse> experienceList(){ return experiences.findAllByOrderByIdAsc().stream().map(experienceMapper::toResponse).toList(); }
    @Transactional(readOnly=true) public List<EducationResponse> educationList(){ return education.findAllByOrderByIdAsc().stream().map(educationMapper::toResponse).toList(); }
    @Transactional(readOnly=true) public SkillResponse skill(Long id){return skillMapper.toResponse(skills.findById(id).orElseThrow(()->new SkillNotFoundException(id)));}
    @Transactional(readOnly=true) public ExperienceResponse experience(Long id){return experienceMapper.toResponse(experiences.findById(id).orElseThrow(()->new ExperienceNotFoundException(id)));}
    @Transactional(readOnly=true) public EducationResponse education(Long id){return educationMapper.toResponse(education.findById(id).orElseThrow(()->new EducationNotFoundException(id)));}
    @Transactional public SkillResponse create(SkillRequest r){return skillMapper.toResponse(skills.save(skillMapper.toEntity(r)));}
    @Transactional public ExperienceResponse create(ExperienceRequest r){validateDates(r.startDate(),r.endDate());return experienceMapper.toResponse(experiences.save(experienceMapper.toEntity(r)));}
    @Transactional public EducationResponse create(EducationRequest r){validateDates(r.startDate(),r.endDate());return educationMapper.toResponse(education.save(educationMapper.toEntity(r)));}
    @Transactional public SkillResponse updateSkill(Long id,SkillRequest r){Skill e=skills.findById(id).orElseThrow(()->new SkillNotFoundException(id));skillMapper.update(e,r);return skillMapper.toResponse(skills.save(e));}
    @Transactional public ExperienceResponse updateExperience(Long id,ExperienceRequest r){validateDates(r.startDate(),r.endDate());Experience e=experiences.findById(id).orElseThrow(()->new ExperienceNotFoundException(id));experienceMapper.update(e,r);return experienceMapper.toResponse(experiences.save(e));}
    @Transactional public EducationResponse updateEducation(Long id,EducationRequest r){validateDates(r.startDate(),r.endDate());Education e=education.findById(id).orElseThrow(()->new EducationNotFoundException(id));educationMapper.update(e,r);return educationMapper.toResponse(education.save(e));}
    @Transactional public void deleteSkill(Long id){skills.delete(skills.findById(id).orElseThrow(()->new SkillNotFoundException(id)));}
    @Transactional public void deleteExperience(Long id){experiences.delete(experiences.findById(id).orElseThrow(()->new ExperienceNotFoundException(id)));}
    @Transactional public void deleteEducation(Long id){education.delete(education.findById(id).orElseThrow(()->new EducationNotFoundException(id)));}
    private void validateDates(java.time.LocalDate start,java.time.LocalDate end){if(end.isBefore(start))throw new IllegalArgumentException("endDate must not be before startDate");}
}
