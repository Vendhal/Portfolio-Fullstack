package com.example.portfolio.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
public class CorsConfig {
    private static final Logger logger = LoggerFactory.getLogger(CorsConfig.class);
    
    public CorsConfig() {
        logger.error("====== CORS CONFIG CONSTRUCTOR CALLED ======");
        System.out.println("====== CORS CONFIG CONSTRUCTOR CALLED (SYSOUT) ======");
        System.err.println("====== CORS CONFIG CONSTRUCTOR CALLED (SYSERR) ======");
    }
    
    @Bean
    public CorsFilter corsFilter() {
        logger.error("====== CORS FILTER BEAN CREATED ======");
        System.out.println("====== CORS FILTER BEAN CREATED (SYSOUT) ======");
        System.err.println("====== CORS FILTER BEAN CREATED (SYSERR) ======");
        
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:8080"));
        config.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}

