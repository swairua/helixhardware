import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { CompanyConfigProvider } from '@/contexts/CompanyConfigContext';
import { AuthErrorBoundary } from '@/components/auth/AuthErrorBoundary';
import { enableResizeObserverErrorSuppression } from '@/utils/resizeObserverErrorHandler';
import { initializeDatabase } from '@/integrations/database';
import { getAPIBaseURL } from '@/utils/environment-detection';
import App from './App.tsx'
import './index.css'

// Suppress ResizeObserver errors before any components render
enableResizeObserverErrorSuppression();

// Initialize database in background (non-blocking)
const initializeAppBackground = () => {
  try {
    const provider = import.meta.env.VITE_DATABASE_PROVIDER || 'external-api';
    const apiUrl = getAPIBaseURL();

    console.log(`🔧 Initializing app with ${provider} provider`);
    console.log(`📍 Using API: ${apiUrl}`);

    // Initialize database with proper provider selection
    // Call without awaiting to make it non-blocking
    initializeDatabase({ provider: provider as any }).then(() => {
      console.log(`✅ Database initialized successfully with ${provider} provider`);
    }).catch((error) => {
      console.error('⚠️  Database initialization error:', error);
    });
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
};

// Removed auto-migration imports for production safety

const queryClient = new QueryClient();

// Render immediately
const root = createRoot(document.getElementById("root")!);
root.render(
  <QueryClientProvider client={queryClient}>
    <CompanyConfigProvider>
      <AuthErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </AuthErrorBoundary>
    </CompanyConfigProvider>
  </QueryClientProvider>
);

// Initialize database in background after rendering
initializeAppBackground();
console.log('✅ App rendered successfully');
