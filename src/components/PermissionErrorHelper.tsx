import { AlertTriangle, HelpCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PermissionErrorHelperProps {
  statusCode?: number;
  errorMessage?: string;
  operation?: string;
  resource?: string;
}

export function PermissionErrorHelper({
  statusCode = 403,
  errorMessage = 'Permission Denied',
  operation = 'update',
  resource = 'companies',
}: PermissionErrorHelperProps) {
  if (statusCode === 403) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>403 - Permission Denied:</strong> You do not have permission to {operation} {resource}.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              How to Fix This
            </CardTitle>
            <CardDescription>
              This error occurs when your user account lacks the necessary permissions on the API backend.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-2">1. Check Your User Role</h4>
                <p className="text-sm text-muted-foreground">
                  Verify that your user account is assigned an admin or appropriate role on the backend API server.
                </p>
              </div>

              <div className="border-t pt-3">
                <h4 className="font-semibold text-sm mb-2">2. Verify API Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  Your authentication token may be missing or invalid. Try logging out and logging back in to refresh your session.
                </p>
              </div>

              <div className="border-t pt-3">
                <h4 className="font-semibold text-sm mb-2">3. Contact Your Administrator</h4>
                <p className="text-sm text-muted-foreground">
                  Ask your system administrator to grant your account the necessary permissions for this operation. The required permission is likely: <code className="bg-background px-2 py-1 rounded text-xs">update_{resource}</code> or admin privileges.
                </p>
              </div>

              <div className="border-t pt-3">
                <h4 className="font-semibold text-sm mb-2">4. Check Browser Console</h4>
                <p className="text-sm text-muted-foreground">
                  Open your browser's Developer Tools (F12) and check the Console tab for detailed debugging information about the API request.
                </p>
              </div>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Technical Details:</strong> The external API at med.wayrus.co.ke is rejecting the request. Check that your user role has permission to perform the "{operation}" action on the "{resource}" resource.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (statusCode === 401) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>401 - Unauthorized:</strong> Your session has expired or you are not authenticated.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              How to Fix This
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Please <strong>log out and log back in</strong> to refresh your authentication session. Your authentication token may have expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
