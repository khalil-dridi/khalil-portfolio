package com.khalildridi.auth.service;

import com.khalildridi.auth.entity.AdminUser;
import com.khalildridi.auth.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminUserDetailsService implements UserDetailsService {

    private final AdminUserRepository adminUserRepository;

    @Override
    public UserDetails loadUserByUsername(String email) {
        AdminUser admin = adminUserRepository.findByEmail(email.trim())
                .orElseThrow(() ->
                        new UsernameNotFoundException("Admin account not found"));

        return User.withUsername(admin.getEmail())
                .password(admin.getPasswordHash())
                .authorities("ROLE_ADMIN")
                .disabled(!admin.isEnabled())
                .build();
    }
}
