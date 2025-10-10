package com.example.portfolio.controller;

import com.example.portfolio.service.CacheMonitoringService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/debug/cache")
public class CacheManagementController {
    
    private final CacheMonitoringService cacheMonitoringService;

    public CacheManagementController(CacheMonitoringService cacheMonitoringService) {
        this.cacheMonitoringService = cacheMonitoringService;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, CacheMonitoringService.CacheStats>> getCacheStats() {
        return ResponseEntity.ok(cacheMonitoringService.getCacheStatistics());
    }

    @PostMapping("/clear/{cacheName}")
    public ResponseEntity<Map<String, String>> clearCache(@PathVariable String cacheName) {
        try {
            boolean cacheExists = cacheMonitoringService.clearCache(cacheName);
            if (!cacheExists) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Cache not found",
                    "message", "Cache '" + cacheName + "' does not exist",
                    "cache", cacheName
                ));
            }
            return ResponseEntity.ok(Map.of(
                "message", "Cache cleared successfully",
                "cache", cacheName
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Cache error",
                "message", "Failed to clear cache: " + e.getMessage(),
                "cache", cacheName
            ));
        }
    }

    @PostMapping("/clear-all")
    public ResponseEntity<Map<String, String>> clearAllCaches() {
        cacheMonitoringService.clearAllCaches();
        return ResponseEntity.ok(Map.of(
            "message", "All caches cleared successfully"
        ));
    }

    @PostMapping("/warm-up")
    public ResponseEntity<Map<String, String>> warmUpCaches() {
        cacheMonitoringService.warmUpCaches();
        return ResponseEntity.ok(Map.of(
            "message", "Cache warm-up initiated"
        ));
    }
}