// src/components/plug/useVoiceRecorder.ts
// React hook for browser voice recording:
// Handles MediaRecorder, 90-second visible timer with auto-stop, mic permission handling,
// playback, and pure client-side resampling to 16 kHz 16-bit PCM WAV (audio/wav).

import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceRecorderState = 'idle' | 'recording' | 'recorded' | 'processing';

/** Encodes 16kHz 1-channel Float32 Array into a 16-bit PCM WAV Blob. */
function encode16BitWav(samples: Float32Array, sampleRate = 16000): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (1 = PCM) */
  view.setUint16(20, 1, true);
  /* channel count (1 = mono) */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sampleRate * 2) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (2) */
  view.setUint16(32, 2, true);
  /* bits per sample (16) */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  /* float to 16-bit PCM */
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export function useVoiceRecorder() {
  const [recorderState, setRecorderState] = useState<VoiceRecorderState>('idle');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [wavBlob, setWavBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const convertToWav = useCallback(async (rawBlob: Blob): Promise<Blob> => {
    const arrayBuffer = await rawBlob.arrayBuffer();
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioCtxClass();

    try {
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const targetSampleRate = 16000;
      const targetLength = Math.ceil(audioBuffer.duration * targetSampleRate);

      const OfflineAudioCtxClass = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
      const offlineCtx = new OfflineAudioCtxClass(1, targetLength, targetSampleRate);

      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineCtx.destination);
      source.start(0);

      const renderedBuffer = await offlineCtx.startRendering();
      const pcmChannel = renderedBuffer.getChannelData(0);

      return encode16BitWav(pcmChannel, targetSampleRate);
    } finally {
      await audioCtx.close();
    }
  }, []);

  const stopRecording = useCallback(() => {
    clearTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopTracks();
  }, [clearTimer, stopTracks]);

  const startRecording = useCallback(async () => {
    setError(null);
    setWavBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setDurationSeconds(0);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Your browser does not support audio recording.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setRecorderState('processing');
        const rawBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        try {
          const wav = await convertToWav(rawBlob);
          setWavBlob(wav);
          const url = URL.createObjectURL(wav);
          setAudioUrl(url);
          setRecorderState('recorded');
        } catch (e: any) {
          console.error('Audio conversion failed:', e);
          setError('Could not process recorded audio. Please try again.');
          setRecorderState('idle');
        }
      };

      mediaRecorder.start(250);
      setRecorderState('recording');

      /* Start visible 90s timer with auto-stop */
      timerRef.current = setInterval(() => {
        setDurationSeconds((prev) => {
          if (prev >= 89) {
            stopRecording();
            return 90;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (e: any) {
      console.error('Mic access error:', e);
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setError('Microphone access was denied. Please allow microphone permissions in your browser settings.');
      } else {
        setError('Could not start microphone. Please check your audio settings.');
      }
      setRecorderState('idle');
    }
  }, [audioUrl, convertToWav, stopRecording]);

  const togglePlayback = useCallback(() => {
    if (!audioUrl) return;
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [audioUrl, isPlaying]);

  const resetRecorder = useCallback(() => {
    stopRecording();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setIsPlaying(false);
    setWavBlob(null);
    setDurationSeconds(0);
    setError(null);
    setRecorderState('idle');
  }, [audioUrl, stopRecording]);

  useEffect(() => {
    return () => {
      clearTimer();
      stopTracks();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [clearTimer, stopTracks, audioUrl]);

  return {
    recorderState,
    durationSeconds,
    error,
    wavBlob,
    audioUrl,
    isPlaying,
    startRecording,
    stopRecording,
    togglePlayback,
    resetRecorder,
  };
}
