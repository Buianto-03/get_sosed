import React, { type ReactNode, useState } from 'react';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import { Heading, HeadingLevel, HeadingSize } from '@shared/ui/heading/Heading';
import { Stepper } from '@shared/ui/stepper/Stepper';
import { useListingCreateFormFocus } from './use-listing-create-form-focus';
import styles from './ListingCreateForm.module.scss';

const steps = [
  { id: 'room', label: 'Комната' },
  { id: 'price', label: 'Цена и правила' },
  { id: 'photos', label: 'Фотографии' },
  { id: 'publish', label: 'Публикация' },
];

export interface ListingCreateFormProps {
  initialStep?: number;
  isPublishing?: boolean;
  isPublished?: boolean;
  canContinue?: (step: number) => boolean;
  onPublish?: () => void;
  validationError?: string;
  children: (step: number) => ReactNode;
}

export function ListingCreateForm({
  initialStep = 1,
  isPublishing = false,
  isPublished = false,
  canContinue,
  onPublish,
  validationError,
  children,
}: ListingCreateFormProps): JSX.Element {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const { formRef, requestFeedbackFocus, requestStepErrorFocus } = useListingCreateFormFocus(currentStep, isPublishing);
  const validateStep = (step: number): boolean => {
    const valid = !canContinue || canContinue(step);
    if (!valid) {
      requestStepErrorFocus();
    }
    return valid;
  };
  let actionLabel = 'Продолжить';
  if (currentStep === steps.length) {
    actionLabel = isPublished ? 'Опубликовано' : 'Опубликовать';
  }

  const navigateToStep = (targetStep: number): void => {
    if (isPublishing || isPublished) {
      return;
    }
    if (targetStep <= currentStep) {
      setCurrentStep(targetStep);
      return;
    }

    for (let step = currentStep; step < targetStep; step += 1) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return;
      }
    }
    setCurrentStep(targetStep);
  };

  const continueToNextStep = (): void => {
    if (!validateStep(currentStep)) {
      return;
    }
    setCurrentStep((step) => Math.min(steps.length, step + 1));
  };

  return (
    <div className={styles.listing_create_form}>
      <header className={styles.listing_create_form__heading}>
        <Heading level={HeadingLevel.H1} size={HeadingSize.Xl}>
          Найдём тебе соседа
        </Heading>
        <p>
          Шаг {currentStep} из {steps.length}
        </p>
      </header>
      <Stepper
        className={styles.listing_create_form__stepper}
        steps={steps}
        currentStep={currentStep}
        onStepChange={navigateToStep}
        label="Шаги публикации"
      />
      <form
        ref={formRef}
        aria-busy={isPublishing || undefined}
        className={styles.listing_create_form__form}
        onSubmit={(event) => event.preventDefault()}
        noValidate
        aria-label={`Шаг ${currentStep}: ${steps[currentStep - 1].label}`}
      >
        {validationError && <Alert variant={AlertVariant.Error}>{validationError}</Alert>}
        {isPublishing && <p role="status">Публикуем объявление…</p>}
        {children(currentStep)}
        <div className={styles.listing_create_form__actions}>
          <Button
            variant={ButtonVariant.Secondary}
            disabled={currentStep === 1 || isPublishing || isPublished}
            onClick={() => setCurrentStep((step) => Math.max(1, step - 1))}
          >
            Назад
          </Button>
          <Button
            disabled={isPublishing || isPublished || (currentStep === steps.length && !onPublish)}
            loading={isPublishing}
            onClick={() => {
              if (currentStep === steps.length) {
                requestFeedbackFocus();
                onPublish?.();
                return;
              }
              continueToNextStep();
            }}
          >
            {actionLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
