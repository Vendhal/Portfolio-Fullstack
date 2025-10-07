package com.example.portfolio.service;

import com.example.portfolio.model.Profile;
import com.example.portfolio.model.UserAccount;
import com.example.portfolio.repo.ProfileRepository;
import com.example.portfolio.repo.UserAccountRepository;
import com.example.portfolio.security.JwtService;
import com.example.portfolio.web.dto.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

import static org.springframework.http.HttpStatus.*;

@Service
public class AuthService {
    private final UserAccountRepository userRepository;
    private final ProfileRepository profileRepository;
    private final ProfileService profileService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserAccountRepository userRepository,
                       ProfileRepository profileRepository,
                       ProfileService profileService,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.profileService = profileService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        String password = request.password();
        if (!StringUtils.hasText(email) || !StringUtils.hasText(password)) {
            throw new ResponseStatusException(BAD_REQUEST, "Email and password are required");
        }
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(CONFLICT, "User already exists");
        }

        String normalizedSlug = null;
        if (StringUtils.hasText(request.slug())) {
            normalizedSlug = profileService.normalizeSlug(request.slug());
            if (profileRepository.findBySlug(normalizedSlug).isPresent()) {
                throw new ResponseStatusException(CONFLICT, "Slug already taken");
            }
        }

        String displayName = trimToNull(request.displayName());
        if (!StringUtils.hasText(displayName)) {
            displayName = email;
        }

        try {
            UserAccount account = new UserAccount();
            account.setEmail(email);
            account.setPasswordHash(passwordEncoder.encode(password));
            account.setRole("USER");
            userRepository.save(account);

            Profile profile = profileService.createProfileForUser(account, normalizedSlug, displayName);
            applyProfileFields(profile, request);
            profileRepository.save(profile);

            return buildAuthResponse(account, profile);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(CONFLICT, "Registration failed: email or slug already in use", ex);
        }
    }

    public AuthResponse login(AuthRequest request) {
        String email = normalizeEmail(request.email());
        String password = request.password();
        if (!StringUtils.hasText(email) || !StringUtils.hasText(password)) {
            throw new ResponseStatusException(BAD_REQUEST, "Email and password are required");
        }

        Authentication auth;
        try {
            auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );
        } catch (AuthenticationException ex) {
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid credentials", ex);
        }

        String authenticatedEmail = auth.getName();
        UserAccount account = userRepository.findByEmail(authenticatedEmail.toLowerCase(Locale.ENGLISH))
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid credentials"));
        return buildAuthResponse(account, null);
    }

    private AuthResponse buildAuthResponse(UserAccount account, Profile profile) {
        ProfileSummaryDto summary = profile != null
                ? ProfileMapper.toSummary(profile)
                : profileRepository.findByUserId(account.getId()).map(ProfileMapper::toSummary).orElse(null);
        String token = jwtService.generateToken(account);
        long expiresAt = jwtService.extractExpiration(token).getTime();
        return new AuthResponse(token, expiresAt, summary);
    }

    private void applyProfileFields(Profile profile, RegisterRequest request) {
        String headline = trimToNull(request.headline());
        if (headline != null) {
            profile.setRole(headline);
        }
        profile.setBio(trimToNull(request.bio()));
        profile.setPhotoUrl(trimToNull(request.photoUrl()));
        profile.setGithubUrl(trimToNull(request.githubUrl()));
        profile.setLinkedinUrl(trimToNull(request.linkedinUrl()));
        profile.setTwitterUrl(trimToNull(request.twitterUrl()));
        profile.setWebsiteUrl(trimToNull(request.websiteUrl()));
        profile.setLocation(trimToNull(request.location()));
    }

    private String normalizeEmail(String email) {
        String normalized = trimToNull(email);
        return normalized != null ? normalized.toLowerCase(Locale.ENGLISH) : null;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
