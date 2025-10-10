# Database Performance Optimization Guide

## Overview

This document outlines the database performance optimizations implemented in the Portfolio Backend API, including indexing strategies, query optimization, and connection management for PostgreSQL.

## Database Architecture

### PostgreSQL Configuration
- **Version**: PostgreSQL 16
- **Connection Pool**: HikariCP
- **ORM**: Hibernate/JPA with Spring Data
- **Migration Tool**: Flyway

### Schema Design
The database follows normalized design principles with strategic denormalization for performance:

```sql
-- Core entities with performance considerations
user_accounts          -- User authentication data
profiles               -- User profile information  
experiences            -- Work experience entries
projects               -- Portfolio projects
contact_messages       -- Contact form submissions
refresh_tokens         -- JWT refresh token storage
```

## Performance Indexes

### Strategic Index Implementation (V3__performance_indexes.sql)

#### Profile Performance Indexes
```sql
-- Fast profile lookup by slug (primary access pattern)
CREATE INDEX CONCURRENTLY idx_profiles_slug_active 
ON profiles(slug) WHERE active = true;

-- User profile relationship lookup
CREATE INDEX CONCURRENTLY idx_profiles_user_id_active 
ON profiles(user_id) WHERE active = true;

-- Display name search (partial matching)
CREATE INDEX CONCURRENTLY idx_profiles_display_name_gin 
ON profiles USING gin(to_tsvector('english', display_name));
```

#### Experience Performance Indexes
```sql
-- Profile experiences with ordering
CREATE INDEX CONCURRENTLY idx_experiences_profile_order 
ON experiences(profile_id, order_index DESC, start_date DESC) 
WHERE active = true;

-- Date range queries for experience filtering
CREATE INDEX CONCURRENTLY idx_experiences_date_range 
ON experiences(start_date, end_date) WHERE active = true;
```

#### Project Performance Indexes
```sql
-- Profile projects with visibility and ordering
CREATE INDEX CONCURRENTLY idx_projects_profile_visible 
ON projects(profile_id, created_at DESC) 
WHERE active = true AND visible = true;

-- Public project discovery
CREATE INDEX CONCURRENTLY idx_projects_public_discovery 
ON projects(visible, created_at DESC) 
WHERE active = true AND visible = true;

-- Project search by tags
CREATE INDEX CONCURRENTLY idx_projects_tags_gin 
ON projects USING gin(to_tsvector('english', tags));
```

#### Authentication Performance Indexes
```sql
-- Fast user lookup for authentication
CREATE INDEX CONCURRENTLY idx_user_accounts_email_active 
ON user_accounts(email) WHERE active = true;

-- Refresh token system optimization
CREATE INDEX CONCURRENTLY idx_refresh_tokens_user_active 
ON refresh_tokens(user_id, created_at DESC) 
WHERE active = true AND revoked = false;

-- Refresh token cleanup efficiency
CREATE INDEX CONCURRENTLY idx_refresh_tokens_cleanup 
ON refresh_tokens(expires_at) WHERE active = true;
```

#### Contact Message Indexes
```sql
-- Admin dashboard - recent messages first
CREATE INDEX CONCURRENTLY idx_contact_messages_admin 
ON contact_messages(created_at DESC, processed);

-- Email tracking for spam prevention
CREATE INDEX CONCURRENTLY idx_contact_messages_email_recent 
ON contact_messages(email, created_at) 
WHERE created_at > NOW() - INTERVAL '24 hours';
```

## Query Optimization

### Repository Optimization Strategies

#### Profile Queries
```java
@Repository
public interface ProfileRepository extends JpaRepository<Profile, Long> {
    
    // Optimized profile lookup with eager loading
    @Query("SELECT p FROM Profile p " +
           "LEFT JOIN FETCH p.experiences e " +
           "LEFT JOIN FETCH p.projects pr " +
           "WHERE p.slug = :slug AND p.active = true " +
           "ORDER BY e.orderIndex DESC, e.startDate DESC, " +
           "pr.createdAt DESC")
    Optional<Profile> findBySlugWithDetails(@Param("slug") String slug);
    
    // Fast existence check without data loading
    @Query("SELECT COUNT(p) > 0 FROM Profile p " +
           "WHERE p.slug = :slug AND p.active = true")
    boolean existsBySlugAndActive(@Param("slug") String slug);
}
```

#### Experience Queries
```java
@Repository
public interface ExperienceRepository extends JpaRepository<Experience, Long> {
    
    // Ordered experiences for profile display
    @Query("SELECT e FROM Experience e " +
           "WHERE e.profile.id = :profileId AND e.active = true " +
           "ORDER BY e.orderIndex DESC NULLS LAST, e.startDate DESC")
    List<Experience> findByProfileIdOrderedForDisplay(@Param("profileId") Long profileId);
    
    // Current experience lookup
    @Query("SELECT e FROM Experience e " +
           "WHERE e.profile.id = :profileId AND e.current = true AND e.active = true")
    Optional<Experience> findCurrentByProfileId(@Param("profileId") Long profileId);
}
```

#### Refresh Token Queries
```java
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    
    // Efficient token validation
    @Query("SELECT r FROM RefreshToken r " +
           "WHERE r.token = :token AND r.active = true " +
           "AND r.revoked = false AND r.expiresAt > :now")
    Optional<RefreshToken> findValidToken(@Param("token") String token, 
                                         @Param("now") LocalDateTime now);
    
    // Cleanup expired tokens efficiently
    @Modifying
    @Query("UPDATE RefreshToken r SET r.active = false " +
           "WHERE r.expiresAt < :cutoff AND r.active = true")
    int deactivateExpiredTokens(@Param("cutoff") LocalDateTime cutoff);
}
```

## Connection Pool Optimization

### HikariCP Configuration
```properties
# Connection pool settings for optimal performance
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.idle-timeout=300000
spring.datasource.hikari.max-lifetime=1200000
spring.datasource.hikari.connection-timeout=20000
spring.datasource.hikari.validation-timeout=5000
spring.datasource.hikari.leak-detection-threshold=60000

# Performance tuning
spring.datasource.hikari.pool-name=PortfolioHikariPool
spring.datasource.hikari.connection-test-query=SELECT 1
spring.datasource.hikari.auto-commit=true
```

### Connection Monitoring
```java
@Component
public class DatabaseMetrics {
    private final HikariDataSource dataSource;
    private final MeterRegistry meterRegistry;
    
    @EventListener
    public void recordConnectionMetrics() {
        HikariPoolMXBean pool = dataSource.getHikariPoolMXBean();
        
        Gauge.builder("db.connections.active")
            .register(meterRegistry, pool, HikariPoolMXBean::getActiveConnections);
        
        Gauge.builder("db.connections.idle")
            .register(meterRegistry, pool, HikariPoolMXBean::getIdleConnections);
        
        Gauge.builder("db.connections.total")
            .register(meterRegistry, pool, HikariPoolMXBean::getTotalConnections);
    }
}
```

## JPA/Hibernate Optimization

### Entity Configuration
```java
@Entity
@Table(name = "profiles")
@EntityListeners(AuditingEntityListener.class)
public class Profile {
    
    // Lazy loading for large collections
    @OneToMany(mappedBy = "profile", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @OrderBy("orderIndex DESC NULLS LAST, startDate DESC")
    @JsonIgnoreProperties({"profile"})
    private List<Experience> experiences = new ArrayList<>();
    
    // Batch loading for better N+1 performance
    @BatchSize(size = 20)
    @OneToMany(mappedBy = "profile", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @OrderBy("createdAt DESC")
    @JsonIgnoreProperties({"profile"})
    private List<Project> projects = new ArrayList<>();
}
```

### Query Optimization Settings
```properties
# JPA/Hibernate performance tuning
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.open-in-view=false
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
spring.jpa.properties.hibernate.use_sql_comments=false

# Batch processing
spring.jpa.properties.hibernate.jdbc.batch_size=20
spring.jpa.properties.hibernate.order_inserts=true
spring.jpa.properties.hibernate.order_updates=true
spring.jpa.properties.hibernate.jdbc.batch_versioned_data=true

# Second-level cache (if needed)
spring.jpa.properties.hibernate.cache.use_second_level_cache=false
spring.jpa.properties.hibernate.cache.use_query_cache=false

# Connection handling
spring.jpa.properties.hibernate.connection.provider_disables_autocommit=true
spring.jpa.properties.hibernate.jdbc.time_zone=UTC
```

## Performance Monitoring

### Database Health Checks
```java
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    
    @Override
    public Health health() {
        try {
            long start = System.currentTimeMillis();
            
            // Test query performance
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            
            long responseTime = System.currentTimeMillis() - start;
            
            if (responseTime > 1000) {
                return Health.down()
                    .withDetail("responseTime", responseTime + "ms")
                    .withDetail("status", "Database responding slowly")
                    .build();
            }
            
            return Health.up()
                .withDetail("responseTime", responseTime + "ms")
                .build();
                
        } catch (Exception e) {
            return Health.down(e).build();
        }
    }
}
```

### Slow Query Monitoring
```properties
# PostgreSQL logging configuration
logging.level.org.hibernate.SQL=WARN
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=WARN

# Enable slow query logging in PostgreSQL
# log_min_duration_statement = 1000  # Log queries taking > 1 second
```

## Caching Strategy

### Application-Level Caching
```java
@Service
@CacheConfig(cacheNames = "profiles")
public class ProfileService {
    
    @Cacheable(key = "#slug", unless = "#result == null")
    public Optional<ProfileDetailDto> findBySlug(String slug) {
        return profileRepository.findBySlugWithDetails(slug)
            .map(profileMapper::toDetailDto);
    }
    
    @CacheEvict(key = "#profile.slug")
    public Profile updateProfile(Profile profile) {
        return profileRepository.save(profile);
    }
}
```

### Cache Configuration
```properties
# Redis cache configuration (if using Redis)
spring.cache.type=redis
spring.redis.host=localhost
spring.redis.port=6379
spring.redis.timeout=2000ms
spring.redis.jedis.pool.max-active=8
spring.redis.jedis.pool.max-idle=8

# Simple cache configuration (default)
spring.cache.cache-names=profiles,projects,experiences
spring.cache.caffeine.spec=maximumSize=1000,expireAfterWrite=300s
```

## Performance Testing

### Load Testing Scenarios
1. **Profile Lookup**: 1000 concurrent requests for profile pages
2. **Authentication**: 500 concurrent login/refresh operations
3. **CRUD Operations**: Mixed read/write operations on experiences and projects
4. **Search Operations**: Full-text search across profiles and projects

### Performance Metrics
- **Response Time**: < 200ms for profile lookups
- **Throughput**: > 1000 requests/second for read operations
- **Database Connections**: < 10 active connections under normal load
- **Query Performance**: < 50ms for indexed queries

## Database Maintenance

### Routine Maintenance Tasks
```sql
-- Analyze table statistics (weekly)
ANALYZE profiles, experiences, projects, user_accounts, refresh_tokens;

-- Vacuum to reclaim space (monthly)
VACUUM ANALYZE profiles, experiences, projects;

-- Reindex if needed (quarterly)
REINDEX INDEX CONCURRENTLY idx_profiles_slug_active;
```

### Monitoring Queries
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- Identify slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Monitor table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Best Practices

### Query Optimization
1. **Use Indexes**: Ensure all WHERE, ORDER BY, and JOIN columns are indexed
2. **Avoid N+1**: Use fetch joins or batch loading for related entities
3. **Limit Results**: Always use pagination for list endpoints
4. **Select Specific Columns**: Use projections instead of selecting entire entities
5. **Batch Operations**: Use batch inserts/updates for bulk operations

### Connection Management
1. **Pool Sizing**: Size connection pool based on actual concurrent users
2. **Connection Timeouts**: Set appropriate timeouts to handle connection issues
3. **Leak Detection**: Enable connection leak detection in development
4. **Monitoring**: Track connection pool metrics in production

### Schema Design
1. **Normalization**: Follow 3NF principles with strategic denormalization
2. **Data Types**: Use appropriate data types for storage efficiency
3. **Constraints**: Use database constraints for data integrity
4. **Partitioning**: Consider partitioning for large tables (future)

This performance optimization strategy ensures the Portfolio Backend API can handle production loads efficiently while maintaining data consistency and query performance.