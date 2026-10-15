import React, { useId } from 'react';
import { Alert, type AlertVariant } from '@shared/ui/feedback/Alert';
import { Button, ButtonType, ButtonVariant } from '@shared/ui/button/Button';
import { Heading, HeadingLevel, HeadingSize } from '@shared/ui/heading/Heading';
import { Input, InputType } from '@shared/ui/input/Input';
import { Surface, SurfacePadding } from '@shared/ui/surface/Surface';
import styles from './SignInCard.module.scss';

export interface SignInFeedback {
  message: string;
  variant: AlertVariant;
}

interface SignInCardProps {
  email: string;
  password: string;
  emailError?: string;
  passwordError?: string;
  feedback?: SignInFeedback;
  loading?: boolean;
  disabled?: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: () => void;
  onRegister: () => void;
  onBrowseListings: () => void;
}

export function SignInCard({
  email,
  password,
  emailError,
  passwordError,
  feedback,
  loading = false,
  disabled = false,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onRegister,
  onBrowseListings,
}: SignInCardProps): JSX.Element {
  const id = useId();
  const fieldsDisabled = loading || disabled;

  return (
    <div className={styles.signInCard}>
      <Surface padding={SurfacePadding.None} className={styles.signInCard__surface}>
        <form
          className={styles.signInCard__form}
          aria-busy={loading || undefined}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className={styles.signInCard__intro}>
            <Heading level={HeadingLevel.H2} size={HeadingSize.Xl}>Войти</Heading>
            <p>Войдите, чтобы писать авторам и сохранять объявления.</p>
          </div>
          <Input
            id={`${id}-email`}
            label="Email"
            type={InputType.Email}
            autoComplete="email"
            placeholder="Введите ваш email"
            value={email}
            error={emailError}
            disabled={fieldsDisabled}
            onChange={(event) => onEmailChange(event.target.value)}
          />
          <Input
            id={`${id}-password`}
            label="Пароль"
            type={InputType.Password}
            autoComplete="current-password"
            placeholder="Введите пароль"
            value={password}
            error={passwordError}
            disabled={fieldsDisabled}
            onChange={(event) => onPasswordChange(event.target.value)}
          />
          {feedback && <Alert variant={feedback.variant}>{feedback.message}</Alert>}
          <Button
            className={styles.signInCard__submit}
            type={ButtonType.Submit}
            loading={loading}
            disabled={disabled}
          >
            Войти
          </Button>
          <p className={styles.signInCard__register}>
            Нет аккаунта?{' '}
            <Button variant={ButtonVariant.Text} onClick={onRegister}>
              Зарегистрироваться
            </Button>
          </p>
          <Button
            className={styles.signInCard__browse}
            variant={ButtonVariant.Text}
            onClick={onBrowseListings}
          >
            Смотреть объявления без входа
          </Button>
        </form>
      </Surface>
    </div>
  );
}
