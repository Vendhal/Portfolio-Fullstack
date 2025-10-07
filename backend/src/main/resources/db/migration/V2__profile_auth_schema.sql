CREATE TABLE app_user (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profile (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES app_user(id) ON DELETE CASCADE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    headline VARCHAR(255),
    bio VARCHAR(4000),
    location VARCHAR(255),
    photo_url VARCHAR(255),
    github_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    twitter_url VARCHAR(255),
    website_url VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE experience (
    id BIGSERIAL PRIMARY KEY,
    profile_id BIGINT NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    location VARCHAR(255),
    start_date DATE,
    end_date DATE,
    current BOOLEAN NOT NULL DEFAULT FALSE,
    description VARCHAR(2000),
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profile_project (
    id BIGSERIAL PRIMARY KEY,
    profile_id BIGINT NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    summary VARCHAR(500),
    description VARCHAR(2000),
    tags VARCHAR(255),
    repo_url VARCHAR(255),
    live_url VARCHAR(255),
    image_url VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- seed admin account
INSERT INTO app_user (email, password_hash, role)
VALUES ('admin@portfolio.local', '$2a$10$7Q7gBzix8VGo1XHo9dZYhOQb1t/F7fs/3Gzdh0dX8GZFODdgNpTi2', 'ADMIN');

WITH member_source AS (
    SELECT m.*, CONCAT(m.slug, '@portfolio.local') AS generated_email
    FROM member m
),
member_users AS (
    INSERT INTO app_user (email, password_hash, role)
    SELECT generated_email,
           '$2a$10$7Q7gBzix8VGo1XHo9dZYhOQb1t/F7fs/3Gzdh0dX8GZFODdgNpTi2',
           'USER'
    FROM member_source
    ORDER BY id
    RETURNING id, email
)
INSERT INTO profile (user_id, slug, display_name, headline, bio, photo_url, github_url, linkedin_url, twitter_url)
SELECT mu.id,
       ms.slug,
       ms.name,
       ms.role,
       ms.bio,
       ms.photo_url,
       ms.github_url,
       ms.linkedin_url,
       ms.twitter_url
FROM member_source ms
JOIN member_users mu ON mu.email = ms.generated_email;

INSERT INTO profile_project (id, profile_id, title, summary, description, tags, repo_url, live_url, image_url)
SELECT pr.id,
       (SELECT p.id FROM profile p WHERE p.slug = m.slug),
       pr.title,
       NULL,
       pr.description,
       pr.tags,
       pr.repo_url,
       pr.live_url,
       pr.image_url
FROM project pr
JOIN member m ON m.id = pr.owner_id;

DROP TABLE project;
DROP TABLE member;

SELECT setval('app_user_id_seq', COALESCE((SELECT MAX(id) FROM app_user), 1));
SELECT setval('profile_id_seq', COALESCE((SELECT MAX(id) FROM profile), 1));
SELECT setval('profile_project_id_seq', COALESCE((SELECT MAX(id) FROM profile_project), 1));