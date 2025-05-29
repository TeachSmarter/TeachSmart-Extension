import React from 'react';

interface LoadingPageProps {
  message: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({ message }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      textAlign: 'center'
    }}>
      {/* Loading Animation */}
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #667eea',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
      }}></div>
      
      {/* Loading Message */}
      <h2 style={{
        fontSize: '16px',
        color: '#333',
        margin: '0 0 8px 0',
        fontWeight: '500'
      }}>
        {message}
      </h2>
      
      <p style={{
        fontSize: '14px',
        color: '#666',
        margin: '0',
        lineHeight: '1.4'
      }}>
        请稍候，正在为您生成内容...
      </p>
      
      {/* Add CSS animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};