package com.khalildridi.profile.dto;

public record PublicProfileResponse(String firstName, String lastName, String professionalTitle,
        String biography, String email, String phone, String location, String profileImageUrl,
        String resumeUrl, String githubUrl, String linkedinUrl, boolean availability) { }
