
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0f172a',
          color: '#f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          zIndex: 9999
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: '#1e293b',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid #ef4444'
          }}>
            <h1 style={{ color: '#ef4444', marginTop: 0, marginBottom: '1rem' }}>
              应用出现错误
            </h1>
            <p style={{ color: '#cbd5e1', marginBottom: '1.5rem' }}>
              很抱歉，应用遇到了一个错误。请刷新页面重试。
            </p>
            {this.state.error && (
              <details style={{ marginBottom: '1.5rem' }}>
                <summary style={{ cursor: 'pointer', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  错误详情
                </summary>
                <pre style={{
                  backgroundColor: '#0f172a',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  color: '#fca5a5',
                  margin: 0
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Don't prevent default - let Error Boundary handle it
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent the default browser behavior
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
