package com.khalildridi.project.service;

import com.khalildridi.project.dto.AdminProjectResponse;
import com.khalildridi.project.dto.ProjectCreateRequest;
import com.khalildridi.project.dto.ProjectMediaResponse;
import com.khalildridi.project.dto.ProjectUpdateRequest;
import com.khalildridi.project.dto.PublicProjectResponse;
import com.khalildridi.project.entity.Project;
import com.khalildridi.project.exception.ProjectMediaNotFoundException;
import com.khalildridi.project.exception.ProjectMediaStorageException;
import com.khalildridi.project.exception.ProjectNotFoundException;
import com.khalildridi.project.mapper.ProjectMapper;
import com.khalildridi.project.repository.ProjectRepository;
import com.khalildridi.project.storage.ProjectMediaStorageService;
import com.khalildridi.project.storage.StoredProjectMedia;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.NoSuchFileException;
import java.util.List;

@Service
public class ProjectService {
    private static final Logger LOGGER = LoggerFactory.getLogger(ProjectService.class);

    private final ProjectRepository repository;
    private final ProjectMapper mapper;
    private final ProjectMediaStorageService storage;

    public ProjectService(ProjectRepository repository, ProjectMapper mapper, ProjectMediaStorageService storage) {
        this.repository = repository;
        this.mapper = mapper;
        this.storage = storage;
    }

    @Transactional(readOnly = true)
    public List<PublicProjectResponse> publicProjects() {
        return repository.findAllByOrderByCreatedAtDesc().stream().map(mapper::toPublic).toList();
    }

    @Transactional(readOnly = true)
    public PublicProjectResponse publicProject(Long id) {
        return mapper.toPublic(project(id));
    }

    @Transactional(readOnly = true)
    public List<AdminProjectResponse> adminProjects() {
        return repository.findAllByOrderByCreatedAtDesc().stream().map(mapper::toAdmin).toList();
    }

    @Transactional(readOnly = true)
    public AdminProjectResponse adminProject(Long id) {
        return mapper.toAdmin(project(id));
    }

    @Transactional
    public AdminProjectResponse create(ProjectCreateRequest request) {
        return mapper.toAdmin(repository.save(mapper.toEntity(request)));
    }

    @Transactional
    public AdminProjectResponse update(Long id, ProjectUpdateRequest request) {
        Project project = project(id);
        mapper.update(project, request);
        return mapper.toAdmin(repository.save(project));
    }

    @Transactional
    public void delete(Long id) {
        Project project = project(id);
        String imageKey = project.getBackgroundImagePath();
        String videoKey = project.getDemoVideoPath();
        repository.delete(project);
        afterCompletion(() -> {
            deleteImageQuietly(imageKey);
            deleteVideoQuietly(videoKey);
        }, null);
    }

    @Transactional
    public ProjectMediaResponse uploadImage(Long id, MultipartFile file) {
        Project project = project(id);
        StoredProjectMedia fresh = storage.storeImage(file);
        String oldKey = project.getBackgroundImagePath();
        project.setBackgroundImagePath(fresh.key());
        try {
            repository.saveAndFlush(project);
        } catch (RuntimeException e) {
            project.setBackgroundImagePath(oldKey);
            deleteImageQuietly(fresh.key());
            throw e;
        }
        afterCompletion(() -> deleteImageQuietly(oldKey), () -> deleteImageQuietly(fresh.key()));
        return new ProjectMediaResponse("/api/projects/" + id + "/image", fresh.contentType());
    }

    @Transactional
    public void deleteImage(Long id) {
        Project project = project(id);
        String oldKey = project.getBackgroundImagePath();
        if (oldKey == null) return;
        project.setBackgroundImagePath(null);
        try {
            repository.saveAndFlush(project);
        } catch (RuntimeException e) {
            project.setBackgroundImagePath(oldKey);
            throw e;
        }
        afterCompletion(() -> deleteImageQuietly(oldKey), null);
    }

    @Transactional(readOnly = true)
    public MediaContent image(Long id) {
        Project project = project(id);
        String key = project.getBackgroundImagePath();
        if (key == null) throw new ProjectMediaNotFoundException();
        try {
            return new MediaContent(storage.readImage(key), imageContentType(key));
        } catch (FileNotFoundException | NoSuchFileException e) {
            throw new ProjectMediaNotFoundException();
        } catch (IOException e) {
            throw new ProjectMediaStorageException("Unable to read project image", e);
        }
    }

    @Transactional
    public ProjectMediaResponse uploadVideo(Long id, MultipartFile file) {
        Project project = project(id);
        StoredProjectMedia fresh = storage.storeVideo(file);
        String oldKey = project.getDemoVideoPath();
        project.setDemoVideoPath(fresh.key());
        try {
            repository.saveAndFlush(project);
        } catch (RuntimeException e) {
            project.setDemoVideoPath(oldKey);
            deleteVideoQuietly(fresh.key());
            throw e;
        }
        afterCompletion(() -> deleteVideoQuietly(oldKey), () -> deleteVideoQuietly(fresh.key()));
        return new ProjectMediaResponse("/api/projects/" + id + "/video", fresh.contentType());
    }

    @Transactional
    public void deleteVideo(Long id) {
        Project project = project(id);
        String oldKey = project.getDemoVideoPath();
        if (oldKey == null) return;
        project.setDemoVideoPath(null);
        try {
            repository.saveAndFlush(project);
        } catch (RuntimeException e) {
            project.setDemoVideoPath(oldKey);
            throw e;
        }
        afterCompletion(() -> deleteVideoQuietly(oldKey), null);
    }

    @Transactional(readOnly = true)
    public MediaContent video(Long id) {
        Project project = project(id);
        String key = project.getDemoVideoPath();
        if (key == null) throw new ProjectMediaNotFoundException();
        try {
            return new MediaContent(storage.readVideo(key), videoContentType(key));
        } catch (FileNotFoundException | NoSuchFileException e) {
            throw new ProjectMediaNotFoundException();
        } catch (IOException e) {
            throw new ProjectMediaStorageException("Unable to read project video", e);
        }
    }

    private Project project(Long id) {
        return repository.findById(id).orElseThrow(() -> new ProjectNotFoundException(id));
    }

    private String imageContentType(String key) {
        if (key.endsWith(".jpg")) return "image/jpeg";
        if (key.endsWith(".png")) return "image/png";
        if (key.endsWith(".webp")) return "image/webp";
        throw new ProjectMediaStorageException("Invalid project image type", null);
    }

    private String videoContentType(String key) {
        if (key.endsWith(".mp4")) return "video/mp4";
        if (key.endsWith(".webm")) return "video/webm";
        throw new ProjectMediaStorageException("Invalid project video type", null);
    }

    private void afterCompletion(Runnable committed, Runnable rolledBack) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            runQuietly(committed);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_COMMITTED) runQuietly(committed);
                else if (rolledBack != null) runQuietly(rolledBack);
            }
        });
    }

    private void runQuietly(Runnable operation) {
        try {
            operation.run();
        } catch (RuntimeException e) {
            LOGGER.warn("Project media cleanup failed after a database operation");
        }
    }

    private void deleteImageQuietly(String key) {
        if (key != null) storage.deleteImage(key);
    }

    private void deleteVideoQuietly(String key) {
        if (key != null) storage.deleteVideo(key);
    }

    public record MediaContent(Resource resource, String contentType) {
    }
}
