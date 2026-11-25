package com.khalildridi.career.exception;

public class ExperienceNotFoundException extends RuntimeException {
    public ExperienceNotFoundException(Long id) {
        super("Experience not found: " + id);
    }
}
