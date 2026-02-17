import { useState, useEffect, useCallback, useRef } from 'react';
import { testAPIConnectivity } from '@/utils/networkDiagnostics';

export interface APIConnectivityStatus {
  isConnected: boolean;
  isChecking: boolean;
  lastError?: string;
  lastCheckedAt?: Date;
}

/**
 * Hook to monitor API connectivity
 * Periodically checks if the API is reachable and triggers callbacks
 */
export function useAPIConnectivity() {
  const [status, setStatus] = useState<APIConnectivityStatus>({
    isConnected: true,
    isChecking: false,
    lastCheckedAt: undefined,
  });

  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckTimeRef = useRef<number>(0);

  const checkConnectivity = useCallback(async () => {
    setStatus((prev) => ({ ...prev, isChecking: true }));

    try {
      const result = await testAPIConnectivity('/api');
      const isConnected = result.status === 'success';

      setStatus({
        isConnected,
        isChecking: false,
        lastError: isConnected ? undefined : result.message,
        lastCheckedAt: new Date(),
      });

      return isConnected;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStatus({
        isConnected: false,
        isChecking: false,
        lastError: errorMessage,
        lastCheckedAt: new Date(),
      });

      return false;
    }
  }, []);

  // Check connectivity immediately on mount
  useEffect(() => {
    checkConnectivity();
  }, [checkConnectivity]);

  // Set up periodic checks (every 30 seconds)
  useEffect(() => {
    checkIntervalRef.current = setInterval(async () => {
      const now = Date.now();
      // Only check if at least 30 seconds have passed since last check
      if (now - lastCheckTimeRef.current >= 30000) {
        lastCheckTimeRef.current = now;
        await checkConnectivity();
      }
    }, 30000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkConnectivity]);

  const retry = useCallback(() => {
    lastCheckTimeRef.current = 0;
    return checkConnectivity();
  }, [checkConnectivity]);

  return {
    ...status,
    retry,
    recheck: checkConnectivity,
  };
}
