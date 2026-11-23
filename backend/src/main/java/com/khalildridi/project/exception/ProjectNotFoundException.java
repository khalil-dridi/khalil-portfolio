package com.khalildridi.project.exception;

public class ProjectNotFoundException extends RuntimeException {
    public ProjectNotFoundException(Long id) {
        super("Project not found: " + id);
    }
}
