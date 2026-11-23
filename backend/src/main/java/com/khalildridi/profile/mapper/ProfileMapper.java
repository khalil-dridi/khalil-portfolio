package com.khalildridi.profile.mapper;

import com.khalildridi.profile.dto.*;
import com.khalildridi.profile.entity.Profile;
import org.springframework.stereotype.Component;

@Component
public class ProfileMapper {
    private static final String IMAGE_URL = "/api/profile/image";
    public PublicProfileResponse toPublic(Profile p) {
        return new PublicProfileResponse(p.getFirstName(),p.getLastName(),p.getProfessionalTitle(),p.getBiography(),p.getEmail(),p.getPhone(),p.getLocation(),p.getProfileImagePath()==null?null:IMAGE_URL,p.getResumeUrl(),p.getGithubUrl(),p.getLinkedinUrl(),p.isAvailability());
    }
    public AdminProfileResponse toAdmin(Profile p) {
        return new AdminProfileResponse(p.getId(),p.getFirstName(),p.getLastName(),p.getProfessionalTitle(),p.getBiography(),p.getEmail(),p.getPhone(),p.getLocation(),p.getProfileImagePath()==null?null:IMAGE_URL,p.getResumeUrl(),p.getGithubUrl(),p.getLinkedinUrl(),p.isAvailability(),p.getCreatedAt(),p.getUpdatedAt());
    }
}
