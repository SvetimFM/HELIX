/-!
HĒLIX 0.1 — an axioms-free symbolic core for a projected experience grammar.

Run (Lean 4): lean Helix.lean
Intended status: proof candidate; the current build environment did not have
Lean installed, so compiler checking must be performed on a Lean-equipped system.

This file does NOT verify neural embeddings, future prediction, or the
psychological adequacy of any representation.
-/
import Lean

namespace Helix

universe u v w

/-- A scene is the characteristic predicate of a set of typed facts. -/
abbrev Scene (α : Type u) := α → Prop

/-- An empty experience. -/
def empty {α : Type u} : Scene α := fun _ => False

/-- A fact as a one-element experience. -/
def point {α : Type u} (a : α) : Scene α := fun x => x = a

/-- Overlay (semantically, set union) of experiences. -/
def overlay {α : Type u} (a b : Scene α) : Scene α :=
  fun x => a x ∨ b x

/-- A lens selects the facts visible from one perspective. -/
def focus {α : Type u} (mask scene : Scene α) : Scene α :=
  fun x => mask x ∧ scene x

/-- Existentially push a specific experience into a coarser vocabulary. -/
def abstractUp {α : Type u} {β : Type v}
    (f : α → β) (scene : Scene α) : Scene β :=
  fun y => ∃ x, scene x ∧ f x = y

/-- Pull back abstract information: a family of compatible specifics. -/
def refineDown {α : Type u} {β : Type v}
    (f : α → β) (scene : Scene β) : Scene α :=
  fun x => scene (f x)

/-- Reconstruct by aggregating all available masked perspectives. -/
def reconstruct {α : Type u} {ι : Type w}
    (masks : ι → Scene α) (scene : Scene α) : Scene α :=
  fun x => ∃ i, focus (masks i) scene x

/-- Order of composing experiences does not affect their meaning. -/
theorem overlay_comm {α : Type u} (a b : Scene α) :
    overlay a b = overlay b a := by
  funext x
  apply propext
  exact or_comm

/-- Parenthesization of experience composition does not affect meaning. -/
theorem overlay_assoc {α : Type u} (a b c : Scene α) :
    overlay (overlay a b) c = overlay a (overlay b c) := by
  funext x
  apply propext
  exact or_assoc

/-- Repeating a fact or subexperience cannot change its meaning. -/
theorem overlay_idem {α : Type u} (a : Scene α) :
    overlay a a = a := by
  funext x
  apply propext
  constructor
  · intro h
    cases h with
    | inl ha => exact ha
    | inr ha => exact ha
  · intro ha
    exact Or.inl ha

/-- Focusing the same perspective twice is the same as focusing once. -/
theorem focus_idem {α : Type u} (mask a : Scene α) :
    focus mask (focus mask a) = focus mask a := by
  funext x
  apply propext
  constructor
  · intro h
    exact ⟨h.1, h.2.2⟩
  · intro h
    exact ⟨h.1, h.1, h.2⟩

/-- Focusing an overlay is the overlay of its focused components. -/
theorem focus_overlay {α : Type u} (m a b : Scene α) :
    focus m (overlay a b) = overlay (focus m a) (focus m b) := by
  funext x
  apply propext
  constructor
  · intro h
    cases h with
    | intro hm hab =>
      cases hab with
      | inl ha => exact Or.inl ⟨hm, ha⟩
      | inr hb => exact Or.inr ⟨hm, hb⟩
  · intro h
    cases h with
    | inl ha => exact ⟨ha.1, Or.inl ha.2⟩
    | inr hb => exact ⟨hb.1, Or.inr hb.2⟩

/-- The lens preserves the truth of any individual fact which it contains. -/
theorem focus_local_truth {α : Type u} (mask a : Scene α)
    (x : α) (visible : mask x) : focus mask a x ↔ a x := by
  constructor
  · intro h
    exact h.2
  · intro h
    exact ⟨visible, h⟩

/-- Any global invariant present in both scene and lens survives that view. -/
theorem shared_core {α : Type u} (core a mask : Scene α)
    (inScene : ∀ x, core x → a x)
    (inMask : ∀ x, core x → mask x) :
    ∀ x, core x → focus mask a x := by
  intro x hx
  exact ⟨inMask x hx, inScene x hx⟩

/-- Exact reconstruction is possible if every true fact is covered by a lens. -/
theorem reconstruct_if_covered {α : Type u} {ι : Type w}
    (masks : ι → Scene α) (a : Scene α)
    (coverage : ∀ x, a x → ∃ i, masks i x) :
    reconstruct masks a = a := by
  funext x
  apply propext
  constructor
  · intro h
    cases h with
    | intro i hi => exact hi.2
  · intro ha
    have h := coverage x ha
    cases h with
    | intro i hi => exact ⟨i, hi, ha⟩

/-- Coarsening a composition equals composing the coarsened experiences. -/
theorem abstract_overlay {α : Type u} {β : Type v}
    (f : α → β) (a b : Scene α) :
    abstractUp f (overlay a b) =
      overlay (abstractUp f a) (abstractUp f b) := by
  funext y
  apply propext
  constructor
  · intro h
    cases h with
    | intro x hp =>
      cases hp with
      | intro hab hxy =>
        cases hab with
        | inl ha => exact Or.inl ⟨x, ha, hxy⟩
        | inr hb => exact Or.inr ⟨x, hb, hxy⟩
  · intro h
    cases h with
    | inl ha =>
      cases ha with
      | intro x hp =>
        exact ⟨x, Or.inl hp.1, hp.2⟩
    | inr hb =>
      cases hb with
      | intro x hp =>
        exact ⟨x, Or.inr hp.1, hp.2⟩

/-- Abstraction preserves every original fact as a compatible refinement. -/
theorem abstract_refine_sound {α : Type u} {β : Type v}
    (f : α → β) (a : Scene α) (x : α) (hx : a x) :
    refineDown f (abstractUp f a) x := by
  exact ⟨x, hx, rfl⟩

/-- Generalizing twice is the same as generalizing by the composite map. -/
theorem abstract_compose {α : Type u} {β : Type v} {γ : Type w}
    (f : α → β) (g : β → γ) (a : Scene α) :
    abstractUp g (abstractUp f a) = abstractUp (g ∘ f) a := by
  funext z
  apply propext
  constructor
  · intro h
    cases h with
    | intro y hy =>
      cases hy with
      | intro hfy hyz =>
        cases hfy with
        | intro x hx =>
          exact ⟨x, hx.1, (congrArg g hx.2).trans hyz⟩
  · intro h
    cases h with
    | intro x hx =>
      exact ⟨f x, ⟨x, hx.1, rfl⟩, hx.2⟩

/-- Nothing not visible through a mask can survive projection. -/
theorem invisible_atom {α : Type u} (m : Scene α) (x : α)
    (notVisible : ¬ m x) : focus m (point x) = focus m empty := by
  funext y
  apply propext
  constructor
  · intro h
    have heq : y = x := h.2
    subst y
    exact False.elim (notVisible h.1)
  · intro h
    exact False.elim h.2

/-- A real atom is distinguishable from an empty scene. -/
theorem point_ne_empty {α : Type u} (x : α) : point x ≠ empty := by
  intro h
  have hx : point x x := rfl
  rw [h] at hx
  exact hx

/-- Strong recovery from an arbitrary proper projection is impossible. -/
theorem focus_noninjective {α : Type u} (m : Scene α) (x : α)
    (notVisible : ¬ m x) :
    ∃ a b : Scene α, a ≠ b ∧ focus m a = focus m b := by
  exact ⟨point x, empty, point_ne_empty x,
    invisible_atom m x notVisible⟩

/-! ## A minimal typed semantic alphabet: 5 node sorts, 8 edge sorts. -/
inductive Kind where
  | entity | event | quality | observer | world
  deriving Repr, DecidableEq

inductive Role where
  | agent | patient | witness | experiencer
  deriving Repr, DecidableEq

structure Ref (k : Kind) where
  id : Nat
  deriving Repr, DecidableEq

inductive Fact where
  | role : Ref .event → Role → Ref .entity → Fact
  | precedes : Ref .event → Ref .event → Fact
  | causes : Ref .event → Ref .event → Fact
  | qualifies : Ref .event → Ref .quality → Fact
  | witnessed : Ref .observer → Ref .event → Fact
  | remembered : Ref .observer → Ref .event → Fact
  | anticipated : Ref .observer → Ref .event → Fact
  | inWorld : Ref .event → Ref .world → Fact
  deriving Repr, DecidableEq

/-! ## Abstract syntax and compositional semantics. -/
inductive Expr (α : Type u) where
  | unit : Expr α
  | literal : α → Expr α
  | combine : Expr α → Expr α → Expr α
  | perspective : Scene α → Expr α → Expr α

def meaning {α : Type u} : Expr α → Scene α
  | .unit => empty
  | .literal x => point x
  | .combine a b => overlay (meaning a) (meaning b)
  | .perspective m a => focus m (meaning a)

/-- The expression grammar is compositional by construction. -/
theorem meaning_combine {α : Type u} (a b : Expr α) :
    meaning (.combine a b) = overlay (meaning a) (meaning b) := rfl

/-! ## Concrete symbolic example: anticipating a future loss. -/
def person : Ref .entity := ⟨1⟩
def encounter : Ref .event := ⟨1⟩
def departure : Ref .event := ⟨2⟩
def subject : Ref .observer := ⟨1⟩

def exampleExpr : Expr Fact :=
  .combine (.literal (.role encounter .agent person))
    (.combine (.literal (.precedes encounter departure))
      (.literal (.anticipated subject departure)))

def temporalLens : Scene Fact := fun f =>
  match f with
  | .precedes _ _ => True
  | _ => False

/-- Temporal order is encoded explicitly, not by textual placement. -/
example : meaning exampleExpr (.precedes encounter departure) := by
  simp [exampleExpr, meaning, overlay, point]

/-- A temporal projection retains precedence information. -/
example : focus temporalLens (meaning exampleExpr)
    (.precedes encounter departure) := by
  simp [focus, temporalLens, exampleExpr, meaning, overlay, point]

end Helix
