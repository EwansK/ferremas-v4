-- Fix Admin Service Database Issues
-- Add missing tables and columns for admin service to work properly

-- 1. Create the missing activity_logs table that admin service expects
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add missing columns to users table for admin service
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- 3. Create indexes for the activity_logs table
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- 4. Add a trigger to update the updated_at column when users are modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Insert some sample activity logs for testing
INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'login', '{"login_method": "email", "success": true}', '127.0.0.1'),
('550e8400-e29b-41d4-a716-446655440002', 'product_created', '{"product_name": "Test Product", "category": "Tools"}', '192.168.1.100'),
('550e8400-e29b-41d4-a716-446655440001', 'user_viewed', '{"section": "dashboard", "page": "analytics"}', '127.0.0.1')
ON CONFLICT DO NOTHING;

-- 6. Verify the setup
SELECT 'activity_logs table created successfully' AS status,
       (SELECT COUNT(*) FROM activity_logs) AS sample_records;