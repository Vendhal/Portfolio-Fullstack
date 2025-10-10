package com.example.portfolio.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

/**
 * Cache monitoring and management utilities for performance insights
 */
@Component
public class CacheMonitoringService {
    
    private static final Logger logger = LoggerFactory.getLogger(CacheMonitoringService.class);
    private final CacheManager cacheManager;

    public CacheMonitoringService(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    /**
     * Get cache statistics for monitoring
     * @return Map of cache names to their statistics
     */
    public Map<String, CacheStats> getCacheStatistics() {
        Map<String, CacheStats> stats = new HashMap<>();
        Collection<String> cacheNames = cacheManager.getCacheNames();
        
        for (String cacheName : cacheNames) {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                stats.put(cacheName, new CacheStats(cacheName, getCacheSize(cache)));
            }
        }
        
        logger.debug("Retrieved cache statistics for {} caches", stats.size());
        return stats;
    }
    
    /**
     * Clear specific cache
     * @param cacheName Name of cache to clear
     */
    public void clearCache(String cacheName) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.clear();
            logger.info("Cache '{}' cleared successfully", cacheName);
        } else {
            logger.warn("Cache '{}' not found", cacheName);
        }
    }
    
    /**
     * Clear all caches
     */
    public void clearAllCaches() {
        Collection<String> cacheNames = cacheManager.getCacheNames();
        for (String cacheName : cacheNames) {
            clearCache(cacheName);
        }
        logger.info("All caches cleared successfully");
    }
    
    /**
     * Warm up user caches (can be called at startup)
     */
    public void warmUpCaches() {
        logger.info("Cache warm-up initiated");
        // This could be extended to pre-load frequently accessed users
        // For now, we'll just log that warm-up was called
        logger.info("Cache warm-up completed");
    }
    
    private int getCacheSize(Cache cache) {
        try {
            // This is a simple approximation since ConcurrentMapCache doesn't expose size directly
            // In production, you might want to use a more sophisticated cache implementation
            return 0; // ConcurrentMapCache doesn't provide size info
        } catch (Exception e) {
            logger.debug("Could not get cache size for {}: {}", cache.getName(), e.getMessage());
            return -1;
        }
    }
    
    /**
     * Cache statistics data class
     */
    public static class CacheStats {
        private final String name;
        private final int size;
        
        public CacheStats(String name, int size) {
            this.name = name;
            this.size = size;
        }
        
        public String getName() { return name; }
        public int getSize() { return size; }
        
        @Override
        public String toString() {
            return String.format("CacheStats{name='%s', size=%d}", name, size);
        }
    }
}