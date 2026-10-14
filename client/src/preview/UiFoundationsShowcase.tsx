import React from 'react';
import { LuHeart, LuSearch } from 'react-icons/lu';
import {
  Button,
  ButtonSize,
  ButtonType,
  ButtonVariant,
} from '../shared/ui/button/Button';
import { IconButton } from '../shared/ui/button/IconButton';
import { Avatar, AvatarSize } from '../shared/ui/avatar/Avatar';
import { AvatarGroup } from '../shared/ui/avatar/AvatarGroup';
import { Badge, BadgeSize, BadgeVariant } from '../shared/ui/badge/Badge';
import { Chip, ChipSize, ChipVariant } from '../shared/ui/chip/Chip';
import { Modal } from '../shared/ui/overlay/Modal';
import { Drawer } from '../shared/ui/overlay/Drawer';
import { Menu } from '../shared/ui/overlay/Menu';
import { Checkbox } from '../shared/ui/selection/checkbox/Checkbox';
import { Container, ContainerWidth } from '../shared/ui/container/Container';
import { Divider } from '../shared/ui/divider/Divider';
import { RadioGroup, RadioOrientation } from '../shared/ui/selection/radio-group/RadioGroup';
import { Select } from '../shared/ui/selection/select/Select';
import { Input, InputType } from '../shared/ui/input/Input';
import { Heading, HeadingLevel, HeadingSize } from '../shared/ui/heading/Heading';
import { Link, LinkVariant } from '../shared/ui/link/Link';
import {
  Surface,
  SurfaceElement,
  SurfacePadding,
  SurfaceTone,
} from '../shared/ui/surface/Surface';
import { Text, TextTone, TextVariant } from '../shared/ui/text/Text';
import { Textarea, TextareaResize } from '../shared/ui/textarea/Textarea';
import styles from './UiFoundationsShowcase.module.scss';

export function UiFoundationsShowcase(): JSX.Element {
  const [housingChoice, setHousingChoice] = React.useState('room');
  const [activeChips, setActiveChips] = React.useState([
    'Для некурящих',
    'Можно с питомцами',
  ]);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

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
        <Surface as={SurfaceElement.Section} padding={SurfacePadding.Md}>
          <Heading level={HeadingLevel.H3} size={HeadingSize.Md}>
            Кнопки и ссылки
          </Heading>
          <div className={styles.controls}>
            <Button type={ButtonType.Native}>Основная</Button>
            <Button variant={ButtonVariant.Secondary}>Вторичная</Button>
            <Button variant={ButtonVariant.Text} size={ButtonSize.Sm}>Текстовая</Button>
            <Button variant={ButtonVariant.Secondary} disabled>Недоступна</Button>
            <Button loading>Загрузка</Button>
            <IconButton
              icon={<LuHeart aria-hidden="true" />}
              label="Добавить в избранное"
            />
            <Link href="#preview-frame">Открыть макет</Link>
            <Link href="#preview-frame" variant={LinkVariant.Subtle}>Тихая ссылка</Link>
          </div>
        </Surface>
        <Surface as={SurfaceElement.Section} padding={SurfacePadding.Md}>
          <Heading level={HeadingLevel.H3} size={HeadingSize.Md}>
            Текстовые поля
          </Heading>
          <div className={styles.fieldExamples}>
            <Input
              id="preview-city"
              label="Город"
              type={InputType.Search}
              placeholder="Например, Москва"
              hint="Можно указать город или район"
              leadingIcon={<LuSearch />}
            />
            <Input
              id="preview-email-error"
              label="Электронная почта"
              type={InputType.Email}
              required
              placeholder="name@example.com"
              error="Проверьте адрес: он должен быть указан в формате name@example.com и содержать домен почты."
            />
            <Input
              id="preview-readonly"
              label="Только чтение"
              value="Значение нельзя изменить"
              readOnly
            />
            <Input
              id="preview-disabled"
              label="Недоступное поле"
              placeholder="Сначала выберите город"
              disabled
            />
            <Textarea
              id="preview-description"
              label="О себе"
              hint="Коротко расскажите о себе и привычках"
              rows={4}
              placeholder="Напишите несколько предложений"
              resize={TextareaResize.Vertical}
            />
          </div>
        </Surface>
        <Surface as={SurfaceElement.Section} padding={SurfacePadding.Md}>
          <Heading level={HeadingLevel.H3} size={HeadingSize.Md}>
            Элементы выбора
          </Heading>
          <div className={styles.selectionExamples}>
            <Select
              id="preview-selection-city"
              label="Город"
              defaultValue=""
              required
              hint="Выберите город из списка"
              options={[
                { value: 'moscow', label: 'Москва' },
                { value: 'spb', label: 'Санкт-Петербург' },
                { value: 'kazan', label: 'Казань' },
                { value: 'hidden', label: 'Недоступный вариант', disabled: true },
              ]}
            />
            <Checkbox
              id="preview-pets"
              label="Питомцы разрешены"
              hint="Отметьте, если готовы жить с животными"
              defaultChecked
            />
            <RadioGroup
              id="preview-housing-type"
              name="preview-housing-type"
              label="Что вы ищете?"
              value={housingChoice}
              onValueChange={setHousingChoice}
              orientation={RadioOrientation.Horizontal}
              options={[
                { value: 'room', label: 'Комнату' },
                { value: 'neighbor', label: 'Соседа' },
                { value: 'unavailable', label: 'Недоступно', disabled: true },
              ]}
              hint="Выбор меняется локально"
            />
          </div>
        </Surface>
        <Surface as={SurfaceElement.Section} padding={SurfacePadding.Md}>
          <Heading level={HeadingLevel.H3} size={HeadingSize.Md}>
            Чипы, статусы и аватары
          </Heading>
          <div className={styles.smallComponents}>
            <div className={styles.componentRow} role="group" aria-label="Варианты статусов">
              <Badge>Обычный</Badge>
              <Badge variant={BadgeVariant.Accent} size={BadgeSize.Md}>Новое</Badge>
              <Badge variant={BadgeVariant.Success}>Проверено</Badge>
              <Badge variant={BadgeVariant.Warning}>Осталось мало мест</Badge>
            </div>
            <div className={styles.componentRow} role="group" aria-label="Удаляемые фильтры">
              {activeChips.map((label) => (
                <Chip
                  key={label}
                  label={label}
                  variant={ChipVariant.Soft}
                  size={ChipSize.Md}
                  onRemove={() => setActiveChips((current) => current.filter((item) => item !== label))}
                />
              ))}
              {activeChips.length === 0 && (
                <Text variant={TextVariant.Small} tone={TextTone.Muted}>
                  Все фильтры удалены
                </Text>
              )}
              <Chip label="Москва" variant={ChipVariant.Accent} icon={<LuSearch />} />
            </div>
            <div className={styles.componentRow}>
              <Avatar name="Анна Смирнова" size={AvatarSize.Xl} />
              <AvatarGroup
                label="Участники объявления"
                max={3}
                size={AvatarSize.Lg}
                avatars={[
                  { name: 'Анна Смирнова' },
                  { name: 'Михаил Петров' },
                  { name: 'София Иванова' },
                  { name: 'Алексей Волков' },
                  { name: 'Мария Соколова' },
                ]}
              />
            </div>
          </div>
        </Surface>
        <Surface as={SurfaceElement.Section} padding={SurfacePadding.Md}>
          <Heading level={HeadingLevel.H3} size={HeadingSize.Md}>
            Всплывающие элементы
          </Heading>
          <div className={styles.controls}>
            <Button onClick={() => setModalOpen(true)}>Открыть modal</Button>
            <Button variant={ButtonVariant.Secondary} onClick={() => setDrawerOpen(true)}>
              Открыть drawer
            </Button>
            <Menu
              label="Действия объявления"
              trigger="Меню объявления"
              items={[
                { label: 'Изменить', onSelect: () => undefined },
                { label: 'Скрыть', onSelect: () => undefined },
                { label: 'Удалить', onSelect: () => undefined },
              ]}
            />
          </div>
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Подтвердите действие">
            <Text variant={TextVariant.Body}>
              Это пример модального окна. Нажмите Escape или кнопку закрытия, чтобы вернуться к странице.
            </Text>
            <div className={styles.controls}>
              <Button onClick={() => setModalOpen(false)}>Понятно</Button>
            </div>
          </Modal>
          <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Фильтры поиска">
            <Text variant={TextVariant.Body}>
              Пример выдвижной панели. Фокус остаётся внутри, а прокрутка страницы блокируется.
            </Text>
          </Drawer>
        </Surface>
      </Container>
    </details>
  );
}
