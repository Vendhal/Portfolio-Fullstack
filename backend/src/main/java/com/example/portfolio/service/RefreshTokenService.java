package com.example.portfolio.service;

import com.example.portfolio.config.JwtProperties;
import com.example.portfolio.model.RefreshToken;
import com.example.portfolio.model.UserAccount;
import com.example.portfolio.repo.RefreshTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class RefreshTokenService {

    private static final Logger logger = LoggerFactory.getLogger(RefreshTokenService.class);
    private static final int TOKEN_LENGTH = 32; // 256 bits
    private static final int MAX_TOKENS_PER_USER = 5;

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProperties jwtProperties;
    private final SecureRandom secureRandom;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository, JwtProperties jwtProperties) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtProperties = jwtProperties;
        this.secureRandom = new SecureRandom();
    }

    public String createRefreshToken(UserAccount userAccount) {
        // Generate cryptographically secure random token
        byte[] tokenBytes = new byte[TOKEN_LENGTH];
        secureRandom.nextBytes(tokenBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);

        // Hash the token for storage
        String tokenHash = hashToken(token);

        // Calculate expiration time
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(jwtProperties.getRefreshExpiration() / 1000);

        // Clean up old tokens for this user (keep only most recent ones)
        cleanupUserTokens(userAccount);

        // Create and save the refresh token
        RefreshToken refreshToken = new RefreshToken(tokenHash, userAccount, expiresAt);
        refreshTokenRepository.save(refreshToken);

        logger.debug("Created refresh token for user: {}", userAccount.getEmail());
        return token;
    }

    public Optional<RefreshToken> validateRefreshToken(String token) {
        String tokenHash = hashToken(token);
        Optional<RefreshToken> refreshTokenOpt = refreshTokenRepository.findByTokenHash(tokenHash);

        if (refreshTokenOpt.isPresent()) {
            RefreshToken refreshToken = refreshTokenOpt.get();
            if (refreshToken.isValid()) {
                return Optional.of(refreshToken);
            } else {
                logger.debug("Invalid refresh token: expired or revoked");
            }
        } else {
            logger.debug("Refresh token not found");
        }

        return Optional.empty();
    }

    public String rotateRefreshToken(RefreshToken oldToken) {
        // Revoke the old token
        oldToken.setIsRevoked(true);
        refreshTokenRepository.save(oldToken);

        // Create a new token
        return createRefreshToken(oldToken.getUserAccount());
    }

    public void revokeRefreshToken(String token) {
        String tokenHash = hashToken(token);
        refreshTokenRepository.findByTokenHash(tokenHash)
                .ifPresent(refreshToken -> {
                    refreshToken.setIsRevoked(true);
                    refreshTokenRepository.save(refreshToken);
                    logger.debug("Revoked refresh token for user: {}", refreshToken.getUserAccount().getEmail());
                });
    }

    public void revokeAllUserTokens(UserAccount userAccount) {
        refreshTokenRepository.revokeAllByUserAccount(userAccount);
        logger.debug("Revoked all refresh tokens for user: {}", userAccount.getEmail());
    }

    private void cleanupUserTokens(UserAccount userAccount) {
        List<RefreshToken> activeTokens = refreshTokenRepository
                .findActiveTokensByUserAccountOrderByCreatedAtDesc(userAccount, LocalDateTime.now());

        if (activeTokens.size() >= MAX_TOKENS_PER_USER) {
            // Revoke oldest tokens, keeping only the most recent ones
            List<RefreshToken> tokensToRevoke = activeTokens.subList(MAX_TOKENS_PER_USER - 1, activeTokens.size());
            tokensToRevoke.forEach(token -> token.setIsRevoked(true));
            refreshTokenRepository.saveAll(tokensToRevoke);
            logger.debug("Cleaned up {} old refresh tokens for user: {}", tokensToRevoke.size(), userAccount.getEmail());
        }
    }

    @Scheduled(fixedRate = 3600000) // Run every hour
    public void cleanupExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime cutoff = now.minusDays(30); // Delete old revoked tokens after 30 days

        refreshTokenRepository.deleteByExpiresAtBefore(now);
        refreshTokenRepository.deleteRevokedTokensOlderThan(cutoff);

        logger.info("Cleaned up expired and old revoked refresh tokens");
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}