import React, { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '@app/store/hooks';
import { routes } from '@shared/config/routes';
import {
  getAuthenticationPath,
  getPostAuthDestination,
} from '@shared/lib/navigation/safe-return-to';
import { AlertVariant } from '@shared/ui/feedback/Alert';
import { SignUpCard, type SignUpValues } from '../sign-up-card/SignUpCard';
import { signupThunk } from '../../thunks';
import { validateSignUp } from './helper';
import styles from './SignUpForm.module.scss';

export function SignUpForm(): JSX.Element {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = params.get('returnTo');
  const [values, setValues] = useState<SignUpValues>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<ReturnType<typeof validateSignUp>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  const submit = async (): Promise<void> => {
    if (submitting.current) return;
    const nextErrors = validateSignUp(values);
    setErrors(nextErrors);
    setError('');
    if (Object.keys(nextErrors).length) return;
    const data = new FormData();
    data.set('name', values.name.trim());
    data.set('email', values.email.trim());
    data.set('password', values.password);
    submitting.current = true;
    setLoading(true);
    try {
      await dispatch(signupThunk(data)).unwrap();
      navigate(getPostAuthDestination(returnTo), { replace: true });
    } catch (failure) {
      if (failure === 'EMAIL_ALREADY_EXISTS') {
        setErrors({ email: 'Этот email уже зарегистрирован.' });
      } else {
        setError('Не удалось зарегистрироваться. Проверьте соединение и повторите попытку.');
      }
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <div className={styles.auth__form}>
      <SignUpCard
        values={values}
        errors={errors}
        feedback={error ? { message: error, variant: AlertVariant.Error } : undefined}
        loading={loading}
        onChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
        onSubmit={() => {
          void submit();
        }}
        onSignIn={() => navigate(getAuthenticationPath(routes.signIn, returnTo))}
        onBrowseListings={() => navigate(routes.listings)}
      />
    </div>
  );
}
