package com.example.portfolio.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ExperienceRequest(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 255) String company,
        @Size(max = 255) String location,
        LocalDate startDate,
        LocalDate endDate,
        Boolean current,
        @Size(max = 2000) String description,
        Integer orderIndex
) {
}
