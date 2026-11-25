package com.khalildridi.career.exception;

public class CareerNotFoundException extends RuntimeException {
    public CareerNotFoundException(String type, Long id) { super(type + " not found: " + id); }
}
