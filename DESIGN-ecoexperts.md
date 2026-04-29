---
version: alpha
name: Eco Experts
description: Eco-friendly advisory platform — deep navy text, green interactive accents, cool blue surfaces, rounded corners

colors:
  primary: "#053C5E"
  primary-dark: "#042B43"
  primary-lighter: "#B2C3CD"
  interactive: "#04AB49"
  interactive-hover: "#037934"
  interactive-pressed: "#025E28"
  interactive-lighter: "#B1E5C7"
  interactive-lightest: "#E6F7ED"
  surface: "#DEF2FB"
  surface-light: "#E8F6FC"
  surface-lighter: "#F0F9FD"
  surface-lightest: "#FAFDFE"
  on-surface: "#053C5E"
  on-surface-secondary: "#565660"
  on-surface-tertiary: "#9F9FA5"
  on-surface-inverted: "#FFFFFF"
  error: "#ED2012"
  error-dark: "#8E130B"
  error-light: "#FBD2D0"
  success: "#73B44B"
  success-dark: "#456C2D"
  success-light: "#E3F0DB"
  warning: "#FF9A00"
  warning-dark: "#663E00"
  warning-light: "#FFEBCC"
  info: "#0075FF"
  info-dark: "#005ECC"
  info-light: "#E5F1FF"
  neutral-white: "#FFFFFF"
  neutral-lightest: "#FAFAFA"
  neutral-light: "#EEEEEF"
  neutral: "#C6C6C9"
  neutral-dark: "#9F9FA5"
  neutral-darker: "#565660"
  neutral-darkest: "#36363D"
  brand-border: "#D1E8F8"
  brand-border-light: "#CEECF9"
  accent-red: "#E84D38"

typography:
  h1:
    fontFamily: Be Vietnam Pro
    fontSize: 44px
    fontWeight: 800
    lineHeight: 1.23
    letterSpacing: -0.02em
  h2:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.31
    letterSpacing: -0.016em
  h3:
    fontFamily: Be Vietnam Pro
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.29
    letterSpacing: -0.018em
  h4:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: 0
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: -0.025em
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.56
    letterSpacing: -0.028em
  body-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.63
    letterSpacing: 0
  body-xs:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.86
    letterSpacing: 0
  link:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.56
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  full: 104px

spacing:
  3xs: 8px
  2xs: 12px
  xs: 16px
  sm: 24px
  md: 32px
  lg: 40px
  xl: 48px

components:
  button-primary:
    backgroundColor: "{colors.interactive}"
    textColor: "{colors.on-surface-inverted}"
    rounded: "{rounded.xs}"
    padding: "{spacing.xs} {spacing.xl}"
  button-hover:
    backgroundColor: "{colors.interactive-hover}"
    textColor: "{colors.on-surface-inverted}"
    rounded: "{rounded.xs}"
  button-pressed:
    backgroundColor: "{colors.interactive-pressed}"
    textColor: "{colors.on-surface-inverted}"
    rounded: "{rounded.xs}"
  button-inverted:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.interactive}"
    rounded: "{rounded.xs}"
    padding: "{spacing.xs} {spacing.xl}"
  button-amazon:
    backgroundColor: "#FFD814"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xs}"
  card:
    backgroundColor: "{colors.surface-lighter}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  card-featured:
    backgroundColor: "{colors.surface-lightest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  input:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    padding: "{spacing.xs}"
  badge-brand:
    backgroundColor: "{colors.interactive-lightest}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
  badge-error:
    backgroundColor: "{colors.error-light}"
    textColor: "{colors.error-dark}"
    rounded: "{rounded.sm}"
  badge-success:
    backgroundColor: "{colors.success-light}"
    textColor: "{colors.success-dark}"
    rounded: "{rounded.sm}"
  badge-warning:
    backgroundColor: "{colors.warning-light}"
    textColor: "{colors.warning-dark}"
    rounded: "{rounded.sm}"
  badge-info:
    backgroundColor: "{colors.info-light}"
    textColor: "{colors.info-dark}"
    rounded: "{rounded.sm}"
  badge-dark:
    backgroundColor: "{colors.neutral-darkest}"
    textColor: "{colors.on-surface-inverted}"
    rounded: "{rounded.sm}"
  accordion:
    backgroundColor: "{colors.surface-lightest}"
    textColor: "{colors.on-surface}"
    padding: "{spacing.md}"
  navigation:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.neutral-dark}"
  footer:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.on-surface-inverted}"
  quote:
    backgroundColor: "{colors.surface-lightest}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
  table-header:
    backgroundColor: "{colors.surface-lighter}"
    textColor: "{colors.on-surface}"
  table-banner:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-surface-inverted}"
  tag:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.on-surface-secondary}"
    rounded: "{rounded.xs}"
  icon-button:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.on-surface-secondary}"
    rounded: "{rounded.sm}"
  menu-dropdown:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
  hero-cta:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
  popover:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  radio-button:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs}"
  radio-hover:
    backgroundColor: "{colors.interactive-lightest}"
    textColor: "{colors.on-surface}"
  radio-pressed:
    backgroundColor: "{colors.interactive-lightest}"
    textColor: "{colors.on-surface}"
  disabled-state:
    backgroundColor: "{colors.neutral-light}"
    textColor: "{colors.on-surface-tertiary}"
  focus-outline:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.on-surface}"
  surface-brand:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.on-surface}"
  page-alt:
    backgroundColor: "{colors.neutral-lightest}"
    textColor: "{colors.neutral-darker}"
  menu-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
  border-card:
    backgroundColor: "{colors.brand-border}"
    textColor: "{colors.primary}"
  border-decorative:
    backgroundColor: "{colors.brand-border-light}"
    textColor: "{colors.primary}"
  accent-strap:
    backgroundColor: "{colors.accent-red}"
    textColor: "{colors.on-surface-inverted}"
  icon-error:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.error}"
  icon-success:
    backgroundColor: "{colors.success-light}"
    textColor: "{colors.success}"
  icon-info:
    backgroundColor: "{colors.info-light}"
    textColor: "{colors.info}"
  alert-error:
    backgroundColor: "{colors.error-light}"
    textColor: "{colors.error-dark}"
  alert-success:
    backgroundColor: "{colors.success-light}"
    textColor: "{colors.success-dark}"
  alert-warning:
    backgroundColor: "{colors.warning-light}"
    textColor: "{colors.warning-dark}"
  alert-info:
    backgroundColor: "{colors.info-light}"
    textColor: "{colors.info-dark}"
  input-border:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.neutral}"
  border-brand-accent:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.primary-lighter}"
  interactive-bg:
    backgroundColor: "{colors.interactive-lighter}"
    textColor: "{colors.on-surface}"
---

# Eco Experts Design System

## Overview

Eco Experts is an eco-friendly advisory platform helping consumers make greener choices for their homes. The visual identity draws on natural associations: deep navy text grounds the page, green interactive elements signal action and positivity, and cool blue surface tones evoke sky and water. Generously rounded corners create an approachable, friendly feel throughout the interface. Unlike the sharper, more corporate brands in the system, Eco Experts leans into warmth and accessibility.

## Colors

### Primary palette

- **Primary** (#053C5E) — Deep navy blue. Used as the default text colour, headings, brand text, table banners, menu combo-boxes, and quote text. This is notably darker and more saturated than many brands, creating strong contrast against the light blue surfaces.
- **Interactive** (#04AB49) — A vibrant green, the brand's signature action colour. Used for all buttons, links, icon links, navigation icons, and quote marks. Hover (#037934) and pressed (#025E28) states deepen progressively.

### Surface and background

Eco Experts uses a cool blue surface scale that creates a layered, airy feel:

- **Surface** (#DEF2FB) — The deepest surface tone, used for active/pressed menu states.
- **Surface light** (#E8F6FC) — Brand background, the primary page tint.
- **Surface lighter** (#F0F9FD) — Card backgrounds, navigation secondary, table headers, tag hover.
- **Surface lightest** (#FAFDFE) — Accordion open state, featured cards, quote backgrounds, menu hover.
- **Neutral white** (#FFFFFF) — Default page background, input fields, accordion closed state.
- **Footer** uses primary-dark (#042B43), a near-black navy.

### Feedback colours

Shared across all brands:

- **Error** (#ED2012 / #8E130B / #FBD2D0) — Validation errors and destructive actions.
- **Success** (#73B44B / #456C2D / #E3F0DB) — Positive confirmations.
- **Warning** (#FF9A00 / #663E00 / #FFEBCC) — Also serves as the focus ring colour.
- **Info** (#0075FF / #005ECC / #E5F1FF) — Informational states and badges.

### Brand accents

- **Brand border** (#D1E8F8) — A soft sky blue used for card borders, creating subtle definition against the blue surfaces.
- **Brand border light** (#CEECF9) — Decorative border variant, used for quote borders.
- **Accent red** (#E84D38) — Reserved for the Hero CTA strap radio accent. Sparingly used.

## Typography

Eco Experts uses **Be Vietnam Pro** as the sole typeface. It is a geometric sans-serif with slightly more character and warmth than system fonts. Display headings use extra-bold (800) while other headings use semi-bold (600) — lighter than many brands in the system, contributing to the approachable tone. Body text is regular (400), small text is medium (500), and links are semi-bold (600).

### Base scale (desktop-sm)

| Style | Size | Weight | Line height | Letter spacing |
|-------|------|--------|-------------|----------------|
| h1 | 44px | 800 | 1.23 | -0.02em |
| h2 | 32px | 600 | 1.31 | -0.016em |
| h3 | 28px | 600 | 1.29 | -0.018em |
| h4 | 24px | 600 | 1.33 | 0 |
| body-lg | 20px | 400 | 1.6 | -0.025em |
| body-md | 18px | 400 | 1.56 | -0.028em |
| body-sm | 16px | 500 | 1.63 | 0 |
| body-xs | 14px | 400 | 1.86 | 0 |

### Responsive scaling

Font sizes scale down at smaller breakpoints. Weights and letter spacing remain constant.

| Style | Mobile | Tablet | Desktop-sm | Desktop-lg |
|-------|--------|--------|------------|------------|
| h1 | 32px | 36px | 44px | 44px |
| h2 | 28px | 32px | 32px | 36px |
| h3 | 24px | 24px | 28px | 28px |
| h4 | 20px | 20px | 24px | 24px |
| body-lg | 16px | 18px | 20px | 20px |
| body-md | 16px | 16px | 18px | 18px |
| body-sm | 14px | 14px | 16px | 16px |

## Layout & Spacing

The spacing scale is shared across all brands — a 7-step system from 8px:

| Token | Value | Usage |
|-------|-------|-------|
| 3xs | 8px | Small gaps, icon padding, back-to-top vertical padding |
| 2xs | 12px | Compact horizontal padding (back-to-top) |
| xs | 16px | Button vertical padding, accordion/popover mobile padding, custom radio padding |
| sm | 24px | Accordion/popover tablet padding, card mobile padding |
| md | 32px | Accordion/popover desktop padding, card tablet padding |
| lg | 40px | Card desktop padding |
| xl | 48px | Button horizontal padding |

## Border Radius

Rounded corners are core to Eco Experts' identity. Every component uses visible rounding, creating a soft, inviting interface. There is no sharp (0px) radius in this brand.

| Token | Value | Components |
|-------|-------|------------|
| xs | 4px | Buttons, back-to-top button, tags |
| sm | 8px | Badges, icon buttons, inputs, menu items, paid card thumbnails |
| md | 12px | Cards, images, menu dropdowns, paid cards |
| lg | 16px | Hero CTA, popovers |
| full | 104px | Avatars |

## Components

### Buttons

Primary buttons use the green interactive colour (#04AB49) with white text on a gently rounded container (4px). The generous horizontal padding (48px) creates a wide, confident target. Inverted buttons use a white fill with green text.

### Cards

Cards use the lighter surface tone (#F0F9FD) with a soft sky-blue border (#D1E8F8) and 12px radius. Unlike several other brands, Eco Experts uses **active card shadows** — a downward shadow (y: 12, blur: 16, spread: -8) in deep navy (#021927) creates subtle depth and lifts cards off the surface.

### Inputs

Input fields use 8px border radius. Focus state uses the warning colour (#FF9A00) as a high-visibility ring. Active/typing state switches to the interactive green (#04AB49).

### Navigation

Light theme. White primary background with the surface lighter tone (#F0F9FD) as the secondary background. Navigation icons use the interactive green.

### Paid content

Paid content tokens are currently set to #FFFFFF across the board, indicating this brand's paid styling has not been configured. The paid card container uses 12px radius matching standard cards.

## Do's and Don'ts

- Do maintain rounded corners throughout — this is the brand's signature approachable feel
- Do use the interactive green only for actionable elements (buttons, links, icons, quote marks)
- Do use the primary navy (#053C5E) as the default text colour, not pure black
- Do use the cool blue surface scale to create visual depth and layering
- Do use card shadows — they are part of this brand's visual language
- Don't introduce sharp corners (0px radius) — this conflicts with the brand identity
- Don't use border radius values outside the defined scale (4, 8, 12, 16, 104)
- Don't use the primary navy for interactive/clickable elements — green serves that role
- Don't mix font weights outside the defined set (400, 500, 600, 800)
- Do verify contrast ratios: green (#04AB49) on white achieves 3.53:1, meeting WCAG AA-large (3:1) for text 18px+ but not AA for smaller text. Use body-md (18px) or larger for green-on-white text
