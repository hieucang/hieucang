import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, RefreshCw, Image as ImageIcon, FileType, X, Zap, BookOpen, ListChecks, CheckSquare, Type, Layers, Trash2, RotateCw } from 'lucide-react';
import { Button } from './components/Button';
import { QuestionCard } from './components/QuestionCard';
import { SourceAnalysisCard } from './components/SourceAnalysisCard';
import { CritiqueSection } from './components/CritiqueSection';
import { generateSimilarQuestion, transformQuestion, regenerateQuestion } from './services/geminiService';
import { AnalysisState, QuestionFormat } from './types';

function App() {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<QuestionFormat>(QuestionFormat.MULTIPLE_CHOICE);
  
  // Refs for file inputs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  
  const [state, setState] = useState<AnalysisState>({
    isLoading: false,
    error: null,
    result: null
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          e.preventDefault();
          const file = new File([blob], "pasted-image.png", { type: blob.type });
          setSelectedImage(file);
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
          if (imageInputRef.current) imageInputRef.current.value = '';
        }
        break; 
      }
    }
  };

  const handleDocumentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileType = file.type;

      if (fileType === 'application/pdf') {
        setSelectedDocument(file);
      } else if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.name.endsWith('.docx')
      ) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const result = await window.mammoth.extractRawText({ arrayBuffer });
          setInputText(prev => prev + (prev ? '\n\n' : '') + result.value);
          alert("Đã trích xuất nội dung từ file Word vào ô văn bản.");
          if (docInputRef.current) docInputRef.current.value = '';
        } catch (err) {
          console.error("Lỗi đọc file Word:", err);
          setState(prev => ({ ...prev, error: "Không thể đọc file Word. Vui lòng thử lại hoặc copy nội dung." }));
        }
      }
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const removeDocument = () => {
    setSelectedDocument(null);
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!inputText && !selectedImage && !selectedDocument) {
      setState(prev => ({ ...prev, error: "Vui lòng cung cấp nội dung (văn bản, ảnh hoặc PDF)." }));
      return;
    }

    setState({ isLoading: true, error: null, result: null });

    try {
      const result = await generateSimilarQuestion(
        inputText, 
        selectedFormat, 
        selectedImage || undefined, 
        selectedDocument || undefined
      );
      setState({ isLoading: false, error: null, result });
    } catch (err: any) {
      console.error(err);
      let errorMessage = "Đã xảy ra lỗi khi giao tiếp với AI.";
      if (err.message) errorMessage = err.message;
      if (err.message?.includes("API_KEY")) {
         errorMessage = "Thiếu API Key. Vui lòng kiểm tra cấu hình môi trường.";
      }
      setState({ isLoading: false, error: errorMessage, result: null });
    }
  };

  const handleReset = () => {
    setInputText('');
    removeImage();
    removeDocument();
    setState({ isLoading: false, error: null, result: null });
  };

  const handleRemoveResult = (indexToRemove: number) => {
    setState(prev => {
      if (!prev.result) return prev;
      const updatedResults = prev.result.filter((_, i) => i !== indexToRemove);
      return {
        ...prev,
        result: updatedResults.length > 0 ? updatedResults : null
      };
    });
  };
  
  const handleRegenerateItem = async (index: number) => {
     if (!state.result || !state.result[index]) return;
     
     setState(prev => ({ ...prev, isLoading: true }));

     try {
         const currentItem = state.result[index];
         const regeneratedResult = await regenerateQuestion(currentItem);
         
         setState(prev => {
             if (!prev.result) return { ...prev, isLoading: false };
             const newResults = [...prev.result];
             newResults[index] = regeneratedResult;
             return { ...prev, result: newResults, isLoading: false };
         });
     } catch (error) {
         console.error("Failed to regenerate question", error);
         alert("Không thể làm mới câu hỏi. Vui lòng thử lại.");
         setState(prev => ({ ...prev, isLoading: false }));
     }
  };

  const handleTransform = async (index: number, newFormat: QuestionFormat) => {
     if (!state.result || !state.result[index]) return;
     
     const currentItem = state.result[index];
     
     try {
         const transformedResult = await transformQuestion(currentItem, newFormat);
         
         setState(prev => {
             if (!prev.result) return prev;
             const newResults = [...prev.result];
             newResults[index] = transformedResult;
             return { ...prev, result: newResults };
         });

     } catch (error) {
         console.error("Failed to transform question", error);
         alert("Không thể chuyển đổi dạng thức câu hỏi. Vui lòng thử lại.");
     }
  };

  return (
    <div className="min-h-screen bg-grid-pattern relative overflow-x-hidden font-sans text-gray-100">
      
      {/* HEADER: Tím Huế chủ đạo */}
      <header className="sticky top-0 z-20 border-b-4 border-bronze bg-hue-purple shadow-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex items-center gap-3 group cursor-pointer">
              {/* Logo Box */}
              <div className="bg-white p-2.5 rounded-lg text-hue-purple shadow-lg transform transition-transform group-hover:scale-105 border-2 border-bronze">
                <Sparkles size={24} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <h1 className="font-serif font-black text-white text-3xl leading-none tracking-tight drop-shadow-md">ChemGen</h1>
                <span className="text-[11px] font-bold text-bronze-light tracking-[0.2em] uppercase mt-1">Chuẩn GDPT 2018</span>
              </div>
            </div>
            
            <div className="h-10 w-px bg-purple-700 hidden md:block"></div>
            
            <div className="hidden md:flex flex-col">
               <span className="text-purple-200 text-xs font-medium uppercase tracking-wider">Cố vấn chuyên môn</span>
               <div className="flex items-center gap-2">
                 <h2 className="text-lg font-bold text-white uppercase tracking-tight">
                   Thầy Hồ Cang
                 </h2>
                 <span className="bg-red-orange text-white text-[10px] px-2 py-0.5 rounded font-bold">THPT Chu Văn An</span>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-army-green bg-white/90 px-4 py-2 rounded shadow-lg border border-army-green/20">
             <Zap size={16} className="fill-bronze text-bronze" />
             CÔNG NGHỆ AI
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 relative z-10">
        
        {!state.result && (
          <div className="mb-12 text-center max-w-3xl mx-auto animate-fade-in-down">
            <h2 className="text-4xl md:text-5xl font-black text-[#E5E5E5] mb-6 tracking-tight leading-tight font-serif drop-shadow-sm">
              Kiến Tạo Câu Hỏi <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-orange to-bronze">Hóa Học</span>
            </h2>
            <div className="h-1 w-24 bg-bronze mx-auto mb-6"></div>
            <p className="text-2xl text-purple-200 leading-relaxed font-bold">
              Công cụ hỗ trợ giáo viên xây dựng ngân hàng câu hỏi định hướng phát triển năng lực.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: INPUT */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-1 rounded-2xl shadow-xl shadow-black/20 border-2 border-white/10">
              <div className="bg-[#FFFFF0] p-6 rounded-xl border border-bronze/20">
              
                {/* Format Selector: Buttons */}
                <div className="mb-6 flex gap-2">
                  <button 
                    onClick={() => setSelectedFormat(QuestionFormat.MULTIPLE_CHOICE)}
                    className={`flex-1 py-3 px-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all border-2 ${selectedFormat === QuestionFormat.MULTIPLE_CHOICE ? 'bg-hue-purple text-white border-hue-purple shadow-md' : 'bg-white text-army-green border-army-green/20 hover:border-bronze'}`}
                  >
                    <ListChecks size={18} />
                    TRẮC NGHIỆM
                  </button>
                  <button 
                    onClick={() => setSelectedFormat(QuestionFormat.TRUE_FALSE)}
                    className={`flex-1 py-3 px-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all border-2 ${selectedFormat === QuestionFormat.TRUE_FALSE ? 'bg-hue-purple text-white border-hue-purple shadow-md' : 'bg-white text-army-green border-army-green/20 hover:border-bronze'}`}
                  >
                    <CheckSquare size={18} />
                    ĐÚNG/SAI
                  </button>
                  <button 
                    onClick={() => setSelectedFormat(QuestionFormat.SHORT_ANSWER)}
                    className={`flex-1 py-3 px-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all border-2 ${selectedFormat === QuestionFormat.SHORT_ANSWER ? 'bg-hue-purple text-white border-hue-purple shadow-md' : 'bg-white text-army-green border-army-green/20 hover:border-bronze'}`}
                  >
                    <Type size={18} />
                    TRẢ LỜI NGẮN
                  </button>
                </div>

                <h3 className="font-bold text-army-green mb-3 flex items-center gap-2 text-sm uppercase tracking-wide border-b border-bronze/30 pb-2">
                  <FileText size={16} className="text-bronze" />
                  Nội dung câu hỏi gốc
                </h3>

                <div className="mb-5 relative group">
                  <textarea
                    className="w-full p-4 bg-white border-2 border-army-green/30 rounded-lg focus:ring-4 focus:ring-bronze/20 focus:border-bronze transition-all outline-none text-sm min-h-[160px] shadow-inner placeholder:text-army-green/40 resize-none text-army-green font-medium"
                    placeholder={`Nhập nội dung câu hỏi... \n(Dán ảnh Ctrl+V để AI nhận diện)`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onPaste={handlePaste}
                  />
                  {inputText && (
                    <button 
                      onClick={() => setInputText('')}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 bg-white rounded-full shadow-sm border border-gray-200 transition-colors z-10"
                      title="Xóa nội dung"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <div className="absolute bottom-3 right-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-hue-purple bg-purple-50 px-2 py-1 rounded border border-purple-200 font-bold">Hỗ trợ dán ảnh</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="relative group">
                     <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      ref={imageInputRef}
                      className="hidden"
                      id="image-upload"
                    />
                    <label 
                      htmlFor="image-upload"
                      className={`border-2 border-dashed border-army-green/30 rounded-lg p-4 flex flex-col items-center justify-center bg-[#F9F9F4] cursor-pointer transition-all duration-300 h-28 hover:border-bronze hover:bg-white ${imagePreview ? 'border-bronze bg-white' : ''}`}
                    >
                      {imagePreview ? (
                        <div className="relative w-full h-full">
                           <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-md" />
                           <button 
                             onClick={(e) => { e.preventDefault(); removeImage(); }}
                             className="absolute -top-2 -right-2 bg-red-orange text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                           >
                             <X size={12} />
                           </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-army-green/60 group-hover:text-bronze">
                          <ImageIcon size={24} />
                          <span className="text-[10px] font-bold text-center uppercase">Ảnh đề bài</span>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="relative group">
                     <input
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleDocumentChange}
                      ref={docInputRef}
                      className="hidden"
                      id="doc-upload"
                    />
                    <label 
                      htmlFor="doc-upload"
                      className={`border-2 border-dashed border-army-green/30 rounded-lg p-4 flex flex-col items-center justify-center bg-[#F9F9F4] cursor-pointer transition-all duration-300 h-28 hover:border-bronze hover:bg-white ${selectedDocument ? 'border-bronze bg-white' : ''}`}
                    >
                      {selectedDocument ? (
                        <div className="relative w-full h-full flex flex-col items-center justify-center text-hue-purple animate-pulse-slow">
                           <FileType size={32} className="mb-2" />
                           <span className="text-[10px] font-bold text-center px-2 truncate w-full">{selectedDocument.name}</span>
                           <button 
                             onClick={(e) => { e.preventDefault(); removeDocument(); }}
                             className="absolute -top-2 -right-2 bg-red-orange text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                           >
                             <X size={12} />
                           </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-army-green/60 group-hover:text-bronze">
                          <FileType size={24} />
                          <span className="text-[10px] font-bold">File Tài liệu</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                   <Button 
                     onClick={handleGenerate} 
                     className="flex-1 text-base shadow-red-orange/20"
                     isLoading={state.isLoading}
                   >
                     <Sparkles size={18} className="text-yellow-200" />
                     PHÂN TÍCH & TẠO MỚI
                   </Button>
                   {state.result && (
                     <Button onClick={handleReset} variant="outline" className="px-4 rounded-lg border-2">
                       <RefreshCw size={20} />
                     </Button>
                   )}
                </div>
                
                {state.error && (
                  <div className="mt-4 p-4 bg-red-50 text-red-700 text-sm rounded-lg border-l-4 border-red-500 flex items-center gap-3 animate-slide-up font-medium">
                    <X size={18} className="shrink-0" />
                    <span>{state.error}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-army-green text-white p-6 rounded-xl shadow-lg border-2 border-[#2E3B29] relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <h4 className="font-bold text-bronze-light mb-3 flex items-center gap-2 font-serif text-lg">
                <BookOpen size={20} />
                LƯU Ý SƯ PHẠM
              </h4>
              <ul className="space-y-3 text-sm font-medium text-white/90">
                <li className="flex items-start gap-2">
                  <span className="text-bronze">•</span>
                  AI sẽ ưu tiên bối cảnh thực nghiệm và ứng dụng thực tế.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-bronze">•</span>
                  Công thức toán học hiển thị chuẩn LaTeX.
                </li>
              </ul>
            </div>
          </div>

          {/* RIGHT COLUMN: OUTPUT */}
          <div className="lg:col-span-7">
            {state.isLoading ? (
               <div className="h-[500px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-bronze/40 rounded-3xl bg-white/50 backdrop-blur-sm">
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-army-green/20 border-t-bronze rounded-full animate-spin mb-6"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="text-hue-purple animate-pulse" size={32} />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-hue-purple font-serif drop-shadow-md animate-pulse">Thầy Hồ Cang đang xử lý dữ liệu</h3>
                  <p className="text-white/80 max-w-xs mt-3 text-sm font-medium">
                    Hệ thống đang phân tích chỉ báo năng lực và xây dựng câu hỏi mới...
                  </p>
               </div>
            ) : state.result && Array.isArray(state.result) && state.result.length > 0 ? (
               <div className="space-y-12 pb-10 animate-slide-up">
                 
                 {state.result.length > 1 && (
                    <div className="flex items-center gap-3 bg-hue-purple/10 p-4 rounded-xl border border-hue-purple/30">
                        <Layers className="text-hue-purple" size={20} />
                        <span className="font-bold text-hue-purple-dark">Đã xử lý {state.result.length} câu hỏi từ nội dung đầu vào.</span>
                    </div>
                 )}

                 {state.result.map((item, index) => (
                    <div key={index} className="relative group/item text-gray-800">
                        {/* Numbering Badge for List */}
                        {state.result!.length > 1 && (
                            <div className="absolute -left-4 -top-4 z-10 bg-army-green text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg border-2 border-white font-serif">
                                {index + 1}
                            </div>
                        )}
                        
                        {/* REGENERATE BUTTON */}
                        <button
                          onClick={() => handleRegenerateItem(index)}
                          className="absolute -top-3 -right-14 z-30 p-2 bg-white text-bronze hover:bg-bronze hover:text-white rounded-full shadow-lg border-2 border-bronze/20 transition-all duration-300 hover:scale-110"
                          title="Làm mới câu hỏi này"
                        >
                           <RotateCw size={18} />
                        </button>

                        {/* DELETE BUTTON - Now always visible */}
                        <button
                          onClick={() => handleRemoveResult(index)}
                          className="absolute -top-3 -right-3 z-30 p-2 bg-white text-red-orange hover:bg-red-orange hover:text-white rounded-full shadow-lg border-2 border-red-orange/20 transition-all duration-300 hover:scale-110"
                          title="Xóa câu hỏi này"
                        >
                           <Trash2 size={18} />
                        </button>

                        <div className={`space-y-8 ${state.result!.length > 1 ? 'p-6 bg-white rounded-3xl border border-army-green/10 shadow-sm' : ''}`}>
                            {item.source && (
                              <div>
                                  <div className="flex items-center gap-3 mb-4">
                                      <span className="flex items-center justify-center w-8 h-8 rounded bg-bronze text-white font-bold shadow-md text-sm">I</span>
                                      <h3 className="font-bold text-bronze text-xl tracking-tight uppercase font-serif">Đánh giá câu hỏi gốc</h3>
                                  </div>
                                  <SourceAnalysisCard data={item.source} />
                              </div>
                            )}

                            {item.generated && (
                              <div>
                                  <div className="flex items-center gap-3 mb-4">
                                      <span className="flex items-center justify-center w-8 h-8 rounded bg-red-orange text-white font-bold shadow-md text-sm">II</span>
                                      <h3 className="font-bold text-red-orange text-xl tracking-tight uppercase font-serif">Câu hỏi đề xuất</h3>
                                  </div>
                                  <QuestionCard 
                                     data={item.generated} 
                                     onTransform={(newFormat) => handleTransform(index, newFormat)}
                                  />
                              </div>
                            )}

                            <CritiqueSection analysisResult={item} />
                        </div>
                    </div>
                 ))}
               </div>
            ) : (
              <div className="h-full min-h-[450px] flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-white/20 bg-white/10 backdrop-blur-md rounded-3xl shadow-sm group hover:bg-white/20 transition-all duration-500">
                 <div className="bg-white p-6 rounded-full mb-6 shadow-xl shadow-black/30 group-hover:scale-110 transition-transform duration-300 border border-white/20">
                   <Sparkles className="text-hue-purple" size={48} />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-2 font-serif">Sẵn sàng khởi tạo</h3>
                 <p className="text-gray-300 max-w-sm text-sm leading-relaxed font-medium">
                   Hãy nhập câu hỏi vào cột bên trái. <br/>AI sẽ giúp bạn tạo ra các biến thể tương đương.
                 </p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;