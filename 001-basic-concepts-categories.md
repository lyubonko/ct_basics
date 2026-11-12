---
session: 1
title: "1.1 Categories"
author: "Paolo Perrone"
source: "Notes on Category Theory with examples from basic mathematics, Chapter 1, §1.1 (pp. 8–23)"
pdf: "content/notes_ct_1_1.pdf"
tags:
  - Definition 1.1.1
  - Preorders & Equivalence Relations
  - Delooping BG & Monoids
  - Non-Examples (Convex Maps)
  - Small vs. Locally Small
  - Isomorphisms & Groupoids
  - Diagram Pasting
  - Opposite Category C^op
---

# 1.1 Categories

> **Reading Basis:** *Paolo Perrone*, *Notes on Category Theory with examples from basic mathematics*, Chapter 1: Basic concepts, **Section 1.1 Categories** (pp. 8–23).

---

## 1. Rigorous Definition of a Category (Definition 1.1.1)

**Definition 1.1.1.** A **category** $\mathsf{C}$ consists of:

- A collection $\mathsf{C}_0$, whose elements are called the **objects** of $\mathsf{C}$ and are usually denoted by uppercase letters $X, Y, Z, \dots$
- A collection $\mathsf{C}_1$, whose elements are called the **morphisms** or **arrows** of $\mathsf{C}$ and are usually denoted by lowercase letters $f, g, h, \dots$

such that:

- **Source and Target (Domain and Codomain):** Each morphism $f$ has assigned two objects, called *source* and *target* (or *domain* and *codomain*), denoted by $s(f)$ and $t(f)$, respectively. If $s(f) = X$ and $t(f) = Y$, we write
  $$f : X \to Y \qquad \text{or more graphically} \qquad X \xrightarrow{\;f\;} Y.$$
- **Identity Morphism:** Each object $X$ has a distinguished morphism
  $$\mathrm{id}_X : X \to X,$$
  called the *identity morphism* of $X$ (with $s(\mathrm{id}_X) = t(\mathrm{id}_X) = X$).
- **Composition:** For each pair of morphisms $f, g$ such that $t(f) = s(g)$, there exists a specified morphism $g \circ f$, called the *composite morphism*, such that $s(g \circ f) = s(f)$ and $t(g \circ f) = t(g)$. More graphically:
  $$f : X \to Y, \quad g : Y \to Z \qquad \leadsto \qquad g \circ f : X \to Z.$$

These structures must satisfy two axioms:

1. **Unitality:** For every morphism $f : X \to Y$, the compositions $f \circ \mathrm{id}_X$ and $\mathrm{id}_Y \circ f$ are both equal to $f$:
   $$f \circ \mathrm{id}_X = f = \mathrm{id}_Y \circ f.$$
2. **Associativity:** For $f : X \to Y$, $g : Y \to Z$, and $h : Z \to W$, the compositions $h \circ (g \circ f)$ and $(h \circ g) \circ f$ are equal:
   $$h \circ (g \circ f) = (h \circ g) \circ f.$$

### Caveat: Reading Order of Composition ("$g$ after $f$")

The composite $g \circ f$ means **first applying $f$, then $g$**. This choice of order—which writes $g$ to the left of $f$ even though the diagram flows left-to-right $X \xrightarrow{f} Y \xrightarrow{g} Z$—comes from traditional functional notation such as $\sin(\cos(x))$, where one first takes the cosine and then the sine.

> **Tip:** To avoid confusion when reading formulas alongside diagrams, always read $g \circ f$ aloud as **"$g$ after $f$"**.

### Step-by-Step Depiction of Associativity

Given three composable morphisms $X \xrightarrow{f} Y \xrightarrow{g} Z \xrightarrow{h} W$, there are *a priori* two ways to form the triple composite:

- **Method 1 (Upper/First Pair):** First compose $f$ and $g$ to obtain $g \circ f : X \to Z$, and then compose with $h$ to obtain $h \circ (g \circ f) : X \to W$.
- **Method 2 (Lower/Second Pair):** First compose $g$ and $h$ to obtain $h \circ g : Y \to W$, and then compose $f$ with $h \circ g$ to obtain $(h \circ g) \circ f : X \to W$.

The associativity axiom states that both methods yield the exact same morphism, allowing us to write $h \circ g \circ f$ unambiguously without brackets:

```diagram
id: perrone-associativity
title: Two Ways to Compose Three Morphisms (Associativity)
type: square
equation: "h ∘ (g ∘ f) = (h ∘ g) ∘ f"
nodes:
  X: { label: "X", x: 90, y: 150 }
  Y: { label: "Y", x: 270, y: 150 }
  Z: { label: "Z", x: 450, y: 150 }
  W: { label: "W", x: 630, y: 150 }
edges:
  - { from: "X", to: "Y", label: "f" }
  - { from: "Y", to: "Z", label: "g" }
  - { from: "Z", to: "W", label: "h" }
  - { from: "X", to: "Z", label: "g ∘ f", curve: -65, dashed: true, path: "upper" }
  - { from: "X", to: "W", label: "h ∘ (g ∘ f)", curve: -115, path: "upper" }
  - { from: "Y", to: "W", label: "h ∘ g", curve: 65, dashed: true, path: "lower" }
  - { from: "X", to: "W", label: "(h ∘ g) ∘ f", curve: 115, path: "lower" }
```

---

## 2. First Perspective: Categories as Relations (§1.1.1)

> **Idea 1.1.1.** *A category is a collection of objects which are related to each other in a consistent way.*

In all examples of this type, **given two objects $x, y \in X$, there is at most one morphism $x \to y$ between them**:

| Relation Type on $X$ | Defining Axioms | Categorical Interpretation ($x \to y \iff x R y$) |
| :--- | :--- | :--- |
| **Preorder** $(X, \lesssim)$ *(Example 1.1.4)* | **(a) Reflexivity:** $x \lesssim x$<br>**(b) Transitivity:** $x \lesssim y \land y \lesssim z \implies x \lesssim z$ | **Most general relation forming a category.**<br>• Reflexivity $\leadsto$ identity $\mathrm{id}_x : x \to x$<br>• Transitivity $\leadsto$ composition $(y \to z) \circ (x \to y) = (x \to z)$<br>• Unitality & associativity hold automatically by uniqueness of arrows! |
| **Partial Order / Poset** $(X, \le)$ *(Example 1.1.3)* | Preorder +<br>**(c) Antisymmetry:** $x \le y \land y \le x \implies x = y$ | Preorder category where no two distinct objects can have arrows in both directions (skeletal: isomorphic objects are equal). |
| **Equivalence Relation** $(X, \sim)$ *(Example 1.1.2)* | Preorder +<br>**(c) Symmetry:** $x \sim y \implies y \sim x$ | Preorder category where **every arrow is invertible** ("we can always go back" — a *groupoid*). Partitions $X$ into connected clusters (equivalence classes). |

### Concrete Examples from §1.1.1

- **Example 1.1.2 ("Has the same shape as"):** On a set of geometric shapes $\{\circ, \bigcirc, \bullet, \blacksquare, \square, \triangle\}$, drawing an arrow $x \to y$ whenever "$x$ has the same shape as $y$" (regardless of size or color) creates three connected components: a complete bidirectional triangle on the three circles $\{\circ, \bigcirc, \bullet\}$, a bidirectional pair on the two squares $\{\blacksquare, \square\}$, and an isolated loop on the triangle $\{\triangle\}$.
- **Example 1.1.4 (Price in Economics as a Preorder):** Let $x \lesssim y$ mean "$x$ is cheaper or equally priced to $y$."
  - Reflexivity: $x$ has lower or equal price to itself.
  - Transitivity: if $x$ is no more expensive than $y$, and $y$ is no more expensive than $z$, then $x$ is no more expensive than $z$.
  - **Why it is a Preorder and NOT a Partial Order:** If $x \lesssim y$ and $y \lesssim x$, $x$ and $y$ do *not* have to be the exact same object ($x = y$)—they simply have the **same price**! Categorically, they are *isomorphic* (you can trade $x$ for $y$ and vice versa without losing value).

---

## 3. Second Perspective: Categories as Operations (§1.1.2)

> **Idea 1.1.2.** *A category is a collection of operations which can be composed in a consistent way.*

What if we have a collection of operations (like symmetries or transformations of a system) where **any two operations can be composed** without needing to match different sources and targets? To view such a structure as a category, we make all morphisms share a **single formal object $\bullet$**.

### Groups and Their Delooping $\mathsf{B}G$ (Example 1.1.6 & Definition 1.1.7)

- **Group $G$ (Example 1.1.6):** A nonempty set $G$ with a unit $1 \in G$, multiplication $(g, h) \mapsto g \cdot h$, and inverses $g^{-1} \in G$ satisfying:
  - *Unitality:* $g \cdot 1 = 1 \cdot g = g$;
  - *Associativity:* $(g \cdot h) \cdot i = g \cdot (h \cdot i)$;
  - *Inverse law:* $g \cdot g^{-1} = g^{-1} \cdot g = 1$.
- **Delooping $\mathsf{B}G$ (Definition 1.1.7):** Let $G$ be a group. The **delooping** of $G$, denoted $\mathsf{B}G$, is the category with:
  - A **single object** $\bullet$;
  - A **morphism** $g : \bullet \to \bullet$ for each element $g \in G$;
  - The **identity** $\mathrm{id}_\bullet$ given by the neutral element $1 \in G$;
  - The **composition** $g \circ h$ of $g, h : \bullet \to \bullet$ given by group multiplication $g \cdot h \in G$.

```diagram
id: delooping-bg
title: Delooping BG (A Single Object • with Composable Loops)
type: square
equation: "g ∘ h := g · h   (in BG)"
nodes:
  bullet: { label: "•", x: 360, y: 155 }
  ghostTop: { label: "1 = id_•", x: 360, y: 45 }
  ghostLeft: { label: "g", x: 170, y: 155 }
  ghostRight: { label: "h", x: 550, y: 155 }
edges:
  - { from: "bullet", to: "ghostTop", label: "1", curve: -35, dashed: true }
  - { from: "ghostTop", to: "bullet", label: "id_•", curve: -35, dashed: true }
  - { from: "bullet", to: "ghostLeft", label: "g", curve: -45, path: "upper" }
  - { from: "ghostLeft", to: "bullet", label: "g⁻¹", curve: -45, path: "upper" }
  - { from: "bullet", to: "ghostRight", label: "h", curve: 45, path: "lower" }
  - { from: "ghostRight", to: "bullet", label: "g · h", curve: 45, path: "lower" }
```

- **Remarks 1.1.8 & 1.1.9:** $\mathsf{B}G$ encodes the exact same data as $G$. While formally $\bullet$ is an abstract point, when $G$ models symmetries of a concrete space (such as rotations of $\mathbb{R}^2$), we can concretely picture $\bullet$ as $\mathbb{R}^2$ and the loops as linear rotations $\mathbb{R}^2 \to \mathbb{R}^2$.

### Monoids and $\mathsf{B}M$: Dropping Inverses (Example 1.1.10)

Notice that constructing $\mathsf{B}G$ never used inverses $g^{-1}$! Dropping the inverse axiom gives a **monoid** $(M, \cdot, 1)$: a set with an associative binary operation and a two-sided unit $1 \in M$. Its delooping $\mathsf{B}M$ is again a one-object category.

Whereas a group models reversible *symmetries*, a monoid models **transformations that are not necessarily invertible**:
- All linear maps $V \to V$ on a vector space $V$ (including the zero map $(x, y) \mapsto (0, 0)$ on $\mathbb{R}^2$).
- All continuous maps $X \to X$ on a topological space $X$.
- All functions $X \to X$ on a set $X$.
- **Probability Theory (Markov Semigroups):** Given a measurable space $X$ and a Markov transition kernel $k : X \to X$, the powers
  $$\{\mathrm{id}_X, k, k^2, k^3, \dots\}$$
  form a monoid (often called the *Markov semigroup* generated by $k$), and all Markov kernels $X \to X$ form the *full Markov semigroup* on $X$ (Remark 1.1.11 notes that category theory always includes the identity $\mathrm{id}_X$, "doing nothing").

---

## 4. Third Perspective: Spaces and Maps with Extra Structure (§1.1.3)

> **Idea 1.1.3.** *A category is a collection of sets or spaces equipped with extra structure, and maps between them which are compatible with that structure.*

- In **§1.1.1 (Relations)**, we never had to check equality of parallel composites because there was *at most one arrow* between any two objects.
- In **§1.1.2 (Operations)**, we never had to check whether sources and targets matched because there was *only one object*.
- In **§1.1.3 (General Categories of Structured Spaces)**, we have *many objects* and *many morphisms* between them, so we must always check **both** domain/codomain matching and composition closure/axioms!

### Standard Categories of Structured Spaces (Examples 1.1.13–1.1.15)

| Category | Objects | Morphisms (Structure-Preserving Maps) |
| :--- | :--- | :--- |
| $\mathsf{Set}$ | Sets | Functions $f : X \to Y$ |
| $\mathsf{Top}$ | Topological spaces | Continuous maps |
| $\mathsf{Mfd}$ | Smooth manifolds | Smooth ($C^\infty$) maps |
| $\mathsf{Vect}$ | Vector spaces | Linear maps |
| $\mathsf{Meas}$ | Measurable spaces | Measurable maps |
| $\mathsf{Grp}$ | Groups | Group homomorphisms: $f(g \cdot g') = f(g) \cdot f(g')$ |
| $\mathsf{Poset}$ | Partially ordered sets | Monotone maps: $x \le x' \implies f(x) \le f(x')$ |
| $\mathsf{Graph}$ | Undirected, unweighted graphs | Adjacency-preserving vertex maps: $x \sim_G y \implies f(x) \sim_H f(y)$ |

### Crucial Non-Example (Example 1.1.17): Why Convex Functions Do NOT Form a Category!

Whenever you propose a category, you **must verify that the composite of two valid morphisms is still a valid morphism**.

Consider trying to form a category with object $\mathbb{R}$ and **convex functions** $\mathbb{R} \to \mathbb{R}$ as morphisms. Take:
$$f(x) := x^2 \qquad \text{and} \qquad g(x) := x^2 - 1.$$
Both $f$ and $g$ are strictly convex parabolas. However, their composite $f \circ g : \mathbb{R} \to \mathbb{R}$ is:
$$(f \circ g)(x) = f(g(x)) = (x^2 - 1)^2 = x^4 - 2x^2 + 1.$$
Evaluating at $x = -1, 0, +1$:
$$(f \circ g)(-1) = 0, \qquad (f \circ g)(0) = 1, \qquad (f \circ g)(1) = 0.$$
Because the midpoint value $(f \circ g)(0) = 1$ lies *above* the average $\frac{1}{2}(0 + 0) = 0$, the composite $f \circ g$ has a "W" shape with a local maximum at $x = 0$ and is **not convex**! Thus, convex functions fail closure under composition and do **not** form a category. (See Interactive Lab A below to explore this visually!)

---

## 5. Set-Theoretical Considerations & Hom-Sets (§1.1.4)

Why did Definition 1.1.1 speak of *collections* $\mathsf{C}_0, \mathsf{C}_1$ rather than *sets*? Because of **Russell's Paradox**: there is no "set of all sets," so in the category $\mathsf{Set}$ of all sets, the collection of objects $\mathsf{Set}_0$ is a *proper class* (or a *large set* in a Grothendieck universe).

**Definition 1.1.20 (Small and Locally Small Categories).**
- A category $\mathsf{C}$ is called **small** if both $\mathsf{C}_0$ and $\mathsf{C}_1$ are sets.
- A category $\mathsf{C}$ is called **locally small** if for every pair of objects $X$ and $Y$ of $\mathsf{C}$, the morphisms $X \to Y$ form a set.

**Definition 1.1.23 (Hom-Set).** Let $X$ and $Y$ be objects of a locally small category $\mathsf{C}$. The **hom-set** (or *hom-space*) of $X$ and $Y$, denoted
$$\mathrm{Hom}_{\mathsf{C}}(X, Y),$$
is the set of all morphisms in $\mathsf{C}$ from $X$ to $Y$.

> **Caveat:** Always keep track of the subscript $\mathsf{C}$! The same symbols $\mathbb{R}$ and $\mathbb{R}^2$ denote objects in many different categories, with drastically different hom-sets:
> - $\mathrm{Hom}_{\mathsf{Set}}(\mathbb{R}, \mathbb{R}^2)$ = the set of *all* arbitrary functions $\mathbb{R} \to \mathbb{R}^2$.
> - $\mathrm{Hom}_{\mathsf{Top}}(\mathbb{R}, \mathbb{R}^2)$ = the set of all *continuous* functions $\mathbb{R} \to \mathbb{R}^2$.
> - $\mathrm{Hom}_{\mathsf{Vect}}(\mathbb{R}, \mathbb{R}^2)$ = the set of all *linear* maps $\mathbb{R} \to \mathbb{R}^2$ (a 2-dimensional space!).

---

## 6. Isomorphisms, Groupoids, and the Core (§1.1.5)

In equivalence relations (§1.1.1) and deloopings of groups (§1.1.2), "we can always go back." In a general category, this property is captured by **isomorphisms**.

**Definition 1.1.24 (Isomorphism).** Let $X$ and $Y$ be objects in a category $\mathsf{C}$. An **isomorphism** is a pair of morphisms
$$X \underset{g}{\overset{f}{\rightleftarrows}} Y$$
such that:
$$\text{(a)}\;\; g \circ f = \mathrm{id}_X, \qquad \text{and} \qquad \text{(b)}\;\; f \circ g = \mathrm{id}_Y.$$
If an isomorphism between $X$ and $Y$ exists, we say $X$ and $Y$ are **isomorphic** ($X \cong Y$), and we write $g = f^{-1}$ (which is unique by Exercise 1.1.26).

### Caveat (Example 1.1.25): One-Sided Inverses Do NOT Imply Isomorphism!

Both conditions (a) and (b) must be checked separately! Let $X = \mathbb{R}^2$ and $Y = \mathbb{R}$:
- Let $f : \mathbb{R}^2 \to \mathbb{R}$ be the projection onto the $x$-axis: $f(x, y) := x$.
- Let $g : \mathbb{R} \to \mathbb{R}^2$ be the inclusion of the $x$-axis: $g(x) := (x, 0)$.

Then for every $x \in \mathbb{R}$,
$$(f \circ g)(x) = f(x, 0) = x = \mathrm{id}_{\mathbb{R}}(x) \quad \implies \quad f \circ g = \mathrm{id}_{\mathbb{R}},$$
**but** in the other order, for $(x, y) \in \mathbb{R}^2$ with $y \neq 0$,
$$(g \circ f)(x, y) = g(x) = (x, 0) \neq (x, y) \quad \implies \quad g \circ f \neq \mathrm{id}_{\mathbb{R}^2}!$$

### Isomorphisms in Familiar Categories (Example 1.1.27)
- In $\mathsf{Set}$: **bijective functions**.
- In $\mathsf{Top}$: **homeomorphisms** (continuous bijections whose inverse is *also* continuous—strictly stronger than a continuous bijection, e.g. $[0, 2\pi) \to S^1, t \mapsto (\cos t, \sin t)$ is a continuous bijection but not a homeomorphism!).
- In $\mathsf{Mfd}$: **diffeomorphisms**.
- In $\mathsf{Vect}$: **invertible (bijective) linear maps**.

### Groupoids and the Core of a Category (Definitions 1.1.29 & 1.1.32)

- **Definition 1.1.29 (Groupoid):** A **groupoid** is a category in which *every morphism is invertible* (an isomorphism).
  - *Example 1.1.30:* Any equivalence relation $(X, \sim)$ is a groupoid.
  - *Example 1.1.31:* The delooping $\mathsf{B}G$ of any group $G$ is a one-object groupoid.
- **Definition 1.1.32 (The Core of a Category):** Given any category $\mathsf{C}$, the **core** of $\mathsf{C}$, denoted $\mathsf{Core}(\mathsf{C})$, is the groupoid whose objects are the objects of $\mathsf{C}$ and whose morphisms are *only the isomorphisms* of $\mathsf{C}$.
  - *Connection to Preorders:* Taking the core of a preorder $(X, \lesssim)$ throws away the strictly one-way arrows and keeps only pairs where $x \lesssim y$ and $y \lesssim x$—producing the exact equivalence relation $x \sim y$ of Exercise 1.1.5!

> **Philosophical Remark (Equality vs. Isomorphism):**  
> In ordinary category theory, **we never ask whether two objects are equal, only whether they are isomorphic** (just as any 3-dimensional real vector space is isomorphic to $\mathbb{R}^3$, regardless of how its elements are constructed). By contrast, **morphisms with the same source and target are compared by equality** ($g \circ f = \mathrm{id}_X$). In *higher category theory* ($2$-categories, $\infty$-categories), even equalities between morphisms are replaced by higher isomorphisms ($2$-morphisms)!

---

## 7. Diagrams, Commutativity, and Pasting (§1.1.6)

**Definition 1.1.33 (Diagram, informal).** A **diagram** in a category $\mathsf{C}$ is a directed (multi-)graph whose vertices are labeled by objects of $\mathsf{C}$ and whose edges are labeled by morphisms of $\mathsf{C}$, such that:
1. Objects and morphisms may appear more than once as distinct vertices/edges;
2. Multiple arrows may exist between any two vertices;
3. For each vertex $X$, the identity $\mathrm{id}_X$ is **implicitly present** (even if not drawn);
4. For every head-to-tail chain of edges $X \xrightarrow{f} Y \xrightarrow{g} Z$, the composite $g \circ f : X \to Z$ is **implicitly present** (even if not drawn).

**Definition 1.1.35 (Commutative Diagram).** A diagram is **commutative** (or *commutes*) if for every pair of vertices $X$ and $Y$ in the diagram, **all compositions along directed paths of arrows connecting $X$ to $Y$ are equal**.

> **Caveat:** *Not every diagram commutes!* A diagram with parallel paths only commutes when we explicitly assert or prove that the composites along those paths are equal.

### Diagram Pasting (Exercise 1.1.39)

One of the most powerful techniques in category theory is **pasting commutative diagrams**: if two adjacent squares commute separately, then the outer rectangle formed by pasting them along their shared edge automatically commutes!

$$\left.\begin{aligned}
\text{Left square commutes:} &\quad h \circ f = p \circ k \\
\text{Right square commutes:} &\quad \ell \circ g = q \circ h
\end{aligned}\right\} \implies \ell \circ g \circ f = \ell \circ (h \circ f) = (\ell \circ h) \circ f = (q \circ h) \circ f = q \circ (h \circ f) = q \circ p \circ k.$$

```diagram
id: diagram-pasting-squares
title: Pasting Two Commutative Squares (Exercise 1.1.39)
type: square
equation: "ℓ ∘ g ∘ f = q ∘ p ∘ k"
nodes:
  X: { label: "X", x: 110, y: 65 }
  Y: { label: "Y", x: 350, y: 65 }
  Z: { label: "Z", x: 590, y: 65 }
  A: { label: "A", x: 110, y: 235 }
  B: { label: "B", x: 350, y: 235 }
  C: { label: "C", x: 590, y: 235 }
edges:
  - { from: "X", to: "Y", label: "f", path: "upper" }
  - { from: "Y", to: "Z", label: "g", path: "upper" }
  - { from: "Z", to: "C", label: "ℓ", path: "upper" }
  - { from: "X", to: "A", label: "k", path: "lower" }
  - { from: "A", to: "B", label: "p", path: "lower" }
  - { from: "B", to: "C", label: "q", path: "lower" }
  - { from: "Y", to: "B", label: "h", dashed: true, highlight: true, path: "universal" }
```

### Diagrammatic Definition of Isomorphism (Definition 1.1.40)

Using commutative triangles, two morphisms $f : X \to Y$ and $g : Y \to X$ are inverse to each other (forming an isomorphism) if and only if **both** of the following triangles commute:

```diagram
id: isomorphism-triangles
title: Definition 1.1.40 — Isomorphism via Two Commutative Triangles
type: square
equation: "g ∘ f = id_X   and   f ∘ g = id_Y"
nodes:
  X1: { label: "X", x: 95, y: 65 }
  Y1: { label: "Y", x: 275, y: 65 }
  X2: { label: "X", x: 275, y: 235 }
  Y2: { label: "Y", x: 445, y: 65 }
  X3: { label: "X", x: 625, y: 65 }
  Y3: { label: "Y", x: 625, y: 235 }
edges:
  - { from: "X1", to: "Y1", label: "f", path: "upper" }
  - { from: "Y1", to: "X2", label: "g", path: "upper" }
  - { from: "X1", to: "X2", label: "id_X", dashed: true, highlight: true, path: "upper" }
  - { from: "Y2", to: "X3", label: "g", path: "lower" }
  - { from: "X3", to: "Y3", label: "f", path: "lower" }
  - { from: "Y2", to: "Y3", label: "id_Y", dashed: true, highlight: true, path: "lower" }
```

---

## 8. The Opposite Category $\mathsf{C}^{\mathrm{op}}$ and Duality (§1.1.7)

Another fundamental technique in category theory is **"reversing all the arrows."**

**Definition 1.1.41 (The Opposite Category $\mathsf{C}^{\mathrm{op}}$).** Let $\mathsf{C}$ be a category. The **opposite category** of $\mathsf{C}$, denoted $\mathsf{C}^{\mathrm{op}}$, is defined by:
- **Objects:** The exact same objects as $\mathsf{C}$ ($\mathrm{Ob}(\mathsf{C}^{\mathrm{op}}) = \mathrm{Ob}(\mathsf{C})$).
- **Morphisms:** A morphism $f^{\mathrm{op}} : X \to Y$ in $\mathsf{C}^{\mathrm{op}}$ is a morphism $f : Y \to X$ in $\mathsf{C}$ (mind the reversed direction!):
  $$\mathrm{Hom}_{\mathsf{C}^{\mathrm{op}}}(X, Y) := \mathrm{Hom}_{\mathsf{C}}(Y, X).$$
- **Identities:** $\mathrm{id}_X^{\mathrm{op}} := \mathrm{id}_X$.
- **Composition:** Reversed order! Given $X \xrightarrow{f^{\mathrm{op}}} Y \xrightarrow{g^{\mathrm{op}}} Z$ in $\mathsf{C}^{\mathrm{op}}$ (which correspond to $Z \xrightarrow{g} Y \xrightarrow{f} X$ in $\mathsf{C}$), their composite in $\mathsf{C}^{\mathrm{op}}$ is:
  $$g^{\mathrm{op}} \circ f^{\mathrm{op}} := (f \circ g)^{\mathrm{op}}.$$

### Examples of Opposite Categories
- **Example 1.1.42 (Posets):** If $(X, \le)$ is a partially ordered set, then $(X, \le)^{\mathrm{op}} = (X, \ge)$ (ordered downward, e.g. $(\mathbb{R}, \le)^{\mathrm{op}} = (\mathbb{R}, \ge)$).
- **Example 1.1.43 (Delooping of a Group):** $(\mathsf{B}G)^{\mathrm{op}}$ is a one-object category whose morphisms are elements of $G$ with multiplication performed in the opposite order: $g^{\mathrm{op}} \circ h^{\mathrm{op}} = (h \cdot g)^{\mathrm{op}}$ (the opposite group $G^{\mathrm{op}}$, which is isomorphic to $G$ via $g \mapsto g^{-1}$).

### The Principle of Duality (Corollaries 1.1.45 & 1.1.46)

Because the axioms of a category (unitality and associativity) are completely symmetric under reversing arrows:

> **Duality Principle:** *A categorical statement holds in every category $\mathsf{C}$ if and only if its dual statement (obtained by reversing all arrows and reversing the order of all compositions) holds in $\mathsf{C}^{\mathrm{op}}$.*

- **Corollary 1.1.45:** A diagram in $\mathsf{C}$ commutes if and only if the dual diagram in $\mathsf{C}^{\mathrm{op}}$ commutes:
  $$h \circ f = g \circ k \quad \text{in } \mathsf{C} \qquad \Longleftrightarrow \qquad f^{\mathrm{op}} \circ h^{\mathrm{op}} = k^{\mathrm{op}} \circ g^{\mathrm{op}} \quad \text{in } \mathsf{C}^{\mathrm{op}}.$$
- **Corollary 1.1.46:** A morphism $f : X \to Y$ is an isomorphism in $\mathsf{C}$ if and only if $f^{\mathrm{op}} : Y \to X$ is an isomorphism in $\mathsf{C}^{\mathrm{op}}$ (with inverse $(f^{-1})^{\mathrm{op}}$). In particular, $X \cong Y$ in $\mathsf{C} \iff X \cong Y$ in $\mathsf{C}^{\mathrm{op}}$.

```diagram
id: duality-square-op
title: Corollary 1.1.45 — Original Square in C vs. Dual Square in C^op
type: square
equation: "h ∘ f = g ∘ k   ⟺   f^op ∘ h^op = k^op ∘ g^op"
nodes:
  X1: { label: "X", x: 80, y: 70 }
  Y1: { label: "Y", x: 260, y: 70 }
  A1: { label: "A", x: 80, y: 230 }
  B1: { label: "B", x: 260, y: 230 }
  X2: { label: "X", x: 440, y: 70 }
  Y2: { label: "Y", x: 620, y: 70 }
  A2: { label: "A", x: 440, y: 230 }
  B2: { label: "B", x: 620, y: 230 }
edges:
  - { from: "X1", to: "Y1", label: "f", path: "upper" }
  - { from: "Y1", to: "B1", label: "h", path: "upper" }
  - { from: "X1", to: "A1", label: "k", path: "lower" }
  - { from: "A1", to: "B1", label: "g", path: "lower" }
  - { from: "Y2", to: "X2", label: "f^op", path: "upper" }
  - { from: "B2", to: "Y2", label: "h^op", path: "upper" }
  - { from: "A2", to: "X2", label: "k^op", path: "lower" }
  - { from: "B2", to: "A2", label: "g^op", path: "lower" }
```
