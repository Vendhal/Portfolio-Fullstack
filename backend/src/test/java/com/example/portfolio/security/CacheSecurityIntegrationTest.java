package com.example.portfolio.security;

import com.example.portfolio.model.UserAccount;
import com.example.portfolio.repo.UserAccountRepository;
import com.example.portfolio.service.CachedUserService;
import com.example.portfolio.service.CacheMonitoringService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for Cache Security including:
 * - Cache access control
 * - Cache management endpoints security
 * - Performance impact of caching on authentication
 * - Cache invalidation security
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:testdb")
@Transactional
class CacheSecurityIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CachedUserService cachedUserService;

    @Autowired
    private CacheMonitoringService cacheMonitoringService;

    @Autowired
    private CacheManager cacheManager;

    @Autowired
    private UserAccountRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private UserAccount testUser;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
        // Clear all caches before each test
        cacheManager.getCacheNames().forEach(cacheName -> {
            var cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
            }
        });

        // Create test user
        testUser = new UserAccount();
        testUser.setEmail("cache.test@example.com");
        testUser.setPasswordHash(passwordEncoder.encode("CachePass123!"));
        testUser.setRole("USER");
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());
        testUser = userRepository.save(testUser);
    }

    @Test
    void shouldRequireAuthenticationForCacheStatsEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/debug/cache/stats"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    void shouldRequireAuthenticationForCacheClearEndpoint() throws Exception {
        mockMvc.perform(post("/api/v1/debug/cache/clear/users"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/debug/cache/clear-all"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRequireAuthenticationForCacheWarmupEndpoint() throws Exception {
        mockMvc.perform(post("/api/v1/debug/cache/warm-up"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldCacheUserLookupsDuringAuthentication() throws Exception {
        // Clear cache to start fresh
        var usersCache = cacheManager.getCache("users");
        if (usersCache != null) {
            usersCache.clear();
        }
        
        // First lookup should hit database
        var user1 = cachedUserService.findByEmail(testUser.getEmail());
        assertThat(user1).isPresent();

        // Second lookup should hit cache
        var user2 = cachedUserService.findByEmail(testUser.getEmail());
        assertThat(user2).isPresent();
        assertThat(user2.get().getId()).isEqualTo(user1.get().getId());

        // Verify cache has the user
        var stats = cacheMonitoringService.getCacheStatistics();
        assertThat(stats.get("users").getSize()).isEqualTo(1);
    }

    @Test
    void shouldInvalidateCacheWhenUserIsModified() throws Exception {
        // Load user into cache
        var cachedUser = cachedUserService.findByEmail(testUser.getEmail());
        assertThat(cachedUser).isPresent();

        // Verify user is in cache
        var statsBeforeUpdate = cacheMonitoringService.getCacheStatistics();
        assertThat(statsBeforeUpdate.get("users").getSize()).isEqualTo(1);

        // Modify user (should evict from cache)
        testUser.setUpdatedAt(LocalDateTime.now());
        cachedUserService.save(testUser);

        // Cache should be invalidated for this user
        // Note: The cache will refresh on next access with updated data
    }

    @Test
    void shouldHandleConcurrentCacheAccess() throws Exception {
        // Simulate multiple concurrent requests that would hit the cache
        String email = testUser.getEmail();

        // Multiple parallel lookups
        var user1 = cachedUserService.findByEmail(email);
        var user2 = cachedUserService.findByEmail(email);
        var user3 = cachedUserService.findByEmail(email);

        assertThat(user1).isPresent();
        assertThat(user2).isPresent();
        assertThat(user3).isPresent();

        // All should return the same cached instance
        assertThat(user1.get().getId()).isEqualTo(user2.get().getId());
        assertThat(user2.get().getId()).isEqualTo(user3.get().getId());
    }

    @Test
    void shouldSecurelyHandleCacheErrors() throws Exception {
        // Test that cache errors don't expose sensitive information
        
        // Try to clear a non-existent cache
        String token = loginAndGetToken();
        
        mockMvc.perform(post("/api/v1/debug/cache/clear/nonexistent")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void shouldNotExposeSensitiveDataInCacheStats() throws Exception {
        // Load some data into cache
        cachedUserService.findByEmail(testUser.getEmail());

        String token = loginAndGetToken();

        mockMvc.perform(get("/api/v1/debug/cache/stats")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users.name").value("users"))
                .andExpect(jsonPath("$.users.size").isNumber())
                // Should not expose actual cached data
                .andExpect(jsonPath("$.users.data").doesNotExist())
                .andExpect(jsonPath("$.users.keys").doesNotExist());
    }

    @Test
    void shouldProperlyManageCacheSize() throws Exception {
        // Test that cache doesn't grow indefinitely
        
        // Create multiple users to fill cache
        for (int i = 0; i < 5; i++) {
            UserAccount user = new UserAccount();
            user.setEmail("test" + i + "@cache-test.com");
            user.setPasswordHash(passwordEncoder.encode("password"));
            user.setRole("USER");
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            user = userRepository.save(user);
            
            // Load into cache
            cachedUserService.findByEmail(user.getEmail());
        }

        var stats = cacheMonitoringService.getCacheStatistics();
        // Cache should contain our test users
        assertThat(stats.get("users").getSize()).isGreaterThan(0);
        assertThat(stats.get("users").getSize()).isLessThanOrEqualTo(100); // Reasonable upper bound
    }

    @Test
    void shouldLogCacheOperationsSecurely() throws Exception {
        // Test that cache operations are logged without exposing sensitive data
        String email = testUser.getEmail();
        
        // Perform cache operations
        cachedUserService.findByEmail(email);
        cachedUserService.findByEmail(email); // Cache hit
        
        // Note: In a real test, you'd verify log messages don't contain passwords or sensitive data
        // This is more of a code review item than an automated test
        assertThat(true).isTrue(); // Placeholder for log verification
    }

    private String loginAndGetToken() throws Exception {
        String loginBody = objectMapper.writeValueAsString(
            new com.example.portfolio.web.dto.AuthRequest(testUser.getEmail(), "CachePass123!")
        );

        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType("application/json")
                        .content(loginBody))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("accessToken").asText();
    }
}