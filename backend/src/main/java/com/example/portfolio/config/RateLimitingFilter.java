package com.example.portfolio.config;

import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Rate limiting filter to prevent abuse of API endpoints.
 * Implements a simple in-memory rate limiter with configurable limits.
 */
// @Component - Temporarily disabled for development
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS_PER_MINUTE = 100;
    private static final int MAX_AUTH_REQUESTS_PER_MINUTE = 10;
    private static final long WINDOW_SIZE_MILLIS = 60_000; // 1 minute
    
    private final ConcurrentHashMap<String, RequestWindow> requestCounts = new ConcurrentHashMap<>();
    
    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, 
                                  @NonNull FilterChain filterChain) throws ServletException, IOException {
        
        String clientIp = getClientIpAddress(request);
        String requestPath = request.getRequestURI();
        
        // Determine rate limit based on endpoint
        int maxRequests = isAuthEndpoint(requestPath) ? MAX_AUTH_REQUESTS_PER_MINUTE : MAX_REQUESTS_PER_MINUTE;
        
        if (!isRequestAllowed(clientIp, maxRequests)) {
            response.setStatus(429); // 429 Too Many Requests
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Rate limit exceeded. Please try again later.\"}");
            return;
        }
        
        filterChain.doFilter(request, response);
    }
    
    private boolean isRequestAllowed(String clientIp, int maxRequests) {
        long now = System.currentTimeMillis();
        
        RequestWindow window = requestCounts.computeIfAbsent(clientIp, k -> new RequestWindow(now));
        
        synchronized (window) {
            // Reset window if expired
            if (now - window.windowStart > WINDOW_SIZE_MILLIS) {
                window.reset(now);
            }
            
            if (window.requestCount.get() >= maxRequests) {
                return false;
            }
            
            window.requestCount.incrementAndGet();
            return true;
        }
    }
    
    private boolean isAuthEndpoint(String path) {
        return path != null && (path.contains("/auth/") || path.contains("/login") || path.contains("/register"));
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
    
    private static class RequestWindow {
        private volatile long windowStart;
        private final AtomicInteger requestCount;
        
        public RequestWindow(long windowStart) {
            this.windowStart = windowStart;
            this.requestCount = new AtomicInteger(0);
        }
        
        public void reset(long newWindowStart) {
            this.windowStart = newWindowStart;
            this.requestCount.set(0);
        }
    }
}