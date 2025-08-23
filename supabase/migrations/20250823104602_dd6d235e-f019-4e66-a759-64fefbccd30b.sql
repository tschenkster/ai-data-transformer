-- Phase 1.4: Update RLS policies for renamed tables
-- Drop old policies and create new ones for security_audit_logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON security_audit_logs;
CREATE POLICY "Admins can view audit logs" 
ON security_audit_logs 
FOR SELECT 
USING (is_admin_user_v2());

-- Update policies for report_structure_change_logs
DROP POLICY IF EXISTS "Users can insert their own change logs" ON report_structure_change_logs;
DROP POLICY IF EXISTS "Users can update their own change logs for undo" ON report_structure_change_logs;  
DROP POLICY IF EXISTS "Admins can view all change logs" ON report_structure_change_logs;

CREATE POLICY "Users can insert their own change logs" 
ON report_structure_change_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_uuid);

CREATE POLICY "Users can update their own change logs for undo" 
ON report_structure_change_logs 
FOR UPDATE 
USING ((auth.uid() = user_uuid) OR is_admin_user());

CREATE POLICY "Admins can view all change logs" 
ON report_structure_change_logs 
FOR ALL 
USING (is_admin_user());