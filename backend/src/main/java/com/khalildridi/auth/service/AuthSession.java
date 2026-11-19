package com.khalildridi.auth.service;

import com.khalildridi.auth.dto.MeResponse;

public record AuthSession(
        String accessToken,
        String refreshToken,
        long expiresIn,
        MeResponse admin
) {
}
