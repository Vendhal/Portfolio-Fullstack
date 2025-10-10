package com.example.portfolio.web;

import com.example.portfolio.model.UserAccount;
import com.example.portfolio.service.CurrentUserService;
import com.example.portfolio.web.dto.UserDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class UserController {
    private final CurrentUserService currentUserService;

    public UserController(CurrentUserService currentUserService) {
        this.currentUserService = currentUserService;
    }

    @GetMapping("/current-user")
    public ResponseEntity<UserDto> getCurrentUser() {
        UserAccount user = currentUserService.getCurrentUser();
        UserDto userDto = new UserDto(user.getId(), user.getEmail(), user.getRole());
        return ResponseEntity.ok(userDto);
    }
}