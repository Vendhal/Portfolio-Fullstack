package com.example.portfolio.model;

import jakarta.persistence.*;

@Entity
public class Member {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String slug;
    private String name;
    private String role;
    @Column(length = 2000)
    private String bio;
    private String photoUrl;
    private String githubUrl;
    private String linkedinUrl;
    private String twitterUrl;

    public Member() {}

    public Member(String name, String role, String bio, String photoUrl, String githubUrl, String linkedinUrl, String twitterUrl) {
        this.name = name;
        this.role = role;
        this.bio = bio;
        this.photoUrl = photoUrl;
        this.githubUrl = githubUrl;
        this.linkedinUrl = linkedinUrl;
        this.twitterUrl = twitterUrl;
    }

    public Long getId() { return id; }
    public String getSlug() { return slug; }
    public String getName() { return name; }
    public String getRole() { return role; }
    public String getBio() { return bio; }
    public String getPhotoUrl() { return photoUrl; }
    public String getGithubUrl() { return githubUrl; }
    public String getLinkedinUrl() { return linkedinUrl; }
    public String getTwitterUrl() { return twitterUrl; }

    public void setId(Long id) { this.id = id; }
    public void setSlug(String slug) { this.slug = slug; }
    public void setName(String name) { this.name = name; }
    public void setRole(String role) { this.role = role; }
    public void setBio(String bio) { this.bio = bio; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public void setGithubUrl(String githubUrl) { this.githubUrl = githubUrl; }
    public void setLinkedinUrl(String linkedinUrl) { this.linkedinUrl = linkedinUrl; }
    public void setTwitterUrl(String twitterUrl) { this.twitterUrl = twitterUrl; }
}
