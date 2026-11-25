package com.khalildridi.career.mapper;

import com.khalildridi.career.dto.request.SkillRequest;
import com.khalildridi.career.dto.response.SkillResponse;
import com.khalildridi.career.entity.Skill;
import org.springframework.stereotype.Component;

@Component
public class SkillMapper {
    public Skill toEntity(SkillRequest r) { return new Skill(trim(r.name()), trim(r.category()), trim(r.level()), trim(r.icon()), trim(r.url())); }
    public void update(Skill e, SkillRequest r) { e.update(trim(r.name()), trim(r.category()), trim(r.level()), trim(r.icon()), trim(r.url())); }
    public SkillResponse toResponse(Skill e) { return new SkillResponse(e.getId(), e.getName(), e.getCategory(), e.getLevel(), e.getIcon(), e.getUrl()); }
    private String trim(String value) { return value == null ? null : value.trim(); }
}
