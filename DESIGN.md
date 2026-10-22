---
name: StarFocus Design System
description: Design tokens and component architecture guidelines for StarFocus.
theme:
  mode: dark
  background: "#09090b"
  surface: "#18181b"
  border: "#27272a"
tokens:
  typography:
    display:
      family: "var(--font-honk)"
      variationSettings: "'MORF' 15, 'SHLN' 50"
      description: "App title and cosmic branding headers"
    mono:
      family: "var(--font-jura)"
      description: "Technical metrics, counts, timestamps, and UI details"
    code:
      family: "var(--font-kode-mono)"
      description: "Code blocks, identifiers, and configuration labels"
  colors:
    semantic:
      primary:
        hex: "#60a5fa"
        variable: "--ion-color-primary"
        role: "Interactive buttons, active tabs, primary navigation highlights"
      secondary:
        hex: "#a78bfa"
        variable: "--ion-color-secondary"
        role: "Cosmic accents, sub-actions, secondary badges"
      tertiary:
        hex: "#e879f9"
        variable: "--ion-color-tertiary"
        role: "Gamification highlights, special milestones"
      success:
        hex: "#34d399"
        variable: "--ion-color-success"
        role: "Synced indicators, completed goals, online state"
      warning:
        hex: "#fdba74"
        variable: "--ion-color-warning"
        role: "Folder reconnection required, attention prompts, snoozed state"
      danger:
        hex: "#f43f5e"
        variable: "--ion-color-danger"
        role: "Sync errors, destructive operations, connection drops"
    starPoints:
      tier1:
        points: 1
        hex: "#ff7878"
        variable: "--star-1"
        description: "Initial entry tasks, quick habits, low friction items"
      tier2:
        points: 2
        hex: "#f77baf"
        variable: "--star-2"
        description: "Minor focused tasks, short errands, 15-minute bursts"
      tier3:
        points: 3
        hex: "#5fbff7"
        variable: "--star-3"
        description: "Standard work units, half-hour commits, daily priorities"
      tier5:
        points: 5
        hex: "#e04573"
        variable: "--star-5"
        description: "Deep focus milestones, multi-step sub-goals, core deliverables"
      tier8:
        points: 8
        hex: "#2068ef"
        variable: "--star-8"
        description: "Major project milestones, significant creative output"
      tier13:
        points: 13
        hex: "#9a7bf7"
        variable: "--star-13"
        description: "Epic space journeys, transformative life achievements"
  components:
    library: "@ionic/react"
---

# Design Guidelines

## Primary Component Library: Ionic Framework

**Ionic Framework (`@ionic/react`) is the chosen component library for StarFocus.**

Unless there is an explicit and documented technical reason, all UI layouts, pages, controls, and navigation structures must use native Ionic components rather than reinventing them with custom HTML elements or Tailwind wrappers.

### Standard Component Mappings

| UI Pattern | Preferred Ionic Component | Avoid |
|---|---|---|
| Layout & Panes | `<IonSplitPane>`, `<IonPage>`, `<IonContent>` | Custom flexbox/grid page layouts |
| Sidebars & Drawers | `<IonMenu>`, `<IonMenuButton>`, `<IonMenuToggle>` | Custom sliding drawers / overlays |
| Toolbars & Headers | `<IonHeader>`, `<IonToolbar>`, `<IonTitle>`, `<IonButtons>`, `<IonBackButton>` | Custom header divs |
| Buttons & Triggers | `<IonButton>`, `<IonChip>` | Native `<button>` with Tailwind styling |
| Tags, Badges & Pills | `<IonBadge>`, `<IonChip>` | Custom rounded span tags |
| Lists & Menu Items | `<IonList>`, `<IonItem>` | Custom div or button lists |
| Selects & Dropdowns | `<IonSelect>`, `<IonSelectOption>` | Native HTML `<select>` |
| Form Controls | `<IonToggle>`, `<IonRange>`, `<IonInput>`, `<IonTextarea>` | Native HTML inputs |
| Labels | `<IonLabel>` | Unslotted labels in Ionic items |

### Component Workbench Architecture Guidelines

The Component Workbench (`/dev/components/:component`) provides an isolated environment for developing, inspecting, and stress-testing individual components.

1. **Strict Canvas Isolation**:
   - **The Stage Canvas (`[data-testid="workbench-canvas"]`) is strictly and exclusively reserved for the component under test.**
   - Do NOT place telemetry grids, debug HUDs, multiple variant comparison cards, mock surrounding apps, or floating test buttons on the canvas.
   - The canvas displays only the component under test, cleanly centered against the standard dot-grid background.

2. **Sheet Modal Architecture for Presets & Knobs**:
   - Both Scenario Presets and Simulator Knobs are consolidated into an Ionic Sheet Modal (`<IonModal>` with `breakpoints={[0.16, 0.65, 0.95]}`).
   - **Peek Mode by Default**: The sheet modal is presented at `initialBreakpoint={0.16}`. In peek mode, it displays only the grab handle, title/expand action, and the quick-action Scenario Presets (`[data-testid="workbench-presets-bar"]`).
   - **Expanded Mode for Knobs & Telemetry**: Users can drag the handle or tap expand to reach breakpoints `0.65` or `0.95`, revealing the complete controls pane:
     - Real-time Telemetry HUD (angular velocity, rotation angle, physics phase, data transmission status)
     - Simulation Impulse Triggers (quick pulse, standard transfer, long transfer, continuous sync)
     - Interactive Knobs (ranges, toggles, dropdown selects)
   - **Non-dismissible Sheet**: The sheet modal does not include `0` in its breakpoints array, guaranteeing that presets always remain accessible in peek mode at the bottom of the viewport.
   - **Non-blocking Backdrop in Peek Mode**: `backdropBreakpoint={0.65}` ensures no backdrop overlay exists when in peek mode, allowing full interactivity with the canvas above.

3. **Presets Contract**:
   - Presets must **only alter the simulator's underlying state**. Clicking an `<IonChip>` updates the simulator state (e.g. toggles, selects, impulse timers), which in turn propagates down to the component under test.
   - Never add duplicate action buttons or floating trigger pills to the stage canvas.
