import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, AlertCircle, RefreshCw, Activity, User, Reply, Bot } from "lucide-react";
import { ChatMessage, MedicalData } from "../types";
import { VoiceDictationButton, TextToSpeechButton } from "./VoiceControls";

interface ChatPanelProps {
  medicalData: MedicalData | null;
  selectedModel: string;
  expertise: string;
  manualCurationGuidance: string;
  activeSkills?: string[];
  sessionKey?: number;
  language?: string;
}

// Simple and safe text-to-HTML formatter to render Gemini's Markdown output elegantly
const formatMarkdownText = (text: string) => {
  if (!text) return "";
  
  // Format bold text (**bold**)
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-stone-905">$1</strong>');
  
  // Format clean line-breaks or lists
  const lines = formatted.split("\n");
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      return `<li class="ml-4 list-disc text-sm text-stone-700 font-light pb-1">${trimmed.substring(2)}</li>`;
    }
    if (trimmed.match(/^\d+\.\s/)) {
      // Ordered list items
      const content = trimmed.replace(/^\d+\.\s/, "");
      return `<li class="ml-4 list-decimal text-sm text-stone-700 font-light pb-1">${content}</li>`;
    }
    if (trimmed.startsWith("### ")) {
      return `<h5 class="text-sm font-semibold text-stone-900 pt-3 pb-1 uppercase tracking-wider font-mono">${trimmed.substring(4)}</h5>`;
    }
    if (trimmed.startsWith("## ")) {
      return `<h4 class="text-base font-serif font-medium text-stone-950 pt-4 pb-1">${trimmed.substring(3)}</h4>`;
    }
    if (trimmed === "") {
      return `<div class="h-2"></div>`;
    }
    return `<p class="text-sm text-stone-650 leading-relaxed font-light pb-2.5">${line}</p>`;
  });

  return processedLines.join("");
};

export default function ChatPanel({
  medicalData,
  selectedModel,
  expertise,
  manualCurationGuidance,
  activeSkills,
  sessionKey,
  language,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      content: language === "vi"
        ? "Xin chào! Tôi là Trợ lý Lâm sàng AI của bạn. Nếu bạn đã tải lên tệp y tế, tôi đã nhập tệp đó vào không gian làm việc của mình và có thể giải thích các kết quả xét nghiệm hoặc đơn thuốc cụ thể. Hôm nay bạn muốn thảo luận điều gì?"
        : "Hello! I am your AI Clinical Assistant. If you have uploaded a medical file, I have imported it into my workspace and can explain specific test results or prescriptions. What would you like to discuss today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  useEffect(() => {
    if (messages.length === 1 && messages[0].id === "welcome") {
      setMessages([
        {
          id: "welcome",
          role: "model",
          content: language === "vi"
            ? "Xin chào! Tôi là Trợ lý Lâm sàng AI của bạn. Nếu bạn đã tải lên tệp y tế, tôi đã nhập tệp đó vào không gian làm việc của mình và có thể giải thích các kết quả xét nghiệm hoặc đơn thuốc cụ thể. Hôm nay bạn muốn thảo luận điều gì?"
            : "Hello! I am your AI Clinical Assistant. If you have uploaded a medical file, I have imported it into my workspace and can explain specific test results or prescriptions. What would you like to discuss today?",
          timestamp: messages[0].timestamp,
        }
      ]);
    }
  }, [language]);

  useEffect(() => {
    if (sessionKey !== undefined && sessionKey > 0) {
      setMessages([
        {
          id: "welcome",
          role: "model",
          content: language === "vi"
            ? "Xin chào! Tôi là Trợ lý Lâm sàng AI của bạn. Nếu bạn đã tải lên tệp y tế, tôi đã nhập tệp đó vào không gian làm việc của mình và có thể giải thích các kết quả xét nghiệm hoặc đơn thuốc cụ thể. Hôm nay bạn muốn thảo luận điều gì?"
            : "Hello! I am your AI Clinical Assistant. If you have uploaded a medical file, I have imported it into my workspace and can explain specific test results or prescriptions. What would you like to discuss today?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setInputVal("");
    }
  }, [sessionKey]);

  useEffect(() => {
    try {
      localStorage.setItem("aegis_current_chat", JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const endOfChatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Automatically auto-scroll to latest replies
    endOfChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Quick Action Chips to help users start conversations fast!
  const quickPrompts = medicalData 
    ? (language === "vi" ? [
        { label: "Phân tích giá trị bất thường", text: "Có chỉ số nào bất thường hoặc nằm ngoài phạm vi trong báo cáo của tôi không, và chúng có ý nghĩa gì?" },
        { label: "Chi tiết danh sách thuốc", text: "Giải thích các loại thuốc được kê đơn, hướng dẫn chung và mục đích lâm sàng của chúng." },
        { label: "Lối sống & Thói quen tốt", text: "Những thói quen lối sống lành mạnh hoặc hành động nào tôi nên thảo luận với bác sĩ của mình?" },
        { label: "Tóm tắt báo cáo này", text: "Hãy cho tôi một bản tóm tắt dễ hiểu của tài liệu y tế này." }
      ] : [
        { label: "Analyze out-of-range values", text: "Are there any abnormal or out-of-range parameters in my report, and what do they mean?" },
        { label: "Medication list detail", text: "Explain the prescribed medications, their general instructions, and clinical purposes." },
        { label: "Lifestyle action-items", text: "What healthy lifestyle habits or action items should I discuss with my physician?" },
        { label: "Summarize this report", text: "Give me an easy-to-understand executive summary of my medical document." }
      ])
    : (language === "vi" ? [
        { label: "Mã bệnh nhân là gì?", text: "ID bệnh nhân hoặc mã số hồ sơ bệnh án (MRN) có ý nghĩa gì trong thủ tục lâm sàng?" },
        { label: "Chuẩn bị xét nghiệm máu", text: "Các quy trình nhịn ăn thông thường trước khi thực hiện bảng xét nghiệm chuyển hóa toàn diện là gì?" },
        { label: "Giải thích về dấu hiệu sinh tồn", text: "Huyết áp và nhịp tim bình thường đối với người trưởng thành khỏe mạnh là bao nhiêu?" }
      ] : [
        { label: "What is an MRN?", text: "What does Patient ID or MRN stand for in clinical paperwork?" },
        { label: "Preparing for bloodwork", text: "What are typical fasting protocols before a standard comprehensive metabolic panel?" },
        { label: "Reading lab values", text: "How should I read the reference ranges on my lab test results sheets?" }
      ]);

  const handleSendMessage = async (rawMessageText: string) => {
    if (!rawMessageText.trim() || isTyping) return;

    setApiError(null);
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: rawMessageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputVal("");
    setIsTyping(true);

    try {
      // Accumulate context messages to send a proper conversational array
      const requestPayload = {
        messages: [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        })),
        medicalContext: medicalData, // Feed loaded clinical results safely server-side
        model: selectedModel,
        expertise: expertise,
        manualCurationGuidance: manualCurationGuidance,
        activeSkills: activeSkills,
        language: language,
      };

      const response = await fetch("/api/medical-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "The medical chatbot timed out or failed to reply.");
      }

      const modelMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "model",
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      console.error("Chat panel request error:", err);
      setApiError(err.message || "Unable to retrieve AI advice right now.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickPromptClick = (text: string) => {
    handleSendMessage(text);
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "model",
        content: medicalData 
          ? "Hello again! I am synced with your active clinical document dossier. Drop any question below about specific parameters, medication instructions, or general observations."
          : "Hello! I am ready to help. Upload a file above or write any healthcare-related inquiry below.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
    setApiError(null);
  };

  return (
    <div id="ai-chatbox" className="bg-white border border-stone-200 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col h-[600px] overflow-hidden">
      
      {/* Chat header */}
      <div className="bg-stone-50 border-b border-stone-200 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
            <Sparkles size={16} className="fill-emerald-100" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-semibold text-stone-950 flex items-center gap-1.5">
              {language === "vi" ? "Trợ Lý Lâm Sàng AI" : "AI Clinical Assistant"}
            </h3>
            <p className="text-[10px] text-stone-500 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              {expertise ? (language === "vi" ? `KỸ NĂNG ${expertise} ĐANG HOẠT ĐỘNG` : `${expertise} SKILLS ACTIVE`) : (medicalData ? (language === "vi" ? "ĐÃ ĐỒNG BỘ VỚI HỒ SƠ LÂM SÀNG" : "SYNCED WITH LOADED DOSSIER") : (language === "vi" ? "TRẠNG THÁI SẴN SÀNG" : "ONLINE STANDBY"))}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {expertise && (
            <span className="hidden sm:inline-block text-[9px] font-mono font-bold bg-stone-900 text-stone-100 px-2 py-1 rounded-md">
              {language === "vi" ? "Kỹ năng: " : "Skills: "}{expertise === "PATIENT" ? (language === "vi" ? "phổ thông" : "layman") : expertise === "MD_PRACTITIONER" ? (language === "vi" ? "chẩn đoán+đơn thuốc" : "diagnosis+rx") : expertise === "PHARMACIST" ? (language === "vi" ? "dược lý" : "pharma") : expertise === "PATHOLOGIST" ? (language === "vi" ? "chỉ số" : "biomarkers") : "research"}
            </span>
          )}
          <button 
            onClick={clearChat}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-all text-xs font-mono tracking-wider flex items-center gap-1"
            title={language === "vi" ? "Xóa lịch sử cuộc hội thoại" : "Clear dialog history"}
          >
            <RefreshCw size={11} /> {language === "vi" ? "Xóa" : "Clear"}
          </button>
        </div>
      </div>

      {/* Messages stream */}
      <div className="flex-1 overflow-y-auto p-5 bg-stone-50/40 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.role === "user";
          return (
            <div 
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {/* Profile icon */}
              <div className={`size-7.5 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${
                isMe ? "bg-stone-900 border-stone-950 text-white" : "bg-emerald-50 border-emerald-150 text-emerald-700"
              }`}>
                {isMe ? <User size={13} /> : <Bot size={13} className="stroke-[2]" />}
              </div>

              {/* Message box */}
              <div className="space-y-1">
                <div 
                  className={`p-3.5 rounded-2xl ${
                    isMe 
                      ? "bg-stone-900 text-stone-100 rounded-tr-none shadow-sm" 
                      : "bg-white border border-stone-200 text-stone-855 rounded-tl-none shadow-sm"
                  }`}
                >
                  {isMe ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-light">{msg.content}</p>
                  ) : (
                    <div 
                      className="space-y-2 formatted-clinical-markdown"
                      dangerouslySetInnerHTML={{ __html: formatMarkdownText(msg.content) }}
                    />
                  )}
                </div>
                {/* Timestamp & Voice option */}
                <div className={`flex items-center gap-2 ${isMe ? "justify-end mr-1" : "ml-1"}`}>
                  <span className="block text-[10px] text-stone-400 font-mono">
                    {msg.timestamp}
                  </span>
                  {!isMe && (
                    <TextToSpeechButton 
                      text={msg.content} 
                      className="p-1 px-1.5 h-5.5 rounded-lg border-stone-150 bg-stone-100/40 text-[9px]" 
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="size-7.5 rounded-full flex items-center justify-center shrink-0 border border-emerald-150 bg-emerald-50 text-emerald-700 shadow-sm animate-pulse">
              <Bot size={13} />
            </div>
            <div className="p-3.5 bg-white border border-stone-200 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-1.5 self-start">
              <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}

        {apiError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2 max-w-[90%]">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">{language === "vi" ? "Lỗi Hỗ Trợ Trò Chuyện:" : "Chat Assistance Error:"}</span> {apiError}
              <button 
                onClick={() => setApiError(null)} 
                className="block underline mt-1 font-semibold hover:text-rose-900"
              >
                {language === "vi" ? "Bỏ qua" : "Dismiss"}
              </button>
            </div>
          </div>
        )}

        <div ref={endOfChatRef} />
      </div>

      {/* Suggestion Chips Panel */}
      <div className="px-5 py-2.5 bg-stone-50 border-t border-stone-150 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
        {quickPrompts.map((chip, index) => (
          <button
            key={index}
            onClick={() => handleQuickPromptClick(chip.text)}
            disabled={isTyping}
            className="shrink-0 px-3 py-1.5 bg-white border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50 text-stone-600 hover:text-emerald-900 text-xs rounded-full font-light transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input controls form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputVal);
        }}
        className="p-4 border-t border-stone-250 flex items-center gap-2 bg-white shrink-0"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={isTyping}
          placeholder={medicalData 
            ? (language === "vi" ? "Hỏi về các chỉ số bất thường, hướng dẫn sử dụng, chẩn đoán..." : "Ask about high values, dose protocols, or definitions...")
            : (language === "vi" ? "Nhập câu hỏi y tế, hướng dẫn nhịn ăn, chỉ số xét nghiệm..." : "Ask a medical question, CMP protocols, fasting rules...")}
          className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-light text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all disabled:opacity-70"
        />
        <VoiceDictationButton
          onTranscript={(text) => setInputVal(prev => prev ? `${prev} ${text}` : text)}
          placeholder={language === "vi" ? "Đang thu âm..." : "Dictating question..."}
          className="p-3 rounded-xl border-stone-200"
        />
        <button
          type="submit"
          disabled={!inputVal.trim() || isTyping}
          className="p-3 bg-stone-900 text-white hover:bg-emerald-700 disabled:bg-stone-100 disabled:text-stone-400 rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0 cursor-pointer"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
