package com.khalildridi.career.controller;

import com.khalildridi.auth.dto.ApiErrorResponse;
import com.khalildridi.career.exception.EducationNotFoundException;
import com.khalildridi.career.exception.ExperienceNotFoundException;
import com.khalildridi.career.exception.SkillNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.http.converter.HttpMessageNotReadableException;
import java.time.Instant;

@RestControllerAdvice(basePackages = "com.khalildridi.career")
public class CareerExceptionHandler {
    @ExceptionHandler({SkillNotFoundException.class, ExperienceNotFoundException.class, EducationNotFoundException.class})
    public ResponseEntity<ApiErrorResponse> notFound(HttpServletRequest request){return error(HttpStatus.NOT_FOUND,"Career item not found",request);}
    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class, IllegalArgumentException.class})
    public ResponseEntity<ApiErrorResponse> invalid(HttpServletRequest request){return error(HttpStatus.BAD_REQUEST,"Invalid career data",request);}
    private ResponseEntity<ApiErrorResponse> error(HttpStatus status,String message,HttpServletRequest request){return ResponseEntity.status(status).body(new ApiErrorResponse(Instant.now(),status.value(),status.getReasonPhrase(),message,request.getRequestURI()));}
}
