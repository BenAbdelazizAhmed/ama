package com.example.amanafarm_backend.exception;

public class UnauthorizedAuthException extends RuntimeException {

    public UnauthorizedAuthException(String message) {
        super(message);
    }
}
