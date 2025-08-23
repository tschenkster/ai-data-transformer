-- Phase 1.3: Rename audit tables to plural '_logs' format
-- report_structures_change_log -> report_structure_change_logs
ALTER TABLE report_structures_change_log RENAME TO report_structure_change_logs;

-- security_audit_log -> security_audit_logs  
ALTER TABLE security_audit_log RENAME TO security_audit_logs;