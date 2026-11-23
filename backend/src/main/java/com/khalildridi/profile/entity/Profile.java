package com.khalildridi.profile.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "profile")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Profile {
    @Id
    private Long id;
    @Column(name = "first_name", length = 100) private String firstName;
    @Column(name = "last_name", length = 100) private String lastName;
    @Column(name = "professional_title", length = 180) private String professionalTitle;
    @Column(columnDefinition = "TEXT") private String biography;
    @Column(length = 254) private String email;
    @Column(length = 50) private String phone;
    @Column(length = 180) private String location;
    @Column(name = "profile_image_path", length = 255) private String profileImagePath;
    @Column(name = "resume_url", length = 2048) private String resumeUrl;
    @Column(name = "github_url", length = 2048) private String githubUrl;
    @Column(name = "linkedin_url", length = 2048) private String linkedinUrl;
    @Column(nullable = false) private boolean availability;
    @Column(name = "created_at", nullable = false, insertable = false, updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false) private LocalDateTime updatedAt;

    public void update(String firstName, String lastName, String professionalTitle, String biography,
                       String email, String phone, String location, String resumeUrl,
                       String githubUrl, String linkedinUrl, Boolean availability) {
        if (firstName != null) this.firstName = firstName;
        if (lastName != null) this.lastName = lastName;
        if (professionalTitle != null) this.professionalTitle = professionalTitle;
        if (biography != null) this.biography = biography;
        if (email != null) this.email = email;
        if (phone != null) this.phone = phone;
        if (location != null) this.location = location;
        if (resumeUrl != null) this.resumeUrl = resumeUrl;
        if (githubUrl != null) this.githubUrl = githubUrl;
        if (linkedinUrl != null) this.linkedinUrl = linkedinUrl;
        if (availability != null) this.availability = availability;
    }
    public void setProfileImagePath(String path) { this.profileImagePath = path; }
}
