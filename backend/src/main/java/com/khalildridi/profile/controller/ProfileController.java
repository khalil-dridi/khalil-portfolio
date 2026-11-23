package com.khalildridi.profile.controller;

import com.khalildridi.profile.dto.PublicProfileResponse;
import com.khalildridi.profile.service.ProfileService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final ProfileService service;
    public ProfileController(ProfileService service) { this.service=service; }
    @GetMapping public PublicProfileResponse profile() { return service.publicProfile(); }
    @GetMapping("/image") public ResponseEntity<byte[]> image() {
        var image=service.image();
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(image.contentType()))
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofHours(1)).cachePublic())
                .header("X-Content-Type-Options","nosniff").body(image.bytes());
    }
}
