import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Global error handling
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  console.error('Error details:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  console.error('Promise rejection details:', {
    reason: event.reason,
    stack: event.reason?.stack
  });
  // Prevent the default behavior (logging to console)
  event.preventDefault();
});

// Crash detection and recovery
let crashCount = 0;
const maxCrashes = 3;

const renderApp = () => {
  try {
    const root = createRoot(document.getElementById("root")!);
    root.render(<App />);
  } catch (error) {
    console.error('Render error:', error);
    crashCount++;
    
    if (crashCount < maxCrashes) {
      console.log(`Attempting recovery (${crashCount}/${maxCrashes})...`);
      setTimeout(renderApp, 1000);
    } else {
      console.error('Maximum crashes reached, showing fallback UI');
      document.body.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui;">
          <div style="text-align: center; padding: 2rem;">
            <h1 style="color: #dc2626; margin-bottom: 1rem;">Application Error</h1>
            <p style="color: #6b7280; margin-bottom: 1rem;">The application has encountered a critical error and cannot continue.</p>
            <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; cursor: pointer;">
              Reload Page
            </button>
          </div>
        </div>
      `;
    }
  }
};

renderApp();
