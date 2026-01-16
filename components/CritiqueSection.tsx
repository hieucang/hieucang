import React, { useState } from 'react';
import { AnalysisResult, CritiqueInteraction } from '../types';
import { MessageSquare, Send, User, Bot, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from './Button';
import { evaluateCritique } from '../services/geminiService';

interface CritiqueSectionProps {
  analysisResult: AnalysisResult;
}

export const CritiqueSection: React.FC<CritiqueSectionProps> = ({ analysisResult }) => {
  const [critiqueText, setCritiqueText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<CritiqueInteraction[]>([]);

  const handleSubmit = async () => {
    if (!critiqueText.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await evaluateCritique(analysisResult, critiqueText);
      
      const newInteraction: CritiqueInteraction = {
        userQuery: critiqueText,
        aiResponse: response,
        timestamp: Date.now()
      };

      setHistory(prev => [...prev, newInteraction]);
      setCritiqueText('');
    } catch (error) {
      console.error("Critique submission failed", error);
      alert("Có lỗi xảy ra khi gửi phản biện. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-bronze/30 overflow-hidden animate-fade-in-up mt-8">
      {/* Header: Vàng Đồng */}
      <div className="bg-gradient-to-r from-bronze to-yellow-600 px-6 py-3 border-b border-bronze flex items-center gap-2">
        <ShieldCheck className="text-white" size={20} />
        <h3 className="font-bold text-white text-sm uppercase tracking-wide font-serif">Phản biện & Tranh luận Sư phạm</h3>
      </div>

      <div className="p-6">
        {history.length === 0 && (
            <div className="mb-6 text-sm text-[#5D4037] flex items-start gap-3 bg-[#EFEBE9] p-4 rounded-lg border border-[#D7CCC8]">
            <div className="bg-white text-bronze p-1.5 rounded-full shrink-0 border border-bronze/20 shadow-sm">
                <AlertCircle size={18} />
            </div>
            <p className="leading-relaxed font-medium">
                Hệ thống xác định: <strong className="text-army-green">{analysisResult.source.level}</strong> - <strong className="text-army-green">{analysisResult.source.competencyCode}</strong>. 
                <br/>
                Nếu bạn có quan điểm khác, hãy nhập lập luận bên dưới. AI sẽ bảo vệ quan điểm hoặc đồng thuận.
            </p>
            </div>
        )}

        {/* History */}
        <div className="space-y-6 mb-6">
          {history.map((item, index) => (
            <div key={index} className="space-y-4 animate-fade-in">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-hue-purple text-white rounded-2xl rounded-tr-sm py-3 px-5 max-w-[85%] shadow-md relative group">
                  <p className="text-sm leading-relaxed font-medium">{item.userQuery}</p>
                  <div className="absolute -right-2 -top-2 bg-white p-1 rounded-full border border-purple-100 shadow-sm text-hue-purple">
                    <User size={14} />
                  </div>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm py-4 px-6 max-w-[95%] shadow-sm relative">
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed font-medium">
                    {item.aiResponse}
                  </div>
                  <div className="absolute -left-2 -top-2 bg-bronze text-white p-1 rounded-full shadow-sm">
                    <Bot size={14} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="relative group">
          <textarea
            value={critiqueText}
            onChange={(e) => setCritiqueText(e.target.value)}
            placeholder="Ví dụ: Động từ 'So sánh' yêu cầu tư duy Vận dụng..."
            className="w-full p-4 pr-24 bg-white border-2 border-bronze/20 rounded-lg focus:ring-2 focus:ring-bronze/50 focus:border-bronze transition-all outline-none text-sm min-h-[80px] shadow-inner placeholder:text-gray-400 resize-none text-army-green font-medium"
          />
          <div className="absolute bottom-3 right-3">
            <Button 
              onClick={handleSubmit} 
              disabled={!critiqueText.trim()} 
              isLoading={isSubmitting}
              className="!bg-bronze hover:!bg-yellow-600 !px-4 !py-2 !text-xs !rounded !shadow-sm !border-none text-white"
            >
              <Send size={14} />
              Gửi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};