package com.khalildridi.career.exception;

public class SkillNotFoundException extends RuntimeException {
    public SkillNotFoundException(Long id) {
        super("Skill not found: " + id);
    }
}
