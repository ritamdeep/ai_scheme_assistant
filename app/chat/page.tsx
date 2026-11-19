'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Bot,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { ChatMessage, SourceCitation } from '@/lib/types';
import { LANG_CODES, AUDIO_UNAVAILABLE_MESSAGES, formatChatAnswerForSpeech } from '@/lib/speech';
import { ChatMessageRenderer } from '@/components/ChatMessageRenderer';

function ChatContent() {
  const searchParams = useSearchParams();
  const shouldAutoVoice = searchParams.get('voice') === '1';

  const { profile, updateProfileField, activeLanguage } = useAuth();
  const { locale, t } = useTranslation();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [audioUnavailableId, setAudioUnavailableId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<Record<string, 'up' | 'down'>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Suggestion chips translated
  const suggestionChips = useMemo(() => [
    t('chat.starter1') || 'What schemes can help a small farmer?',
    t('chat.starter2') || 'How can I get old age pension?',
    t('chat.starter3') || 'Are there scholarships for students?',
    t('chat.starter4') || 'Which free health schemes can I get?',
  ], [t]);

  // Voice Input SpeechRecognition
  const handleVoiceInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser.');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = LANG_CODES[locale] || 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      console.warn('Voice error:', e);
      setIsListening(false);
    }
  };

  // Trigger auto-voice on first load if ?voice=1
  useEffect(() => {
    if (shouldAutoVoice && messages.length === 0) {
      handleVoiceInput();
    }
  }, [shouldAutoVoice]);

  // SpeechSynthesis Listen (best effort, shows friendly message if unavailable)
  const handleListen = (messageId: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setAudioUnavailableId(messageId);
      return;
    }

    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    setAudioUnavailableId(null);
    window.speechSynthesis.cancel();

    const targetLang = LANG_CODES[locale] || 'en-IN';
    const voices = window.speechSynthesis.getVoices();
    const prefix = targetLang.slice(0, 2).toLowerCase();
    const matchingVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().replace('_', '-') === targetLang.toLowerCase() ||
        v.lang.toLowerCase().startsWith(prefix)
    );

    // If non-English and browser has no matching voice, notify user with friendly message
    if (locale !== 'en' && !matchingVoice && voices.length > 0) {
      setAudioUnavailableId(messageId);
      setTimeout(() => setAudioUnavailableId(null), 5000);
      return;
    }

    const targetMsg = messages.find((m) => m.id === messageId);
    const cleanText = formatChatAnswerForSpeech(targetMsg?.structuredAnswer, text, locale);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (matchingVoice) utterance.voice = matchingVoice;
    utterance.lang = targetLang;
    utterance.rate = 0.95;

    utterance.onstart = () => {
      setSpeakingMessageId(messageId);
      setAudioUnavailableId(null);
    };
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      setSpeakingMessageId(null);
      setAudioUnavailableId(messageId);
      setTimeout(() => setAudioUnavailableId(null), 5000);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    setFeedbackState((prev) => ({
      ...prev,
      [messageId]: prev[messageId] === type ? undefined! : type,
    }));
  };

  // Send query to genuine RAG / LLM backend
  const handleSend = async (queryText?: string) => {
    const text = (queryText || inputQuery).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeId: 'all',
          message: text,
          userProfile: profile,
          conversationHistory: messages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server error occurred');
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.answer || data.reply || '',
        structuredAnswer: data.structuredAnswer || null,
        citations: data.sources?.map((s: SourceCitation) => s.schemeName) || [],
        sources: data.sources || [],
        relevantSchemes: data.relevantSchemes || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'assistant',
          text: err.message || 'Unable to connect to AI server. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col h-[calc(100vh-8.5rem)] animate-in fade-in duration-150">
      {/* Top Bar with Clear & Guide Notice */}
      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
          {t('chat.title') || 'Ask SEVA'}
        </span>

        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="touch-target flex items-center gap-1 font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('common.reset') || 'Clear'}</span>
          </button>
        )}
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          /* Empty State with 4 Translated Suggestion Chips */
          <div className="my-auto py-4 text-center space-y-5 max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-3xl bg-orange-50 dark:bg-orange-950/40 text-[#D9531E] flex items-center justify-center mx-auto shadow-xs border border-orange-200 dark:border-orange-800">
              <Bot className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                How can SEVA help you?
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Ask any question about welfare schemes in your language.
              </p>
            </div>

            {/* 4 Suggestion Chips */}
            <div className="grid grid-cols-1 gap-2.5 text-left pt-1">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  className="touch-target p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-slate-800 dark:text-slate-200 font-bold text-sm text-left hover:border-[#0E2040] dark:hover:border-white shadow-2xs active:scale-[0.99] transition-all cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Active Chat Messages */
          messages.map((msg) => {
            const isUser = msg.sender === 'user';

            if (isUser) {
              return (
                <div
                  key={msg.id}
                  className="flex flex-col items-end space-y-1 w-full"
                >
                  <div className="max-w-[85%] p-3.5 sm:p-4 rounded-3xl text-base font-medium leading-relaxed bg-[#0E2040] text-white dark:bg-white dark:text-[#0E2040] rounded-tr-xs shadow-xs break-words">
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 px-2">
                    {msg.timestamp}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className="flex flex-col items-start space-y-1.5 w-full"
              >
                <div className="w-full max-w-[96%] sm:max-w-[90%] p-3.5 sm:p-4 rounded-3xl bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-white rounded-tl-xs shadow-xs border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
                  <ChatMessageRenderer message={msg} locale={locale} />
                </div>

                {/* Actions Under AI Answer: Listen, Feedback */}
                <div className="flex items-center gap-3 px-2 pt-0.5 flex-wrap">
                  {/* Listen Button */}
                  <button
                    type="button"
                    onClick={() => handleListen(msg.id, msg.text)}
                    aria-label={speakingMessageId === msg.id ? 'Stop listening' : 'Listen to answer'}
                    className="touch-target flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-1 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {speakingMessageId === msg.id ? (
                      <>
                        <VolumeX className="w-4 h-4 text-[#D9531E] animate-pulse" />
                        <span className="text-[#D9531E] font-bold">Stop</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                        <span>{t('chat.listen') || 'Listen'}</span>
                      </>
                    )}
                  </button>

                  {/* Thumbs Up */}
                  <button
                    type="button"
                    onClick={() => handleFeedback(msg.id, 'up')}
                    aria-label="Helpful"
                    className={`touch-target p-1.5 rounded-lg transition-colors ${
                      feedbackState[msg.id] === 'up'
                        ? 'text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>

                  {/* Thumbs Down */}
                  <button
                    type="button"
                    onClick={() => handleFeedback(msg.id, 'down')}
                    aria-label="Not helpful"
                    className={`touch-target p-1.5 rounded-lg transition-colors ${
                      feedbackState[msg.id] === 'down'
                        ? 'text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/40'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>

                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    {msg.timestamp}
                  </span>

                  {/* Audio Unavailable Notification */}
                  {audioUnavailableId === msg.id && (
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 animate-in fade-in">
                      {AUDIO_UNAVAILABLE_MESSAGES[locale] || "Audio isn't available for this answer."}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading / Thinking Indicator */}
        {loading && (
          <div className="flex flex-col items-start space-y-1 w-full animate-in fade-in duration-200">
            <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-3xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 rounded-tl-xs shadow-xs border border-slate-200/60 dark:border-slate-700/60 max-w-[85%]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D9531E] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#D9531E] animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#D9531E] animate-bounce" />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {t('schemeDetail.thinking') || 'Thinking...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Readable Disclaimer (14px+) */}
      <div className="px-4 py-1 text-center">
        <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium">
          {t('chat.disclaimer') || 'This is a guide. Please confirm at your local office.'}
        </p>
      </div>

      {/* Fixed Bottom Input with Big Mic & Send Button */}
      <div className="p-3 bg-white dark:bg-[#0B1120] border-t border-slate-200 dark:border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={
              isListening
                ? (t('chat.listening') || 'Listening... speak now')
                : (t('chat.placeholder') || 'Ask in your language or tap mic...')
            }
            className="touch-target flex-1 px-4 py-3.5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-base font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#0E2040]"
          />

          {/* Big Mic Button (48x48 min) */}
          <button
            type="button"
            onClick={handleVoiceInput}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            className={`touch-target w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
              isListening
                ? 'bg-[#D9531E] text-white animate-pulse shadow-md ring-4 ring-orange-200 dark:ring-orange-950'
                : 'bg-orange-50 dark:bg-orange-950/40 text-[#D9531E] border border-orange-200 dark:border-orange-800 hover:bg-orange-100'
            }`}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Send Button (48x48 min) */}
          <button
            type="submit"
            disabled={!inputQuery.trim() || loading}
            aria-label="Send message"
            className="touch-target w-12 h-12 rounded-2xl bg-[#0E2040] hover:bg-[#162F5C] dark:bg-white dark:hover:bg-slate-200 text-white dark:text-[#0E2040] flex items-center justify-center shrink-0 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <React.Suspense
      fallback={
        <div className="w-full px-4 py-8 text-center text-slate-400 font-medium">
          Loading SEVA chat...
        </div>
      }
    >
      <ChatContent />
    </React.Suspense>
  );
}
