package com.khalildridi.profile.service;

import com.khalildridi.profile.dto.*;
import com.khalildridi.profile.entity.Profile;
import com.khalildridi.profile.exception.*;
import com.khalildridi.profile.mapper.ProfileMapper;
import com.khalildridi.profile.repository.ProfileRepository;
import com.khalildridi.profile.storage.*;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Arrays;
import java.util.Objects;

@Service
public class ProfileService {
    private final ProfileRepository repository;
    private final ProfileMapper mapper;
    private final ProfileImageStorageService storage;
    public ProfileService(ProfileRepository repository, ProfileMapper mapper, ProfileImageStorageService storage) {
        this.repository=repository; this.mapper=mapper; this.storage=storage;
    }
    private Profile profile() { return repository.findById(1L).orElseThrow(ProfileNotFoundException::new); }
    @Transactional public PublicProfileResponse publicProfile() { return mapper.toPublic(profile()); }
    @Transactional public AdminProfileResponse adminProfile() { return mapper.toAdmin(profile()); }
    @Transactional public AdminProfileResponse update(ProfileUpdateRequest r) {
        validateUrl(r.resumeUrl(), "resumeUrl"); validateUrl(r.githubUrl(), "githubUrl"); validateUrl(r.linkedinUrl(), "linkedinUrl");
        Profile p=profile(); p.update(r.firstName(),r.lastName(),r.professionalTitle(),r.biography(),r.email(),r.phone(),r.location(),r.resumeUrl(),r.githubUrl(),r.linkedinUrl(),r.availability());
        return mapper.toAdmin(repository.save(p));
    }
    private void validateUrl(String value, String field) {
        if (value == null || value.isBlank()) return;
        try { var uri=java.net.URI.create(value); if (!("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme())) || uri.getHost()==null) throw new IllegalArgumentException(); }
        catch (IllegalArgumentException e) { throw new InvalidProfileException("Invalid URL for " + field); }
    }
    @Transactional public ProfileImageResponse upload(MultipartFile file) {
        Profile p=profile();
        StoredImage fresh=storage.store(file);
        String old=p.getProfileImagePath();
        try { p.setProfileImagePath(fresh.key()); repository.saveAndFlush(p); }
        catch (RuntimeException e) { storage.delete(fresh.key()); throw e; }
        afterCompletion(() -> { if (old != null) storage.delete(old); }, () -> storage.delete(fresh.key()));
        return new ProfileImageResponse("/api/profile/image", fresh.contentType());
    }
    @Transactional public void deleteImage() {
        Profile p=profile(); String old=p.getProfileImagePath();
        if (old == null) return;
        p.setProfileImagePath(null); repository.saveAndFlush(p);
        afterCompletion(() -> storage.delete(old), null);
    }
    private void afterCompletion(Runnable committed, Runnable rolledBack) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) { committed.run(); return; }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCompletion(int status) { if (status == STATUS_COMMITTED) committed.run(); else if (rolledBack != null) rolledBack.run(); }
        });
    }
    public ImageContent image() {
        Profile p=profile(); String key=p.getProfileImagePath();
        if (key == null) throw new ProfileNotFoundException();
        String type=key.endsWith(".jpg")?"image/jpeg":key.endsWith(".png")?"image/png":"image/webp";
        try { return new ImageContent(storage.read(key), type); }
        catch (java.io.IOException e) { throw new ImageStorageException("Unable to read profile image", e); }
    }
    public record ImageContent(byte[] bytes, String contentType) {

        public ImageContent {
            bytes = Objects.requireNonNull(bytes).clone();
            contentType = Objects.requireNonNull(contentType);
        }

        @Override
        public byte[] bytes() {
            return bytes.clone();
        }

        @Override
        public boolean equals(Object object) {
            if (this == object) {
                return true;
            }

            if (!(object instanceof ImageContent other)) {
                return false;
            }

            return Arrays.equals(bytes, other.bytes)
                    && Objects.equals(contentType, other.contentType);
        }

        @Override
        public int hashCode() {
            return 31 * Arrays.hashCode(bytes)
                    + Objects.hashCode(contentType);
        }

        @Override
        public String toString() {
            return "ImageContent[bytes=" + bytes.length
                    + ", contentType=" + contentType + "]";
        }
    }
}
