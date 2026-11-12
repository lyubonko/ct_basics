# Category Theory Study Group — GitHub Pages

Interactive reading notes, LaTeX formulas, and commutative diagrams for our **Category Theory Study Group**.

## Included Material

- **Session 001 (`content/001-basic-concepts-categories.md` / `001-basic-concepts-categories.md`)**: Based on **Paolo Perrone**, *"Notes on Category Theory with examples from basic mathematics"*, Chapter 1, §1.1 Categories (pp. 8–23) from `content/notes_ct_1_1.pdf`.
- **LaTeX & Commutative Diagrams**:
  - Full inline (`$...$`) and display (`$$...$$`, `\begin{CD}...\end{CD}`) LaTeX rendering via **KaTeX**.
  - Interactive **SVG Commutative Diagrams** generated directly from fenced ` ```diagram ` blocks in Markdown, supporting **draggable objects**, **upper/lower path tracing**, and **animated commutativity tokens**.
- **Interactive Category Theory Sandboxes**:
  - **Lab A (Why Convex Maps Fail Composition)**: Plots $f(x)=x^2$, $g(x)=x^2-1$, their non-convex composite $(f \circ g)(x) = (x^2-1)^2$, and the monotonicity cure from Exercise 1.1.19.
  - **Lab B (Opposite Category Dualizer $\mathsf{C} \leftrightarrow \mathsf{C}^{\mathrm{op}}$)**: Reverses all arrows in real time and updates the commuting equations.
  - **Lab C (Exercise 1.1.34 & 1.1.37 Diagram Inspector)**: Interactive inspector for all 8 diagrams (a)–(h).
- **Guided Study Exercises & Proofs**: Collapsible solutions for all exercises in §1.1.

## Project Structure

```text
├── 001-basic-concepts-categories.md     # Generated Markdown study note (root copy)
├── content/
│   ├── 001-basic-concepts-categories.md # Canonical Markdown source with LaTeX & diagram blocks
│   └── notes_ct_1_1.pdf                 # Source reading PDF (Paolo Perrone, Ch. 1 §1.1)
├── assets/
│   ├── styles.css                       # Modern CSS (@layer, light-dark(), accessible accordions)
│   └── app.js                           # Interactive SVG diagram renderer & sandboxes
├── scripts/
│   └── build.mjs                        # Zero-dependency Node.js Markdown -> HTML site builder
├── index.html                           # Built GitHub Pages entry point
├── sessions/
│   └── 001-basic-concepts-categories.html # Permalink page for Session 001
├── .nojekyll                            # Disables Jekyll processing on GitHub Pages
└── .github/workflows/deploy.yml         # Automated GitHub Pages build & deployment workflow
```

## Local Development & Adding New Sessions

1. Edit `content/001-basic-concepts-categories.md` (or add a new `.md` file in `content/`).
2. Rebuild the static pages:
   ```bash
   npm run build
   ```
3. Preview locally:
   ```bash
   npm run serve
   # Open http://localhost:8080
   ```

## Deploying to GitHub Pages

This repository supports **both** GitHub Pages deployment modes out of the box:

1. **GitHub Actions (Recommended)**:
   - Go to **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
   - Every push to `main` or `master` runs `.github/workflows/deploy.yml`, rebuilding the site from `content/*.md` and deploying it.
2. **Deploy from a Branch**:
   - Select **Deploy from a branch** → branch `main` (or `master`), folder `/ (root)`. Because `index.html` and `.nojekyll` are pre-built in the repository root, the site is served immediately.
