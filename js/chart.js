// Small single-series SVG line charts with a hover crosshair and tooltip.
const NS = "http://www.w3.org/2000/svg";

const el = (name, attrs = {}) => {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
};

// points: [{ x, y, label, marks }]; label is the tooltip text for that point,
// marks (optional) draws an error dot on the line there, larger for more errors.
export function lineChart(host, points, { height = 140, yLabel = "WPM", xLabel = "" } = {}) {
  host.replaceChildren();
  if (points.length < 2) {
    host.textContent = "Not enough data yet.";
    host.classList.add("chart-empty");
    return;
  }
  host.classList.remove("chart-empty");
  const width = host.clientWidth || 560;
  const pad = { top: 12, right: 12, bottom: 22, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const xs = points.map((p) => p.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const maxY = niceMax(Math.max(...points.map((p) => p.y), 10));
  const sx = (x) => pad.left + ((x - minX) / (maxX - minX || 1)) * innerW;
  const sy = (y) => pad.top + innerH - (y / maxY) * innerH;

  const svg = el("svg", { viewBox: `0 0 ${width} ${height}`, width, height, role: "img", "aria-label": `${yLabel} chart` });
  for (const t of [0, maxY / 2, maxY]) {
    svg.append(el("line", { x1: pad.left, x2: width - pad.right, y1: sy(t), y2: sy(t), class: "grid" }));
    const label = el("text", { x: pad.left - 6, y: sy(t) + 4, class: "axis", "text-anchor": "end" });
    label.textContent = Math.round(t);
    svg.append(label);
  }
  for (const x of [minX, maxX]) {
    const label = el("text", { x: sx(x), y: height - 6, class: "axis", "text-anchor": x === minX ? "start" : "end" });
    label.textContent = `${x}${xLabel}`;
    svg.append(label);
  }
  const d = points.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join("");
  svg.append(el("path", { d, class: "line" }));
  for (const p of points) {
    if (p.marks) svg.append(el("circle", { cx: sx(p.x), cy: sy(p.y), r: 2.5 + Math.min(p.marks, 4) * 0.75, class: "err" }));
  }
  const cross = el("line", { y1: pad.top, y2: pad.top + innerH, class: "cross", visibility: "hidden" });
  const dot = el("circle", { r: 4.5, class: "dot", visibility: "hidden" });
  svg.append(cross, dot);
  host.append(svg);

  const tip = document.createElement("div");
  tip.className = "tip";
  host.append(tip);

  const hide = () => {
    cross.setAttribute("visibility", "hidden");
    dot.setAttribute("visibility", "hidden");
    tip.classList.remove("show");
  };
  svg.addEventListener("pointermove", (e) => {
    const box = svg.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * width;
    let nearest = points[0];
    for (const p of points) if (Math.abs(sx(p.x) - px) < Math.abs(sx(nearest.x) - px)) nearest = p;
    const cx = sx(nearest.x);
    const cy = sy(nearest.y);
    cross.setAttribute("x1", cx);
    cross.setAttribute("x2", cx);
    dot.setAttribute("cx", cx);
    dot.setAttribute("cy", cy);
    cross.setAttribute("visibility", "visible");
    dot.setAttribute("visibility", "visible");
    tip.textContent = nearest.label;
    tip.style.transform = `translate(${Math.min(cx + 10, width - 150)}px, ${Math.max(cy - 34, 0)}px)`;
    tip.classList.add("show");
  });
  svg.addEventListener("pointerleave", hide);
}

// A tiny trend line with no axes. points: [{ y, hot }]; hot points (personal bests) get a dot,
// and the latest point always does.
export function sparkline(host, points, { height = 44, label = "Trend" } = {}) {
  host.replaceChildren();
  if (points.length < 2) return;
  const width = host.clientWidth || 300;
  const pad = 5;
  const ys = points.map((p) => p.y);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const sx = (i) => pad + (i / (points.length - 1)) * (width - 2 * pad);
  const sy = (y) => pad + (height - 2 * pad) * (hi === lo ? 0.5 : 1 - (y - lo) / (hi - lo));
  const svg = el("svg", { viewBox: `0 0 ${width} ${height}`, width, height, role: "img", "aria-label": label });
  const d = points.map((p, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${sy(p.y).toFixed(1)}`).join("");
  svg.append(el("path", { d: `${d}L${sx(points.length - 1)},${height}L${sx(0)},${height}Z`, class: "spark-fill" }));
  svg.append(el("path", { d, class: "line" }));
  points.forEach((p, i) => {
    const last = i === points.length - 1;
    if (p.hot || last) svg.append(el("circle", { cx: sx(i), cy: sy(p.y), r: last ? 3.5 : 3, class: p.hot ? "spark-pb" : "dot" }));
  });
  host.append(svg);
}

function niceMax(v) {
  const step = v <= 50 ? 10 : v <= 150 ? 25 : 50;
  return Math.ceil(v / step) * step;
}
