package com.khalildridi.career.service;

import com.khalildridi.career.dto.request.ExperienceRequest;
import com.khalildridi.career.dto.request.EducationRequest;
import com.khalildridi.career.dto.request.SkillRequest;
import com.khalildridi.career.entity.Skill;
import com.khalildridi.career.exception.SkillNotFoundException;
import com.khalildridi.career.mapper.EducationMapper;
import com.khalildridi.career.mapper.ExperienceMapper;
import com.khalildridi.career.mapper.SkillMapper;
import com.khalildridi.career.repository.EducationRepository;
import com.khalildridi.career.repository.ExperienceRepository;
import com.khalildridi.career.repository.SkillRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDate;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CareerServiceTest {
    @Mock SkillRepository skills;
    @Mock ExperienceRepository experiences;
    @Mock EducationRepository education;
    CareerService service;

    @BeforeEach void setUp() { service = new CareerService(skills, experiences, education, new SkillMapper(), new ExperienceMapper(), new EducationMapper()); }

    @Test void createsSkillWithoutAcceptingGeneratedId() {
        when(skills.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        var result = service.create(new SkillRequest(" Spring ", "Backend", "Advanced", "spring", "https://spring.io"));
        assertEquals("Spring", result.name());
        assertNull(result.id());
    }

    @Test void createsCompletelyEmptySkill() {
        when(skills.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        var result = service.create(new SkillRequest(null, null, null, null, null));
        assertNull(result.name());
        assertNull(result.url());
    }

    @Test void createsPartiallyCompletedExperienceWithMissingDates() {
        when(experiences.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        var result = service.create(new ExperienceRequest("Engineer", null, null, null, null, null, null, null));
        assertEquals("Engineer", result.position());
        assertNull(result.company());
        assertNull(result.startDate());
    }

    @Test void createsCompletelyEmptyEducation() {
        when(education.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        var result = service.create(new EducationRequest(null, null, null, null, null, null, null, null));
        assertNull(result.institution());
        assertNull(result.startDate());
        assertNull(result.current());
    }

    @Test void rejectsReversedExperiencePeriodBeforePersistence() {
        var request = new ExperienceRequest("Engineer", "Example", "Tunis", LocalDate.parse("2025-02-01"), LocalDate.parse("2025-01-01"), false, "Work", "https://example.com");
        assertThrows(IllegalArgumentException.class, () -> service.create(request));
        verifyNoInteractions(experiences);
    }

    @Test void missingSkillReturnsNotFound() {
        when(skills.findById(99L)).thenReturn(Optional.empty());
        assertThrows(SkillNotFoundException.class, () -> service.skill(99L));
    }
}
