# UNIVERSAL DESIGN-TO-DEVELOPMENT WORKFLOW

> **Standard Operating Procedure (SOP)**  
> **Applicable Stack:** Universal (React, React Native, TypeScript, Tailwind CSS, Laravel, FastAPI, Vue, Next.js)  
> **Applicable Domains:** Web Apps, Mobile Apps, SaaS, Dashboards, ERP Systems, Portals, Landing Pages  

---

## 1. Universal Workflow Pipeline

Whenever a new application, feature, dashboard, or UI module is requested, follow this mandatory 12-stage workflow pipeline:

```text
USER REQUIREMENTS
        │
        ▼
PRODUCT ANALYSIS
        │
        ▼
UX INFORMATION ARCHITECTURE
        │
        ▼
USER FLOWS
        │
        ▼
DESIGN SYSTEM (design.md)
        │
        ▼
GOOGLE STITCH (StitchMCP)
        │
        ▼
SCREEN DESIGNS
        │
        ▼
DESIGN REVIEW
        │
        ▼
RESPONSIVE DESIGN
        │
        ▼
IMPLEMENTATION PLAN
        │
        ▼
PRODUCTION CODE
        │
        ▼
VISUAL QA & ITERATION
```

---

## 2. Detailed Phase Breakdown

### Phase 1: User Requirements
- Gather functional requirements, target user personas, business objectives, and constraints.
- Define success metrics for the interface (e.g., speed of user action, clarity of trip context, reduction in cognitive load).

### Phase 2: Product Analysis
- **Product Definition:** What is the product?
- **Audience:** Who are the primary users?
- **Problem Statement:** What core pain point is solved?
- **Primary User Action:** What is the single most important action on this view?

### Phase 3: Information Architecture (IA)
- Establish content hierarchy and visual priority.
- Define navigational structures (Top navigation, Sidebar, Bottom tabs, Floating actions).
- Categorize screen states:
  - **Ideal State:** Full rich data display.
  - **Empty State:** First-time onboarding or clear zero-state guidance.
  - **Loading State:** Shimmers/skeletons preserving layout boundaries.
  - **Error State:** Actionable error recovery and clear fallback UI.
  - **Success State:** Immediate visual feedback upon action completion.

### Phase 4: User Flows
- Map out step-by-step user pathways across screens.
- Identify touch points, modal triggers, back-navigation behavior, and secondary flows.

### Phase 5: Design System First (`design.md`)
Establish visual tokens before screen creation:
- **Typography:** Display, Headings, Body, Captions, Numeric/Stat formatting.
- **Color System:** Primary, Secondary, Background, Surface levels (Lowest -> Highest), Outline, Status colors (Success, Warning, Error, Info).
- **Spacing:** Base grid (e.g., 4px/8px scale), gutters, page margins.
- **Radius:** Small (inputs), Medium (cards), Pill (badges/chips).
- **Shadows & Elevation:** Zero-gravity ambient shadows or tonal layering.

### Phase 6: Google Stitch Generation (`StitchMCP`)
- Package design tokens into `upload_design_md`.
- Formulate high-context prompt specifying screen goal, component breakdown, device target (`MOBILE` / `DESKTOP`), and model (`GEMINI_3_1_PRO`).
- Invoke `StitchMCP:generate_screen_from_text`.

### Phase 7: Screen Designs Inspection
- Retrieve generated screen assets using `StitchMCP:get_screen`.
- Review screenshot download URL and layout DOM structure.
- Generate variants using `StitchMCP:generate_variants` or refine with `StitchMCP:edit_screens`.

### Phase 8: Design Review
Audit generated design against requirements:
- Does it solve the primary user action?
- Is information hierarchy clean and legible?
- Are contrast and touch targets accessible?

### Phase 9: Responsive Design Strategy
- **Web:** Desktop (1440px) -> Laptop (1024px) -> Tablet (768px) -> Mobile (375px).
- **Mobile:** iOS / Android safe areas, dynamic bottom sheets, one-handed thumb navigation.

### Phase 10: Implementation Plan
- Document exact code component mappings before writing code.
- Identify reusable vs new components.
- Preserve existing state management, API routes, and backend schema contracts.

### Phase 11: Production Code Implementation
- Translate Stitch visual structure into clean production-ready code (Tailwind, React, React Native, Vue, etc.).
- Never copy raw uncurated code blindly. Integrate with clean architecture.

### Phase 12: Visual QA & Iteration Loop
```text
STITCH DESIGN ──► IMPLEMENTATION ──► RUN APP ──► SCREENSHOT ──► COMPARE ──► FIX ──► VERIFY
```
- Compare rendered UI screenshot against Stitch design benchmark.
- Verify spacing, font size, border radii, alignment, and hover/active states.

---

## 3. Platform & Framework Specific Rules

### React & Tailwind CSS (Web)
- Use arbitrary values sparingly; stick to Tailwind design token classes (`bg-surface`, `text-primary`, `rounded-xl`).
- Ensure accessible contrast ratios (WCAG AAA/AA).
- Implement semantic HTML5 tags (`<main>`, `<nav>`, `<aside>`, `<header>`).

### React Native / Expo (Mobile)
- Account for status bar heights, notch safe area insets (`SafeAreaView`).
- Maintain minimum touch target size of 44x44 dp.
- Adapt bottom navigation to native platform conventions.

### Laravel / Server-Rendered Views
- Structure UI components using Blade components or Vue/Inertia primitives.
- Retain form CSRF protection and server validation feedback states.
