package com.example.portfolio.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjectRequest(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 500) String summary,
        @Size(max = 2000) String description,
        @Size(max = 255) String tags,
        @Size(max = 255) String repoUrl,
        @Size(max = 255) String liveUrl,
        @Size(max = 255) String imageUrl
) {
}
