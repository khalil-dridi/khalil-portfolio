package com.khalildridi.auth.exception;

public class InvalidAccessTokenException extends AuthException {
    public InvalidAccessTokenException() {
        super("Access token is invalid");
    }
}
