package com.khalildridi.auth.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtConfigTest {
    private final JwtConfig jwtConfig = new JwtConfig();

    @Test
    void createsRandomEphemeralKeyWhenDevelopmentSecretIsMissing() {
        MockEnvironment environment = environment("dev");

        SecretKey firstKey = jwtConfig.jwtSecretKey("", environment);
        SecretKey secondKey = jwtConfig.jwtSecretKey("", environment);

        assertThat(firstKey.getEncoded()).hasSize(32);
        assertThat(secondKey.getEncoded()).hasSize(32).isNotEqualTo(firstKey.getEncoded());
    }

    @Test
    void acceptsAProvidedRawSecretOfAtLeast32Bytes() {
        String secret = "a-production-safe-test-secret-with-32-bytes-minimum";

        SecretKey key = jwtConfig.jwtSecretKey(secret, environment("prod"));

        assertThat(key.getEncoded()).containsExactly(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void acceptsExplicitlyPrefixedBase64Secret() {
        byte[] sourceKey = new byte[32];
        String secret = "base64:" + Base64.getEncoder().encodeToString(sourceKey);

        SecretKey key = jwtConfig.jwtSecretKey(secret, environment("prod"));

        assertThat(key.getEncoded()).containsExactly(sourceKey);
    }

    @Test
    void refusesMissingSecretOutsideDevelopmentAndTest() {
        assertThatThrownBy(() -> jwtConfig.jwtSecretKey("", environment("prod")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET must be configured");
    }

    private MockEnvironment environment(String profile) {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles(profile);
        return environment;
    }
}
