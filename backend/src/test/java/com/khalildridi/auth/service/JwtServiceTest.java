package com.khalildridi.auth.service;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {
    private static final String SECRET = "a-long-test-secret-with-at-least-32-bytes";

    @Test
    void generatesSignedJwtWithAdminRole() {
        JwtService jwtService = service(SECRET, Duration.ofMinutes(15));

        var decoded = jwtService.validateAndDecode(jwtService.generateAccessToken("admin@example.com"));

        assertThat(decoded.getSubject()).isEqualTo("admin@example.com");
        assertThat(decoded.getClaimAsStringList("roles")).containsExactly("ROLE_ADMIN");
        assertThat(decoded.getExpiresAt()).isAfter(decoded.getIssuedAt());
    }

    @Test
    void rejectsExpiredJwt() throws InterruptedException {
        JwtService jwtService = service(SECRET, Duration.ofSeconds(1));
        String token = jwtService.generateAccessToken("admin@example.com");
        Thread.sleep(1_200);

        assertThatThrownBy(() -> jwtService.validateAndDecode(token))
                .isInstanceOf(com.khalildridi.auth.exception.InvalidAccessTokenException.class);
    }

    @Test
    void rejectsJwtSignedWithAnotherKey() {
        JwtService jwtService = service(SECRET, Duration.ofMinutes(15));
        String token = jwtService.generateAccessToken("admin@example.com");
        JwtDecoder wrongDecoder = decoder("a-different-test-secret-with-at-least-32-bytes");
        ReflectionTestUtils.setField(jwtService, "jwtDecoder", wrongDecoder);

        assertThatThrownBy(() -> jwtService.validateAndDecode(token))
                .isInstanceOf(com.khalildridi.auth.exception.InvalidAccessTokenException.class);
    }

    private JwtService service(String secret, Duration expiration) {
        SecretKey key = key(secret);
        JwtEncoder encoder = new NimbusJwtEncoder(new ImmutableSecret<>(key));
        JwtService jwtService = new JwtService(encoder, decoder(key));
        ReflectionTestUtils.setField(jwtService, "accessTokenExpiration", expiration);
        return jwtService;
    }

    private JwtDecoder decoder(String secret) {
        return decoder(key(secret));
    }

    private JwtDecoder decoder(SecretKey key) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(Duration.ZERO),
                new JwtIssuerValidator("khalil-portfolio")
        ));
        return decoder;
    }

    private SecretKey key(String secret) {
        return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }
}
