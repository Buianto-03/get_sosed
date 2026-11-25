import React, { type ReactNode, useState } from 'react';
import { Alert, AlertVariant } from '@shared/ui/feedback/Alert';
import { Button, ButtonVariant } from '@shared/ui/button/Button';
import { Heading, HeadingLevel, HeadingSize } from '@shared/ui/heading/Heading';
import { Stepper } from '@shared/ui/stepper/Stepper';
import { ListingCreateStep } from '../../model';
import { useListingCreateFormFocus } from './use-listing-create-form-focus';
import styles from './ListingCreateForm.module.scss';

const steps = [
  { step: ListingCreateStep.Room, id: 'room', label: 'Комната' },
  { step: ListingCreateStep.PriceRules, id: 'price', label: 'Цена и правила' },
  { step: ListingCreateStep.Photos, id: 'photos', label: 'Фотографии' },
  { step: ListingCreateStep.Review, id: 'publish', label: 'Публикация' },
];

export interface ListingCreateFormProps {
  initialStep?: ListingCreateStep;
  isPublishing?: boolean;
  isPublished?: boolean;
  canContinue?: (step: ListingCreateStep) => boolean;
  onPublish?: () => void;
  validationError?: string;
  children: (step: ListingCreateStep) => ReactNode;
}

export function ListingCreateForm({
  initialStep = ListingCreateStep.Room,
  isPublishing = false,
  isPublished = false,
  canContinue,
  onPublish,
  validationError,
  children,
}: ListingCreateFormProps): JSX.Element {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const { formRef, requestFeedbackFocus, requestStepErrorFocus } = useListingCreateFormFocus(currentStep, isPublishing);
  const validateStep = (step: ListingCreateStep): boolean => {
    const valid = !canContinue || canContinue(step);
    if (!valid) {
      requestStepErrorFocus();
    }
    return valid;
  };
  let actionLabel = 'Продолжить';
  if (currentStep === ListingCreateStep.Review) {
    actionLabel = isPublished ? 'Опубликовано' : 'Опубликовать';
  }

  const navigateToStep = (position: number): void => {
    const target = steps[position - 1];
    if (isPublishing || isPublished || !target) {
      return;
    }
    const firstInvalid = steps.slice(currentStep - 1, position - 1)
      .find(({ step }) => !validateStep(step));
    setCurrentStep(firstInvalid?.step ?? target.step);
  };

  const continueToNextStep = (): void => {
    if (!validateStep(currentStep)) {
      return;
    }
    setCurrentStep((step) => steps[step]?.step ?? step);
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
        <div className={styles.listing_create_form__step}>{children(currentStep)}</div>
        <div className={styles.listing_create_form__actions}>
          <Button
            variant={ButtonVariant.Secondary}
            disabled={currentStep === ListingCreateStep.Room || isPublishing || isPublished}
            onClick={() => setCurrentStep((step) => steps[step - 2]?.step ?? step)}
          >
            Назад
          </Button>
          <Button
            disabled={
              isPublishing || isPublished || (currentStep === ListingCreateStep.Review && !onPublish)
            }
            loading={isPublishing}
            onClick={() => {
              if (currentStep === ListingCreateStep.Review) {
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
