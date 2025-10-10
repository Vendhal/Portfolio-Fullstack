# API Versioning Strategy

## Overview

This document outlines the API versioning strategy implemented in the Portfolio Backend API. The system uses URL-based versioning to maintain backward compatibility while allowing for future API evolution.

## Versioning Approach

### URL-Based Versioning
- **Pattern**: `/api/v{version}/`
- **Current Version**: `v1`
- **Example**: `http://localhost:8081/api/v1/auth/login`

### Benefits
- **Clear and Explicit**: Version is immediately visible in the URL
- **Easy Routing**: Simple to route different versions to different implementations
- **Client-Friendly**: Clients can easily specify which version to use
- **Cacheable**: Different versions can be cached independently

## Current API Structure

### Version 1 (v1) - Current
```
/api/v1/auth/              # Authentication endpoints
├── POST /register         # User registration
├── POST /login           # User login  
├── POST /refresh         # Token refresh
└── POST /logout          # User logout

/api/v1/profile/          # Profile management
├── GET /me               # Get current user profile
├── PUT /me               # Update current user profile
├── GET /{slug}           # Get profile by slug
├── POST /me/experiences  # Add experience
├── PUT /me/experiences/{id}    # Update experience
├── DELETE /me/experiences/{id} # Delete experience
├── POST /me/projects     # Add project
├── PUT /me/projects/{id}       # Update project
└── DELETE /me/projects/{id}    # Delete project

/api/v1/contact/          # Contact functionality
└── POST /               # Submit contact message

/api/v1/team/            # Team information (public)
└── GET /                # Get team members

/api/v1/projects/        # Public projects (if implemented)
└── GET /                # Get public projects
```

## Implementation

### Controller Base Class
```java
@RestController
@RequestMapping(APIConstants.API_V1_PREFIX)
public abstract class BaseVersionedController {
    // Common functionality for all v1 controllers
}
```

### API Constants
```java
public class APIConstants {
    public static final String API_V1_PREFIX = "/api/v1";
    public static final String CURRENT_API_VERSION = "v1";
    
    // Endpoint patterns
    public static final String AUTH_ENDPOINTS = "/auth/**";
    public static final String PROFILE_ENDPOINTS = "/profile/**";
    public static final String CONTACT_ENDPOINTS = "/contact/**";
    public static final String TEAM_ENDPOINTS = "/team/**";
    public static final String PROJECTS_ENDPOINTS = "/projects/**";
}
```

### Version Header Support
All API responses include version information:
```http
HTTP/1.1 200 OK
API-Version: v1
Content-Type: application/json
```

## Versioning Rules

### Backward Compatibility
- **Minor Changes**: Can be made within the same version
  - Adding optional fields to responses
  - Adding new optional request parameters
  - Adding new endpoints
  - Fixing bugs without changing behavior

- **Breaking Changes**: Require a new version
  - Removing fields from responses
  - Changing field types or formats
  - Making optional fields required
  - Changing endpoint behavior
  - Removing endpoints

### Version Lifecycle
1. **Active**: Currently supported and receiving updates
2. **Deprecated**: Still functional but discouraged, with end-of-life date
3. **Sunset**: No longer supported, returning 410 Gone

### Deprecation Process
1. **Announcement**: Minimum 6 months notice
2. **Documentation**: Clear migration guide provided
3. **Headers**: Deprecation warnings in response headers
4. **Sunset**: Gradual reduction of support

## Future Versioning

### Planned Version 2 (v2)
Potential improvements for v2:
- Enhanced response formats with metadata
- Improved error handling with detailed error codes
- Standardized pagination across all endpoints
- GraphQL support alongside REST
- Enhanced filtering and sorting capabilities

### Migration Strategy
```java
// v1 implementation (maintained)
@RestController
@RequestMapping("/api/v1")
public class ProfileControllerV1 extends BaseVersionedController {
    // Current implementation
}

// v2 implementation (new features)
@RestController  
@RequestMapping("/api/v2")
public class ProfileControllerV2 extends BaseVersionedController {
    // Enhanced implementation
}
```

## Client Implementation

### Version Header
Clients should include the API version in Accept header:
```http
GET /api/v1/profile/me
Accept: application/vnd.portfolio.v1+json
Authorization: Bearer {token}
```

### Error Handling
Version-related errors:
```json
{
  "error": "UNSUPPORTED_API_VERSION",
  "message": "API version v3 is not supported. Current version: v1",
  "supportedVersions": ["v1"],
  "currentVersion": "v1"
}
```

### Client Libraries
Recommended client implementation:
```javascript
class PortfolioAPI {
  constructor(baseUrl, version = 'v1') {
    this.baseUrl = baseUrl;
    this.version = version;
    this.apiBase = `${baseUrl}/api/${version}`;
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.apiBase}${endpoint}`;
    const headers = {
      'Accept': `application/vnd.portfolio.${this.version}+json`,
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    return fetch(url, { ...options, headers });
  }
}
```

## Testing Strategy

### Version Testing
Each API version should have:
- **Unit Tests**: Individual endpoint functionality
- **Integration Tests**: End-to-end workflows
- **Contract Tests**: API contract validation
- **Backward Compatibility Tests**: Ensure old clients work

### Test Organization
```
src/test/java/com/example/portfolio/
├── v1/
│   ├── AuthControllerV1Test.java
│   ├── ProfileControllerV1Test.java
│   └── integration/
│       └── ApiV1IntegrationTest.java
└── version/
    └── ApiVersionCompatibilityTest.java
```

## Monitoring and Analytics

### Version Usage Tracking
Monitor API version usage:
- Request counts by version
- Error rates by version  
- Response times by version
- Client adoption of new versions

### Metrics
```java
@Component
public class ApiVersionMetrics {
    private final MeterRegistry meterRegistry;
    
    public void recordVersionUsage(String version, String endpoint) {
        Counter.builder("api.requests")
            .tag("version", version)
            .tag("endpoint", endpoint)
            .register(meterRegistry)
            .increment();
    }
}
```

### Deprecation Warnings
Log and track deprecated version usage:
```http
HTTP/1.1 200 OK
API-Version: v1
Deprecation: true
Sunset: 2026-01-01T00:00:00Z
Link: <https://docs.portfolio.com/migration/v2>; rel="successor-version"
```

## Documentation Standards

### OpenAPI Specification
Each version maintains its own OpenAPI spec:
- `/api/v1/openapi.json` - Version 1 specification
- `/api/v2/openapi.json` - Version 2 specification (future)

### Version-Specific Documentation
- Separate documentation for each version
- Clear migration guides between versions
- Deprecation notices and timelines
- Code examples for each version

## Best Practices

### For API Developers
1. **Plan Ahead**: Consider future needs when designing APIs
2. **Minimize Breaking Changes**: Use additive changes when possible
3. **Clear Communication**: Provide advance notice of deprecations
4. **Gradual Migration**: Support overlapping versions during transitions
5. **Monitor Usage**: Track version adoption and usage patterns

### For API Consumers
1. **Specify Version**: Always specify the API version explicitly
2. **Handle Deprecation**: Monitor deprecation headers and plan migrations
3. **Test Early**: Test against new versions during preview periods
4. **Graceful Degradation**: Handle version-related errors appropriately
5. **Stay Updated**: Subscribe to API change notifications

## Configuration

### Environment-Specific Versions
```properties
# Development
api.version.default=v1
api.version.supported=v1

# Production (future)
api.version.default=v1
api.version.supported=v1,v2
api.version.deprecated=v1
```

### Feature Flags
Use feature flags for gradual version rollouts:
```properties
# Feature flags for v2 endpoints
feature.api.v2.profile=false
feature.api.v2.auth=false
feature.api.v2.projects=false
```

This versioning strategy ensures our API can evolve while maintaining backward compatibility and providing a smooth upgrade path for clients.