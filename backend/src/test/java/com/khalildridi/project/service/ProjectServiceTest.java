package com.khalildridi.project.service;

import com.khalildridi.project.dto.ProjectCreateRequest;
import com.khalildridi.project.entity.Project;
import com.khalildridi.project.exception.ProjectNotFoundException;
import com.khalildridi.project.mapper.ProjectMapper;
import com.khalildridi.project.repository.ProjectRepository;
import com.khalildridi.project.storage.ProjectMediaStorageService;
import com.khalildridi.project.storage.StoredProjectMedia;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ProjectServiceTest {
    private final ProjectRepository repository = mock(ProjectRepository.class);
    private final ProjectMediaStorageService storage = mock(ProjectMediaStorageService.class);
    private final ProjectService service = new ProjectService(repository, new ProjectMapper(), storage);

    @AfterEach void clearSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
        TransactionSynchronizationManager.clear();
    }

    @Test void createsAndMapsProjectWithoutFilesystemPaths() {
        when(repository.save(any(Project.class))).thenAnswer(call -> call.getArgument(0));
        var response = service.create(new ProjectCreateRequest(" App ", " Desc ", " Java ", " "));
        assertEquals("App", response.title());
        assertNull(response.githubUrl());
        assertNull(response.backgroundImageUrl());
    }

    @Test void missingProjectIsReported() {
        when(repository.findById(44L)).thenReturn(Optional.empty());
        assertThrows(ProjectNotFoundException.class, () -> service.publicProject(44L));
    }

    @Test void replacementDeletesOldFileOnlyAfterCommitAndNewFileOnRollback() {
        Project project = new Project("App", "Desc", null, null);
        project.setBackgroundImagePath("old.jpg");
        when(repository.findById(1L)).thenReturn(Optional.of(project));
        when(storage.storeImage(any())).thenReturn(new StoredProjectMedia("fresh.png", "image/png"));
        when(repository.saveAndFlush(project)).thenReturn(project);
        TransactionSynchronizationManager.initSynchronization();

        service.uploadImage(1L, new MockMultipartFile("file", "x", "image/png", new byte[]{1}));
        verify(storage, never()).deleteImage(any());
        TransactionSynchronization synchronization = TransactionSynchronizationManager.getSynchronizations().getFirst();
        synchronization.afterCompletion(TransactionSynchronization.STATUS_COMMITTED);
        verify(storage).deleteImage("old.jpg");

        TransactionSynchronizationManager.clearSynchronization();
        TransactionSynchronizationManager.initSynchronization();
        project.setBackgroundImagePath("old.jpg");
        service.uploadImage(1L, new MockMultipartFile("file", "x", "image/png", new byte[]{1}));
        TransactionSynchronizationManager.getSynchronizations().getFirst()
                .afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
        verify(storage).deleteImage("fresh.png");
    }
}
