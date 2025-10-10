package com.example.portfolio.controller;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/debug")
public class ErrorTestController {
    
    @GetMapping("/test-errors")
    public ResponseEntity<Map<String, String>> testErrors(@RequestParam String type) {
        switch (type.toLowerCase()) {
            case "expired":
                throw new ExpiredJwtException(null, null, "Token has expired");
            case "malformed":
                throw new MalformedJwtException("Invalid token format");
            case "signature":
                throw new SignatureException("Invalid signature");
            case "credentials":
                throw new BadCredentialsException("Invalid credentials");
            case "usernotfound":
                throw new UsernameNotFoundException("User not found");
            default:
                return ResponseEntity.ok(Map.of("message", "No error type specified"));
        }
    }
    
    @GetMapping("/error-status")
    public ResponseEntity<Map<String, String>> getStatus() {
        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "service", "JWT Error Handling Test",
            "timestamp", java.time.LocalDateTime.now().toString()
        ));
    }
}