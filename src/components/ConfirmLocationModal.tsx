// src/components/ConfirmLocationModal.tsx
import React from 'react';

interface ConfirmLocationModalProps {
  address: string;
  onConfirm: () => void;
  onReject: () => void;
}

export function ConfirmLocationModal({ address, onConfirm, onReject }: ConfirmLocationModalProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-pitch-black/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-bold text-pitch-black">Is this your location?</h3>
        <p className="mt-2 text-sm text-slate">We're not fully sure about this one — please confirm before we use it:</p>
        <p className="mt-3 rounded-2xl bg-slate/5 px-4 py-3 text-sm font-semibold text-pitch-black">{address}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onReject}
            className="flex-1 rounded-pill border border-pitch-black/10 py-3 text-sm font-bold text-pitch-black hover:bg-pitch-black/5 active:scale-[0.98] transition-all"
          >
            Enter manually
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-pill bg-gold py-3 text-sm font-bold text-pitch-black hover:bg-gold-light active:scale-[0.98] transition-all"
          >
            Yes, that's right
          </button>
        </div>
      </div>
    </div>
  );
}