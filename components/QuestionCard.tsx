import React, { useState } from 'react';
import { GeneratedQuestion, CognitiveLevel, QuestionFormat } from '../types';
import { CheckCircle, Info, Tag, BookOpen, BrainCircuit, Target, HelpCircle, ListChecks, CheckSquare, Type, FileDown, ArrowRightLeft, XCircle } from 'lucide-react';
import { exportQuestionToWord } from '../services/wordExportService';
import { Button } from './Button';

interface QuestionCardProps {
  data: GeneratedQuestion;
  onTransform?: (newFormat: QuestionFormat) => Promise<void>;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ data, onTransform }) => {
  const [isTransforming, setIsTransforming] = useState<QuestionFormat | null>(null);

  // MÀU SẮC CHO LEVEL: Dùng tông màu đất/quân đội
  const levelColors = {
    [CognitiveLevel.BIET]: "bg-[#E8F5E9] text-army-green border-army-green/30",
    [CognitiveLevel.HIEU]: "bg-[#FFF8E1] text-[#B76E00] border-bronze/30",
    [CognitiveLevel.VAN_DUNG]: "bg-[#F3E5F5] text-hue-purple border-hue-purple/30",
  };

  const handleDownload = () => {
    exportQuestionToWord(data);
  };

  const handleTransformClick = async (format: QuestionFormat) => {
    if (format === data.metadata.format || !onTransform) return;
    setIsTransforming(format);
    try {
        await onTransform(format);
    } finally {
        setIsTransforming(null);
    }
  };

  // Helper function to render text containing LaTeX wrapped in $
  const renderContentWithLatex = (text: string) => {
    if (!text) return null;
    const parts = text.split('$');
    return (
      <span>
        {parts.map((part, index) => {
          // Even indices are normal text, Odd indices are LaTeX formulas
          if (index % 2 === 0) {
            return <span key={index}>{part}</span>;
          } else {
            // Stylized container for LaTeX
            return (
              <span key={index} className="mx-1 px-1.5 py-0.5 rounded bg-[#F9F9F4] border border-army-green/20 text-hue-purple font-serif font-bold italic text-[0.95em] inline-block shadow-sm">
                ${part}$
              </span>
            );
          }
        })}
      </span>
    );
  };

  const renderQuestionContent = () => {
    const format = data.metadata.format;

    // 1. Short Answer
    if (format === QuestionFormat.SHORT_ANSWER) {
      return (
        <div className="mb-8">
          <div className="p-6 rounded-lg border-2 border-dashed border-bronze/40 bg-[#FFFDF7] flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-white border-2 border-bronze flex items-center justify-center shadow-sm text-bronze">
               <HelpCircle size={24} />
             </div>
             <div className="font-bold text-army-green/60 italic font-serif">
               Học sinh điền đáp án ngắn vào phiếu trả lời.
             </div>
          </div>
        </div>
      );
    }

    // 2. True/False
    if (format === QuestionFormat.TRUE_FALSE && data.options) {
      const optionsList = Object.entries(data.options).filter(([_, value]) => value !== null && value !== "");
      return (
        <div className="space-y-4 mb-8">
          {optionsList.map(([key, value]) => {
            const subAnalysis = data.subQuestionAnalysis?.[key] || data.subQuestionAnalysis?.[key.toLowerCase()] || data.subQuestionAnalysis?.[key.toUpperCase()];
            
            return (
              <div key={key} className="p-4 rounded-lg border-l-4 border-l-bronze border-y border-r border-gray-200 bg-white shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                 {/* Top row: Key + Content */}
                 <div className="flex items-start gap-4 relative z-10">
                   <span className="flex-shrink-0 w-8 h-8 rounded bg-army-green text-white font-bold font-serif text-sm flex items-center justify-center shadow-sm mt-0.5">
                     {key.toLowerCase()}
                   </span>
                   <p className="text-army-green leading-relaxed font-medium text-lg flex-1 font-serif">
                      {renderContentWithLatex(value)}
                   </p>
                 </div>
                 
                 {/* Bottom row: Detailed Metadata tags */}
                 {subAnalysis ? (
                   <div className="ml-12 mt-4 flex flex-wrap gap-2 items-start">
                      {/* True/False Badge */}
                      {subAnalysis.isCorrect !== undefined && (
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold border ${subAnalysis.isCorrect ? 'bg-army-green text-white border-army-green' : 'bg-red-50 text-red-600 border-red-200'}`}>
                           {subAnalysis.isCorrect ? <CheckCircle size={12} /> : <XCircle size={12} />}
                           {subAnalysis.isCorrect ? 'ĐÚNG' : 'SAI'}
                        </div>
                      )}

                      {/* Level Badge */}
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold border ${levelColors[subAnalysis.level] || 'bg-gray-100'}`}>
                        <BrainCircuit size={12} />
                        {subAnalysis.level}
                      </div>
                      
                      {/* Competency Badge */}
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold bg-[#FFF3E0] text-bronze border border-bronze/30">
                        <Target size={12} />
                        {subAnalysis.competencyCode}
                      </div>

                      {/* Rationale Tooltip/Text */}
                      {subAnalysis.rationale && (
                        <div className="w-full mt-2 pt-2 border-t border-dashed border-gray-200 text-xs text-gray-500 italic flex gap-2">
                          <Info size={12} className="shrink-0 mt-0.5 text-bronze" />
                          <span>{subAnalysis.rationale}</span>
                        </div>
                      )}
                   </div>
                 ) : (
                   <div className="ml-12 mt-2 text-xs text-bronze italic">
                     * Đang chờ cập nhật phân tích chi tiết...
                   </div>
                 )}
              </div>
            );
          })}
        </div>
      );
    }

    // 3. Multiple Choice (Default)
    if (data.options) {
      const optionsList = Object.entries(data.options).filter(([_, value]) => value !== null && value !== "");
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {optionsList.map(([key, value]) => (
            <div 
              key={key} 
              className={`p-5 rounded-lg border-2 transition-all duration-200 relative group ${
                key === data.correctAnswer 
                  ? "border-army-green bg-[#F1F8E9] shadow-md" 
                  : "border-gray-100 bg-white hover:border-bronze hover:shadow-md"
              }`}
            >
              <div className="flex gap-3">
                  <span className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-sm font-bold border font-serif ${
                      key === data.correctAnswer ? "bg-army-green text-white border-army-green" : "bg-gray-100 text-gray-500 border-gray-200 group-hover:bg-bronze group-hover:text-white group-hover:border-bronze"
                  }`}>
                    {key}
                  </span>
                  <span className={`font-medium leading-relaxed mt-0.5 font-serif ${key === data.correctAnswer ? "text-army-green font-bold" : "text-gray-700"}`}>
                    {renderContentWithLatex(value)}
                  </span>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-xl border-t-4 border-t-red-orange overflow-hidden animate-fade-in-up relative">
      
      {/* Format Transformation Toolbar */}
      {onTransform && (
          <div className="bg-[#F9F9F4] border-b border-gray-200 px-6 py-2 flex items-center gap-3 overflow-x-auto scrollbar-hide">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap flex items-center gap-1">
                  <ArrowRightLeft size={12} />
                  Chuyển đổi:
              </span>
              <div className="flex items-center gap-1">
                  <button 
                      onClick={() => handleTransformClick(QuestionFormat.MULTIPLE_CHOICE)}
                      disabled={data.metadata.format === QuestionFormat.MULTIPLE_CHOICE || isTransforming !== null}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap ${
                          data.metadata.format === QuestionFormat.MULTIPLE_CHOICE 
                              ? 'bg-hue-purple text-white shadow-sm' 
                              : 'text-gray-500 hover:text-hue-purple'
                      }`}
                  >
                      {isTransforming === QuestionFormat.MULTIPLE_CHOICE ? <span className="animate-spin">⌛</span> : <ListChecks size={14} />}
                      Trắc nghiệm
                  </button>

                  <button 
                      onClick={() => handleTransformClick(QuestionFormat.TRUE_FALSE)}
                      disabled={data.metadata.format === QuestionFormat.TRUE_FALSE || isTransforming !== null}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap ${
                          data.metadata.format === QuestionFormat.TRUE_FALSE 
                              ? 'bg-hue-purple text-white shadow-sm' 
                              : 'text-gray-500 hover:text-hue-purple'
                      }`}
                  >
                      {isTransforming === QuestionFormat.TRUE_FALSE ? <span className="animate-spin">⌛</span> : <CheckSquare size={14} />}
                      Đúng/Sai
                  </button>

                  <button 
                      onClick={() => handleTransformClick(QuestionFormat.SHORT_ANSWER)}
                      disabled={data.metadata.format === QuestionFormat.SHORT_ANSWER || isTransforming !== null}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap ${
                          data.metadata.format === QuestionFormat.SHORT_ANSWER 
                              ? 'bg-hue-purple text-white shadow-sm' 
                              : 'text-gray-500 hover:text-hue-purple'
                      }`}
                  >
                      {isTransforming === QuestionFormat.SHORT_ANSWER ? <span className="animate-spin">⌛</span> : <Type size={14} />}
                      Trả lời ngắn
                  </button>
              </div>
          </div>
      )}

      {/* Download Button */}
      <div className="absolute top-14 right-4 z-10 md:top-14">
        <Button 
            onClick={handleDownload} 
            variant="outline" 
            className="bg-white/90 backdrop-blur !border-bronze !text-bronze hover:!bg-bronze hover:!text-white text-xs px-3 py-1.5 h-auto !rounded"
            title="Tải file Word"
        >
            <FileDown size={16} />
            <span className="hidden sm:inline">TẢI WORD</span>
        </Button>
      </div>

      {/* Metadata Bar */}
      <div className="bg-white px-6 py-4 border-b border-gray-100 flex flex-wrap gap-3 items-center pr-24">
        <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded text-xs font-bold border flex items-center gap-1.5 uppercase tracking-wider ${levelColors[data.metadata.level]}`}>
            <Tag size={14} className="stroke-[2.5px]" />
            {data.metadata.level}
            </span>
            <span className="px-3 py-1.5 rounded text-xs font-bold bg-[#EFEBE9] text-[#5D4037] border border-[#D7CCC8] flex items-center gap-1.5 uppercase tracking-wider">
            <BookOpen size={14} className="stroke-[2.5px]" />
            {data.metadata.competencyCode}
            </span>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {/* Question Stem */}
        <h3 className="text-xl md:text-2xl font-bold text-army-green mb-8 leading-relaxed whitespace-pre-wrap font-serif tracking-wide">
          {renderContentWithLatex(data.stem)}
        </h3>

        {/* Render Options */}
        {renderQuestionContent()}

        {/* Pedagogical Analysis Section */}
        {data.metadata.format !== QuestionFormat.TRUE_FALSE && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            <div className="bg-[#EFEBE9] rounded-lg p-5 border-l-4 border-l-[#8D6E63] relative overflow-hidden">
              <div className="flex items-start gap-3 relative z-10">
                <BrainCircuit size={20} className="text-[#5D4037]" />
                <div>
                  <h4 className="font-bold text-[#5D4037] text-xs mb-2 uppercase tracking-wider">
                    Căn cứ Cấp độ
                  </h4>
                  <p className="text-[#3E2723] text-sm leading-relaxed font-medium">
                    {data.metadata.rationaleLevel}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#E0F2F1] rounded-lg p-5 border-l-4 border-l-[#26A69A] relative overflow-hidden">
              <div className="flex items-start gap-3 relative z-10">
                <Target size={20} className="text-[#00695C]" />
                <div>
                  <h4 className="font-bold text-[#00695C] text-xs mb-2 uppercase tracking-wider">
                    Căn cứ Chỉ báo
                  </h4>
                  <p className="text-[#004D40] text-sm leading-relaxed font-medium">
                    {data.metadata.rationaleCompetency}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Answer Section */}
        <div className="bg-white rounded-lg p-6 border-2 border-gray-100 shadow-inner">
          <div className="flex items-start gap-3 mb-4">
            <Info className="text-hue-purple mt-1 shrink-0" size={20} />
            <div>
              <h4 className="font-bold text-hue-purple text-xs uppercase mb-1 tracking-wide">Mô tả năng lực</h4>
              <p className="text-gray-700 text-sm font-medium">{data.metadata.competencyDescription}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 pt-4 border-t border-gray-100">
            <CheckCircle className="text-army-green mt-1 shrink-0" size={20} />
            <div>
              <h4 className="font-bold text-army-green text-xs uppercase mb-1 tracking-wide">Đáp án & Giải thích</h4>
              <div className="mb-2">
                 <span className="bg-army-green text-white px-3 py-1 rounded text-xs font-bold inline-block mb-1">
                    ĐÁP ÁN: {data.correctAnswer}
                 </span>
              </div>
              <p className="text-gray-800 text-sm leading-relaxed font-medium">
                {renderContentWithLatex(data.explanation)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};