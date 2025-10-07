package com.example.portfolio.repo;

import com.example.portfolio.model.Experience;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExperienceRepository extends JpaRepository<Experience, Long> {
    List<Experience> findByProfileIdOrderByOrderIndexAsc(Long profileId);
    Optional<Experience> findByIdAndProfileId(Long id, Long profileId);
}
