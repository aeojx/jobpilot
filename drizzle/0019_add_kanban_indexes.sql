-- Add indexes to eliminate full table scan on Kanban queries
-- Index on status for WHERE status IN (...) filtering
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- Composite index on (status, matchScore DESC, createdAt DESC) for the sorted Kanban query
CREATE INDEX IF NOT EXISTS idx_jobs_status_score ON jobs(status, matchScore DESC, createdAt DESC);

-- Index on matchScore for ORDER BY matchScore DESC
CREATE INDEX IF NOT EXISTS idx_jobs_match_score ON jobs(matchScore DESC);
