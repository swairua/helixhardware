import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Copy, CheckCircle2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase';
import { createAdminUser } from '@/utils/adminSetup';

export default function AdminInit() {
  const [adminExists, setAdminExists] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState<string[]>([]);

  const ADMIN_EMAIL = 'admin@mail.com';
  const ADMIN_PASSWORD = 'Admin.12';
  const ADMIN_NAME = 'System Admin';

  const setupCommand = './setup-admin.sh';

  useEffect(() => {
    checkAdminExists();
  }, []);

  async function checkAdminExists() {
    try {
      setCheckingAdmin(true);

      // Try to check if admin profile already exists
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', ADMIN_EMAIL)
        .maybeSingle();

      if (!error && profiles) {
        setAdminExists(true);
      }
    } catch (error) {
      console.error('Error checking admin:', error);
    } finally {
      setCheckingAdmin(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function autoCreateAdmin() {
    setCreating(true);
    setCreationProgress([]);

    try {
      await createAdminUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        fullName: ADMIN_NAME,
        onProgress: (message: string) => {
          setCreationProgress(prev => [...prev, message]);
        },
      });

      // Verify creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAdminExists(true);

      toast.success('✅ Admin user created successfully!', {
        description: `Email: ${ADMIN_EMAIL}`,
        duration: 5000,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create admin user';
      toast.error('Creation failed', {
        description: errorMessage,
        duration: 5000,
      });
      console.error('Admin creation error:', error);
    } finally {
      setCreating(false);
    }
  }

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Admin Initialization</CardTitle>
          <CardDescription>
            Set up the first admin user for Medical Supplies
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {adminExists ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <p className="text-green-800 font-medium text-lg">✅ Admin Already Initialized</p>
              <p className="text-sm text-green-700 mt-2">
                The admin user {ADMIN_EMAIL} is ready to use.
              </p>
              <div className="bg-white rounded p-3 text-left space-y-1 border border-green-200 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">Email:</span>
                  <span className="font-mono">{ADMIN_EMAIL}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">Password:</span>
                  <span className="font-mono">Admin.12</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">Role:</span>
                  <span className="font-mono">admin</span>
                </div>
              </div>
              <Button
                onClick={() => window.location.href = '/'}
                className="w-full mt-4 bg-green-600 hover:bg-green-700"
              >
                Go to Sign In
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-4">📋 Setup Instructions</h3>

                {creating && creationProgress.length > 0 && (
                  <div className="mb-4 bg-white rounded p-4 border border-blue-300 space-y-2 max-h-48 overflow-y-auto">
                    {creationProgress.map((message, index) => (
                      <div key={index} className="text-sm text-blue-800 flex items-start gap-2">
                        <span className="text-lg">→</span>
                        <span>{message}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3 mb-4">
                  <p className="text-sm text-blue-800 font-medium">Option 1: Auto Create (Recommended)</p>
                  <Button
                    onClick={autoCreateAdmin}
                    disabled={creating}
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Admin User...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Auto Create Admin User
                      </>
                    )}
                  </Button>
                </div>

                <div className="border-t border-blue-200 pt-4">
                  <p className="text-sm text-blue-800 font-medium mb-3">Option 2: Manual Setup (Terminal)</p>
                  <p className="text-sm text-blue-800 mb-3">
                    Run the setup script from your terminal to create the admin user:
                  </p>

                  <div className="bg-gray-900 rounded p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <code className="text-green-400 font-mono text-sm">{setupCommand}</code>
                      <button
                        onClick={() => copyToClipboard(setupCommand)}
                        className="text-gray-400 hover:text-gray-200 transition"
                        title="Copy command"
                      >
                        {copied ? (
                          <CheckCircle2 className="h-5 w-5 text-green-400" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-sm text-blue-800 space-y-2">
                    <p className="font-medium">Steps:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Open your terminal in the project directory</li>
                      <li>Run <code className="bg-blue-100 px-2 py-1 rounded font-mono">chmod +x setup-admin.sh</code></li>
                      <li>Run <code className="bg-blue-100 px-2 py-1 rounded font-mono">{setupCommand}</code></li>
                      <li>The script will create the admin user automatically</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-indigo-50 rounded-lg p-4">
                <p className="text-sm font-medium text-indigo-900">Admin credentials to be created:</p>
                <div className="space-y-2 text-sm text-indigo-800">
                  <div className="flex justify-between bg-white rounded p-2">
                    <span>Email:</span>
                    <span className="font-mono font-medium">{ADMIN_EMAIL}</span>
                  </div>
                  <div className="flex justify-between bg-white rounded p-2">
                    <span>Password:</span>
                    <span className="font-mono font-medium">{ADMIN_PASSWORD}</span>
                  </div>
                  <div className="flex justify-between bg-white rounded p-2">
                    <span>Role:</span>
                    <span className="font-mono font-medium">admin</span>
                  </div>
                  <div className="flex justify-between bg-white rounded p-2">
                    <span>Full Name:</span>
                    <span className="font-mono font-medium">{ADMIN_NAME}</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-600 bg-gray-50 rounded p-4">
                <p className="font-medium mb-2">The setup script will:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Create the default company (Medical Supplies)</li>
                  <li>Create authentication user with secure credentials</li>
                  <li>Set up admin profile in the database</li>
                  <li>Assign admin permissions and roles</li>
                  <li>Activate the account immediately</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  <span className="font-semibold">ℹ️ Note:</span> The script uses the Supabase Service Role Key to bypass database security policies, ensuring reliable admin creation even with complex RLS setups.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
