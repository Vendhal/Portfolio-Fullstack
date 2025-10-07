package com.example.portfolio.web.dto;

import com.example.portfolio.model.Experience;
import com.example.portfolio.model.Profile;
import com.example.portfolio.model.Project;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public final class ProfileMapper {
    private ProfileMapper() {
    }

    public static ProfileSummaryDto toSummary(Profile profile) {
        if (profile == null) {
            return null;
        }
        return new ProfileSummaryDto(
                profile.getId(),
                profile.getSlug(),
                profile.getName(),
                profile.getRole(),
                profile.getBio(),
                profile.getPhotoUrl(),
                profile.getGithubUrl(),
                profile.getLinkedinUrl(),
                profile.getTwitterUrl(),
                profile.getWebsiteUrl(),
                profile.getLocation()
        );
    }

    public static ExperienceDto toExperienceDto(Experience experience) {
        return toDto(experience);
    }

    public static List<ExperienceDto> toExperienceDtos(List<Experience> experiences) {
        return experiences.stream()
                .sorted(Comparator.comparing(Experience::getOrderIndex, Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(Experience::getStartDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(ProfileMapper::toDto)
                .collect(Collectors.toList());
    }

    public static ProjectDto toProjectDto(Project project) {
        return toDto(project);
    }

    public static List<ProjectDto> toProjectDtos(List<Project> projects) {
        return projects.stream().map(ProfileMapper::toDto).collect(Collectors.toList());
    }

    public static ProfileDetailDto toDetail(Profile profile, List<ExperienceDto> experiences, List<ProjectDto> projects) {
        return new ProfileDetailDto(toSummary(profile), experiences, projects);
    }

    private static ExperienceDto toDto(Experience experience) {
        return new ExperienceDto(
                experience.getId(),
                experience.getTitle(),
                experience.getCompany(),
                experience.getLocation(),
                experience.getStartDate(),
                experience.getEndDate(),
                experience.isCurrent(),
                experience.getDescription(),
                experience.getOrderIndex()
        );
    }

    private static ProjectDto toDto(Project project) {
        return new ProjectDto(
                project.getId(),
                project.getTitle(),
                project.getSummary(),
                project.getDescription(),
                project.getTags(),
                project.getRepoUrl(),
                project.getLiveUrl(),
                project.getImageUrl(),
                toSummary(project.getOwner())
        );
    }
}
