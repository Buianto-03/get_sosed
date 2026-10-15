import React, { useId } from 'react';
import { Button, ButtonType, ButtonVariant } from '@shared/ui/button/Button';
import { Alert, type AlertVariant } from '@shared/ui/feedback/Alert';
import { Heading, HeadingLevel, HeadingSize } from '@shared/ui/heading/Heading';
import { Input, InputType } from '@shared/ui/input/Input';
import { Surface, SurfacePadding } from '@shared/ui/surface/Surface';
import styles from './SignUpCard.module.scss';

export interface SignUpValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignUpFeedback {
  message: string;
  variant: AlertVariant;
}

interface SignUpCardProps {
  values: SignUpValues;
  errors?: Partial<Record<keyof SignUpValues, string>>;
  feedback?: SignUpFeedback;
  loading?: boolean;
  onChange: (field: keyof SignUpValues, value: string) => void;
  onSubmit: () => void;
  onSignIn: () => void;
  onBrowseListings: () => void;
}

export function SignUpCard({
  values,
  errors = {},
  feedback,
  loading = false,
  onChange,
  onSubmit,
  onSignIn,
  onBrowseListings,
}: SignUpCardProps): JSX.Element {
  const id = useId();

  return (
    <div className={styles.signUpCard}>
      <Surface padding={SurfacePadding.None} className={styles.signUpCard__surface}>
        <form
          className={styles.signUpCard__form}
          aria-busy={loading || undefined}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className={styles.signUpCard__intro}>
            <Heading level={HeadingLevel.H2} size={HeadingSize.Xl}>Регистрация</Heading>
            <p>Создайте профиль, чтобы общаться и размещать объявления.</p>
          </div>
          <Input
            id={`${id}-name`}
            label="Имя"
            autoComplete="name"
            placeholder="Как вас зовут"
            value={values.name}
            error={errors.name}
            disabled={loading}
            onChange={(event) => onChange('name', event.target.value)}
          />
          <Input
            id={`${id}-email`}
            label="Email"
            type={InputType.Email}
            autoComplete="email"
            placeholder="Введите ваш email"
            value={values.email}
            error={errors.email}
            disabled={loading}
            onChange={(event) => onChange('email', event.target.value)}
          />
          <Input
            id={`${id}-password`}
            label="Пароль"
            type={InputType.Password}
            autoComplete="new-password"
            placeholder="Придумайте пароль"
            value={values.password}
            error={errors.password}
            disabled={loading}
            onChange={(event) => onChange('password', event.target.value)}
          />
          <Input
            id={`${id}-confirm-password`}
            label="Повторите пароль"
            type={InputType.Password}
            autoComplete="new-password"
            placeholder="Повторите пароль"
            value={values.confirmPassword}
            error={errors.confirmPassword}
            disabled={loading}
            onChange={(event) => onChange('confirmPassword', event.target.value)}
          />
          {feedback && <Alert variant={feedback.variant}>{feedback.message}</Alert>}
          <Button className={styles.signUpCard__submit} type={ButtonType.Submit} loading={loading}>
            Зарегистрироваться
          </Button>
          <p className={styles.signUpCard__signIn}>
            Уже есть аккаунт?{' '}
            <Button variant={ButtonVariant.Text} onClick={onSignIn}>
              Войти
            </Button>
          </p>
          <Button
            className={styles.signUpCard__browse}
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
