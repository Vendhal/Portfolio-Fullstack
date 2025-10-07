package com.example.portfolio.web.dto;

import java.util.List;

public record ProfileDetailDto(
        ProfileSummaryDto profile,
        List<ExperienceDto> experiences,
        List<ProjectDto> projects
) {
}
