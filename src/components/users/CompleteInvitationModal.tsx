import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, KeyRound, Mail, User, Phone, Briefcase, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { UserInvitation } from '@/hooks/useUserManagement';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CompleteInvitationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitation: UserInvitation | null;
  onCompleteInvitation: (
    invitationId: string,
    userData: {
      password: string;
      full_name?: string;
      phone?: string;
      department?: string;
      position?: string;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  loading?: boolean;
}

export function CompleteInvitationModal({
  open,
  onOpenChange,
  invitation,
  onCompleteInvitation,
  loading = false,
}: CompleteInvitationModalProps) {
  const [formData, setFormData] = useState({
    password: '',
    full_name: '',
    phone: '',
    department: '',
    position: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm() || !invitation) {
      return;
    }

    try {
      const result = await onCompleteInvitation(invitation.id, {
        password: formData.password,
        full_name: formData.full_name || undefined,
        phone: formData.phone || undefined,
        department: formData.department || undefined,
        position: formData.position || undefined,
      });

      if (result.success) {
        toast.success(`Account created for ${invitation.email}`);
        handleClose();
      } else if (result.error) {
        // Ensure error is a string
        const errorMsg = typeof result.error === 'string' ? result.error : String(result.error);
        setSubmitError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to complete invitation';
      setSubmitError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setFormData({
      password: '',
      full_name: '',
      phone: '',
      department: '',
      position: '',
    });
    setFormErrors({});
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!invitation) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete User Registration</DialogTitle>
          <DialogDescription>
            Activate the account for {invitation.email} by setting their password.
            They will be able to log in immediately after completion.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Alert */}
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {submitError.includes('not found') ? (
                  <>
                    <div className="font-semibold mb-2">User hasn't signed up yet</div>
                    <p className="text-sm">The user needs to complete their signup first. They should:</p>
                    <ol className="text-sm list-decimal list-inside mt-2 space-y-1">
                      <li>Sign up at the login page with their email</li>
                      <li>Return here and click "Complete" again</li>
                    </ol>
                    <p className="text-sm mt-2">Or use the "Add User" button instead to create their account directly.</p>
                  </>
                ) : (
                  submitError
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Display-only fields */}
          <div className="rounded-lg bg-muted p-3 space-y-2">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Email</Label>
              <p className="font-medium text-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {invitation.email}
              </p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Role</Label>
              <p className="font-medium text-foreground capitalize">{invitation.role.replace('_', ' ')}</p>
            </div>
          </div>

          {/* Password - Required */}
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password (min 8 characters)"
                value={formData.password}
                onChange={handleInputChange('password')}
                className={`pl-10 pr-10 ${formErrors.password ? 'border-destructive' : ''}`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={loading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {formErrors.password && (
              <p className="text-sm text-destructive">{formErrors.password}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters long
            </p>
          </div>

          {/* Optional fields */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="full_name"
                type="text"
                placeholder="John Doe"
                value={formData.full_name}
                onChange={handleInputChange('full_name')}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+254 712 345 678"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              type="text"
              placeholder="e.g., Sales, Finance, Operations"
              value={formData.department}
              onChange={handleInputChange('department')}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position/Title</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="position"
                type="text"
                placeholder="e.g., Sales Manager"
                value={formData.position}
                onChange={handleInputChange('position')}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 mb-4">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">ℹ️ How this works</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• User must have signed up first to complete registration</li>
              <li>• Setting a password here activates their account immediately</li>
              <li>• They can log in with their email and the password you set</li>
              <li>• Their role will be set to {invitation.role.replace('_', ' ')}</li>
            </ul>
          </div>

          <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4">
            <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">✓ After completion</h4>
            <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
              <li>✓ Account activated and ready to use</li>
              <li>✓ Invitation marked as accepted</li>
              <li>✓ User can log in immediately</li>
              <li>✓ No further action needed</li>
            </ul>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Complete Registration
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
