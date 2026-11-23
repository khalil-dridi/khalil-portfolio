package com.khalildridi.profile.service;

import com.khalildridi.profile.dto.ProfileUpdateRequest;
import com.khalildridi.profile.entity.Profile;
import com.khalildridi.profile.exception.*;
import com.khalildridi.profile.mapper.ProfileMapper;
import com.khalildridi.profile.repository.ProfileRepository;
import com.khalildridi.profile.storage.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.mockito.*;
import java.lang.reflect.Constructor;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
class ProfileServiceTest {
    @Mock ProfileRepository repository;
    @Mock ProfileImageStorageService storage;
    @InjectMocks ProfileService service;
    private final ProfileMapper mapper = new ProfileMapper();

    @BeforeEach void setUp() { service = new ProfileService(repository, mapper, storage); }
    private Profile profile() {
        try {
            Constructor<Profile> c=Profile.class.getDeclaredConstructor(); c.setAccessible(true);
            Profile p=c.newInstance(); ReflectionTestUtils.setField(p,"id",1L); return p;
        } catch (Exception e) { throw new AssertionError(e); }
    }
    private MockMultipartFile image() { return new MockMultipartFile("file","ignored.png","image/png",new byte[]{1,2,3}); }

    @Test void retrievesPublicProfileFromSingletonRecord() {
        Profile p=profile(); p.update("Ada","Lovelace","Engineer","Bio","ada@example.com",null,"London",null,null,null,true);
        when(repository.findById(1L)).thenReturn(Optional.of(p));
        var response=service.publicProfile();
        assertThat(response.firstName()).isEqualTo("Ada"); assertThat(response.email()).isEqualTo("ada@example.com");
        assertThat(response.availability()).isTrue(); verify(repository).findById(1L);
    }
    @Test void retrievesAdminProfileAndFailsWhenMissing() {
        Profile p=profile(); when(repository.findById(1L)).thenReturn(Optional.of(p));
        assertThat(service.adminProfile().id()).isEqualTo(1L);
        when(repository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(service::adminProfile).isInstanceOf(ProfileNotFoundException.class);
    }
    @Test void updatesExistingProfileAndKeepsOmittedFields() {
        Profile p=profile(); p.update("Before","Person",null,null,null,null,null,null,null,null,false);
        when(repository.findById(1L)).thenReturn(Optional.of(p)); when(repository.save(p)).thenReturn(p);
        var result=service.update(new ProfileUpdateRequest("After",null,null,null,null,null,null,"https://example.com/cv",null,null,true));
        assertThat(result.firstName()).isEqualTo("After"); assertThat(p.getLastName()).isEqualTo("Person");
        assertThat(result.resumeUrl()).isEqualTo("https://example.com/cv"); assertThat(result.availability()).isTrue();
    }
    @Test void rejectsInvalidUrlBeforeLookingUpProfile() {
        assertThatThrownBy(() -> service.update(new ProfileUpdateRequest(null,null,null,null,null,null,null,"javascript:alert(1)",null,null,null)))
                .isInstanceOf(InvalidProfileException.class);
        verifyNoInteractions(repository);
    }
    @Test void uploadWithoutOldImageSetsNewKeyAndReturnsLocation() {
        Profile p=profile(); when(repository.findById(1L)).thenReturn(Optional.of(p));
        when(storage.store(any())).thenReturn(new StoredImage("new.png","image/png")); when(repository.saveAndFlush(p)).thenReturn(p);
        var result=service.upload(image());
        assertThat(p.getProfileImagePath()).isEqualTo("new.png"); assertThat(result.imageUrl()).isEqualTo("/api/profile/image");
        verify(storage,never()).delete(any());
    }
    @Test void replacementCleansOldImageOnlyAfterSuccessfulTransactionCompletion() {
        Profile p=profile(); p.setProfileImagePath("old.jpg"); when(repository.findById(1L)).thenReturn(Optional.of(p));
        when(storage.store(any())).thenReturn(new StoredImage("new.png","image/png"));
        TransactionSynchronizationManager.initSynchronization();
        try {
            service.upload(image()); verify(storage,never()).delete("old.jpg");
            TransactionSynchronizationManager.getSynchronizations().forEach(s -> s.afterCompletion(org.springframework.transaction.support.TransactionSynchronization.STATUS_COMMITTED));
            verify(storage).delete("old.jpg");
        } finally { TransactionSynchronizationManager.clearSynchronization(); }
    }
    @Test void transactionRollbackDeletesFreshImageAndKeepsOldImage() {
        Profile p=profile(); p.setProfileImagePath("old.jpg"); when(repository.findById(1L)).thenReturn(Optional.of(p));
        when(storage.store(any())).thenReturn(new StoredImage("new.png","image/png"));
        TransactionSynchronizationManager.initSynchronization();
        try {
            service.upload(image());
            TransactionSynchronizationManager.getSynchronizations().forEach(s -> s.afterCompletion(org.springframework.transaction.support.TransactionSynchronization.STATUS_ROLLED_BACK));
            verify(storage).delete("new.png"); verify(storage,never()).delete("old.jpg");
        } finally { TransactionSynchronizationManager.clearSynchronization(); }
    }
    @Test void cleansFreshImageIfDatabaseWriteFails() {
        Profile p=profile(); when(repository.findById(1L)).thenReturn(Optional.of(p));
        when(storage.store(any())).thenReturn(new StoredImage("new.png","image/png"));
        when(repository.saveAndFlush(p)).thenThrow(new IllegalStateException("db"));
        assertThatThrownBy(() -> service.upload(image())).isInstanceOf(IllegalStateException.class);
        verify(storage).delete("new.png"); verify(storage,never()).delete("old.jpg");
    }
    @Test void propagatesStorageAndInvalidImageFailures() {
        when(repository.findById(1L)).thenReturn(Optional.of(profile()));
        when(storage.store(any())).thenThrow(new ImageStorageException("failed",new java.io.IOException()));
        assertThatThrownBy(() -> service.upload(image())).isInstanceOf(ImageStorageException.class);
        doThrow(new InvalidImageException("invalid")).when(storage).store(any());
        assertThatThrownBy(() -> service.upload(image())).isInstanceOf(InvalidImageException.class);
    }
    @Test void deleteClearsReferenceAndDefersFileRemovalUntilCommit() {
        Profile p=profile(); p.setProfileImagePath("old.png"); when(repository.findById(1L)).thenReturn(Optional.of(p));
        TransactionSynchronizationManager.initSynchronization();
        try {
            service.deleteImage(); assertThat(p.getProfileImagePath()).isNull(); verify(storage,never()).delete("old.png");
            TransactionSynchronizationManager.getSynchronizations().forEach(s -> s.afterCompletion(org.springframework.transaction.support.TransactionSynchronization.STATUS_COMMITTED));
            verify(storage).delete("old.png");
        } finally { TransactionSynchronizationManager.clearSynchronization(); }
    }
    @Test void missingImageAndReadFailureAreReported() throws Exception {
        Profile p=profile(); when(repository.findById(1L)).thenReturn(Optional.of(p));
        assertThatThrownBy(service::image).isInstanceOf(ProfileNotFoundException.class);
        p.setProfileImagePath("a.jpg"); when(storage.read("a.jpg")).thenThrow(new java.io.IOException());
        assertThatThrownBy(service::image).isInstanceOf(ImageStorageException.class);
    }
    @Test void transactionalOperationsDeclareSpringTransactionBoundary() throws Exception {
        assertThat(ProfileService.class.getMethod("upload",org.springframework.web.multipart.MultipartFile.class).isAnnotationPresent(jakarta.transaction.Transactional.class)).isTrue();
        assertThat(ProfileService.class.getMethod("deleteImage").isAnnotationPresent(jakarta.transaction.Transactional.class)).isTrue();
    }
    @Test
void imageContentShouldCompareArraysByContent() {
    var first = new ProfileService.ImageContent(
            new byte[]{1, 2, 3}, "image/png"
    );

    var second = new ProfileService.ImageContent(
            new byte[]{1, 2, 3}, "image/png"
    );

    assertThat(first).isEqualTo(second);
    assertThat(first.hashCode()).isEqualTo(second.hashCode());
}

@Test
void imageContentShouldDetectDifferentValues() {
    var content = new ProfileService.ImageContent(
            new byte[]{1, 2, 3}, "image/png"
    );

    var differentBytes = new ProfileService.ImageContent(
            new byte[]{4, 5, 6}, "image/png"
    );

    var differentType = new ProfileService.ImageContent(
            new byte[]{1, 2, 3}, "image/jpeg"
    );

    assertThat(content).isNotEqualTo(differentBytes);
    assertThat(content).isNotEqualTo(differentType);
}

    @Test
    void imageContentEqualsShouldHandleIdentityNullAndDifferentTypes() {
        var content = new ProfileService.ImageContent(
                new byte[]{1, 2, 3}, "image/png"
        );

        Object sameReference = content;
        Object nullReference = null;
        Object differentType = "not an ImageContent";

        assertThat(content).isEqualTo(sameReference);
        assertThat(content).isNotEqualTo(nullReference);
        assertThat(content).isNotEqualTo(differentType);
    }

@Test
void imageContentShouldProtectItsInternalByteArray() {
    byte[] original = {1, 2, 3};

    var content = new ProfileService.ImageContent(original, "image/png");

    // Modification du tableau original
    original[0] = 99;

    assertThat(content.bytes()).containsExactly(1, 2, 3);

    // Modification du tableau retourné
    byte[] returned = content.bytes();
    returned[0] = 99;

    assertThat(content.bytes()).containsExactly(1, 2, 3);
}

@Test
void imageContentShouldGenerateSafeToString() {
    var content = new ProfileService.ImageContent(
            new byte[]{1, 2, 3}, "image/png"
    );

    assertThat(content.toString())
            .isEqualTo("ImageContent[bytes=3, contentType=image/png]");
}

@Test
void imageContentShouldRejectNullValues() {
    assertThatThrownBy(() ->
            new ProfileService.ImageContent(null, "image/png")
    ).isInstanceOf(NullPointerException.class);

    assertThatThrownBy(() ->
            new ProfileService.ImageContent(new byte[]{1}, null)
    ).isInstanceOf(NullPointerException.class);
}
}
