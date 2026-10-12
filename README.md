# HĒLIX — Open Grammar & Chord Laboratory

**A typed, perspectival grammar for possible experiences, with an interactive musical interpreter.**

A chord is how a situated observer experiences relationships among remembered events, the present and possible futures. **Anything may remain possible; the language never selects a privileged global future.**

## Launch

The public website is pure static HTML / JavaScript (no build or accounts):

```bash
python -m http.server 8000
# Open http://localhost:8000
```

- `index.html` — full HGL-1 grammar editor: typed nodes, 15 operations, perspectives, abstraction, an SVG relational chord and bidirectional editable HGL text.
- `instrument.html` — Web Audio chord synthesizer, temporal performance, A/B alternatives, MIDI / HMX-1 serializer and live note editing.
- `src/grammar.mjs` — dependency-free formalized runtime syntax + semantics, validators, symbol codec, projection / reconstruction / composition / gluing utilities.
- `docs/GRAMMAR.md` — typed alphabet, construction rules, limits and examples.
- `docs/RESEARCH.md` — completed experiments and outstanding hypotheses.
- `formal/` — Lean 4 *proof candidates* for the narrower symbolic set and partial assignment layers (**not kernel-checked in this environment**).
- `tests/` — deterministic Node and Chromium tests.

**Important:** Mobile in-app HTML previews may block scripts and audio. Open a real HTTPS-hosted version in Safari, rather than a ChatGPT file preview. Both applications show meaningful static content and a warning when scripts are disabled.

## Tests

```bash
node --test tests/*.test.mjs
python tests/browser_smoke.py    # requires Python + Playwright + Chromium
```

The Node suite has no dependencies and is run by CI. Chromium smoke tests cover editing, rendering and synthesizer startup, but not actual iPad Safari. Tests of HGL-1 semantic properties are distinct from the more limited Lean models.

## How the editors interoperate

1. Add typed objects / relations in the grammar editor or edit the serialized HGL-1 source.
2. Press **Voice in instrument** to send a musical projection to the instrument on the same origin.
3. Press **Chord**, **Past → future**, **Future A** or **Future B**. Change musical parameters while keeping the authored HMX score.
4. Export `.hgl` for the complete typed graph, or `.mid` from the instrument. MIDI carries its HMX-1 score, and when launched from the grammar editor also embeds the original HGL-1 inscription in text metadata.

The musical projection supports up to **two named alternative worlds** for individual audition; the underlying symbolic grammar can represent more. The musical interpretation is *not bijective*. MIDI audio events cannot independently reconstruct exact beliefs, labels or the full source graph; HGL text metadata is separate from the audio encoding. Metadata is a source snapshot and does not automatically incorporate subsequent score edits.

## Scope and formal claims

HGL-1 is a complete initial **implemented symbolic grammar**, not a universal semantics for conscious experience. The 15 typed relations, 5 object sorts, 4 structural operations, perspectives, world scoping, canonical serializer, and gluing analysis are implemented and exercised by tests. Lean proof files are included as **unverified candidates** and cover only the foundational set/partial assignment layer. No proof of semantic completeness, exact holographic recovery from any proper subset, brain dynamics, future prediction, or neural embedding equivalence is claimed.

## Deployment

Publish this directory as static files. GitHub Pages with **Source: GitHub Actions** can deploy using `.github/workflows/pages.yml`. See `PUBLISH.md` for creating the public repository and enabling Pages.

## Licensing

This is a public-source research prototype. No open-source license is granted yet; redistribution and reuse terms require an explicit licensing decision by the project owner. A public GitHub repository does not, by itself, grant permission to reuse code.
