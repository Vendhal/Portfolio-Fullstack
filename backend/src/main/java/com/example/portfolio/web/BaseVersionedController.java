package com.example.portfolio.web;

import com.example.portfolio.config.ApiVersionConfig;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Base controller class for versioned API endpoints.
 * Provides common versioning setup for all API controllers.
 */
@RequestMapping("/api/v1")
public abstract class BaseVersionedController {
    
    /**
     * Common API version prefix for all endpoints.
     * Subclasses can use this for consistent versioning.
     */
    protected static final String API_VERSION = "/api/v1";
    
    /**
     * Helper method to build versioned endpoint paths.
     * @param endpoint The endpoint path without version prefix
     * @return Full versioned endpoint path
     */
    protected String versionedPath(String endpoint) {
        return API_VERSION + endpoint;
    }
    
    /**
     * Add version headers to response.
     */
    protected <T> ResponseEntity<T> withVersionHeaders(T body) {
        return ResponseEntity.ok()
                .header("API-Version", ApiVersionConfig.CURRENT_API_VERSION)
                .header("X-API-Version", ApiVersionConfig.CURRENT_API_VERSION)
                .body(body);
    }
    
    /**
     * Add version headers to response with specific status code.
     */
    protected <T> ResponseEntity<T> withVersionHeaders(T body, int statusCode) {
        return ResponseEntity.status(statusCode)
                .header("API-Version", ApiVersionConfig.CURRENT_API_VERSION)
                .header("X-API-Version", ApiVersionConfig.CURRENT_API_VERSION)
                .body(body);
    }
}