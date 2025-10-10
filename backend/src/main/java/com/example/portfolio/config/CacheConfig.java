package com.example.portfolio.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.cache.interceptor.CacheResolver;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.cache.interceptor.SimpleCacheErrorHandler;
import org.springframework.cache.interceptor.SimpleKeyGenerator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

@Configuration
@EnableCaching
public class CacheConfig implements CachingConfigurer {
    
    private static final Logger logger = LoggerFactory.getLogger(CacheConfig.class);
    
    // Cache names as constants for better maintainability
    public static final String USER_CACHE = "users";
    public static final String USER_DETAILS_CACHE = "userDetails";
    public static final String JWT_BLACKLIST_CACHE = "jwtBlacklist";
    public static final String PROJECTS_CACHE = "projects";
    
    @Bean
    @Override
    public CacheManager cacheManager() {
        logger.info("Initializing cache manager with caches: {}", 
            Arrays.asList(USER_CACHE, USER_DETAILS_CACHE, JWT_BLACKLIST_CACHE, PROJECTS_CACHE));
        
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager(
            USER_CACHE,
            USER_DETAILS_CACHE, 
            JWT_BLACKLIST_CACHE,
            PROJECTS_CACHE
        );
        
        // Enable dynamic cache creation for any additional caches needed
        cacheManager.setAllowNullValues(false);
        
        logger.info("Cache manager initialized successfully");
        return cacheManager;
    }
    
    @Bean
    @Override
    public KeyGenerator keyGenerator() {
        return new SimpleKeyGenerator();
    }
    
    @Bean
    @Override
    public CacheErrorHandler errorHandler() {
        return new SimpleCacheErrorHandler();
    }
    
    @Override
    public CacheResolver cacheResolver() {
        return null; // Use default resolver
    }
}