import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePublicCompany } from '@/hooks/usePublicCompany';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { BiolegendLogo } from '@/components/ui/biolegend-logo';
import { toast } from 'sonner';
import { handleAuthError } from '@/utils/authErrorHandler';
import { useNavigate } from 'react-router-dom';
import { LoginDeco, LoginHeaderDeco } from './LoginDeco';

export function EnhancedLogin() {
  const { signIn, loading } = useAuth();
  const { company, isLoading: companyLoading, error: companyError } = usePublicCompany();
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [corsError, setCorsError] = useState<string | null>(null);

  // Log any company loading errors for debugging
  if (companyError) {
    console.warn('Failed to load company information:', companyError);
  }

  // Get company name from fetched data, fallback to default if not available
  const companyName = company?.name || 'Helix General Hardware';

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setCorsError(null); // Clear previous CORS errors

    const { error } = await signIn(formData.email, formData.password);

    if (error) {
      const errorInfo = handleAuthError(error);

      // Detect CORS errors and provide helpful guidance
      if (errorInfo.type === 'network_error' && error?.message?.toLowerCase().includes('cors')) {
        setCorsError(
          'The API server needs proper CORS configuration. Check CORS_SETUP_GUIDE.md or try using the Local Dev Server option below.'
        );
      }

      if (errorInfo.type === 'invalid_credentials') {
        setTimeout(() => {
          toast.info('Invalid credentials. Please contact your administrator if you need an account.');
        }, 2000);
      }
    } else {
      setCorsError(null);
      toast.success(`Welcome to ${companyName}!`);
      navigate('/app');
    }
    setSubmitting(false);
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4 relative overflow-hidden">
      <LoginDeco />

      <div className="relative z-10 w-full sm:max-w-lg md:max-w-2xl">
        <Card className="w-full shadow-2xl border-2 border-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 sm:space-y-6 bg-gradient-to-b from-orange-50/50 to-transparent p-6 sm:p-8">
            {/* Animated Logo */}
            <div className="mx-auto animate-bounce" style={{ animationDuration: '2s' }}>
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-2 sm:p-3 rounded-2xl inline-block shadow-lg hover:shadow-xl transition-shadow duration-300">
                <BiolegendLogo
                  size="lg"
                  showText={false}
                  logoUrl={company?.logo_url}
                  companyName={company?.name}
                />
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {companyLoading ? (
                <div className="h-10 sm:h-12 md:h-14 flex items-center justify-center">
                  <div className="inline-flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-500 border-t-transparent"></div>
                    <span className="text-sm sm:text-base text-gray-600">Loading...</span>
                  </div>
                </div>
              ) : (
                <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                  {companyName}
                </CardTitle>
              )}
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                💼 Sign in to access your business management system
              </p>
            </div>

            {/* Decorative line */}
            <LoginHeaderDeco />
          </CardHeader>

          <CardContent className="space-y-4 sm:space-y-6 pt-6 sm:pt-8 p-6 sm:p-8">
            {companyLoading && (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
                  <p className="text-sm text-gray-600">Loading company information...</p>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Email Field */}
              <div className="space-y-2 group">
                <Label htmlFor="email" className="text-sm sm:text-base text-gray-700 font-semibold flex items-center gap-2">
                  <span className="text-base sm:text-lg">📧</span> Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 sm:left-4 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-orange-500 group-focus-within:text-amber-500 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    className={`pl-10 sm:pl-12 py-2 sm:py-3 text-sm sm:text-base border-2 rounded-lg transition-all duration-300 hover:border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 ${
                      formErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200'
                    }`}
                    disabled={submitting || companyLoading}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-xs sm:text-sm text-red-500 font-medium flex items-center gap-1">
                    <span>⚠️</span> {formErrors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2 group">
                <Label htmlFor="password" className="text-sm sm:text-base text-gray-700 font-semibold flex items-center gap-2">
                  <span className="text-base sm:text-lg">🔐</span> Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 sm:left-4 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-orange-500 group-focus-within:text-amber-500 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    className={`pl-10 sm:pl-12 pr-10 sm:pr-12 py-2 sm:py-3 text-sm sm:text-base border-2 rounded-lg transition-all duration-300 hover:border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 ${
                      formErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200'
                    }`}
                    disabled={submitting || companyLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 h-8 w-8 sm:h-9 sm:w-9 -translate-y-1/2 hover:bg-orange-100 text-gray-600 hover:text-orange-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={submitting || companyLoading}
                  >
                    {showPassword ? (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </Button>
                </div>
                {formErrors.password && (
                  <p className="text-xs sm:text-sm text-red-500 font-medium flex items-center gap-1">
                    <span>⚠️</span> {formErrors.password}
                  </p>
                )}
              </div>

              {/* Sign In Button */}
              <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4">
                <Button
                  type="submit"
                  className="w-full py-2 sm:py-3 text-base sm:text-lg font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 rounded-lg"
                  disabled={submitting || companyLoading}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <span>🎯</span>
                      <span className="ml-2">Sign In</span>
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* CORS Error Alert */}
            {corsError && (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800">API Connection Error (CORS)</p>
                    <p className="text-xs text-red-700 mt-2 leading-relaxed">{corsError}</p>
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-red-700 font-medium">Quick fix options:</p>
                      <ol className="text-xs text-red-700 space-y-1 ml-4 list-decimal">
                        <li>Use the <strong>"Use Local Dev Server"</strong> option below (works offline)</li>
                        <li>Backend team: Add CORS headers to api.php (see CORS_SETUP_GUIDE.md)</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* Footer Message */}
            <div className="text-center space-y-2 border-t-2 border-gray-100 pt-4 sm:pt-6">
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="text-base sm:text-lg">💡</span> Having trouble logging in? Contact your administrator for assistance.
              </p>
              <p className="text-xs text-gray-500 font-medium">
                {companyName} © 2025 - Secure Login
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
