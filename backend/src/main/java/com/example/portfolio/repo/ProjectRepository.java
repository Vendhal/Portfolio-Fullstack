package com.example.portfolio.repo;

import com.example.portfolio.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByOwnerSlugOrderByTitleAsc(String slug);
    List<Project> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
    Optional<Project> findByIdAndOwnerId(Long id, Long ownerId);
    Optional<Project> findByTitleIgnoreCase(String title);
}
