# ADR 001: Keep The Homepage As A Single Canvas With ScrollControls

## Status

Accepted

## Context

The homepage currently achieves its visual identity by combining:

- one fixed full-screen WebGL `Canvas`
- Drei `ScrollControls`
- DOM sections rendered inside `<Scroll html>`
- hard-coded 3D depth beats in `StoryScene`

This is more fragile than a normal DOM page, but it is also the core visual idea of the product.

## Decision

Keep the homepage as a single-canvas scroll composition unless a future task explicitly authorizes an architectural refactor.

## Why

- It preserves the current immersive product direction.
- It keeps the 3D narrative and DOM content visually integrated.
- It avoids a broad redesign during routine layout or content work.

## Consequences

- Homepage spacing changes must be made carefully because page height affects 3D scroll depth.
- `StoryScene` and `Home.tsx` are intentionally coupled.
- Future contributors should treat a move away from this model as a separate, explicit decision rather than an incidental cleanup.

