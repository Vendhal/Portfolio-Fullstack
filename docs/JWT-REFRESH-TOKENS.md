# JWT Refresh Token Implementation Guide

## Overview

This document describes the JWT refresh token system implemented in the Portfolio Backend API. The system provides secure, database-backed token management with automatic rotation, cleanup, and comprehensive monitoring.

## Architecture

### Token Types
1. **Access Token (JWT)**: Short-lived (1 hour), contains user claims, stateless
2. **Refresh Token**: Long-lived (7 days), database-backed, secure random string

### Security Model
- **Access Token**: Stateless, contains user information, expires quickly
- **Refresh Token**: Stateful, stored in database, allows access token renewal
- **Token Rotation**: New refresh token issued with each refresh operation
- **Automatic Cleanup**: Expired and revoked tokens are automatically removed

## Database Schema

### Refresh Token Table (V4__refresh_tokens.sql)
```sql
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES user_accounts(id),
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE
);

-- Performance indexes for efficient token operations
CREATE INDEX CONCURRENTLY idx_refresh_tokens_user_active 
ON refresh_tokens(user_id, created_at DESC) 
WHERE active = true AND revoked = false;

CREATE INDEX CONCURRENTLY idx_refresh_tokens_cleanup 
ON refresh_tokens(expires_at) WHERE active = true;

CREATE INDEX CONCURRENTLY idx_refresh_tokens_token_lookup 
ON refresh_tokens(token) WHERE active = true AND revoked = false;
```

### Token Lifecycle States
- **Active + Not Revoked**: Valid for use
- **Active + Revoked**: Invalidated by user action (logout)
- **Inactive**: Soft deleted (cleanup or expired)
- **Expired**: Past expiration date (marked inactive by cleanup)

## Implementation

### RefreshToken Entity
```java
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;
    
    @Column(nullable = false, unique = true)
    private String token;
    
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private boolean revoked = false;
    
    @Column(nullable = false)
    private boolean active = true;
}
```

### RefreshTokenService
```java
@Service
@Transactional
public class RefreshTokenService {
    
    // Token generation with SHA-256 hashing
    public RefreshToken createRefreshToken(UserAccount user) {
        // Clean up old tokens (keep only 5 most recent per user)
        cleanupOldTokensForUser(user.getId());
        
        // Generate secure random token
        String tokenValue = generateSecureToken();
        
        RefreshToken token = new RefreshToken();
        token.setUser(user);
        token.setToken(hashToken(tokenValue)); // Store hashed version
        token.setExpiresAt(LocalDateTime.now().plus(refreshExpiration));
        token.setCreatedAt(LocalDateTime.now());
        
        return refreshTokenRepository.save(token);
    }
    
    // Token validation with security checks
    public Optional<RefreshToken> validateRefreshToken(String tokenValue) {
        String hashedToken = hashToken(tokenValue);
        LocalDateTime now = LocalDateTime.now();
        
        return refreshTokenRepository.findValidToken(hashedToken, now);
    }
    
    // Token rotation for enhanced security
    public RefreshToken rotateRefreshToken(RefreshToken oldToken) {
        // Revoke old token
        oldToken.setRevoked(true);
        refreshTokenRepository.save(oldToken);
        
        // Create new token
        return createRefreshToken(oldToken.getUser());
    }
    
    // Scheduled cleanup of expired tokens
    @Scheduled(fixedRate = 3600000) // Every hour
    public void cleanupExpiredTokens() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(1);
        int cleaned = refreshTokenRepository.deactivateExpiredTokens(cutoff);
        
        log.info("Cleaned up {} expired and old revoked refresh tokens", cleaned);
    }
}
```

### Security Implementation
```java
private String generateSecureToken() {
    byte[] tokenBytes = new byte[32]; // 256 bits
    secureRandom.nextBytes(tokenBytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
}

private String hashToken(String token) {
    return DigestUtils.sha256Hex(token);
}
```

## API Endpoints

### Authentication Flow
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpc2lzYXJlZnJlc2h0b2tlbg",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

### Token Refresh
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "dGhpc2lzYXJlZnJlc2h0b2tlbg"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "bmV3cmVmcmVzaHRva2VuaGVyZQ",
  "tokenType": "Bearer", 
  "expiresIn": 3600
}
```

### Logout (Revoke Tokens)
```http
POST /api/v1/auth/logout
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "refreshToken": "bmV3cmVmcmVzaHRva2VuaGVyZQ"
}

Response: 204 No Content
```

## Security Features

### Token Rotation
- **Automatic Rotation**: New refresh token issued with each refresh
- **One-Time Use**: Refresh tokens can only be used once
- **Immediate Revocation**: Old token revoked when new one is issued
- **Replay Attack Prevention**: Used tokens cannot be reused

### Token Limits
- **Per-User Limit**: Maximum 5 active refresh tokens per user
- **Automatic Cleanup**: Oldest tokens removed when limit exceeded
- **Device Management**: Users can manage multiple devices/sessions

### Security Headers
```http
# Secure token transmission
Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800

# Security headers
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

### Rate Limiting
```java
@Component
public class RefreshTokenRateLimit {
    
    // Limit refresh attempts per IP
    @RateLimiter(name = "refresh-token", fallbackMethod = "refreshFallback")
    public ResponseEntity<?> refreshToken(HttpServletRequest request, 
                                        RefreshTokenRequest tokenRequest) {
        // Token refresh logic
    }
    
    public ResponseEntity<?> refreshFallback(Exception ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .body(new ErrorResponse("Rate limit exceeded for token refresh"));
    }
}
```

## Monitoring and Health Checks

### Custom Health Indicator
```java
@Component
public class RefreshTokenHealthIndicator implements HealthIndicator {
    
    @Override
    public Health health() {
        try {
            LocalDateTime now = LocalDateTime.now();
            
            // Count active tokens
            long totalTokens = refreshTokenRepository.countByActive(true);
            long activeTokens = refreshTokenRepository.countActiveTokens(now);
            long expiredTokens = refreshTokenRepository.countExpiredTokens(now);
            long revokedTokens = refreshTokenRepository.countRevokedTokens();
            
            Map<String, Object> details = new HashMap<>();
            details.put("total_tokens", totalTokens);
            details.put("active_tokens", activeTokens);
            details.put("expired_tokens", expiredTokens);
            details.put("revoked_tokens", revokedTokens);
            details.put("status", "Refresh token system operational");
            
            return Health.up().withDetails(details).build();
            
        } catch (Exception e) {
            return Health.down()
                .withException(e)
                .withDetail("status", "Refresh token system unavailable")
                .build();
        }
    }
}
```

### Metrics Collection
```java
@Component
public class RefreshTokenMetrics {
    
    @EventListener
    public void onTokenCreated(RefreshTokenCreatedEvent event) {
        Metrics.counter("refresh.token.created", 
            "user", event.getUserId().toString()).increment();
    }
    
    @EventListener  
    public void onTokenRevoked(RefreshTokenRevokedEvent event) {
        Metrics.counter("refresh.token.revoked",
            "reason", event.getReason()).increment();
    }
    
    @EventListener
    public void onTokenExpired(RefreshTokenExpiredEvent event) {
        Metrics.counter("refresh.token.expired").increment();
    }
}
```

## Configuration

### Application Properties
```properties
# JWT Configuration
app.jwt.secret=${JWT_SECRET:}
app.jwt.expiration=${JWT_EXPIRATION:3600000}        # 1 hour
app.jwt.refresh-expiration=${JWT_REFRESH_EXPIRATION:604800000}  # 7 days

# Refresh Token Settings
app.refresh-token.max-per-user=5
app.refresh-token.cleanup-interval=3600000          # 1 hour
app.refresh-token.cleanup-retention-days=1

# Security Settings
app.security.rate-limit.refresh-token.limit=10
app.security.rate-limit.refresh-token.duration=60s
```

### Environment Variables
```bash
# Production JWT secret (must be 256+ bits)
JWT_SECRET=your-super-secure-256-bit-secret-key-here

# Token expiration times
JWT_EXPIRATION=3600000          # 1 hour access token
JWT_REFRESH_EXPIRATION=604800000 # 7 day refresh token

# Database connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=portfolio
DB_USER=portfolio_user
DB_PASSWORD=secure_password
```

## Error Handling

### Common Error Scenarios
```json
{
  "error": "INVALID_REFRESH_TOKEN",
  "message": "Refresh token is invalid or expired",
  "timestamp": "2025-10-07T18:30:00Z"
}

{
  "error": "REFRESH_TOKEN_REVOKED", 
  "message": "Refresh token has been revoked",
  "timestamp": "2025-10-07T18:30:00Z"
}

{
  "error": "REFRESH_TOKEN_EXPIRED",
  "message": "Refresh token has expired", 
  "timestamp": "2025-10-07T18:30:00Z"
}

{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many refresh attempts. Try again later.",
  "retryAfter": 60,
  "timestamp": "2025-10-07T18:30:00Z"
}
```

### Client Error Handling
```javascript
class AuthService {
  async refreshToken(refreshToken) {
    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      
      if (response.status === 401) {
        // Refresh token invalid - redirect to login
        this.redirectToLogin();
        return null;
      }
      
      if (response.status === 429) {
        // Rate limited - show user message
        const error = await response.json();
        this.showRateLimitMessage(error.retryAfter);
        return null;
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }
}
```

## Testing Strategy

### Unit Tests
```java
@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {
    
    @Test
    void shouldCreateRefreshToken() {
        // Test token creation
        UserAccount user = createTestUser();
        RefreshToken token = refreshTokenService.createRefreshToken(user);
        
        assertThat(token.getToken()).isNotEmpty();
        assertThat(token.getExpiresAt()).isAfter(LocalDateTime.now());
        assertThat(token.getUser()).isEqualTo(user);
    }
    
    @Test
    void shouldValidateValidToken() {
        // Test token validation
        RefreshToken token = createValidToken();
        Optional<RefreshToken> result = refreshTokenService.validateRefreshToken(token.getToken());
        
        assertThat(result).isPresent();
    }
    
    @Test
    void shouldRejectExpiredToken() {
        // Test expired token rejection
        RefreshToken expiredToken = createExpiredToken();
        Optional<RefreshToken> result = refreshTokenService.validateRefreshToken(expiredToken.getToken());
        
        assertThat(result).isEmpty();
    }
}
```

### Integration Tests
```java
@SpringBootTest
@Transactional
class RefreshTokenIntegrationTest {
    
    @Test
    void shouldPerformCompleteRefreshFlow() {
        // Test complete authentication flow
        // 1. Login and receive tokens
        // 2. Use refresh token to get new access token
        // 3. Verify old refresh token is revoked
        // 4. Use new tokens successfully
    }
    
    @Test
    void shouldHandleTokenRotation() {
        // Test token rotation security
        // 1. Create refresh token
        // 2. Rotate token
        // 3. Verify old token is revoked
        // 4. Verify new token works
        // 5. Verify old token fails
    }
}
```

## Deployment Considerations

### Production Checklist
- [ ] Strong JWT secret (256+ bits) configured
- [ ] Database indexes deployed for refresh token queries
- [ ] Rate limiting configured for refresh endpoints
- [ ] Monitoring and health checks enabled
- [ ] Log aggregation for security events
- [ ] Token cleanup scheduled job running

### Security Hardening
- [ ] HTTPS enforced for all token endpoints
- [ ] Secure cookie settings for refresh tokens
- [ ] Rate limiting on authentication endpoints
- [ ] IP-based blocking for abuse patterns
- [ ] Regular security audits of token storage

### Performance Optimization
- [ ] Database connection pooling configured
- [ ] Refresh token queries optimized with indexes
- [ ] Token cleanup running on schedule
- [ ] Metrics collection for performance monitoring
- [ ] Load testing of authentication flows

This JWT refresh token implementation provides enterprise-grade security while maintaining excellent performance and user experience.