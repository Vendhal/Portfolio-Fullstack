package com.example.portfolio.config;

/**
 * Custom health indicator for monitoring refresh token system.
 * Currently disabled - HealthIndicator packages not resolving in Spring Boot 3.3.2
 * 
 * Note: Basic health endpoint is still available at /actuator/health
 * Database health check is automatically provided by Spring Boot
 */

/*
import com.example.portfolio.repo.RefreshTokenRepository;
import org.springframework.boot.actuator.health.Health;
import org.springframework.boot.actuator.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component("refresh-token")
public class RefreshTokenHealthIndicator implements HealthIndicator {

    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshTokenHealthIndicator(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Override
    public Health health() {
        try {
            // Check if we can query the refresh token table
            long totalTokens = refreshTokenRepository.count();
            long activeTokens = refreshTokenRepository.countByIsRevokedFalseAndExpiresAtAfter(LocalDateTime.now());
            long expiredTokens = refreshTokenRepository.countByExpiresAtBefore(LocalDateTime.now());
            long revokedTokens = refreshTokenRepository.countByIsRevokedTrue();

            return Health.up()
                    .withDetail("total_tokens", totalTokens)
                    .withDetail("active_tokens", activeTokens)
                    .withDetail("expired_tokens", expiredTokens)
                    .withDetail("revoked_tokens", revokedTokens)
                    .withDetail("status", "Refresh token system operational")
                    .build();
        } catch (Exception e) {
            return Health.down()
                    .withDetail("error", e.getMessage())
                    .withDetail("status", "Refresh token system unavailable")
                    .build();
        }
    }
}
*/