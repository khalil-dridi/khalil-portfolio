package com.khalildridi.profile.controller;

import com.khalildridi.auth.dto.ApiErrorResponse;
import com.khalildridi.profile.exception.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import java.time.Instant;

@RestControllerAdvice(basePackages="com.khalildridi.profile")
public class ProfileExceptionHandler {
    @ExceptionHandler(ProfileNotFoundException.class) public ResponseEntity<ApiErrorResponse> notFound(HttpServletRequest r) { return error(HttpStatus.NOT_FOUND,"Profile or image not found",r); }
    @ExceptionHandler(InvalidProfileException.class) public ResponseEntity<ApiErrorResponse> invalidProfile(HttpServletRequest r) { return error(HttpStatus.BAD_REQUEST,"Invalid profile",r); }
    @ExceptionHandler(ImageTooLargeException.class) public ResponseEntity<ApiErrorResponse> tooLarge(HttpServletRequest r) { return error(HttpStatus.PAYLOAD_TOO_LARGE,"Image exceeds the 5 MB limit",r); }
    @ExceptionHandler(UnsupportedImageFormatException.class) public ResponseEntity<ApiErrorResponse> unsupported(HttpServletRequest r) { return error(HttpStatus.UNSUPPORTED_MEDIA_TYPE,"Unsupported image format",r); }
    @ExceptionHandler(InvalidImageException.class) public ResponseEntity<ApiErrorResponse> invalidImage(HttpServletRequest r) { return error(HttpStatus.BAD_REQUEST,"Invalid image",r); }
    @ExceptionHandler(MaxUploadSizeExceededException.class) public ResponseEntity<ApiErrorResponse> uploadTooLarge(HttpServletRequest r) { return tooLarge(r); }
    @ExceptionHandler(ImageStorageException.class) public ResponseEntity<ApiErrorResponse> storage(HttpServletRequest r) { return error(HttpStatus.INTERNAL_SERVER_ERROR,"Image storage failed",r); }
    private ResponseEntity<ApiErrorResponse> error(HttpStatus s,String m,HttpServletRequest r) { return ResponseEntity.status(s).body(new ApiErrorResponse(Instant.now(),s.value(),s.getReasonPhrase(),m,r.getRequestURI())); }
}
