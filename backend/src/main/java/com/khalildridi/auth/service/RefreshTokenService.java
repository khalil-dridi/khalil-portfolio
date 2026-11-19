package com.khalildridi.auth.service;

import com.khalildridi.auth.entity.AdminUser;
import com.khalildridi.auth.entity.RefreshToken;
import com.khalildridi.auth.repository.RefreshTokenRepository;
import com.khalildridi.auth.exception.AdminAccountDisabledException;
import com.khalildridi.auth.exception.RefreshTokenExpiredException;
import com.khalildridi.auth.exception.RefreshTokenInvalidException;
import com.khalildridi.auth.exception.RefreshTokenReuseException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.security.refresh-token-expiration}")
    private Duration refreshTokenExpiration;

    @Transactional
    public String createFor(AdminUser adminUser) {

        if (!adminUser.isEnabled()) {
            throw new AdminAccountDisabledException();
        }

        return createFor(adminUser, UUID.randomUUID().toString());
    }

    private String createFor(AdminUser adminUser, String familyId) {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);

        String rawToken = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        String tokenHash = hashToken(rawToken);

        RefreshToken refreshToken = new RefreshToken(
                adminUser,
                tokenHash,
                familyId,
                LocalDateTime.now(ZoneOffset.UTC).plus(refreshTokenExpiration)
        );

        refreshTokenRepository.saveAndFlush(refreshToken);

        return rawToken;
    }

    @Transactional(noRollbackFor = RefreshTokenReuseException.class)
    public String rotate(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new RefreshTokenInvalidException();
        }

        RefreshToken current = refreshTokenRepository
                .findByTokenHashForUpdate(hashToken(rawToken))
                .orElseThrow(RefreshTokenInvalidException::new);

        if (current.isRevoked()) {
            revokeFamily(current.getFamilyId());
            refreshTokenRepository.flush();
            throw new RefreshTokenReuseException();
        }

        if (!current.getExpiresAt().isAfter(LocalDateTime.now(ZoneOffset.UTC))) {
            throw new RefreshTokenExpiredException();
        }

        AdminUser adminUser = current.getAdminUser();
        if (!adminUser.isEnabled()) {
            throw new AdminAccountDisabledException();
        }

        current.revoke();
        refreshTokenRepository.flush();
        return createFor(adminUser, current.getFamilyId());
    }

    @Transactional(readOnly = true)
    public AdminUser findAdminForValidToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new RefreshTokenInvalidException();
        }

        RefreshToken token = refreshTokenRepository.findByTokenHash(hashToken(rawToken))
                .orElseThrow(RefreshTokenInvalidException::new);
        if (token.isRevoked()) {
            throw new RefreshTokenInvalidException();
        }
        if (!token.getExpiresAt().isAfter(LocalDateTime.now(ZoneOffset.UTC))) {
            throw new RefreshTokenExpiredException();
        }
        if (!token.getAdminUser().isEnabled()) {
            throw new AdminAccountDisabledException();
        }
        return token.getAdminUser();
    }

    @Transactional(readOnly = true)
    public boolean isValid(String rawToken) {

        if (rawToken == null || rawToken.isBlank()) {
            return false;
        }

        String tokenHash = hashToken(rawToken);

        return refreshTokenRepository.findByTokenHash(tokenHash)
                .filter(token -> !token.isRevoked())
                .filter(token -> token.getExpiresAt().isAfter(
                        LocalDateTime.now(ZoneOffset.UTC)))
                .filter(token -> token.getAdminUser().isEnabled())
                .isPresent();
    }

    @Transactional
    public void revoke(String rawToken) {

        if (rawToken == null || rawToken.isBlank()) {
            return;
        }

        refreshTokenRepository.findByTokenHashForUpdate(hashToken(rawToken))
                .ifPresent(token -> {
                    if (!token.isRevoked()) {
                        token.revoke();
                    }
                });
    }

    private void revokeFamily(String familyId) {
        refreshTokenRepository.findActiveByFamilyIdForUpdate(familyId)
                .forEach(RefreshToken::revoke);
    }

    private String hashToken(String token) {

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            return HexFormat.of().formatHex(
                    digest.digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8))
            );

        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 algorithm not available", exception);
        }
    }
}