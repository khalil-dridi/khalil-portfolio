package com.khalildridi.profile.dto;

import java.time.LocalDateTime;

public record AdminProfileResponse(Long id, String firstName, String lastName, String professionalTitle,
        String biography, String email, String phone, String location, String profileImageUrl,
        String resumeUrl, String githubUrl, String linkedinUrl, boolean availability,
        LocalDateTime createdAt, LocalDateTime updatedAt) { }
