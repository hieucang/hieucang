
export enum CognitiveLevel {
  BIET = "Biết",
  HIEU = "Hiểu",
  VAN_DUNG = "Vận dụng"
}

export enum CompetencyGroup {
  HH1 = "Nhận thức hóa học",
  HH2 = "Tìm hiểu thế giới tự nhiên dưới góc độ hóa học",
  HH3 = "Vận dụng kiến thức, kĩ năng đã học"
}

export enum QuestionFormat {
  MULTIPLE_CHOICE = "Trắc nghiệm nhiều lựa chọn",
  TRUE_FALSE = "Trắc nghiệm đúng sai",
  SHORT_ANSWER = "Trắc nghiệm trả lời ngắn"
}

export interface SubQuestionMetadata {
  level: CognitiveLevel;
  competencyCode: string;
  rationale: string;
  isCorrect?: boolean; // True if the statement is Correct, False otherwise
}

export interface SourceAnalysis {
  originalTopic: string; // Chủ đề của câu hỏi gốc
  originalQuestionText?: string; // Nội dung văn bản của câu hỏi gốc (để tái sử dụng)
  competencyCode: string; // e.g., HH1.2 (Mã chung)
  level: CognitiveLevel; // (Cấp độ chung)
  analysisReasoning: string; // Giải thích chung
  // New field for Source Question detailed analysis
  subQuestionAnalysis?: Record<string, SubQuestionMetadata>; 
}

export interface GeneratedQuestion {
  stem: string;
  // Options can be specific keys (A,B,C,D) or (a,b,c,d) or null for short answer
  options?: Record<string, string>; 
  // Metadata specifically for True/False sub-questions (key: a, b, c, d)
  subQuestionAnalysis?: Record<string, SubQuestionMetadata>;
  
  // Correct answer structure depends on format
  // MCQ: "A"
  // True/False: JSON string like '{"a": true, "b": false...}' or description
  // Short Answer: The value/number
  correctAnswer: string;
  explanation: string;
  metadata: {
    format: QuestionFormat;
    competencyCode: string; // General/Dominant code
    competencyDescription: string;
    level: CognitiveLevel; // General/Dominant level
    contextType: string;
    rationaleLevel: string;
    rationaleCompetency: string;
  };
}

export interface AnalysisResult {
  source: SourceAnalysis;
  generated: GeneratedQuestion;
}

export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  result: AnalysisResult[] | null; // Changed to Array to support multiple questions
}

export interface CritiqueInteraction {
  userQuery: string;
  aiResponse: string;
  timestamp: number;
}

// Extend Window interface for Mammoth
declare global {
  interface Window {
    mammoth: {
      extractRawText: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string; messages: any[] }>;
    };
  }
}