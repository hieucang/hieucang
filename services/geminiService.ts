
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { AnalysisResult, QuestionFormat } from "../types";

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const subQuestionSchema = {
  type: Type.OBJECT,
  properties: {
    level: { type: Type.STRING, enum: ["Biết", "Hiểu", "Vận dụng"] },
    competencyCode: { type: Type.STRING },
    rationale: { type: Type.STRING },
    isCorrect: { type: Type.BOOLEAN, description: "True nếu mệnh đề này Đúng, False nếu mệnh đề này Sai" }
  },
  required: ["level", "competencyCode", "rationale"]
};

const singleAnalysisResultSchema = {
  type: Type.OBJECT,
  properties: {
    source: { 
      type: Type.OBJECT,
      properties: {
        originalTopic: { type: Type.STRING },
        originalQuestionText: { type: Type.STRING, description: "Trích xuất lại nguyên văn nội dung câu hỏi gốc" },
        competencyCode: { type: Type.STRING },
        level: { type: Type.STRING, enum: ["Biết", "Hiểu", "Vận dụng"] },
        analysisReasoning: { type: Type.STRING },
        subQuestionAnalysis: {
          type: Type.OBJECT,
          properties: {
            a: subQuestionSchema,
            b: subQuestionSchema,
            c: subQuestionSchema,
            d: subQuestionSchema,
          },
          nullable: true
        }
      },
      required: ["originalTopic", "competencyCode", "level", "analysisReasoning"]
    },
    generated: {
      type: Type.OBJECT,
      properties: {
        stem: { type: Type.STRING, description: "Câu dẫn có bối cảnh. Toán dùng Latex ($...$). Hóa giữ nguyên." },
        options: {
          type: Type.OBJECT,
          properties: {
            A: { type: Type.STRING, nullable: true },
            B: { type: Type.STRING, nullable: true },
            C: { type: Type.STRING, nullable: true },
            D: { type: Type.STRING, nullable: true },
            a: { type: Type.STRING, nullable: true },
            b: { type: Type.STRING, nullable: true },
            c: { type: Type.STRING, nullable: true },
            d: { type: Type.STRING, nullable: true },
          },
          nullable: true
        },
        subQuestionAnalysis: {
          type: Type.OBJECT,
          properties: {
            a: subQuestionSchema,
            b: subQuestionSchema,
            c: subQuestionSchema,
            d: subQuestionSchema,
          },
          nullable: true
        },
        correctAnswer: { type: Type.STRING },
        explanation: { type: Type.STRING },
        metadata: {
          type: Type.OBJECT,
          properties: {
            format: { type: Type.STRING },
            competencyCode: { type: Type.STRING },
            competencyDescription: { type: Type.STRING },
            level: { type: Type.STRING },
            contextType: { type: Type.STRING },
            rationaleLevel: { type: Type.STRING },
            rationaleCompetency: { type: Type.STRING }
          },
          required: ["format", "competencyCode", "competencyDescription", "level", "contextType", "rationaleLevel", "rationaleCompetency"]
        }
      },
      required: ["stem", "correctAnswer", "explanation", "metadata"]
    }
  },
  required: ["source", "generated"]
};

export const generateSimilarQuestion = async (
  textInput: string,
  selectedFormat: QuestionFormat,
  imageFile?: File,
  documentFile?: File
): Promise<AnalysisResult[]> => {
  
  const modelId = "gemini-2.5-flash"; 

  const parts: any[] = [];

  // Add text prompt
  parts.push({
    text: `Bạn là một chuyên gia thẩm định và biên soạn đề thi Hóa học GDPT 2018.
    
    NHIỆM VỤ:
    1. Phân tích đầu vào. Nếu có nhiều câu hỏi (Câu 1, Câu 2...), hãy tách ra và xử lý từng câu một.
    2. Với mỗi câu, hãy tạo ra phân tích sư phạm và một câu hỏi tương tự MỚI.
    3. QUAN TRỌNG: Hãy trích xuất nội dung văn bản của câu hỏi gốc vào trường 'originalQuestionText' trong phần 'source' để dùng cho tham chiếu sau này.
    
    ĐỊNH DẠNG ĐẦU RA (JSON BẮT BUỘC):
    Trả về một Object chứa mảng "analysisResults". Mỗi phần tử có keys: "source" (phân tích gốc + text gốc), "generated" (câu hỏi mới).

    QUY TẮC NỘI DUNG:
    - **Bối cảnh**: Câu hỏi phải gắn với thực tiễn, thí nghiệm, đời sống. Tránh câu hỏi tính toán vô nghĩa.
    - **Hóa học**: Giữ nguyên công thức hóa học dạng văn bản (H2SO4, Fe).
    - **Toán học**: BẮT BUỘC chuyển số liệu, biến số, biểu thức sang LaTeX kẹp giữa dấu $.
      Ví dụ: Thay vì "V = 22,4.n", hãy viết "$V = 22.4 \\times n$".
    - **Dạng câu hỏi**: ${selectedFormat}.
    
    LƯU Ý ĐẶC BIỆT NẾU LÀ "Trắc nghiệm đúng sai":
    - Phải tạo đủ 4 ý (a, b, c, d).
    - BẮT BUỘC điền thông tin vào "subQuestionAnalysis" cho từng ý (a, b, c, d), bao gồm: level, competencyCode, rationale, isCorrect.
    
    Nội dung đầu vào: "${textInput}"`
  });

  if (imageFile) {
    const base64Data = await fileToGenerativePart(imageFile);
    parts.push({
      inlineData: {
        mimeType: imageFile.type,
        data: base64Data
      }
    });
  }

  if (documentFile) {
    const base64Data = await fileToGenerativePart(documentFile);
    parts.push({
      inlineData: {
        mimeType: documentFile.type,
        data: base64Data
      }
    });
  }

  const response = await ai.models.generateContent({
    model: modelId,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      // WRAP IN ROOT OBJECT FOR STABILITY
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysisResults: {
             type: Type.ARRAY,
             items: singleAnalysisResultSchema
          }
        }
      }
    },
    contents: {
      role: "user",
      parts: parts
    }
  });

  if (response.text) {
    try {
      let cleanText = response.text.trim();
      // Remove Markdown code blocks if present
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleanText.startsWith("```")) {
         cleanText = cleanText.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      const jsonResponse = JSON.parse(cleanText);
      
      let results: any[] = [];
      if (jsonResponse.analysisResults && Array.isArray(jsonResponse.analysisResults)) {
        results = jsonResponse.analysisResults;
      } else if (Array.isArray(jsonResponse)) {
        results = jsonResponse;
      }

      // Safe mapping to match TypeScript interfaces
      // Maps keys regardless of whether AI followed the new schema (source) or old schema (sourceAnalysis)
      return results.map(item => ({
        source: item.source || item.sourceAnalysis,
        generated: item.generated || item.generatedQuestion
      })).filter(item => item.source && item.generated) as AnalysisResult[];

    } catch (e) {
      console.error("JSON parsing error:", e);
      console.error("Raw text:", response.text);
      throw new Error("Lỗi khi xử lý dữ liệu từ AI. Vui lòng thử lại với nội dung rõ ràng hơn.");
    }
  }
  
  throw new Error("Không nhận được phản hồi từ AI");
};

export const evaluateCritique = async (
  currentResult: AnalysisResult,
  userCritique: string
): Promise<string> => {
  const modelId = "gemini-2.5-flash";

  const prompt = `
  Bạn là chuyên gia cố vấn giáo dục môn Hóa học chương trình GDPT 2018.
  
  NGỮ CẢNH:
  Câu hỏi được tạo ra: ${currentResult.generated.stem}
  Định dạng: ${currentResult.generated.metadata.format}
  
  PHÂN TÍCH CỦA HỆ THỐNG:
  - Cấp độ chung: ${currentResult.generated.metadata.level}
  - Chỉ báo chung: ${currentResult.generated.metadata.competencyCode}

  PHẢN BIỆN CỦA NGƯỜI DÙNG:
  "${userCritique}"

  NHIỆM VỤ:
  Hãy trả lời phản biện, giải thích tại sao hệ thống chọn cấp độ/chỉ báo đó.
  Ngôn ngữ: Tiếng Việt hoàn toàn.
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
    contents: {
      role: "user",
      parts: [{ text: prompt }]
    }
  });

  return response.text || "Không thể tạo phản hồi cho phản biện này.";
};

// New function to transform existing question format
export const transformQuestion = async (
  currentResult: AnalysisResult,
  newFormat: QuestionFormat
): Promise<AnalysisResult> => {
  const modelId = "gemini-2.5-flash";

  // Use original content if available, otherwise use generated stem or topic as fallback context
  const contentToTransform = currentResult.source.originalQuestionText || currentResult.generated.stem;
  
  const prompt = `
  Bạn là chuyên gia Hóa học. Tôi có một kết quả phân tích câu hỏi như sau (JSON):
  ${JSON.stringify(currentResult)}

  NHIỆM VỤ:
  Hãy lấy nội dung gốc ("${contentToTransform}") và tạo ra một câu hỏi MỚI theo định dạng: ${newFormat}.
  
  YÊU CẦU:
  - Giữ nguyên các thông tin phân tích 'source' từ dữ liệu cũ (chỉ cập nhật nếu cần thiết).
  - Tạo phần 'generated' mới hoàn toàn phù hợp với định dạng ${newFormat}.
  - Tuân thủ quy tắc Bối cảnh thực tiễn, LaTeX ($...$) và danh pháp tiếng Anh.
  - NẾU LÀ "Trắc nghiệm đúng sai": Phải có 4 ý (a,b,c,d) và đầy đủ subQuestionAnalysis cho từng ý (level, competencyCode, isCorrect).
  
  TRẢ VỀ:
  Một đối tượng JSON duy nhất khớp với schema AnalysisResult (có keys: "source", "generated").
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: singleAnalysisResultSchema // Reusing the schema for a single item
    },
    contents: {
      role: "user",
      parts: [{ text: prompt }]
    }
  });

  if (response.text) {
     try {
        const item = JSON.parse(response.text);
        // Ensure structure matches
        return {
           source: item.source || item.sourceAnalysis,
           generated: item.generated || item.generatedQuestion
        } as AnalysisResult;
     } catch (e) {
        console.error("Error parsing transformed question", e);
        throw new Error("Lỗi khi chuyển đổi dạng thức câu hỏi.");
     }
  }

  throw new Error("Không nhận được phản hồi chuyển đổi từ AI");
};

// New function to REGENERATE existing question (Same format, different content)
export const regenerateQuestion = async (
  currentResult: AnalysisResult
): Promise<AnalysisResult> => {
  const modelId = "gemini-2.5-flash";
  const currentFormat = currentResult.generated.metadata.format;

  // Use original content if available, otherwise use generated stem or topic as fallback context
  const contentToTransform = currentResult.source.originalQuestionText || currentResult.generated.stem;
  
  const prompt = `
  Bạn là chuyên gia Hóa học. Tôi có một kết quả phân tích câu hỏi như sau (JSON):
  ${JSON.stringify(currentResult)}

  NHIỆM VỤ:
  Hãy "LÀM MỚI" câu hỏi này. Hãy tạo ra một câu hỏi **KHÁC BIỆT** với câu hỏi hiện tại trong phần 'generated', nhưng vẫn dựa trên nội dung gốc ("${contentToTransform}") và cùng cấp độ/chỉ báo năng lực.

  YÊU CẦU:
  - Định dạng giữ nguyên: ${currentFormat}.
  - Số liệu hoặc bối cảnh phải thay đổi để tạo thành một câu hỏi mới, tránh trùng lặp.
  - Giữ nguyên các thông tin phân tích 'source' từ dữ liệu cũ.
  - Tuân thủ quy tắc Bối cảnh thực tiễn, LaTeX ($...$) và danh pháp tiếng Anh.
  
  TRẢ VỀ:
  Một đối tượng JSON duy nhất khớp với schema AnalysisResult (có keys: "source", "generated").
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: singleAnalysisResultSchema // Reusing the schema for a single item
    },
    contents: {
      role: "user",
      parts: [{ text: prompt }]
    }
  });

  if (response.text) {
     try {
        const item = JSON.parse(response.text);
        return {
           source: item.source || item.sourceAnalysis,
           generated: item.generated || item.generatedQuestion
        } as AnalysisResult;
     } catch (e) {
        console.error("Error parsing regenerate question", e);
        throw new Error("Lỗi khi làm mới câu hỏi.");
     }
  }

  throw new Error("Không nhận được phản hồi làm mới từ AI");
};
