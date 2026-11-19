package com.khalildridi.auth.exception;

public abstract class AuthException extends RuntimeException {
    protected AuthException(String message) {
        super(message);
    }
}
