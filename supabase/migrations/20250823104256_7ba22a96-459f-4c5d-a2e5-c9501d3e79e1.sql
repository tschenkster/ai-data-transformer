-- Phase 1.1: Create reporting schema
CREATE SCHEMA IF NOT EXISTS reporting;

-- Phase 1.2: Rename primary key columns first (without touching table names yet)
-- coa_translation_sessions: id -> coa_translation_session_uuid
ALTER TABLE coa_translation_sessions RENAME COLUMN id TO coa_translation_session_uuid;

-- security_audit_log: id -> security_audit_log_uuid  
ALTER TABLE security_audit_log RENAME COLUMN id TO security_audit_log_uuid;

-- user_roles: id -> user_role_uuid
ALTER TABLE user_roles RENAME COLUMN id TO user_role_uuid;