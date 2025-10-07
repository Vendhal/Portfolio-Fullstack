package com.example.portfolio.service;

import com.example.portfolio.model.Profile;
import com.example.portfolio.model.UserAccount;
import com.example.portfolio.repo.ProfileRepository;
import com.example.portfolio.web.dto.ProfileUpdateRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.Locale;

import static org.springframework.http.HttpStatus.CONFLICT;

@Service
public class ProfileService {
    private final ProfileRepository profileRepository;

    public ProfileService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    public Profile createProfileForUser(UserAccount user, String slug, String displayName) {
        Profile profile = new Profile();
        profile.setUser(user);
        String normalizedSlug = normalizeSlug(slug);
        profile.setSlug(normalizedSlug != null ? normalizedSlug : generateSlug(displayName));
        profile.setName(displayName);
        profile.setRole("Member");
        return profileRepository.save(profile);
    }

    public Profile updateProfile(Profile profile, ProfileUpdateRequest request) {
        if (request == null) {
            return profile;
        }

        if (request.slug() != null) {
            String desired = normalizeSlug(request.slug());
            if (desired != null && !desired.equals(profile.getSlug())) {
                profileRepository.findBySlug(desired)
                        .filter(existing -> !existing.getId().equals(profile.getId()))
                        .ifPresent(existing -> {
                            throw new ResponseStatusException(CONFLICT, "Slug already taken");
                        });
                profile.setSlug(desired);
            }
        }

        if (StringUtils.hasText(request.displayName())) {
            profile.setName(request.displayName().trim());
        }
        if (request.headline() != null) {
            profile.setRole(normalizeNullable(request.headline()));
        }
        if (request.bio() != null) {
            profile.setBio(normalizeNullable(request.bio()));
        }
        if (request.location() != null) {
            profile.setLocation(normalizeNullable(request.location()));
        }
        if (request.photoUrl() != null) {
            profile.setPhotoUrl(normalizeNullable(request.photoUrl()));
        }
        if (request.githubUrl() != null) {
            profile.setGithubUrl(normalizeNullable(request.githubUrl()));
        }
        if (request.linkedinUrl() != null) {
            profile.setLinkedinUrl(normalizeNullable(request.linkedinUrl()));
        }
        if (request.twitterUrl() != null) {
            profile.setTwitterUrl(normalizeNullable(request.twitterUrl()));
        }
        if (request.websiteUrl() != null) {
            profile.setWebsiteUrl(normalizeNullable(request.websiteUrl()));
        }

        return profileRepository.save(profile);
    }

    public String normalizeSlug(String input) {
        if (!StringUtils.hasText(input)) {
            return null;
        }
        return slugify(input);
    }

    public String generateSlug(String base) {
        return ensureUniqueSlug(slugify(base));
    }

    private String ensureUniqueSlug(String desired) {
        String base = slugify(desired);
        int suffix = 1;
        String candidate = base;
        while (profileRepository.findBySlug(candidate).isPresent()) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    private String slugify(String input) {
        if (!StringUtils.hasText(input)) {
            return "profile";
        }
        String norm = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        String slug = norm.toLowerCase(Locale.ENGLISH)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return slug.isBlank() ? "profile" : slug;
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
