import { useLayoutEffect, useRef, useState } from 'react';

// Request before validation. React commits field errors before this effect runs.
export function useFormFeedback(pending = false): {
  formRef: React.RefObject<HTMLFormElement>;
  requestFeedbackFocus: () => void;
} {
  const formRef = useRef<HTMLFormElement>(null);
  const requested = useRef(false);
  const [, setAttempt] = useState(0);

  const requestFeedbackFocus = (): void => {
    requested.current = true;
    setAttempt((attempt) => attempt + 1);
  };

  useLayoutEffect(() => {
    if (!requested.current || pending) {
      return;
    }
    const form = formRef.current;
    const invalid = form?.querySelector<HTMLElement>('[aria-invalid="true"]');
    const feedback = invalid ?? form?.querySelector<HTMLElement>('[role="alert"]');
    if (feedback) {
      // Invalid optional profile fields can be inside collapsed details.
      const details = feedback.closest('details');
      if (details) {
        details.open = true;
      }
      if (!invalid) {
        feedback.tabIndex = -1;
      }
      feedback.focus();
    } else if (document.activeElement === document.body) {
      form?.querySelector<HTMLElement>('[type="submit"]')?.focus();
    }
    requested.current = false;
  });

  return { formRef, requestFeedbackFocus };
}
