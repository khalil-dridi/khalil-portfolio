package com.khalildridi.profile.storage;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

public interface ProfileImageStorageService {
    StoredImage store(MultipartFile file);
    byte[] read(String key) throws IOException;
    void delete(String key);
}
