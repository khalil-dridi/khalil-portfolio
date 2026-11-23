package com.khalildridi.project.controller;

import com.khalildridi.auth.dto.ApiErrorResponse;
import com.khalildridi.project.exception.InvalidProjectMediaException;
import com.khalildridi.project.exception.ProjectMediaNotFoundException;
import com.khalildridi.project.exception.ProjectMediaStorageException;
import com.khalildridi.project.exception.ProjectMediaTooLargeException;
import com.khalildridi.project.exception.ProjectNotFoundException;
import com.khalildridi.project.exception.UnsupportedProjectMediaFormatException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.Instant;

@RestControllerAdvice(basePackages = "com.khalildridi.project")
public class ProjectExceptionHandler {
    @ExceptionHandler(ProjectNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> projectNotFound(HttpServletRequest request) {
        return error(HttpStatus.NOT_FOUND, "Project not found", request);
    }

    @ExceptionHandler(ProjectMediaNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> mediaNotFound(HttpServletRequest request) {
        return error(HttpStatus.NOT_FOUND, "Project media not found", request);
    }

    @ExceptionHandler({InvalidProjectMediaException.class, MethodArgumentNotValidException.class})
    public ResponseEntity<ApiErrorResponse> invalidRequest(HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST, "Invalid project data or media", request);
    }

    @ExceptionHandler({ProjectMediaTooLargeException.class, MaxUploadSizeExceededException.class})
    public ResponseEntity<ApiErrorResponse> mediaTooLarge(HttpServletRequest request) {
        return error(HttpStatus.PAYLOAD_TOO_LARGE, "Project media exceeds the configured size limit", request);
    }

    @ExceptionHandler(UnsupportedProjectMediaFormatException.class)
    public ResponseEntity<ApiErrorResponse> unsupportedMedia(HttpServletRequest request) {
        return error(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Unsupported project media format", request);
    }

    @ExceptionHandler(ProjectMediaStorageException.class)
    public ResponseEntity<ApiErrorResponse> storageFailure(HttpServletRequest request) {
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Project media storage failed", request);
    }

    private ResponseEntity<ApiErrorResponse> error(HttpStatus status, String message, HttpServletRequest request) {
        return ResponseEntity.status(status).body(new ApiErrorResponse(Instant.now(), status.value(),
                status.getReasonPhrase(), message, request.getRequestURI()));
    }
}
