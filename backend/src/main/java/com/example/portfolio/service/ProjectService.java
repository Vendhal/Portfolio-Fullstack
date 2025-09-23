package com.example.portfolio.service;

import com.example.portfolio.model.Project;
import com.example.portfolio.repo.ProjectRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class ProjectService {
    private final ProjectRepository repo;

    public ProjectService(ProjectRepository repo) {
        this.repo = repo;
    }

    @Cacheable(cacheNames = "projects", key = "T(org.springframework.util.StringUtils).hasText(#memberSlug) ? #memberSlug : 'ALL'")
    public List<Project> getProjects(String memberSlug) {
        if (StringUtils.hasText(memberSlug)) {
            return repo.findByOwnerSlugOrderByTitleAsc(memberSlug);
        }
        return repo.findAll();
    }
}
