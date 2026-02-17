import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/integrations/api';
import { useAuth } from '@/contexts/AuthContext';

export function PromoteCurrentUserToAdmin() {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePromoteToAdmin = async () => {
    if (!user?.id) {
      toast.error('User ID not found');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Promoting user', user.id, 'to admin...');
      
      const { error } = await apiClient.update('profiles', user.id, { role: 'admin' });

      if (error) {
        console.error('API Error:', error);
        throw error;
      }

      toast.success('Successfully promoted to admin! Refreshing...');
      
      // Wait a moment for the database to update, then refresh
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Force refresh the profile data
      await refreshProfile();
      
      // Force a page reload to reflect the changes
      console.log('🔄 Reloading page...');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error promoting user:', error);
      toast.error(`Failed to promote user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 flex gap-2">
      <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium mb-2">Quick Fix: Promote to Admin</p>
        <Button
          onClick={handlePromoteToAdmin}
          disabled={loading}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Promoting...
            </>
          ) : (
            'Promote to Admin'
          )}
        </Button>
      </div>
    </div>
  );
}
