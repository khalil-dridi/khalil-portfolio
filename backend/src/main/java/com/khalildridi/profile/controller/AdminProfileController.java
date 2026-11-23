package com.khalildridi.profile.controller;

import com.khalildridi.profile.dto.*;
import com.khalildridi.profile.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/profile")
public class AdminProfileController {
    private final ProfileService service;
    public AdminProfileController(ProfileService service) { this.service=service; }
    @GetMapping public AdminProfileResponse profile() { return service.adminProfile(); }
    @PutMapping public AdminProfileResponse update(@Valid @RequestBody ProfileUpdateRequest request) { return service.update(request); }
    @PostMapping(value="/image", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.OK)
    public ProfileImageResponse upload(@RequestPart("file") MultipartFile file) { return service.upload(file); }
    @DeleteMapping("/image") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete() { service.deleteImage(); }
}
