-- Initialize Translation System Database
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create database if it doesn't exist (handled by POSTGRES_DB env var)
-- CREATE DATABASE IF NOT EXISTS translation_system;

-- Set timezone
SET timezone = 'UTC';

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'translator', 'reviewer', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE segment_status AS ENUM ('new', 'in_progress', 'translated', 'reviewed', 'approved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ai_provider AS ENUM ('openai', 'deepl', 'google', 'azure', 'offline_model');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance (will be created by Prisma migrations)
-- These are just examples of what will be needed

-- Full-text search indexes
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS segments_source_text_gin_idx ON segments USING gin(to_tsvector('english', source_text));
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS segments_target_text_gin_idx ON segments USING gin(to_tsvector('english', target_text));

-- Trigram indexes for fuzzy matching
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS segments_source_text_trgm_idx ON segments USING gin(source_text gin_trgm_ops);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS translation_memory_source_text_trgm_idx ON translation_memory USING gin(source_text gin_trgm_ops);

-- Performance indexes
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS segments_project_id_status_idx ON segments(project_id, status);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS segments_project_id_created_at_idx ON segments(project_id, created_at);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS translation_memory_languages_idx ON translation_memory(source_language, target_language);

-- Log successful initialization
INSERT INTO pg_stat_statements_info VALUES ('translation_system_init', now()) ON CONFLICT DO NOTHING;
