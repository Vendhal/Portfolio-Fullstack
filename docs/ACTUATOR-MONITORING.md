# Spring Boot Actuator Monitoring Setup

## Overview

This document describes the Spring Boot Actuator implementation for monitoring the Portfolio Backend API, including health checks, metrics, and application information.

## Actuator Endpoints

### Available Endpoints

#### 1. Health Check - `/actuator/health`
- **Access**: Public (for load balancers)
- **Purpose**: Application health status and component health
- **Response Example**:
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "validationQuery": "isValid()"
      }
    },
    "refresh-token": {
      "status": "UP",
      "details": {
        "total_tokens": 45,
        "active_tokens": 23,
        "expired_tokens": 15,
        "revoked_tokens": 7,
        "status": "Refresh token system operational"
      }
    }
  }
}
```

#### 2. Application Info - `/actuator/info`
- **Access**: Authenticated users only
- **Purpose**: Application metadata and feature information
- **Response Example**:
```json
{
  "application": {
    "name": "Portfolio Backend API",
    "description": "RESTful API for portfolio management with authentication and refresh tokens",
    "version": "1.0.0",
    "startup-time": "2025-10-07T18:15:00",
    "features": {
      "authentication": "JWT with refresh tokens",
      "database": "PostgreSQL with Flyway migrations",
      "security": "Rate limiting, CORS, HTTPS enforcement",
      "api-versioning": "URL-based versioning (/api/v1/)",
      "monitoring": "Spring Boot Actuator with custom health indicators"
    },
    "endpoints": {
      "auth": "/api/v1/auth/**",
      "profiles": "/api/v1/profiles/**",
      "contact": "/api/v1/contact",
      "health": "/actuator/health",
      "metrics": "/actuator/metrics"
    }
  }
}
```

#### 3. Metrics - `/actuator/metrics`
- **Access**: Authenticated users only
- **Purpose**: Application performance metrics
- **Available Metrics**:
  - `http.server.requests` - HTTP request metrics
  - `jvm.memory.used` - JVM memory usage
  - `jdbc.connections.active` - Database connection pool
  - `refresh.token.operations` - Custom refresh token metrics

#### 4. Prometheus Metrics - `/actuator/prometheus`
- **Access**: Authenticated users only
- **Purpose**: Prometheus-formatted metrics for monitoring systems
- **Use Case**: Integration with Prometheus and Grafana

## Security Configuration

### Authentication
- **Health Endpoint**: Public access for load balancer health checks
- **Other Endpoints**: HTTP Basic authentication required
- **Security Filter**: Dedicated security configuration with higher precedence

### Endpoint Security
```java
// Public health endpoint
.requestMatchers(EndpointRequest.to("health")).permitAll()

// Secured actuator endpoints
.requestMatchers(EndpointRequest.toAnyEndpoint()).authenticated()
```

## Custom Health Indicators

### Refresh Token Health Indicator
- **Name**: `refresh-token`
- **Purpose**: Monitor refresh token system health
- **Metrics Tracked**:
  - Total tokens in system
  - Active (non-expired, non-revoked) tokens
  - Expired tokens
  - Revoked tokens
  - System operational status

### Database Health Indicator
- **Name**: `db` (built-in)
- **Purpose**: Monitor database connectivity
- **Auto-configured**: PostgreSQL connection validation

## Configuration Properties

### Actuator Configuration
```properties
# Exposed endpoints
management.endpoints.web.exposure.include=health,info,metrics,prometheus
management.endpoints.web.base-path=/actuator

# Health check details
management.endpoint.health.show-details=when-authorized
management.health.db.enabled=true
management.health.refresh-token.enabled=true

# Application info
management.info.env.enabled=true

# Metrics configuration
management.metrics.export.prometheus.enabled=true
management.metrics.distribution.percentiles-histogram.http.server.requests=true
management.metrics.distribution.percentiles.http.server.requests=0.5,0.9,0.95,0.99
management.metrics.tags.application=portfolio-backend
```

## Monitoring Integration

### Prometheus Integration
1. **Endpoint**: `/actuator/prometheus`
2. **Format**: Prometheus exposition format
3. **Metrics**: JVM, HTTP, custom application metrics
4. **Configuration**: Percentiles and histograms enabled

### Grafana Dashboard
Recommended metrics to monitor:
- HTTP request rate and latency percentiles
- JVM memory and GC metrics
- Database connection pool usage
- Refresh token system health
- Error rates by endpoint

### Alert Rules
Suggested alerting thresholds:
- HTTP 5xx error rate > 5%
- Response time p99 > 2 seconds
- Database connections > 80% of pool
- Expired tokens > 1000 (cleanup issue)
- Health check failures

## Production Deployment

### Load Balancer Configuration
```nginx
# Health check configuration
location /actuator/health {
    proxy_pass http://backend/actuator/health;
    proxy_set_header Host $host;
    access_log off;  # Don't log health checks
}
```

### Monitoring System Configuration
```yaml
# Prometheus scrape configuration
scrape_configs:
  - job_name: 'portfolio-backend'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['backend:8081']
    basic_auth:
      username: 'monitor'
      password: 'secure-password'
```

### Security Considerations
1. **Authentication**: Always require authentication for non-health endpoints
2. **Network Security**: Restrict actuator endpoints to monitoring networks
3. **Credentials**: Use dedicated monitoring user accounts
4. **Logging**: Monitor access to actuator endpoints
5. **Rate Limiting**: Apply rate limits to prevent abuse

## Metrics Reference

### Built-in Metrics
- `http.server.requests`: HTTP request metrics with tags
- `jvm.memory.used`: JVM memory usage by pool
- `jvm.gc.pause`: Garbage collection metrics
- `jdbc.connections.active`: Database connection pool
- `spring.data.repository.invocations`: Repository method calls

### Custom Metrics
- Refresh token operations (create, validate, revoke)
- Authentication success/failure rates
- Profile operations
- Contact form submissions

### Tags
All metrics include the following tags:
- `application=portfolio-backend`
- `environment=${ENVIRONMENT:local}`
- `version=1.0.0`

## Troubleshooting

### Common Issues
1. **401 Unauthorized**: Check HTTP Basic auth credentials
2. **404 Not Found**: Verify actuator base path configuration
3. **Empty Health Details**: Ensure `show-details=when-authorized`
4. **Missing Custom Health**: Check component registration

### Debugging
```bash
# Test health endpoint
curl http://localhost:8081/actuator/health

# Test with authentication
curl -u username:password http://localhost:8081/actuator/info

# Check available endpoints
curl -u username:password http://localhost:8081/actuator

# View specific metrics
curl -u username:password http://localhost:8081/actuator/metrics/http.server.requests
```

### Log Configuration
Monitor actuator access in application logs:
```properties
logging.level.org.springframework.boot.actuate=DEBUG
logging.level.org.springframework.security=DEBUG
```

## Best Practices

1. **Endpoint Exposure**: Only expose necessary endpoints
2. **Security**: Always authenticate non-health endpoints
3. **Performance**: Monitor impact of metrics collection
4. **Retention**: Configure appropriate metrics retention
5. **Alerting**: Set up proactive monitoring and alerting
6. **Documentation**: Keep endpoint documentation updated
7. **Testing**: Include actuator endpoints in integration tests