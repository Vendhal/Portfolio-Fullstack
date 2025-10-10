package com.example.portfolio.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ContentNegotiationConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.http.MediaType;

/**
 * Configuration for API versioning support.
 * Enables content negotiation for versioned API endpoints.
 */
@Configuration
public class ApiVersionConfig implements WebMvcConfigurer {

    /**
     * API version prefix constant for consistent endpoint versioning.
     */
    public static final String API_V1_PREFIX = "/api/v1";
    
    /**
     * Current API version for response headers.
     */
    public static final String CURRENT_API_VERSION = "1.0";

    /**
     * Configure content negotiation for API versioning.
     * Supports versioning through Accept headers.
     */
    @Override
    public void configureContentNegotiation(@NonNull ContentNegotiationConfigurer configurer) {
        configurer
            .favorParameter(false)
            .defaultContentType(MediaType.APPLICATION_JSON)
            .mediaType("json", MediaType.APPLICATION_JSON)
            .mediaType("v1", MediaType.valueOf("application/vnd.portfolio.v1+json"))
            .mediaType("v2", MediaType.valueOf("application/vnd.portfolio.v2+json"));
    }
}