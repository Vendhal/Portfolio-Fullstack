package com.example.portfolio.web.dto;

public record ProfileSummaryDto(
        Long id,
        String slug,
        String name,
        String role,
        String bio,
        String photoUrl,
        String githubUrl,
        String linkedinUrl,
        String twitterUrl,
        String websiteUrl,
        String location
) {
}
