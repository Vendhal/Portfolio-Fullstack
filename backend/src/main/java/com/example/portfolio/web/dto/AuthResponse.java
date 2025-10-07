package com.example.portfolio.web.dto;

public record AuthResponse(String token, long expiresAt, ProfileSummaryDto profile) {
}
