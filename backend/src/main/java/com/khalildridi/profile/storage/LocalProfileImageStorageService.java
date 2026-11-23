package com.khalildridi.profile.storage;

import com.khalildridi.profile.exception.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.*;
import java.util.UUID;

@Service
public class LocalProfileImageStorageService implements ProfileImageStorageService {
    private static final long MAX_SIZE = 5L * 1024 * 1024;
    private final Path root;
    public LocalProfileImageStorageService(@Value("${app.profile.image-storage-dir:./var/profile-images}") String directory) {
        root = Path.of(directory).toAbsolutePath().normalize();
    }
    @Override public StoredImage store(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new InvalidImageException("Image file is empty");
        if (file.getSize() > MAX_SIZE) throw new ImageTooLargeException();
        try {
            byte[] data = file.getBytes();
            String type = detect(data);
            String ext = switch(type) { case "image/jpeg" -> ".jpg"; case "image/png" -> ".png"; default -> ".webp"; };
            Files.createDirectories(root);
            String key = UUID.randomUUID() + ext;
            Path target = resolve(key);
            Files.write(target, data, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);
            return new StoredImage(key, type);
        } catch (InvalidImageException e) { throw e; }
        catch (IOException e) { throw new ImageStorageException("Unable to store profile image", e); }
    }
    private String detect(byte[] b) {
        if (b.length >= 4 && (b[0]&255)==0xff && (b[1]&255)==0xd8 && (b[2]&255)==0xff) {
            if (decode(b)) return "image/jpeg";
            throw new InvalidImageException("Invalid image content");
        }
        if (b.length >= 8 && b[0]==(byte)0x89 && b[1]=='P' && b[2]=='N' && b[3]=='G' && decode(b)) return "image/png";
        if (b.length >= 12 && b[0]=='R' && b[1]=='I' && b[2]=='F' && b[3]=='F' && b[8]=='W' && b[9]=='E' && b[10]=='B' && b[11]=='P' && webp(b)) return "image/webp";
        if (b.length >= 4 && ((b[0]&255)==0xff || (b[0]&255)==0x89 || b[0]=='R')) throw new InvalidImageException("Invalid image content");
        throw new UnsupportedImageFormatException();
    }
    private boolean decode(byte[] b) { try { BufferedImage image=ImageIO.read(new ByteArrayInputStream(b)); return image != null && image.getWidth()>0 && image.getHeight()>0; } catch(IOException e) { return false; } }
    private boolean webp(byte[] b) { long declared=Integer.toUnsignedLong((b[4]&255)|((b[5]&255)<<8)|((b[6]&255)<<16)|((b[7]&255)<<24)); return declared >= 12 && declared <= b.length-8 && (new String(b,12,4).matches("VP8 |VP8L|VP8X")); }
    private Path resolve(String key) {
        if (key == null || !key.matches("[a-f0-9-]{36}\\.(jpg|png|webp)")) throw new InvalidImageException("Invalid image key");
        Path path=root.resolve(key).normalize();
        if (!path.getParent().equals(root)) throw new InvalidImageException("Invalid image key");
        return path;
    }
    @Override public byte[] read(String key) throws IOException { return Files.readAllBytes(resolve(key)); }
    @Override public void delete(String key) {
        if (key == null) return;
        try { Files.deleteIfExists(resolve(key)); }
        catch (IOException e) { throw new ImageStorageException("Unable to delete profile image", e); }
    }
}
