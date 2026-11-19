package com.khalildridi.auth.service;

import com.khalildridi.auth.entity.AdminUser;
import com.khalildridi.auth.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class AdminPasswordResetRunner implements ApplicationRunner {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(AdminPasswordResetRunner.class);

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${ADMIN_PASSWORD_RESET:false}")
    private boolean resetEnabled;

    @Value("${ADMIN_EMAIL:}")
    private String adminEmail;

    @Value("${ADMIN_PASSWORD:}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {

        if (!resetEnabled) {
            return;
        }

        if (adminEmail.isBlank() || adminPassword.length() < 12
                || adminPassword.length() > 72) {
            throw new IllegalStateException("Invalid administrator credentials");
        }

        String email = adminEmail.trim().toLowerCase(Locale.ROOT);

        AdminUser admin = adminUserRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalStateException("Administrator account not found"));

        admin.changePasswordHash(passwordEncoder.encode(adminPassword));

        adminUserRepository.saveAndFlush(admin);

        AdminUser persistedAdmin = adminUserRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalStateException("Administrator not found"));

        boolean passwordMatches = passwordEncoder.matches(
                adminPassword,
                persistedAdmin.getPasswordHash()
        );

        LOGGER.info("Admin password BCrypt verification: {}", passwordMatches);

        LOGGER.info("Administrator password reset completed.");
    }
}