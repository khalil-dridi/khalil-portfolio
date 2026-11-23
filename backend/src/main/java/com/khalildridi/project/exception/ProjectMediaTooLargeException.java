package com.khalildridi.project.exception;

public class ProjectMediaTooLargeException extends RuntimeException {
    public ProjectMediaTooLargeException() {
        super("Project media exceeds the configured size limit");
    }
}
