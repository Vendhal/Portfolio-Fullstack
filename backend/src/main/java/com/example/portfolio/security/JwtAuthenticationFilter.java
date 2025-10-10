package com.example.portfolio.security;

import com.example.portfolio.service.CachedUserService;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    
    private final JwtService jwtService;
    private final CachedUserService cachedUserService;

    public JwtAuthenticationFilter(JwtService jwtService, CachedUserService cachedUserService) {
        this.jwtService = jwtService;
        this.cachedUserService = cachedUserService;
        logger.info("JWT Authentication Filter initialized with cached user service");
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        String requestURI = request.getRequestURI();
        
        logger.debug("Processing authentication for URI: {}", requestURI);
        
        if (header == null || !StringUtils.hasText(header) || !header.startsWith("Bearer ")) {
            logger.debug("No Bearer token found, continuing filter chain");
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        logger.debug("Bearer token found, extracting user information");
        
        try {
            String email = jwtService.extractEmail(token);
            logger.debug("Extracted email from token: {}", email);
            
            if (StringUtils.hasText(email) && SecurityContextHolder.getContext().getAuthentication() == null) {
                logger.debug("Looking up user by email: {}", email);
                cachedUserService.findByEmail(email).ifPresent(user -> {
                    if (jwtService.isTokenValid(token, user)) {
                        logger.debug("JWT token valid for user: {}", user.getEmail());
                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                email,
                                null,
                                java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + user.getRole()))
                        );
                        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                        logger.debug("Authentication set successfully for user: {}", email);
                    } else {
                        logger.warn("Invalid JWT token for user: {}", user.getEmail());
                    }
                });
            }
        } catch (ExpiredJwtException ex) {
            logger.warn("JWT token expired for request: {}", requestURI);
            request.setAttribute("jwt-error", "Token expired");
        } catch (MalformedJwtException ex) {
            logger.warn("Malformed JWT token for request: {}", requestURI);
            request.setAttribute("jwt-error", "Malformed token");
        } catch (SignatureException ex) {
            logger.warn("Invalid JWT signature for request: {}", requestURI);
            request.setAttribute("jwt-error", "Invalid signature");
        } catch (UnsupportedJwtException ex) {
            logger.warn("Unsupported JWT token for request: {}", requestURI);
            request.setAttribute("jwt-error", "Unsupported token");
        } catch (Exception ex) {
            logger.error("JWT authentication error for request: {} - {}", requestURI, ex.getMessage());
            request.setAttribute("jwt-error", "Authentication failed");
        }
        
        filterChain.doFilter(request, response);
    }
}
