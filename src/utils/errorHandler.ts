/**
 * Global Error Handler
 * Handles various types of errors that can occur in the application
 */

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Check if it's a browser extension error (common cause of message channel errors)
  if (event.reason && event.reason.message && 
      event.reason.message.includes('message channel closed')) {
    console.warn('Browser extension communication error (ignored):', event.reason.message);
    event.preventDefault(); // Prevent the error from being logged
    return;
  }
  
  // Log other unhandled promise rejections
  console.error('Unhandled promise rejection:', event.reason);
});

// Handle general errors
window.addEventListener('error', (event) => {
  // Check if it's a browser extension error
  if (event.message && event.message.includes('message channel closed')) {
    console.warn('Browser extension communication error (ignored):', event.message);
    event.preventDefault();
    return;
  }
  
  // Log other errors
  console.error('Global error:', event.error);
});

// Handle manifest errors specifically
window.addEventListener('error', (event) => {
  if (event.filename && event.filename.includes('manifest.json')) {
    console.warn('Manifest loading error (will be fixed on next deployment):', event.message);
    // Don't prevent default - let it fail gracefully
  }
});

export const handleApiError = (error: any, context: string) => {
  console.error(`API Error in ${context}:`, error);
  
  // Check for specific error types
  if (error.code === 'ECONNABORTED') {
    console.error('Request timeout - this may be due to server load or network issues');
  } else if (error.response?.status === 503) {
    console.error('Backend service unavailable');
  } else if (error.response?.status === 0) {
    console.error('Network error - check internet connection');
  }
  
  return error;
};
