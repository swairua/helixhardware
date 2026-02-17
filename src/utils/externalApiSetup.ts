/**
 * External API Setup Utility
 * Handles database initialization and admin user creation for the external API
 */

import { getClientApiUrl } from './getApiUrl';

interface SetupOptions {
  apiUrl?: string;
  email?: string;
  password?: string;
  onProgress?: (message: string) => void;
}

interface SetupResult {
  success: boolean;
  message: string;
  adminEmail?: string;
  token?: string;
  userId?: number;
}

/**
 * Initialize the external API database and create admin user
 */
export async function initializeExternalAPI(options: SetupOptions = {}): Promise<SetupResult> {
  const {
    apiUrl,
    email,
    password,
    onProgress,
  } = options;

  const adminEmail = email || 'admin@mail.com';
  const adminPassword = password || 'Pass123';

  // Use provided URL or fall back to smart detection
  const fetchUrl = apiUrl
    ? (apiUrl.includes('/api.php') ? apiUrl : apiUrl + '/api.php')
    : getClientApiUrl();

  try {
    // Step 1: Test API connectivity
    onProgress?.('Testing API connectivity...');
    const healthCheck = await fetch(`${fetchUrl}?action=health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }).catch(err => {
      // API might not support health endpoint, which is okay
      return { ok: true, status: 200 };
    });

    if (!healthCheck.ok && healthCheck.status !== 400) {
      throw new Error(`API health check failed: HTTP ${healthCheck.status}`);
    }

    onProgress?.('✓ API is accessible');

    // Step 2: Create admin user (this also initializes all database tables)
    onProgress?.('Initializing database tables...');
    onProgress?.(`Creating admin user: ${adminEmail}`);

    // The setup endpoint expects email and password as JSON POST data
    const setupResponse = await fetch(`${fetchUrl}?action=setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
      }),
    });

    if (!setupResponse.ok) {
      const errorData = await setupResponse.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Setup failed: HTTP ${setupResponse.status}`
      );
    }

    let setupData: any;
    try {
      setupData = await setupResponse.json();
    } catch (e) {
      const text = await setupResponse.text();
      throw new Error(`Setup endpoint returned invalid JSON: ${text.substring(0, 200)}`);
    }

    if (!setupData.status || setupData.status !== 'success') {
      // Provide more detailed error information
      const errorMessage = setupData.message || 'Setup endpoint returned error';

      // Check for common database errors
      if (errorMessage.includes('table') && errorMessage.includes('doesn\'t exist')) {
        throw new Error(`Database table issue: ${errorMessage} - You may need to manually create the users table or check database configuration.`);
      }

      if (errorMessage.includes('Connection') || errorMessage.includes('connection')) {
        throw new Error(`Database connection issue: ${errorMessage} - Check that the database host, user, and password are correct.`);
      }

      throw new Error(errorMessage);
    }

    onProgress?.('✓ Admin user created successfully');

    // Step 3: Verify login works
    onProgress?.('Verifying authentication...');

    // The login endpoint expects email and password as JSON POST data
    const loginResponse = await fetch(`${fetchUrl}?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
      }),
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Login verification failed: HTTP ${loginResponse.status}`
      );
    }

    const loginData = await loginResponse.json();

    if (!loginData.token) {
      throw new Error('Login failed: No token returned');
    }

    onProgress?.('✓ Authentication verified');

    // Step 4: Store token for immediate use
    onProgress?.('Storing authentication token...');
    localStorage.setItem('med_api_token', loginData.token);
    onProgress?.('✓ Token stored');

    return {
      success: true,
      message: 'Database initialized successfully and admin user created',
      adminEmail,
      token: loginData.token,
      userId: loginData.user?.id,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error during setup';

    onProgress?.(`✗ Error: ${errorMessage}`);

    // Provide specific guidance based on the error
    let guideMessage = errorMessage;

    if (errorMessage.includes('Cannot reach API')) {
      guideMessage = `${errorMessage}\n\nTroubleshooting:\n1. Verify the API URL is correct\n2. Check your internet connection\n3. Ensure the API server is running\n4. Check firewall/network restrictions`;
    } else if (errorMessage.includes('Connection') || errorMessage.includes('table')) {
      guideMessage = `${errorMessage}\n\nTroubleshooting:\n1. The remote database may not be properly configured\n2. Contact your system administrator\n3. Or set up a local database instead`;
    } else if (errorMessage.includes('Invalid JSON')) {
      guideMessage = `${errorMessage}\n\nTroubleshooting:\n1. The API endpoint may be misconfigured\n2. Verify it's pointing to a valid PHP API\n3. Check the API server logs`;
    }

    return {
      success: false,
      message: guideMessage,
    };
  }
}

/**
 * Check if admin user exists
 */
export async function checkAdminExists(options: SetupOptions = {}): Promise<boolean> {
  const apiUrl =
    options.apiUrl || import.meta.env.VITE_EXTERNAL_API_URL || 'https://helixgeneralhardware.com/api.php';
  const email = options.email || 'admin@mail.com';
  const password = options.password || 'Pass123';

  // Always use the direct URL (no proxy) for consistency across all environments
  const fetchUrl = apiUrl.includes('/api.php') ? apiUrl : apiUrl + '/api.php';

  try {
    const response = await fetch(`${fetchUrl}?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    // Check if login was successful (HTTP 200 and has token)
    if (response.ok) {
      const data = await response.json();
      return data?.token ? true : false;
    }

    return false;
  } catch (error) {
    console.error('Error checking admin:', error);
    return false;
  }
}

/**
 * Create additional user account
 */
export async function createUserViaAPI(
  email: string,
  password: string,
  token: string,
  options: SetupOptions = {}
): Promise<SetupResult> {
  const apiUrl =
    options.apiUrl || import.meta.env.VITE_EXTERNAL_API_URL || 'https://helixgeneralhardware.com/api.php';
  const { onProgress } = options;

  // Always use the direct URL (no proxy) for consistency across all environments
  const fetchUrl = apiUrl.includes('/api.php') ? apiUrl : apiUrl + '/api.php';

  try {
    onProgress?.(`Creating user: ${email}`);

    const response = await fetch(`${fetchUrl}?action=create&table=users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email,
        password,
        role: 'user',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `User creation failed: HTTP ${response.status}`
      );
    }

    const data = await response.json();

    return {
      success: true,
      message: `User ${email} created successfully`,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error creating user';

    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Get database information from API
 */
export async function getDatabaseInfo(options: SetupOptions = {}): Promise<any> {
  const apiUrl =
    options.apiUrl || import.meta.env.VITE_EXTERNAL_API_URL || 'https://helixgeneralhardware.com/api.php';

  // Always use the direct URL (no proxy) for consistency across all environments
  const fetchUrl = apiUrl.includes('/api.php') ? apiUrl : apiUrl + '/api.php';

  try {
    // Try to read users table to verify connection
    const response = await fetch(`${fetchUrl}?action=read&table=users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ where: {} }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      connected: true,
      tablesExist: true,
      userCount: data.data?.length || 0,
    };
  } catch (error) {
    return null;
  }
}
