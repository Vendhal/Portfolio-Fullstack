package com.example.portfolio.web.dto;

import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
        @Size(max = 255) String slug,
        @Size(max = 255) String displayName,
        @Size(max = 255) String headline,
        @Size(max = 4000) String bio,
        @Size(max = 255) String location,
        @Size(max = 255) String photoUrl,
        @Size(max = 255) String githubUrl,
        @Size(max = 255) String linkedinUrl,
        @Size(max = 255) String twitterUrl,
        @Size(max = 255) String websiteUrl
) {
}
