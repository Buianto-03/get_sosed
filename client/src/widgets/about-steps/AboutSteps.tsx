import React from 'react';
import { Heading, HeadingLevel, HeadingSize } from '@shared/ui/heading/Heading';
import { Surface, SurfaceElement } from '@shared/ui/surface/Surface';
import styles from './AboutSteps.module.scss';

const steps = [
  { number: '01', title: 'Ищите подходящее', text: 'Выберите район, бюджет и условия проживания.' },
  { number: '02', title: 'Смотрите детали', text: 'Изучите фото, описание и расположение жилья.' },
  { number: '03', title: 'Общайтесь', text: 'Свяжитесь с автором и обсудите совместную аренду.' },
];

export function AboutSteps(): JSX.Element {
  return (
    <section className={styles.aboutSteps} aria-label="Как пользоваться сервисом">
      <div className={styles.aboutSteps__grid}>
        {steps.map((step) => (
          <Surface
            as={SurfaceElement.Article}
            className={styles.aboutSteps__card}
            key={step.number}
          >
            <span className={styles.aboutSteps__number}>{step.number}</span>
            <Heading level={HeadingLevel.H3} size={HeadingSize.Sm}>
              {step.title}
            </Heading>
            <p className={styles.aboutSteps__description}>{step.text}</p>
          </Surface>
        ))}
      </div>
    </section>
  );
}
