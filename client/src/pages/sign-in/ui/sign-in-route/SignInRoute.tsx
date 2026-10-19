import React from 'react';
import { SignInForm } from '@features/sign-in/ui/sign-in-form/SignInForm';
import styles from './SignInRoute.module.scss';

export default function SignInRoute(): JSX.Element {
  return (
    <main className={styles.auth__page}>
      <SignInForm />
    </main>
  );
}
