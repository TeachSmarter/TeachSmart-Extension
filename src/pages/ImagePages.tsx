import React from 'react';
import { CaptureState, PageType } from '../types';

// Image Configuration Page
interface ImageConfigPageProps {
  prompt: string;
  captureState: CaptureState;
  onPromptChange: (prompt: string) => void;
  onNavigate: (page: PageType) => void;
  onGenerate: (results: string[]) => void;
}

export const ImageConfigPage: React.FC<ImageConfigPageProps> = ({ 
  prompt, 
  captureState, 
  onPromptChange, 
  onNavigate, 
  onGenerate 
}) => {
  const handleGenerate = () => {
    if (!captureState.hasText) {
      alert('未检测到选中文本');
      return;
    }
    
    // Call onGenerate which will handle loading state
    onGenerate([
      'test_image_1.jpeg',
      'test_image_2.jpeg'
    ]);
  };

  return (
    <div>
      <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#333' }}>生成图片</h2>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
          自定义提示词
        </label>
        <input
          type="text"
          placeholder="帮我生成搞笑图片"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
        <button
          onClick={() => onNavigate('home')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          返回
        </button>
        <button
          onClick={handleGenerate}
          disabled={!captureState.hasText}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: captureState.hasText ? '#764ba2' : '#e9ecef',
            color: captureState.hasText ? 'white' : '#6c757d',
            border: 'none',
            borderRadius: '4px',
            cursor: captureState.hasText ? 'pointer' : 'not-allowed'
          }}
        >
          生成
        </button>
      </div>
    </div>
  );
};

// Image Result Page
interface ImageResultPageProps {
  results: string[];
  onNavigate: (page: PageType) => void;
  onRegenerate: () => void;
  onComplete: () => void;
}

export const ImageResultPage: React.FC<ImageResultPageProps> = ({ 
  results, 
  onNavigate, 
  onRegenerate, 
  onComplete 
}) => {
  const downloadImage = (imagePath: string, index: number) => {
    const link = document.createElement('a');
    link.href = imagePath;
    link.download = `生成图片_${index + 1}.jpeg`;
    link.target = '_blank';
    link.click();
  };

  return (
    <div>
      <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#333' }}>生成结果</h2>
      
      <div style={{
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
        marginBottom: '16px'
      }}>
        {results.map((image, index) => (
          <div
            key={index}
            onClick={() => downloadImage(image, index)}
            style={{
              width: '120px',
              height: '120px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f8f9fa'
            }}
          >
            <img
              src={image}
              alt={`生成图片 ${index + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onNavigate('image')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          返回
        </button>
        <button
          onClick={onRegenerate}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#ffc107',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          重新生成
        </button>
        <button
          onClick={onComplete}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          完成
        </button>
      </div>
    </div>
  );
};