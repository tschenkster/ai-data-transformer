-- Create RLS policies for new tables

-- Entity Groups policies
CREATE POLICY "Super admins can manage all entity groups" ON public.entity_groups
FOR ALL USING (is_super_admin_user());

CREATE POLICY "Entity admins can view their entity groups" ON public.entity_groups
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_entity_access uea 
    JOIN entities e ON e.entity_group_uuid = entity_groups.entity_group_uuid
    WHERE uea.user_account_uuid = (SELECT user_uuid FROM user_accounts WHERE supabase_user_uuid = auth.uid())
    AND uea.entity_uuid = e.entity_uuid 
    AND uea.is_active = true
    AND uea.access_level = 'entity_admin'
  )
);

-- Entities policies  
CREATE POLICY "Super admins can manage all entities" ON public.entities
FOR ALL USING (is_super_admin_user());

CREATE POLICY "Users can view entities they have access to" ON public.entities
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_entity_access uea
    WHERE uea.user_account_uuid = (SELECT user_uuid FROM user_accounts WHERE supabase_user_uuid = auth.uid())
    AND (uea.entity_uuid = entities.entity_uuid OR uea.entity_group_uuid = entities.entity_group_uuid)
    AND uea.is_active = true
  )
);

CREATE POLICY "Entity admins can update their entities" ON public.entities
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_entity_access uea
    WHERE uea.user_account_uuid = (SELECT user_uuid FROM user_accounts WHERE supabase_user_uuid = auth.uid())
    AND (uea.entity_uuid = entities.entity_uuid OR uea.entity_group_uuid = entities.entity_group_uuid)
    AND uea.is_active = true
    AND uea.access_level = 'entity_admin'
  )
);

-- User Entity Access policies
CREATE POLICY "Super admins can manage all user entity access" ON public.user_entity_access
FOR ALL USING (is_super_admin_user());

CREATE POLICY "Users can view their own access grants" ON public.user_entity_access
FOR SELECT USING (
  user_account_uuid = (SELECT user_uuid FROM user_accounts WHERE supabase_user_uuid = auth.uid())
);

CREATE POLICY "Entity admins can view access grants in their scope" ON public.user_entity_access
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_entity_access admin_access
    WHERE admin_access.user_account_uuid = (SELECT user_uuid FROM user_accounts WHERE supabase_user_uuid = auth.uid())
    AND (
      admin_access.entity_uuid = user_entity_access.entity_uuid OR 
      admin_access.entity_group_uuid = user_entity_access.entity_group_uuid
    )
    AND admin_access.is_active = true
    AND admin_access.access_level = 'entity_admin'
  )
);

CREATE POLICY "Entity admins can manage access grants in their scope" ON public.user_entity_access
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_entity_access admin_access
    WHERE admin_access.user_account_uuid = (SELECT user_uuid FROM user_accounts WHERE supabase_user_uuid = auth.uid())
    AND (
      admin_access.entity_uuid = user_entity_access.entity_uuid OR 
      admin_access.entity_group_uuid = user_entity_access.entity_group_uuid
    )
    AND admin_access.is_active = true
    AND admin_access.access_level = 'entity_admin'
  )
);

CREATE POLICY "Entity admins can update access grants in their scope" ON public.user_entity_access
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_entity_access admin_access
    WHERE admin_access.user_account_uuid = (SELECT user_uuid FROM user_accounts WHERE supabase_user_uuid = auth.uid())
    AND (
      admin_access.entity_uuid = user_entity_access.entity_uuid OR 
      admin_access.entity_group_uuid = user_entity_access.entity_group_uuid
    )
    AND admin_access.is_active = true
    AND admin_access.access_level = 'entity_admin'
  )
);