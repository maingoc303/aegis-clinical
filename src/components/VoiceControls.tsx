import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX, Pause, Play, Sparkles } from "lucide-react";

// Get standard browser SpeechRecognition constructors
const SpeechRecognition = typeof window !== "undefined" 
  ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) 
  : null;

interface VoiceDictationButtonProps {
  onTranscript: (text: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function VoiceDictationButton({
  onTranscript,
  placeholder = "Listening...",
  className = "",
  id
}: VoiceDictationButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermissionError, setHasPermissionError] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (SpeechRecognition) {
      setIsSupported(true);
    }
  }, []);

  const startListening = () => {
    if (!SpeechRecognition) return;
    setHasPermissionError(false);

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setHasPermissionError(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onTranscript(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          setHasPermissionError(true);
          // Auto-clear permission warning after 6 seconds
          setTimeout(() => {
            setHasPermissionError(false);
          }, 6000);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error("Failed to initialize speech recognition:", e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return null; // hide or return disabled if voice is not supported in browser environment
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        id={id}
        type="button"
        onClick={toggleListening}
        className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center cursor-pointer shadow-sm ${
          isListening 
            ? "bg-rose-50 border-rose-300 text-rose-600 animate-pulse" 
            : hasPermissionError
              ? "bg-amber-50 border-amber-300 text-amber-700"
              : "bg-stone-50 hover:bg-emerald-50 hover:border-emerald-200 border-stone-200 text-stone-500 hover:text-emerald-700"
        } ${className}`}
        title={isListening ? "Stop voice dictation" : "Dictate with your voice (Voice input)"}
      >
        {isListening ? <MicOff size={14} className="animate-bounce" /> : <Mic size={14} />}
      </button>

      {isListening && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] font-mono px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 flex items-center gap-1 animate-fadeIn">
          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
          {placeholder}
        </span>
      )}

      {hasPermissionError && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-amber-950 text-amber-100 text-[9.5px] font-sans px-3 py-1.5 rounded-xl shadow-lg border border-amber-800 whitespace-normal w-52 text-center leading-normal z-50 animate-fadeIn">
          <p className="font-semibold text-amber-300 mb-0.5">Microphone Denied</p>
          Please check your browser permissions to allow microphone access.
        </div>
      )}
    </div>
  );
}

interface TextToSpeechButtonProps {
  text: string;
  className?: string;
  id?: string;
}

export function TextToSpeechButton({
  text,
  className = "",
  id
}: TextToSpeechButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setIsSupported(true);
    }

    // Cleanup voice synthesis when component unmounts
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Clean Markdown markers or tags from the spoken text so it sounds perfect
  const getCleanSpokenText = (rawText: string) => {
    if (!rawText) return "";
    return rawText
      .replace(/\*\*/g, "") // bold
      .replace(/\*/g, "")  // italic or lists
      .replace(/###/g, "") // headers
      .replace(/##/g, "")  // headers
      .replace(/- /g, "")  // list lines
      .replace(/<[^>]*>/g, ""); // strip raw HTML tags if any
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSupported) return;

    const synth = window.speechSynthesis;

    // If currently playing, cancel it
    if (isPlaying) {
      synth.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      return;
    }

    const cleanedText = getCleanSpokenText(text);
    if (!cleanedText) return;

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    
    // Choose a warm natural speaking voice if available
    const voices = synth.getVoices();
    const optimalVoice = voices.find(v => 
      v.lang.startsWith("en-") && 
      (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha"))
    );
    if (optimalVoice) {
      utterance.voice = optimalVoice;
    }
    
    // Slower speed / lower pitch makes it comfortable for old people
    utterance.rate = 0.92; // Slightly slower for absolute comprehension
    utterance.pitch = 1.05;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    synth.cancel(); // kill existing voices first
    synth.speak(utterance);
  };

  const handlePauseToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const synth = window.speechSynthesis;
    if (isPaused) {
      synth.resume();
      setIsPaused(false);
    } else {
      synth.pause();
      setIsPaused(true);
    }
  };

  if (!isSupported) return null;

  return (
    <div className="flex items-center gap-1.5">
      <button
        id={id}
        type="button"
        onClick={handleSpeak}
        className={`p-2 rounded-xl border transition-all duration-300 flex items-center justify-center cursor-pointer shadow-sm ${
          isPlaying 
            ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold" 
            : "bg-stone-50 hover:bg-stone-100 hover:text-stone-900 border-stone-200 text-stone-500"
        } ${className}`}
        title={isPlaying ? "Stop reading aloud" : "Read this content aloud (Voice synthesis)"}
      >
        {isPlaying ? <VolumeX size={13} /> : <Volume2 size={13} />}
        {isPlaying && (
          <span className="ml-1.5 text-[9px] font-mono font-bold tracking-widest text-emerald-700 uppercase flex items-center gap-1">
            <span className="flex gap-0.5 items-end h-2.5">
              <span className="w-0.5 bg-emerald-600 animate-[pulse_0.6s_infinite] h-2" />
              <span className="w-0.5 bg-emerald-600 animate-[pulse_0.4s_infinite_0.1s] h-3" />
              <span className="w-0.5 bg-emerald-600 animate-[pulse_0.5s_infinite_0.2s] h-1.5" />
            </span>
            SPEAKER ON
          </span>
        )}
      </button>

      {isPlaying && (
        <button
          type="button"
          onClick={handlePauseToggle}
          className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-all flex items-center justify-center cursor-pointer"
          title={isPaused ? "Resume reading" : "Pause reading"}
        >
          {isPaused ? <Play size={13} /> : <Pause size={13} />}
        </button>
      )}
    </div>
  );
}
