package com.example.portfolio.web;

import com.example.portfolio.model.Profile;
import com.example.portfolio.repo.ProfileRepository;
import com.example.portfolio.service.ExperienceService;
import com.example.portfolio.service.ProjectService;
import com.example.portfolio.web.dto.ExperienceDto;
import com.example.portfolio.web.dto.ProfileDetailDto;
import com.example.portfolio.web.dto.ProfileMapper;
import com.example.portfolio.web.dto.ProfileSummaryDto;
import com.example.portfolio.web.dto.ProjectDto;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/team")
public class TeamController extends BaseVersionedController {
    private final ProfileRepository profileRepository;
    private final ExperienceService experienceService;
    private final ProjectService projectService;

    public TeamController(ProfileRepository profileRepository, ExperienceService experienceService, ProjectService projectService) {
        this.profileRepository = profileRepository;
        this.experienceService = experienceService;
        this.projectService = projectService;
    }

    @GetMapping
    public List<ProfileSummaryDto> all() {
        return profileRepository.findAll().stream()
                .map(ProfileMapper::toSummary)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ProfileSummaryDto one(@PathVariable Long id) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return ProfileMapper.toSummary(profile);
    }

    @GetMapping("/slug/{slug}")
    public ProfileDetailDto bySlug(@PathVariable String slug) {
        Profile profile = profileRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        List<ExperienceDto> experiences = experienceService.list(profile);
        List<ProjectDto> projects = projectService.getProjects(slug);
        return ProfileMapper.toDetail(profile, experiences, projects);
    }
}