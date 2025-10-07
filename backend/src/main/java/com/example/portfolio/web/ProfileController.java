package com.example.portfolio.web;

import com.example.portfolio.model.Profile;
import com.example.portfolio.service.CurrentUserService;
import com.example.portfolio.service.ExperienceService;
import com.example.portfolio.service.ProfileService;
import com.example.portfolio.service.ProjectService;
import com.example.portfolio.web.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profile/me")
public class ProfileController {
    private final CurrentUserService currentUserService;
    private final ProfileService profileService;
    private final ExperienceService experienceService;
    private final ProjectService projectService;

    public ProfileController(CurrentUserService currentUserService,
                             ProfileService profileService,
                             ExperienceService experienceService,
                             ProjectService projectService) {
        this.currentUserService = currentUserService;
        this.profileService = profileService;
        this.experienceService = experienceService;
        this.projectService = projectService;
    }

    @GetMapping
    public ProfileDetailDto me() {
        Profile profile = currentUserService.requireProfileWithDetails();
        List<ExperienceDto> experiences = experienceService.list(profile);
        List<ProjectDto> projects = projectService.listOwned(profile);
        return ProfileMapper.toDetail(profile, experiences, projects);
    }

    @PutMapping
    public ProfileSummaryDto updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        Profile profile = currentUserService.requireProfile();
        Profile updated = profileService.updateProfile(profile, request);
        return ProfileMapper.toSummary(updated);
    }

    @GetMapping("/experiences")
    public List<ExperienceDto> listExperiences() {
        Profile profile = currentUserService.requireProfile();
        return experienceService.list(profile);
    }

    @PostMapping("/experiences")
    public ResponseEntity<ExperienceDto> createExperience(@Valid @RequestBody ExperienceRequest request) {
        Profile profile = currentUserService.requireProfile();
        ExperienceDto created = experienceService.create(profile, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/experiences/{id}")
    public ExperienceDto updateExperience(@PathVariable Long id, @Valid @RequestBody ExperienceRequest request) {
        Profile profile = currentUserService.requireProfile();
        return experienceService.update(profile, id, request);
    }

    @DeleteMapping("/experiences/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteExperience(@PathVariable Long id) {
        Profile profile = currentUserService.requireProfile();
        experienceService.delete(profile, id);
    }

    @GetMapping("/projects")
    public List<ProjectDto> listProjects() {
        Profile profile = currentUserService.requireProfile();
        return projectService.listOwned(profile);
    }

    @PostMapping("/projects")
    public ResponseEntity<ProjectDto> createProject(@Valid @RequestBody ProjectRequest request) {
        Profile profile = currentUserService.requireProfile();
        ProjectDto created = projectService.createProject(profile, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/projects/{id}")
    public ProjectDto updateProject(@PathVariable Long id, @Valid @RequestBody ProjectRequest request) {
        Profile profile = currentUserService.requireProfile();
        return projectService.updateProject(profile, id, request);
    }

    @DeleteMapping("/projects/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProject(@PathVariable Long id) {
        Profile profile = currentUserService.requireProfile();
        projectService.deleteProject(profile, id);
    }
}
