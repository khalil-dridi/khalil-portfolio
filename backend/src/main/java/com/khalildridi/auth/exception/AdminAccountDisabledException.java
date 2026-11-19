package com.khalildridi.auth.exception;

public class AdminAccountDisabledException extends AuthException {
    public AdminAccountDisabledException() {
        super("Administrator account is disabled");
    }
}
