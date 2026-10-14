import React from 'react';
import { Container, ContainerWidth } from '../shared/ui/container/Container';
import { Divider } from '../shared/ui/divider/Divider';
import { Heading, HeadingLevel, HeadingSize } from '../shared/ui/heading/Heading';
import {
  Surface,
  SurfaceElement,
  SurfacePadding,
  SurfaceTone,
} from '../shared/ui/surface/Surface';
import { Text, TextTone, TextVariant } from '../shared/ui/text/Text';
import styles from './UiFoundationsShowcase.module.scss';

export function UiFoundationsShowcase(): JSX.Element {
  return (
    <details className={styles.showcase}>
      <summary className={styles.summary}>Показать примеры типографики и контейнеров</summary>
      <Container width={ContainerWidth.Content} className={styles.content}>
        <Heading level={HeadingLevel.H2} size={HeadingSize.Xl}>Базовые компоненты UI kit</Heading>
        <Text variant={TextVariant.Small} tone={TextTone.Muted}>
          Примеры собраны из компонентов UI kit и масштабируются вместе с шириной страницы.
        </Text>
        <Divider />
        <Surface as={SurfaceElement.Section} padding={SurfacePadding.Lg} className={styles.sample}>
          <Text variant={TextVariant.Caption} tone={TextTone.Muted}>ЗАГОЛОВОК · DISPLAY</Text>
          <Heading level={HeadingLevel.H3} size={HeadingSize.Display}>
            Твоё место. Твои люди.
          </Heading>
          <Text variant={TextVariant.Lead}>
            Жильё и люди рядом — найдите пространство, в котором вам будет хорошо.
          </Text>
          <Text variant={TextVariant.Body}>
            Основной текст сохраняет удобную длину строки, а длинные слова и ссылки
            переносятся, не расширяя контейнер.
          </Text>
        </Surface>
        <div className={styles.variants}>
          <Surface padding={SurfacePadding.Md}>
            <Heading level={HeadingLevel.H3} size={HeadingSize.Lg}>Заголовок секции</Heading>
            <Text variant={TextVariant.Body}>Основной текст · 16 px</Text>
            <Text variant={TextVariant.Small} tone={TextTone.Muted}>Вспомогательный текст · 14 px</Text>
            <Text variant={TextVariant.Caption} tone={TextTone.Muted}>Подпись · 12 px</Text>
          </Surface>
          <Surface tone={SurfaceTone.Soft} padding={SurfacePadding.Md}>
            <Heading level={HeadingLevel.H3} size={HeadingSize.Md}>Мягкая поверхность</Heading>
            <Text variant={TextVariant.Small} tone={TextTone.Muted}>
              Контейнер задаёт ширину и поля; поверхность — фон, границу и внутренние отступы.
            </Text>
          </Surface>
        </div>
      </Container>
    </details>
  );
}
