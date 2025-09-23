package com.example.portfolio.web;

import com.example.portfolio.model.ContactMessage;
import com.example.portfolio.repo.ContactMessageRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contact")
public class ContactController {
    private final ContactMessageRepository repo;
    public ContactController(ContactMessageRepository repo) { this.repo = repo; }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContactMessage create(@Valid @RequestBody ContactMessage msg) {
        return repo.save(msg);
    }
}

