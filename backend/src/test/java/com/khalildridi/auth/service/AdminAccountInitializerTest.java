package com.khalildridi.auth.service;

import com.khalildridi.auth.entity.AdminUser;
import com.khalildridi.auth.repository.AdminUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminAccountInitializerTest {

    @Mock
    private AdminUserRepository adminUserRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AdminAccountInitializer initializer;

    @BeforeEach
    void setUp() {
        initializer = new AdminAccountInitializer(adminUserRepository, passwordEncoder);
    }

    @Test
    void skipsInitializationWhenBothCredentialsAreBlank() {
        configureCredentials(" \t ", "");

        initializer.run(new DefaultApplicationArguments());

        verifyNoInteractions(adminUserRepository, passwordEncoder);
    }

    @ParameterizedTest
    @CsvSource(value = {
            "'   ','a-strong-password'",
            "'admin@example.com','   '"
    })
    void rejectsWhenOnlyOneCredentialIsConfigured(String email, String password) {
        configureCredentials(email, password);

        assertThrows(IllegalStateException.class,
                () -> initializer.run(new DefaultApplicationArguments()));

        verifyNoInteractions(adminUserRepository, passwordEncoder);
    }

    @ParameterizedTest(name = "rejects invalid email: [{0}]")
    @ValueSource(strings = {
            "adminexample.com",
            "admin@@example.com",
            "admin@example",
            "admin@example.com.",
            "admin name@example.com"
    })
    void rejectsInvalidEmail(String email) {
        configureCredentials(email, "a-strong-password");

        assertThrows(IllegalStateException.class,
                () -> initializer.run(new DefaultApplicationArguments()));

        verifyNoInteractions(adminUserRepository, passwordEncoder);
    }

    @ParameterizedTest
    @ValueSource(ints = {11, 73})
    void rejectsPasswordOutsideAllowedLength(int passwordLength) {
        configureCredentials("admin@example.com", "p".repeat(passwordLength));

        assertThrows(IllegalStateException.class,
                () -> initializer.run(new DefaultApplicationArguments()));

        verifyNoInteractions(adminUserRepository, passwordEncoder);
    }

    @ParameterizedTest
    @ValueSource(ints = {12, 72})
    void acceptsPasswordAtLengthBoundaries(int passwordLength) {
        String password = "p".repeat(passwordLength);
        configureCredentials("admin@example.com", password);
        when(adminUserRepository.count()).thenReturn(0L);
        when(passwordEncoder.encode(password)).thenReturn("encoded-password");

        initializer.run(new DefaultApplicationArguments());

        ArgumentCaptor<AdminUser> adminCaptor = ArgumentCaptor.forClass(AdminUser.class);
        verify(adminUserRepository).save(adminCaptor.capture());
        assertThat(adminCaptor.getValue().getPasswordHash()).isEqualTo("encoded-password");
        verify(passwordEncoder).encode(password);
    }

    @Test
    void skipsCreationWhenAnAdministratorAlreadyExists() {
        configureCredentials("admin@example.com", "a-strong-password");
        when(adminUserRepository.count()).thenReturn(1L);

        initializer.run(new DefaultApplicationArguments());

        verify(adminUserRepository).count();
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    void createsAdminWithNormalizedEmailAndEncodedPassword() {
        String password = "a-strong-password";
        configureCredentials("  ADMIN@Example.COM  ", password);
        when(adminUserRepository.count()).thenReturn(0L);
        when(passwordEncoder.encode(password)).thenReturn("encoded-password");

        initializer.run(new DefaultApplicationArguments());

        ArgumentCaptor<AdminUser> adminCaptor = ArgumentCaptor.forClass(AdminUser.class);
        verify(adminUserRepository).save(adminCaptor.capture());
        AdminUser savedAdmin = adminCaptor.getValue();
        assertThat(savedAdmin.getEmail()).isEqualTo("admin@example.com");
        assertThat(savedAdmin.getPasswordHash()).isEqualTo("encoded-password");
        verify(passwordEncoder).encode(password);
    }

    private void configureCredentials(String email, String password) {
        ReflectionTestUtils.setField(initializer, "adminEmail", email);
        ReflectionTestUtils.setField(initializer, "adminPassword", password);
    }
}
