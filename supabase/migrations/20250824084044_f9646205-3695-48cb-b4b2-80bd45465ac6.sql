-- Phase 1: Core Entity & Entity Group Tables

-- Create entity_groups table
CREATE TABLE public.entity_groups (
  entity_group_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
  entity_group_id INTEGER GENERATED ALWAYS AS IDENTITY,
  entity_group_name TEXT NOT NULL,
  entity_group_code TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_user_uuid UUID,
  
  CONSTRAINT pk_entity_groups PRIMARY KEY (entity_group_uuid),
  CONSTRAINT uq_entity_groups_id UNIQUE (entity_group_id),
  CONSTRAINT uq_entity_groups_code UNIQUE (entity_group_code),
  CONSTRAINT fk_entity_groups_created_by FOREIGN KEY (created_by_user_uuid) REFERENCES user_accounts(user_uuid)
);

-- Enable RLS on entity_groups
ALTER TABLE public.entity_groups ENABLE ROW LEVEL SECURITY;

-- Create entities table
CREATE TABLE public.entities (
  entity_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
  entity_id INTEGER GENERATED ALWAYS AS IDENTITY,
  entity_name TEXT NOT NULL,
  entity_code TEXT NOT NULL,
  entity_group_uuid UUID NOT NULL,
  entity_group_id INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_user_uuid UUID,
  
  CONSTRAINT pk_entities PRIMARY KEY (entity_uuid),
  CONSTRAINT uq_entities_id UNIQUE (entity_id),
  CONSTRAINT uq_entities_code UNIQUE (entity_code),
  CONSTRAINT fk_entities_entity_group FOREIGN KEY (entity_group_uuid) REFERENCES entity_groups(entity_group_uuid),
  CONSTRAINT fk_entities_created_by FOREIGN KEY (created_by_user_uuid) REFERENCES user_accounts(user_uuid)
);

-- Enable RLS on entities
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

-- Create access_level enum
CREATE TYPE public.access_level AS ENUM ('viewer', 'entity_admin');

-- Create user_entity_access table
CREATE TABLE public.user_entity_access (
  user_entity_access_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
  user_entity_access_id INTEGER GENERATED ALWAYS AS IDENTITY,
  user_account_uuid UUID NOT NULL,
  user_account_id INTEGER NOT NULL,
  entity_uuid UUID,
  entity_id INTEGER,
  entity_group_uuid UUID,
  entity_group_id INTEGER,
  access_level public.access_level NOT NULL,
  granted_by_user_uuid UUID,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  CONSTRAINT pk_user_entity_access PRIMARY KEY (user_entity_access_uuid),
  CONSTRAINT uq_user_entity_access_id UNIQUE (user_entity_access_id),
  CONSTRAINT fk_user_entity_access_user FOREIGN KEY (user_account_uuid) REFERENCES user_accounts(user_uuid),
  CONSTRAINT fk_user_entity_access_entity FOREIGN KEY (entity_uuid) REFERENCES entities(entity_uuid),
  CONSTRAINT fk_user_entity_access_entity_group FOREIGN KEY (entity_group_uuid) REFERENCES entity_groups(entity_group_uuid),
  CONSTRAINT fk_user_entity_access_granted_by FOREIGN KEY (granted_by_user_uuid) REFERENCES user_accounts(user_uuid),
  CONSTRAINT chk_entity_or_group CHECK (
    (entity_uuid IS NOT NULL AND entity_group_uuid IS NULL) OR 
    (entity_uuid IS NULL AND entity_group_uuid IS NOT NULL)
  )
);

-- Enable RLS on user_entity_access
ALTER TABLE public.user_entity_access ENABLE ROW LEVEL SECURITY;

-- Add new enum values for roles (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'viewer' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
        ALTER TYPE app_role ADD VALUE 'viewer';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'entity_admin' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
        ALTER TYPE app_role ADD VALUE 'entity_admin';
    END IF;
END $$;

-- Add integer ID to user_roles table (check if column doesn't exist first)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'user_role_id') THEN
        ALTER TABLE public.user_roles ADD COLUMN user_role_id INTEGER GENERATED ALWAYS AS IDENTITY;
        ALTER TABLE public.user_roles ADD CONSTRAINT uq_user_roles_id UNIQUE (user_role_id);
    END IF;
END $$;

-- Add updated_at triggers for new tables
CREATE TRIGGER update_entity_groups_updated_at
  BEFORE UPDATE ON public.entity_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_entities_updated_at
  BEFORE UPDATE ON public.entities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Create default entity group and entity for migration
INSERT INTO public.entity_groups (entity_group_name, entity_group_code, description)
VALUES ('Default Organization', 'DEFAULT_ORG', 'Legacy data entity group')
ON CONFLICT (entity_group_code) DO NOTHING;

INSERT INTO public.entities (entity_name, entity_code, entity_group_uuid, entity_group_id, description)
SELECT 'Default Entity', 'DEFAULT_ENTITY', 
       eg.entity_group_uuid, eg.entity_group_id,
       'Legacy data entity'
FROM entity_groups eg
WHERE eg.entity_group_code = 'DEFAULT_ORG'
ON CONFLICT (entity_code) DO NOTHING;