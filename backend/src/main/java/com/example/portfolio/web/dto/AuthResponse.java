package com.example.portfolio.web.dto;

public record AuthResponse(
    String accessToken, 
    String refreshToken,
    long expiresAt, 
    ProfileSummaryDto profile
) {}
