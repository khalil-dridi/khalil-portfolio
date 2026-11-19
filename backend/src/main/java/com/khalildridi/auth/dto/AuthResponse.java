package com.khalildridi.auth.dto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        MeResponse admin
) {
}
