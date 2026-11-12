import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT_DIR, "content");
const SESSIONS_DIR = path.join(ROOT_DIR, "sessions");

const SESSIONS_MANIFEST = [
  {
    slug: "001-basic-concepts-categories",
    mdFile: "001-basic-concepts-categories.md",
    htmlFile: "001-basic-concepts-categories.html",
    shortLabel: "Session 001: §1.1 Categories (Perrone)",
    sidebarLabel: "001 — §1.1 Categories (Perrone)",
    pdfHref: "content/notes_ct_1_1.pdf",
    pdfLabel: "Perrone §1.1 PDF"
  }
];

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const yamlStr = match[1];
  const body = match[2];
  const meta = { tags: [] };

  let inTags = false;
  for (const line of yamlStr.split(/\r?\n/)) {
    if (line.trim().startsWith("- ") && inTags) {
      meta.tags.push(line.trim().slice(2).replace(/^["']|["']$/g, ""));
      continue;
    }
    const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (kv) {
      const key = kv[1];
      const val = kv[2].trim();
      if (key === "tags" && !val) {
        inTags = true;
      } else {
        inTags = false;
        meta[key] = val.replace(/^["']|["']$/g, "");
      }
    }
  }
  return { meta, body };
}

function parseDiagramBlock(rawBlock) {
  const spec = {
    id: "diagram",
    title: "Commutative Diagram",
    type: "square",
    equation: "",
    nodes: {},
    edges: []
  };

  let section = null;
  for (const rawLine of rawBlock.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    if (line === "nodes:") {
      section = "nodes";
      continue;
    }
    if (line === "edges:") {
      section = "edges";
      continue;
    }

    if (!section) {
      const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.+)$/);
      if (kv) {
        spec[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
      }
    } else if (section === "nodes") {
      const nodeMatch = line.match(/^([a-zA-Z0-9_-]+):\s*\{(.+)\}$/);
      if (nodeMatch) {
        const key = nodeMatch[1];
        const props = {};
        for (const part of nodeMatch[2].split(",")) {
          const [k, v] = part.split(":").map((s) => s.trim());
          if (k && v !== undefined) {
            const cleanVal = v.replace(/^["']|["']$/g, "");
            props[k] = isNaN(Number(cleanVal)) ? cleanVal : Number(cleanVal);
          }
        }
        spec.nodes[key] = props;
      }
    } else if (section === "edges") {
      const edgeMatch = line.match(/^-\s*\{(.+)\}$/);
      if (edgeMatch) {
        const props = {};
        for (const part of edgeMatch[1].split(",")) {
          const [k, v] = part.split(":").map((s) => s.trim());
          if (k && v !== undefined) {
            const cleanVal = v.replace(/^["']|["']$/g, "");
            if (cleanVal === "true") props[k] = true;
            else if (cleanVal === "false") props[k] = false;
            else props[k] = isNaN(Number(cleanVal)) ? cleanVal : Number(cleanVal);
          }
        }
        spec.edges.push(props);
      }
    }
  }
  return spec;
}

function renderDiagramFigureHtml(spec, mdSourceName = "content/001-categories.md") {
  const escapedJson = JSON.stringify(spec).replace(/&/g, "&amp;").replace(/'/g, "&#39;").replace(/"/g, "&quot;");
  const hasPaths = spec.edges.some((e) => e.path === "upper" || e.path === "lower");

  return `
<figure class="diagram-card" data-diagram-spec="${escapedJson}">
  <div class="diagram-header">
    <div class="diagram-title">
      <span>${spec.title}</span>
      ${spec.equation ? `<span class="badge">${spec.equation}</span>` : ""}
    </div>
    <div class="diagram-controls">
      ${
        hasPaths
          ? `<button type="button" class="btn" data-diagram-action="upper">Trace Upper Path</button>
             <button type="button" class="btn" data-diagram-action="lower">Trace Lower Path</button>`
          : ""
      }
      <button type="button" class="btn" data-diagram-action="both">Animate Commutativity</button>
      <button type="button" class="btn" data-diagram-action="reset">Reset Nodes</button>
    </div>
  </div>
  <div class="diagram-canvas-wrap">
    <svg class="diagram-svg" viewBox="0 0 720 300" role="img" aria-label="${spec.title}"></svg>
  </div>
  <figcaption class="diagram-caption">
    <span>Interactive Commutative Diagram — drag any object vertex to deform the geometry while preserving arrow connectivity.</span>
    <span>Rendered from <code>${mdSourceName}</code></span>
  </figcaption>
</figure>`;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatInlineMarkdown(text) {
  const mathTokens = [];
  let protectedText = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    const idx = mathTokens.length;
    mathTokens.push(`<span class="math-display">\\[${math}\\]</span>`);
    return `@@MATH_${idx}@@`;
  });

  protectedText = protectedText.replace(/\$([^$\n]+)\$/g, (_, math) => {
    const idx = mathTokens.length;
    mathTokens.push(`\\(${math}\\)`);
    return `@@MATH_${idx}@@`;
  });

  protectedText = protectedText.replace(/`([^`]+)`/g, "<code>$1</code>");
  protectedText = protectedText.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
  protectedText = protectedText.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  protectedText = protectedText.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

  protectedText = protectedText.replace(/@@MATH_(\d+)@@/g, (_, idx) => mathTokens[Number(idx)]);
  return protectedText;
}

function convertMarkdownToHtml(markdown, mdSourceName) {
  const toc = [];
  const lines = markdown.split(/\r?\n/);
  const out = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      out.push("<hr>");
      i++;
      continue;
    }

    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const blockLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        blockLines.push(lines[i]);
        i++;
      }
      i++;
      if (lang === "diagram") {
        const spec = parseDiagramBlock(blockLines.join("\n"));
        out.push(renderDiagramFigureHtml(spec, mdSourceName));
      } else {
        const escaped = blockLines
          .join("\n")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        out.push(
          `<pre role="region" aria-label="Code snippet" tabindex="0"><code class="language-${lang || "text"}">${escaped}</code></pre>`
        );
      }
      continue;
    }

    if (line.trim().startsWith("$$")) {
      if (line.trim().endsWith("$$") && line.trim().length > 4) {
        const mathContent = line.trim().slice(2, -2);
        out.push(`<div class="math-display">\\[${mathContent}\\]</div>`);
        i++;
        continue;
      }
      const mathLines = [line.trim().slice(2)];
      i++;
      while (i < lines.length && !lines[i].trim().endsWith("$$")) {
        mathLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) {
        mathLines.push(lines[i].trim().slice(0, -2));
        i++;
      }
      out.push(`<div class="math-display">\\[\n${mathLines.join("\n")}\n\\]</div>`);
      continue;
    }

    const hMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      const rawHeading = hMatch[2].trim();
      const id = slugify(rawHeading.replace(/\$[^$]+\$/g, ""));
      if (level === 2) {
        toc.push({ id, title: formatInlineMarkdown(rawHeading) });
      }
      out.push(`<h${level} id="${id}">${formatInlineMarkdown(rawHeading)}</h${level}>`);
      i++;
      continue;
    }

    if (line.trim().startsWith(">")) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      out.push(`<blockquote><p>${quoteLines.map(formatInlineMarkdown).join("<br>")}</p></blockquote>`);
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:-]+\|/.test(lines[i + 1])) {
      const parseRow = (rowStr) =>
        rowStr
          .trim()
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((c) => formatInlineMarkdown(c.trim()));

      const headers = parseRow(lines[i]);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
        rows.push(parseRow(lines[i]));
        i++;
      }
      const thead = `<thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>`;
      const tbody = `<tbody>${rows
        .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
        .join("")}</tbody>`;
      out.push(`<div class="table-scroll"><table>${thead}${tbody}</table></div>`);
      continue;
    }

    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const isOrdered = /^\s*\d+\.\s+/.test(line);
      const tag = isOrdered ? "ol" : "ul";
      const items = [];
      while (i < lines.length && (/^\s*([-*]|\d+\.)\s+/.test(lines[i]) || /^\s{2,}\S/.test(lines[i]))) {
        if (/^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ""));
        } else if (items.length > 0) {
          items[items.length - 1] += " " + lines[i].trim();
        }
        i++;
      }
      out.push(`<${tag}>${items.map((item) => `<li>${formatInlineMarkdown(item)}</li>`).join("")}</${tag}>`);
      continue;
    }

    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith(">") &&
      !/^---+$/.test(lines[i].trim()) &&
      !/^\s*([-*]|\d+\.)\s+/.test(lines[i])
    ) {
      if (lines[i].trim().startsWith("$$") && lines[i].trim().endsWith("$$") && lines[i].trim().length > 4) {
        const m = lines[i].trim().slice(2, -2);
        paraLines.push(`<span class="math-display">\\[${m}\\]</span>`);
      } else {
        paraLines.push(formatInlineMarkdown(lines[i]));
      }
      i++;
    }
    if (paraLines.length > 0) {
      out.push(`<p>${paraLines.join(" ")}</p>`);
    }
  }

  return { html: out.join("\n"), toc };
}

function buildSession001LabsHtml() {
  const defaultSandboxJson = JSON.stringify(
    {
      id: "sandbox-preview",
      title: "Custom Functor & Homotopy Square",
      type: "square",
      equation: "Gf ∘ η_x = η_y ∘ Ff",
      nodes: {
        Fx: { label: "Fx", x: 170, y: 65 },
        Fy: { label: "Fy", x: 470, y: 65 },
        Gx: { label: "Gx", x: 170, y: 225 },
        Gy: { label: "Gy", x: 470, y: 225 }
      },
      edges: [
        { from: "Fx", to: "Fy", label: "Ff", path: "upper" },
        { from: "Fy", to: "Gy", label: "η_y", path: "upper" },
        { from: "Fx", to: "Gx", label: "η_x", path: "lower" },
        { from: "Gx", to: "Gy", label: "Gf", path: "lower" },
        { from: "Fx", to: "Gy", label: "naturality", dashed: true, highlight: true, path: "diagonal" }
      ]
    },
    null,
    2
  );

  return `
<section class="interactive-lab" id="interactive-sandboxes" aria-labelledby="labs-heading">
  <h2 id="labs-heading">11. Interactive Category Theory Sandboxes</h2>
  <p>
    Explore the concrete mathematical structures from Eugenia Cheng's article interactively: compose non-function morphisms in \\(\\mathbf{Mat}_{\\mathbb{R}}\\), posets, and \\(\\mathbf{B}G\\), test the universal property of the disjoint union \\(A \\sqcup B\\), or author your own commutative diagrams.
  </p>

  <div class="lab-grid">
    <div class="lab-panel">
      <h3>Lab A: Morphism Composition Explorer</h3>
      <p style="font-size:0.86rem; color:var(--text-muted);">
        Select one of the categories from Section 3 and pick composable arrows \\(a \\xrightarrow{f} b\\) and \\(b \\xrightarrow{g} c\\) to compute \\(g \\circ f\\).
      </p>
      <label class="lab-label" for="category-example-select">1. Choose Category \\(\\mathcal{C}\\):</label>
      <select id="category-example-select" class="lab-select">
        <option value="mat">(i) Real Matrices Mat_ℝ (Objects: n ∈ ℕ, Arrows: n×m matrices)</option>
        <option value="poset">(ii) Ordered Set (ℕ, ≤) (Objects: numbers, Arrows: x ≤ y)</option>
        <option value="group">(iii) One-Object Group B(ℤ/4ℤ) (Object: •, Arrows: g ∈ G)</option>
        <option value="pi1">(iv) Fundamental Group Functor π₁ : Top_* → Grp</option>
      </select>

      <label class="lab-label" for="morphism-f-select">2. First Morphism \\(f : a \\to b\\):</label>
      <select id="morphism-f-select" class="lab-select"></select>

      <label class="lab-label" for="morphism-g-select">3. Second Morphism \\(g : b \\to c\\):</label>
      <select id="morphism-g-select" class="lab-select"></select>

      <div id="category-composer-output" class="result-box" aria-live="polite"></div>
    </div>

    <div class="lab-panel">
      <h3>Lab B: Universal Property of \\(A \\sqcup B\\)</h3>
      <p style="font-size:0.86rem; color:var(--text-muted);">
        Choose any target values in \\(X = \\{x_1, x_2, x_3\\}\\) for \\(f : A \\to X\\) and \\(g : B \\to X\\). Observe how the universal property uniquely determines \\(h : A \\sqcup B \\to X\\).
      </p>
      <div id="coproduct-controls" style="margin-block-end:0.9rem;">
        <div class="coproduct-row">
          <span>In \\(A\\): map \\(f(a_1) \\mapsto\\)</span>
          <select data-source-elem="a1" aria-label="Target for f(a1)">
            <option value="x₁" selected>x₁ ∈ X</option>
            <option value="x₂">x₂ ∈ X</option>
            <option value="x₃">x₃ ∈ X</option>
          </select>
        </div>
        <div class="coproduct-row">
          <span>In \\(A\\): map \\(f(a_2) \\mapsto\\)</span>
          <select data-source-elem="a2" aria-label="Target for f(a2)">
            <option value="x₁">x₁ ∈ X</option>
            <option value="x₂" selected>x₂ ∈ X</option>
            <option value="x₃">x₃ ∈ X</option>
          </select>
        </div>
        <div class="coproduct-row">
          <span>In \\(B\\): map \\(g(b_1) \\mapsto\\)</span>
          <select data-source-elem="b1" aria-label="Target for g(b1)">
            <option value="x₁">x₁ ∈ X</option>
            <option value="x₂" selected>x₂ ∈ X</option>
            <option value="x₃">x₃ ∈ X</option>
          </select>
        </div>
        <div class="coproduct-row">
          <span>In \\(B\\): map \\(g(b_2) \\mapsto\\)</span>
          <select data-source-elem="b2" aria-label="Target for g(b2)">
            <option value="x₁">x₁ ∈ X</option>
            <option value="x₂">x₂ ∈ X</option>
            <option value="x₃" selected>x₃ ∈ X</option>
          </select>
        </div>
      </div>
      <div id="coproduct-universal-output" class="result-box" aria-live="polite"></div>
    </div>
  </div>

  <div class="lab-panel" style="margin-block-start:1.25rem;">
    <h3>Lab C: Live Commutative Diagram Playground</h3>
    <p style="font-size:0.86rem; color:var(--text-muted);">
      Edit the JSON specification below to experiment with objects, curved arrows, and commuting paths, or drag the rendered nodes directly.
    </p>
    <div class="lab-grid">
      <div>
        <label class="lab-label" for="sandbox-diagram-json">Diagram Specification:</label>
        <textarea id="sandbox-diagram-json" class="lab-textarea" spellcheck="false">${defaultSandboxJson}</textarea>
        <div id="sandbox-status" style="font-size:0.8rem; font-weight:600;"></div>
      </div>
      <div>
        <figure class="diagram-card" id="sandbox-diagram-card" style="margin:0;">
          <div class="diagram-header">
            <div class="diagram-title">Live Diagram Preview</div>
            <div class="diagram-controls">
              <button type="button" class="btn" data-diagram-action="upper">Upper</button>
              <button type="button" class="btn" data-diagram-action="lower">Lower</button>
              <button type="button" class="btn" data-diagram-action="both">Animate</button>
              <button type="button" class="btn" data-diagram-action="reset">Reset</button>
            </div>
          </div>
          <div class="diagram-canvas-wrap">
            <svg class="diagram-svg" viewBox="0 0 720 300" role="img" aria-label="Live custom commutative diagram preview"></svg>
          </div>
        </figure>
      </div>
    </div>
  </div>
</section>

<section class="accordion" id="solutions-accordion" aria-labelledby="solutions-heading">
  <div class="accordion-header">
    <h2 id="solutions-heading">12. Study Group Exercise Hints &amp; Solutions</h2>
    <button type="button" class="btn" commandfor="solutions-accordion" command="--toggle-all" aria-expanded="false">
      <span class="expand">Expand all solutions</span>
      <span class="collapse">Collapse all solutions</span>
    </button>
  </div>

  <details>
    <summary>Solution 1: Order of Matrix Multiplication in Mat_ℝ</summary>
    <div class="details-body">
      <p>
        In Cheng's Example (i), a morphism \\(f : n \\to m\\) is an \\(n \\times m\\) matrix, and \\(g : m \\to k\\) is an \\(m \\times k\\) matrix. Under standard row-by-column matrix multiplication, an \\(n \\times m\\) matrix multiplies on the right by an \\(m \\times k\\) matrix to produce an \\(n \\times k\\) matrix:
      </p>
      <p>\\[ g \\circ f := f \\cdot g \\in \\mathbb{R}^{n \\times k}. \\]</p>
    </div>
  </details>

  <details>
    <summary>Solution 2: Isomorphisms in Posets and One-Object Categories</summary>
    <div class="details-body">
      <p>
        <strong>In a Poset Category \\((P, \\leqslant)\\):</strong> An isomorphism between \\(x\\) and \\(y\\) requires \\(x \\leqslant y\\) and \\(y \\leqslant x\\). By antisymmetry, \\(x = y\\).
      </p>
      <p>
        <strong>Relaxing Inverses in \\(\\mathbf{B}G\\):</strong> A category with a single object \\(\\bullet\\) where morphisms need not be invertible is a <strong>monoid</strong> \\((M, \\cdot, e)\\).
      </p>
    </div>
  </details>

  <details>
    <summary>Solution 3: Uniqueness of Disjoint Union up to Unique Isomorphism</summary>
    <div class="details-body">
      <p>
        Applying the universal property to \\(X = U'\\) and \\(X = U\\) yields unique maps \\(h : U \\to U'\\) and \\(k : U' \\to U\\) whose composites \\(k \\circ h = \\mathrm{id}_U\\) and \\(h \\circ k = \\mathrm{id}_{U'}\\) are forced by uniqueness for \\(X = U\\) and \\(X = U'\\).
      </p>
    </div>
  </details>

  <details>
    <summary>Solution 4: Verifying Naturality for the Double Dual V → V**</summary>
    <div class="details-body">
      <p>
        For \\(T : V \\to W\\), \\(v \\in V\\), and \\(\\psi \\in W^*\\), both paths around the naturality square evaluate to \\(\\psi(T(v))\\), proving \\(T^{**} \\circ \\eta_V = \\eta_W \\circ T\\) without choosing a basis.
      </p>
    </div>
  </details>
</section>
`;
}

function buildSession002LabsHtml() {
  return `
<section class="interactive-lab" id="interactive-sandboxes" aria-labelledby="labs-heading">
  <h2 id="labs-heading">9. Interactive Sandboxes for Section 1.1</h2>
  <p>
    Explore Perrone's key examples and exercises interactively: test why convex functions fail composition closure (Example 1.1.17 &amp; Exercise 1.1.19), inspect implicit vs. explicit morphisms across all 8 diagrams of Exercise 1.1.34 &amp; 1.1.37, and dualize diagrams between \\(\\mathsf{C}\\) and \\(\\mathsf{C}^{\\mathrm{op}}\\) (§1.1.7).
  </p>

  <div class="lab-grid">
    <!-- Lab A: Convexity Failure & Cure (Example 1.1.17 & Exercise 1.1.19) -->
    <div class="lab-panel">
      <h3>Lab A: Why Convex Maps Fail Composition (Ex. 1.1.17 &amp; 1.1.19)</h3>
      <p style="font-size:0.86rem; color:var(--text-muted);">
        Inspect \\(f(x) = x^2\\), \\(g(x) = x^2 - 1\\), their non-convex composite \\((f \\circ g)(x) = (x^2 - 1)^2\\), and the monotonicity cure from Exercise 1.1.19.
      </p>
      <label class="lab-label" for="convex-fn-select">Select Function &amp; Secant Midpoint Test on \\([-1, 1]\\):</label>
      <select id="convex-fn-select" class="lab-select">
        <option value="fog" selected>Composite (f ∘ g)(x) = (x² - 1)²  — FAILS Convexity!</option>
        <option value="f">f(x) = x²  — Strictly Convex</option>
        <option value="g">g(x) = x² - 1  — Strictly Convex</option>
        <option value="fixed">Exercise 1.1.19 Cure: Non-decreasing Convex Outer Map</option>
      </select>
      <div class="diagram-canvas-wrap" style="margin-block-end:0.85rem;">
        <svg id="convex-plot-svg" class="diagram-svg" viewBox="0 0 500 240" role="img" aria-label="Graph of convex functions and their composite"></svg>
      </div>
      <div id="convex-test-output" class="result-box" aria-live="polite"></div>
    </div>

    <!-- Lab C: Opposite Category Dualizer (§1.1.7) -->
    <div class="lab-panel">
      <h3>Lab B: Opposite Category Dualizer (\\(\\mathsf{C} \\leftrightarrow \\mathsf{C}^{\\mathrm{op}}\\))</h3>
      <p style="font-size:0.86rem; color:var(--text-muted);">
        Click below to reverse all arrows into \\(\\mathsf{C}^{\\mathrm{op}}\\) (Definition 1.1.41 &amp; Corollary 1.1.45) and watch how source, target, and composition order flip.
      </p>
      <div style="margin-block-end:0.75rem;">
        <button type="button" id="duality-flip-btn" class="btn active-both" style="inline-size:100%; justify-content:center; padding-block:0.55rem;">
          Reverse All Arrows → Dualize to C^op
        </button>
      </div>
      <figure class="diagram-card" id="duality-flip-card" style="margin:0 0 0.85rem 0;">
        <div class="diagram-header">
          <div class="diagram-title">Duality Square</div>
          <div class="diagram-controls">
            <button type="button" class="btn" data-diagram-action="upper">Upper</button>
            <button type="button" class="btn" data-diagram-action="lower">Lower</button>
            <button type="button" class="btn" data-diagram-action="both">Animate</button>
          </div>
        </div>
        <div class="diagram-canvas-wrap">
          <svg class="diagram-svg" viewBox="0 0 720 300" role="img" aria-label="Interactive duality diagram"></svg>
        </div>
      </figure>
      <div id="duality-flip-equation" class="result-box" aria-live="polite"></div>
    </div>
  </div>

  <!-- Lab B: Exercise 1.1.34 & 1.1.37 Interactive Inspector -->
  <div class="lab-panel" style="margin-block-start:1.25rem;">
    <h3>Lab C: Exercise 1.1.34 &amp; 1.1.37 — Implicit Morphisms &amp; Commutativity Inspector</h3>
    <p style="font-size:0.86rem; color:var(--text-muted);">
      Select any of the 8 diagrams (a)–(h) from page 20 of Perrone's notes to see all explicitly drawn arrows, implicitly generated identities/composites, and the exact condition required for commutativity.
    </p>
    <div class="lab-grid">
      <div>
        <label class="lab-label" for="ex-1-1-34-select">Choose Diagram from Exercise 1.1.34:</label>
        <select id="ex-1-1-34-select" class="lab-select">
          <option value="a">(a) X —f→ Y</option>
          <option value="b">(b) Triangle X —f→ Y —g→ Z with diagonal g ∘ f</option>
          <option value="c">(c) Triangle X —f→ Y —g→ Z with diagonal h</option>
          <option value="d">(d) Triangle X —f→ Y —g→ X with diagonal id_X</option>
          <option value="e" selected>(e) Bidirectional pair X ⇄ Y (f and g)</option>
          <option value="f">(f) Invertible pair X ⇄ Y (f and f⁻¹)</option>
          <option value="g">(g) Endomorphism X —f→ X</option>
          <option value="h">(h) Square X, Y, A, B with f, h, k, g</option>
        </select>
        <div id="ex-1-1-34-info" class="result-box" aria-live="polite"></div>
      </div>
      <div>
        <figure class="diagram-card" id="ex-1-1-34-card" style="margin:0;">
          <div class="diagram-header">
            <div class="diagram-title">Diagram Visualizer</div>
            <div class="diagram-controls">
              <button type="button" class="btn" data-diagram-action="upper">Path 1</button>
              <button type="button" class="btn" data-diagram-action="lower">Path 2</button>
              <button type="button" class="btn" data-diagram-action="both">Animate</button>
              <button type="button" class="btn" data-diagram-action="reset">Reset</button>
            </div>
          </div>
          <div class="diagram-canvas-wrap">
            <svg class="diagram-svg" viewBox="0 0 720 300" role="img" aria-label="Exercise 1.1.34 diagram"></svg>
          </div>
        </figure>
      </div>
    </div>
  </div>
</section>

<!-- Complete Solutions for Section 1.1 Exercises -->
<section class="accordion" id="solutions-accordion" aria-labelledby="solutions-heading">
  <div class="accordion-header">
    <h2 id="solutions-heading">10. Complete Exercises &amp; Proofs from Section 1.1</h2>
    <button type="button" class="btn" commandfor="solutions-accordion" command="--toggle-all" aria-expanded="false">
      <span class="expand">Expand all 11 exercise proofs</span>
      <span class="collapse">Collapse all exercise proofs</span>
    </button>
  </div>

  <details>
    <summary>Exercise 1.1.5 (Sets &amp; Relations): Core of a Preorder is an Equivalence Relation</summary>
    <div class="details-body">
      <p><strong>Problem:</strong> Let \\((X, \\lesssim)\\) be a preorder. Prove that \\(x \\sim y \\iff (x \\lesssim y \\text{ and } y \\lesssim x)\\) is an equivalence relation.</p>
      <p><strong>Proof:</strong></p>
      <ul>
        <li><strong>Reflexivity:</strong> Since \\(\\lesssim\\) is reflexive, \\(x \\lesssim x\\) holds for all \\(x \\in X\\). Hence \\(x \\lesssim x\\) and \\(x \\lesssim x\\), so \\(x \\sim x\\).</li>
        <li><strong>Symmetry:</strong> If \\(x \\sim y\\), then \\(x \\lesssim y\\) and \\(y \\lesssim x\\). Since logical conjunction is symmetric, \\(y \\lesssim x\\) and \\(x \\lesssim y\\), meaning \\(y \\sim x\\).</li>
        <li><strong>Transitivity:</strong> Suppose \\(x \\sim y\\) and \\(y \\sim z\\). Then \\(x \\lesssim y\\) and \\(y \\lesssim z\\) (which by transitivity of \\(\\lesssim\\) gives \\(x \\lesssim z\\)), and simultaneously \\(z \\lesssim y\\) and \\(y \\lesssim x\\) (which by transitivity of \\(\\lesssim\\) gives \\(z \\lesssim x\\)). Thus \\(x \\sim z\\). \\(\\blacksquare\\)</li>
      </ul>
    </div>
  </details>

  <details>
    <summary>Exercise 1.1.12 (Important!): Uniqueness of the Neutral Element in a Monoid/Group</summary>
    <div class="details-body">
      <p><strong>Problem:</strong> Prove that if both \\(1\\) and \\(1'\\) satisfy the unitality axiom in a monoid \\(M\\), then \\(1 = 1'\\).</p>
      <p><strong>Proof:</strong> Evaluate the product \\(1 \\cdot 1'\\) in two ways:</p>
      <p>\\[ 1 = 1 \\cdot 1' = 1' \\]</p>
      <p>where the first equality uses that \\(1'\\) is a right unit (\\(g \\cdot 1' = g\\) with \\(g = 1\\)), and the second equality uses that \\(1\\) is a left unit (\\(1 \\cdot h = h\\) with \\(h = 1'\\)). Categorically, this also proves that the identity morphism \\(\\mathrm{id}_X\\) at any object \\(X\\) is unique! \\(\\blacksquare\\)</p>
    </div>
  </details>

  <details>
    <summary>Exercise 1.1.18 (Analysis): Lower Semicontinuous Maps Are Not Closed Under Composition</summary>
    <div class="details-body">
      <p><strong>Problem:</strong> Show that there exist two lower semicontinuous (l.s.c.) maps \\(f, g : \\mathbb{R} \\to \\mathbb{R}\\) such that \\(f \\circ g\\) is not lower semicontinuous.</p>
      <p><strong>Counterexample:</strong> Recall that \\(h : \\mathbb{R} \\to \\mathbb{R}\\) is lower semicontinuous iff for every \\(\\alpha \\in \\mathbb{R}\\), the sublevel/superlevel condition \\(\\{x : h(x) > \\alpha\\}\\) is open (equivalently \\(\\liminf_{x \\to x_0} h(x) \\ge h(x_0)\\)).</p>
      <ul>
        <li>Let \\(g(x) = -x\\), which is continuous (hence lower semicontinuous).</li>
        <li>Let \\(f(y) = \\mathbf{1}_{(0, \\infty)}(y)\\) (the indicator function of the open ray \\((0, \\infty)\\), which equals \\(0\\) for \\(y \\le 0\\) and \\(1\\) for \\(y > 0\\)). Since \\((0, \\infty)\\) is open, \\(f\\) is lower semicontinuous. Now perturb or compose with a map that sends \\(0\\) to a point where \\(f\\) jumps downward: take \\(g(x) = \\mathbf{1}_{(0, \\infty)}(x)\\) (l.s.c., since \\(g(0) = 0 \\le \\liminf_{x \\to 0} g(x)\\)) and \\(f(y) = -y\\) (continuous, hence l.s.c.).</li>
        <li>Then \\((f \\circ g)(x) = -\\mathbf{1}_{(0, \\infty)}(x)\\), which equals \\(0\\) at \\(x = 0\\) and \\(-1\\) for \\(x > 0\\). As \\(x \\to 0^+\\), \\(\\liminf_{x \\to 0} (f \\circ g)(x) = -1 < 0 = (f \\circ g)(0)\\), so \\(f \\circ g\\) is <em>upper</em> semicontinuous, not lower semicontinuous! \\(\\blacksquare\\)</li>
      </ul>
    </div>
  </details>

  <details>
    <summary>Exercise 1.1.19 (Analysis): Fixing Convex and Lower Semicontinuous Maps to Form a Category</summary>
    <div class="details-body">
      <p><strong>Problem:</strong> What additional requirement makes convex maps (or lower semicontinuous maps) closed under composition so they form a category?</p>
      <p><strong>Solution:</strong> Require the maps to be <strong>non-decreasing (monotone increasing)</strong>!</p>
      <ul>
        <li><strong>Convex + Non-decreasing:</strong> If \\(g\\) is convex and \\(f\\) is both convex and non-decreasing, then for \\(t \\in [0, 1]\\):
          \\[ g(tx + (1-t)y) \\le t g(x) + (1-t) g(y). \\]
          Applying the non-decreasing map \\(f\\) preserves the inequality, and convexity of \\(f\\) gives:
          \\[ f(g(tx + (1-t)y)) \\le f(t g(x) + (1-t) g(y)) \\le t f(g(x)) + (1-t) f(g(y)). \\]
          Moreover, the composition of two non-decreasing maps is non-decreasing, and \\(\\mathrm{id}_{\\mathbb{R}}(x) = x\\) is both convex and non-decreasing. Thus <strong>non-decreasing convex functions \\(\\mathbb{R} \\to \\mathbb{R}\\) do form a category</strong>!</li>
        <li><strong>Lower Semicontinuous + Non-decreasing:</strong> Similarly, non-decreasing lower semicontinuous functions \\(\\mathbb{R} \\to \\mathbb{R}\\) are closed under composition and include \\(\\mathrm{id}_{\\mathbb{R}}\\), so they also form a category.</li>
      </ul>
    </div>
  </details>

  <details>
    <summary>Exercises 1.1.21 &amp; 1.1.22: Small Thin Categories = Preorders; Locally Small 1-Object Categories = Monoids</summary>
    <div class="details-body">
      <p><strong>Exercise 1.1.21:</strong> Let \\(\\mathsf{C}\\) be a small category with at most one arrow between any two objects. Then \\(X := \\mathsf{C}_0\\) is a set. Define \\(x \\lesssim y \\iff \\mathrm{Hom}_{\\mathsf{C}}(x, y) \\neq \\emptyset\\). The existence of \\(\\mathrm{id}_x : x \\to x\\) gives reflexivity \\(x \\lesssim x\\), and composition \\((y \\to z) \\circ (x \\to y) = (x \\to z)\\) gives transitivity \\(x \\lesssim y \\land y \\lesssim z \\implies x \\lesssim z\\). Hence \\((X, \\lesssim)\\) is a preorder.</p>
      <p><strong>Exercise 1.1.22:</strong> Let \\(\\mathsf{C}\\) be a locally small category with a single object \\(\\bullet\\). Since \\(\\mathsf{C}\\) is locally small, \\(M := \\mathrm{Hom}_{\\mathsf{C}}(\\bullet, \\bullet)\\) is a honest set. Composition \\(\\circ : M \\times M \\to M\\) is an associative binary operation on \\(M\\) with two-sided neutral element \\(\\mathrm{id}_\\bullet \\in M\\). Thus \\((M, \\circ, \\mathrm{id}_\\bullet)\\) is a monoid.</p>
    </div>
  </details>

  <details>
    <summary>Exercises 1.1.26 &amp; 1.1.28 (Important!): Uniqueness of Inverses &amp; Composition of Isomorphisms</summary>
    <div class="details-body">
      <p><strong>Exercise 1.1.26 (Uniqueness of Inverses):</strong> Suppose \\(g, g' : Y \\to X\\) are both two-sided inverses of \\(f : X \\to Y\\). Using unitality, associativity, \\(f \\circ g' = \\mathrm{id}_Y\\), and \\(g \\circ f = \\mathrm{id}_X\\):</p>
      <p>\\[ g = g \\circ \\mathrm{id}_Y = g \\circ (f \\circ g') = (g \\circ f) \\circ g' = \\mathrm{id}_X \\circ g' = g'. \\]</p>
      <p>In particular, viewing a group \\(G\\) as \\(\\mathsf{B}G\\), inverses in a group are unique.</p>
      <p><strong>Exercise 1.1.28 (Composition of Invertible Morphisms):</strong> If \\(f : X \\to Y\\) has inverse \\(f^{-1} : Y \\to X\\) and \\(h : Y \\to Z\\) has inverse \\(h^{-1} : Z \\to Y\\), then \\((h \\circ f)^{-1} = f^{-1} \\circ h^{-1}\\), because:</p>
      <p>\\[ (f^{-1} \\circ h^{-1}) \\circ (h \\circ f) = f^{-1} \\circ (h^{-1} \\circ h) \\circ f = f^{-1} \\circ \\mathrm{id}_Y \\circ f = f^{-1} \\circ f = \\mathrm{id}_X, \\]</p>
      <p>and symmetrically \\((h \\circ f) \\circ (f^{-1} \\circ h^{-1}) = \\mathrm{id}_Z\\). (Notice the "shoe-sock" reversal of order!)</p>
    </div>
  </details>

  <details>
    <summary>Exercises 1.1.34 &amp; 1.1.37: Implicit Morphisms and Commutativity in Diagrams (a)–(h)</summary>
    <div class="details-body">
      <p>See <strong>Interactive Lab C</strong> above for a visual breakdown of each diagram (a)–(h):</p>
      <ul>
        <li><strong>Commute automatically:</strong> <strong>(a)</strong> (only \\(f\\)), <strong>(b)</strong> (diagonal is already \\(g \\circ f\\)), <strong>(f)</strong> (\\(f\\) and \\(f^{-1}\\) satisfy \\(f^{-1} \\circ f = \\mathrm{id}_X\\) and \\(f \\circ f^{-1} = \\mathrm{id}_Y\\)), and <strong>(g)</strong> (single directed edge \\(X \\xrightarrow{f} X\\) between distinct vertices).</li>
        <li><strong>Require equations to commute:</strong> <strong>(c)</strong> requires \\(g \\circ f = h\\); <strong>(d)</strong> requires \\(g \\circ f = \\mathrm{id}_X\\); <strong>(e)</strong> requires \\(g \\circ f = \\mathrm{id}_X\\) and \\(f \\circ g = \\mathrm{id}_Y\\) (which collapses the infinite tower \\(f, g, g\\circ f, f\\circ g, f\\circ g\\circ f, \\dots\\)); <strong>(h)</strong> requires \\(h \\circ f = g \\circ k\\).</li>
      </ul>
    </div>
  </details>

  <details>
    <summary>Exercises 1.1.38 &amp; 1.1.39: Preorder Commutativity &amp; Pasting Two Commutative Squares</summary>
    <div class="details-body">
      <p><strong>Exercise 1.1.38:</strong> In a preorder category, between any two objects \\(X\\) and \\(Y\\) there is <em>at most one</em> morphism \\(X \\to Y\\). Therefore, any two directed paths starting at \\(X\\) and ending at \\(Y\\) must yield morphisms in the singleton set \\(\\mathrm{Hom}(X, Y)\\), so they are automatically equal! Every diagram in a preorder commutes.</p>
      <p><strong>Exercise 1.1.39 (Diagram Pasting):</strong> Given \\(h \\circ f = p \\circ k\\) (left square) and \\(\\ell \\circ g = q \\circ h\\) (right square), the outer rectangle paths from \\(X\\) to \\(C\\) satisfy:</p>
      <p>\\[ \\ell \\circ g \\circ f = (\\ell \\circ g) \\circ f = (q \\circ h) \\circ f = q \\circ (h \\circ f) = q \\circ (p \\circ k) = q \\circ p \\circ k. \\quad \\blacksquare \\]</p>
    </div>
  </details>

  <details>
    <summary>Exercise 1.1.44 &amp; Corollaries 1.1.45–1.1.46: Duality in the Opposite Category C^op</summary>
    <div class="details-body">
      <p><strong>Exercise 1.1.44:</strong> Since \\(\\mathrm{Hom}_{\\mathsf{C}^{\\mathrm{op}}}(Y, X) = \\mathrm{Hom}_{\\mathsf{C}}(X, Y)\\) with \\(f^{\\mathrm{op}}\\) denoting the exact same underlying element \\(f\\), \\(f = g\\) in \\(\\mathsf{C}\\) if and only if \\(f^{\\mathrm{op}} = g^{\\mathrm{op}}\\) in \\(\\mathsf{C}^{\\mathrm{op}}\\). Thus \\(h \\circ f = g \\circ k \\iff (h \\circ f)^{\\mathrm{op}} = (g \\circ k)^{\\mathrm{op}} \\iff f^{\\mathrm{op}} \\circ h^{\\mathrm{op}} = k^{\\mathrm{op}} \\circ g^{\\mathrm{op}}\\), and the inverse of \\(f^{\\mathrm{op}}\\) is \\((f^{-1})^{\\mathrm{op}}\\). \\(\\blacksquare\\)</p>
    </div>
  </details>
</section>
`;
}

function buildSessionsBannerHtml(activeSlug, assetPrefix) {
  return `
<div class="session-switcher-banner" aria-label="Study group sessions">
  <div class="sidebar-section-title" style="margin-block-end:0.5rem;">Study Group Sessions &amp; Reading Progression</div>
  <div class="lab-grid" style="margin-block-start:0; gap:0.75rem;">
    <a href="${assetPrefix}sessions/001-categories.html" class="lab-panel" style="text-decoration:none; display:block; border-color:${
      activeSlug === "001-categories" ? "var(--color-brand)" : "var(--border-subtle)"
    }; background-color:${activeSlug === "001-categories" ? "var(--color-brand-soft)" : "var(--bg-canvas)"};">
      <div style="font-size:0.76rem; font-weight:700; color:var(--color-brand); text-transform:uppercase;">Session 001 • Bird's-Eye Overview</div>
      <div style="font-weight:700; color:var(--text-primary); margin-block:0.15rem;">III.8 Categories — Eugenia Cheng</div>
      <div style="font-size:0.82rem; color:var(--text-muted);">Princeton Companion to Mathematics (pp. 165–167): Structure-preserving maps, coproducts, functors, naturality.</div>
    </a>
    <a href="${assetPrefix}sessions/002-basic-concepts-categories.html" class="lab-panel" style="text-decoration:none; display:block; border-color:${
      activeSlug === "002-basic-concepts-categories" ? "var(--color-brand)" : "var(--border-subtle)"
    }; background-color:${activeSlug === "002-basic-concepts-categories" ? "var(--color-brand-soft)" : "var(--bg-canvas)"};">
      <div style="font-size:0.76rem; font-weight:700; color:var(--color-brand); text-transform:uppercase;">Session 002 • Main Textbook Ch. 1 (§1.1)</div>
      <div style="font-weight:700; color:var(--text-primary); margin-block:0.15rem;">1.1 Categories — Paolo Perrone</div>
      <div style="font-size:0.82rem; color:var(--text-muted);">Notes on Category Theory (pp. 8–23): Relations, Delooping BG &amp; Monoids, Convexity Counterexample, Groupoids, Diagrams &amp; C^op.</div>
    </a>
  </div>
</div>`;
}

function buildHtmlPage({ sessionInfo, meta, contentHtml, toc, assetPrefix = "" }) {
  const isPerrone11 = sessionInfo.slug === "001-basic-concepts-categories";
  const labsTocItems = isPerrone11
    ? [
        { id: "interactive-sandboxes", title: "9. Interactive Sandboxes for Section 1.1" },
        { id: "solutions-heading", title: "10. Complete Exercises &amp; Proofs from Section 1.1" }
      ]
    : [];

  const tocItemsHtml = [...toc, ...labsTocItems]
    .map((item) => `<li><a class="toc-link" href="#${item.id}">${item.title}</a></li>`)
    .join("\n");

  const tagsHtml = (meta.tags || []).map((t) => `<li class="tag-chip">${t}</li>`).join("");

  const sessionsSidebarHtml = SESSIONS_MANIFEST.map((s) => {
    const active = s.slug === sessionInfo.slug;
    return `<li><a class="toc-link" href="${assetPrefix}sessions/${s.htmlFile}" ${
      active ? 'aria-current="page" style="font-weight:700; color:var(--color-brand); background-color:var(--color-brand-soft);"' : ""
    }>${s.sidebarLabel}</a></li>`;
  }).join("\n");

  const labsHtml = isPerrone11 ? buildSession002LabsHtml() : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- MANDATORY: Declare support for both light and dark themes -->
  <meta name="color-scheme" content="light dark">
  <script>
    try {
      document.querySelector('meta[name="color-scheme"]').content = localStorage.getItem("color-scheme") ?? "light dark";
      if (localStorage.getItem("sidebar-collapsed") === "true") {
        document.documentElement.classList.add("sidebar-collapsed");
      }
    } catch {}
  </script>
  <title>Session 00${meta.session || 1}: ${meta.title || "Categories"} | Category Theory</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossorigin="anonymous">
  <link rel="stylesheet" href="${assetPrefix}assets/styles.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" crossorigin="anonymous"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js" crossorigin="anonymous"
    onload="renderMathInElement(document.body, { delimiters: [{left: '\\\\[', right: '\\\\]', display: true}, {left: '\\\\(', right: '\\\\)', display: false}] });"></script>
  <script defer src="${assetPrefix}assets/app.js"></script>
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <div class="brand-group">
        <button type="button" id="sidebar-toggle-btn" class="btn btn-icon sidebar-toggle" aria-label="Toggle sidebar panel" aria-expanded="true" aria-controls="sidebar-panel" title="Toggle sidebar panel (Ctrl+B)">
          <svg class="toggle-icon-collapse" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
            <path d="M16 10l-2 2 2 2"/>
          </svg>
          <svg class="toggle-icon-expand" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
            <path d="M14 10l2 2-2 2"/>
          </svg>
          <span class="sr-only">Toggle sidebar</span>
        </button>
        <a href="${assetPrefix}index.html" class="brand">
          <span class="brand-badge" aria-hidden="true">𝒞</span>
          <span>Category Theory</span>
        </a>
      </div>
      <nav class="header-nav" aria-label="Study group navigation">
        <ul>
          <li><a href="#interactive-sandboxes" class="nav-pill">Interactive Labs</a></li>
          <li><a href="#solutions-heading" class="nav-pill">Exercises &amp; Proofs</a></li>
          <li><a href="${assetPrefix}content/${sessionInfo.mdFile}" class="nav-pill">Markdown</a></li>
          <li><a href="${assetPrefix}${sessionInfo.pdfHref}" class="nav-pill">PDF</a></li>
        </ul>
        <button type="button" id="theme-toggle-btn" class="btn">
          <span aria-hidden="true">◐</span>
          <span class="theme-status-text">System</span>
        </button>
      </nav>
    </div>
  </header>

  <div class="workspace-grid" id="workspace-layout">
    <aside class="sidebar" id="sidebar-panel" aria-label="Table of contents">
      <div class="sidebar-header">
        <div class="sidebar-section-title">Navigation &amp; Outline</div>
        <button type="button" class="sidebar-collapse-inline-btn" aria-label="Collapse sidebar" title="Collapse sidebar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>
      <div class="sidebar-inner-content">
        <div class="sidebar-section-title">Study Sessions</div>
        <ul class="toc-list">
          ${sessionsSidebarHtml}
        </ul>
        <div class="sidebar-section-title">On This Page</div>
        <ul class="toc-list">
          ${tocItemsHtml}
        </ul>
        <div class="sidebar-section-title">Textbook Roadmap (Perrone)</div>
        <ul class="toc-list" style="font-size:0.82rem; color:var(--text-muted);">
          <li style="padding:0.25rem 0.55rem; color:var(--color-brand); font-weight:600;">✓ §1.1 Categories (pp. 8–23)</li>
          <li style="padding:0.25rem 0.55rem;">◦ §1.3 Products &amp; Coproducts</li>
          <li style="padding:0.25rem 0.55rem;">◦ §1.4 Functors</li>
          <li style="padding:0.25rem 0.55rem;">◦ §1.5 Natural Transformations</li>
        </ul>
      </div>
    </aside>

    <main class="content-column">
      <article>
        <div class="session-hero">
          <div class="session-meta-row">
            <span class="badge">Session 00${meta.session || 1}</span>
            <span>Author: <strong>${meta.author || "Paolo Perrone"}</strong></span>
            <span>•</span>
            <span><cite>${meta.source || ""}</cite></span>
          </div>
          ${contentHtml.split("\n")[0]}
        </div>

        ${contentHtml.split("\n").slice(1).join("\n")}
        ${labsHtml}
      </article>
    </main>
  </div>

  <footer class="site-footer">
    <div class="footer-inner">
      <div>
        <strong>Category Theory</strong> — Built from Markdown (<code>content/${sessionInfo.mdFile}</code>) with KaTeX &amp; Interactive SVG Commutative Diagrams.
      </div>
      <div>
        <a href="${assetPrefix}sessions/001-basic-concepts-categories.html">Session 001 (Perrone §1.1)</a> ·
        <a href="${assetPrefix}content/${sessionInfo.mdFile}">Raw Markdown</a> ·
        <a href="${assetPrefix}${sessionInfo.pdfHref}">PDF</a>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

function main() {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });

  for (const sessionInfo of SESSIONS_MANIFEST) {
    const mdPath = path.join(CONTENT_DIR, sessionInfo.mdFile);
    const rawMd = fs.readFileSync(mdPath, "utf8");

    // Sync root-level Markdown copy
    fs.writeFileSync(path.join(ROOT_DIR, sessionInfo.mdFile), rawMd, "utf8");

    const { meta, body } = parseFrontmatter(rawMd);
    const { html: contentHtml, toc } = convertMarkdownToHtml(body, `content/${sessionInfo.mdFile}`);

    // Write session permalink HTML
    const sessionHtml = buildHtmlPage({
      sessionInfo,
      meta,
      contentHtml,
      toc,
      assetPrefix: "../"
    });
    fs.writeFileSync(path.join(SESSIONS_DIR, sessionInfo.htmlFile), sessionHtml, "utf8");

    // Make Session 001 (Perrone §1.1) the default landing view on index.html
    if (sessionInfo.slug === "001-basic-concepts-categories") {
      const indexHtml = buildHtmlPage({
        sessionInfo,
        meta,
        contentHtml,
        toc,
        assetPrefix: ""
      });
      fs.writeFileSync(path.join(ROOT_DIR, "index.html"), indexHtml, "utf8");
    }
  }

  fs.writeFileSync(path.join(ROOT_DIR, ".nojekyll"), "", "utf8");
  console.log("Built Session 001 (001-basic-concepts-categories), index.html, root .md copy, and .nojekyll successfully.");
}

main();
