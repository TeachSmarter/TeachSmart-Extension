import React from 'react';
import { CaptureState, GradeSubjectConfig, PageType } from '../types';

// Lesson Plan Configuration Page
interface LessonConfigPageProps {
  config: any;
  gradeSubjectConfig: GradeSubjectConfig;
  captureState: CaptureState;
  onConfigChange: (config: any) => void;
  onNavigate: (page: PageType) => void;
  onGenerate: (result: string) => void;
}

export const LessonConfigPage: React.FC<LessonConfigPageProps> = ({ 
  config, 
  gradeSubjectConfig, 
  captureState, 
  onConfigChange, 
  onNavigate, 
  onGenerate 
}) => {
  const canGenerate = config.grade && config.subject && captureState.hasText;

  const handleGenerate = () => {
    if (!captureState.hasText) {
      alert('未检测到选中文本');
      return;
    }
    
    // Call onGenerate which will handle loading state
    onGenerate(`基于选中文本"${captureState.text.substring(0, 50)}..."生成的${config.grade}${config.subject}教案\n\n课题：...\n教学目标：...\n教学重点：...\n教学难点：...\n教学过程：\n1. 导入环节\n2. 新课讲授\n3. 练习巩固\n4. 课堂小结\n...`);
  };

  return (
    <div>
      <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#333' }}>生成教案</h2>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
          年级
        </label>
        <select
          value={config.grade}
          onChange={(e) => onConfigChange({ ...config, grade: e.target.value, subject: '' })}
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
            onChange={(e) => onConfigChange({ ...config, subject: e.target.value })}
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
          disabled={!canGenerate}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: canGenerate ? '#f093fb' : '#e9ecef',
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

// Lesson Plan Result Page
interface LessonResultPageProps {
  result: string;
  onNavigate: (page: PageType) => void;
  onRegenerate: () => void;
  onComplete: () => void;
}

export const LessonResultPage: React.FC<LessonResultPageProps> = ({ 
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
    a.download = '生成教案.md';
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
          onClick={() => onNavigate('lesson')}
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