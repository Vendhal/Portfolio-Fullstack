package com.example.portfolio.service;

import com.example.portfolio.model.Profile;
import com.example.portfolio.model.Project;
import com.example.portfolio.repo.ProjectRepository;
import com.example.portfolio.web.dto.ProfileMapper;
import com.example.portfolio.web.dto.ProjectDto;
import com.example.portfolio.web.dto.ProjectRequest;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @Cacheable(cacheNames = "projects", key = "T(org.springframework.util.StringUtils).hasText(#memberSlug) ? #memberSlug : 'ALL'")
    public List<ProjectDto> getProjects(String memberSlug) {
        List<Project> projects = StringUtils.hasText(memberSlug)
                ? projectRepository.findByOwnerSlugOrderByTitleAsc(memberSlug)
                : projectRepository.findAll();
        return projects.stream().map(ProfileMapper::toProjectDto).collect(Collectors.toList());
    }

    public List<ProjectDto> listOwned(Profile profile) {
        return projectRepository.findByOwnerIdOrderByCreatedAtDesc(profile.getId()).stream()
                .map(ProfileMapper::toProjectDto)
                .collect(Collectors.toList());
    }

    @CacheEvict(cacheNames = "projects", allEntries = true)
    public ProjectDto createProject(Profile profile, ProjectRequest request) {
        Project project = new Project();
        project.setOwner(profile);
        applyRequest(project, request);
        return ProfileMapper.toProjectDto(projectRepository.save(project));
    }

    @CacheEvict(cacheNames = "projects", allEntries = true)
    public ProjectDto updateProject(Profile profile, Long id, ProjectRequest request) {
        Project project = projectRepository.findByIdAndOwnerId(id, profile.getId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Project not found"));
        applyRequest(project, request);
        return ProfileMapper.toProjectDto(projectRepository.save(project));
    }

    @CacheEvict(cacheNames = "projects", allEntries = true)
    public void deleteProject(Profile profile, Long id) {
        Project project = projectRepository.findByIdAndOwnerId(id, profile.getId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Project not found"));
        projectRepository.delete(project);
    }

    private void applyRequest(Project project, ProjectRequest request) {
        if (request == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Project payload is required");
        }
        if (!StringUtils.hasText(request.title())) {
            throw new ResponseStatusException(BAD_REQUEST, "Title is required");
        }

        project.setTitle(request.title().trim());
        project.setSummary(normalizeNullable(request.summary()));
        project.setDescription(normalizeNullable(request.description()));
        project.setTags(normalizeNullable(request.tags()));
        project.setRepoUrl(normalizeNullable(request.repoUrl()));
        project.setLiveUrl(normalizeNullable(request.liveUrl()));
        project.setImageUrl(normalizeNullable(request.imageUrl()));
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
