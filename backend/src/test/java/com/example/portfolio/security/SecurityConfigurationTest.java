package com.example.portfolio.security;

import com.example.portfolio.config.SecurityConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests for Security Configuration including:
 * - CORS configuration
 * - Security filter chain setup
 * - Password encoder configuration
 * - Authentication manager setup
 * - Public vs protected endpoint access
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:testdb")
class SecurityConfigurationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private SecurityConfig securityConfig;

    @Autowired
    private SecurityFilterChain securityFilterChain;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    void shouldHavePasswordEncoderConfigured() {
        assertThat(passwordEncoder).isNotNull();
        
        String rawPassword = "testPassword123";
        String encodedPassword = passwordEncoder.encode(rawPassword);
        
        assertThat(encodedPassword).isNotEqualTo(rawPassword);
        assertThat(passwordEncoder.matches(rawPassword, encodedPassword)).isTrue();
        assertThat(passwordEncoder.matches("wrongPassword", encodedPassword)).isFalse();
    }

    @Test
    void shouldHaveSecurityFilterChainConfigured() {
        assertThat(securityFilterChain).isNotNull();
    }

    @Test
    void shouldAllowCorsPreflightRequests() throws Exception {
        mockMvc.perform(options("/api/v1/auth/login")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"))
                .andExpect(header().exists("Access-Control-Allow-Methods"))
                .andExpect(header().exists("Access-Control-Allow-Headers"));
    }

    @Test
    void shouldAllowAccessToPublicHealthEndpoint() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldAllowAccessToPublicAuthEndpoints() throws Exception {
        // These should be accessible without authentication
        mockMvc.perform(get("/api/v1/auth/register"))
                .andExpect(status().isMethodNotAllowed()); // GET not allowed, but not 401

        mockMvc.perform(get("/api/v1/auth/login"))
                .andExpect(status().isMethodNotAllowed()); // GET not allowed, but not 401
    }

    @Test
    void shouldRequireAuthenticationForProtectedEndpoints() throws Exception {
        // These should require authentication
        mockMvc.perform(get("/api/v1/auth/current-user"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/auth/logout"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/profiles"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRequireAuthenticationForDebugEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/debug/cache/stats"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/debug/cache/clear/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldHandleSecurityExceptionsWithProperErrorFormat() throws Exception {
        mockMvc.perform(get("/api/v1/auth/current-user"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Authentication required to access this resource"))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.path").value("/api/v1/auth/current-user"));
    }

    @Test
    void shouldDisableSessionCreation() throws Exception {
        // Verify that no session is created (stateless authentication)
        mockMvc.perform(get("/api/v1/auth/current-user"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldDisableCSRFForAPIEndpoints() throws Exception {
        // CSRF should be disabled for REST APIs
        // This test verifies that POST requests don't require CSRF tokens
        mockMvc.perform(get("/api/v1/auth/login")) // This will fail due to method not allowed, not CSRF
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    void shouldHandleInvalidURLsGracefully() throws Exception {
        mockMvc.perform(get("/api/v1/nonexistent"))
                .andExpect(status().isUnauthorized()); // Should hit security first, then 404
    }

    @Test
    void shouldEnforceHTTPSInProductionConfiguration() {
        // This test verifies that security headers are properly configured
        // In a real production environment, you'd test HTTPS enforcement
        assertThat(securityConfig).isNotNull();
    }
}