package com.khalildridi.profile.storage;

import com.khalildridi.profile.exception.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Path;
import java.util.Base64;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.io.ByteArrayOutputStream;

import static org.junit.jupiter.api.Assertions.*;

class LocalProfileImageStorageServiceTest {
    @TempDir Path directory;
    private LocalProfileImageStorageService storage() { return new LocalProfileImageStorageService(directory.toString()); }
    @Test void storesAndReadsPngWithGeneratedSafeKey() throws Exception {
        byte[] png=Base64.getDecoder().decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pWQAAAAASUVORK5CYII=");
        var stored=storage().store(new MockMultipartFile("file","../../unsafe.png","text/plain",png));
        assertEquals("image/png",stored.contentType());
        assertTrue(stored.key().matches("[a-f0-9-]{36}\\.png"));
        assertArrayEquals(png,storage().read(stored.key()));
        storage().delete(stored.key());
        assertFalse(java.nio.file.Files.exists(directory.resolve(stored.key())));
    }
    @Test void rejectsEmptyAndNonImagePayloads() {
        assertThrows(InvalidImageException.class, () -> storage().store(new MockMultipartFile("file","x.png","image/png",new byte[0])));
        assertThrows(UnsupportedImageFormatException.class, () -> storage().store(new MockMultipartFile("file","x.png","image/png","not an image".getBytes())));
    }
    @Test void rejectsTraversalKeys() {
        assertThrows(InvalidImageException.class, () -> storage().read("../../secret.png"));
    }
    @Test void rejectsImagesOverFiveMegabytes() {
        byte[] oversized=new byte[5 * 1024 * 1024 + 1];
        assertThrows(ImageTooLargeException.class, () -> storage().store(new MockMultipartFile("file","large.png","image/png",oversized)));
    }
    @Test void detectsJpegFromBytesRegardlessOfExtensionAndClientMimeType() throws Exception {
        BufferedImage source=new BufferedImage(1,1,BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream out=new ByteArrayOutputStream(); ImageIO.write(source,"jpg",out);
        var stored=storage().store(new MockMultipartFile("file","not-an-image.txt","text/plain",out.toByteArray()));
        assertEquals("image/jpeg",stored.contentType()); assertTrue(stored.key().endsWith(".jpg"));
    }
    @Test void detectsWebpContentFromItsContainerSignature() {
        byte[] webp=Base64.getDecoder().decode("UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEAAUAmJaQAA3AA/v89WAAAAA==");
        var stored=storage().store(new MockMultipartFile("file","wrong.jpg","text/plain",webp));
        assertEquals("image/webp",stored.contentType()); assertTrue(stored.key().endsWith(".webp"));
    }
    @Test void rejectsTruncatedImageHeaderAsInvalidContent() {
        assertThrows(InvalidImageException.class, () -> storage().store(new MockMultipartFile("file","x.jpg","image/jpeg",new byte[]{(byte)0xff,(byte)0xd8,(byte)0xff,0})));
    }
    @Test void missingStoredFileAndFilesystemWriteFailureAreReported() throws Exception {
        var storage=storage();
        assertThrows(java.nio.file.NoSuchFileException.class, () -> storage.read("00000000-0000-0000-0000-000000000000.png"));
        Path rootFile=directory.resolve("not-a-directory"); java.nio.file.Files.writeString(rootFile,"file");
        var blocked=new LocalProfileImageStorageService(rootFile.toString());
        assertThrows(ImageStorageException.class, () -> blocked.store(new MockMultipartFile("file","x.png","image/png",Base64.getDecoder().decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pWQAAAAASUVORK5CYII="))));
    }
}
