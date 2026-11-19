package com.khalildridi.auth.exception;

public class RefreshTokenInvalidException extends AuthException {
    public RefreshTokenInvalidException() {
        super("Refresh token is invalid");
    }
}
