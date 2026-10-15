import React from 'react';
import styles from './HowItWorks.module.scss';

const steps = [
  { number: '01', title: 'Поиск', text: 'Выберите расположение, бюджет и условия.' },
  { number: '02', title: 'Детали', text: 'Посмотрите фотографии, описание и карту.' },
  { number: '03', title: 'Общение', text: 'Напишите автору и договоритесь о деталях.' },
];

export function HowItWorks(): JSX.Element {
  return (
    <div className={styles.container}>
      <section className={styles.steps} aria-labelledby="home-steps-heading">
        <h2 id="home-steps-heading">Как это работает</h2>
        <div className={styles.stepsGrid}>
          {steps.map((step) => (
            <article className={styles.step} key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
