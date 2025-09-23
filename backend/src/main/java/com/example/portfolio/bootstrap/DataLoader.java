package com.example.portfolio.bootstrap;

import com.example.portfolio.model.Member;
import com.example.portfolio.model.Project;
import com.example.portfolio.repo.MemberRepository;
import com.example.portfolio.repo.ProjectRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class DataLoader implements CommandLineRunner {
    private final MemberRepository memberRepo;
    private final ProjectRepository projectRepo;

    public DataLoader(MemberRepository memberRepo, ProjectRepository projectRepo) {
        this.memberRepo = memberRepo;
        this.projectRepo = projectRepo;
    }

    @Override
    public void run(String... args) {
        if (memberRepo.count() == 0) {
            Member a = new Member(
                "P. Jai Ganesh",
                "Frontend Engineer",
                "KL University CSE student (ID: 2300030829) focused on crafting accessible, performant web interfaces.",
                "/images/jai-ganesh.jpg",
                "https://github.com/jai-ganesh",
                "https://www.linkedin.com/in/jai-ganesh/",
                "https://twitter.com/jai_ganesh"
            );
            a.setSlug("jai-ganesh");
            memberRepo.save(a);

            Member b = new Member(
                "Jayram Reddy K",
                "Backend Engineer",
                "KL University CSE student (ID: 2300030372), third-year first semester, focused on backend and platform reliability.",
                "/images/jayram-reddy.jpg",
                "https://github.com/jayram-reddy",
                "https://www.linkedin.com/in/jayram-reddy/",
                "https://twitter.com/jayramreddy"
            );
            b.setSlug("jayram-reddy");
            memberRepo.save(b);
            Member c = new Member(
                "K. Sai Sandeep",
                "Full-Stack Engineer",
                "KL University CSE student (ID: 2300033147) building end-to-end web experiences from API to UI.",
                "/images/sai-sandeep.jpg",
                "https://github.com/k-sai-sandeep",
                "https://www.linkedin.com/in/ksaisandeep/",
                "https://twitter.com/ksaisandeep"
            );
            c.setSlug("sai-sandeep");
            memberRepo.save(c);
        }

        // Backfill slugs for any members missing them
        List<Member> all = memberRepo.findAll();
        Set<String> used = new HashSet<>();
        for (Member m : all) {
            if (m.getSlug() != null && !m.getSlug().isBlank()) {
                used.add(m.getSlug());
            }
        }
        for (Member m : all) {
            if (m.getSlug() == null || m.getSlug().isBlank()) {
                String base = slugify(m.getName());
                String s = base;
                int i = 1;
                while (used.contains(s)) {
                    s = base + "-" + i++;
                }
                m.setSlug(s);
                used.add(s);
                memberRepo.save(m);
            }
        }

        updateExistingMembers();
        syncProjects();
    }

    private void updateExistingMembers() {
        Member jai = memberRepo.findBySlug("jai-ganesh");
        if (jai != null) {
            String jaiBio = "KL University CSE student (ID: 2300030829) focused on crafting accessible, performant web interfaces.";
            String jaiPhoto = "/images/jai-ganesh.jpg";
            String jaiGithub = "https://github.com/jai-ganesh";
            String jaiLinkedin = "https://www.linkedin.com/in/jai-ganesh/";
            String jaiTwitter = "https://twitter.com/jai_ganesh";
            boolean updated = false;
            if (!Objects.equals(jai.getBio(), jaiBio)) {
                jai.setBio(jaiBio);
                updated = true;
            }
            if (!Objects.equals(jai.getPhotoUrl(), jaiPhoto)) {
                jai.setPhotoUrl(jaiPhoto);
                updated = true;
            }
            if (jai.getGithubUrl() == null || jai.getGithubUrl().isBlank() || !Objects.equals(jai.getGithubUrl(), jaiGithub)) {
                jai.setGithubUrl(jaiGithub);
                updated = true;
            }
            if (jai.getLinkedinUrl() == null || jai.getLinkedinUrl().isBlank() || !Objects.equals(jai.getLinkedinUrl(), jaiLinkedin)) {
                jai.setLinkedinUrl(jaiLinkedin);
                updated = true;
            }
            if (jai.getTwitterUrl() == null || jai.getTwitterUrl().isBlank() || !Objects.equals(jai.getTwitterUrl(), jaiTwitter)) {
                jai.setTwitterUrl(jaiTwitter);
                updated = true;
            }
            if (updated) {
                memberRepo.save(jai);
            }
        }

        Member jayram = memberRepo.findBySlug("jayram-reddy");
        if (jayram == null) {
            jayram = memberRepo.findBySlug("brian-smith");
        }
        if (jayram != null) {
            String jayramBio = "KL University CSE student (ID: 2300030372), third-year first semester, focused on backend and platform reliability.";
            String jayramPhoto = "/images/jayram-reddy.jpg";
            boolean updated = false;
            if (!Objects.equals(jayram.getName(), "Jayram Reddy K")) {
                jayram.setName("Jayram Reddy K");
                updated = true;
            }
            if (!Objects.equals(jayram.getRole(), "Backend Engineer")) {
                jayram.setRole("Backend Engineer");
                updated = true;
            }
            if (!Objects.equals(jayram.getBio(), jayramBio)) {
                jayram.setBio(jayramBio);
                updated = true;
            }
            if (!Objects.equals(jayram.getPhotoUrl(), jayramPhoto)) {
                jayram.setPhotoUrl(jayramPhoto);
                updated = true;
            }
            if (!Objects.equals(jayram.getSlug(), "jayram-reddy")) {
                jayram.setSlug("jayram-reddy");
                updated = true;
            }
            String jayramGithub = "https://github.com/jayram-reddy";
            String jayramLinkedin = "https://www.linkedin.com/in/jayram-reddy/";
            String jayramTwitter = "https://twitter.com/jayramreddy";
            if (!Objects.equals(jayram.getGithubUrl(), jayramGithub)) {
                jayram.setGithubUrl(jayramGithub);
                updated = true;
            }
            if (!Objects.equals(jayram.getLinkedinUrl(), jayramLinkedin)) {
                jayram.setLinkedinUrl(jayramLinkedin);
                updated = true;
            }
            if (!Objects.equals(jayram.getTwitterUrl(), jayramTwitter)) {
                jayram.setTwitterUrl(jayramTwitter);
                updated = true;
            }
            if (updated) {
                memberRepo.save(jayram);
            }
        }
        Member sai = memberRepo.findBySlug("sai-sandeep");
        if (sai == null) {
            sai = memberRepo.findBySlug("chloe-lee");
        }
        if (sai != null) {
            String saiBio = "KL University CSE student (ID: 2300033147) building end-to-end web experiences from API to UI.";
            String saiPhoto = "/images/sai-sandeep.jpg";
            boolean updated = false;
            if (!Objects.equals(sai.getName(), "K. Sai Sandeep")) {
                sai.setName("K. Sai Sandeep");
                updated = true;
            }
            if (!Objects.equals(sai.getRole(), "Full-Stack Engineer")) {
                sai.setRole("Full-Stack Engineer");
                updated = true;
            }
            if (!Objects.equals(sai.getBio(), saiBio)) {
                sai.setBio(saiBio);
                updated = true;
            }
            if (!Objects.equals(sai.getPhotoUrl(), saiPhoto)) {
                sai.setPhotoUrl(saiPhoto);
                updated = true;
            }
            if (!Objects.equals(sai.getSlug(), "sai-sandeep")) {
                sai.setSlug("sai-sandeep");
                updated = true;
            }
            String saiGithub = "https://github.com/k-sai-sandeep";
            String saiLinkedin = "https://www.linkedin.com/in/ksaisandeep/";
            String saiTwitter = "https://twitter.com/ksaisandeep";
            if (!Objects.equals(sai.getGithubUrl(), saiGithub)) {
                sai.setGithubUrl(saiGithub);
                updated = true;
            }
            if (!Objects.equals(sai.getLinkedinUrl(), saiLinkedin)) {
                sai.setLinkedinUrl(saiLinkedin);
                updated = true;
            }
            if (!Objects.equals(sai.getTwitterUrl(), saiTwitter)) {
                sai.setTwitterUrl(saiTwitter);
                updated = true;
            }
            if (updated) {
                memberRepo.save(sai);
            }
        }
    }
    private void syncProjects() {
        Map<String, Member> membersBySlug = memberRepo.findAll().stream()
            .filter(m -> m.getSlug() != null && !m.getSlug().isBlank())
            .collect(Collectors.toMap(Member::getSlug, Function.identity(), (a, b) -> a));

        List<ProjectSeed> seeds = List.of(
            new ProjectSeed(
                "Design System Kit",
                "Reusable components and tokens for multi-brand apps.",
                "react,storybook,design-system",
                "https://github.com/k-sai-sandeep/design-system-kit",
                "https://saisandeep.dev/design-system",
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
                "sai-sandeep"
            ),
            new ProjectSeed(
                "Realtime Chat App",
                "A WebSocket powered chat for teams with typing indicators and theme support.",
                "react,websocket,java,spring",
                "https://github.com/jai-ganesh/realtime-chat",
                "https://chat.jaiganesh.dev",
                "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=1200&q=80",
                "jai-ganesh"
            ),
            new ProjectSeed(
                "Accessibility Audit Toolkit",
                "Automated accessibility reporting for design handoffs and production builds.",
                "react,accessibility,testing",
                "https://github.com/jai-ganesh/a11y-toolkit",
                null,
                "https://images.unsplash.com/photo-1553532435-93d5f27156fc?auto=format&fit=crop&w=1200&q=80",
                "jai-ganesh"
            ),
            new ProjectSeed(
                "Service Mesh Gateway",
                "Unified gateway with rate limiting and tracing.",
                "spring,java,kubernetes,observability",
                "https://github.com/jayram-reddy/service-mesh-gateway",
                "https://jayram.dev/service-mesh",
                "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
                "jayram-reddy"
            ),
            new ProjectSeed(
                "ETL Orchestrator",
                "Scheduled data pipelines with visual monitoring.",
                "java,etl,sql",
                "https://github.com/jayram-reddy/etl-orchestrator",
                null,
                "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
                "jayram-reddy"
            ),
            new ProjectSeed(
                "DeployOps Dashboard",
                "CI/CD insights with environment rollbacks.",
                "devops,ci-cd,react",
                "https://github.com/k-sai-sandeep/deployops-dashboard",
                "https://ops.saisandeep.dev",
                "https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=1200&q=80",
                "sai-sandeep"
            )
        );

        for (ProjectSeed seed : seeds) {
            Member owner = membersBySlug.get(seed.ownerSlug());
            if (owner == null) {
                continue;
            }
            Project project = projectRepo.findByTitleIgnoreCase(seed.title()).orElseGet(Project::new);
            project.setTitle(seed.title());
            project.setDescription(seed.description());
            project.setTags(seed.tags());
            project.setRepoUrl(seed.repoUrl());
            project.setLiveUrl(seed.liveUrl());
            project.setImageUrl(seed.imageUrl());
            project.setOwner(owner);
            projectRepo.save(project);
        }
    }

    private static String slugify(String input) {
        if (input == null) return null;
        String norm = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        String s = norm.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        return s.isBlank() ? null : s;
    }

    private record ProjectSeed(
        String title,
        String description,
        String tags,
        String repoUrl,
        String liveUrl,
        String imageUrl,
        String ownerSlug
    ) {}
}




















