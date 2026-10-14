import React from 'react';
import { LuCheck } from 'react-icons/lu';
import styles from './Stepper.module.scss';

export enum StepperOrientation {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export enum StepStatus {
  Completed = 'completed',
  Current = 'current',
  Upcoming = 'upcoming',
  Disabled = 'disabled',
}

export type StepOption = {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type StepperProps = {
  steps: StepOption[];
  currentStep: number;
  onStepChange?: (step: number) => void;
  orientation?: StepperOrientation;
  label?: string;
  className?: string;
};

function getStepStatus(stepNumber: number, currentStep: number, disabled: boolean): StepStatus {
  if (disabled) return StepStatus.Disabled;
  if (stepNumber < currentStep) return StepStatus.Completed;
  if (stepNumber === currentStep) return StepStatus.Current;
  return StepStatus.Upcoming;
}

function getStepLabel(label: string, status: StepStatus): string {
  switch (status) {
    case StepStatus.Completed:
      return `${label}, выполнен`;
    case StepStatus.Current:
      return `${label}, текущий шаг`;
    case StepStatus.Disabled:
      return `${label}, недоступен`;
    default:
      return `${label}, предстоит`;
  }
}

export function Stepper({
  steps,
  currentStep,
  onStepChange,
  orientation = StepperOrientation.Horizontal,
  label = 'Шаги',
  className,
}: StepperProps): JSX.Element {
  return (
    <nav
      className={[styles.stepper, styles[orientation], className].filter(Boolean).join(' ')}
      aria-label={label}
    >
      <ol className={styles.steps}>
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const status = getStepStatus(stepNumber, currentStep, Boolean(step.disabled));
          const buttonLabel = getStepLabel(step.label, status);

          return (
            <li key={step.id} className={[styles.step, styles[status]].join(' ')}>
              <button
                className={styles.stepButton}
                type="button"
                aria-label={buttonLabel}
                aria-current={status === StepStatus.Current ? 'step' : undefined}
                disabled={status === StepStatus.Disabled || !onStepChange}
                onClick={() => onStepChange?.(stepNumber)}
              >
                <span className={styles.marker} aria-hidden="true">
                  {status === StepStatus.Completed ? <LuCheck /> : stepNumber}
                </span>
                <span className={styles.copy}>
                  <span className={styles.name}>{step.label}</span>
                  {step.description && (
                    <span className={styles.description}>{step.description}</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
