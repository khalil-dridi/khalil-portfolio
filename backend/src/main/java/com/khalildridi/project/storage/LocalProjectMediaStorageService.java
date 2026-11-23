package com.khalildridi.project.storage;

import com.khalildridi.project.exception.InvalidProjectMediaException;
import com.khalildridi.project.exception.ProjectMediaStorageException;
import com.khalildridi.project.exception.ProjectMediaTooLargeException;
import com.khalildridi.project.exception.UnsupportedProjectMediaFormatException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.channels.FileChannel;
import java.nio.file.StandardOpenOption;
import java.util.Arrays;
import java.util.Locale;
import java.util.UUID;

@Service
public class LocalProjectMediaStorageService implements ProjectMediaStorageService {
    private static final int BUFFER_SIZE = 8192;
    private static final long MAX_IMAGE_PIXELS = 25_000_000L;
    private static final byte[] WEBM_DOCTYPE = {0x42, (byte) 0x82, (byte) 0x84, 'w', 'e', 'b', 'm'};

    private final Path imageRoot;
    private final Path videoRoot;
    private final long maxImageSize;
    private final long maxVideoSize;

    @Autowired
    public LocalProjectMediaStorageService(
            @Value("${app.project.storage.image-dir:./var/project-media/images}") String imageDirectory,
            @Value("${app.project.storage.video-dir:./var/project-media/videos}") String videoDirectory,
            @Value("${app.project.media.image-max-size:5242880}") long maxImageSize,
            @Value("${app.project.media.video-max-size:104857600}") long maxVideoSize
    ) {
        this(Path.of(imageDirectory), Path.of(videoDirectory), maxImageSize, maxVideoSize);
    }

    public LocalProjectMediaStorageService(Path imageDirectory, Path videoDirectory,
                                           long maxImageSize, long maxVideoSize) {
        this.imageRoot = imageDirectory.toAbsolutePath().normalize();
        this.videoRoot = videoDirectory.toAbsolutePath().normalize();
        this.maxImageSize = maxImageSize;
        this.maxVideoSize = maxVideoSize;
    }

    @Override
    public StoredProjectMedia storeImage(MultipartFile file) {
        return store(file, true);
    }

    @Override
    public StoredProjectMedia storeVideo(MultipartFile file) {
        return store(file, false);
    }

    private StoredProjectMedia store(MultipartFile file, boolean image) {
        if (file == null || file.isEmpty()) {
            throw new InvalidProjectMediaException("Project media file is empty");
        }
        Path root = image ? imageRoot : videoRoot;
        long maxSize = image ? maxImageSize : maxVideoSize;
        if (file.getSize() > maxSize) {
            throw new ProjectMediaTooLargeException();
        }

        Path temporary = null;
        try {
            Files.createDirectories(root);
            temporary = Files.createTempFile(root, ".project-upload-", ".part");
            copyWithinLimit(file, temporary, maxSize);
            long actualSize = Files.size(temporary);
            String contentType = image ? detectImage(temporary, actualSize) : detectVideo(temporary, actualSize);
            String extension = extension(contentType);
            String key = UUID.randomUUID() + extension;
            Path destination = resolve(root, key, image);
            moveIntoPlace(temporary, destination);
            return new StoredProjectMedia(key, contentType);
        } catch (InvalidProjectMediaException | ProjectMediaTooLargeException
                 | UnsupportedProjectMediaFormatException e) {
            throw e;
        } catch (IOException e) {
            throw new ProjectMediaStorageException("Unable to store project media", e);
        } finally {
            if (temporary != null) {
                try {
                    Files.deleteIfExists(temporary);
                } catch (IOException ignored) {
                    // A failed temporary-file cleanup must not mask the primary failure.
                }
            }
        }
    }

    private void copyWithinLimit(MultipartFile file, Path target, long maxSize) throws IOException {
        long copied = 0;
        byte[] buffer = new byte[BUFFER_SIZE];
        try (InputStream input = file.getInputStream(); OutputStream output = Files.newOutputStream(target)) {
            int count;
            while ((count = input.read(buffer)) != -1) {
                copied += count;
                if (copied > maxSize) {
                    throw new ProjectMediaTooLargeException();
                }
                output.write(buffer, 0, count);
            }
        }
        if (copied == 0) {
            throw new InvalidProjectMediaException("Project media file is empty");
        }
    }

    private String detectImage(Path file, long size) throws IOException {
        byte[] header = readPrefix(file, 30);
        if (startsWith(header, new byte[]{(byte) 0xff, (byte) 0xd8, (byte) 0xff})) {
            if (!decodesAsImage(file)) throw new InvalidProjectMediaException("Invalid image content");
            return "image/jpeg";
        }
        if (startsWith(header, new byte[]{(byte) 0x89, 'P', 'N', 'G', 13, 10, 26, 10})) {
            if (!decodesAsImage(file)) throw new InvalidProjectMediaException("Invalid image content");
            return "image/png";
        }
        if (isWebP(header, size)) return "image/webp";
        if (startsWith(header, new byte[]{(byte) 0xff, (byte) 0xd8, (byte) 0x89, 'R'})) {
            throw new InvalidProjectMediaException("Invalid image content");
        }
        throw new UnsupportedProjectMediaFormatException();
    }

    private boolean decodesAsImage(Path file) throws IOException {
        try (ImageInputStream input = ImageIO.createImageInputStream(file.toFile())) {
            if (input == null) return false;
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) return false;
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                return width > 0 && height > 0 && (long) width * height <= MAX_IMAGE_PIXELS
                        && reader.read(0) != null;
            } finally {
                reader.dispose();
            }
        }
    }

    private boolean isWebP(byte[] header, long size) {
        if (header.length < 20 || size < 20 || !ascii(header, 0, "RIFF") || !ascii(header, 8, "WEBP")) {
            return false;
        }
        long riffSize = littleEndianUnsignedInt(header, 4);
        String chunk = new String(header, 12, 4, java.nio.charset.StandardCharsets.US_ASCII);
        long chunkSize = littleEndianUnsignedInt(header, 16);
        long minimumChunkSize = switch (chunk) {
            case "VP8 " -> 10;
            case "VP8L" -> 5;
            case "VP8X" -> 10;
            default -> Long.MAX_VALUE;
        };
        return riffSize == size - 8 && chunkSize >= minimumChunkSize
                && chunkSize <= size - 20 && chunkSize < Long.MAX_VALUE;
    }

    private String detectVideo(Path file, long size) throws IOException {
        byte[] header = readPrefix(file, (int) Math.min(size, 4096));
        if (header.length >= 8 && ascii(header, 4, "ftyp")) {
            if (isValidMp4(file, size)) return "video/mp4";
            throw new InvalidProjectMediaException("Invalid MP4 content");
        }
        if (startsWith(header, new byte[]{0x1a, 0x45, (byte) 0xdf, (byte) 0xa3})
                && contains(header, WEBM_DOCTYPE)) {
            return "video/webm";
        }
        throw new UnsupportedProjectMediaFormatException();
    }

    private boolean isValidMp4(Path file, long size) throws IOException {
        long offset = 0;
        boolean firstBoxIsFileType = false;
        boolean hasMediaData = false;
        try (FileChannel channel = FileChannel.open(file, StandardOpenOption.READ)) {
            while (offset + 8 <= size) {
                ByteBuffer boxHeader = ByteBuffer.allocate(16).order(ByteOrder.BIG_ENDIAN);
                channel.position(offset);
                int headerBytes = 0;
                while (boxHeader.hasRemaining()) {
                    int count = channel.read(boxHeader);
                    if (count < 0) break;
                    headerBytes += count;
                }
                if (headerBytes < 8) return false;
                boxHeader.flip();
                long boxLength = Integer.toUnsignedLong(boxHeader.getInt());
                byte[] boxType = new byte[4];
                boxHeader.get(boxType);
                String type = new String(boxType, java.nio.charset.StandardCharsets.US_ASCII);
                long headerLength = 8;
                if (boxLength == 1) {
                    if (headerBytes < 16) return false;
                    boxLength = boxHeader.getLong();
                    headerLength = 16;
                } else if (boxLength == 0) {
                    boxLength = size - offset;
                }
                if (boxLength < headerLength || boxLength > size - offset) return false;
                if (offset == 0) {
                    firstBoxIsFileType = type.equals("ftyp") && boxLength >= 16;
                    if (!firstBoxIsFileType) return false;
                }
                if (type.equals("mdat") && boxLength > headerLength) hasMediaData = true;
                offset += boxLength;
            }
        }
        return firstBoxIsFileType && hasMediaData && offset == size;
    }

    private byte[] readPrefix(Path path, int length) throws IOException {
        try (InputStream input = Files.newInputStream(path)) {
            return input.readNBytes(length);
        }
    }

    private boolean startsWith(byte[] bytes, byte[] prefix) {
        return bytes.length >= prefix.length && Arrays.equals(Arrays.copyOf(bytes, prefix.length), prefix);
    }

    private boolean ascii(byte[] bytes, int offset, String expected) {
        if (offset + expected.length() > bytes.length) return false;
        return new String(bytes, offset, expected.length(), java.nio.charset.StandardCharsets.US_ASCII)
                .equals(expected);
    }

    private boolean contains(byte[] bytes, byte[] value) {
        for (int offset = 0; offset <= bytes.length - value.length; offset++) {
            if (startsWith(Arrays.copyOfRange(bytes, offset, bytes.length), value)) return true;
        }
        return false;
    }

    private long littleEndianUnsignedInt(byte[] bytes, int offset) {
        return Integer.toUnsignedLong(ByteBuffer.wrap(bytes, offset, 4).order(ByteOrder.LITTLE_ENDIAN).getInt());
    }

    private String extension(String contentType) {
        return switch (contentType.toLowerCase(Locale.ROOT)) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "video/mp4" -> ".mp4";
            case "video/webm" -> ".webm";
            default -> throw new UnsupportedProjectMediaFormatException();
        };
    }

    private void moveIntoPlace(Path temporary, Path destination) throws IOException {
        try {
            Files.move(temporary, destination, StandardCopyOption.ATOMIC_MOVE);
        } catch (AtomicMoveNotSupportedException e) {
            Files.move(temporary, destination);
        }
    }

    @Override
    public Resource readImage(String key) throws IOException {
        return read(imageRoot, key, true);
    }

    @Override
    public Resource readVideo(String key) throws IOException {
        return read(videoRoot, key, false);
    }

    private Resource read(Path root, String key, boolean image) throws IOException {
        Path path = resolve(root, key, image);
        if (!Files.isRegularFile(path)) throw new FileNotFoundException("Project media not found");
        return new FileSystemResource(path);
    }

    @Override
    public void deleteImage(String key) {
        delete(imageRoot, key, true);
    }

    @Override
    public void deleteVideo(String key) {
        delete(videoRoot, key, false);
    }

    private void delete(Path root, String key, boolean image) {
        if (key == null) return;
        try {
            Files.deleteIfExists(resolve(root, key, image));
        } catch (IOException e) {
            throw new ProjectMediaStorageException("Unable to delete project media", e);
        }
    }

    private Path resolve(Path root, String key, boolean image) {
        String extensions = image ? "jpg|png|webp" : "mp4|webm";
        if (key == null || !key.matches("[a-f0-9-]{36}\\.(" + extensions + ")")) {
            throw new InvalidProjectMediaException("Invalid project media key");
        }
        Path path = root.resolve(key).normalize();
        if (!path.getParent().equals(root)) throw new InvalidProjectMediaException("Invalid project media key");
        return path;
    }
}
