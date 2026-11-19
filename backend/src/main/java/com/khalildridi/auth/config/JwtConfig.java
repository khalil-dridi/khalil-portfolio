package com.khalildridi.auth.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

@Configuration
public class JwtConfig {
    @Bean
    SecretKey jwtSecretKey(
            @Value("${app.security.jwt.secret:}") String secret,
            Environment environment
    ) {
        byte[] keyBytes = null;
        if (secret.isBlank()) {
            boolean developmentProfile = Arrays.asList(environment.getActiveProfiles()).contains("dev")
                    || Arrays.asList(environment.getDefaultProfiles()).contains("dev")
                    || Arrays.asList(environment.getActiveProfiles()).contains("test");
            if (!developmentProfile) {
                throw new IllegalStateException("JWT_SECRET must be configured outside dev and test profiles");
            }
            keyBytes = new byte[32];
            new SecureRandom().nextBytes(keyBytes);
        }

        if (keyBytes == null) {
            if (secret.startsWith("base64:")) {
                try {
                    keyBytes = Base64.getDecoder().decode(secret.substring("base64:".length()));
                } catch (IllegalArgumentException exception) {
                    throw new IllegalStateException("JWT_SECRET has an invalid Base64 value", exception);
                }
            } else {
                keyBytes = secret.getBytes(StandardCharsets.UTF_8);
            }
        }
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET must provide at least 32 bytes of key material");
        }
        return new SecretKeySpec(keyBytes, "HmacSHA256");
    }

    @Bean
    JwtEncoder jwtEncoder(SecretKey jwtSecretKey) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(jwtSecretKey));
    }

    @Bean
    JwtDecoder jwtDecoder(SecretKey jwtSecretKey) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(jwtSecretKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(java.time.Duration.ZERO),
                new JwtIssuerValidator("khalil-portfolio")
        ));
        return decoder;
    }
}
