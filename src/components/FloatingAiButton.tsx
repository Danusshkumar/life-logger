import React, { useState, useRef } from 'react';
import { Mic, Square, Sparkles, Loader2 } from 'lucide-react';
import type { Tag } from '../types';
import { processAudioLogWithGemini } from '../services/geminiAi';

interface FloatingAiButtonProps {
  availableTags: Tag[];
  accessToken: string | null;
  geminiApiKey?: string;
  onPrefillLog: (tags: string[], description: string) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const FloatingAiButton: React.FC<FloatingAiButtonProps> = ({
  availableTags,
  accessToken,
  geminiApiKey,
  onPrefillLog,
  showToast,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast('Microphone access is not supported in this browser.', 'error');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      showToast('Recording voice note...', 'success');
    } catch (err: any) {
      console.error('Microphone error:', err);
      showToast('Microphone permission denied or unavailable.', 'error');
      setIsListening(false);
    }
  };

  const stopRecordingAndProcess = async () => {
    if (!mediaRecorderRef.current || !isListening) return;

    setIsListening(false);
    setIsProcessing(true);

    const mediaRecorder = mediaRecorderRef.current;

    mediaRecorder.onstop = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        if (audioBlob.size === 0) {
          showToast('No voice audio detected. Please try recording again.', 'error');
          setIsProcessing(false);
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          try {
            const base64Audio = (reader.result as string).split(',')[1];
            const result = await processAudioLogWithGemini(
              base64Audio,
              mimeType,
              availableTags,
              accessToken,
              geminiApiKey
            );

            onPrefillLog(result.tags, result.description);
            showToast(`✨ Gemini AI prefilled ${result.tags.length} tag(s) and journal note!`, 'success');
          } catch (error: any) {
            console.error('Gemini audio processing error:', error);
            showToast(error.message || 'Failed to process voice recording with Gemini AI.', 'error');
          } finally {
            setIsProcessing(false);
          }
        };
      } catch (err: any) {
        console.error('Audio conversion error:', err);
        showToast('Failed to process audio recording.', 'error');
        setIsProcessing(false);
      }
    };

    mediaRecorder.stop();
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end">
      {/* Live Recording Badge Indicator */}
      {isListening && (
        <div className="mb-2 bg-rose-950/90 border border-rose-800 text-rose-200 text-xs px-3.5 py-2 rounded-2xl shadow-xl flex items-center space-x-2 animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span className="font-semibold">Recording voice note...</span>
        </div>
      )}

      {/* AI Processing Floating Badge */}
      {isProcessing && (
        <div className="mb-2 bg-gradient-to-r from-indigo-900 to-purple-900 border border-indigo-500/60 backdrop-blur-md text-indigo-200 text-xs px-3.5 py-2 rounded-2xl shadow-xl flex items-center space-x-2 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span className="font-medium">Gemini AI generating entry...</span>
        </div>
      )}

      {/* Main Floating Action Button */}
      {isListening ? (
        <button
          onClick={stopRecordingAndProcess}
          disabled={isProcessing}
          className="flex items-center space-x-2 bg-gradient-to-r from-rose-600 to-red-600 text-white px-4 py-3 rounded-full shadow-2xl shadow-rose-600/50 hover:scale-105 active:scale-95 transition-all cursor-pointer ring-4 ring-rose-500/30 animate-pulse"
        >
          <Square className="w-4 h-4 fill-white" />
          <span className="text-xs font-bold tracking-wide">Done Speaking</span>
        </button>
      ) : (
        <button
          onClick={startRecording}
          disabled={isProcessing}
          title="Voice Journaling with Gemini AI"
          className="relative group bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white p-3.5 rounded-full shadow-lg shadow-indigo-900/30 hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center"
        >
          <div className="flex items-center space-x-1.5">
            <Mic className="w-5 h-5" />
            <Sparkles className="w-4 h-4 text-amber-300/90" />
          </div>
          {/* Light Glow Ring */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-20 group-hover:opacity-40 blur-sm transition duration-200 -z-10" />
        </button>
      )}
    </div>
  );
};
