# HĒLIX HGL-1: a typed experiential grammar

**Status:** executable research language, not a demonstrated universal encoding of qualia or physical future knowledge. Implemented in `src/grammar.mjs`. The Greek/math glyphs are presentation; serialized records have JSON payloads to avoid ambiguous parsing.

## Interpretive axiom

The universe of admissible futures is **open**. A chord is a situated set of authored claims, relations, uncertainties and possible worlds. Neither a present projection nor the full authored graph is entitled to pick a privileged, true future. `POSSIBLE(o,w)` is not a prediction; its absence is not a refutation of possibility.

## Objects and types

`symbol: {id, sort, label, time?, valence?, salience?, branch?}`.

| Glyph | Sort | Semantics |
|---|---|---|
| `●` | `entity` | participant, object, place |
| `◆` | `event` | occurrence/experience, not required to be realized |
| `◐` | `quality` | attributed feature |
| `◉` | `observer` | situated perspective |
| `◇` | `world` | a named hypothetical or counterfactual scope |

Only events may carry `time`, `valence`, `salience`, and `branch` (coordinates authored by the user; not universal measurements). Temporal numbers are coordinates, not strict causal sequencing. Event identity is independent of its position in the serialized text.

## Typed relations

Each relation has `id`, `op`, `args`, optional `attrs`, optional `world`, optional `observer`. The arity and operand types are enforced at runtime.

| Operator | Orthography | Signature | Meaning |
|---|---|---|---|
| `ROLE` | `↦` | event × entity, role text | participant binding |
| `BEFORE` | `≺` | event × event | precedence assertion |
| `CAUSES` | `⇒` | event × event | asserted causal link, not inferred from temporal order |
| `SIMILAR` | `≈` | symbol × symbol, degree ∈ [0,1] | authored semantic resemblance |
| `PERCEIVES` | `∠` | observer × event | perception report |
| `REMEMBERS` | `◉` | observer × event | recollection; may be fallible |
| `ANTICIPATES` | `⌁` | observer × event | anticipation without realized future |
| `IN_WORLD` | `◇` | event × world | scoped membership |
| `QUALITY` | `◐` | event × quality | attribution |
| `AFFECT` | `♥` | observer × event, valence ∈ [-1,1], arousal ∈ [0,1] | self/authored qualitative dimensions |
| `ASSOCIATES` | `∼` | event × event | situated association |
| `BELIEVES` | `∠` | observer × fact | report about a proposition |
| `UNCERTAIN` | `?` | observer × fact, confidence ∈ [0,1] | epistemic confidence, not objective probability |
| `CONTRASTS` | `⇎` | fact × fact | comparison of claims |
| `POSSIBLE` | `⊞` | observer × world | considered possible world |

The `world` and `observer` fields on a fact explicitly scope *the claim*; that is distinct from declaring its operands to be actually present in that world. Fact-valued operands use existing fact IDs, and projections eliminate quoted statements whose referents have fallen out of scope.

## Composition operators

- `⊕ overlay(A,B)` — set-union of compatible objects and facts. Equal IDs must have equal definitions; collisions are errors, not silent truth reconciliation. On equal metadata, overlay is associative, commutative, and idempotent; differing titles coalesce to an empty title, not a privileged narrator.
- `⌖ project(S,view)` — filter to a declared perspective, selected kinds, optional fact IDs, and listed world scopes. Unscoped claims remain accessible unless restricted by other lens predicates. Referencing claims without visible referents are dropped to keep the graph self-contained.
- `↑ abstractUp(S)` — rewrite operands through explicitly declared same-sort refinement mappings. It is an authored re-description, not a guaranteed semantic entailment. Cycles are rejected.
- `↓ refinements(S,symbol)` — return the possible named specifics reachable through the inverse abstraction relation; it does not choose one.
- `⊞ POSSIBLE(observer,world)` — stores a possible world without privileging it as actuality.
- `? UNCERTAIN(observer,fact,confidence)` — stores stated confidence without calibrated probability guarantees.
- `glue(sections,universe)` — combine explicit partial assignments and report `unique`, `ambiguous`, or `inconsistent`. This is different from gluing arbitrary relational constraints: the latter may be locally satisfiable and globally inconsistent.
- `reconstruct(scene,views)` — aggregates authored statements visible in selected lenses; returns `unseen`, never invents absent statements.

### Encoding

The grammar uses a canonically sorted, line-based syntax with a scope and explicit typed JSON records:

```text
⟦ HGL1
TITLE "A possible shared future"
NOW 0
● {"id":"we","sort":"observer","label":"Those who build"}
● {"id":"now","sort":"event","label":"Choosing to build","time":0}
● {"id":"branchA","sort":"world","label":"A possible outcome"}
◆ {"id":"claim1","op":"POSSIBLE","args":["we","branchA"],"attrs":{}}
⌖ {"id":"ourview","observer":"we","worlds":[],"include":[],"kinds":[]}
⟧
```

In the current implementation, symbols and relations may appear in any textual order, subject to globally resolved IDs. Codec round trips preserve every accepted field after canonical normalization (but strip irrelevant whitespace and reorder collections). The HGL parser limits input size and rejects unknown keys and ill-typed operations.

### World and time are not identical

`BEFORE(A,B)` is independent of where A and B appear in text. `ANTICIPATES(O,B)` does not entail B. Separate world-scoped `BEFORE` relations may disagree because they describe different possibilities. Even unscoped contradictory authored claims are representable; a user may then annotate `CONTRASTS(f1,f2)` rather than automatically selecting a winner. Syntactic well-typedness does **not** imply metaphysical consistency or physical realizability.

## From HGL to audible chord

`toInstrumentScene` maps **event symbols** to notes and maps a subset of relations to musical intervals. Two named future worlds map to branches A/B; a third named world makes the current musical adapter reject projection with a clear error rather than mislabeling it. Only event nodes and a subset of edges/stance/affect dimensions are currently sonified. **HGL→HMX is lossy**; the original HGL text is separately embedded in exported MIDI as source metadata to preserve a recoverable symbolic provenance. Editing the performance does not update that source automatically.

## Correctness / incompleteness

JavaScript tests cover typing, canonical serialization, local-to-global outcomes, soundness of filtering, ACI overlay on shared ontology, and representative finite-model counterexamples. The included Lean sources prove properties of simpler set and partial-assignment models *as proof candidates*, not the implementation of every HGL-1 operator. The Lean kernel has not been run here. Neural embedding decomposition, subjective experience equivalence, and audio-only semantic recovery are open empirical problems.
