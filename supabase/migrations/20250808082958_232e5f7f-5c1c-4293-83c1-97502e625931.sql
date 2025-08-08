-- Add missing integer IDs to complete dual ID strategy compliance

-- Add integer ID to account_mappings table (as second column)
ALTER TABLE public.account_mappings 
ADD COLUMN account_mapping_id SERIAL;

-- Set starting value to 1000 and add uniqueness constraint
ALTER SEQUENCE account_mappings_account_mapping_id_seq RESTART WITH 1000;
ALTER TABLE public.account_mappings 
ADD CONSTRAINT account_mappings_account_mapping_id_unique UNIQUE (account_mapping_id);

-- Add integer ID to mapping_decisions table (as second column)
ALTER TABLE public.mapping_decisions 
ADD COLUMN mapping_decision_id SERIAL;

-- Set starting value to 1000 and add uniqueness constraint
ALTER SEQUENCE mapping_decisions_mapping_decision_id_seq RESTART WITH 1000;
ALTER TABLE public.mapping_decisions 
ADD CONSTRAINT mapping_decisions_mapping_decision_id_unique UNIQUE (mapping_decision_id);

-- Add integer ID to mapping_sessions table (as second column)
ALTER TABLE public.mapping_sessions 
ADD COLUMN mapping_session_id SERIAL;

-- Set starting value to 1000 and add uniqueness constraint
ALTER SEQUENCE mapping_sessions_mapping_session_id_seq RESTART WITH 1000;
ALTER TABLE public.mapping_sessions 
ADD CONSTRAINT mapping_sessions_mapping_session_id_unique UNIQUE (mapping_session_id);

-- Add integer ID to user_accounts table (as second column)
ALTER TABLE public.user_accounts 
ADD COLUMN user_account_id SERIAL;

-- Set starting value to 1000 and add uniqueness constraint
ALTER SEQUENCE user_accounts_user_account_id_seq RESTART WITH 1000;
ALTER TABLE public.user_accounts 
ADD CONSTRAINT user_accounts_user_account_id_unique UNIQUE (user_account_id);

-- Add performance indexes on the new integer IDs
CREATE INDEX idx_account_mappings_account_mapping_id ON public.account_mappings (account_mapping_id);
CREATE INDEX idx_mapping_decisions_mapping_decision_id ON public.mapping_decisions (mapping_decision_id);
CREATE INDEX idx_mapping_sessions_mapping_session_id ON public.mapping_sessions (mapping_session_id);
CREATE INDEX idx_user_accounts_user_account_id ON public.user_accounts (user_account_id);