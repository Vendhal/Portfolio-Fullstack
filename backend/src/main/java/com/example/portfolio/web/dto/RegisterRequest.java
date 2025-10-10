package com.example.portfolio.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @Email @NotBlank String email,
        @NotBlank
        @Size(min = 8, max = 100)
        @jakarta.validation.constraints.Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=[\\]{};':\"\\\\|,.<>/?]).+$",
            message = "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character"
        )
        String password,
        @Size(max = 255) String slug,
        @Size(max = 255) String displayName,
        @Size(max = 255) String headline,
        @Size(max = 4000) String bio,
        @Size(max = 255) String photoUrl,
        @Size(max = 255) String githubUrl,
        @Size(max = 255) String linkedinUrl,
        @Size(max = 255) String twitterUrl,
        @Size(max = 255) String websiteUrl,
        @Size(max = 255) String location
) {
}
