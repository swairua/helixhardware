import { useState, useEffect } from 'react';
import { getDatabase } from '@/integrations/database';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, UserProfile, UserRole, UserStatus } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { parseErrorMessage, parseErrorMessageWithCodes } from '@/utils/errorHelpers';
import { logUserCreation, logUserApproval } from '@/utils/auditLogger';

export interface UserInvitation {
  id: string;
  email: string;
  role: UserRole;
  company_id: string;
  invited_by: string;
  invited_at: string;
  expires_at: string;
  accepted_at?: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invitation_token: string;
  is_approved?: boolean;
  approved_by?: string;
  approved_at?: string;
}

export interface CreateUserData {
  email: string;
  full_name?: string;
  role: UserRole;
  phone?: string;
  department?: string;
  position?: string;
  password?: string; // optional: admin can set password directly
  company_id?: string; // optional: super-admin can assign company when creating users
}

export interface UpdateUserData {
  full_name?: string;
  role?: UserRole;
  status?: UserStatus;
  phone?: string;
  department?: string;
  position?: string;
}

export const useUserManagement = () => {
  const { profile: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all users in the same company
  const fetchUsers = async () => {
    if (!isAdmin) {
      console.log('fetchUsers: User is not admin, skipping fetch');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching users for company:', currentUser?.company_id);
      const db = getDatabase();

      // Build filter based on company_id if user has one
      let filter: Record<string, any> = {};
      if (currentUser?.company_id) {
        filter.company_id = currentUser.company_id;
      }

      const { data, error } = await db.select('profiles', filter);

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      console.log('Fetched users:', data?.length || 0, 'users');
      setUsers((data || []) as UserProfile[]);
    } catch (err) {
      console.error('Error fetching users:', err);
      let errorMessage = 'Unknown error occurred';
      try {
        errorMessage = parseErrorMessage(err);
      } catch (parseErr) {
        console.error('parseErrorMessage failed for fetchUsers:', parseErr);
        errorMessage = err?.message || String(err);
      }

      // Ensure string and try JSON stringify for objects
      if (typeof errorMessage !== 'string') {
        try {
          errorMessage = JSON.stringify(errorMessage);
        } catch (jsonErr) {
          errorMessage = String(errorMessage);
        }
      }

      setError(`Failed to fetch users: ${errorMessage}`);
      toast.error(`Error fetching users: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending invitations
  const fetchInvitations = async () => {
    if (!isAdmin) {
      return;
    }

    try {
      const query = supabase
        .from('user_invitations')
        .select('*')
        .order('invited_at', { ascending: false });

      if (currentUser?.company_id) {
        query.eq('company_id', currentUser.company_id);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setInvitations(data || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);

      // Ensure we get a proper string error message
      let errorMessage = 'Unknown error occurred';
      try {
        errorMessage = parseErrorMessage(err);
      } catch (parseErr) {
        console.error('Error parsing error message for invitations:', parseErr);
        errorMessage = err?.message || String(err) || 'Failed to parse error';
      }

      if (typeof errorMessage !== 'string') {
        try {
          errorMessage = JSON.stringify(errorMessage);
        } catch (jsonErr) {
          errorMessage = String(errorMessage);
        }
      }

      setError(`Failed to fetch invitations: ${errorMessage}`);
      toast.error(`Error fetching invitations: ${errorMessage}`);
    }
  };

  // Create a new user (admin only) - Creates fully qualified user via admin edge function
  const createUser = async (userData: CreateUserData): Promise<{ success: boolean; password?: string; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized: Only administrators can create users' };
    }

    if (!userData.password || userData.password.length < 8) {
      return { success: false, error: 'Password is required (min 8 characters)' };
    }

    setLoading(true);

    try {
      // Check if user already exists in profiles
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userData.email)
        .maybeSingle();

      if (existingUser) {
        return { success: false, error: 'User with this email already exists' };
      }

      const companyToSet = userData.company_id || currentUser?.company_id;

      // If no company is provided, try to get the first company
      let finalCompanyId = companyToSet;
      if (!finalCompanyId) {
        const { data: companies } = await supabase
          .from('companies')
          .select('id')
          .limit(1)
          .single();
        finalCompanyId = companies?.id;
      }

      if (!finalCompanyId) {
        return { success: false, error: 'No company available. Please create a company first.' };
      }

      // Validate that the company actually exists
      const { data: companyExists } = await supabase
        .from('companies')
        .select('id')
        .eq('id', finalCompanyId)
        .maybeSingle();

      if (!companyExists) {
        return { success: false, error: 'The selected company no longer exists. Please refresh and try again.' };
      }

      // Validate that admin can create users in this company (if not super-admin)
      if (currentUser?.company_id && currentUser.company_id !== finalCompanyId) {
        return { success: false, error: 'You can only create users for your own company' };
      }

      // If password is provided, create the user directly using the API endpoint
      if (userData.password) {
        try {
          const response = await fetch('/api/admin/users/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: userData.email,
              password: userData.password,
              full_name: userData.full_name,
              role: userData.role,
              company_id: finalCompanyId,
              invited_by: currentUser?.id,
              phone: userData.phone,
              department: userData.department,
              position: userData.position,
            }),
          });

          // Defensively parse JSON
          const result = await response.json().catch(() => {
            if (!response.ok) {
              throw new Error(`Server error: HTTP ${response.status}. Failed to create user.`);
            }
            throw new Error('Invalid response from server: Expected valid JSON');
          });

          if (!response.ok) {
            console.error('API error:', result);
            return { success: false, error: result.error || 'Failed to create user' };
          }

          if (!result.success) {
            return { success: false, error: result.error || 'Failed to create user' };
          }

          // Log user creation in audit trail
          try {
            await logUserCreation(result.user_id, userData.email, userData.role as UserRole, finalCompanyId);
          } catch (auditError) {
            console.error('Failed to log user creation:', auditError);
          }

          toast.success(`User ${userData.email} created successfully and is ready to login.`);
          await fetchUsers();
          return { success: true, password: userData.password };
        } catch (err) {
          console.error('Error calling user creation API:', err);
          return { success: false, error: `Failed to create user: ${err instanceof Error ? err.message : String(err)}` };
        }
      }

      // If no password provided, create an invitation instead
      const { data: existingInvitation } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('email', userData.email)
        .eq('company_id', finalCompanyId)
        .in('status', ['pending', 'accepted'])
        .maybeSingle();

      let invitation = existingInvitation;

      // If no existing pending/accepted invitation, create a new one
      if (!existingInvitation) {
        const { data: newInvitation, error: inviteError } = await supabase
          .from('user_invitations')
          .insert({
            email: userData.email,
            role: userData.role,
            company_id: finalCompanyId,
            invited_by: currentUser?.id,
            is_approved: true,
            approved_by: currentUser?.id,
            approved_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (inviteError) {
          console.error('Invitation creation error:', inviteError);
          return { success: false, error: `Failed to create invitation: ${inviteError.message}` };
        }

        if (!newInvitation?.id) {
          return { success: false, error: 'Failed to create invitation' };
        }

        invitation = newInvitation;
      } else {
        // Update existing invitation to ensure it's approved and current role is set
        const { error: updateError } = await supabase
          .from('user_invitations')
          .update({
            role: userData.role,
            is_approved: true,
            approved_by: currentUser?.id,
            approved_at: new Date().toISOString(),
          })
          .eq('id', existingInvitation.id);

        if (updateError) {
          console.warn('Failed to update existing invitation:', updateError);
          // Continue anyway - invitation still exists and is usable
        }
      }

      // Log user creation in audit trail
      try {
        if (invitation?.id) {
          await logUserCreation(invitation.id, userData.email, userData.role as UserRole, finalCompanyId);
        }
      } catch (auditError) {
        console.error('Failed to log user creation:', auditError);
      }

      toast.success(`Pre-approved invitation ready for ${userData.email}. User can sign up and will be immediately active.`);
      await fetchInvitations();

      return { success: true, password: userData.password };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'user creation');
      console.error('Error creating user:', errorMessage, err);
      toast.error(`Failed to create user: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update user (admin only)
  const updateUser = async (userId: string, userData: UpdateUserData): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      toast.error('You do not have permission to update users');
      return { success: false, error: 'Unauthorized' };
    }

    setLoading(true);

    try {
      console.log('Attempting to update user via external API:', { userId, userData });

      const db = getDatabase();
      const { error } = await db.update('profiles', userId, userData);

      if (error) {
        console.error('Database returned error:', error);
        throw error;
      }

      console.log('User updated successfully');
      toast.success('User updated successfully');
      await fetchUsers();
      return { success: true };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'user update');
      console.error('Error updating user:', err);
      console.error('Full error object:', JSON.stringify(err, null, 2));
      toast.error(`Failed to update user: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Delete user (admin only)
  const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin || userId === currentUser?.id) {
      return { success: false, error: 'Cannot delete yourself or unauthorized' };
    }

    setLoading(true);

    try {
      // Delete from profiles table - this will cascade to auth.users if foreign key is set
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (deleteError) {
        throw deleteError;
      }

      toast.success('User deleted successfully');
      await fetchUsers();
      return { success: true };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'user deletion');
      console.error('Error deleting user:', err);
      toast.error(`Failed to delete user: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Invite user via email
  const inviteUser = async (email: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin || !currentUser?.company_id) {
      return { success: false, error: 'Unauthorized' };
    }

    setLoading(true);

    try {
      // Validate that the company still exists
      const { data: companyExists } = await supabase
        .from('companies')
        .select('id')
        .eq('id', currentUser.company_id)
        .maybeSingle();

      if (!companyExists) {
        return { success: false, error: 'Your company no longer exists in the system. Please contact support.' };
      }

      // Validate that the current user (inviter) still exists
      const { data: inviterExists } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!inviterExists) {
        return { success: false, error: 'Your user profile no longer exists. Please sign in again.' };
      }

      // Check if user already exists or has pending invitation
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        return { success: false, error: 'User with this email already exists' };
      }

      const { data: existingInvitation } = await supabase
        .from('user_invitations')
        .select('id')
        .eq('email', email)
        .eq('company_id', currentUser.company_id)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingInvitation) {
        return { success: false, error: 'Invitation already sent to this email' };
      }

      // Create invitation
      const { data: invitation, error } = await supabase
        .from('user_invitations')
        .insert({
          email,
          role,
          company_id: currentUser.company_id,
          invited_by: currentUser.id,
          is_approved: true,
          approved_by: currentUser.id,
          approved_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log user invitation in audit trail
      try {
        if (invitation) {
          await logUserCreation(invitation.id, email, role, currentUser.company_id);
        }
      } catch (auditError) {
        console.error('Failed to log user invitation to audit trail:', auditError);
        // Don't fail the operation if audit logging fails
      }

      toast.success('User invitation created and approved');
      await fetchInvitations();
      return { success: true };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'invitation');
      console.error('Error creating invitation:', err);
      toast.error(`Failed to create invitation: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Revoke invitation
  const revokeInvitation = async (invitationId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('user_invitations')
        .update({ status: 'revoked' })
        .eq('id', invitationId);

      if (error) {
        throw error;
      }

      toast.success('Invitation revoked successfully');
      await fetchInvitations();
      return { success: true };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'invitation revocation');
      console.error('Error revoking invitation:', err);
      toast.error(`Failed to revoke invitation: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Delete invitation permanently
  const deleteInvitation = async (invitationId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        throw error;
      }

      toast.success('Invitation deleted successfully');
      await fetchInvitations();
      return { success: true };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'invitation deletion');
      console.error('Error deleting invitation:', err);
      toast.error(`Failed to delete invitation: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Accept invitation (for invited users)
  const acceptInvitation = async (token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: invitation, error: fetchError } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('invitation_token', token)
        .eq('status', 'pending')
        .single();

      if (fetchError || !invitation) {
        return { success: false, error: 'Invalid or expired invitation' };
      }

      // Check if invitation has been approved by admin
      if (!invitation.is_approved) {
        return { success: false, error: 'This invitation is pending admin approval. Please wait for your administrator to approve your account.' };
      }

      // Check if invitation has expired
      if (new Date(invitation.expires_at) < new Date()) {
        await supabase
          .from('user_invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id);

        return { success: false, error: 'Invitation has expired' };
      }

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('user_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (updateError) {
        throw updateError;
      }

      return { success: true };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'invitation acceptance');
      console.error('Error accepting invitation:', err);
      return { success: false, error: errorMessage };
    }
  };

  // Promote all existing users to admin (dangerous - admin only)
  const promoteAllToAdmin = async (): Promise<{ success: boolean; count?: number; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    setLoading(true);
    try {
      let totalUpdated = 0;

      // Update users with null role
      const { data: data1, error: error1 } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .is('role', null);

      if (error1) {
        throw error1;
      }

      // Update users with non-admin role
      const { data: data2, error: error2 } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .neq('role', 'admin');

      if (error2) {
        throw error2;
      }

      const count1 = Array.isArray(data1) ? data1.length : 0;
      const count2 = Array.isArray(data2) ? data2.length : 0;
      totalUpdated = count1 + count2;

      toast.success(`Promoted ${totalUpdated} users to admin`);
      await fetchUsers();
      return { success: true, count: totalUpdated };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'promote all');
      console.error('Error promoting users:', err);
      toast.error(`Failed to promote users: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Complete invitation by creating user account (admin only)
  const completeInvitation = async (
    invitationId: string,
    userData: {
      password: string;
      full_name?: string;
      phone?: string;
      department?: string;
      position?: string;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!userData.password || userData.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }

    setLoading(true);

    try {
      // Get invitation details first
      const { data: invitationData, error: inviteError } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (inviteError || !invitationData) {
        return { success: false, error: 'Invitation not found' };
      }

      if (invitationData.status !== 'pending') {
        return { success: false, error: `Invitation is already ${invitationData.status}` };
      }

      // Validate that the company still exists
      const { data: companyExists } = await supabase
        .from('companies')
        .select('id')
        .eq('id', invitationData.company_id)
        .maybeSingle();

      if (!companyExists) {
        return { success: false, error: 'The associated company no longer exists' };
      }

      // Check if a profile already exists for this email
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, status')
        .eq('email', invitationData.email)
        .maybeSingle();

      if (!existingProfile) {
        return {
          success: false,
          error: 'User profile not found. Please ask the user to sign up first, or use the "Add User" button to create a complete user account directly.'
        };
      }

      const userId = existingProfile.id;

      // Update existing profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          status: 'active',
          role: invitationData.role,
          company_id: invitationData.company_id,
          invited_by: invitationData.invited_by,
          invited_at: invitationData.invited_at,
          full_name: userData.full_name || undefined,
          phone: userData.phone || undefined,
          department: userData.department || undefined,
          position: userData.position || undefined,
          password: userData.password, // Will be hashed by DB trigger
        })
        .eq('id', userId);

      if (updateError) {
        const errorMsg = parseErrorMessageWithCodes(updateError, 'profile update');
        const errorDetails = updateError && typeof updateError === 'object'
          ? JSON.stringify(updateError)
          : String(updateError);
        console.error('Profile update error:', errorDetails);
        return { success: false, error: errorMsg };
      }

      // Mark invitation as accepted
      const { error: acceptError } = await supabase
        .from('user_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (acceptError) {
        console.error('Error marking invitation as accepted:', acceptError);
        // Don't fail the operation if marking as accepted fails - user is already created
      }

      // Log in audit trail
      try {
        await logUserApproval(invitationId, invitationData.email, invitationData.company_id, 'completed');
      } catch (auditError) {
        console.error('Failed to log in audit trail:', auditError);
        // Don't fail the operation if audit logging fails
      }

      toast.success(`User account created for ${invitationData.email}`);
      await fetchInvitations();
      await fetchUsers();
      return { success: true };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'invitation completion');
      console.error('Error completing invitation:', err);
      toast.error(`Failed to complete invitation: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Approve invitation (admin only)
  const approveInvitation = async (invitationId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    setLoading(true);

    try {
      // Get invitation details first for audit logging
      const { data: invitationData } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      const { error } = await supabase
        .from('user_invitations')
        .update({
          is_approved: true,
          approved_by: currentUser?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) {
        throw error;
      }

      // If a profile already exists for this email (user already signed up), activate it and assign role/company
      try {
        if (invitationData?.email) {
          const { data: profileExists } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', invitationData.email)
            .maybeSingle();

          if (profileExists?.id) {
            // Validate that the company still exists before updating
            if (invitationData.company_id) {
              const { data: companyExists } = await supabase
                .from('companies')
                .select('id')
                .eq('id', invitationData.company_id)
                .maybeSingle();

              if (!companyExists) {
                console.warn('Cannot activate profile: company no longer exists', {
                  profileId: profileExists.id,
                  companyId: invitationData.company_id
                });
                return;
              }
            }

            const { error: updateErr } = await supabase
              .from('profiles')
              .update({
                status: 'active',
                role: invitationData.role,
                company_id: invitationData.company_id
              })
              .eq('id', profileExists.id);

            if (updateErr) {
              console.warn('Could not auto-activate existing profile on approval:', {
                error: updateErr,
                profileId: profileExists.id,
                invitationId: invitationId
              });
            }
          }
        }
      } catch (profileActivateErr) {
        console.warn('Could not auto-activate existing profile on approval:', profileActivateErr);
      }

      // Log approval in audit trail
      try {
        if (invitationData) {
          await logUserApproval(invitationId, invitationData.email, invitationData.company_id, 'approved');
        }
      } catch (auditError) {
        console.error('Failed to log approval to audit trail:', auditError);
      }

      toast.success('Invitation approved successfully');
      await fetchInvitations();
      await fetchUsers();
      return { success: true };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'invitation approval');
      console.error('Error approving invitation:', err);
      toast.error(`Failed to approve invitation: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Get user statistics
  const getUserStats = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const pendingUsers = users.filter(u => u.status === 'pending').length;
    const inactiveUsers = users.filter(u => u.status === 'inactive').length;

    const adminUsers = users.filter(u => u.role === 'admin').length;
    const accountantUsers = users.filter(u => u.role === 'accountant').length;
    const stockManagerUsers = users.filter(u => u.role === 'stock_manager').length;
    const basicUsers = users.filter(u => u.role === 'user').length;

    const pendingInvitations = invitations.filter(i => !i.is_approved).length;

    return {
      totalUsers,
      activeUsers,
      pendingUsers,
      inactiveUsers,
      adminUsers,
      accountantUsers,
      stockManagerUsers,
      basicUsers,
      pendingInvitations,
    };
  };

  // Reset user password (admin only) - sends password reset email
  const resetUserPassword = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    setLoading(true);

    try {
      const user = users.find(u => u.id === userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Call API endpoint to send password reset email
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          user_id: userId,
          admin_id: currentUser?.id,
        })
      });

      // Defensively parse JSON
      const data = await response.json().catch(() => {
        if (!response.ok) {
          throw new Error(`Server error: HTTP ${response.status}. Failed to send password reset email.`);
        }
        throw new Error('Invalid response from server: Expected valid JSON');
      });

      if (!response.ok) {
        const errorMessage = parseErrorMessageWithCodes(data.error, 'password reset');
        return { success: false, error: errorMessage || 'Failed to send password reset email' };
      }

      if (data && !data.success) {
        return { success: false, error: data.error || 'Failed to send password reset email' };
      }

      toast.success(`Password reset email sent to ${user.email}`);
      return { success: true };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'password reset');
      console.error('Error resetting password:', errorMessage, err);
      toast.error(`Failed to reset password: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchInvitations();
    }
  }, [isAdmin]);

  return {
    users,
    invitations,
    loading,
    error,
    fetchUsers,
    fetchInvitations,
    createUser,
    updateUser,
    deleteUser,
    inviteUser,
    revokeInvitation,
    deleteInvitation,
    approveInvitation,
    acceptInvitation,
    completeInvitation,
    resetUserPassword,
    getUserStats,
    promoteAllToAdmin,
  };
};

// Helper function to generate temporary password
const generateTemporaryPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export default useUserManagement;
