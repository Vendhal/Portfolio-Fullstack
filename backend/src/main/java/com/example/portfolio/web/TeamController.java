package com.example.portfolio.web;

import com.example.portfolio.model.Member;
import com.example.portfolio.repo.MemberRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/team")
public class TeamController {
    private final MemberRepository repo;
    public TeamController(MemberRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Member> all() { return repo.findAll(); }

    @GetMapping("/{id}")
    public Member one(@org.springframework.web.bind.annotation.PathVariable Long id) {
        return repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/slug/{slug}")
    public Member bySlug(@org.springframework.web.bind.annotation.PathVariable String slug) {
        Member m = repo.findBySlug(slug);
        if (m == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return m;
    }
}
