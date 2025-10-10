package com.example.portfolio.security;

import com.example.portfolio.model.UserAccount;
import com.example.portfolio.repo.UserAccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;

@Service
public class UserAccountDetailsService implements UserDetailsService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserAccountDetailsService.class);
    private final UserAccountRepository repository;

    public UserAccountDetailsService(UserAccountRepository repository) {
        this.repository = repository;
    }

    @Override
    // @Cacheable(value = CacheConfig.USER_DETAILS_CACHE, key = "#email.toLowerCase()", unless = "#result == null")
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        System.err.println("=== UserDetailsService.loadUserByUsername called with email: " + email);
        logger.debug("Loading user details for email: {}", email);
        
        UserAccount account = repository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        
        System.err.println("=== Found user account with email: " + account.getEmail());
        System.err.println("=== Password hash: " + (account.getPasswordHash() != null ? account.getPasswordHash() : "NULL"));
        System.err.println("=== Password hash length: " + (account.getPasswordHash() != null ? account.getPasswordHash().length() : "NULL"));
        
        logger.debug("Successfully loaded user details for email: {}", email);
        logger.debug("Password hash length: {}", account.getPasswordHash() != null ? account.getPasswordHash().length() : "NULL");
        logger.debug("Password hash starts with: {}", account.getPasswordHash() != null ? account.getPasswordHash().substring(0, Math.min(10, account.getPasswordHash().length())) : "NULL");
        
        return new org.springframework.security.core.userdetails.User(
                account.getEmail(),
                account.getPasswordHash(),
                getAuthorities(account.getRole())
        );
    }

    private Collection<? extends GrantedAuthority> getAuthorities(String role) {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }
}

