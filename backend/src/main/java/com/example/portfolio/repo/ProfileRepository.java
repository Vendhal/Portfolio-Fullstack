package com.example.portfolio.repo;

import com.example.portfolio.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
    Optional<Profile> findBySlug(String slug);
    Optional<Profile> findByUserId(Long userId);
}