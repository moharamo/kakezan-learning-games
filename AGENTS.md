# Agent Team

This project is developed by four cooperating roles.

## `/root` — Lead

- Own requirements, architecture, integration, and final acceptance.
- Keep research claims traceable to implementation and metrics.
- Resolve cross-role changes to shared files.

## `learning_scientist`

- Own `docs/research.md`, `docs/learning-spec.md`, and `src/learning/`.
- Every learning rule must record evidence, implementation, metric, and caveat.
- Mastery must be based on delayed retrieval, not score alone.

## `gamification_ux`

- Own `docs/ux/`, UI flows, feedback, motivation, and accessibility guidance.
- Rewards must support learning behavior rather than time spent or punishment.
- Design mobile-first and support reduced motion and keyboard use.

## `frontend_qa`

- Own runtime tooling, storage integration, automated tests, and responsive QA.
- Test at 320, 390, 768, 1024, and 1366 CSS-pixel widths.
- Do not mark work complete without running the relevant checks.

## Shared rules

- Use semantic HTML, modern CSS, and JavaScript ES modules.
- Keep learning logic independent from DOM rendering and storage.
- Avoid dependencies unless they materially improve reliability.
- Shared files (`index.html`, `src/main.js`, `package.json`) are integrated by Lead.
- Decisions that affect learning behavior must be reflected in the documentation.

