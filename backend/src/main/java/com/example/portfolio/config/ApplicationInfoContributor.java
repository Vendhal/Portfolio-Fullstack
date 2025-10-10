package com.example.portfolio.config;

/**
 * Custom info contributor for Spring Boot Actuator.
 * Currently disabled - InfoContributor interface not available in Spring Boot 3.3.2
 * 
 * Note: In Spring Boot 3.x, custom info can be added via application.properties:
 * management.info.env.enabled=true
 * info.app.name=Portfolio Backend API
 * info.app.description=RESTful API for portfolio management
 * info.app.version=1.0.0
 */

/*
import org.springframework.boot.actuator.info.Info;
import org.springframework.boot.actuator.info.InfoContributor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Component
public class ApplicationInfoContributor implements InfoContributor {

    @Override
    public void contribute(Info.Builder builder) {
        Map<String, Object> details = new HashMap<>();
        details.put("name", "Portfolio Backend API");
        details.put("description", "RESTful API for portfolio management with authentication and refresh tokens");
        details.put("version", "1.0.0");
        details.put("startup-time", LocalDateTime.now());
        
        Map<String, Object> features = new HashMap<>();
        features.put("authentication", "JWT with refresh tokens");
        features.put("database", "PostgreSQL with Flyway migrations");
        features.put("security", "Rate limiting, CORS, HTTPS enforcement");
        features.put("api-versioning", "URL-based versioning (/api/v1/)");
        features.put("monitoring", "Spring Boot Actuator with custom health indicators");
        
        Map<String, Object> endpoints = new HashMap<>();
        endpoints.put("auth", "/api/v1/auth/**");
        endpoints.put("profiles", "/api/v1/profiles/**");
        endpoints.put("contact", "/api/v1/contact");
        endpoints.put("health", "/actuator/health");
        endpoints.put("metrics", "/actuator/metrics");
        endpoints.put("info", "/actuator/info");
        
        details.put("features", features);
        details.put("endpoints", endpoints);
        
        builder.withDetail("application", details);
    }
}
*/