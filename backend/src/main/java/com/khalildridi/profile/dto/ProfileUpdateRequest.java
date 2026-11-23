package com.khalildridi.profile.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
        @Size(max=100) String firstName, @Size(max=100) String lastName,
        @Size(max=180) String professionalTitle, @Size(max=10000) String biography,
        @Email @Size(max=254) String email, @Size(max=50) String phone,
        @Size(max=180) String location, @Size(max=2048) String resumeUrl,
        @Size(max=2048) String githubUrl, @Size(max=2048) String linkedinUrl,
        Boolean availability
) { }
