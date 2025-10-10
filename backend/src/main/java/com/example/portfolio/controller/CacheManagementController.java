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
        cacheMonitoringService.clearCache(cacheName);
        return ResponseEntity.ok(Map.of(
            "message", "Cache cleared successfully",
            "cache", cacheName
        ));
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