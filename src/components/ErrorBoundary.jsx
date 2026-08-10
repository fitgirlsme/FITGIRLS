import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#fff', background: '#000', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2>무언가 잘못되었습니다.</h2>
          <p>페이지 렌더링 중 오류가 발생했습니다. 새로고침을 시도해주세요.</p>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', marginTop: '20px', cursor: 'pointer', background: '#fff', color: '#000', border: 'none', borderRadius: '4px' }}>
            새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
