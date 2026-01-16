import React from 'react';
import { SourceAnalysis, CognitiveLevel } from '../types';
import { Search, FileSearch, Sparkles, BrainCircuit, Target, ListTree, Info } from 'lucide-react';

interface SourceAnalysisCardProps {
  data: SourceAnalysis;
}

export const SourceAnalysisCard: React.FC<SourceAnalysisCardProps> = ({ data }) => {
  const levelColors = {
    [CognitiveLevel.BIET]: "bg-gray-100 text-gray-700 border-gray-200",
    [CognitiveLevel.HIEU]: "bg-amber-50 text-amber-800 border-amber-200",
    [CognitiveLevel.VAN_DUNG]: "bg-purple-50 text-purple-800 border-purple-200",
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden mb-8 animate-fade-in-up">
      {/* Header: Xanh Lính */}
      <div className="bg-army-green px-6 py-3 flex items-center gap-2 text-white shadow-sm border-b-2 border-[#2E3B29]">
        <Search className="text-emerald-100" size={20} />
        <h3 className="font-bold text-sm uppercase tracking-wider text-white font-serif">Phân tích Sư phạm (AI)</h3>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className="p-3 rounded bg-gray-50 border border-gray-200">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Chủ đề kiến thức</span>
            <p className="text-army-green font-bold text-sm line-clamp-2">{data.originalTopic}</p>
          </div>
          
          <div className="p-3 rounded bg-gray-50 border border-gray-200">
             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Mã chỉ báo năng lực</span>
             <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-sm font-bold bg-[#EFEBE9] text-[#5D4037] border border-[#D7CCC8]">
                  {data.competencyCode}
                </span>
             </div>
          </div>

          <div className="p-3 rounded bg-gray-50 border border-gray-200">
             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Cấp độ tư duy</span>
             <span className={`px-2 py-0.5 rounded text-sm font-bold border shadow-sm inline-block ${levelColors[data.level] || 'bg-slate-100'}`}>
                {data.level}
             </span>
          </div>
        </div>

        <div className="bg-[#E3F2FD] rounded-lg p-4 border-l-4 border-l-[#1E88E5] mb-5">
          <div className="flex items-start gap-3">
            <FileSearch className="text-[#1565C0] mt-0.5 shrink-0" size={18} />
            <div>
              <h4 className="font-bold text-[#1565C0] text-xs uppercase tracking-wide mb-1">Cơ sở đánh giá</h4>
              <p className="text-[#0D47A1] text-sm leading-relaxed font-medium">
                {data.analysisReasoning}
              </p>
            </div>
          </div>
        </div>

        {/* Render Sub-question Analysis for Source Question if available */}
        {data.subQuestionAnalysis && Object.keys(data.subQuestionAnalysis).length > 0 && (
          <div className="border-t border-gray-200 pt-5 mt-5">
            <h4 className="font-bold text-gray-700 text-sm flex items-center gap-2 mb-4 uppercase tracking-wide">
              <ListTree size={16} className="text-bronze" />
              Đánh giá chi tiết (a, b, c, d)
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {['a', 'b', 'c', 'd'].map((key) => {
                const subItem = data.subQuestionAnalysis?.[key];
                if (!subItem) return null;
                return (
                  <div key={key} className="flex flex-col md:flex-row items-start md:items-center gap-3 p-3 rounded border border-gray-200 bg-gray-50 hover:bg-white transition-colors">
                    <span className="flex-shrink-0 w-6 h-6 rounded bg-gray-200 text-gray-600 font-bold text-xs flex items-center justify-center border border-gray-300 mt-1 md:mt-0">
                      {key}
                    </span>
                    <div className="flex-1 flex flex-wrap items-center gap-3">
                       <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border bg-white">
                          <BrainCircuit size={10} />
                          {subItem.level}
                       </div>
                       <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFEBE9] text-[#5D4037] border border-[#D7CCC8]">
                          <Target size={10} />
                          {subItem.competencyCode}
                       </div>
                       <div className="flex items-center gap-1 text-xs text-gray-500 italic border-l border-gray-300 pl-3 w-full md:w-auto">
                         <Info size={10} className="shrink-0" />
                         <span className="line-clamp-2 md:line-clamp-1" title={subItem.rationale}>{subItem.rationale}</span>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};