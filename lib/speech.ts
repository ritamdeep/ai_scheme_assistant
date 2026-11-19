'use client';

import { StructuredChatAnswer } from './types';

export type SpeechState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface SpeechSection {
  id: string;
  text: string;
}

export interface SpeechOptions {
  id?: string;
  langCode?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (errorMessage: string) => void;
  onSectionStart?: (sectionId: string) => void;
}

// BCP-47 Language code mapping for SEVA.AI (4 supported languages)
export const LANG_CODES: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
};

// Fallback error messages in native scripts
export const AUDIO_UNAVAILABLE_MESSAGES: Record<string, string> = {
  en: "Audio isn't available for this answer.",
  hi: 'इस उत्तर के लिए ऑडियो उपलब्ध नहीं है।',
  bn: 'এই উত্তরের জন্য অডিও উপলব্ধ নেই।',
  ta: 'இந்த பதிலுக்கு ஆடியோ கிடைக்கவில்லை.',
};

export const OFFICIAL_WEBSITE_SPEECH_LABELS: Record<string, string> = {
  en: 'official website',
  hi: 'आधिकारिक वेबसाइट',
  bn: 'সরকারি ওয়েবসাইট',
  ta: 'அதிகாரப்பூர்வ இணையதளம்',
};

/**
 * Prepares chat text for clean, natural speech recitation:
 * 1. Reads structured fields in natural order (summary, benefit, documents, next step, follow-up).
 * 2. Replaces markdown links and raw URLs with "official website" in the selected language.
 * 3. Strips all markdown symbols (#, *, -, ---, backticks, link brackets).
 */
export function formatChatAnswerForSpeech(
  structured?: StructuredChatAnswer | null,
  rawText?: string,
  locale: string = 'en'
): string {
  const langKey = locale.slice(0, 2);
  const webLabel = OFFICIAL_WEBSITE_SPEECH_LABELS[langKey] || OFFICIAL_WEBSITE_SPEECH_LABELS.en;

  let combined = '';

  if (structured && (structured.summary || structured.benefit)) {
    const parts = [
      structured.summary,
      structured.benefit,
      structured.documents?.length ? structured.documents.join(', ') : '',
      structured.next_step,
      structured.follow_up_question,
    ].filter(Boolean);
    combined = parts.join('. ');
  } else if (rawText) {
    combined = rawText;
  }

  // 1. Replace markdown links [label](url) with "label - official website"
  combined = combined.replace(/\[([^\]]+)\]\([^)]+\)/g, `$1 ${webLabel}`);

  // 2. Replace raw URLs (http:// or https://...) with the translated phrase "official website"
  combined = combined.replace(/https?:\/\/[^\s)\]]+/gi, webLabel);

  // 3. Strip markdown headers (#, ##, ###), bold/italic (*, **), list markers (- , * ), backticks (`), dashes (---)
  combined = combined
    .replace(/^#+\s+/gm, '') // headings
    .replace(/^[-*•]\s+/gm, '') // list bullets
    .replace(/---+/g, ' ') // horizontal rules
    .replace(/[*_`~#]/g, '') // bold/italic/code/hash markers
    .replace(/\s+/g, ' ') // collapse multi-spaces
    .trim();

  return combined;
}

type StateListener = (state: SpeechState, activeId: string | null, activeSectionId: string | null) => void;

class SpeechManager {
  private static instance: SpeechManager;
  private state: SpeechState = 'idle';
  private activeId: string | null = null;
  private activeSectionId: string | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private listeners: Set<StateListener> = new Set();
  private isBrowserSpeech = false;
  private sectionQueue: SpeechSection[] = [];
  private currentSectionIndex = 0;
  private currentOptions: SpeechOptions | null = null;
  private currentLangCode = 'en-IN';
  private cancelToken = 0;

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.stop());
    }
  }

  public static getInstance(): SpeechManager {
    if (!SpeechManager.instance) {
      SpeechManager.instance = new SpeechManager();
    }
    return SpeechManager.instance;
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    // Immediately emit current state
    listener(this.state, this.activeId, this.activeSectionId);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.state, this.activeId, this.activeSectionId));
  }

  public getState(): SpeechState {
    return this.state;
  }

  public getActiveId(): string | null {
    return this.activeId;
  }

  public getActiveSectionId(): string | null {
    return this.activeSectionId;
  }

  /**
   * Waits for voices to load asynchronously in the browser.
   */
  public async getBrowserVoice(langCode: string): Promise<SpeechSynthesisVoice | null> {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;

    let voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
      await new Promise<void>((resolve) => {
        let resolved = false;
        const onVoices = () => {
          if (!resolved) {
            resolved = true;
            window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
            resolve();
          }
        };
        window.speechSynthesis.addEventListener('voiceschanged', onVoices);
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
            resolve();
          }
        }, 300);
      });
      voices = window.speechSynthesis.getVoices();
    }

    if (!voices || voices.length === 0) return null;

    const normalizedTarget = langCode.toLowerCase().replace('_', '-');
    const prefix = normalizedTarget.slice(0, 2);

    // 1. Exact match (e.g. "hi-IN" === "hi-in")
    let match = voices.find(
      (v) => v.lang.toLowerCase().replace('_', '-') === normalizedTarget
    );
    if (match) return match;

    // 2. Prefix match (e.g. "hi" === "hi")
    match = voices.find((v) =>
      v.lang.toLowerCase().replace('_', '-').startsWith(prefix)
    );
    if (match) return match;

    return null;
  }

  /**
   * Splits a long text into sentence-sized chunks to prevent Chrome utterance cutoff.
   */
  private splitTextIntoChunks(text: string): string[] {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (!clean) return [];

    // Split on Indian and Western sentence terminators
    const rawChunks = clean.split(/(?<=[.?!।॥\n])\s+/);
    const result: string[] = [];

    for (const chunk of rawChunks) {
      if (chunk.length <= 140) {
        result.push(chunk);
      } else {
        // Split further by commas / semicolons / conjunctions
        const sub = chunk.split(/(?<=[,;:\-])\s+/);
        let acc = '';
        for (const s of sub) {
          if ((acc + ' ' + s).trim().length <= 140) {
            acc = (acc + ' ' + s).trim();
          } else {
            if (acc) result.push(acc);
            acc = s.trim();
          }
        }
        if (acc) result.push(acc);
      }
    }

    return result.filter((c) => c.length > 0);
  }

  /**
   * Stops any currently playing audio or speech synthesis.
   */
  public stop() {
    this.cancelToken++;
    this.sectionQueue = [];
    this.currentSectionIndex = 0;

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement.src = '';
      this.currentAudioElement = null;
    }

    this.state = 'idle';
    this.activeId = null;
    this.activeSectionId = null;
    this.isBrowserSpeech = false;
    this.notify();
  }

  public pause() {
    if (this.state !== 'playing') return;

    if (this.isBrowserSpeech && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
    } else if (this.currentAudioElement) {
      this.currentAudioElement.pause();
    }

    this.state = 'paused';
    this.notify();
  }

  public resume() {
    if (this.state !== 'paused') return;

    if (this.isBrowserSpeech && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.resume();
    } else if (this.currentAudioElement) {
      this.currentAudioElement.play().catch((e) => console.warn('Audio resume failed', e));
    }

    this.state = 'playing';
    this.notify();
  }

  /**
   * Plays a static audio file via <audio> element with loading, play, pause and stop states.
   * If the static file is missing, falls back cleanly to browser speech if fallbackText provided.
   * Zero runtime API calls for fixed scheme content.
   */
  public async playStaticAudio(
    audioUrl: string,
    options: SpeechOptions & { fallbackText?: string } = {}
  ) {
    this.stop();

    const myToken = ++this.cancelToken;
    this.currentOptions = options;
    this.activeId = options.id || 'static-audio';
    this.activeSectionId = null;
    this.currentLangCode = options.langCode || 'en-IN';

    this.state = 'loading';
    this.notify();

    if (typeof window === 'undefined') return;

    const audio = new Audio(audioUrl);
    this.currentAudioElement = audio;

    audio.onplay = () => {
      if (myToken === this.cancelToken) {
        this.state = 'playing';
        this.notify();
        options.onStart?.();
      }
    };

    audio.onpause = () => {
      if (myToken === this.cancelToken && this.state === 'playing') {
        this.state = 'paused';
        this.notify();
      }
    };

    audio.onended = () => {
      if (myToken === this.cancelToken) {
        this.finishPlayback();
      }
    };

    audio.onerror = async () => {
      if (myToken !== this.cancelToken) return;
      console.warn(`[SEVA AI Static Audio] Static audio not found at ${audioUrl}, trying browser speech fallback...`);
      if (options.fallbackText) {
        const voice = await this.getBrowserVoice(this.currentLangCode);
        if (myToken !== this.cancelToken) return;
        if (voice) {
          this.isBrowserSpeech = true;
          this.sectionQueue = [{ id: 'fallback', text: options.fallbackText }];
          this.currentSectionIndex = 0;
          this.playSectionsViaBrowser(voice, myToken);
          return;
        }
      }
      this.handleFailure(myToken);
    };

    try {
      await audio.play();
    } catch (err) {
      if (myToken === this.cancelToken) {
        audio.onerror?.(err as any);
      }
    }
  }

  /**
   * Plays a sequence of static audio files via <audio> element, reporting section transitions.
   */
  public async playStaticSections(
    sections: Array<{ id: string; audioUrl: string; fallbackText?: string }>,
    options: SpeechOptions = {}
  ) {
    this.stop();

    const myToken = ++this.cancelToken;
    this.currentOptions = options;
    this.activeId = options.id || 'static-sections';
    this.currentLangCode = options.langCode || 'en-IN';

    if (sections.length === 0) {
      this.stop();
      return;
    }

    this.state = 'loading';
    this.notify();

    let secIdx = 0;

    const playNext = async () => {
      if (myToken !== this.cancelToken) return;
      if (secIdx >= sections.length) {
        this.finishPlayback();
        return;
      }

      const sec = sections[secIdx];
      this.activeSectionId = sec.id;
      this.state = 'loading';
      this.notify();
      options.onSectionStart?.(sec.id);
      if (secIdx === 0) options.onStart?.();

      const audio = new Audio(sec.audioUrl);
      this.currentAudioElement = audio;

      audio.onplay = () => {
        if (myToken === this.cancelToken) {
          this.state = 'playing';
          this.notify();
        }
      };

      audio.onpause = () => {
        if (myToken === this.cancelToken && this.state === 'playing') {
          this.state = 'paused';
          this.notify();
        }
      };

      audio.onended = () => {
        if (myToken === this.cancelToken) {
          secIdx++;
          setTimeout(() => {
            if (myToken === this.cancelToken) {
              playNext();
            }
          }, 300);
        }
      };

      audio.onerror = async () => {
        if (myToken !== this.cancelToken) return;
        console.warn(`[SEVA AI Static Audio] Section audio not found at ${sec.audioUrl}, using browser speech fallback...`);
        if (sec.fallbackText) {
          const voice = await this.getBrowserVoice(this.currentLangCode);
          if (myToken !== this.cancelToken) return;
          if (voice) {
            const utterance = new SpeechSynthesisUtterance(sec.fallbackText);
            utterance.voice = voice;
            utterance.lang = voice.lang || this.currentLangCode;
            this.state = 'playing';
            this.notify();
            utterance.onend = () => {
              if (myToken === this.cancelToken) {
                secIdx++;
                playNext();
              }
            };
            utterance.onerror = () => {
              if (myToken === this.cancelToken) {
                secIdx++;
                playNext();
              }
            };
            window.speechSynthesis.speak(utterance);
            return;
          }
        }
        this.handleFailure(myToken);
      };

      try {
        await audio.play();
      } catch (err) {
        if (myToken === this.cancelToken) {
          audio.onerror?.(err as any);
        }
      }
    };

    playNext();
  }

  /**
   * Speaks a single text string.
   */
  public async speak(text: string, options: SpeechOptions = {}) {
    const sections: SpeechSection[] = [{ id: 'single', text }];
    return this.speakSections(sections, options);
  }

  /**
   * Speaks an ordered sequence of sections, reporting when each section begins.
   */
  public async speakSections(sections: SpeechSection[], options: SpeechOptions = {}) {
    this.stop();

    const myToken = ++this.cancelToken;
    this.currentOptions = options;
    this.activeId = options.id || 'speech';
    this.sectionQueue = sections.filter((s) => s.text && s.text.trim().length > 0);
    this.currentSectionIndex = 0;

    const lang = options.langCode || 'en-IN';
    this.currentLangCode = lang;

    if (this.sectionQueue.length === 0) {
      this.stop();
      return;
    }

    this.state = 'loading';
    this.notify();

    // Check if browser has a matching voice for this language
    const voice = await this.getBrowserVoice(lang);

    if (myToken !== this.cancelToken) return;

    if (voice) {
      this.isBrowserSpeech = true;
      this.playSectionsViaBrowser(voice, myToken);
    } else {
      this.isBrowserSpeech = false;
      this.playSectionsViaServerTTS(myToken);
    }
  }

  /**
   * Browser SpeechSynthesis path
   */
  private async playSectionsViaBrowser(voice: SpeechSynthesisVoice, token: number) {
    if (token !== this.cancelToken) return;

    if (this.currentSectionIndex >= this.sectionQueue.length) {
      this.finishPlayback();
      return;
    }

    const currentSection = this.sectionQueue[this.currentSectionIndex];
    this.activeSectionId = currentSection.id;
    this.state = 'playing';
    this.notify();

    if (this.currentOptions?.onSectionStart) {
      this.currentOptions.onSectionStart(currentSection.id);
    }
    if (this.currentSectionIndex === 0 && this.currentOptions?.onStart) {
      this.currentOptions.onStart();
    }

    const chunks = this.splitTextIntoChunks(currentSection.text);
    let chunkIndex = 0;

    const speakNextChunk = () => {
      if (token !== this.cancelToken) return;

      if (chunkIndex >= chunks.length) {
        // Move to next section after a brief pause
        this.currentSectionIndex++;
        setTimeout(() => {
          if (token === this.cancelToken) {
            this.playSectionsViaBrowser(voice, token);
          }
        }, 350);
        return;
      }

      const chunkText = chunks[chunkIndex];
      chunkIndex++;

      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.voice = voice;
      utterance.lang = voice.lang || this.currentLangCode;
      utterance.rate = 0.95;

      utterance.onend = () => {
        if (token === this.cancelToken) {
          speakNextChunk();
        }
      };

      utterance.onerror = (e) => {
        console.warn('[SEVA AI Speech] Utterance error:', e);
        if (token === this.cancelToken) {
          speakNextChunk();
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNextChunk();
  }

  /**
   * Server-side TTS fallback path
   */
  private async playSectionsViaServerTTS(token: number) {
    if (token !== this.cancelToken) return;

    if (this.currentSectionIndex >= this.sectionQueue.length) {
      this.finishPlayback();
      return;
    }

    const currentSection = this.sectionQueue[this.currentSectionIndex];
    this.activeSectionId = currentSection.id;
    this.state = 'loading';
    this.notify();

    if (this.currentOptions?.onSectionStart) {
      this.currentOptions.onSectionStart(currentSection.id);
    }
    if (this.currentSectionIndex === 0 && this.currentOptions?.onStart) {
      this.currentOptions.onStart();
    }

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentSection.text,
          langCode: this.currentLangCode,
        }),
      });

      if (token !== this.cancelToken) return;

      if (!res.ok) {
        throw new Error(`Server TTS returned HTTP ${res.status}`);
      }

      const blob = await res.blob();
      if (token !== this.cancelToken) return;

      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      this.currentAudioElement = audio;

      audio.onplay = () => {
        if (token === this.cancelToken) {
          this.state = 'playing';
          this.notify();
        }
      };

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (token === this.cancelToken) {
          this.currentSectionIndex++;
          setTimeout(() => {
            if (token === this.cancelToken) {
              this.playSectionsViaServerTTS(token);
            }
          }, 350);
        }
      };

      audio.onerror = (err) => {
        URL.revokeObjectURL(audioUrl);
        console.warn('[SEVA AI Speech] Audio playback error:', err);
        this.handleFailure(token);
      };

      await audio.play();
    } catch (err: any) {
      console.warn('[SEVA AI Speech] Server TTS error:', err);
      this.handleFailure(token);
    }
  }

  private handleFailure(token: number) {
    if (token !== this.cancelToken) return;

    this.state = 'error';
    const langKey = this.currentLangCode.slice(0, 2);
    const friendlyMsg =
      AUDIO_UNAVAILABLE_MESSAGES[langKey] || AUDIO_UNAVAILABLE_MESSAGES['en'];

    if (this.currentOptions?.onError) {
      this.currentOptions.onError(friendlyMsg);
    }

    this.notify();
    setTimeout(() => {
      if (token === this.cancelToken) {
        this.stop();
      }
    }, 4000);
  }

  private finishPlayback() {
    const cb = this.currentOptions?.onEnd;
    this.stop();
    if (cb) cb();
  }
}

// React hook for components to use speech with reactive state
import { useState, useEffect, useCallback } from 'react';

export function useSpeech(componentId?: string) {
  const [manager] = useState(() => SpeechManager.getInstance());
  const [state, setState] = useState<SpeechState>(() => manager.getState());
  const [activeId, setActiveId] = useState<string | null>(() => manager.getActiveId());
  const [activeSectionId, setActiveSectionId] = useState<string | null>(() => manager.getActiveSectionId());

  useEffect(() => {
    const unsubscribe = manager.subscribe((newState, newActiveId, newSectionId) => {
      setState(newState);
      setActiveId(newActiveId);
      setActiveSectionId(newSectionId);
    });
    return () => {
      unsubscribe();
    };
  }, [manager]);

  const isCurrentActive = componentId ? activeId === componentId : activeId !== null;
  const isPlaying = isCurrentActive && state === 'playing';
  const isLoading = isCurrentActive && state === 'loading';
  const isPaused = isCurrentActive && state === 'paused';
  const isSpeaking = isPlaying || isLoading;

  const speak = useCallback(
    (text: string, options: Omit<SpeechOptions, 'id'> = {}) => {
      return manager.speak(text, { ...options, id: componentId || 'global' });
    },
    [manager, componentId]
  );

  const speakSections = useCallback(
    (sections: SpeechSection[], options: Omit<SpeechOptions, 'id'> = {}) => {
      return manager.speakSections(sections, { ...options, id: componentId || 'global' });
    },
    [manager, componentId]
  );

  const playStaticAudio = useCallback(
    (audioUrl: string, fallbackText?: string, options: Omit<SpeechOptions, 'id'> = {}) => {
      return manager.playStaticAudio(audioUrl, { ...options, fallbackText, id: componentId || 'global' });
    },
    [manager, componentId]
  );

  const playStaticSections = useCallback(
    (
      sections: Array<{ id: string; audioUrl: string; fallbackText?: string }>,
      options: Omit<SpeechOptions, 'id'> = {}
    ) => {
      return manager.playStaticSections(sections, { ...options, id: componentId || 'global' });
    },
    [manager, componentId]
  );

  const stop = useCallback(() => {
    manager.stop();
  }, [manager]);

  const pause = useCallback(() => {
    manager.pause();
  }, [manager]);

  const resume = useCallback(() => {
    manager.resume();
  }, [manager]);

  return {
    state,
    isSpeaking,
    isPlaying,
    isLoading,
    isPaused,
    activeId,
    activeSectionId,
    playStaticAudio,
    playStaticSections,
    speak,
    speakSections,
    stop,
    pause,
    resume,
  };
}

export const speech = SpeechManager.getInstance();
