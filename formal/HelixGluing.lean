/-!
HĒLIX 0.2: compatible partial experiential descriptions and global gluing.

Intended compiler: Lean 4 (core import Lean). To check: lean HelixGluing.lean
Verification status: a proof candidate; no Lean binary was available in the
execution environment. Do not represent this file as kernel-verified.

The results concern finite/infinite typed symbolic partial observations and
classical choice, not semantic adequacy, neural accuracy, or temporal prophecy.
-/
import Lean

namespace Helix

universe u v w

/-- An observer may know a particular variable, or leave it unspecified. -/
abbrev Section (ι : Type u) (β : Type v) := ι → Option β

/-- Two local descriptions agree wherever both commit to a value. -/
def Agrees {ι : Type u} {β : Type v}
    (a b : Section ι β) : Prop :=
  ∀ (i : ι) (x y : β), a i = some x → b i = some y → x = y

/-- A compatible family agrees pairwise on shared coordinates. -/
def FamilyAgrees {κ : Type w} {ι : Type u} {β : Type v}
    (family : κ → Section ι β) : Prop :=
  ∀ j k, Agrees (family j) (family k)

/-- Every variable occurs in at least one local description. -/
def Covers {κ : Type w} {ι : Type u} {β : Type v}
    (family : κ → Section ι β) : Prop :=
  ∀ i, ∃ j, ∃ x, family j i = some x

/-- A total world is consistent with every explicit local assignment. -/
def Extends {κ : Type w} {ι : Type u} {β : Type v}
    (family : κ → Section ι β) (world : ι → β) : Prop :=
  ∀ j i x, family j i = some x → world i = x

/-- Construct the global world by selecting one witnessed value per variable. -/
noncomputable def glue {κ : Type w} {ι : Type u} {β : Type v}
    (family : κ → Section ι β) (coverage : Covers family) (i : ι) : β :=
  Classical.choose (Classical.choose_spec (coverage i))

/-- If the local sections agree on overlaps, their selected union extends each. -/
theorem glue_extends {κ : Type w} {ι : Type u} {β : Type v}
    (family : κ → Section ι β)
    (agreement : FamilyAgrees family) (coverage : Covers family) :
    Extends family (glue family coverage) := by
  intro j i y hj
  let k : κ := Classical.choose (coverage i)
  let x : β := Classical.choose (Classical.choose_spec (coverage i))
  have hx : family k i = some x :=
    Classical.choose_spec (Classical.choose_spec (coverage i))
  have eqv : x = y := agreement k j i x y hx hj
  exact eqv

/-- If every variable has a witnessed value, no two total worlds can extend
    all the same local sections with different values. -/
theorem extension_unique {κ : Type w} {ι : Type u} {β : Type v}
    (family : κ → Section ι β) (coverage : Covers family)
    (a b : ι → β) (ha : Extends family a) (hb : Extends family b) :
    a = b := by
  funext i
  obtain ⟨j, x, hx⟩ := coverage i
  exact (ha j i x hx).trans (hb j i x hx).symm

/-- Existence and uniqueness of a global world under agreement and coverage. -/
theorem compatible_cover_unique_gluing
    {κ : Type w} {ι : Type u} {β : Type v}
    (family : κ → Section ι β)
    (agreement : FamilyAgrees family) (coverage : Covers family) :
    ∃! world : ι → β, Extends family world := by
  refine ⟨glue family coverage, glue_extends family agreement coverage, ?_⟩
  intro other hOther
  exact extension_unique family coverage other (glue family coverage)
    hOther (glue_extends family agreement coverage)

/-- A genuine global world forces all its local descriptions to agree. -/
theorem global_world_implies_agreement
    {κ : Type w} {ι : Type u} {β : Type v}
    (family : κ → Section ι β)
    (world : ι → β) (h : Extends family world) :
    FamilyAgrees family := by
  intro j k i x y hx hy
  exact (h j i x hx).symm.trans (h k i y hy)

/-- Each Boolean value has a counterpart satisfying inequality; thus a
    single pairwise inequality is locally satisfiable at every endpoint. -/
theorem inequality_has_full_marginals (x : Bool) :
    (∃ y : Bool, x ≠ y) ∧ (∃ y : Bool, y ≠ x) := by
  cases x with
  | false =>
    exact ⟨⟨true, by decide⟩, ⟨true, by decide⟩⟩
  | true =>
    exact ⟨⟨false, by decide⟩, ⟨false, by decide⟩⟩

/-- Odd-cycle relational obstruction: three separately satisfiable
    inequalities do not possess a single compatible global assignment.
    This does not contradict unique gluing of *chosen partial functions*:
    a set of allowed local outcomes is not one chosen local outcome. -/
theorem odd_triangle_no_global_assignment :
    ¬ ∃ x y z : Bool, x ≠ y ∧ y ≠ z ∧ x ≠ z := by
  rintro ⟨x, y, z, hxy, hyz, hxz⟩
  cases x <;> cases y <;> cases z <;> simp_all

end Helix
