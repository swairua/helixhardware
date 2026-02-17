import { EnhancedLogin } from '@/components/auth/EnhancedLogin';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Login Page - Displays the login form
 * Redirects authenticated users to the dashboard
 */
export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated && !loading) {
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  return <EnhancedLogin />;
}
