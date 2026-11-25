package com.khalildridi.career.controller;

import com.khalildridi.career.dto.request.*;
import com.khalildridi.career.dto.response.*;
import com.khalildridi.career.service.CareerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/career")
public class CareerAdminController {
    private final CareerService service;
    public CareerAdminController(CareerService service){this.service=service;}
    @GetMapping("/skills") public List<SkillResponse> skills(){return service.skillList();}
    @GetMapping("/skills/{id}") public SkillResponse skill(@PathVariable Long id){return service.skill(id);}
    @PostMapping("/skills") @ResponseStatus(HttpStatus.CREATED) public SkillResponse createSkill(@Valid @RequestBody SkillRequest request){return service.create(request);}
    @PutMapping("/skills/{id}") public SkillResponse updateSkill(@PathVariable Long id,@Valid @RequestBody SkillRequest request){return service.updateSkill(id,request);}
    @DeleteMapping("/skills/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteSkill(@PathVariable Long id){service.deleteSkill(id);}
    @GetMapping("/experiences") public List<ExperienceResponse> experiences(){return service.experienceList();}
    @GetMapping("/experiences/{id}") public ExperienceResponse experience(@PathVariable Long id){return service.experience(id);}
    @PostMapping("/experiences") @ResponseStatus(HttpStatus.CREATED) public ExperienceResponse createExperience(@Valid @RequestBody ExperienceRequest request){return service.create(request);}
    @PutMapping("/experiences/{id}") public ExperienceResponse updateExperience(@PathVariable Long id,@Valid @RequestBody ExperienceRequest request){return service.updateExperience(id,request);}
    @DeleteMapping("/experiences/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteExperience(@PathVariable Long id){service.deleteExperience(id);}
    @GetMapping("/education") public List<EducationResponse> education(){return service.educationList();}
    @GetMapping("/education/{id}") public EducationResponse education(@PathVariable Long id){return service.education(id);}
    @PostMapping("/education") @ResponseStatus(HttpStatus.CREATED) public EducationResponse createEducation(@Valid @RequestBody EducationRequest request){return service.create(request);}
    @PutMapping("/education/{id}") public EducationResponse updateEducation(@PathVariable Long id,@Valid @RequestBody EducationRequest request){return service.updateEducation(id,request);}
    @DeleteMapping("/education/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteEducation(@PathVariable Long id){service.deleteEducation(id);}
}
