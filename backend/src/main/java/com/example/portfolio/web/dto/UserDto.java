package com.example.portfolio.web.dto;

public record UserDto(
    Long id,
    String email,
    String role
) {
}