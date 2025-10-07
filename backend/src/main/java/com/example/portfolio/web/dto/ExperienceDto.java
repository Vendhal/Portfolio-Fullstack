package com.example.portfolio.web.dto;

import java.time.LocalDate;

public record ExperienceDto(
        Long id,
        String title,
        String company,
        String location,
        LocalDate startDate,
        LocalDate endDate,
        boolean current,
        String description,
        Integer orderIndex
) {
}
