import React from 'react';
import { CaptureState, GradeSubjectConfig, PageType } from '../types';

// Question Configuration Page
interface QuestionConfigPageProps {
  config: any;
  gradeSubjectConfig: GradeSubjectConfig;
  captureState: CaptureState;
  onConfigChange: (config: any) => void;
  onNavigate: (page: PageType) => void;
  onGenerate: (result: string) => void;
}

export const QuestionConfigPage: React.FC<QuestionConfigPageProps> = ({ 
  config, 
  gradeSubjectConfig, 
  captureState, 
  onConfigChange, 
  onNavigate, 
  onGenerate 
}) => {
  const canGenerate = config.grade && config.subject && config.questionType && captureState.hasText;

  const handleGenerate = () => {
    if (!captureState.hasText) {
      alert('未检测到选中文本');
      return;
    }
    
    // Call onGenerate which will handle loading state
    onGenerate(`基于选中文本"${captureState.text.substring(0, 50)}..."生成的${config.grade}${config.subject}${config.questionType}，共${config.count}道题目。\n\n1. 这是第一道题目的内容...\n2. 这是第二道题目的内容...\n...`);
  };

  return (
    <div>
      <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#333' }}>生成题目</h2>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
          年级
        </label>
        <select
          value={config.grade}
          onChange={(e) => onConfigChange({ ...config, grade: e.target.value, subject: '', questionType: '' })}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value="">请选择年级</option>
          {gradeSubjectConfig.grades.map(grade => (
            <option key={grade} value={grade}>{grade}</option>
          ))}
        </select>
      </div>

      {config.grade && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            学科
          </label>
          <select
            value={config.subject}
            onChange={(e) => onConfigChange({ ...config, subject: e.target.value, questionType: '' })}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="">请选择学科</option>
            {gradeSubjectConfig.subjects[config.grade]?.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
      )}

      {config.subject && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            题型
          </label>
          <select
            value={config.questionType}
            onChange={(e) => onConfigChange({ ...config, questionType: e.target.value })}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="">请选择题型</option>
            {gradeSubjectConfig.questionTypes[config.subject]?.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
          数量 (1-20)
        </label>
        <input
          type="number"
          min="1"
          max="20"
          value={config.count}
          onChange={(e) => onConfigChange({ ...config, count: parseInt(e.target.value) || 5 })}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
          自定义提示词
        </label>
        <input
          type="text"
          placeholder="帮我生成题目"
          value={config.customPrompt}
          onChange={(e) => onConfigChange({ ...config, customPrompt: e.target.value })}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', marginBottom: '10px' }}>
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
          disabled={!canGenerate}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: canGenerate ? '#667eea' : '#e9ecef',
            color: canGenerate ? 'white' : '#6c757d',
            border: 'none',
            borderRadius: '4px',
            cursor: canGenerate ? 'pointer' : 'not-allowed'
          }}
        >
          生成
        </button>
      </div>
    </div>
  );
};

// Question Result Page
interface QuestionResultPageProps {
  result: string;
  onNavigate: (page: PageType) => void;
  onRegenerate: () => void;
  onComplete: () => void;
}

export const QuestionResultPage: React.FC<QuestionResultPageProps> = ({ 
  result, 
  onNavigate, 
  onRegenerate, 
  onComplete 
}) => {
  const displayText = result.length > 200 ? result.substring(0, 200) + '……' : result;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    alert('已复制到剪切板');
  };

  const downloadMarkdown = () => {
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '生成题目.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#333' }}>生成结果</h2>
      
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '12px',
        marginBottom: '16px',
        backgroundColor: '#f8f9fa',
        fontSize: '14px',
        lineHeight: '1.5',
        maxHeight: '150px',
        overflowY: 'auto',
        userSelect: 'text',
        cursor: 'text'
      }}>
        {displayText}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={copyToClipboard}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          复制到剪切板
        </button>
        <button
          onClick={downloadMarkdown}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          导出Markdown
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onNavigate('question')}
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