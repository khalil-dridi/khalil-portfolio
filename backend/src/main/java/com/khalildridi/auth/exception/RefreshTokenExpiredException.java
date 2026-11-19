package com.khalildridi.auth.exception;

public class RefreshTokenExpiredException extends AuthException {
    public RefreshTokenExpiredException() {
        super("Refresh token has expired");
    }
}
