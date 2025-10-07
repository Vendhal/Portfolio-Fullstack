package com.example.portfolio.service;

import com.example.portfolio.model.UserAccount;
import com.example.portfolio.repo.UserAccountRepository;
import com.example.portfolio.web.dto.AuthRequest;
import com.example.portfolio.web.dto.AuthResponse;
import com.example.portfolio.web.dto.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
class AuthServiceIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserAccountRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void registerCreatesUserAndProfileAndReturnsToken() {
        RegisterRequest request = new RegisterRequest(
                "new.user@test.local",
                "password123",
                "new-user",
                "New User",
                "Engineer",
                "Short bio",
                null,
                null,
                null,
                null,
                null,
                "Remote"
        );

        AuthResponse response = authService.register(request);

        assertThat(response.token()).isNotBlank();
        assertThat(response.expiresAt()).isPositive();
        assertThat(response.profile()).isNotNull();
        assertThat(response.profile().slug()).isEqualTo("new-user");
        assertThat(response.profile().name()).isEqualTo("New User");

        UserAccount persisted = userRepository.findByEmail("new.user@test.local").orElseThrow();
        assertThat(passwordEncoder.matches("password123", persisted.getPasswordHash())).isTrue();
    }

    @Test
    void loginSucceedsAfterRegistration() {
        RegisterRequest request = new RegisterRequest(
                "second.user@test.local",
                "StrongPass!1",
                null,
                "Second User",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
        authService.register(request);

        AuthResponse response = authService.login(new AuthRequest("second.user@test.local", "StrongPass!1"));

        assertThat(response.token()).isNotBlank();
        assertThat(response.profile()).isNotNull();
        assertThat(response.profile().name()).isEqualTo("Second User");
        assertThat(response.profile().slug()).isNotBlank();
    }

    @Test
    void loginWithInvalidPasswordReturnsUnauthorized() {
        RegisterRequest request = new RegisterRequest(
                "third.user@test.local",
                "AnotherPass#2",
                null,
                "Third User",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
        authService.register(request);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                authService.login(new AuthRequest("third.user@test.local", "WrongPass"))
        );

        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
