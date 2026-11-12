// Category Theory Study Group — Client-Side Interactive Engine

// 1. Dark Mode Toggle (modern-web-guidance: dark-mode-toggle)
function initColorSchemeToggle() {
  const meta = document.querySelector('meta[name="color-scheme"]');
  const toggleBtn = document.getElementById("theme-toggle-btn");
  const mql = window.matchMedia("(prefers-color-scheme: dark)");

  function getSystemScheme() {
    return mql.matches ? "dark" : "light";
  }

  function getStoredScheme() {
    try {
      const val = localStorage.getItem("color-scheme");
      return val === "light" || val === "dark" ? val : null;
    } catch {
      return null;
    }
  }

  function getRenderedScheme() {
    return getStoredScheme() ?? getSystemScheme();
  }

  function updateButtonLabel() {
    if (!toggleBtn) return;
    const rendered = getRenderedScheme();
    const stored = getStoredScheme();
    const nextScheme = rendered === "dark" ? "light" : "dark";
    const statusBadge = stored ? `Pinned ${stored}` : `System (${rendered})`;
    toggleBtn.querySelector(".theme-status-text").textContent = statusBadge;
    toggleBtn.setAttribute("aria-label", `Switch to ${nextScheme} theme (currently ${statusBadge})`);
  }

  if (toggleBtn && meta) {
    toggleBtn.addEventListener("click", () => {
      const systemScheme = getSystemScheme();
      const currentRendered = getRenderedScheme();
      const targetScheme = currentRendered === "dark" ? "light" : "dark";

      if (targetScheme !== systemScheme) {
        try {
          localStorage.setItem("color-scheme", targetScheme);
        } catch {}
        meta.content = targetScheme;
      } else {
        try {
          localStorage.removeItem("color-scheme");
        } catch {}
        meta.content = "light dark";
      }
      updateButtonLabel();
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key === "color-scheme" && meta) {
      meta.content = event.newValue ?? "light dark";
      updateButtonLabel();
    }
  });

  mql.addEventListener("change", () => {
    updateButtonLabel();
  });

  updateButtonLabel();
}

// 2. Accordion Expand / Collapse All (modern-web-guidance: accordion)
function initAccordions() {
  function toggleAllInAccordion(accordion, sourceBtn) {
    const expand = sourceBtn.getAttribute("aria-expanded") !== "true";
    for (const details of accordion.querySelectorAll(":scope > details")) {
      details.open = expand;
    }
  }

  document.addEventListener(
    "command",
    (event) => {
      if (event.command !== "--toggle-all") return;
      toggleAllInAccordion(event.target, event.source);
    },
    { capture: true }
  );

  // Fallback where Invoker Commands are not yet supported
  if (!Object.hasOwn(HTMLButtonElement.prototype, "commandForElement")) {
    document.addEventListener("click", (event) => {
      const btn = event.target.closest('button[command="--toggle-all"]');
      if (!btn) return;
      const targetId = btn.getAttribute("commandfor");
      const accordion = targetId ? document.getElementById(targetId) : btn.closest(".accordion");
      if (accordion) toggleAllInAccordion(accordion, btn);
    });
  }

  // Sync Expand/Collapse all button when individual details toggle
  document.addEventListener(
    "toggle",
    (event) => {
      if (!(event.target instanceof HTMLDetailsElement)) return;
      if (!event.target.matches(".accordion > details")) return;
      const accordion = event.target.parentElement;
      const button = accordion.querySelector('[command="--toggle-all"]');
      if (!button) return;
      const items = accordion.querySelectorAll(":scope > details");
      const allOpen = Array.prototype.every.call(items, (d) => d.open);
      button.setAttribute("aria-expanded", String(allOpen));
    },
    { capture: true }
  );
}

// 3. Interactive SVG Commutative Diagram Renderer & Path Tracer
const SVG_NS = "http://www.w3.org/2000/svg";

function createSvgElement(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, String(v));
  }
  return el;
}

function renderCommutativeDiagram(container, spec) {
  // Deep clone nodes so dragging doesn't mutate initial positions
  const initialNodes = JSON.parse(JSON.stringify(spec.nodes));
  const nodes = JSON.parse(JSON.stringify(spec.nodes));
  const edges = spec.edges || [];
  let activeFilter = "all";

  const svg = container.querySelector("svg.diagram-svg");
  if (!svg) return;

  const NODE_RADIUS = 24;

  function computeEdgeGeometry(fromNode, toNode, curve = 0) {
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;
    const nx = -uy;
    const ny = ux;

    if (!curve) {
      const startX = fromNode.x + ux * (NODE_RADIUS + 4);
      const startY = fromNode.y + uy * (NODE_RADIUS + 4);
      const endX = toNode.x - ux * (NODE_RADIUS + 8);
      const endY = toNode.y - uy * (NODE_RADIUS + 8);
      const midX = (startX + endX) / 2 + nx * 16;
      const midY = (startY + endY) / 2 + ny * 16;
      return {
        d: `M ${startX.toFixed(1)} ${startY.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`,
        labelX: midX,
        labelY: midY
      };
    } else {
      const ctrlX = (fromNode.x + toNode.x) / 2 + nx * curve;
      const ctrlY = (fromNode.y + toNode.y) / 2 + ny * curve;

      const startVecX = ctrlX - fromNode.x;
      const startVecY = ctrlY - fromNode.y;
      const startLen = Math.hypot(startVecX, startVecY) || 1;
      const startX = fromNode.x + (startVecX / startLen) * (NODE_RADIUS + 4);
      const startY = fromNode.y + (startVecY / startLen) * (NODE_RADIUS + 4);

      const endVecX = toNode.x - ctrlX;
      const endVecY = toNode.y - ctrlY;
      const endLen = Math.hypot(endVecX, endVecY) || 1;
      const endX = toNode.x - (endVecX / endLen) * (NODE_RADIUS + 8);
      const endY = toNode.y - (endVecY / endLen) * (NODE_RADIUS + 8);

      const t = 0.5;
      const bezMidX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * ctrlX + t * t * endX;
      const bezMidY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * ctrlY + t * t * endY;
      const offsetSign = curve >= 0 ? 1 : -1;

      return {
        d: `M ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`,
        labelX: bezMidX + nx * 14 * offsetSign,
        labelY: bezMidY + ny * 14 * offsetSign
      };
    }
  }

  function getEdgeStroke(edge) {
    if (activeFilter === "upper" && edge.path === "upper") return "var(--color-upper-path)";
    if (activeFilter === "lower" && edge.path === "lower") return "var(--color-lower-path)";
    if (activeFilter === "both") {
      if (edge.path === "upper" || edge.path === "left-triangle") return "var(--color-upper-path)";
      if (edge.path === "lower" || edge.path === "right-triangle") return "var(--color-lower-path)";
      if (edge.path === "universal" || edge.path === "diagonal" || edge.highlight) return "var(--color-universal)";
    }
    if (edge.highlight) return "var(--color-universal)";
    return "var(--text-primary)";
  }

  function getMarkerId(edge, idx) {
    return `arrow-${spec.id || "diag"}-${idx}`;
  }

  function draw() {
    svg.replaceChildren();

    const defs = createSvgElement("defs");
    edges.forEach((edge, idx) => {
      const strokeColor = getEdgeStroke(edge);
      const marker = createSvgElement("marker", {
        id: getMarkerId(edge, idx),
        viewBox: "0 0 10 10",
        refX: "7",
        refY: "5",
        markerWidth: "6.5",
        markerHeight: "6.5",
        orient: "auto-start-reverse"
      });
      const poly = createSvgElement("path", {
        d: "M 0 1.5 L 9 5 L 0 8.5 z",
        fill: strokeColor
      });
      marker.appendChild(poly);
      defs.appendChild(marker);
    });
    svg.appendChild(defs);

    // Optional category region backdrop for naturality diagram
    if (spec.type === "naturality") {
      const catXBox = createSvgElement("rect", {
        x: 28,
        y: 25,
        width: 115,
        height: 245,
        rx: 10,
        fill: "none",
        stroke: "var(--border-subtle)",
        "stroke-dasharray": "4 4"
      });
      const catXLabel = createSvgElement("text", {
        x: 85,
        y: 20,
        "text-anchor": "middle",
        fill: "var(--text-muted)",
        "font-size": "12",
        "font-weight": "600"
      });
      catXLabel.textContent = "Category X";

      const catYBox = createSvgElement("rect", {
        x: 245,
        y: 25,
        width: 345,
        height: 245,
        rx: 10,
        fill: "none",
        stroke: "var(--border-subtle)",
        "stroke-dasharray": "4 4"
      });
      const catYLabel = createSvgElement("text", {
        x: 418,
        y: 20,
        "text-anchor": "middle",
        fill: "var(--text-muted)",
        "font-size": "12",
        "font-weight": "600"
      });
      catYLabel.textContent = "Target Category Y (Naturality Square)";

      svg.appendChild(catXBox);
      svg.appendChild(catXLabel);
      svg.appendChild(catYBox);
      svg.appendChild(catYLabel);
    }

    // Draw edges
    edges.forEach((edge, idx) => {
      const fromNode = nodes[edge.from];
      const toNode = nodes[edge.to];
      if (!fromNode || !toNode) return;

      const geom = computeEdgeGeometry(fromNode, toNode, edge.curve || 0);
      const strokeColor = getEdgeStroke(edge);
      const isDimmed =
        (activeFilter === "upper" && edge.path && edge.path !== "upper") ||
        (activeFilter === "lower" && edge.path && edge.path !== "lower");

      const pathEl = createSvgElement("path", {
        id: `edge-path-${spec.id}-${idx}`,
        d: geom.d,
        fill: "none",
        stroke: strokeColor,
        "stroke-width": isDimmed ? "1.6" : edge.highlight || activeFilter !== "all" ? "2.8" : "2.1",
        "stroke-opacity": isDimmed ? "0.3" : "1",
        "marker-end": `url(#${getMarkerId(edge, idx)})`
      });

      if (edge.dashed) {
        pathEl.setAttribute("stroke-dasharray", "6 4");
      }

      svg.appendChild(pathEl);

      // Animated pulse particle when tracing paths
      const shouldAnimate =
        (activeFilter === "upper" && edge.path === "upper") ||
        (activeFilter === "lower" && edge.path === "lower") ||
        (activeFilter === "both" && edge.path && edge.path !== "source");

      if (shouldAnimate) {
        const dot = createSvgElement("circle", {
          r: "4.5",
          fill: strokeColor
        });
        const anim = createSvgElement("animateMotion", {
          dur: "1.6s",
          repeatCount: "indefinite",
          path: geom.d
        });
        dot.appendChild(anim);
        svg.appendChild(dot);
      }

      // Edge label pill
      const labelText = createSvgElement("text", {
        x: geom.labelX.toFixed(1),
        y: geom.labelY.toFixed(1),
        "text-anchor": "middle",
        "dominant-baseline": "central",
        fill: strokeColor,
        "font-size": "13.5",
        "font-family": "var(--font-serif)",
        "font-style": "italic",
        "font-weight": "600",
        opacity: isDimmed ? "0.35" : "1"
      });
      labelText.textContent = edge.label;
      svg.appendChild(labelText);
    });

    // Draw object nodes
    for (const [key, node] of Object.entries(nodes)) {
      const g = createSvgElement("g", {
        class: "diagram-node",
        "data-node-id": key,
        transform: `translate(${node.x}, ${node.y})`
      });

      const circle = createSvgElement("circle", {
        r: NODE_RADIUS,
        fill: "var(--bg-surface)",
        stroke: "var(--color-brand)",
        "stroke-width": "2"
      });

      const text = createSvgElement("text", {
        x: 0,
        y: 0,
        "text-anchor": "middle",
        "dominant-baseline": "central",
        fill: "var(--text-primary)",
        "font-family": "var(--font-serif)",
        "font-size": "14.5",
        "font-weight": "700"
      });
      text.textContent = node.label;

      g.appendChild(circle);
      g.appendChild(text);
      svg.appendChild(g);
    }
  }

  // Pointer dragging for object vertices
  let draggingKey = null;

  function getSvgCoords(evt) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = svg.getScreenCTM();
    return ctm ? pt.matrixTransform(ctm.inverse()) : { x: 0, y: 0 };
  }

  svg.addEventListener("pointerdown", (evt) => {
    const nodeGroup = evt.target.closest(".diagram-node");
    if (!nodeGroup) return;
    draggingKey = nodeGroup.getAttribute("data-node-id");
    svg.setPointerCapture(evt.pointerId);
  });

  svg.addEventListener("pointermove", (evt) => {
    if (!draggingKey || !nodes[draggingKey]) return;
    const coords = getSvgCoords(evt);
    nodes[draggingKey].x = Math.max(35, Math.min(685, coords.x));
    nodes[draggingKey].y = Math.max(35, Math.min(265, coords.y));
    draw();
  });

  svg.addEventListener("pointerup", () => {
    draggingKey = null;
  });

  // Control buttons
  const controls = container.querySelectorAll("[data-diagram-action]");
  controls.forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-diagram-action");
      if (action === "reset") {
        for (const k of Object.keys(initialNodes)) {
          nodes[k] = { ...initialNodes[k] };
        }
        activeFilter = "all";
        controls.forEach((b) => b.classList.remove("active-upper", "active-lower", "active-both"));
      } else {
        activeFilter = activeFilter === action ? "all" : action;
        controls.forEach((b) => b.classList.remove("active-upper", "active-lower", "active-both"));
        if (activeFilter === "upper") btn.classList.add("active-upper");
        if (activeFilter === "lower") btn.classList.add("active-lower");
        if (activeFilter === "both") btn.classList.add("active-both");
      }
      draw();
    });
  });

  draw();
}

function initAllDiagrams() {
  document.querySelectorAll(".diagram-card[data-diagram-spec]").forEach((card) => {
    try {
      const spec = JSON.parse(card.getAttribute("data-diagram-spec"));
      renderCommutativeDiagram(card, spec);
    } catch (err) {
      console.error("Failed to parse diagram spec:", err);
    }
  });
}

// 4. Interactive Lab 1: Eugenia Cheng's 4 Surprising Categories Composer
function initCategoryComposerLab() {
  const selectEl = document.getElementById("category-example-select");
  const morphFSelect = document.getElementById("morphism-f-select");
  const morphGSelect = document.getElementById("morphism-g-select");
  const outputBox = document.getElementById("category-composer-output");
  if (!selectEl || !morphFSelect || !morphGSelect || !outputBox) return;

  const catalog = {
    mat: {
      name: "Mat_R (Natural Numbers & Real Matrices)",
      objects: "Natural numbers n ∈ ℕ (here 2 → 3 → 2)",
      fOptions: [
        {
          label: "f : 2 → 3  given by  [[1, 2, 0], [0, 1, -1]]",
          mat: [
            [1, 2, 0],
            [0, 1, -1]
          ]
        },
        {
          label: "f : 2 → 3  given by  [[2, 0, 1], [1, 3, 2]]",
          mat: [
            [2, 0, 1],
            [1, 3, 2]
          ]
        }
      ],
      gOptions: [
        {
          label: "g : 3 → 2  given by  [[1, 0], [2, 1], [-1, 3]]",
          mat: [
            [1, 0],
            [2, 1],
            [-1, 3]
          ]
        },
        {
          label: "g : 3 → 2  given by  [[0, 2], [1, -1], [4, 1]]",
          mat: [
            [0, 2],
            [1, -1],
            [4, 1]
          ]
        }
      ],
      compute(f, g) {
        // Multiply 2x3 matrix f with 3x2 matrix g -> 2x2 composite
        const res = [
          [0, 0],
          [0, 0]
        ];
        for (let i = 0; i < 2; i++) {
          for (let j = 0; j < 2; j++) {
            for (let k = 0; k < 3; k++) {
              res[i][j] += f.mat[i][k] * g.mat[k][j];
            }
          }
        }
        return {
          title: "Composite Morphism g ∘ f : 2 → 2 (Matrix Product)",
          formula: `g ∘ f = [[${res[0][0]}, ${res[0][1]}], [${res[1][0]}, ${res[1][1]}]]`,
          note: "Even though numbers 2 and 3 are not sets of elements here, 2×3 and 3×2 matrices compose associatively with identity matrices I_2 and I_3!"
        };
      }
    },
    poset: {
      name: "Ordered Set (Poset) Category (ℕ, ≤)",
      objects: "Numbers x, y, z with unique arrow x → y iff x ≤ y",
      fOptions: [
        { label: "Assertion  2 ≤ 5   (arrow 2 → 5)", from: 2, to: 5 },
        { label: "Assertion  3 ≤ 5   (arrow 3 → 5)", from: 3, to: 5 }
      ],
      gOptions: [
        { label: "Assertion  5 ≤ 11  (arrow 5 → 11)", from: 5, to: 11 },
        { label: "Assertion  5 ≤ 5   (identity arrow id_5)", from: 5, to: 5 }
      ],
      compute(f, g) {
        return {
          title: `Composite Morphism g ∘ f : ${f.from} → ${g.to}`,
          formula: `("${f.from} ≤ ${f.to}")  and  ("${g.from} ≤ ${g.to}")   ⟹   ("${f.from} ≤ ${g.to}")`,
          note: "In a poset category, there is at most one morphism between any two objects, so EVERY diagram automatically commutes by transitivity!"
        };
      }
    },
    group: {
      name: "One-Object Group Category B(ℤ/4ℤ)",
      objects: "Single object • (morphisms • → • are elements of ℤ/4ℤ)",
      fOptions: [
        { label: "f = [1] ∈ ℤ/4ℤ  (90° rotation)", val: 1 },
        { label: "f = [2] ∈ ℤ/4ℤ  (180° rotation)", val: 2 },
        { label: "f = [3] ∈ ℤ/4ℤ  (270° rotation)", val: 3 }
      ],
      gOptions: [
        { label: "g = [1] ∈ ℤ/4ℤ  (90° rotation)", val: 1 },
        { label: "g = [3] ∈ ℤ/4ℤ  (270° rotation)", val: 3 },
        { label: "g = [0] ∈ ℤ/4ℤ  (identity element e)", val: 0 }
      ],
      compute(f, g) {
        const comp = (g.val + f.val) % 4;
        const invComp = (4 - comp) % 4;
        return {
          title: "Composite Loop g ∘ f : • → •",
          formula: `[${g.val}] ∘ [${f.val}] = [${comp}] (mod 4)   |   Two-sided inverse: [${invComp}]`,
          note: "Because every group element has an inverse, every morphism in B(G) is an isomorphism (a one-object groupoid)."
        };
      }
    },
    pi1: {
      name: "Fundamental Group Functor π₁ : Top_* → Grp",
      objects: "Pointed circle (S¹, s₀) mapped to π₁(S¹, s₀) ≅ ℤ",
      fOptions: [
        { label: "f : (S¹, s₀) → (S¹, s₀), z ↦ z²  (winding degree 2)", deg: 2 },
        { label: "f : (S¹, s₀) → (S¹, s₀), z ↦ z³  (winding degree 3)", deg: 3 }
      ],
      gOptions: [
        { label: "g : (S¹, s₀) → (S¹, s₀), z ↦ z⁴  (winding degree 4)", deg: 4 },
        { label: "g : (S¹, s₀) → (S¹, s₀), z ↦ z⁻¹ (winding degree -1)", deg: -1 }
      ],
      compute(f, g) {
        const totalDeg = g.deg * f.deg;
        return {
          title: "Functorial Image π₁(g ∘ f) = π₁(g) ∘ π₁(f) : ℤ → ℤ",
          formula: `π₁(g ∘ f)([γ]) = ${totalDeg} · [γ] = ${g.deg} · (${f.deg} · [γ]) = π₁(g)(π₁(f)([γ]))`,
          note: "Continuous map composition in Top_* becomes group homomorphism composition in Grp via the functor π₁."
        };
      }
    }
  };

  function populateMorphisms() {
    const entry = catalog[selectEl.value];
    morphFSelect.replaceChildren();
    morphGSelect.replaceChildren();

    entry.fOptions.forEach((opt, i) => {
      const o = document.createElement("option");
      o.value = String(i);
      o.textContent = opt.label;
      morphFSelect.appendChild(o);
    });
    entry.gOptions.forEach((opt, i) => {
      const o = document.createElement("option");
      o.value = String(i);
      o.textContent = opt.label;
      morphGSelect.appendChild(o);
    });
    updateResult();
  }

  function updateResult() {
    const entry = catalog[selectEl.value];
    const f = entry.fOptions[Number(morphFSelect.value) || 0];
    const g = entry.gOptions[Number(morphGSelect.value) || 0];
    const res = entry.compute(f, g);

    outputBox.innerHTML = `
      <div style="font-weight:700; margin-block-end:0.3rem; color:var(--color-brand);">${res.title}</div>
      <div style="font-family:var(--font-mono); font-size:0.9rem; margin-block-end:0.45rem;">${res.formula}</div>
      <div style="font-size:0.84rem; color:var(--text-muted);">${res.note}</div>
    `;
  }

  selectEl.addEventListener("change", populateMorphisms);
  morphFSelect.addEventListener("change", updateResult);
  morphGSelect.addEventListener("change", updateResult);
  populateMorphisms();
}

// 5. Interactive Lab 2: Disjoint Union (U = A ⊔ B) Universal Property Explorer
function initCoproductLab() {
  const controlsWrap = document.getElementById("coproduct-controls");
  const summaryOut = document.getElementById("coproduct-universal-output");
  if (!controlsWrap || !summaryOut) return;

  const selects = controlsWrap.querySelectorAll("select[data-source-elem]");

  function updateUniversalMap() {
    const mapValues = {};
    selects.forEach((sel) => {
      mapValues[sel.getAttribute("data-source-elem")] = sel.value;
    });

    summaryOut.innerHTML = `
      <div style="font-weight:700; margin-block-end:0.4rem; color:var(--color-universal);">
        Unique Mediating Morphism  h : A ⊔ B → X  (h ∘ p = f  and  h ∘ q = g)
      </div>
      <div style="font-family:var(--font-mono); font-size:0.86rem; line-height:1.7;">
        h(p(a₁)) = f(a₁) = <strong>${mapValues.a1}</strong> &nbsp;|&nbsp;
        h(p(a₂)) = f(a₂) = <strong>${mapValues.a2}</strong><br>
        h(q(b₁)) = g(b₁) = <strong>${mapValues.b1}</strong> &nbsp;|&nbsp;
        h(q(b₂)) = g(b₂) = <strong>${mapValues.b2}</strong>
      </div>
      <div style="margin-block-start:0.45rem; font-size:0.82rem; color:var(--text-muted);">
        Because p(A) and q(B) partition U = A ⊔ B with no overlap and no missing elements, this function h : U → X is <strong>uniquely forced</strong>.
      </div>
    `;
  }

  selects.forEach((sel) => sel.addEventListener("change", updateUniversalMap));
  updateUniversalMap();
}

// 6. Interactive Lab 3: Live Commutative Diagram Sandbox
function initDiagramSandbox() {
  const editor = document.getElementById("sandbox-diagram-json");
  const previewCard = document.getElementById("sandbox-diagram-card");
  const statusEl = document.getElementById("sandbox-status");
  if (!editor || !previewCard) return;

  function updateSandbox() {
    try {
      const parsed = JSON.parse(editor.value);
      previewCard.setAttribute("data-diagram-spec", JSON.stringify(parsed));
      renderCommutativeDiagram(previewCard, parsed);
      if (statusEl) {
        statusEl.textContent = "Valid diagram specification — drag nodes in the preview!";
        statusEl.style.color = "var(--color-upper-path)";
      }
    } catch (e) {
      if (statusEl) {
        statusEl.textContent = `JSON syntax error: ${e.message}`;
        statusEl.style.color = "#dc2626";
      }
    }
  }

  editor.addEventListener("input", updateSandbox);
  updateSandbox();
}

// 7. Sidebar Folding & Keyboard Shortcut
function initSidebarToggle() {
  const toggleBtn = document.getElementById("sidebar-toggle-btn");
  const inlineCollapseBtn = document.querySelector(".sidebar-collapse-inline-btn");
  const html = document.documentElement;

  function updateAriaState(isCollapsed) {
    if (toggleBtn) {
      toggleBtn.setAttribute("aria-expanded", String(!isCollapsed));
      toggleBtn.setAttribute(
        "aria-label",
        isCollapsed ? "Expand sidebar panel (Ctrl+B)" : "Collapse sidebar panel (Ctrl+B)"
      );
    }
  }

  function setSidebarCollapsed(collapsed) {
    if (collapsed) {
      html.classList.add("sidebar-collapsed");
      try {
        localStorage.setItem("sidebar-collapsed", "true");
      } catch {}
    } else {
      html.classList.remove("sidebar-collapsed");
      try {
        localStorage.removeItem("sidebar-collapsed");
      } catch {}
    }
    updateAriaState(collapsed);
  }

  function toggleSidebar() {
    const isCurrentlyCollapsed = html.classList.contains("sidebar-collapsed");
    setSidebarCollapsed(!isCurrentlyCollapsed);
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", toggleSidebar);
  }

  if (inlineCollapseBtn) {
    inlineCollapseBtn.addEventListener("click", () => setSidebarCollapsed(true));
  }

  // Keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
      // Don't intercept if user is typing inside an input/textarea
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      e.preventDefault();
      toggleSidebar();
    }
  });

  // Ensure initial aria-expanded matches current class
  updateAriaState(html.classList.contains("sidebar-collapsed"));
}

// 8. Session 002 Lab A: Convexity Failure & Composition Visualizer (Example 1.1.17)
function initConvexityLab() {
  const fnSelect = document.getElementById("convex-fn-select");
  const svg = document.getElementById("convex-plot-svg");
  const outBox = document.getElementById("convex-test-output");
  if (!fnSelect || !svg || !outBox) return;

  const functions = {
    f: {
      name: "f(x) = x²  (Strictly Convex)",
      eval: (x) => x * x,
      isConvex: true,
      desc: "Parabola opening upward: every secant chord between x = -1 and x = +1 lies on or above the graph."
    },
    g: {
      name: "g(x) = x² - 1  (Strictly Convex)",
      eval: (x) => x * x - 1,
      isConvex: true,
      desc: "Shifted parabola: still strictly convex on ℝ, taking negative values on (-1, 1)."
    },
    fog: {
      name: "(f ∘ g)(x) = (x² - 1)²  (NOT Convex!)",
      eval: (x) => Math.pow(x * x - 1, 2),
      isConvex: false,
      desc: "Quartic 'W' curve! At x = ±1, (f ∘ g)(±1) = 0, but at the midpoint x = 0, (f ∘ g)(0) = 1 > 0. The secant segment lies BELOW the curve!"
    },
    fixed: {
      name: "Cured (Ex. 1.1.19): f(y) = max(0, y)² (Convex & Non-Decreasing)",
      eval: (x) => {
        const gx = x * x - 1;
        const m = Math.max(0, gx);
        return m * m;
      },
      isConvex: true,
      desc: "When the outer map f is both convex AND non-decreasing (monotone), f ∘ g is guaranteed to remain convex!"
    }
  };

  function drawPlot() {
    const key = fnSelect.value;
    const item = functions[key] || functions.fog;
    svg.replaceChildren();

    // Coordinate transform: x in [-1.8, 1.8] -> [40, 460], y in [-1.2, 2.2] -> [215, 25]
    const toX = (x) => 250 + (x / 1.8) * 200;
    const toY = (y) => 155 - (y / 2.2) * 120;

    // Axes
    const xAxis = createSvgElement("line", {
      x1: 30,
      y1: toY(0),
      x2: 470,
      y2: toY(0),
      stroke: "var(--border-subtle)",
      "stroke-width": "1.5"
    });
    const yAxis = createSvgElement("line", {
      x1: toX(0),
      y1: 15,
      x2: toX(0),
      y2: 225,
      stroke: "var(--border-subtle)",
      "stroke-width": "1.5"
    });
    svg.appendChild(xAxis);
    svg.appendChild(yAxis);

    // Sample curve points
    const pts = [];
    for (let x = -1.65; x <= 1.65; x += 0.04) {
      const y = item.eval(x);
      if (y <= 2.3 && y >= -1.2) {
        pts.push(`${toX(x).toFixed(1)},${toY(y).toFixed(1)}`);
      }
    }
    const curve = createSvgElement("polyline", {
      points: pts.join(" "),
      fill: "none",
      stroke: item.isConvex ? "var(--color-upper-path)" : "#dc2626",
      "stroke-width": "3"
    });
    svg.appendChild(curve);

    // Secant line between x = -1 and x = +1
    const yLeft = item.eval(-1);
    const yRight = item.eval(1);
    const yMidCurve = item.eval(0);
    const yMidSecant = 0.5 * (yLeft + yRight);

    const secant = createSvgElement("line", {
      x1: toX(-1),
      y1: toY(yLeft),
      x2: toX(1),
      y2: toY(yRight),
      stroke: "var(--color-lower-path)",
      "stroke-width": "2",
      "stroke-dasharray": "5 4"
    });
    svg.appendChild(secant);

    // Highlight x = -1, 0, +1 points
    [
      { x: -1, y: yLeft, label: "x=-1" },
      { x: 1, y: yRight, label: "x=+1" },
      { x: 0, y: yMidCurve, label: `x=0 (y=${yMidCurve})` }
    ].forEach((pt) => {
      const c = createSvgElement("circle", {
        cx: toX(pt.x),
        cy: toY(pt.y),
        r: "5",
        fill: item.isConvex ? "var(--color-brand)" : "#dc2626"
      });
      const t = createSvgElement("text", {
        x: toX(pt.x) + (pt.x === 0 ? 10 : pt.x < 0 ? -28 : 8),
        y: toY(pt.y) - 10,
        fill: "var(--text-primary)",
        "font-size": "11.5",
        "font-weight": "600"
      });
      t.textContent = pt.label;
      svg.appendChild(c);
      svg.appendChild(t);
    });

    outBox.innerHTML = `
      <div style="font-weight:700; margin-block-end:0.3rem; color:${item.isConvex ? "var(--color-upper-path)" : "#dc2626"};">
        ${item.name}
      </div>
      <div style="font-family:var(--font-mono); font-size:0.86rem; margin-block-end:0.35rem;">
        Midpoint Test on [-1, 1]:  h(0) = ${yMidCurve}  ${yMidCurve <= yMidSecant ? "≤" : ">"}  ½(h(-1) + h(1)) = ${yMidSecant}
      </div>
      <div style="font-size:0.84rem; color:var(--text-muted);">${item.desc}</div>
    `;
  }

  fnSelect.addEventListener("change", drawPlot);
  drawPlot();
}

// 9. Session 002 Lab B: Exercise 1.1.34 & 1.1.37 Diagram Inspector
function initDiagramInspectorLab() {
  const selectEl = document.getElementById("ex-1-1-34-select");
  const cardEl = document.getElementById("ex-1-1-34-card");
  const infoEl = document.getElementById("ex-1-1-34-info");
  if (!selectEl || !cardEl || !infoEl) return;

  const cases = {
    a: {
      spec: {
        id: "ex34-a",
        title: "Diagram (a): Single Arrow",
        type: "square",
        nodes: { X: { label: "X", x: 200, y: 150 }, Y: { label: "Y", x: 500, y: 150 } },
        edges: [{ from: "X", to: "Y", label: "f", path: "upper" }]
      },
      explicit: "f : X → Y",
      implicit: "id_X : X → X,  id_Y : Y → Y  (Note: f ∘ id_X = f and id_Y ∘ f = f by unitality)",
      totalCount: "3 morphisms total",
      commutes: "Always commutes! There is at most one non-trivial path between any two vertices."
    },
    b: {
      spec: {
        id: "ex34-b",
        title: "Diagram (b): Triangle with Composite g ∘ f",
        type: "square",
        nodes: {
          X: { label: "X", x: 180, y: 80 },
          Y: { label: "Y", x: 500, y: 80 },
          Z: { label: "Z", x: 500, y: 230 }
        },
        edges: [
          { from: "X", to: "Y", label: "f", path: "upper" },
          { from: "Y", to: "Z", label: "g", path: "upper" },
          { from: "X", to: "Z", label: "g ∘ f", path: "lower" }
        ]
      },
      explicit: "f : X → Y,  g : Y → Z,  and  g ∘ f : X → Z",
      implicit: "id_X, id_Y, id_Z",
      totalCount: "6 morphisms total",
      commutes: "Always commutes automatically! The diagonal arrow is literally labeled by the composite g ∘ f."
    },
    c: {
      spec: {
        id: "ex34-c",
        title: "Diagram (c): Triangle with Third Arrow h",
        type: "square",
        nodes: {
          X: { label: "X", x: 180, y: 80 },
          Y: { label: "Y", x: 500, y: 80 },
          Z: { label: "Z", x: 500, y: 230 }
        },
        edges: [
          { from: "X", to: "Y", label: "f", path: "upper" },
          { from: "Y", to: "Z", label: "g", path: "upper" },
          { from: "X", to: "Z", label: "h", path: "lower" }
        ]
      },
      explicit: "f : X → Y,  g : Y → Z,  h : X → Z",
      implicit: "id_X, id_Y, id_Z,  and the composite  g ∘ f : X → Z  (distinct from h a priori!)",
      totalCount: "7 morphisms a priori",
      commutes: "Does NOT commute automatically. Commutes if and only if we require g ∘ f = h."
    },
    d: {
      spec: {
        id: "ex34-d",
        title: "Diagram (d): Triangle with X Repeated",
        type: "square",
        nodes: {
          X1: { label: "X", x: 180, y: 80 },
          Y: { label: "Y", x: 500, y: 80 },
          X2: { label: "X", x: 500, y: 230 }
        },
        edges: [
          { from: "X1", to: "Y", label: "f", path: "upper" },
          { from: "Y", to: "X2", label: "g", path: "upper" },
          { from: "X1", to: "X2", label: "id_X", path: "lower" }
        ]
      },
      explicit: "f : X → Y,  g : Y → X,  id_X : X → X",
      implicit: "id_Y : Y → Y,  and the composite  g ∘ f : X → X",
      totalCount: "5 morphisms along paths from top-left X to bottom-right X",
      commutes: "Does NOT commute automatically. Commutes if and only if g ∘ f = id_X (i.e. g is a left inverse / retraction of f)."
    },
    e: {
      spec: {
        id: "ex34-e",
        title: "Diagram (e): Bidirectional Arrows Between X and Y",
        type: "square",
        nodes: { X: { label: "X", x: 200, y: 150 }, Y: { label: "Y", x: 500, y: 150 } },
        edges: [
          { from: "X", to: "Y", label: "f", curve: -40, path: "upper" },
          { from: "Y", to: "X", label: "g", curve: -40, path: "lower" }
        ]
      },
      explicit: "f : X → Y,  g : Y → X",
      implicit: "id_X, id_Y, plus INFINITELY MANY alternating composites: g∘f, f∘g, f∘g∘f, g∘f∘g, (g∘f)², ...",
      totalCount: "Infinitely many morphisms in general!",
      commutes: "Does NOT commute automatically. Commutes iff g ∘ f = id_X AND f ∘ g = id_Y (so f and g are mutual inverses!)."
    },
    f: {
      spec: {
        id: "ex34-f",
        title: "Diagram (f): Morphism f and Its Inverse f⁻¹",
        type: "square",
        nodes: { X: { label: "X", x: 200, y: 150 }, Y: { label: "Y", x: 500, y: 150 } },
        edges: [
          { from: "X", to: "Y", label: "f", curve: -40, path: "upper" },
          { from: "Y", to: "X", label: "f⁻¹", curve: -40, path: "lower" }
        ]
      },
      explicit: "f : X → Y,  f⁻¹ : Y → X",
      implicit: "id_X = f⁻¹ ∘ f  and  id_Y = f ∘ f⁻¹  (all longer alternating chains collapse by inverse laws!)",
      totalCount: "Only 4 distinct morphisms: id_X, id_Y, f, f⁻¹",
      commutes: "Always commutes! Because f⁻¹ is defined as the two-sided inverse of f, every round-trip equals the identity."
    },
    g: {
      spec: {
        id: "ex34-g",
        title: "Diagram (g): Endomorphism X → X",
        type: "square",
        nodes: { X1: { label: "X", x: 200, y: 150 }, X2: { label: "X", x: 500, y: 150 } },
        edges: [{ from: "X1", to: "X2", label: "f", path: "upper" }]
      },
      explicit: "f : X → X (drawn between two copies of vertex X)",
      implicit: "id_X : X → X (note: if drawn as a single vertex loop, all powers f², f³, ... are generated; as two distinct vertices X → X with no arrow back, only id_X and f appear).",
      totalCount: "2 morphisms (id_X and f) for two distinct vertices X → X",
      commutes: "Always commutes when drawn with two separate vertices (only one path from left X to right X)."
    },
    h: {
      spec: {
        id: "ex34-h",
        title: "Diagram (h): Square of Four Morphisms",
        type: "square",
        nodes: {
          X: { label: "X", x: 180, y: 70 },
          Y: { label: "Y", x: 500, y: 70 },
          A: { label: "A", x: 180, y: 230 },
          B: { label: "B", x: 500, y: 230 }
        },
        edges: [
          { from: "X", to: "Y", label: "f", path: "upper" },
          { from: "Y", to: "B", label: "h", path: "upper" },
          { from: "X", to: "A", label: "k", path: "lower" },
          { from: "A", to: "B", label: "g", path: "lower" }
        ]
      },
      explicit: "f : X → Y,  h : Y → B,  k : X → A,  g : A → B",
      implicit: "id_X, id_Y, id_A, id_B,  plus the two diagonal composites  h ∘ f : X → B  and  g ∘ k : X → B",
      totalCount: "10 morphisms a priori",
      commutes: "Does NOT commute automatically. Commutes if and only if h ∘ f = g ∘ k."
    }
  };

  function updateInspector() {
    const entry = cases[selectEl.value] || cases.a;
    cardEl.setAttribute("data-diagram-spec", JSON.stringify(entry.spec));
    renderCommutativeDiagram(cardEl, entry.spec);
    infoEl.innerHTML = `
      <div style="margin-block-end:0.35rem;"><strong>Explicitly drawn:</strong> <code>${entry.explicit}</code></div>
      <div style="margin-block-end:0.35rem;"><strong>Implicitly present:</strong> <code>${entry.implicit}</code></div>
      <div style="margin-block-end:0.35rem;"><strong>Count:</strong> ${entry.totalCount}</div>
      <div style="color:var(--color-brand); font-weight:600;"><strong>Commutativity (Ex. 1.1.37):</strong> ${entry.commutes}</div>
    `;
  }

  selectEl.addEventListener("change", updateInspector);
  updateInspector();
}

// 10. Session 002 Lab C: Opposite Category C <-> C^op Dualizer (§1.1.7)
function initDualityFlipperLab() {
  const toggleBtn = document.getElementById("duality-flip-btn");
  const cardEl = document.getElementById("duality-flip-card");
  const eqOut = document.getElementById("duality-flip-equation");
  if (!toggleBtn || !cardEl || !eqOut) return;

  let isOp = false;

  const baseSpec = {
    id: "duality-interactive",
    title: "Square in Category C",
    type: "square",
    nodes: {
      X: { label: "X", x: 180, y: 70 },
      Y: { label: "Y", x: 520, y: 70 },
      A: { label: "A", x: 180, y: 230 },
      B: { label: "B", x: 520, y: 230 }
    },
    edges: [
      { from: "X", to: "Y", label: "f", path: "upper" },
      { from: "Y", to: "B", label: "h", path: "upper" },
      { from: "X", to: "A", label: "k", path: "lower" },
      { from: "A", to: "B", label: "g", path: "lower" },
      { from: "X", to: "B", label: "h ∘ f = g ∘ k", dashed: true, highlight: true, path: "diagonal" }
    ]
  };

  const opSpec = {
    id: "duality-interactive-op",
    title: "Dual Square in Opposite Category C^op (All Arrows Reversed!)",
    type: "square",
    nodes: {
      X: { label: "X", x: 180, y: 70 },
      Y: { label: "Y", x: 520, y: 70 },
      A: { label: "A", x: 180, y: 230 },
      B: { label: "B", x: 520, y: 230 }
    },
    edges: [
      { from: "Y", to: "X", label: "f^op", path: "upper" },
      { from: "B", to: "Y", label: "h^op", path: "upper" },
      { from: "A", to: "X", label: "k^op", path: "lower" },
      { from: "B", to: "A", label: "g^op", path: "lower" },
      { from: "B", to: "X", label: "f^op ∘ h^op = k^op ∘ g^op", dashed: true, highlight: true, path: "diagonal" }
    ]
  };

  function renderState() {
    const spec = isOp ? opSpec : baseSpec;
    cardEl.setAttribute("data-diagram-spec", JSON.stringify(spec));
    renderCommutativeDiagram(cardEl, spec);
    toggleBtn.textContent = isOp ? "Switch back to Original Category C" : "Reverse All Arrows → Dualize to C^op";
    eqOut.innerHTML = isOp
      ? `<strong>In C<sup>op</sup>:</strong> Source is now <code>B</code> and target is <code>X</code>. Commutativity equation reverses composition order: <code>f^op ∘ h^op = k^op ∘ g^op</code>, which is <code>(h ∘ f)^op = (g ∘ k)^op</code>.`
      : `<strong>In C:</strong> Source is <code>X</code> and target is <code>B</code>. Commutativity equation: <code>h ∘ f = g ∘ k : X → B</code>.`;
  }

  toggleBtn.addEventListener("click", () => {
    isOp = !isOp;
    renderState();
  });

  renderState();
}

document.addEventListener("DOMContentLoaded", () => {
  initColorSchemeToggle();
  initSidebarToggle();
  initAccordions();
  initAllDiagrams();
  initCategoryComposerLab();
  initCoproductLab();
  initDiagramSandbox();
  initConvexityLab();
  initDiagramInspectorLab();
  initDualityFlipperLab();
});
