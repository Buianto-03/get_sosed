import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AboutBanner } from '@widgets/about-banner/AboutBanner';
import { AboutSteps } from '@widgets/about-steps/AboutSteps';
import { routes } from '@shared/config/routes';
import styles from './AboutPage.module.scss';

export default function AboutPage(): JSX.Element {
  const navigate = useNavigate();
  return (
    <main className={styles.about__page}>
      <AboutBanner
        description="Помогаем найти жильё для совместного проживания и познакомиться с будущими соседями."
        onBrowseListings={() => navigate(routes.listings)}
      />
      <AboutSteps />
    </main>
  );
}
