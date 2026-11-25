package com.khalildridi.career.exception;

public class EducationNotFoundException extends RuntimeException {
    public EducationNotFoundException(Long id) {
        super("Education not found: " + id);
    }
}
