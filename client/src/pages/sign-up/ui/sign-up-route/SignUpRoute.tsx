import React from 'react';
import { SignUpForm } from '@features/sign-up/ui/sign-up-form/SignUpForm';
import styles from './SignUpRoute.module.scss';

export default function SignUpRoute(): JSX.Element {
  return (
    <main className={styles.auth__page}>
      <SignUpForm />
    </main>
  );
}
