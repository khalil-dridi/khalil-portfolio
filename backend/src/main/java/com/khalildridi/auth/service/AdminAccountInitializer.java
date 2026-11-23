package com.khalildridi.auth.service;

import com.khalildridi.auth.entity.AdminUser;
import com.khalildridi.auth.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Component
@RequiredArgsConstructor
public class AdminAccountInitializer implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(AdminAccountInitializer.class);

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${ADMIN_EMAIL:}")
    private String adminEmail;

    @Value("${ADMIN_PASSWORD:}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (adminEmail.isBlank() && adminPassword.isBlank()) {
            return;
        }

        if (adminEmail.isBlank() || adminPassword.isBlank()) {
            throw new IllegalStateException(
                    "ADMIN_EMAIL and ADMIN_PASSWORD must both be configured"
            );
        }

        String normalizedEmail = adminEmail.trim().toLowerCase(Locale.ROOT);

        int atIndex = normalizedEmail.indexOf('@');
        int dotIndex = normalizedEmail.indexOf('.', atIndex + 2);

        boolean containsWhitespace = normalizedEmail.chars()
                .anyMatch(character -> character == ' '
                        || (character >= '\t' && character <= '\r'));

        boolean validEmail = atIndex > 0
                && atIndex == normalizedEmail.lastIndexOf('@')
                && dotIndex >= 0
                && dotIndex < normalizedEmail.length() - 1
                && !normalizedEmail.endsWith(".")
                && !containsWhitespace;

        if (!validEmail) {
            throw new IllegalStateException("ADMIN_EMAIL must be a valid email address");
        }

        if (adminPassword.length() < 12 || adminPassword.length() > 72) {
            throw new IllegalStateException(
                    "ADMIN_PASSWORD must contain between 12 and 72 characters"
            );
        }

        if (adminUserRepository.count() > 0) {
            LOGGER.info("Administrator initialization skipped because an account already exists");
            return;
        }

        adminUserRepository.save(
                new AdminUser(normalizedEmail, passwordEncoder.encode(adminPassword))
        );

        LOGGER.info("Initial administrator account created");
    }
}
