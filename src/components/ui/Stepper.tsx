import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: number | string;
  title: string;
  subtitle?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number; // 1-indexed
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep, className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      <ol className="flex items-center w-full">
        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isLast = idx === steps.length - 1;

          return (
            <li
              key={step.id}
              className={`flex items-center ${!isLast ? 'flex-1' : ''}`}
            >
              <div className="flex flex-col items-center sm:items-start">
                <div className="flex items-center gap-2">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0
                      transition-colors
                      ${
                        isCompleted
                          ? 'bg-brand-green text-brand-charcoal'
                          : isCurrent
                          ? 'bg-brand-magenta text-white ring-4 ring-brand-magenta/20'
                          : 'bg-brand-lightGray text-brand-charcoal/60'
                      }
                    `}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : stepNumber}
                  </div>
                  <div className="hidden sm:flex flex-col">
                    <span
                      className={`text-xs font-subheading ${
                        isCurrent
                          ? 'text-brand-magenta font-bold'
                          : isCompleted
                          ? 'text-brand-darkText font-medium'
                          : 'text-brand-charcoal/60'
                      }`}
                    >
                      {step.title}
                    </span>
                    {step.subtitle && (
                      <span className="text-[10px] text-brand-charcoal/60">{step.subtitle}</span>
                    )}
                  </div>
                </div>
              </div>

              {!isLast && (
                <div
                  className={`
                    flex-1 h-0.5 mx-2 sm:mx-4
                    ${isCompleted ? 'bg-brand-green' : 'bg-brand-border'}
                  `}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
