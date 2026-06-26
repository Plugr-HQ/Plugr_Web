"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, Loader2, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';

interface LivenessScannerProps {
  onSuccess: () => void;
}

export default function LivenessScanner({ onSuccess }: LivenessScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'requesting' | 'active' | 'denied' | 'simulated'>('requesting');
  const [scanStatus, setScanStatus] = useState<'idle' | 'aligning' | 'scanning' | 'success' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);
  const [feedbackText, setFeedbackText] = useState('Position your face in the circle');
  const [attempts, setAttempts] = useState(1);

  // Initialize camera
  useEffect(() => {
    async function startCamera() {
      try {
        setCameraState('requesting');
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
          audio: false
        });
        setStream(mediaStream);
        setCameraState('active');
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.warn('Camera access denied or failed, falling back to simulation mode:', error);
        setCameraState('simulated');
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [attempts]);

  // Handle Scanning Animation and Prompts
  useEffect(() => {
    if (scanStatus === 'aligning') {
      const timer = setTimeout(() => {
        setScanStatus('scanning');
        setFeedbackText('Hold still, scanning your face...');
      }, 2000);
      return () => clearTimeout(timer);
    }

    if (scanStatus === 'scanning') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setScanStatus('success');
            setFeedbackText('Identity Verified!');
            setTimeout(() => {
              onSuccess();
            }, 1000);
            return 100;
          }
          const increment = Math.floor(Math.random() * 8) + 4;
          return Math.min(prev + increment, 100);
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [scanStatus]);

  // Periodic visual guidance changes during scan
  useEffect(() => {
    if (scanStatus === 'scanning') {
      const prompts = [
        'Hold still, checking liveness...',
        'Blink your eyes naturally...',
        'Perfect, looking straight...',
        'Analyzing biological features...'
      ];
      const timer = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * prompts.length);
        setFeedbackText(prompts[randomIndex]);
      }, 1200);
      return () => clearInterval(timer);
    }
  }, [scanStatus]);

  const handleStartScan = () => {
    setScanStatus('aligning');
    setProgress(0);
    setFeedbackText('Keep your head aligned inside the frame...');
  };

  const handleRetry = () => {
    setScanStatus('idle');
    setAttempts(prev => prev + 1);
  };

  return (
    <div className="flex flex-col items-center w-full" id="liveness-scanner-container">
      {/* Circular Camera Portal Container */}
      <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-dashed border-[#EB9E27] shadow-inner bg-slate-900 flex items-center justify-center">
        {cameraState === 'active' && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
          />
        )}

        {/* Simulated Camera Feed containing cute node dots to mimic a real 3D mesh network */}
        {cameraState === 'simulated' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 overflow-hidden">
            {/* Ambient tech styling backdrops for the simulation mode */}
            <div className="absolute inset-0 bg-[radial-gradient(#EB9E27_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
            
            {/* Simulated target silhouette */}
            <div className="relative w-36 h-36 border-2 border-slate-700 rounded-full flex items-center justify-center opacity-60">
              <div className="w-24 h-24 border border-dashed border-slate-600 rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#EB9E27] animate-ping" />
              
              {/* Mesh network scanning simulation nodes */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <div className="absolute bottom-6 left-6 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <div className="absolute bottom-6 right-6 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
              <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
            </div>

            {scanStatus === 'idle' && (
              <span className="text-xs font-mono text-slate-500 mt-4 animate-pulse">
                [ CAMERA EMULATION RUNNING ]
              </span>
            )}
          </div>
        )}

        {cameraState === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400">
            <Loader2 className="h-8 w-8 text-[#EB9E27] animate-spin mb-2" />
            <span className="font-mono text-xs text-slate-500">Accessing Camera...</span>
          </div>
        )}

        {/* HUD Scanner Overlays */}
        {scanStatus === 'scanning' && (
          <>
            {/* Standard laser scanning horizontal bar */}
            <div 
              className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#EB9E27] to-transparent shadow-[0_0_12px_#EB9E27] z-20"
              style={{
                top: `${progress}%`,
                transition: 'top 0.1s linear'
              }}
            />
            {/* Standard radar display sweep */}
            <div className="absolute inset-0 border-[10px] border-solid border-[#EB9E27]/10 animate-pulse rounded-full" />
          </>
        )}

        {/* Circular Face alignment boundary frame */}
        <div className="absolute inset-4 rounded-full border-2 border-dashed border-slate-200/40 pointer-events-none" />

        {/* Scanning Target Box frame details in the corners */}
        <div className="absolute inset-10 flex flex-col justify-between pointer-events-none opacity-40">
          <div className="flex justify-between">
            <div className="w-4 h-4 border-t-2 border-l-2 border-[#EB9E27]" />
            <div className="w-4 h-4 border-t-2 border-r-2 border-[#EB9E27]" />
          </div>
          <div className="flex justify-between">
            <div className="w-4 h-4 border-b-2 border-l-2 border-[#EB9E27]" />
            <div className="w-4 h-4 border-b-2 border-r-2 border-[#EB9E27]" />
          </div>
        </div>

        {/* Success complete overlay screen */}
        {scanStatus === 'success' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-20 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg animate-bounce">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>
            <span className="font-display font-semibold text-white mt-4 tracking-wide text-sm">Face Matched!</span>
          </div>
        )}
      </div>

      {/* Progress Info Ring or Percentage Display */}
      {scanStatus === 'scanning' && (
        <div className="w-full max-w-xs mt-6 px-1">
          <div className="flex justify-between text-xs font-mono text-slate-500 mb-1.5">
            <span>Mesh Analysis</span>
            <span>{progress}%</span>
          </div>
          <div className="relative w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-[#EB9E27] transition-all duration-150 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Real-time Instructions and Feedback Text */}
      <p className="mt-5 text-sm font-medium text-slate-800 text-center text-balance max-w-xs transition-all duration-300 min-h-10 flex items-center justify-center">
        {feedbackText}
      </p>

      {/* Control Buttons */}
      <div className="mt-2 w-full max-w-xs flex justify-center gap-3">
        {scanStatus === 'idle' && (
          <button
            onClick={handleStartScan}
            id="start-biometric-scan"
            className="w-full bg-[#EB9E27] hover:bg-[#D68B1D] text-white py-4 px-6 rounded-full font-semibold shadow-md active:scale-98 transition"
          >
            Start Liveness Scan
          </button>
        )}

        {cameraState === 'denied' && (
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-start gap-3 mt-4 text-left w-full">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-xs text-amber-800">Camera Permission Required</h4>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Please allow camera access in your browser controls to continue, or toggle mock mode.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
