package com.example.portfolio.web.dto;

public record ProjectDto(
        Long id,
        String title,
        String summary,
        String description,
        String tags,
        String repoUrl,
        String liveUrl,
        String imageUrl,
        ProfileSummaryDto owner
) {
}
