package com.khalildridi.profile.exception;
public class UnsupportedImageFormatException extends InvalidImageException { public UnsupportedImageFormatException() { super("Only JPG, PNG and WebP images are supported"); } }
