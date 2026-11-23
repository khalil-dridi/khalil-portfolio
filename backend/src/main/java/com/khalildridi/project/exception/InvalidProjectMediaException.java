package com.khalildridi.project.exception;

public class InvalidProjectMediaException extends RuntimeException {
    public InvalidProjectMediaException(String message) {
        super(message);
    }

    public InvalidProjectMediaException(String message, Throwable cause) {
        super(message, cause);
    }
}
