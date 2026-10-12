# HĒLIX v0.2 — Local-to-global reconstruction: experiment report

**Date:** 2026-10-11  
**Status:** Python experiments executed; Lean source supplied but NOT compiler-verified.  
**Scope:** Symbolic partial observations, relational global obstructions, noisy reconstruction, and correct/incorrect structural priors.

## Executive finding

The mathematically crucial distinction is **pointwise data vs relational possibility sets**. Compatible *point-valued partial assignments* admit exactly one global extension if their scopes cover all variables. By contrast, relations can have pairwise consistent overlapping projections without any globally valid assignment. Overlap redundancy helps recover uncertain information, and global constraints can dramatically improve reconstruction — but constraints that do not apply to the actual world systematically produce false coherence.

### A. Exact gluing of partial observations

Universe: three Boolean variables. Every local section assigns concrete values on its scope. Exact enumeration:

| Cover | Local-section tuples | Compatible tuples | Global extensions per compatible tuple |
|---|---:|---:|---:|
| scopes (0,1), (1,2), (0,2) | 64 | 8 | exactly 1 |
| scopes (0,1), (1,2) | 16 | 8 | exactly 1 |
| scopes (0,1), (0) | 8 | 4 | exactly 2 |

The precise theorem: for a family `family : κ → (ι → Option β)`, if (a) defined values agree for every variable on every intersection, and (b) every variable is defined by at least one local section, then there exists a unique global total assignment extending them. This is a gluing principle for the full presheaf of value assignments, not a theorem about human experience.

### B. Relational contextuality — no global solution despite local agreement

Each edge (0,1), (1,2), (0,2) of three Boolean variables receives one of its 15 nonempty binary relations. There are 15³=3,375 relation families. Project each relation to its shared *unary* variable and demand equality of those unary possibility sets.

- 405 / 3375 satisfy this overlapping-projection agreement.
- Of those 405, **4** admit *no* global assignment.
- 32 admit exactly 1 global assignment; other solvable models admit 2–8.
- 165 have **lossless natural-join reconstruction** (joining all three relations and re-projecting reproduces each exact local relation).
- 240 of the locally agreeing families have lossy or impossible joins; 4 of these have no global model at all.

Counterexample: each edge requires inequality in the Boolean domain, so each local edge has solutions, and every shared variable supports values 0 and 1 in each neighboring relation. But a three-cycle cannot be 2-colored: global solution count = 0.

**Important typing distinction:** These are sets of *possible local assignments*, not particular *chosen* assignments. A jointly compatible family of chosen partial functions does glue. A family of locally compatible sets of possibilities does not necessarily admit a jointly compatible choice. This matches the mathematical motivation of sheaf-theoretic contextuality but is not an experimental claim about quantum mechanics.

### C. Reconstruction with incomplete noisy perspectives

For each independent trial: a ground truth of 24 ternary variables; each view randomly observes 8 distinct coordinates; flip an observed symbol to one of the other two uniformly with probability p. The decoder takes a per-coordinate plurality vote, abstains on ties and on unseen coordinates. 2000 trials per condition, seeded 20261011. A perfect scene requires no abstentions and every decoded coordinate correct.

| Views | Perfect scene (0% noise) | Perfect scene (10% noise) | Perfect scene (25% noise) |
|---:|---:|---:|---:|
| 2 | 0% | 0% | 0% |
| 3 | 0% | 0% | 0% |
| 4 | approximately 0% | 0% | 0% |
| 6 | 7.35% | 0.50% | 0% |
| 8 | 35.95% | 3.25% | 0.05% |
| 12 | **83.25%** | **25.90%** | **0.90%** |

2000-trial Wilson 95% confidence intervals for 12-view perfect reconstruction are [81.55%, 84.82%], [24.03%, 27.86%], and [0.57%, 1.42%] respectively. At 12 views, resolved-variable accuracy is 100%, 99.00%, and 93.64% respectively, but some variables still have unresolved ties or no observations, hence scene-level accuracy is lower. Errors are generated independently; realistic correlated misinterpretations may be substantially harder.

The resulting curves appear in `reconstruction.png`.

### D. Global constraints: remarkable recovery and pathological hallucination

Seven-bit Hamming(7,4) code (16 legal global words out of 128) serves as a **toy grammar** with known global rules. Each independent view observes 3 randomly selected coordinates with 12% independent bit errors. A constrained maximum-likelihood decoder selects the legal codeword maximizing observation agreement (abstains on ties). Compare it with unconstrained per-coordinate plurality voting.

For 2000 trials per condition:

| Views | True global state obeys grammar: unconstrained | Obeys grammar: constrained | Actual state VIOLATES grammar: unconstrained | Violates grammar: constrained |
|---:|---:|---:|---:|---:|
| 4 | 12.30% | **78.35%** | 13.30% | **0%** |
| 8 | 49.90% | **97.25%** | 47.70% | **0%** |
| 12 | 75.75% | **99.70%** | 75.50% | **0%** |

An invalid true state is created by flipping one bit of an otherwise valid codeword. Since this state is not a candidate in the hard-constrained grammar, **exact reconstruction by that decoder is logically impossible**, regardless of how much evidence is provided. This is an intentional model-misspecification stress test, not an independently surprising empirical failure.

Diagnostic: a grammar-compliant 12-view trajectory has mean minimum residual (fraction of noisy observations that disagree with its best legal codeword) **11.91%**, versus **21.32%** for a violated-grammar trajectory. A simple classifier using only that residual produces area under the ROC curve (AUROC) **0.8954** for distinguishing invalid from valid scenes at 12 views (0.5704 at 2 views). Thus, the system can learn to **suspect** that its constraints are wrong, although a residual is not proof of which constraint is invalid.

`global_constraints.png` plots both in-distribution gains and out-of-distribution collapse.

### E. Implication for the grammar

Add the following semantics to the HĒLIX alphabet:

- `⊓` — compatibility/gluing of *specific* local descriptions, with an explicit failure result if they disagree.
- `𝒞` — admissible global-world constraint, with provenance and strength (hard axiom, well-supported law, hypothesis, observer assumption).
- `⊘` — obstruction / unsatisfiable constraint family, ideally annotated with a minimal inconsistent subset.
- `?` — unresolved / unknown, distinct from false.
- `⋈` — relational natural join: combine sets of admissible possibilities, not individual facts.
- `≈ε` — noisy correspondence with explicit error assumptions.
- `⌖` — restriction to a perspective, already present in HĒLIX v0.1.

The next target for formal proof is an abstraction/perspective-aware condition for **lossless relational join**, and for a recovery algorithm returning one of `Unique`, `Ambiguous(n)`, or `Inconsistent`, with counterexample witnesses and provenance. Computationally, probabilistic factor graphs, constraint solving, and iterative denoising can be compared on the *same* synthetic worlds. Real semantics must add entity resolution, causal assumptions, and belief/perspective distinctions.

### F. Proof status and reproducibility

The `HelixGluing.lean` source proposes theorems of unique gluing under coverage, necessity of agreement for any global extension, full local support of binary inequality, and nonexistence of a Boolean odd-cycle global assignment. It uses Lean core and no `sorry`. **No Lean binary is installed and network resolution prevented installation, so these scripts could not be kernel-checked.** The Python exhaustive enumeration and all 2000-trial Monte Carlo experiments **were executed** and their full structured results appear in `results.json`.

Lean scripts and Python validations are not interchangeable. Even future successful Lean compilation would prove only the explicitly modeled symbolic propositions, not the adequacy of a learned experiential ontology.

## The central insight

**Global coherence is a powerful inference prior, not evidence of global truth.** A language that always constructs coherent wholes can be more persuasive and less accurate precisely when its ontology is incomplete. HĒLIX needs not just grammatical composition, but principled refusal to compose incompatible information — and a representation of the uncertainty that remains.

### Literature

- Samson Abramsky & Adam Brandenburger, *The Sheaf-Theoretic Structure of Non-Locality and Contextuality* (2011). https://arxiv.org/abs/1102.0264
- Samson Abramsky, Shane Mansfield & Rui Soares Barbosa, *The Cohomology of Non-Locality and Contextuality* (2011). https://arxiv.org/abs/1111.3620
- Lean installation: https://lean-lang.org/install/manual/
