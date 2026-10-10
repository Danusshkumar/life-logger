import React, { useState, useRef } from 'react';
import { Square, Sparkles, Loader2 } from 'lucide-react';
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
    <div className="fixed bottom-24 right-5 z-50">
      {isListening ? (
        <button
          onClick={stopRecordingAndProcess}
          disabled={isProcessing}
          title="Done Speaking - Stop & Process"
          className="w-14 h-14 bg-rose-600 hover:bg-rose-500 border border-rose-400/40 text-white rounded-full shadow-2xl active:scale-95 transition-all cursor-pointer flex items-center justify-center animate-pulse"
        >
          <Square className="w-6 h-6 fill-white" />
        </button>
      ) : isProcessing ? (
        <button
          disabled
          title="Gemini AI Processing..."
          className="w-14 h-14 bg-slate-900 border border-indigo-500/50 text-indigo-300 rounded-full shadow-2xl flex items-center justify-center"
        >
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
        </button>
      ) : (
        <button
          onClick={startRecording}
          disabled={isProcessing}
          title="Voice Journaling with Gemini AI"
          className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/40 text-white rounded-full shadow-2xl active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  );
};
