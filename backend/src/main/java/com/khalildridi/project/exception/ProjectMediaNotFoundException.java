package com.khalildridi.project.exception;

public class ProjectMediaNotFoundException extends RuntimeException {
    public ProjectMediaNotFoundException() {
        super("Project media not found");
    }
}
