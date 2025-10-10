package com.example.portfolio.security;

import com.example.portfolio.model.UserAccount;
import com.example.portfolio.repo.UserAccountRepository;
import com.example.portfolio.repo.RefreshTokenRepository;
import com.example.portfolio.repo.ProfileRepository;
import com.example.portfolio.service.CachedUserService;
import com.example.portfolio.web.dto.AuthRequest;
import com.example.portfolio.web.dto.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for Authentication Security including:
 * - Registration and login endpoints
 * - Authentication error handling
 * - Protected endpoint access
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:testdb")
class JwtAuthenticationIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserAccountRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private CachedUserService cachedUserService;

    private UserAccount testUser;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        // Clean existing data first in proper order to handle foreign keys
        refreshTokenRepository.deleteAll();
        profileRepository.deleteAll();
        userRepository.deleteAll();
        
        // Clear all user caches to prevent stale data issues
        cachedUserService.evictAllUserCaches();

        // Create test user with proper save sequence
        testUser = new UserAccount();
        testUser.setEmail("test.security@example.com");
        testUser.setPasswordHash(passwordEncoder.encode("SecurePass123!"));
        testUser.setRole("USER");
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());
        testUser = userRepository.saveAndFlush(testUser); // Use saveAndFlush to ensure proper ID assignment
        
        // Add debug logging to check user ID
        System.out.println("====== TEST USER CREATED WITH ID: " + testUser.getId() + " ======");
    }

    @AfterEach
    void cleanup() {
        // Clean up after each test to prevent interference
        // Delete in proper order to avoid foreign key constraint violations
        refreshTokenRepository.deleteAll();
        profileRepository.deleteAll();
        userRepository.deleteAll();
        
        // Clear all caches to prevent cross-test contamination
        cachedUserService.evictAllUserCaches();
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
                .andExpect(status().isCreated())
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
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectAccessToProtectedEndpointWithInvalidToken() throws Exception {
        String invalidToken = "invalid.jwt.token";

        mockMvc.perform(get("/api/v1/auth/current-user")
                        .header("Authorization", "Bearer " + invalidToken))
                .andExpect(status().isUnauthorized());
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
        mockMvc.perform(get("/actuator/health"))
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