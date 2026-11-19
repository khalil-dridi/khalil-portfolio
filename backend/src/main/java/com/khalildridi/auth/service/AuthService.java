package com.khalildridi.auth.service;

import com.khalildridi.auth.dto.LoginRequest;
import com.khalildridi.auth.dto.MeResponse;
import com.khalildridi.auth.entity.AdminUser;
import com.khalildridi.auth.exception.AdminAccountDisabledException;
import com.khalildridi.auth.exception.InvalidCredentialsException;
import com.khalildridi.auth.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final AdminUserRepository adminUserRepository;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;
    private static final Logger log =
            LoggerFactory.getLogger(AuthService.class);
    @Transactional
    public AuthSession login(LoginRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        try {
            authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(email, request.password())
            );
        } catch (DisabledException exception) {
            throw new AdminAccountDisabledException();
        } catch (AuthenticationException exception) {
            log.warn(
                    "Authentication failed: {}",
                    exception.getClass().getSimpleName()
            );
            throw new InvalidCredentialsException();
        }

        AdminUser admin = adminUserRepository.findByEmail(email)
                .orElseThrow(InvalidCredentialsException::new);
        if (!admin.isEnabled()) {
            throw new AdminAccountDisabledException();
        }

        admin.recordLogin();
        adminUserRepository.save(admin);
        String refreshToken = refreshTokenService.createFor(admin);
        return createSession(admin, refreshToken);
    }

    public AuthSession refresh(String currentRefreshToken) {
        String nextRefreshToken = refreshTokenService.rotate(currentRefreshToken);
        AdminUser admin = refreshTokenService.findAdminForValidToken(nextRefreshToken);
        return createSession(admin, nextRefreshToken);
    }

    public void logout(String refreshToken) {
        refreshTokenService.revoke(refreshToken);
    }

    @Transactional(readOnly = true)
    public MeResponse me(String email) {
        AdminUser admin = adminUserRepository.findByEmail(email)
                .filter(AdminUser::isEnabled)
                .orElseThrow(AdminAccountDisabledException::new);
        return toMeResponse(admin);
    }

    private AuthSession createSession(AdminUser admin, String refreshToken) {
        return new AuthSession(
                jwtService.generateAccessToken(admin.getEmail()),
                refreshToken,
                jwtService.getAccessTokenExpirationSeconds(),
                toMeResponse(admin)
        );
    }

    private MeResponse toMeResponse(AdminUser admin) {
        return new MeResponse(admin.getId(), admin.getEmail(), admin.getLastLoginAt());
    }
}
