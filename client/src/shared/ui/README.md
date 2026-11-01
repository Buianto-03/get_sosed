# UI kit

UI kit lives in `src/shared/ui`. The independent visual catalog is in `src/preview/UiFoundationsShowcase.tsx`; open the «Показать примеры типографики и контейнеров» section in the design preview to inspect examples and local states.

## Component catalog

| Area | Components | Public variants and states |
| --- | --- | --- |
| Foundations | `Text`, `Heading`, `Container`, `Surface`, `Divider` | `TextElement` (`Paragraph`, `Span`, `Div`), `TextVariant` (`Body`, `Lead`, `Small`, `Caption`), `TextTone` (`Default`, `Muted`); `HeadingLevel` (`H1`–`H6`), `HeadingSize` (`Display`, `Xl`, `Lg`, `Md`, `Sm`); `ContainerElement` (`Div`, `Section`, `Main`), `ContainerWidth` (`Content`, `Wide`); `SurfaceElement` (`Div`, `Section`, `Article`), `SurfaceTone` (`Default`, `Soft`), `SurfacePadding` (`None`, `Sm`, `Md`, `Lg`). |
| Actions | `Button`, `IconButton`, `Link` | `ButtonVariant` (`Primary`, `Secondary`, `Text`), `ButtonSize` (`Sm`, `Md`, `Lg`), `ButtonType` (`Native`, `Submit`, `Reset`); `LinkVariant` (`Default`, `Subtle`). Buttons also expose disabled/loading states. |
| Fields | `Field`, `Input`, `Textarea` | `InputType` (`Text`, `Email`, `Password`, `Search`, `Number`, `Tel`); `TextareaResize` (`Vertical`, `None`). Shared states: required, disabled, read-only, hint and error. |
| Selection | `Select`, `Checkbox`, `RadioGroup` | `RadioOrientation` (`Vertical`, `Horizontal`). Examples cover empty/selected, disabled option, disabled control, hint and error. |
| Display | `Badge`, `Chip`, `Avatar`, `AvatarGroup` | `BadgeVariant` (`Neutral`, `Accent`, `Success`, `Warning`), `BadgeSize` (`Sm`, `Md`); `ChipVariant` (`Neutral`, `Accent`, `Soft`), `ChipSize` (`Sm`, `Md`); `AvatarSize` (`Sm`, `Md`, `Lg`, `Xl`). Chip can be removable; avatar falls back to initials; avatar group can show overflow as `+N`. |
| Overlays | `Modal`, `Drawer`, `Menu` | `DialogSize` (`Sm`, `Md`, `Lg`), `DialogKind` (`Modal`, `Drawer`), `DialogSide` (`Left`, `Right`); `MenuPlacement` (`Start`, `End`). Dialogs support Escape, backdrop and close-button dismissal, focus trapping/restoration, and body scroll lock. Drawer is rendered in a portal over a viewport-sized backdrop. Menu supports arrow keys, Home/End, Escape and outside click. |
| Feedback | `Spinner`, `Skeleton`, `Alert`, `EmptyState` | `SpinnerSize` (`Sm`, `Md`, `Lg`); `SkeletonShape` (`Text`, `Rectangle`, `Circle`); `AlertVariant` (`Info`, `Success`, `Warning`, `Error`). |
| Navigation | `Tabs`, `Stepper` | `TabsOrientation` (`Horizontal`, `Vertical`); `StepperOrientation` (`Horizontal`, `Vertical`); derived `StepStatus` (`Completed`, `Current`, `Upcoming`, `Disabled`). Tabs and Stepper are controlled by their parent. |
| Photo selection | `FilePicker`, `UploadArea` | `FilePickerAccept` (`Images`, `Jpeg`, `Png`, `Webp`). UploadArea validates format, size and count; shows local thumbnails, main-photo selection, deletion and errors. Its optional `onChange` returns selected files, local preview URLs and the main-photo flag. Pass `value` and `onChange` to preserve photos when UploadArea unmounts; the parent then revokes preview URLs when photos are removed or the parent unmounts. Without `value`, UploadArea manages and revokes URLs itself. It does not upload files. |

Enum values are declared and exported next to the component that uses them. Use an enum for finite variant/orientation/size/element props; ordinary booleans, text and data collections remain boolean, string and object props.

`Tooltip` (`tooltip/Tooltip.tsx`) displays a text `content` on hover or keyboard focus and closes on Escape. `TooltipPlacement` exposes `Top` (default), `Bottom`, `Left`, and `Right`; the tooltip flips and stays within the viewport when space is limited. It renders in a portal and remains visible while hovered. Pass one focusable child that forwards native focus/blur handlers and `aria-describedby` (for example, `Button`, `IconButton`, or a native link). Existing descriptions and handlers are preserved. `disabled` or blank content suppresses the tooltip. Use plain text for content; interactive content belongs in a dialog or menu. `className` styles the trigger wrapper.

```tsx
import { Tooltip } from '@shared/ui/tooltip/Tooltip';

<Tooltip content="Сохранить объявление в избранное">
  <IconButton icon={<LuHeart />} label="В избранное" />
</Tooltip>
```

## Folder and styling rules

### Contrast and motion

Use `$color-border` for decorative separators and `$color-control-border` for
Input/Textarea/Select boundaries. Muted text and accent text are readable on
the page, surface, soft and highlight backgrounds; placeholders keep full opacity.
Focus uses `$color-focus` with a light separation band. Controls clipped inside
photos need an inset light band alongside
the dark outline, because a photograph has no fixed background color. Disabled
states keep their existing visual distinction; they are not normal active controls.

Under `prefers-reduced-motion: reduce`, Spinner and the loading Button keep their
accessible loading state but stop rotating. Skeleton is static, and the existing
Input/Textarea/Link/UploadArea/Button/Carousel transitions are disabled by their
own styles. The preview must not hide missing support with a universal animation
or transition override. Normal motion remains unchanged.

### Component conventions

- Keep each component in its own folder: `shared/ui/<component>/<Component>.tsx`, `<Component>.module.scss` and `<Component>.test.tsx` when the component has behavior worth verifying. A tightly related component family may share a directory only when that grouping is intentional, as with `selection` and `overlay`.
- Use SCSS Modules for component styles. Import design tokens with Sass `@use` from `shared/styles/_tokens.scss`; do not copy token values into component styles. `preview/tokens.module.scss` is only a preview bridge for CSS custom properties.
- Keep component behavior local and presentation-focused. Screen state belongs to the screen or feature; UI kit components receive values and callbacks. Do not add network requests or backend assumptions to the UI kit.
- Preserve semantic HTML and accessible names. Use native buttons/inputs, visible keyboard focus, ARIA only where native semantics do not express the role or state, and `prefers-reduced-motion` for animation.
- Keep examples in the preview showcase when a component or meaningful state is added. Update this catalog and `DESIGN.md` with the same change.
- Tests should verify user-visible behavior such as selection, keyboard input, disabled states, removal and errors. Name per-component tests after the component; a shared test file is appropriate only for a deliberately grouped family.

## Keyboard interaction

`IconButton` targets are 44 × 44 px for Sm/Md and 48 × 48 px for Lg.
Use native `disabled` for unavailable actions. `loading` also disables `Button`
while an action is pending.

Dialogs make the background inert, contain keyboard focus, and restore it to the
opener. If the opener disappeared, focus falls back to the page heading/content.
Changing dialog content or the `onClose` callback does not reset focus.
Menu closes on Tab and continues native traversal from its trigger.

`FilePicker` exposes one keyboard stop: the visible button opens the native chooser.
`UploadArea` moves focus to the next remaining photo action or the picker after removal.
`shared/lib/focus/use-focus-after-update.ts` stores a requested focus target resolver
and runs it after DOM updates until a target is available. Consumers choose the
target; the request is consumed before focusing it. Search pagination, photo
removal, and profile collection focus recovery use this hook.
`Stepper` describes each button's number, total, and current/completed state.

Forms can use `shared/lib/forms/use-form-feedback.ts`: call `requestFeedbackFocus`
before validation/submission and attach `formRef` to the form. It focuses committed
field errors or general feedback after pending finishes; typing alone never requests focus.

## Example

```tsx
<Tabs
  id="profile-tabs"
  label="Разделы профиля"
  tabs={[
    { id: 'overview', label: 'Обзор' },
    { id: 'settings', label: 'Настройки' },
  ]}
  value={activeTab}
  onValueChange={setActiveTab}
/>
```
