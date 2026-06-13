import React from 'react';

interface FlowProgressProps {
  currentStepIndex: number; // 0-based index: 0=Basic Info, 1=NIN, 2=Liveness Check
  totalSteps?: number;
}

export default function FlowProgress({ currentStepIndex, totalSteps = 3 }: FlowProgressProps) {
  const stepsText = [
    "Step 1 of 3 - Basic Info",
    "Step 2 of 3 - Identify Yourself",
    "Step 3 of 3 - Final Step"
  ];

  return (
    <div className="w-full max-w-md mx-auto px-4" id="flow-progress-indicator">
      {/* Progress Bars Row */}
      <div className="flex gap-2.5 justify-between mb-4">
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isActive = idx === currentStepIndex;

          return (
            <div 
              key={idx}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                isCompleted || isActive 
                  ? 'bg-[#EB9E27]' 
                  : 'bg-slate-200'
              }`}
            />
          );
        })}
      </div>

      {/* Subtext description */}
      <span className="text-xs font-mono font-medium tracking-wide text-slate-500 block">
        {stepsText[currentStepIndex] || `Step ${currentStepIndex + 1} of ${totalSteps}`}
      </span>
    </div>
  );
}
