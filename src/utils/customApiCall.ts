/**
 * Helper to call custom API actions on the backend API
 */

export async function callCustomApiAction(action: string, data: any) {
  const apiUrl = '/api.php';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(localStorage.getItem('med_api_token') && {
          'Authorization': `Bearer ${localStorage.getItem('med_api_token')}`
        })
      },
      body: JSON.stringify({
        action,
        ...data
      })
    });

    // Check if response has content before parsing
    const contentLength = response.headers.get('content-length');
    if (contentLength === '0' || !response.ok) {
      const text = await response.text();
      if (!text) {
        throw new Error(`API returned empty response (${response.status})`);
      }
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || 'API request failed');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Custom API action failed: ${action}`, error);
    throw error;
  }
}
