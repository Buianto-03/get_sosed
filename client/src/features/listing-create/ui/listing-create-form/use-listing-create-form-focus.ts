import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { useFormFeedback } from '@shared/lib/forms/use-form-feedback';

export function useListingCreateFormFocus(currentStep: number, isPublishing: boolean): {
  formRef: RefObject<HTMLFormElement>;
  requestFeedbackFocus: () => void;
  requestStepErrorFocus: () => void;
} {
  const { formRef, requestFeedbackFocus } = useFormFeedback(isPublishing);
  const previousStep = useRef(currentStep);
  const focusErrors = useRef(false);
  const [, setAttempt] = useState(0);

  useLayoutEffect(() => {
    const form = formRef.current;
    if (focusErrors.current) {
      const target = form?.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]')
        ?? form?.querySelector<HTMLElement>('input[type="file"]');
      if (target) {
        if (target.getAttribute('role') === 'alert') {
          target.tabIndex = -1;
        }
        target.focus();
      }
    } else if (previousStep.current !== currentStep) {
      const heading = form?.querySelector<HTMLElement>('h2');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus();
      }
    }
    previousStep.current = currentStep;
    focusErrors.current = false;
  });

  const requestStepErrorFocus = (): void => {
    focusErrors.current = true;
    setAttempt((attempt) => attempt + 1);
  };

  return { formRef, requestFeedbackFocus, requestStepErrorFocus };
}
