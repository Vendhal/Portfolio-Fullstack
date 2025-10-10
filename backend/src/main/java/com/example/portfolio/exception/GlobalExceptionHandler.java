package com.example.portfolio.exception;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    @ExceptionHandler(ExpiredJwtException.class)
    public ResponseEntity<Map<String, Object>> handleExpiredJwtException(
            ExpiredJwtException ex, WebRequest request) {
        
        logger.warn("JWT token expired: {}", ex.getMessage());
        return createErrorResponse(
            HttpStatus.UNAUTHORIZED,
            "JWT token has expired",
            request.getDescription(false)
        );
    }
    
    @ExceptionHandler(MalformedJwtException.class)
    public ResponseEntity<Map<String, Object>> handleMalformedJwtException(
            MalformedJwtException ex, WebRequest request) {
        
        logger.warn("Malformed JWT token: {}", ex.getMessage());
        return createErrorResponse(
            HttpStatus.BAD_REQUEST,
            "Malformed JWT token",
            request.getDescription(false)
        );
    }
    
    @ExceptionHandler(SignatureException.class)
    public ResponseEntity<Map<String, Object>> handleSignatureException(
            SignatureException ex, WebRequest request) {
        
        logger.warn("Invalid JWT signature: {}", ex.getMessage());
        return createErrorResponse(
            HttpStatus.UNAUTHORIZED,
            "Invalid JWT signature",
            request.getDescription(false)
        );
    }
    
    @ExceptionHandler(UnsupportedJwtException.class)
    public ResponseEntity<Map<String, Object>> handleUnsupportedJwtException(
            UnsupportedJwtException ex, WebRequest request) {
        
        logger.warn("Unsupported JWT token: {}", ex.getMessage());
        return createErrorResponse(
            HttpStatus.BAD_REQUEST,
            "Unsupported JWT token",
            request.getDescription(false)
        );
    }
    
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentialsException(
            BadCredentialsException ex, WebRequest request) {
        
        logger.warn("Bad credentials: {}", ex.getMessage());
        return createErrorResponse(
            HttpStatus.UNAUTHORIZED,
            "Invalid username or password",
            request.getDescription(false)
        );
    }
    
    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleUsernameNotFoundException(
            UsernameNotFoundException ex, WebRequest request) {
        
        logger.warn("User not found: {}", ex.getMessage());
        return createErrorResponse(
            HttpStatus.UNAUTHORIZED,
            "Invalid username or password",
            request.getDescription(false)
        );
    }
    
    private ResponseEntity<Map<String, Object>> createErrorResponse(
            HttpStatus status, String message, String path) {
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        errorResponse.put("status", status.value());
        errorResponse.put("error", status.getReasonPhrase());
        errorResponse.put("message", message);
        errorResponse.put("path", path.replace("uri=", ""));
        
        return ResponseEntity.status(status).body(errorResponse);
    }
}