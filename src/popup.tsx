import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

// Import types and config
import { CaptureState, PageType, config } from './types';

// Import page components
import { HomePage } from './pages/HomePage';
import { QuestionConfigPage, QuestionResultPage } from './pages/QuestionPages';
import { ImageConfigPage, ImageResultPage } from './pages/ImagePages';
import { LessonConfigPage, LessonResultPage } from './pages/LessonPages';
import { LoadingPage } from './components/LoadingPage';

// Main App Component
const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [captureState, setCaptureState] = useState<CaptureState>({ hasText: false, text: '' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Question generation state
  const [questionConfig, setQuestionConfig] = useState({
    grade: '',
    subject: '',
    questionType: '',
    count: 5,
    customPrompt: ''
  });
  const [questionResult, setQuestionResult] = useState('');

  // Image generation state
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageResults, setImageResults] = useState<string[]>([]);

  // Lesson plan generation state
  const [lessonConfig, setLessonConfig] = useState({
    grade: '',
    subject: '',
    customPrompt: ''
  });
  const [lessonResult, setLessonResult] = useState('');

  // Loading state
  const [loadingMessage, setLoadingMessage] = useState('');

  useEffect(() => {
    // Get captured text from storage (set by background script)
    chrome.storage.local.get(['selectedText'], (result) => {
      if (result.selectedText) {
        setCaptureState({ hasText: true, text: result.selectedText });
      }
    });

    // Listen for online/offline status
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Handle window unload to clear data
    const handleBeforeUnload = () => {
      chrome.storage.local.clear();
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'clearSelectedText' });
        }
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const clearCapturedText = () => {
    setCaptureState({ hasText: false, text: '' });
    // Clear from storage
    chrome.storage.local.remove(['selectedText']);
    // Clear from content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'clearSelectedText' });
      }
    });
  };

  const closeWindow = () => {
    // Clear all state data
    setCaptureState({ hasText: false, text: '' });
    setQuestionResult('');
    setImageResults([]);
    setLessonResult('');
    setLoadingMessage('');
    setCurrentPage('home');
    
    // Reset all configs
    setQuestionConfig({
      grade: '',
      subject: '',
      questionType: '',
      count: 5,
      customPrompt: ''
    });
    setImagePrompt('');
    setLessonConfig({
      grade: '',
      subject: '',
      customPrompt: ''
    });
    
    // Clear from browser storage
    chrome.storage.local.clear();
    
    // Clear from content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'clearSelectedText' });
      }
    });
    
    // Close window
    window.close();
  };

  // Generation handlers with loading states
  const handleQuestionGenerate = (result: string) => {
    setLoadingMessage('正在生成题目...');
    setCurrentPage('loading');
    setTimeout(() => {
      setQuestionResult(result);
      setCurrentPage('question-result');
    }, 2000);
  };

  const handleQuestionRegenerate = () => {
    setLoadingMessage('正在重新生成题目...');
    setCurrentPage('loading');
    setTimeout(() => {
      setQuestionResult('重新生成的题目内容...');
      setCurrentPage('question-result');
    }, 2000);
  };

  const handleImageGenerate = (results: string[]) => {
    setLoadingMessage('正在生成图片...');
    setCurrentPage('loading');
    setTimeout(() => {
      setImageResults(results);
      setCurrentPage('image-result');
    }, 3000);
  };

  const handleImageRegenerate = () => {
    setLoadingMessage('正在重新生成图片...');
    setCurrentPage('loading');
    setTimeout(() => {
      setImageResults(['test_image_1.jpeg', 'test_image_2.jpeg']);
      setCurrentPage('image-result');
    }, 3000);
  };

  const handleLessonGenerate = (result: string) => {
    setLoadingMessage('正在生成教案...');
    setCurrentPage('loading');
    setTimeout(() => {
      setLessonResult(result);
      setCurrentPage('lesson-result');
    }, 2500);
  };

  const handleLessonRegenerate = () => {
    setLoadingMessage('正在重新生成教案...');
    setCurrentPage('loading');
    setTimeout(() => {
      setLessonResult('重新生成的教案内容...');
      setCurrentPage('lesson-result');
    }, 2000);
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#ffffff',
      border: '6px solid #667eea',
      borderRadius: '12px',
      position: 'relative',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Close Button */}
      <button
        onClick={closeWindow}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '24px',
          height: '24px',
          border: 'none',
          background: 'none',
          fontSize: '16px',
          cursor: 'pointer',
          color: '#666',
          zIndex: 10
        }}
      >
        ×
      </button>

      {/* Offline Banner */}
      {!isOnline && (
        <div style={{
          backgroundColor: '#ff6b6b',
          color: 'white',
          padding: '8px',
          textAlign: 'center',
          fontSize: '12px'
        }}>
          网络已断开，生成功能暂不可用
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '15px', height: 'calc(100% - 30px)', overflow: 'auto' }}>
        {currentPage === 'home' && (
          <HomePage
            captureState={captureState}
            isOnline={isOnline}
            onClearText={clearCapturedText}
            onNavigate={setCurrentPage}
          />
        )}
        
        {currentPage === 'question' && (
          <QuestionConfigPage
            config={questionConfig}
            gradeSubjectConfig={config}
            captureState={captureState}
            onConfigChange={setQuestionConfig}
            onNavigate={setCurrentPage}
            onGenerate={handleQuestionGenerate}
          />
        )}

        {currentPage === 'question-result' && (
          <QuestionResultPage
            result={questionResult}
            onNavigate={setCurrentPage}
            onRegenerate={handleQuestionRegenerate}
            onComplete={closeWindow}
          />
        )}

        {currentPage === 'image' && (
          <ImageConfigPage
            prompt={imagePrompt}
            captureState={captureState}
            onPromptChange={setImagePrompt}
            onNavigate={setCurrentPage}
            onGenerate={handleImageGenerate}
          />
        )}

        {currentPage === 'image-result' && (
          <ImageResultPage
            results={imageResults}
            onNavigate={setCurrentPage}
            onRegenerate={handleImageRegenerate}
            onComplete={closeWindow}
          />
        )}

        {currentPage === 'lesson' && (
          <LessonConfigPage
            config={lessonConfig}
            gradeSubjectConfig={config}
            captureState={captureState}
            onConfigChange={setLessonConfig}
            onNavigate={setCurrentPage}
            onGenerate={handleLessonGenerate}
          />
        )}

        {currentPage === 'lesson-result' && (
          <LessonResultPage
            result={lessonResult}
            onNavigate={setCurrentPage}
            onRegenerate={handleLessonRegenerate}
            onComplete={closeWindow}
          />
        )}

        {currentPage === 'loading' && (
          <LoadingPage message={loadingMessage} />
        )}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);