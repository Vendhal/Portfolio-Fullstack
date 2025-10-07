package com.example.portfolio.service;

import com.example.portfolio.model.Experience;
import com.example.portfolio.model.Profile;
import com.example.portfolio.repo.ExperienceRepository;
import com.example.portfolio.web.dto.ExperienceDto;
import com.example.portfolio.web.dto.ExperienceRequest;
import com.example.portfolio.web.dto.ProfileMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class ExperienceService {
    private final ExperienceRepository experienceRepository;

    public ExperienceService(ExperienceRepository experienceRepository) {
        this.experienceRepository = experienceRepository;
    }

    public List<ExperienceDto> list(Profile profile) {
        return ProfileMapper.toExperienceDtos(experienceRepository.findByProfileIdOrderByOrderIndexAsc(profile.getId()));
    }

    public ExperienceDto create(Profile profile, ExperienceRequest request) {
        Experience experience = new Experience();
        experience.setProfile(profile);
        applyRequest(experience, request);
        return ProfileMapper.toExperienceDto(experienceRepository.save(experience));
    }

    public ExperienceDto update(Profile profile, Long id, ExperienceRequest request) {
        Experience experience = experienceRepository.findByIdAndProfileId(id, profile.getId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Experience not found"));
        applyRequest(experience, request);
        return ProfileMapper.toExperienceDto(experienceRepository.save(experience));
    }

    public void delete(Profile profile, Long id) {
        Experience experience = experienceRepository.findByIdAndProfileId(id, profile.getId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Experience not found"));
        experienceRepository.delete(experience);
    }

    private void applyRequest(Experience experience, ExperienceRequest request) {
        if (request == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Experience payload is required");
        }
        if (!StringUtils.hasText(request.title())) {
            throw new ResponseStatusException(BAD_REQUEST, "Title is required");
        }
        if (request.startDate() != null && request.endDate() != null) {
            validateDateRange(request.startDate(), request.endDate());
        }

        experience.setTitle(request.title().trim());
        experience.setCompany(normalizeNullable(request.company()));
        experience.setLocation(normalizeNullable(request.location()));
        experience.setStartDate(request.startDate());
        experience.setEndDate(request.endDate());
        experience.setCurrent(Boolean.TRUE.equals(request.current()));
        experience.setDescription(normalizeNullable(request.description()));
        if (request.orderIndex() != null) {
            experience.setOrderIndex(request.orderIndex());
        }
    }

    private void validateDateRange(LocalDate start, LocalDate end) {
        if (end.isBefore(start)) {
            throw new ResponseStatusException(BAD_REQUEST, "End date cannot be before start date");
        }
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
