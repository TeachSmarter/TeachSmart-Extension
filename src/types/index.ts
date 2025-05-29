// Types
export interface CaptureState {
  hasText: boolean;
  text: string;
}

export interface GradeSubjectConfig {
  grades: string[];
  subjects: { [key: string]: string[] };
  questionTypes: { [key: string]: string[] };
}

export type PageType = 'home' | 'question' | 'question-result' | 'image' | 'image-result' | 'lesson' | 'lesson-result' | 'loading';

export const config: GradeSubjectConfig = {
  grades: ['初一', '初二', '初三'],
  subjects: {
    '初一': ['语文', '数学', '英语', '历史', '地理', '生物'],
    '初二': ['语文', '数学', '英语', '物理', '历史', '地理', '生物'],
    '初三': ['语文', '数学', '英语', '物理', '化学', '历史']
  },
  questionTypes: {
    '语文': ['选择题', '填空题', '阅读理解', '作文题'],
    '数学': ['选择题', '填空题', '计算题', '应用题'],
    '英语': ['选择题', '填空题', '阅读理解', '翻译题'],
    '物理': ['选择题', '填空题', '计算题', '实验题'],
    '化学': ['选择题', '填空题', '计算题', '实验题'],
    '历史': ['选择题', '填空题', '简答题', '论述题'],
    '地理': ['选择题', '填空题', '简答题', '分析题'],
    '生物': ['选择题', '填空题', '简答题', '实验题']
  }
};