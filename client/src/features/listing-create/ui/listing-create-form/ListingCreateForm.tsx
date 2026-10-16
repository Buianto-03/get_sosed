import React, { type ReactNode, useState } from 'react';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import { Heading, HeadingLevel, HeadingSize } from '@shared/ui/heading/Heading';
import { Stepper } from '@shared/ui/stepper/Stepper';
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
  children: (step: number) => ReactNode;
}

export function ListingCreateForm({
  initialStep = 1,
  isPublishing = false,
  isPublished = false,
  canContinue,
  onPublish,
  children,
}: ListingCreateFormProps): JSX.Element {
  const [currentStep, setCurrentStep] = useState(initialStep);
  let actionLabel = 'Продолжить';
  if (currentStep === steps.length) actionLabel = isPublished ? 'Опубликовано' : 'Опубликовать';

  const navigateToStep = (targetStep: number): void => {
    if (targetStep <= currentStep) {
      setCurrentStep(targetStep);
      return;
    }

    for (let step = currentStep; step < targetStep; step += 1) {
      if (canContinue && !canContinue(step)) return;
    }
    setCurrentStep(targetStep);
  };

  const continueToNextStep = (): void => {
    if (canContinue && !canContinue(currentStep)) return;
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
        className={styles.listing_create_form__form}
        onSubmit={(event) => event.preventDefault()}
        noValidate
        aria-label={`Шаг ${currentStep}: ${steps[currentStep - 1].label}`}
      >
        {children(currentStep)}
        <div className={styles.listing_create_form__actions}>
          <Button
            variant={ButtonVariant.Secondary}
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((step) => Math.max(1, step - 1))}
          >
            Назад
          </Button>
          <Button
            disabled={isPublishing || isPublished || (currentStep === steps.length && !onPublish)}
            loading={isPublishing}
            onClick={() => {
              if (currentStep === steps.length) {
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
