import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteUserRequest {
  userAccountUuid?: string;
  userId?: string; // Keep for backward compatibility
  userEmail: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create supabase client with anon key for user verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const ADMIN_EMAILS = ['thomas@cfo-team.de'];
    if (!ADMIN_EMAILS.includes(user.email || '')) {
      return new Response(
        JSON.stringify({ error: 'Insufficient privileges' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userAccountUuid, userId, userEmail }: DeleteUserRequest = await req.json();

    // Validate input - support both new and old parameter names
    const userIdToDelete = userAccountUuid || userId;
    if (!userIdToDelete || !userEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing user identifier or userEmail' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent deletion of super admin accounts
    const SUPER_ADMIN_EMAILS = ['thomas@cfo-team.de'];
    if (SUPER_ADMIN_EMAILS.includes(userEmail)) {
      return new Response(
        JSON.stringify({ error: 'Super admin accounts cannot be deleted to prevent system lockout' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client for user deletion
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // First, get the actual supabase_user_uuid from user_accounts table to delete from auth.users
    const { data: userAccountData, error: fetchError } = await supabaseAdmin
      .from('user_accounts')
      .select('supabase_user_uuid')
      .eq('user_account_uuid', userIdToDelete)
      .single();

    if (fetchError || !userAccountData) {
      console.error('Error fetching user account:', fetchError);
      return new Response(
        JSON.stringify({ error: 'User account not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user exists in auth.users before attempting deletion
    let authUserExists = true;
    let deletionMessage = '';
    
    try {
      const { data: authUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userAccountData.supabase_user_uuid);
      
      if (getUserError || !authUser.user) {
        console.log(`User ${userAccountData.supabase_user_uuid} not found in auth.users, will only clean up user_accounts table`);
        authUserExists = false;
        deletionMessage = 'User account cleaned up (auth user already removed)';
      }
    } catch (error) {
      console.log(`Error checking user existence: ${error.message}, treating as non-existent`);
      authUserExists = false;
      deletionMessage = 'User account cleaned up (auth user check failed)';
    }

    // Delete from auth.users only if user exists there
    if (authUserExists) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userAccountData.supabase_user_uuid);
      
      if (deleteError) {
        console.error('Error deleting user from auth:', deleteError);
        
        // If auth deletion fails due to user not found, continue with user_accounts cleanup
        if (deleteError.message.includes('User not found')) {
          console.log('User not found in auth, proceeding with user_accounts cleanup');
          deletionMessage = 'User account cleaned up (auth user not found)';
        } else {
          // For other errors, return error response
          return new Response(
            JSON.stringify({ error: 'Failed to delete user', details: deleteError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        deletionMessage = 'User deleted successfully from both auth and accounts';
      }
    }

    // If auth deletion failed or user didn't exist in auth, manually clean up user_accounts
    if (!authUserExists || deletionMessage.includes('auth user not found')) {
      const { error: accountDeleteError } = await supabaseAdmin
        .from('user_accounts')
        .delete()
        .eq('user_account_uuid', userIdToDelete);

      if (accountDeleteError) {
        console.error('Error deleting from user_accounts:', accountDeleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to delete user account', details: accountDeleteError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`User ${userEmail} (${userIdToDelete}) deleted successfully by ${user.email}. ${deletionMessage}`);

    return new Response(
      JSON.stringify({ success: true, message: deletionMessage }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-user function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});