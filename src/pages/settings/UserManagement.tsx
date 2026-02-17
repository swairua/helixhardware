import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  Mail,
  Clock,
  Users,
  UserX,
  MoreHorizontal,
  KeyRound
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, UserProfile } from '@/contexts/AuthContext';
import useUserManagement from '@/hooks/useUserManagement';
import usePermissions from '@/hooks/usePermissions';
import { CreateUserModal } from '@/components/users/CreateUserModal';
import { EditUserModal } from '@/components/users/EditUserModal';
import { InviteUserModal } from '@/components/users/InviteUserModal';
import { CompleteInvitationModal } from '@/components/users/CompleteInvitationModal';
import { UserAuditLog } from '@/components/users/UserAuditLog';
import { RoleManagement } from '@/components/settings/RoleManagement';
import { PromoteCurrentUserToAdmin } from '@/components/auth/PromoteCurrentUserToAdmin';
import { toast } from 'sonner';

function getRoleColor(role: string) {
  switch (role) {
    case 'admin':
      return 'bg-destructive-light text-destructive border-destructive/20';
    case 'accountant':
      return 'bg-primary-light text-primary border-primary/20';
    case 'stock_manager':
      return 'bg-warning-light text-warning border-warning/20';
    case 'user':
      return 'bg-success-light text-success border-success/20';
    default:
      return 'bg-muted text-muted-foreground border-muted-foreground/20';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-success-light text-success border-success/20';
    case 'inactive':
      return 'bg-muted text-muted-foreground border-muted-foreground/20';
    case 'pending':
      return 'bg-warning-light text-warning border-warning/20';
    default:
      return 'bg-muted text-muted-foreground border-muted-foreground/20';
  }
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

export default function UserManagement() {
  const { isAdmin, profile: currentUser } = useAuth();
  const { can } = usePermissions();
  const {
    users,
    invitations,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    inviteUser,
    revokeInvitation,
    deleteInvitation,
    approveInvitation,
    completeInvitation,
    resetUserPassword,
    getUserStats,
    promoteAllToAdmin,
  } = useUserManagement();

  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState<{
    type: 'create' | 'edit' | 'invite' | 'complete' | null;
    user?: UserProfile | null;
    invitation?: any | null;
  }>({ type: null, user: null, invitation: null });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user?: UserProfile | null;
  }>({ open: false, user: null });

  const stats = getUserStats();

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">
              Manage user accounts, roles, and permissions
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-6">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground mb-4">
                You need administrator privileges to access user management.
              </p>
              {currentUser && (
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded text-left text-sm space-y-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground mb-2">Current User Info:</p>
                    <p className="text-xs"><span className="font-semibold">Email:</span> {currentUser.email}</p>
                    <p className="text-xs"><span className="font-semibold">Role:</span> {currentUser.role || 'Not set'}</p>
                  </div>
                  <PromoteCurrentUserToAdmin />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    );
  }

  const handleCreateUser = async (userData: any) => {
    return await createUser(userData);
  };

  const handleUpdateUser = async (userId: string, userData: any) => {
    return await updateUser(userId, userData);
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.user) return;
    
    const result = await deleteUser(deleteDialog.user.id);
    if (result.success) {
      setDeleteDialog({ open: false, user: null });
    }
    return result;
  };

  const handleInviteUser = async (email: string, role: any) => {
    return await inviteUser(email, role);
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    const result = await revokeInvitation(invitationId);
    if (result.success) {
      toast.success('Invitation revoked successfully');
    }
  };

  const handleApproveInvitation = async (invitationId: string) => {
    const result = await approveInvitation(invitationId);
    if (result.success) {
      toast.success('Invitation approved successfully');
    }
  };

  const handleCompleteInvitation = async (
    invitationId: string,
    userData: {
      password: string;
      full_name?: string;
      phone?: string;
      department?: string;
      position?: string;
    }
  ) => {
    return await completeInvitation(invitationId, userData);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Users & Invitations</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">User Management</h1>
              <p className="text-muted-foreground">
                Manage user accounts, roles, and permissions
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setModalState({ type: 'invite' })}
              >
                <Mail className="h-4 w-4 mr-2" />
                Invite User
              </Button>
              <Button
                variant="primary-gradient"
                size="lg"
                onClick={() => {
                  if (!can('create_user')) {
                    toast.error("You don't have permission to create users directly");
                    return;
                  }
                  setModalState({ type: 'create' });
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  const ok = window.confirm('Are you sure you want to promote all existing users to admin? This cannot be easily undone.');
                  if (!ok) return;
                  const res = await promoteAllToAdmin();
                  if (res.success) {
                    toast.success(`Promoted ${res.count || 0} users to admin`);
                  } else {
                    toast.error(res.error || 'Failed to promote users');
                  }
                }}
              >
                Promote all to Admin
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold text-primary">{stats.totalUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold text-success">{stats.activeUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Administrators</p>
                    <p className="text-2xl font-bold text-destructive">{stats.adminUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-warning" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Invites</p>
                    <p className="text-2xl font-bold text-warning">{stats.pendingInvitations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Users & Roles</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading users...</p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                                {user.full_name ? getInitials(user.full_name) : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.full_name || 'No name'}</p>
                              <p className="text-sm text-muted-foreground">
                                {user.position || 'No position'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getRoleColor(user.role)}>
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {user.department || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {user.last_login ? (
                            new Date(user.last_login).toLocaleDateString()
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                  onClick={() => setModalState({ type: 'edit', user })}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit User
                                </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async () => {
                                  const res = await resetUserPassword(user.id);
                                  if (res.success) {
                                    toast.success('Password reset email sent');
                                  }
                                }}
                              >
                                <KeyRound className="mr-2 h-4 w-4" />
                                Send Password Reset
                              </DropdownMenuItem>
                              {user.id !== currentUser?.id && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteDialog({ open: true, user })}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete User
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <UserX className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">No users found</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pending Invitations - Awaiting Approval */}
          {invitations.some(inv => !inv.is_approved) && (
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Pending Invitations</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Review and approve user invitations before they can create accounts
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>User Approval Process:</strong> New user invitations require manual approval from an administrator before users can create their accounts. This ensures proper user management and security compliance.
                  </p>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Invited</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.filter(inv => !inv.is_approved).map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell>{invitation.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getRoleColor(invitation.role)}>
                            {invitation.role.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(invitation.invited_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(invitation.expires_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-warning-light text-warning border-warning/20">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending Approval
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (!can('create_user')) {
                                  toast.error("You don't have permission to create users directly");
                                  return;
                                }
                                setModalState({
                                  type: 'create',
                                  invitation
                                });
                              }}
                              className="text-primary hover:text-primary"
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Create User
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveInvitation(invitation.id)}
                              className="text-success hover:text-success"
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeInvitation(invitation.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Revoke
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {invitations.filter(inv => !inv.is_approved).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <UserCheck className="h-8 w-8 text-success mx-auto mb-2" />
                          <p className="text-muted-foreground">All invitations approved</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Approved Invitations - Awaiting User Signup */}
          {invitations.some(inv => inv.is_approved && inv.status === 'pending') && (
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Approved Invitations</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Invitations approved and waiting for users to create their accounts
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Invited</TableHead>
                      <TableHead>Approved On</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.filter(inv => inv.is_approved && inv.status === 'pending').map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell>{invitation.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getRoleColor(invitation.role)}>
                            {invitation.role.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(invitation.invited_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {invitation.approved_at ? new Date(invitation.approved_at).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(invitation.expires_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (!can('create_user')) {
                                  toast.error("You don't have permission to create users directly");
                                  return;
                                }
                                setModalState({
                                  type: 'create',
                                  invitation
                                });
                              }}
                              className="text-primary hover:text-primary"
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Create User
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setModalState({ type: 'complete', invitation })}
                              className="text-success hover:text-success"
                            >
                              <KeyRound className="h-4 w-4 mr-2" />
                              Complete
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeInvitation(invitation.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Revoke
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* User Audit Log */}
          <UserAuditLog />

          {/* Modals */}
          <CreateUserModal
            open={modalState.type === 'create'}
            onOpenChange={(open) => !open && setModalState({ type: null, user: null, invitation: null })}
            onCreateUser={handleCreateUser}
            loading={loading}
            invitationData={modalState.invitation ? { email: modalState.invitation.email, role: modalState.invitation.role } : null}
          />

          <EditUserModal
            open={modalState.type === 'edit'}
            onOpenChange={(open) => !open && setModalState({ type: null, user: null, invitation: null })}
            user={modalState.user}
            onUpdateUser={handleUpdateUser}
            loading={loading}
          />

          <InviteUserModal
            open={modalState.type === 'invite'}
            onOpenChange={(open) => !open && setModalState({ type: null, user: null, invitation: null })}
            onInviteUser={handleInviteUser}
            loading={loading}
          />

          <CompleteInvitationModal
            open={modalState.type === 'complete'}
            onOpenChange={(open) => !open && setModalState({ type: null, user: null, invitation: null })}
            invitation={modalState.invitation || null}
            onCompleteInvitation={handleCompleteInvitation}
            loading={loading}
          />

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, user: deleteDialog.user })}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {deleteDialog.user?.full_name || deleteDialog.user?.email}? 
                  This action cannot be undone and will permanently remove the user's access to the system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteUser}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete User
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <RoleManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
