package com.example.portfolio.service;

import com.example.portfolio.model.Profile;
import com.example.portfolio.model.UserAccount;
import com.example.portfolio.repo.ProfileRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class CurrentUserService {
    private final CachedUserService cachedUserService;
    private final ProfileRepository profileRepository;

    public CurrentUserService(CachedUserService cachedUserService, ProfileRepository profileRepository) {
        this.cachedUserService = cachedUserService;
        this.profileRepository = profileRepository;
    }

    public UserAccount requireUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Authentication required");
        }
        String email = authentication.getName();
        return cachedUserService.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "User not found"));
    }

    public UserAccount getCurrentUser() {
        return requireUser();
    }

    public Profile requireProfile() {
        UserAccount user = requireUser();
        return profileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Profile not found"));
    }

    public Profile requireProfileWithDetails() {
        return requireProfile();
    }
}