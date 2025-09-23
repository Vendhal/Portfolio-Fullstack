package com.example.portfolio.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    @Column(length = 2000)
    private String description;
    private String tags; // comma-separated for simplicity
    private String repoUrl;
    private String liveUrl;
    private String imageUrl;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id")
    @JsonIgnoreProperties({"bio","photoUrl","githubUrl","linkedinUrl","twitterUrl","hibernateLazyInitializer","handler"})
    private Member owner;

    public Project() {}

    public Project(String title, String description, String tags, String repoUrl, String liveUrl, String imageUrl) {
        this(title, description, tags, repoUrl, liveUrl, imageUrl, null);
    }

    public Project(String title, String description, String tags, String repoUrl, String liveUrl, String imageUrl, Member owner) {
        this.title = title;
        this.description = description;
        this.tags = tags;
        this.repoUrl = repoUrl;
        this.liveUrl = liveUrl;
        this.imageUrl = imageUrl;
        this.owner = owner;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getTags() { return tags; }
    public String getRepoUrl() { return repoUrl; }
    public String getLiveUrl() { return liveUrl; }
    public String getImageUrl() { return imageUrl; }
    public Member getOwner() { return owner; }

    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setTags(String tags) { this.tags = tags; }
    public void setRepoUrl(String repoUrl) { this.repoUrl = repoUrl; }
    public void setLiveUrl(String liveUrl) { this.liveUrl = liveUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setOwner(Member owner) { this.owner = owner; }
}
