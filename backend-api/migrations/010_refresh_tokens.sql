-- Migration: Add refresh tokens table
-- Created: 2026-01-06

-- Create refresh tokens table for JWT token management
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_revoked BOOLEAN DEFAULT FALSE,
  device_info JSONB,
  ip_address INET
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked);

-- Create composite index for active tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active 
ON refresh_tokens(user_id, is_revoked, expires_at) 
WHERE is_revoked = FALSE;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_refresh_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_refresh_tokens_updated_at
  BEFORE UPDATE ON refresh_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_refresh_tokens_updated_at();

-- Add cleanup function for expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM refresh_tokens 
  WHERE expires_at < NOW() OR is_revoked = TRUE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add audit log table for security events
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'token_refresh', 'token_revoked', etc.
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_ip_address ON security_audit_log(ip_address);

-- Add function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_event_type VARCHAR(50),
  p_ip_address INET,
  p_user_agent TEXT,
  p_success BOOLEAN,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO security_audit_log (
    user_id, event_type, ip_address, user_agent, success, details
  ) VALUES (
    p_user_id, p_event_type, p_ip_address, p_user_agent, p_success, p_details
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Add rate limiting table
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  requests_count INTEGER DEFAULT 1,
  window_start TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_ip_endpoint ON rate_limit_log(ip_address, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_window_start ON rate_limit_log(window_start);

-- Add cleanup function for old rate limit logs
CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Keep only last 24 hours of rate limit logs
  DELETE FROM rate_limit_log 
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add user sessions table for better session management
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  refresh_token_id UUID REFERENCES refresh_tokens(id) ON DELETE CASCADE,
  device_info JSONB,
  ip_address INET,
  last_activity TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token_id ON user_sessions(refresh_token_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- Add function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity(p_session_token VARCHAR(255))
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_sessions 
  SET last_activity = NOW()
  WHERE session_token = p_session_token AND is_active = TRUE;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE refresh_tokens IS 'Stores refresh tokens for JWT authentication with rotation support';
COMMENT ON TABLE security_audit_log IS 'Logs security-related events for monitoring and compliance';
COMMENT ON TABLE rate_limit_log IS 'Tracks API rate limiting per IP and endpoint';
COMMENT ON TABLE user_sessions IS 'Manages user sessions with device tracking and activity monitoring';

COMMENT ON COLUMN refresh_tokens.token_hash IS 'Hashed refresh token for security';
COMMENT ON COLUMN refresh_tokens.device_info IS 'JSON object containing device information';
COMMENT ON COLUMN security_audit_log.event_type IS 'Type of security event (login, logout, token_refresh, etc.)';
COMMENT ON COLUMN user_sessions.session_token IS 'Unique session identifier';
COMMENT ON COLUMN user_sessions.device_info IS 'JSON object containing device and browser information';