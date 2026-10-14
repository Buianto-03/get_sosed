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
| Overlays | `Modal`, `Drawer`, `Menu` | `DialogSize` (`Sm`, `Md`, `Lg`), `DialogKind` (`Modal`, `Drawer`), `DialogSide` (`Left`, `Right`); `MenuPlacement` (`Start`, `End`). Dialogs support Escape, backdrop and close-button dismissal, focus trapping/restoration, and body scroll lock. Menu supports arrow keys, Home/End, Escape and outside click. |
| Feedback | `Spinner`, `Skeleton`, `Alert`, `EmptyState` | `SpinnerSize` (`Sm`, `Md`, `Lg`); `SkeletonShape` (`Text`, `Rectangle`, `Circle`); `AlertVariant` (`Info`, `Success`, `Warning`, `Error`). |
| Navigation | `Tabs`, `Stepper` | `TabsOrientation` (`Horizontal`, `Vertical`); `StepperOrientation` (`Horizontal`, `Vertical`); derived `StepStatus` (`Completed`, `Current`, `Upcoming`, `Disabled`). Tabs and Stepper are controlled by their parent. |
| Photo selection | `FilePicker`, `UploadArea` | `FilePickerAccept` (`Images`, `Jpeg`, `Png`, `Webp`). UploadArea validates format, size and count; shows local thumbnails, main-photo selection, deletion and errors. It does not upload files. |

Enum values are declared and exported next to the component that uses them. Use an enum for finite variant/orientation/size/element props; ordinary booleans, text and data collections remain boolean, string and object props.

## Folder and styling rules

- Keep each component in its own folder: `shared/ui/<component>/<Component>.tsx`, `<Component>.module.scss` and `<Component>.test.tsx` when the component has behavior worth verifying. A tightly related component family may share a directory only when that grouping is intentional, as with `selection` and `overlay`.
- Use SCSS Modules for component styles. Import design tokens with Sass `@use` from `shared/styles/_tokens.scss`; do not copy token values into component styles. `preview/tokens.module.scss` is only a preview bridge for CSS custom properties.
- Keep component behavior local and presentation-focused. Screen state belongs to the screen or feature; UI kit components receive values and callbacks. Do not add network requests or backend assumptions to the UI kit.
- Preserve semantic HTML and accessible names. Use native buttons/inputs, visible keyboard focus, ARIA only where native semantics do not express the role or state, and `prefers-reduced-motion` for animation.
- Keep examples in the preview showcase when a component or meaningful state is added. Update this catalog and `DESIGN.md` with the same change.
- Tests should verify user-visible behavior such as selection, keyboard input, disabled states, removal and errors. Name per-component tests after the component; a shared test file is appropriate only for a deliberately grouped family.

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
