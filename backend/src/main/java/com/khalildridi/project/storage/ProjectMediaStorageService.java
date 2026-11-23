package com.khalildridi.project.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface ProjectMediaStorageService {
    StoredProjectMedia storeImage(MultipartFile file);

    StoredProjectMedia storeVideo(MultipartFile file);

    Resource readImage(String key) throws IOException;

    Resource readVideo(String key) throws IOException;

    void deleteImage(String key);

    void deleteVideo(String key);
}
