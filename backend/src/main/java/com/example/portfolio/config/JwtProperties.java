package com.example.portfolio.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@ConfigurationProperties(prefix = "app.jwt")
@Component
@Qualifier("jwtProperties")
@Primary
public class JwtProperties {
    /** Secret used to sign tokens. */
    private String secret;
    /** Access token expiration in milliseconds. */
    private long expiration = 3600000L; // 1 hour
    /** Refresh token expiration in milliseconds. */
    private long refreshExpiration = 604800000L; // 7 days

    public String getSecret() {
        if (secret == null || secret.trim().isEmpty()) {
            throw new IllegalStateException("JWT secret must be set via environment variable JWT_SECRET. Generate a secure secret with at least 32 characters. Example: openssl rand -base64 32");
        }
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public long getExpiration() {
        return expiration;
    }

    public void setExpiration(long expiration) {
        this.expiration = expiration;
    }

    public long getRefreshExpiration() {
        return refreshExpiration;
    }

    public void setRefreshExpiration(long refreshExpiration) {
        this.refreshExpiration = refreshExpiration;
    }
}
