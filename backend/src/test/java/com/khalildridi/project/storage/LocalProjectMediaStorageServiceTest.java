package com.khalildridi.project.storage;

import com.khalildridi.project.exception.InvalidProjectMediaException;
import com.khalildridi.project.exception.ProjectMediaTooLargeException;
import com.khalildridi.project.exception.ProjectMediaStorageException;
import com.khalildridi.project.exception.UnsupportedProjectMediaFormatException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.file.Files;
import java.nio.file.Path;
import java.io.FileNotFoundException;

import static org.junit.jupiter.api.Assertions.*;

class LocalProjectMediaStorageServiceTest {
    @TempDir Path temp;

    @Test
    void detectsImageFromContentUsesUuidAndDeletesIt() throws Exception {
        LocalProjectMediaStorageService storage = storage(4096, 4096);
        byte[] png = png();
        StoredProjectMedia saved = storage.storeImage(new MockMultipartFile(
                "file", "../../misleading.exe", "text/plain", png));

        assertEquals("image/png", saved.contentType());
        assertTrue(saved.key().matches("[a-f0-9-]{36}\\.png"));
        assertArrayEquals(png, storage.readImage(saved.key()).getContentAsByteArray());
        assertThrows(InvalidProjectMediaException.class, () -> storage.readImage("../../secret.jpg"));
        storage.deleteImage(saved.key());
        assertFalse(Files.exists(temp.resolve("images").resolve(saved.key())));
    }

    @Test
    void acceptsWebpAndRejectsOversizedImage() {
        LocalProjectMediaStorageService storage = storage(32, 4096);
        byte[] webp = new byte[]{'R','I','F','F', 17,0,0,0, 'W','E','B','P',
                'V','P','8','L', 5,0,0,0, 0,0,0,0,0};
        assertEquals("image/webp", storage.storeImage(new MockMultipartFile("file", "x", "", webp)).contentType());
        assertThrows(ProjectMediaTooLargeException.class, () -> storage.storeImage(
                new MockMultipartFile("file", "large.png", "image/png", new byte[33])));
    }

    @Test
    void recognizesJpegAndRejectsSpoofedOrEmptyImage() throws Exception {
        LocalProjectMediaStorageService storage = storage(4096, 4096);
        StoredProjectMedia jpeg = storage.storeImage(new MockMultipartFile("file", "x.png", "image/png", jpeg()));
        assertEquals("image/jpeg", jpeg.contentType());
        assertThrows(UnsupportedProjectMediaFormatException.class,
                () -> storage.storeImage(new MockMultipartFile("file", "x.jpg", "image/jpeg", new byte[]{1, 2, 3})));
        assertThrows(InvalidProjectMediaException.class,
                () -> storage.storeImage(new MockMultipartFile("file", "x.jpg", "image/jpeg", new byte[0])));
    }

    @Test
    void checksActualSizeWhileStreamingAndValidatesVideoSignatures() {
        LocalProjectMediaStorageService storage = storage(4096, 8);
        assertThrows(ProjectMediaTooLargeException.class, () -> storage.storeVideo(
                new MockMultipartFile("file", "video.mp4", "video/mp4", new byte[9])));
        assertThrows(UnsupportedProjectMediaFormatException.class, () -> storage.storeVideo(
                new MockMultipartFile("file", "video.mp4", "video/mp4", new byte[]{1, 2, 3, 4})));
    }

    @Test
    void acceptsMp4FromContainerHeaderAndStoresOutsideFilename() {
        LocalProjectMediaStorageService storage = storage(4096, 4096);
        byte[] mp4 = ByteBuffer.allocate(25).order(ByteOrder.BIG_ENDIAN)
                .putInt(16).put("ftyp".getBytes()).put("isom".getBytes()).putInt(0)
                .putInt(9).put("mdat".getBytes()).put((byte) 1).array();
        StoredProjectMedia result = storage.storeVideo(new MockMultipartFile(
                "file", "../../movie.webm", "application/octet-stream", mp4));
        assertEquals("video/mp4", result.contentType());
        assertTrue(result.key().matches("[a-f0-9-]{36}\\.mp4"));

        byte[] webm = new byte[]{0x1a,0x45,(byte)0xdf,(byte)0xa3, 0x42,(byte)0x82,(byte)0x84,'w','e','b','m'};
        assertEquals("video/webm", storage.storeVideo(new MockMultipartFile(
                "file", "not-a-video.bin", "text/plain", webm)).contentType());
    }

    @Test
    void rejectsNullAndMalformedImagePayloadsAndCleansTemporaryFiles() throws Exception {
        LocalProjectMediaStorageService storage = storage(4096, 4096);
        assertThrows(InvalidProjectMediaException.class, () -> storage.storeImage(null));
        assertThrows(InvalidProjectMediaException.class, () -> storage.storeVideo(
                new MockMultipartFile("file", "empty", "video/mp4", new byte[0])));
        assertThrows(InvalidProjectMediaException.class, () -> storage.storeImage(new MockMultipartFile(
                "file", "spoof.jpg", "image/jpeg", new byte[]{(byte) 0xff, (byte) 0xd8, (byte) 0xff, 1})));
        assertThrows(InvalidProjectMediaException.class, () -> storage.storeImage(new MockMultipartFile(
                "file", "spoof.jpg", "image/jpeg", new byte[]{(byte) 0xff, (byte) 0xd8, (byte) 0x89, 'R'})));
        assertTrue(Files.notExists(temp.resolve("images")) || Files.list(temp.resolve("images")).findAny().isEmpty());
    }

    @Test
    void validatesVideoContainerAndHandlesReadDeleteAndTraversalSafely() throws Exception {
        LocalProjectMediaStorageService storage = storage(4096, 4096);
        byte[] badMp4 = ByteBuffer.allocate(16).order(ByteOrder.BIG_ENDIAN)
                .putInt(16).put("ftyp".getBytes()).put("isom".getBytes()).array();
        assertThrows(InvalidProjectMediaException.class, () -> storage.storeVideo(new MockMultipartFile(
                "file", "broken.mp4", "video/mp4", badMp4)));
        assertThrows(InvalidProjectMediaException.class, () -> storage.readImage("../outside.png"));
        assertThrows(InvalidProjectMediaException.class, () -> storage.readVideo("../outside.mp4"));
        assertThrows(InvalidProjectMediaException.class, () -> storage.readImage("not-a-key.png"));
        assertThrows(FileNotFoundException.class, () -> storage.readImage("00000000-0000-0000-0000-000000000000.png"));
        storage.deleteImage("00000000-0000-0000-0000-000000000000.png");
        storage.deleteImage(null);
        assertThrows(InvalidProjectMediaException.class, () -> storage.deleteVideo("../../important.mp4"));
    }

    @Test
    void storageRootThatIsAFileIsReportedAsStorageFailure() throws Exception {
        Path fileRoot = temp.resolve("not-a-directory");
        Files.writeString(fileRoot, "file");
        LocalProjectMediaStorageService storage = new LocalProjectMediaStorageService(fileRoot, temp.resolve("videos"), 4096, 4096);
        assertThrows(ProjectMediaStorageException.class, () -> storage.storeImage(new MockMultipartFile(
                "file", "valid.png", "image/png", png())));
    }

    @Test
    void readsAndDeletesVideoAndRejectsMalformedWebpChunks() throws Exception {
        LocalProjectMediaStorageService storage = storage(4096, 4096);
        byte[] webm = new byte[]{0x1a,0x45,(byte)0xdf,(byte)0xa3, 0x42,(byte)0x82,(byte)0x84,'w','e','b','m'};
        StoredProjectMedia stored = storage.storeVideo(new MockMultipartFile("file", "clip.webm", "", webm));
        assertArrayEquals(webm, storage.readVideo(stored.key()).getContentAsByteArray());
        storage.deleteVideo(stored.key());
        storage.deleteVideo(stored.key());
        assertFalse(Files.exists(temp.resolve("videos").resolve(stored.key())));

        byte[] unknownChunk = new byte[]{'R','I','F','F', 17,0,0,0, 'W','E','B','P',
                'N','O','P','E', 5,0,0,0, 0,0,0,0,0};
        assertThrows(UnsupportedProjectMediaFormatException.class, () -> storage.storeImage(
                new MockMultipartFile("file", "fake.webp", "image/webp", unknownChunk)));
        byte[] inconsistentRiff = new byte[]{'R','I','F','F', 99,0,0,0, 'W','E','B','P',
                'V','P','8','L', 5,0,0,0, 0,0,0,0,0};
        assertThrows(UnsupportedProjectMediaFormatException.class, () -> storage.storeImage(
                new MockMultipartFile("file", "fake.webp", "image/webp", inconsistentRiff)));
    }

    private LocalProjectMediaStorageService storage(long imageMax, long videoMax) {
        return new LocalProjectMediaStorageService(temp.resolve("images"), temp.resolve("videos"), imageMax, videoMax);
    }

    private byte[] png() throws Exception {
        BufferedImage image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        ImageIO.write(image, "png", bytes);
        return bytes.toByteArray();
    }

    private byte[] jpeg() throws Exception {
        BufferedImage image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        ImageIO.write(image, "jpeg", bytes);
        return bytes.toByteArray();
    }
}
