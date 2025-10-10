package com.example.portfolio.security;

import com.example.portfolio.model.UserAccount;
import com.example.portfolio.repo.UserAccountRepository;
import com.example.portfolio.web.dto.AuthRequest;
import com.example.portfolio.web.dto.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for Authentication Security including:
 * - Registration and login endpoints
 * - Authentication error handling
 * - Protected endpoint access
 */
@SpringBootTest
@AutoConfigureWebMvc
@Transactional
class JwtAuthenticationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserAccountRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private UserAccount testUser;

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = new UserAccount();
        testUser.setEmail("test.security@example.com");
        testUser.setPasswordHash(passwordEncoder.encode("SecurePass123!"));
        testUser.setRole("USER");
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());
        testUser = userRepository.save(testUser);
    }

    @Test
    void shouldSuccessfullyRegisterNewUser() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "register.test@example.com",
                "NewPassword123!",
                "register-test",
                "Register Test",
                "Developer",
                "Test bio",
                null, null, null, null, null, "Remote"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.refreshToken").exists())
                .andExpect(jsonPath("$.expiresAt").exists())
                .andExpect(jsonPath("$.profile.name").value("Register Test"))
                .andExpect(jsonPath("$.profile.slug").value("register-test"));
    }

    @Test
    void shouldSuccessfullyLoginWithValidCredentials() throws Exception {
        AuthRequest request = new AuthRequest("test.security@example.com", "SecurePass123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.refreshToken").exists())
                .andExpect(jsonPath("$.expiresAt").exists());
    }

    @Test
    void shouldRejectLoginWithInvalidCredentials() throws Exception {
        AuthRequest request = new AuthRequest("test.security@example.com", "WrongPassword");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void shouldRejectLoginWithNonexistentUser() throws Exception {
        AuthRequest request = new AuthRequest("nonexistent@example.com", "AnyPassword");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectAccessToProtectedEndpointWithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/current-user"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Authentication required to access this resource"));
    }

    @Test
    void shouldRejectAccessToProtectedEndpointWithInvalidToken() throws Exception {
        String invalidToken = "invalid.jwt.token";

        mockMvc.perform(get("/api/v1/auth/current-user")
                        .header("Authorization", "Bearer " + invalidToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    void shouldRejectMalformedAuthorizationHeader() throws Exception {
        mockMvc.perform(get("/api/v1/auth/current-user")
                        .header("Authorization", "InvalidFormat"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/auth/current-user")
                        .header("Authorization", "Bearer"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldAllowAccessToPublicEndpoints() throws Exception {
        // Test that public endpoints don't require authentication
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldHandleLoginWithValidTokenInSubsequentRequests() throws Exception {
        // First login to get a valid token
        AuthRequest loginRequest = new AuthRequest("test.security@example.com", "SecurePass123!");
        
        String loginResponse = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String accessToken = objectMapper.readTree(loginResponse).get("accessToken").asText();

        // Use the token to access protected endpoint
        mockMvc.perform(get("/api/v1/auth/current-user")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());
    }
}