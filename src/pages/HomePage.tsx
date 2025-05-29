import React from 'react';
import { CaptureState, PageType } from '../types';

interface HomePageProps {
  captureState: CaptureState;
  isOnline: boolean;
  onClearText: () => void;
  onNavigate: (page: PageType) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ captureState, isOnline, onClearText, onNavigate }) => {
  const buttonsDisabled = !captureState.hasText || !isOnline;

  return (
    <div>
      {/* Capture Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        padding: '12px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            fontSize: '16px',
            color: captureState.hasText ? '#28a745' : '#dc3545'
          }}>
            {captureState.hasText ? '✓' : '✕'}
          </span>
          <span style={{
            fontSize: '14px',
            fontWeight: '500',
            color: captureState.hasText ? '#28a745' : '#dc3545'
          }}>
            {captureState.hasText ? '已捕获' : '未捕获'}
          </span>
        </div>
        
        {captureState.hasText && (
          <button
            onClick={onClearText}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            清除
          </button>
        )}
      </div>

      {/* Function Buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <button
          onClick={() => onNavigate('question')}
          disabled={buttonsDisabled}
          style={{
            padding: '16px',
            backgroundColor: buttonsDisabled ? '#e9ecef' : '#667eea',
            color: buttonsDisabled ? '#6c757d' : 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: buttonsDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          📝 生成题目
        </button>

        <button
          onClick={() => onNavigate('image')}
          disabled={buttonsDisabled}
          style={{
            padding: '16px',
            backgroundColor: buttonsDisabled ? '#e9ecef' : '#764ba2',
            color: buttonsDisabled ? '#6c757d' : 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: buttonsDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          🎨 生成图片
        </button>

        <button
          onClick={() => onNavigate('lesson')}
          disabled={buttonsDisabled}
          style={{
            padding: '16px',
            backgroundColor: buttonsDisabled ? '#e9ecef' : '#f093fb',
            color: buttonsDisabled ? '#6c757d' : 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: buttonsDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          📚 生成教案
        </button>
      </div>
    </div>
  );
};