CREATE TABLE member (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    bio VARCHAR(2000),
    photo_url VARCHAR(255),
    github_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    twitter_url VARCHAR(255)
);

CREATE TABLE project (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    tags VARCHAR(255),
    repo_url VARCHAR(255),
    live_url VARCHAR(255),
    image_url VARCHAR(255),
    owner_id BIGINT,
    CONSTRAINT fk_project_owner FOREIGN KEY (owner_id) REFERENCES member(id) ON DELETE SET NULL
);

CREATE TABLE contact_message (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message VARCHAR(4000) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO member (id, slug, name, role, bio, photo_url, github_url, linkedin_url, twitter_url) VALUES
    (1, 'jai-ganesh', 'P. Jai Ganesh', 'Frontend Engineer', 'KL University CSE student (ID: 2300030829) focused on crafting accessible, performant web interfaces.', '/images/jai-ganesh.jpg', 'https://github.com/jai-ganesh', 'https://www.linkedin.com/in/jai-ganesh/', 'https://twitter.com/jai_ganesh'),
    (2, 'jayram-reddy', 'Jayram Reddy K', 'Backend Engineer', 'KL University CSE student (ID: 2300030372), third-year first semester, focused on backend and platform reliability.', '/images/jayram-reddy.jpg', 'https://github.com/jayram-reddy', 'https://www.linkedin.com/in/jayram-reddy/', 'https://twitter.com/jayramreddy'),
    (3, 'sai-sandeep', 'K. Sai Sandeep', 'Full-Stack Engineer', 'KL University CSE student (ID: 2300033147) building end-to-end web experiences from API to UI.', '/images/sai-sandeep.jpg', 'https://github.com/k-sai-sandeep', 'https://www.linkedin.com/in/ksaisandeep/', 'https://twitter.com/ksaisandeep');

SELECT setval('member_id_seq', (SELECT MAX(id) FROM member));

INSERT INTO project (id, title, description, tags, repo_url, live_url, image_url, owner_id) VALUES
    (1, 'Design System Kit', 'Reusable components and tokens for multi-brand apps.', 'react,storybook,design-system', 'https://github.com/k-sai-sandeep/design-system-kit', 'https://saisandeep.dev/design-system', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', 3),
    (2, 'Realtime Chat App', 'A WebSocket powered chat for teams with typing indicators and theme support.', 'react,websocket,java,spring', 'https://github.com/jai-ganesh/realtime-chat', 'https://chat.jaiganesh.dev', 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=1200&q=80', 1),
    (3, 'Accessibility Audit Toolkit', 'Automated accessibility reporting for design handoffs and production builds.', 'react,accessibility,testing', 'https://github.com/jai-ganesh/a11y-toolkit', NULL, 'https://images.unsplash.com/photo-1553532435-93d5f27156fc?auto=format&fit=crop&w=1200&q=80', 1),
    (4, 'Service Mesh Gateway', 'Unified gateway with rate limiting and tracing.', 'spring,java,kubernetes,observability', 'https://github.com/jayram-reddy/service-mesh-gateway', 'https://jayram.dev/service-mesh', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', 2),
    (5, 'ETL Orchestrator', 'Scheduled data pipelines with visual monitoring.', 'java,etl,sql', 'https://github.com/jayram-reddy/etl-orchestrator', NULL, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80', 2),
    (6, 'DeployOps Dashboard', 'CI/CD insights with environment rollbacks.', 'devops,ci-cd,react', 'https://github.com/k-sai-sandeep/deployops-dashboard', 'https://ops.saisandeep.dev', 'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=1200&q=80', 3);

SELECT setval('project_id_seq', (SELECT MAX(id) FROM project));
