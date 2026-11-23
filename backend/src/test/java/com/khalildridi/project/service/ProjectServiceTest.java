package com.khalildridi.project.service;

import com.khalildridi.project.dto.ProjectCreateRequest;
import com.khalildridi.project.dto.ProjectUpdateRequest;
import com.khalildridi.project.entity.Project;
import com.khalildridi.project.exception.*;
import com.khalildridi.project.mapper.ProjectMapper;
import com.khalildridi.project.repository.ProjectRepository;
import com.khalildridi.project.storage.ProjectMediaStorageService;
import com.khalildridi.project.storage.StoredProjectMedia;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.io.IOException;
import java.nio.file.NoSuchFileException;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ProjectServiceTest {
    private final ProjectRepository repository = mock(ProjectRepository.class);
    private final ProjectMediaStorageService storage = mock(ProjectMediaStorageService.class);
    private final ProjectService service = new ProjectService(repository, new ProjectMapper(), storage);

    @AfterEach void clearSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) TransactionSynchronizationManager.clearSynchronization();
        TransactionSynchronizationManager.clear();
    }

    @Test void listsProjectsAndReturnsEmptyLists() {
        when(repository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(project("Newest"), project("Older")));
        assertEquals(List.of("Newest", "Older"), service.publicProjects().stream().map(p -> p.title()).toList());
        assertEquals(2, service.adminProjects().size());
        when(repository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());
        assertTrue(service.publicProjects().isEmpty());
        assertTrue(service.adminProjects().isEmpty());
        verify(repository, times(4)).findAllByOrderByCreatedAtDesc();
    }

    @Test void createsReadsAndUpdatesProjects() {
        Project saved = project("App");
        when(repository.save(any(Project.class))).thenReturn(saved);
        assertEquals("App", service.create(new ProjectCreateRequest(" App ", " Desc ", " Java ", " ")).title());
        when(repository.findById(1L)).thenReturn(Optional.of(saved));
        assertEquals("App", service.publicProject(1L).title());
        assertEquals("App", service.adminProject(1L).title());
        var updated = service.update(1L, new ProjectUpdateRequest(" Updated ", " New ", " ", null));
        assertEquals("Updated", updated.title());
        assertNull(updated.technologies());
        assertNull(updated.githubUrl());
        verify(repository).save(saved);
    }

    @Test void missingProjectIsReportedForReadsAndMutations() {
        when(repository.findById(44L)).thenReturn(Optional.empty());
        assertThrows(ProjectNotFoundException.class, () -> service.publicProject(44L));
        assertThrows(ProjectNotFoundException.class, () -> service.adminProject(44L));
        assertThrows(ProjectNotFoundException.class, () -> service.update(44L, new ProjectUpdateRequest("A", "B", null, null)));
        assertThrows(ProjectNotFoundException.class, () -> service.delete(44L));
        assertThrows(ProjectNotFoundException.class, () -> service.image(44L));
        assertThrows(ProjectNotFoundException.class, () -> service.video(44L));
    }

    @Test void deleteCleansBothMediaOnlyAfterCommitAndWorksWithoutSynchronization() {
        Project p = project("A"); p.setBackgroundImagePath("a.jpg"); p.setDemoVideoPath("b.mp4");
        when(repository.findById(1L)).thenReturn(Optional.of(p));
        TransactionSynchronizationManager.initSynchronization();
        service.delete(1L);
        verify(storage, never()).deleteImage(any());
        TransactionSynchronizationManager.getSynchronizations().getFirst().afterCompletion(TransactionSynchronization.STATUS_COMMITTED);
        verify(storage).deleteImage("a.jpg"); verify(storage).deleteVideo("b.mp4");
        TransactionSynchronizationManager.clearSynchronization();
        service.delete(1L);
        verify(storage, times(2)).deleteImage("a.jpg");
    }

    @Test void imageUploadReplacementCommitRollbackAndPersistenceFailure() {
        Project p = project("A"); p.setBackgroundImagePath("old.jpg");
        when(repository.findById(1L)).thenReturn(Optional.of(p));
        when(storage.storeImage(any())).thenReturn(new StoredProjectMedia("fresh.png", "image/png"));
        when(repository.saveAndFlush(p)).thenReturn(p);
        TransactionSynchronizationManager.initSynchronization();
        var response = service.uploadImage(1L, file());
        assertEquals("/api/projects/1/image", response.mediaUrl()); assertEquals("image/png", response.contentType());
        assertEquals("fresh.png", p.getBackgroundImagePath());
        verify(storage, never()).deleteImage("old.jpg");
        TransactionSynchronizationManager.getSynchronizations().getFirst().afterCompletion(TransactionSynchronization.STATUS_COMMITTED);
        verify(storage).deleteImage("old.jpg");
        TransactionSynchronizationManager.clearSynchronization();
        p.setBackgroundImagePath("old.jpg"); TransactionSynchronizationManager.initSynchronization();
        service.uploadImage(1L, file());
        TransactionSynchronizationManager.getSynchronizations().getFirst().afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
        verify(storage).deleteImage("fresh.png");
        TransactionSynchronizationManager.clearSynchronization();
        p.setBackgroundImagePath("old.jpg"); doThrow(new IllegalStateException("db")).when(repository).saveAndFlush(p);
        assertThrows(IllegalStateException.class, () -> service.uploadImage(1L, file()));
        assertEquals("old.jpg", p.getBackgroundImagePath()); verify(storage, times(2)).deleteImage("fresh.png");
    }

    @Test void imageDeletionIsIdempotentAndRestoresOnPersistenceFailure() {
        Project p = project("A"); when(repository.findById(1L)).thenReturn(Optional.of(p));
        service.deleteImage(1L); verify(repository, never()).saveAndFlush(p);
        p.setBackgroundImagePath("old.jpg"); TransactionSynchronizationManager.initSynchronization();
        service.deleteImage(1L); assertNull(p.getBackgroundImagePath());
        verify(storage, never()).deleteImage(any());
        TransactionSynchronizationManager.getSynchronizations().getFirst().afterCompletion(TransactionSynchronization.STATUS_COMMITTED);
        verify(storage).deleteImage("old.jpg");
        TransactionSynchronizationManager.clearSynchronization(); p.setBackgroundImagePath("old.jpg");
        doThrow(new IllegalStateException()).when(repository).saveAndFlush(p);
        assertThrows(IllegalStateException.class, () -> service.deleteImage(1L));
        assertEquals("old.jpg", p.getBackgroundImagePath());
    }

    @Test void videoUploadAndDeleteUseSameTransactionalCleanupRules() {
        Project p = project("A"); p.setDemoVideoPath("old.webm"); when(repository.findById(1L)).thenReturn(Optional.of(p));
        when(storage.storeVideo(any())).thenReturn(new StoredProjectMedia("new.mp4", "video/mp4"));
        when(repository.saveAndFlush(p)).thenReturn(p); TransactionSynchronizationManager.initSynchronization();
        var response = service.uploadVideo(1L, file()); assertEquals("video/mp4", response.contentType());
        TransactionSynchronizationManager.getSynchronizations().getFirst().afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
        verify(storage).deleteVideo("new.mp4");
        TransactionSynchronizationManager.clearSynchronization();
        p.setDemoVideoPath("old.webm"); TransactionSynchronizationManager.initSynchronization();
        service.deleteVideo(1L);
        TransactionSynchronizationManager.getSynchronizations().getFirst().afterCompletion(TransactionSynchronization.STATUS_COMMITTED);
        verify(storage).deleteVideo("old.webm");
        TransactionSynchronizationManager.clearSynchronization(); p.setDemoVideoPath("old.webm");
        doThrow(new IllegalStateException()).when(repository).saveAndFlush(p);
        assertThrows(IllegalStateException.class, () -> service.uploadVideo(1L, file()));
        assertEquals("old.webm", p.getDemoVideoPath()); verify(storage, times(2)).deleteVideo("new.mp4");
    }

    @Test void mediaRetrievalReturnsResourcesAndMapsMissingAndIoFailures() throws Exception {
        Project p = project("A"); p.setBackgroundImagePath("picture.png"); p.setDemoVideoPath("movie.webm");
        when(repository.findById(1L)).thenReturn(Optional.of(p));
        var image = new ByteArrayResource(new byte[]{1}); var video = new ByteArrayResource(new byte[]{2});
        when(storage.readImage("picture.png")).thenReturn(image); when(storage.readVideo("movie.webm")).thenReturn(video);
        assertSame(image, service.image(1L).resource()); assertEquals("image/png", service.image(1L).contentType());
        assertSame(video, service.video(1L).resource()); assertEquals("video/webm", service.video(1L).contentType());
        p.setBackgroundImagePath(null); p.setDemoVideoPath(null);
        assertThrows(ProjectMediaNotFoundException.class, () -> service.image(1L));
        assertThrows(ProjectMediaNotFoundException.class, () -> service.video(1L));
        p.setBackgroundImagePath("bad.gif"); assertThrows(ProjectMediaStorageException.class, () -> service.image(1L));
        p.setDemoVideoPath("bad.avi"); assertThrows(ProjectMediaStorageException.class, () -> service.video(1L));
        p.setBackgroundImagePath("picture.png"); p.setDemoVideoPath("movie.mp4");
        when(storage.readImage("picture.png")).thenThrow(new NoSuchFileException("missing"));
        when(storage.readVideo("movie.mp4")).thenThrow(new IOException("disk"));
        assertThrows(ProjectMediaNotFoundException.class, () -> service.image(1L));
        assertThrows(ProjectMediaStorageException.class, () -> service.video(1L));
    }

    private static Project project(String title) { return new Project(title, "Description", null, null); }
    private static MockMultipartFile file() { return new MockMultipartFile("file", "upload", "application/octet-stream", new byte[]{1}); }
}
