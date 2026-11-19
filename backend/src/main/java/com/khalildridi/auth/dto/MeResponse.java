package com.khalildridi.auth.dto;

import java.time.LocalDateTime;

public record MeResponse(
        Long id,
        String email,
        LocalDateTime lastLoginAt
) {
}
