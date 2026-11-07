# Audit: first-use onboarding

## Surface classification

| File | Surface (A/B/C) | Business variable it moves | Notes |
|---|---|---|---|
| `index.html:880`, `src/features/onboarding/onboarding-renderer.ts` | A acquisition / activation | First-session activation: reach a usable app state after choosing an initial routine and content | First-use flow; no purchase is requested here. |

## Four-layer alignment

| Layer | Current promise |
|---|---|
| Landing | Know what to study today and why, using the exam syllabus and study history. |
| Onboarding | Turn the syllabus and available time into a weekly plan; without an exam date, explore the app and set the date later. |
| Product | Prioritize topics from exam importance, mastery and remaining effort, then organize activities. |
| Pricing | Free supports trying the method on one device; Pro expands syllabus capacity, sync and advanced simulations. |

The main promise is aligned. Keep the outcome clear and make the first content choice easy. Without a deadline, the user can explore, but no weekly plan is created.

## Screen seen

- `/?firstAccess=1#dashboard` · 320, 390 and 1280px · first-visit welcome modal over a fresh account with no date or study content. It rendered at all widths with 0px horizontal overflow. The modal leads with guided setup and keeps the demo as the secondary path. `check.mjs` flagged clipped text in the dashboard behind the welcome modal; those candidates are outside this edit.
- Same route after “Começar agora” · 390 × 844 · goal step, no date. The date input and estimated-date shortcuts start collapsed; the disclosure opens when selected. “Continuar sem data” advances to availability.
- Same route through no-date → availability preset → content · 320, 390 and 1280px · one suggested administrative pack is shown, without a popularity claim. At 320px, the pack action becomes visible after scrolling its modal content above the fixed footer. Width measurements remained equal to the document width at all three sizes.
- Same route through package selection → preview → exploration · 390 × 844 · preview showed 14h weekly capacity, 11 active topics, a 10h15 estimated load, and no weeks-to-exam value. “Explorar o app sem criar plano” returned to Hoje and confirmed no plan was created.
- Same 390px content screen with `data-theme=dark` · background and text remained readable; no horizontal overflow.

## Not checked

Keyboard-only flow, custom-date persistence after reload, and a real touch device. The `check.mjs` screenshot harness needed a temporary local CSP-relaxed proxy because the app's real CSP blocks its injected scanner. The app's actual CSP was left unchanged.

## Before and after

- Before, 390px content stage: `.playwright-mcp/page-2026-11-06T11-15-40-037Z.png`.
- After, 390px content stage: `.playwright-mcp/visant-content-390.png`.
- After, 390px goal step: `.playwright-mcp/visant-goal-390.png`.
- After, 320px and 1280px content stage: `.playwright-mcp/visant-content-320.png` and `.playwright-mcp/visant-content-1280.png`.
- After, 390px preview: `.playwright-mcp/visant-plan-390-clean.png`.

Expected variable: first-session activation. The shorter intro and collapsed optional date bring the first content choice forward. Removing the static “Mais Popular” claim avoids an unsupported popularity signal. No analytics events were changed; measure onboarding completion and first-use activation in the existing funnel.

## Findings

1. The uppercase “PRIMEIRA CONFIGURAÇÃO” label and long intro pushed the first step lower on mobile. Removed the redundant label and shortened the intro.
2. The optional exam date looked required because the input and its shortcuts were fully visible. Collapsed them behind an accessible disclosure that opens when a date is already present.
3. “Mais Popular” was hard-coded on the administrative starter pack without usage evidence. Removed the claim; “Sugestão para começar” already explains why it is shown first.
4. “Usar pacote” did not name the result. The action now says “Adicionar matérias”, with a matching accessible name.
