package com.example.portfolio.web;

import com.example.portfolio.model.Project;
import com.example.portfolio.service.ProjectService;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects")
public class ProjectsController {
    private final ProjectService projectService;

    public ProjectsController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ResponseEntity<List<Project>> all(
            @RequestParam(name = "memberSlug", required = false) String memberSlug,
            @RequestHeader(value = HttpHeaders.IF_NONE_MATCH, required = false) String ifNoneMatch
    ) {
        List<Project> projects = projectService.getProjects(memberSlug);
        String eTag = generateEtag(projects);

        if (ifNoneMatch != null && ifNoneMatch.equals(eTag)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED)
                    .eTag(eTag)
                    .cacheControl(CacheControl.maxAge(60, TimeUnit.SECONDS))
                    .build();
        }

        return ResponseEntity.ok()
                .eTag(eTag)
                .cacheControl(CacheControl.maxAge(60, TimeUnit.SECONDS).cachePublic())
                .body(projects);
    }

    private String generateEtag(List<Project> projects) {
        String signature = projects.stream()
                .map(p -> (p.getId() != null ? p.getId() : 0L) + "|" + p.getTitle() + "|" + (p.getOwner() != null ? p.getOwner().getSlug() : ""))
                .collect(Collectors.joining("::"));
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            byte[] hash = digest.digest(signature.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return "\"" + sb + "\"";
        } catch (NoSuchAlgorithmException e) {
            return "\"" + signature.hashCode() + "\"";
        }
    }
}
