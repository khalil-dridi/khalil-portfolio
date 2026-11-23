package com.khalildridi.project.exception;

public class UnsupportedProjectMediaFormatException extends RuntimeException {
    public UnsupportedProjectMediaFormatException() {
        super("Unsupported project media format");
    }
}
