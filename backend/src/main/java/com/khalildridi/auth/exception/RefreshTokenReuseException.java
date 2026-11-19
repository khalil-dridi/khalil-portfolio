package com.khalildridi.auth.exception;

public class RefreshTokenReuseException extends AuthException {
    public RefreshTokenReuseException() {
        super("Refresh token is invalid");
    }
}
