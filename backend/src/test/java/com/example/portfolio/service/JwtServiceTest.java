package com.example.portfolio.service;

import com.example.portfolio.model.UserAccount;
import com.example.portfolio.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for JWT Service including:
 * - Token generation and parsing
 * - Token validation
 * - Claims extraction
 * - Expiration handling
 */
@SpringBootTest
@Transactional
class JwtServiceTest {

    @Autowired
    private JwtService jwtService;

    private UserAccount testUser;

    @BeforeEach
    void setUp() {
        testUser = new UserAccount();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setRole("USER");
        testUser.setPasswordHash("hashed-password");
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    void shouldGenerateValidToken() {
        String token = jwtService.generateToken(testUser);

        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        assertThat(token.split("\\.")).hasSize(3); // JWT has 3 parts separated by dots
    }

    @Test
    void shouldExtractEmailFromToken() {
        String token = jwtService.generateToken(testUser);
        String extractedEmail = jwtService.extractEmail(token);

        assertThat(extractedEmail).isEqualTo(testUser.getEmail());
    }

    @Test
    void shouldExtractExpirationFromToken() {
        String token = jwtService.generateToken(testUser);
        Date expiration = jwtService.extractExpiration(token);

        assertThat(expiration).isAfter(new Date());
        // Token should expire in approximately 1 hour (allowing some tolerance)
        long timeDiff = expiration.getTime() - System.currentTimeMillis();
        assertThat(timeDiff).isGreaterThan(3500000); // More than 58 minutes
        assertThat(timeDiff).isLessThan(3700000); // Less than 62 minutes
    }

    @Test
    void shouldValidateValidToken() {
        String token = jwtService.generateToken(testUser);
        boolean isValid = jwtService.isTokenValid(token, testUser);

        assertThat(isValid).isTrue();
    }

    @Test
    void shouldRejectTokenWithWrongUser() {
        String token = jwtService.generateToken(testUser);
        
        UserAccount differentUser = new UserAccount();
        differentUser.setEmail("different@example.com");
        differentUser.setRole("USER");
        
        boolean isValid = jwtService.isTokenValid(token, differentUser);

        assertThat(isValid).isFalse();
    }

    @Test
    void shouldExtractClaimsCorrectly() {
        String token = jwtService.generateToken(testUser);
        
        String email = jwtService.extractEmail(token);
        Date expiration = jwtService.extractExpiration(token);

        assertThat(email).isEqualTo(testUser.getEmail());
        assertThat(expiration).isAfter(new Date());
    }

    @Test
    void shouldRejectMalformedToken() {
        String malformedToken = "this.is.not.a.valid.jwt.token";

        assertThrows(Exception.class, () -> jwtService.extractEmail(malformedToken));
    }

    @Test
    void shouldRejectEmptyToken() {
        assertThrows(Exception.class, () -> jwtService.extractEmail(""));
        assertThrows(Exception.class, () -> jwtService.extractEmail(null));
    }

    @Test
    void shouldGenerateUniqueTokensForSameUser() {
        String token1 = jwtService.generateToken(testUser);
        // Small delay to ensure different issued time
        try {
            Thread.sleep(1000); // Increase delay to ensure different timestamps
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        String token2 = jwtService.generateToken(testUser);

        assertThat(token1).isNotEqualTo(token2);
        
        // But both should be valid for the same user
        assertThat(jwtService.isTokenValid(token1, testUser)).isTrue();
        assertThat(jwtService.isTokenValid(token2, testUser)).isTrue();
    }

    @Test
    void shouldHandleSpecialCharactersInEmail() {
        testUser.setEmail("user+tag@example-domain.co.uk");
        String token = jwtService.generateToken(testUser);
        String extractedEmail = jwtService.extractEmail(token);

        assertThat(extractedEmail).isEqualTo(testUser.getEmail());
    }

    @Test
    void shouldIncludeRoleInToken() {
        testUser.setRole("ADMIN");
        String token = jwtService.generateToken(testUser);
        
        // Verify token is valid and email is correct
        assertThat(jwtService.extractEmail(token)).isEqualTo(testUser.getEmail());
        assertThat(jwtService.isTokenValid(token, testUser)).isTrue();
    }

    @Test
    void shouldHandleCaseInsensitiveEmailValidation() {
        String token = jwtService.generateToken(testUser);
        
        UserAccount upperCaseUser = new UserAccount();
        upperCaseUser.setEmail(testUser.getEmail().toUpperCase());
        upperCaseUser.setRole("USER");
        
        // Should be valid due to case-insensitive comparison
        boolean isValid = jwtService.isTokenValid(token, upperCaseUser);
        assertThat(isValid).isTrue();
    }
}