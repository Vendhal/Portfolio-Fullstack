package com.example.portfolio.service;

import com.example.portfolio.model.Profile;
import com.example.portfolio.repo.ProfileRepository;
import com.example.portfolio.web.dto.AuthResponse;
import com.example.portfolio.web.dto.ExperienceDto;
import com.example.portfolio.web.dto.ExperienceRequest;
import com.example.portfolio.web.dto.ProjectDto;
import com.example.portfolio.web.dto.ProjectRequest;
import com.example.portfolio.web.dto.ProfileUpdateRequest;
import com.example.portfolio.web.dto.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
class ProfileCrudServiceIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private ProfileService profileService;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private ExperienceService experienceService;

    @Autowired
    private ProjectService projectService;

    @Test
    void updateProfileRejectsDuplicateSlugAndNormalizesFields() {
        authService.register(registerRequest("alpha.user@test.local", "alpha", "Alpha User"));
        AuthResponse beta = authService.register(registerRequest("beta.user@test.local", "beta", "Beta User"));

        Profile betaProfile = profileRepository.findBySlug(beta.profile().slug()).orElseThrow();

        ResponseStatusException conflict = assertThrows(ResponseStatusException.class, () ->
                profileService.updateProfile(betaProfile, new ProfileUpdateRequest("alpha", null, null, null, null, null, null, null, null, null))
        );
        assertThat(conflict.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        ProfileUpdateRequest request = new ProfileUpdateRequest(
                null,
                "  Beta Builder  ",
                "",
                "  Building things  ",
                "  Remote  ",
                "  https://img.example/avatar.png  ",
                "  https://github.com/beta  ",
                null,
                "",
                "  https://beta.dev  "
        );

        Profile updated = profileService.updateProfile(betaProfile, request);
        assertThat(updated.getName()).isEqualTo("Beta Builder");
        assertThat(updated.getRole()).isNull();
        assertThat(updated.getBio()).isEqualTo("Building things");
        assertThat(updated.getLocation()).isEqualTo("Remote");
        assertThat(updated.getPhotoUrl()).isEqualTo("https://img.example/avatar.png");
        assertThat(updated.getGithubUrl()).isEqualTo("https://github.com/beta");
        assertThat(updated.getTwitterUrl()).isNull();
        assertThat(updated.getWebsiteUrl()).isEqualTo("https://beta.dev");
    }

    @Test
    void experienceServiceValidatesPayload() {
        AuthResponse response = authService.register(registerRequest("experience.user@test.local", "exp-user", "Experience User"));
        Profile profile = profileRepository.findBySlug(response.profile().slug()).orElseThrow();

        ResponseStatusException missingTitle = assertThrows(ResponseStatusException.class, () ->
                experienceService.create(profile, new ExperienceRequest("  ", null, null, null, null, null, null, null))
        );
        assertThat(missingTitle.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        ResponseStatusException invalidDates = assertThrows(ResponseStatusException.class, () ->
                experienceService.create(profile, new ExperienceRequest(
                        "Engineer",
                        null,
                        null,
                        LocalDate.of(2024, 1, 1),
                        LocalDate.of(2023, 12, 31),
                        false,
                        null,
                        null
                ))
        );
        assertThat(invalidDates.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        ExperienceRequest valid = new ExperienceRequest(
                "Engineer",
                "Acme",
                "Remote",
                LocalDate.of(2023, 1, 1),
                null,
                true,
                "  Led the platform team  ",
                1
        );
        ExperienceDto dto = experienceService.create(profile, valid);
        assertThat(dto.title()).isEqualTo("Engineer");
        assertThat(dto.description()).isEqualTo("Led the platform team");
        assertThat(dto.company()).isEqualTo("Acme");
        assertThat(dto.current()).isTrue();
    }

    @Test
    void projectServiceRequiresTitleAndTrimsFields() {
        AuthResponse response = authService.register(registerRequest("project.user@test.local", "proj-user", "Project User"));
        Profile profile = profileRepository.findBySlug(response.profile().slug()).orElseThrow();

        ResponseStatusException missingTitle = assertThrows(ResponseStatusException.class, () ->
                projectService.createProject(profile, new ProjectRequest("   ", null, null, null, null, null, null))
        );
        assertThat(missingTitle.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        ProjectRequest request = new ProjectRequest(
                "  Demo App  ",
                "  Summary  ",
                "  Detailed description  ",
                "  java,spring  ",
                "  https://github.com/demo  ",
                "  https://demo.app  ",
                "  https://img.example/demo.png  "
        );
        ProjectDto dto = projectService.createProject(profile, request);
        assertThat(dto.title()).isEqualTo("Demo App");
        assertThat(dto.summary()).isEqualTo("Summary");
        assertThat(dto.description()).isEqualTo("Detailed description");
        assertThat(dto.tags()).isEqualTo("java,spring");
        assertThat(dto.repoUrl()).isEqualTo("https://github.com/demo");
        assertThat(dto.liveUrl()).isEqualTo("https://demo.app");
        assertThat(dto.imageUrl()).isEqualTo("https://img.example/demo.png");
    }

    private RegisterRequest registerRequest(String email, String slug, String displayName) {
        return new RegisterRequest(
                email,
                "StrongPass!1",
                slug,
                displayName,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }
}
