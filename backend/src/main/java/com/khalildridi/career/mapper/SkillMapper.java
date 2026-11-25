package com.khalildridi.career.mapper;

import com.khalildridi.career.dto.request.SkillRequest;
import com.khalildridi.career.dto.response.SkillResponse;
import com.khalildridi.career.entity.Skill;
import org.springframework.stereotype.Component;

@Component
public class SkillMapper {
    public Skill toEntity(SkillRequest r) { return new Skill(r.name().trim(), r.category().trim(), r.level().trim(), r.icon().trim(), r.url().trim()); }
    public void update(Skill e, SkillRequest r) { e.update(r.name().trim(), r.category().trim(), r.level().trim(), r.icon().trim(), r.url().trim()); }
    public SkillResponse toResponse(Skill e) { return new SkillResponse(e.getId(), e.getName(), e.getCategory(), e.getLevel(), e.getIcon(), e.getUrl()); }
}
