import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useAuditLogs, useCompanies } from '@/hooks/useDatabase';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useMemo } from 'react';

interface AuditLog {
  id: string;
  actor_user_id?: number;
  action: string;
  entity_type: string;
  record_id?: number;
  created_at: string;
  company_id?: number;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  action: string;
  timestamp: Date;
}

function getActionColor(action: string) {
  switch (action?.toLowerCase()) {
    case 'create':
    case 'insert':
      return 'bg-success-light text-success border-success/20';
    case 'update':
    case 'edit':
      return 'bg-info-light text-info border-info/20';
    case 'delete':
      return 'bg-destructive-light text-destructive border-destructive/20';
    case 'view':
    case 'read':
      return 'bg-muted text-muted-foreground border-muted-foreground/20';
    default:
      return 'bg-muted text-muted-foreground border-muted-foreground/20';
  }
}

function getActionIcon(action: string) {
  switch (action?.toLowerCase()) {
    case 'create':
    case 'insert':
      return '✚';
    case 'update':
    case 'edit':
      return '✎';
    case 'delete':
      return '✕';
    case 'view':
    case 'read':
      return '👁';
    default:
      return '⚙';
  }
}

function formatEntityType(entityType: string): string {
  return entityType
    ?.split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'Activity';
}

export function RecentActivity() {
  const { data: companies, isLoading: companiesLoading } = useCompanies();
  const currentCompany = companies?.[0];
  const { data: auditLogs, isLoading: auditLogsLoading, error: auditLogsError } = useAuditLogs(currentCompany?.id);

  const isLoading = auditLogsLoading || companiesLoading;
  const hasError = auditLogsError && !isLoading;

  // Format audit logs into activities - memoized to prevent unnecessary recalculation
  const activities: Activity[] = useMemo(() => {
    if (!auditLogs || auditLogs.length === 0) {
      return [];
    }

    return auditLogs.slice(0, 6).map((log: AuditLog) => {
      const entityType = formatEntityType(log.entity_type);
      const actionText = log.action?.charAt(0).toUpperCase() + log.action?.slice(1).toLowerCase();

      return {
        id: `audit-${log.id}`,
        title: `${actionText} ${entityType}`,
        description: log.record_id ? `ID: ${log.record_id}` : 'System action',
        action: log.action,
        timestamp: new Date(log.created_at || new Date()),
      };
    });
  }, [auditLogs]);

  if (hasError) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-destructive bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              Unable to load recent activity. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No recent activity</p>
            <p className="text-sm text-muted-foreground mt-1">
              Activity will appear here as you create and manage documents
            </p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className={`bg-primary text-primary-foreground text-sm font-medium`}>
                  {getActionIcon(activity.action)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2 sm:space-y-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <p className="text-sm font-medium truncate">{activity.title}</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={getActionColor(activity.action)}>
                      {activity.action}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {activities.length > 0 && (
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing latest activity • {activities.length} recent items
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
