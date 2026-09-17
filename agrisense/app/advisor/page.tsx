"use client";

import { useState, useRef, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { sendChatMessage } from "@/lib/api";
import { Send, Bot, User, Sparkles, AlertCircle, Volume2, VolumeX, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const langLocales: Record<string, string> = {
  hi: "hi-IN",
  mr: "mr-IN",
  ta: "ta-IN",
  en: "en-IN",
};

export default function AIAdvisor() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: t("advisor.initialAssistant"),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const suggestedPrompts = [
    t("advisor.prompt1"),
    t("advisor.prompt2"),
    t("advisor.prompt3"),
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Clean up any ongoing speech synthesis or recognition on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort?.();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      toast.error(t("advisor.speechUnsupported") || "Voice input is not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = langLocales[language] || "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const toggleSpeak = (text: string, index: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Audio playback is not supported in this browser.");
      return;
    }

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = langLocales[language] || "en-IN";
    utterance.lang = targetLang;
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(
      (v) => v.lang.toLowerCase() === targetLang.toLowerCase() || v.lang.startsWith(language)
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (message: string) => {
    if (!message.trim()) return;

    // Stop speaking if new message is sent
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
    }

    // Append user message immediately
    const newMessages: Message[] = [...messages, { role: "user", content: message }];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);
    setError(null);

    try {
      // Pass the current message history and dynamic user profile context to backend
      const response = await sendChatMessage(newMessages, message, user);
      // Wait for the backend LLM engine response
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response?.reply || response?.response || "I am currently analyzing those parameters. Please try again in an hour." },
      ]);
    } catch (err) {
      console.error(err);
      setError("AI Engine is temporarily unavailable.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-[calc(100vh-140px)] max-w-[800px] w-full mx-auto relative">
        <section className="flex flex-col gap-1 border-b-[0.5px] border-[#D9CEB8] pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="font-display font-semibold text-[24px] text-[#2C2416] flex items-center gap-2">
              <Sparkles size={20} className="text-[#5C7A52]" /> {t("advisor.title")}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAE3D2] border border-[#D9CEB8] text-[11px] font-medium text-[#5C7A52]">
              <span className="w-2 h-2 rounded-full bg-[#5C7A52] animate-pulse"></span>
              Voice-First AI
            </span>
          </div>
          <p className="font-body text-[#7A6A55] text-[13px]">
            {t("advisor.subtitle")}
          </p>
        </section>

        {/* Chat History Area */}
        <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-6 scrollbar-hide">
          
          {error && (
            <div className="bg-[#FDFAF4] border-[0.5px] border-[#7A3B2E] rounded-lg p-3 text-[#7A3B2E] text-[12px] flex items-center justify-center gap-2">
              <AlertCircle size={14}/> {error}
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* Bot Avatar (Left) */}
              {msg.role === "assistant" && (
                <div className="w-[36px] h-[36px] bg-[#5C7A52] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot size={18} className="text-white" />
                </div>
              )}

              {/* Chat Bubble */}
              <div
                className={`max-w-[80%] sm:max-w-[75%] p-4 rounded-[16px] font-body text-[14px] leading-relaxed shadow-sm block break-words ${
                  msg.role === "user"
                    ? "bg-[#2C2416] text-white rounded-tr-[4px]"
                    : "bg-[#F5F1EA] border border-[#D9CEB8] text-[#2C2416] rounded-tl-[4px]"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Voice-First Read Out Action for AI Responses */}
                {msg.role === "assistant" && (
                  <div className="mt-3 pt-2.5 border-t border-[#D9CEB8]/60 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-[#7A6A55] flex items-center gap-1.5">
                      <Sparkles size={12} className="text-[#5C7A52]" />
                      {speakingIndex === index ? "Audio playing..." : "AgriSense Voice"}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleSpeak(msg.content, index)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all shadow-sm ${
                        speakingIndex === index
                          ? "bg-[#7A3B2E] text-white animate-pulse"
                          : "bg-white border border-[#D9CEB8] text-[#5C7A52] hover:bg-[#DDE8D9] hover:border-[#5C7A52]"
                      }`}
                      title={speakingIndex === index ? t("advisor.stopAudio") : t("advisor.readOut")}
                    >
                      {speakingIndex === index ? (
                        <>
                          <VolumeX size={13} />
                          <span>{t("advisor.stopAudio")}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={13} />
                          <span>{t("advisor.readOut")}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* User Avatar (Right) */}
              {msg.role === "user" && (
                <div className="w-[36px] h-[36px] bg-[#C9A97A] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <User size={18} className="text-[#2C2416]" />
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 w-full justify-start items-center">
              <div className="w-[36px] h-[36px] bg-[#5C7A52] rounded-full flex items-center justify-center flex-shrink-0">
                <Bot size={18} className="text-white" />
              </div>
              <div className="bg-[#F5F1EA] border border-[#D9CEB8] rounded-[16px] rounded-tl-[4px] p-4 flex gap-1 h-[42px] items-center justify-center shadow-sm">
                <div className="w-1.5 h-1.5 bg-[#A8C4A1] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-[#A8C4A1] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-[#A8C4A1] rounded-full animate-bounce"></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-[2px]" />
        </div>

        {/* Input Area (Pinned to bottom of container) */}
        <div className="flex flex-col gap-3 bg-white/90 backdrop-blur pt-2 flex-shrink-0 border-t-[0.5px] border-transparent">
          {/* Suggested Prompts */}
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start overflow-x-auto pb-2 scrollbar-hide">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                disabled={isTyping}
                className="whitespace-nowrap px-4 py-[6px] rounded-[24px] border border-[#D9CEB8] bg-[#F5F1EA] text-[#7A6A55] text-[12px] font-medium hover:bg-[#DDE8D9] hover:text-[#5C7A52] hover:border-[#5C7A52] transition-colors disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Active Listening Indicator Banner */}
          {isListening && (
            <div className="flex items-center justify-center gap-2 py-1 px-3 bg-[#FDFAF4] border border-[#7A3B2E]/30 rounded-full text-[12px] text-[#7A3B2E] font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#7A3B2E] animate-ping"></span>
              <span>{t("advisor.listening")} (Speaking in {langLocales[language] || "en-IN"})</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping}
                placeholder={
                  isListening
                    ? `${t("advisor.listening")}`
                    : t("advisor.placeholder")
                }
                className={`w-full bg-[#F5F1EA] border rounded-[24px] pl-6 pr-14 py-4 outline-none text-[#2C2416] text-[14px] disabled:opacity-50 transition-all font-body ${
                  isListening
                    ? "border-[#7A3B2E] ring-2 ring-[#7A3B2E]/20 bg-[#FDFAF4]"
                    : "border-[#D9CEB8] focus:ring-1 focus:ring-[#5C7A52]"
                }`}
              />

              {/* Voice Input Microphone Button */}
              <button
                type="button"
                onClick={toggleListening}
                disabled={isTyping}
                aria-label={isListening ? t("advisor.listening") : t("advisor.voiceInput")}
                title={isListening ? t("advisor.listening") : t("advisor.voiceInput")}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? "bg-[#7A3B2E] text-white animate-pulse shadow-md ring-4 ring-[#7A3B2E]/20"
                    : "bg-white/80 hover:bg-[#DDE8D9] text-[#5C7A52] border border-[#D9CEB8]/70"
                }`}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-[#5C7A52] text-white w-[54px] h-[54px] rounded-full flex items-center justify-center hover:bg-[#3A5E32] disabled:opacity-50 disabled:bg-[#A8C4A1] transition-colors flex-shrink-0 shadow-sm"
              aria-label={t("advisor.send")}
            >
              <Send size={18} className="translate-x-[1px]" />
            </button>
          </form>
          <div className="text-center mt-2 pb-2">
            <span className="text-[10px] text-[#A69B8D] uppercase tracking-widest font-medium">
              {t("advisor.disclaimer")}
            </span>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
