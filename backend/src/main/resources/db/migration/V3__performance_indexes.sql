-- Performance indexes for portfolio application
-- Created to optimize common query patterns

-- Index for app_user table
-- Note: app_user.email already has UNIQUE constraint, so no additional index needed
CREATE INDEX idx_app_user_role ON app_user(role);
CREATE INDEX idx_app_user_created_at ON app_user(created_at);

-- Index for profile table
CREATE INDEX idx_profile_user_id ON profile(user_id);
-- Note: profile.slug already has UNIQUE constraint, so no additional index needed
CREATE INDEX idx_profile_display_name ON profile(display_name);
CREATE INDEX idx_profile_created_at ON profile(created_at);
CREATE INDEX idx_profile_updated_at ON profile(updated_at);

-- Index for experience table
CREATE INDEX idx_experience_profile_id ON experience(profile_id);
CREATE INDEX idx_experience_current ON experience(current);
CREATE INDEX idx_experience_start_date ON experience(start_date);
CREATE INDEX idx_experience_end_date ON experience(end_date);
CREATE INDEX idx_experience_order_index ON experience(order_index);
CREATE INDEX idx_experience_profile_order ON experience(profile_id, order_index);

-- Index for profile_project table
CREATE INDEX idx_profile_project_profile_id ON profile_project(profile_id);
CREATE INDEX idx_profile_project_title ON profile_project(title);
CREATE INDEX idx_profile_project_created_at ON profile_project(created_at);
CREATE INDEX idx_profile_project_updated_at ON profile_project(updated_at);

-- Index for contact_message table
CREATE INDEX idx_contact_message_email ON contact_message(email);
CREATE INDEX idx_contact_message_created_at ON contact_message(created_at);

-- Note: refresh_token table indexes are created in V4 migration

-- Composite indexes for common query patterns
CREATE INDEX idx_profile_user_slug ON profile(user_id, slug);
CREATE INDEX idx_experience_profile_current ON experience(profile_id, current);
CREATE INDEX idx_experience_profile_dates ON experience(profile_id, start_date, end_date);

-- Full-text search indexes (PostgreSQL specific)
CREATE INDEX idx_profile_search ON profile USING gin(to_tsvector('english', display_name || ' ' || COALESCE(headline, '') || ' ' || COALESCE(bio, '')));
CREATE INDEX idx_profile_project_search ON profile_project USING gin(to_tsvector('english', title || ' ' || COALESCE(summary, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(tags, '')));
CREATE INDEX idx_experience_search ON experience USING gin(to_tsvector('english', title || ' ' || COALESCE(company, '') || ' ' || COALESCE(description, '')));

-- Partial indexes for performance optimization
CREATE INDEX idx_profile_with_github ON profile(github_url) WHERE github_url IS NOT NULL;
CREATE INDEX idx_profile_with_linkedin ON profile(linkedin_url) WHERE linkedin_url IS NOT NULL;
CREATE INDEX idx_profile_project_with_repo ON profile_project(repo_url) WHERE repo_url IS NOT NULL;
CREATE INDEX idx_profile_project_with_live ON profile_project(live_url) WHERE live_url IS NOT NULL;