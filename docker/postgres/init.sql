-- AutoCareX PostgreSQL initialization
-- This runs once when the container is first created

CREATE DATABASE autocareX_dev;
CREATE DATABASE autocareX_test;

-- Grant all privileges to the autocareX user
GRANT ALL PRIVILEGES ON DATABASE autocareX_dev TO autocareX;
GRANT ALL PRIVILEGES ON DATABASE autocareX_test TO autocareX;
