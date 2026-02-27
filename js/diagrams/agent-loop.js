// agent-loop.js — Animated TAOR agent loop diagram
// Visualises the Think → Act → Observe → Repeat cycle as a continuous
// Bézier loop with a glowing tracer dot and De Casteljau construction lines.

function AgentLoopDiagram(canvas, container) {
  const B = Bezier;

  // ---- constants --------------------------------------------------------
  const LOOP_PERIOD = 8;          // seconds for one full revolution
  const TRAIL_LENGTH = 0.12;      // fraction of loop that trails behind dot
  const TRAIL_SEGMENTS = 40;      // trail resolution
  const CURVE_STEPS = 80;         // steps per segment when drawing curves
  const CONSTRUCTION_WINDOW = 0.06; // how close (in loop‑fraction) to show construction lines

  // labels in traversal order: top → right → bottom → left
  const LABELS = ['THINK', 'ACT', 'OBSERVE', 'REPEAT'];

  // ---- layout helpers ---------------------------------------------------
  // Build the four anchor points (diamond) and their cubic control points.
  // Each segment connects node[i] → node[(i+1)%4] with two control handles
  // that keep the tangent smooth (symmetric handles at each node).

  function buildGeometry(w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const rx = Math.min(w, h) * 0.34;   // horizontal radius
    const ry = Math.min(w, h) * 0.34;   // vertical radius
    const handleFrac = 0.55;             // ≈ kappa for a near‑circle

    // Node positions: top, right, bottom, left
    const nodes = [
      { x: cx,      y: cy - ry },   // THINK   (top)
      { x: cx + rx, y: cy },        // ACT     (right)
      { x: cx,      y: cy + ry },   // OBSERVE (bottom)
      { x: cx - rx, y: cy },        // REPEAT  (left)
    ];

    // For a smooth closed loop resembling a circle we use the standard
    // cubic Bézier circle approximation.  Each pair of adjacent anchors
    // gets two control points offset along the tangent directions.
    const hx = rx * handleFrac;
    const hy = ry * handleFrac;

    // segments[i] = [P0, CP1, CP2, P3]  (cubic Bézier)
    const segments = [
      // top → right
      [nodes[0], { x: cx + hx, y: cy - ry }, { x: cx + rx, y: cy - hy }, nodes[1]],
      // right → bottom
      [nodes[1], { x: cx + rx, y: cy + hy }, { x: cx + hx, y: cy + ry }, nodes[2]],
      // bottom → left
      [nodes[2], { x: cx - hx, y: cy + ry }, { x: cx - rx, y: cy + hy }, nodes[3]],
      // left → top
      [nodes[3], { x: cx - rx, y: cy - hy }, { x: cx - hx, y: cy - ry }, nodes[0]],
    ];

    // Label offsets (push label away from centre)
    const labelOffset = Math.min(w, h) * 0.07;
    const labelPts = [
      { x: cx,              y: cy - ry - labelOffset },
      { x: cx + rx + labelOffset, y: cy },
      { x: cx,              y: cy + ry + labelOffset },
      { x: cx - rx - labelOffset, y: cy },
    ];

    return { nodes, segments, labelPts };
  }

  // ---- evaluate a point on the composite loop at global‑t (0‑1) --------
  function loopPt(segments, globalT) {
    const n = segments.length;
    const scaled = ((globalT % 1) + 1) % 1 * n;   // 0..4
    const segIdx = Math.floor(scaled) % n;
    const localT = scaled - Math.floor(scaled);
    const seg = segments[segIdx];
    return B.cubicPt(seg[0], seg[1], seg[2], seg[3], localT);
  }

  // Which segment index and local‑t does a globalT map to?
  function loopSegInfo(globalT) {
    const n = 4;
    const scaled = ((globalT % 1) + 1) % 1 * n;
    const segIdx = Math.floor(scaled) % n;
    const localT = scaled - Math.floor(scaled);
    return { segIdx, localT };
  }

  // ---- draw function (called every frame) --------------------------------
  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    const { nodes, segments, labelPts } = buildGeometry(w, h);
    const globalT = (time % LOOP_PERIOD) / LOOP_PERIOD;  // 0..1

    // --- draw the full loop curve (dimmed) ---
    const dimCurve = B.withAlpha(B.palette.teal, 0.25);
    for (let i = 0; i < segments.length; i++) {
      B.drawCurve(ctx, segments[i], CURVE_STEPS, dimCurve, 2, 0);
    }

    // --- draw the trail (fading segments behind the dot) ---
    for (let i = TRAIL_SEGMENTS; i >= 0; i--) {
      const frac = i / TRAIL_SEGMENTS;                    // 1 = oldest, 0 = newest
      const trailT = globalT - TRAIL_LENGTH * frac;
      const nextT  = globalT - TRAIL_LENGTH * (Math.max(0, i - 1) / TRAIL_SEGMENTS);
      const alpha = (1 - frac) * 0.7;                     // fade out toward tail
      const color = B.withAlpha(B.palette.teal, alpha);

      // draw tiny line segments for trail
      const pA = loopPt(segments, trailT);
      const pB = loopPt(segments, nextT);
      if (i > 0) {
        B.drawLine(ctx, pA, pB, color, 3);
      }
    }

    // --- glowing main curve near the dot ---
    // Draw a short bright section right around the dot
    const glowSpan = 0.03;
    const glowSteps = 20;
    for (let i = 0; i < glowSteps; i++) {
      const tA = globalT - glowSpan + (2 * glowSpan * i / glowSteps);
      const tB = globalT - glowSpan + (2 * glowSpan * (i + 1) / glowSteps);
      const pA = loopPt(segments, tA);
      const pB = loopPt(segments, tB);
      B.drawLine(ctx, pA, pB, B.withAlpha(B.palette.teal, 0.9), 3);
    }

    // --- construction lines (De Casteljau) near the dot ---
    const { segIdx, localT } = loopSegInfo(globalT);
    // Only show construction lines when not too close to an endpoint
    // (they collapse to a point there and look messy).
    if (localT > 0.1 && localT < 0.9) {
      const seg = segments[segIdx];
      // Fade based on proximity to midpoint of segment — strongest at centre
      const proximity = 1 - 2 * Math.abs(localT - 0.5);
      const cAlpha = proximity * 0.5;
      if (cAlpha > 0.05) {
        const dc = B.deCasteljau(seg[0], seg[1], seg[2], seg[3], localT);
        const dimColor  = B.withAlpha(B.palette.teal, cAlpha * 0.4);
        const midColor  = B.withAlpha(B.palette.teal, cAlpha * 0.7);
        // Level 1 lines (connect interpolated points on each control‑leg)
        B.drawLine(ctx, dc.l1[0], dc.l1[1], dimColor, 1, [3, 3]);
        B.drawLine(ctx, dc.l1[1], dc.l1[2], dimColor, 1, [3, 3]);
        // Level 2 line
        B.drawLine(ctx, dc.l2[0], dc.l2[1], midColor, 1, [3, 3]);
        // Level 1 dots
        dc.l1.forEach(function (p) { B.drawDot(ctx, p, 2.5, dimColor); });
        // Level 2 dots
        dc.l2.forEach(function (p) { B.drawDot(ctx, p, 2.5, midColor); });
      }
    }

    // --- node dots and labels ---
    for (let i = 0; i < 4; i++) {
      // Determine how "active" this node is — brighten when the tracer is near.
      // Node i is at globalT = i/4.
      var nodeT = i / 4;
      var diff = Math.abs(globalT - nodeT);
      if (diff > 0.5) diff = 1 - diff; // wrap around
      var activity = Math.max(0, 1 - diff / 0.12);   // ramp up within 12% of loop
      activity = B.easeInOut(activity);

      var baseAlpha = 0.35;
      var glowAlpha = baseAlpha + activity * 0.65;
      var nodeColor = B.withAlpha(B.palette.teal, glowAlpha);
      var nodeRadius = 5 + activity * 4;
      var nodeGlow = activity * 18;

      B.drawDot(ctx, nodes[i], nodeRadius, nodeColor, nodeGlow);

      // Label
      var labelAlpha = 0.4 + activity * 0.5;
      var labelColor = B.withAlpha('#ffffff', labelAlpha);
      var fontSize = Math.round(11 + activity * 3);
      var font = fontSize + 'px "JetBrains Mono", monospace';
      B.drawLabel(ctx, LABELS[i], labelPts[i], labelColor, font, 'center');
    }

    // --- animated tracer dot ---
    var dotPos = loopPt(segments, globalT);
    // Outer glow (large, soft)
    B.drawDot(ctx, dotPos, 12, B.withAlpha('#ffffff', 0.10), 30);
    // Inner glow
    B.drawDot(ctx, dotPos, 6, B.withAlpha('#ffffff', 0.5), 18);
    // Core
    B.drawDot(ctx, dotPos, 3.5, '#ffffff', 8);
  }

  // ---- kick off ----------------------------------------------------------
  return B.animate(canvas, container, draw);
}
