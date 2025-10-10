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
    private final CachedUserService cachedUserService;
    private final ProfileRepository profileRepository;
    private final ProfileService profileService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;

    public AuthService(UserAccountRepository userRepository,
                       CachedUserService cachedUserService,
                       ProfileRepository profileRepository,
                       ProfileService profileService,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager,
                       RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.cachedUserService = cachedUserService;
        this.profileRepository = profileRepository;
        this.profileService = profileService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.refreshTokenService = refreshTokenService;
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
        System.err.println("DEBUG: Request email: " + email);
        System.err.println("DEBUG: Authenticated email: " + authenticatedEmail);
        System.err.println("DEBUG: Normalized authenticated email: " + authenticatedEmail.toLowerCase(Locale.ENGLISH));
        
        UserAccount account = cachedUserService.findByEmail(authenticatedEmail.toLowerCase(Locale.ENGLISH))
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid credentials"));
        return buildAuthResponse(account, null);
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        return refreshTokenService.validateRefreshToken(request.refreshToken())
                .map(refreshToken -> {
                    UserAccount userAccount = refreshToken.getUserAccount();
                    String newAccessToken = jwtService.generateToken(userAccount);
                    String newRefreshToken = refreshTokenService.rotateRefreshToken(refreshToken);
                    long expiresAt = jwtService.extractExpiration(newAccessToken).getTime();
                    
                    ProfileSummaryDto profile = profileRepository.findByUserId(userAccount.getId())
                            .map(ProfileMapper::toSummary)
                            .orElse(null);
                    
                    return new AuthResponse(newAccessToken, newRefreshToken, expiresAt, profile);
                })
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid refresh token"));
    }

    public void logout(UserAccount userAccount) {
        refreshTokenService.revokeAllUserTokens(userAccount);
    }

    @Transactional
    public void deleteAccount(UserAccount userAccount) {
        // First revoke all refresh tokens
        refreshTokenService.revokeAllUserTokens(userAccount);
        
        // Delete user profile if exists (cascade should handle related data)
        profileRepository.findByUserId(userAccount.getId()).ifPresent(profileRepository::delete);
        
        // Finally delete the user account
        userRepository.delete(userAccount);
    }

    private AuthResponse buildAuthResponse(UserAccount account, Profile profile) {
        ProfileSummaryDto summary = profile != null
                ? ProfileMapper.toSummary(profile)
                : profileRepository.findByUserId(account.getId()).map(ProfileMapper::toSummary).orElse(null);
        String accessToken = jwtService.generateToken(account);
        String refreshToken = refreshTokenService.createRefreshToken(account);
        long expiresAt = jwtService.extractExpiration(accessToken).getTime();
        return new AuthResponse(accessToken, refreshToken, expiresAt, summary);
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
