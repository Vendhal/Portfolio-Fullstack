package com.example.portfolio.service;

import com.example.portfolio.config.CacheConfig;
import com.example.portfolio.model.UserAccount;
import com.example.portfolio.repo.UserAccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Cached service for user account operations to improve performance
 * by reducing database calls for frequently accessed user data.
 */
@Service
public class CachedUserService {
    
    private static final Logger logger = LoggerFactory.getLogger(CachedUserService.class);
    private final UserAccountRepository userRepository;

    public CachedUserService(UserAccountRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Find user by email with caching
     * @param email User email (case-insensitive)
     * @return Optional UserAccount
     */
    @Cacheable(value = CacheConfig.USER_CACHE, key = "#email.toLowerCase()")
    public Optional<UserAccount> findByEmail(String email) {
        logger.debug("Finding user by email (will cache if found): {}", email);
        Optional<UserAccount> user = userRepository.findByEmail(email.toLowerCase());
        
        if (user.isPresent()) {
            logger.debug("User found and cached: {}", email);
        } else {
            logger.debug("User not found: {}", email);
        }
        
        return user;
    }
    
    /**
     * Save user and evict cache entries
     * @param user UserAccount to save
     * @return Saved UserAccount
     */
    @CacheEvict(value = {CacheConfig.USER_CACHE, CacheConfig.USER_DETAILS_CACHE}, key = "#user.email.toLowerCase()")
    public UserAccount save(UserAccount user) {
        logger.debug("Saving user and evicting cache for email: {}", user.getEmail());
        UserAccount savedUser = userRepository.save(user);
        logger.debug("User saved and cache evicted: {}", user.getEmail());
        return savedUser;
    }
    
    /**
     * Delete user and evict cache entries
     * @param user UserAccount to delete
     */
    @CacheEvict(value = {CacheConfig.USER_CACHE, CacheConfig.USER_DETAILS_CACHE}, key = "#user.email.toLowerCase()")
    public void delete(UserAccount user) {
        logger.debug("Deleting user and evicting cache for email: {}", user.getEmail());
        userRepository.delete(user);
        logger.debug("User deleted and cache evicted: {}", user.getEmail());
    }
    
    /**
     * Evict all cache entries for a specific user
     * @param email User email
     */
    @CacheEvict(value = {CacheConfig.USER_CACHE, CacheConfig.USER_DETAILS_CACHE}, key = "#email.toLowerCase()")
    public void evictUserCache(String email) {
        logger.info("Manually evicting cache for user: {}", email);
    }
    
    /**
     * Evict all user caches - useful for bulk operations or maintenance
     */
    @CacheEvict(value = {CacheConfig.USER_CACHE, CacheConfig.USER_DETAILS_CACHE}, allEntries = true)
    public void evictAllUserCaches() {
        logger.info("Evicting all user caches");
    }
}