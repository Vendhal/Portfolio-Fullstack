package com.example.portfolio.repo;

import com.example.portfolio.model.RefreshToken;
import com.example.portfolio.model.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    List<RefreshToken> findByUserAccountAndIsRevokedFalseAndExpiresAtAfter(UserAccount userAccount, LocalDateTime now);

    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.isRevoked = true WHERE rt.userAccount = :userAccount")
    void revokeAllByUserAccount(@Param("userAccount") UserAccount userAccount);

    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now")
    void deleteByExpiresAtBefore(@Param("now") LocalDateTime now);

    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.isRevoked = true AND rt.updatedAt < :cutoff")
    void deleteRevokedTokensOlderThan(@Param("cutoff") LocalDateTime cutoff);

    // Health check queries
    long countByIsRevokedFalseAndExpiresAtAfter(LocalDateTime now);
    
    long countByExpiresAtBefore(LocalDateTime now);
    
    long countByIsRevokedTrue();

    // Cleanup query for user token limits
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.userAccount = :userAccount AND rt.isRevoked = false AND rt.expiresAt > :now ORDER BY rt.createdAt DESC")
    List<RefreshToken> findActiveTokensByUserAccountOrderByCreatedAtDesc(@Param("userAccount") UserAccount userAccount, @Param("now") LocalDateTime now);
}