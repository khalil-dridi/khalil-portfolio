package com.khalildridi.auth.service;

import com.khalildridi.auth.entity.AdminUser;
import com.khalildridi.auth.entity.RefreshToken;
import com.khalildridi.auth.exception.RefreshTokenExpiredException;
import com.khalildridi.auth.exception.RefreshTokenReuseException;
import com.khalildridi.auth.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {
    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private RefreshTokenService refreshTokenService;
    private AdminUser admin;

    @BeforeEach
    void setUp() {
        refreshTokenService = new RefreshTokenService(refreshTokenRepository);
        ReflectionTestUtils.setField(refreshTokenService, "refreshTokenExpiration", Duration.ofDays(7));
        admin = new AdminUser("admin@example.com", "bcrypt-hash");
    }

    @Test
    void storesOnlyTheSha256HashOfGeneratedToken() throws Exception {
        when(refreshTokenRepository.saveAndFlush(any(RefreshToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        String token = refreshTokenService.createFor(admin);

        ArgumentCaptor<RefreshToken> storedToken = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).saveAndFlush(storedToken.capture());
        assertThat(token).matches("[A-Za-z0-9_-]{43}");
        assertThat(storedToken.getValue().getTokenHash())
                .isEqualTo(hash(token))
                .isNotEqualTo(token);
        assertThat(storedToken.getValue().getFamilyId()).isNotBlank();
    }

    @Test
    void rotatesTokenAndPreservesItsFamily() throws Exception {
        String familyId = "family-1";
        String oldRawToken = "old-raw-token";
        RefreshToken oldToken = token(oldRawToken, familyId, LocalDateTime.now(ZoneOffset.UTC).plusDays(1));
        when(refreshTokenRepository.findByTokenHashForUpdate(hash(oldRawToken)))
                .thenReturn(Optional.of(oldToken));
        when(refreshTokenRepository.saveAndFlush(any(RefreshToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        String nextToken = refreshTokenService.rotate(oldRawToken);

        ArgumentCaptor<RefreshToken> storedToken = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).saveAndFlush(storedToken.capture());
        assertThat(oldToken.isRevoked()).isTrue();
        assertThat(storedToken.getValue().getTokenHash()).isEqualTo(hash(nextToken));
        assertThat(storedToken.getValue().getTokenHash()).isNotEqualTo(nextToken);
        assertThat(storedToken.getValue().getFamilyId()).isEqualTo(familyId);
    }

    @Test
    void reuseRevokesAllActiveTokensInFamilyBeforeReportingReuse() throws Exception {
        String familyId = "family-2";
        RefreshToken usedToken = token("used-token", familyId, LocalDateTime.now(ZoneOffset.UTC).plusDays(1));
        usedToken.revoke();
        RefreshToken active1 = token("active-1", familyId, LocalDateTime.now(ZoneOffset.UTC).plusDays(1));
        RefreshToken active2 = token("active-2", familyId, LocalDateTime.now(ZoneOffset.UTC).plusDays(1));
        when(refreshTokenRepository.findByTokenHashForUpdate(hash("used-token")))
                .thenReturn(Optional.of(usedToken));
        when(refreshTokenRepository.findActiveByFamilyIdForUpdate(familyId))
                .thenReturn(List.of(active1, active2));

        assertThatThrownBy(() -> refreshTokenService.rotate("used-token"))
                .isInstanceOf(RefreshTokenReuseException.class);

        assertThat(active1.isRevoked()).isTrue();
        assertThat(active2.isRevoked()).isTrue();
        verify(refreshTokenRepository).flush();
    }

    @Test
    void rejectsExpiredToken() throws Exception {
        String rawToken = "expired-token";
        RefreshToken expired = token(rawToken, "family-3", LocalDateTime.now(ZoneOffset.UTC).minusSeconds(1));
        when(refreshTokenRepository.findByTokenHashForUpdate(hash(rawToken)))
                .thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> refreshTokenService.rotate(rawToken))
                .isInstanceOf(RefreshTokenExpiredException.class);
    }

    @Test
    void logoutRevokesMatchingToken() throws Exception {
        String rawToken = "logout-token";
        RefreshToken refreshToken = token(rawToken, "family-4", LocalDateTime.now(ZoneOffset.UTC).plusDays(1));
        when(refreshTokenRepository.findByTokenHashForUpdate(hash(rawToken)))
                .thenReturn(Optional.of(refreshToken));

        refreshTokenService.revoke(rawToken);

        assertThat(refreshToken.isRevoked()).isTrue();
    }

    private RefreshToken token(String rawToken, String familyId, LocalDateTime expiresAt) throws Exception {
        return new RefreshToken(admin, hash(rawToken), familyId, expiresAt);
    }

    private String hash(String rawToken) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(rawToken.getBytes(StandardCharsets.UTF_8)));
    }
}
