import React, { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '@app/store/hooks';
import { routes } from '@shared/config/routes';
import {
  getAuthenticationPath,
  getPostAuthDestination,
} from '@shared/lib/navigation/safe-return-to';
import { AlertVariant } from '@shared/ui/feedback/Alert';
import { SignInCard } from '../sign-in-card/SignInCard';
import { signinThunk } from '../../thunks';
import { validateSignIn } from './helper';
import styles from './SignInForm.module.scss';

export function SignInForm(): JSX.Element {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = params.get('returnTo');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<ReturnType<typeof validateSignIn>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  const submit = async (): Promise<void> => {
    if (submitting.current) return;
    const values = { email: email.trim(), password };
    const nextErrors = validateSignIn(values);
    setErrors(nextErrors);
    setError('');
    if (Object.keys(nextErrors).length) return;
    submitting.current = true;
    setLoading(true);
    try {
      await dispatch(signinThunk(values)).unwrap();
      navigate(getPostAuthDestination(returnTo), { replace: true });
    } catch {
      setError('Не удалось войти. Проверьте email, пароль и соединение.');
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <div className={styles.auth__form}>
      <SignInCard
        email={email}
        password={password}
        emailError={errors.email}
        passwordError={errors.password}
        feedback={error ? { message: error, variant: AlertVariant.Error } : undefined}
        loading={loading}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={() => {
          void submit();
        }}
        onRegister={() => navigate(getAuthenticationPath(routes.signUp, returnTo))}
        onBrowseListings={() => navigate(routes.listings)}
      />
    </div>
  );
}
