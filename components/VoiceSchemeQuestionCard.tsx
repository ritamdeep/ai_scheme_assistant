'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Send,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { Scheme } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { useSpeech, LANG_CODES } from '@/lib/speech';

interface VoiceSchemeQuestionCardProps {
  scheme: Scheme;
}

type CardState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export function VoiceSchemeQuestionCard({ scheme }: VoiceSchemeQuestionCardProps) {
  const { profile } = useAuth();
  const { locale, t } = useTranslation();
  const { isSpeaking, speak, stop: stopAudio } = useSpeech(`scheme-voice-${scheme.id}`);

  const [cardState, setCardState] = useState<CardState>('idle');
  const [transcribedQuery, setTranscribedQuery] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isTypeMode, setIsTypeMode] = useState(false);
  const [typedInput, setTypedInput] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const langCode = LANG_CODES[locale] || 'en-IN';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stopAudio]);

  // Start Voice Recording & Speech Recognition
  const startListening = async () => {
    setErrorMessage('');
    setTranscribedQuery('');
    setAnswerText('');
    stopAudio();

    // 1. Request microphone permission
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch (err: any) {
      console.warn('[SEVA AI Voice Card] Microphone access denied:', err);
      setErrorMessage(
        t('schemeDetail.micPermission') ||
          'Please allow microphone access to ask questions by voice.'
      );
      setCardState('error');
      return;
    }

    setCardState('listening');

    // 2. Setup MediaRecorder for fallback transcription
    audioChunksRef.current = [];
    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start();
    } catch (recErr) {
      console.warn('[SEVA AI Voice Card] MediaRecorder init error:', recErr);
    }

    // 3. Setup Web Speech API if supported
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    let hasSpeechRecognitionResult = false;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = langCode;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          const transcript = event.results?.[0]?.[0]?.transcript;
          if (transcript) {
            hasSpeechRecognitionResult = true;
            stopListeningAndProcess(transcript);
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('[SEVA AI Voice Card] Web Speech error:', e);
          // Don't error out yet; fallback to MediaRecorder
        };

        recognition.onend = () => {
          if (!hasSpeechRecognitionResult && cardState === 'listening') {
            // Stop recorder and transcribe via server route
            stopListeningAndProcess();
          }
        };

        recognition.start();
      } catch (recStartErr) {
        console.warn('[SEVA AI Voice Card] SpeechRecognition start failed:', recStartErr);
      }
    }
  };

  // Stop recording and process query
  const stopListeningAndProcess = async (directTranscript?: string) => {
    // Stop Web Speech
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    // Stop MediaRecorder
    let audioBlob: Blob | null = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        mediaRecorderRef.current!.onstop = () => {
          const type = mediaRecorderRef.current?.mimeType || 'audio/webm';
          audioBlob = new Blob(audioChunksRef.current, { type });
          resolve();
        };
        mediaRecorderRef.current!.stop();
      });
    }

    // Stop stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setCardState('thinking');

    let finalQuery = directTranscript?.trim() || '';

    // If Web Speech didn't return text, transcribe via Gemini server endpoint
    if (!finalQuery && audioBlob) {
      try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('langCode', langCode);

        const transcribeRes = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData,
        });

        if (transcribeRes.ok) {
          const data = await transcribeRes.json();
          finalQuery = data.text?.trim() || '';
        }
      } catch (transErr) {
        console.warn('[SEVA AI Voice Card] Server transcribe error:', transErr);
      }
    }

    if (!finalQuery) {
      setErrorMessage(
        t('common.failed') ||
          'Could not detect speech. Please tap the mic and try speaking again.'
      );
      setCardState('error');
      return;
    }

    setTranscribedQuery(finalQuery);
    await sendQueryToRAG(finalQuery);
  };

  // Send question to RAG chat endpoint
  const sendQueryToRAG = async (query: string) => {
    setCardState('thinking');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeId: scheme.id,
          message: query,
          userProfile: profile,
          conversationHistory: [],
        }),
      });

      if (!res.ok) {
        throw new Error(`Chat API error (HTTP ${res.status})`);
      }

      const data = await res.json();
      const rawAnswer = data.answer || data.reply || '';

      // Simplify to 3-4 sentences max
      const sentences = rawAnswer
        .replace(/[*#]/g, '')
        .split(/(?<=[.?!।॥])\s+/)
        .filter((s: string) => s.trim().length > 0);
      const conciseAnswer = sentences.slice(0, 4).join(' ');

      setAnswerText(conciseAnswer || rawAnswer);
      setCardState('speaking');

      // Automatically speak the synthesized answer
      speak(conciseAnswer || rawAnswer, {
        langCode,
        onEnd: () => {
          // Keep answer on screen
        },
      });
    } catch (err: any) {
      console.error('[SEVA AI Voice Card] Query failed:', err);
      setErrorMessage(err?.message || 'Could not answer query right now.');
      setCardState('error');
    }
  };

  // Handle manual typed question submit
  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    const query = typedInput.trim();
    setTranscribedQuery(query);
    setTypedInput('');
    setIsTypeMode(false);
    sendQueryToRAG(query);
  };

  return (
    <section className="w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] p-5 shadow-xs transition-all space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-[#D9531E]">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {t('schemeDetail.askByVoice') || 'Ask about this scheme by voice'}
          </h2>
        </div>

        {/* Small "type instead" link */}
        <button
          type="button"
          onClick={() => {
            setIsTypeMode(!isTypeMode);
            setErrorMessage('');
          }}
          className="text-xs font-semibold text-[#D9531E] hover:underline cursor-pointer"
        >
          {isTypeMode
            ? t('common.cancel') || 'Cancel'
            : t('schemeDetail.typeInstead') || 'Type instead'}
        </button>
      </div>

      {/* Type Input Mode */}
      {isTypeMode && (
        <form onSubmit={handleTypedSubmit} className="flex gap-2 pt-1 animate-in fade-in duration-150">
          <input
            type="text"
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            placeholder={t('chat.placeholder') || 'Ask a question about this scheme...'}
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none focus:border-[#D9531E]"
            autoFocus
          />
          <button
            type="submit"
            disabled={!typedInput.trim()}
            className="touch-target px-4 py-3 rounded-2xl bg-[#0E2040] dark:bg-white text-white dark:text-[#0E2040] font-bold text-sm disabled:opacity-50 cursor-pointer flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Main Voice Interactive Panel */}
      {!isTypeMode && (
        <div className="flex flex-col items-center justify-center py-4 px-2 space-y-3 text-center">
          {/* Animated Big Microphone Button */}
          {cardState === 'idle' && (
            <>
              <button
                type="button"
                onClick={startListening}
                aria-label="Start voice question"
                className="touch-target w-20 h-20 rounded-full bg-[#D9531E] hover:bg-[#B84417] text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer group"
              >
                <Mic className="w-8 h-8 group-hover:scale-110 transition-transform" />
              </button>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {t('schemeDetail.tapToAsk') || 'Tap microphone to speak'}
              </p>
            </>
          )}

          {/* Listening State */}
          {cardState === 'listening' && (
            <div className="space-y-3 flex flex-col items-center">
              <div className="relative">
                <span className="absolute -inset-2 rounded-full bg-orange-400/30 animate-ping" />
                <button
                  type="button"
                  onClick={() => stopListeningAndProcess()}
                  aria-label="Stop listening"
                  className="touch-target relative w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg cursor-pointer"
                >
                  <Square className="w-7 h-7 fill-current" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-[#D9531E] animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <span>{t('schemeDetail.listening') || 'Listening... speak now'}</span>
              </div>
            </div>
          )}

          {/* Thinking State */}
          {cardState === 'thinking' && (
            <div className="space-y-3 flex flex-col items-center py-2">
              <div className="w-14 h-14 rounded-full border-4 border-slate-200 border-t-[#D9531E] animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {t('schemeDetail.thinking') || 'Thinking...'}
                </p>
                {transcribedQuery && (
                  <p className="text-xs italic text-slate-500 max-w-xs truncate">
                    &ldquo;{transcribedQuery}&rdquo;
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Speaking / Answer Ready State */}
          {cardState === 'speaking' && (
            <div className="w-full space-y-3 text-left animate-in fade-in duration-200">
              {/* Question bubble */}
              {transcribedQuery && (
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                    Your Question:
                  </span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    &ldquo;{transcribedQuery}&rdquo;
                  </p>
                </div>
              )}

              {/* Answer Card */}
              <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#D9531E]">
                    <Sparkles className="w-4 h-4" />
                    <span>SEVA AI Answer</span>
                  </div>
                  {isSpeaking && (
                    <span className="text-xs font-bold text-[#D9531E] animate-pulse flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{t('schemeDetail.speaking') || 'Speaking...'}</span>
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-900 dark:text-white font-medium leading-relaxed">
                  {answerText}
                </p>
              </div>

              {/* Action Buttons: Listen Again & Ask Another */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeaking) {
                      stopAudio();
                    } else {
                      speak(answerText, { langCode });
                    }
                  }}
                  className="touch-target flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-4 h-4 text-[#D9531E]" />
                      <span>{t('schemeDetail.stop') || 'Stop'}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>{t('schemeDetail.listenAgain') || 'Listen again'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={startListening}
                  className="touch-target flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#D9531E] hover:bg-[#B84417] text-xs font-bold text-white cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Ask another question</span>
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {cardState === 'error' && (
            <div className="space-y-3 flex flex-col items-center py-2 max-w-sm">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                {errorMessage || 'Something went wrong.'}
              </p>
              <button
                type="button"
                onClick={startListening}
                className="touch-target px-4 py-2.5 rounded-xl bg-[#0E2040] dark:bg-white text-white dark:text-[#0E2040] text-xs font-bold cursor-pointer"
              >
                Try speaking again
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
