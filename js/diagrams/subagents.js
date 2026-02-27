// subagents.js — "Subagents & the Swarm" animated Bézier diagram
// Shows a dispatch node spawning 4 parallel subagent paths that reconverge

function SubagentsDiagram(canvas, container) {
  const B = Bezier;
  const P = B.palette;

  // ── Timing constants (seconds) ──
  const CYCLE       = 8.0;
  const INPUT_DUR   = 1.2;   // 0.0  → 1.2   input travel
  const SPAWN_START = 1.4;   // slight pause at dispatch
  const PARA_DUR    = 3.6;   // 1.4  → 5.0   parallel travel
  const DWELL       = 0.4;   // dots linger at synthesis
  const OUTPUT_START = 5.6;  // output dot departs
  const OUTPUT_DUR  = 1.2;   // 5.6  → 6.8   output travel
  // 6.8 → 8.0 pause before restart

  // ── Subagent definitions ──
  const agents = [
    { name: 'Research', color: P.teal },
    { name: 'Code',     color: P.coral },
    { name: 'Review',   color: P.yellow },
    { name: 'Test',     color: P.blue },
  ];

  // Per-agent arrival stagger — not all finish at same time
  const stagger = [0.0, 0.15, 0.35, 0.22];

  // ── Layout helpers (normalised 0-1, scaled to canvas in draw) ──
  function layout(w, h) {
    const mx = w * 0.5;
    const my = h * 0.5;

    const pad   = Math.min(w, h) * 0.08;
    const left  = pad;
    const right = w - pad;
    const dispX = w * 0.22;
    const synthX = w * 0.78;

    const dispatch  = { x: dispX,  y: my };
    const synthesis = { x: synthX, y: my };

    // Input curve: left edge → dispatch
    const inputCurve = [
      { x: left,            y: my },
      { x: left + (dispX - left) * 0.6, y: my },
      { x: dispX - (dispX - left) * 0.3, y: my },
      dispatch,
    ];

    // Output curve: synthesis → right edge
    const outputCurve = [
      synthesis,
      { x: synthX + (right - synthX) * 0.3, y: my },
      { x: synthX + (right - synthX) * 0.6, y: my },
      { x: right,           y: my },
    ];

    // Parallel curves — spread vertically
    const spread = h * 0.32;
    const lanes = agents.length;
    const parallelCurves = agents.map((_, i) => {
      // Vertical offset: evenly distribute around center
      const yOff = -spread + (2 * spread / (lanes - 1)) * i;
      const midY = my + yOff;

      // S-curve from dispatch → synthesis through unique path
      // Each lane bows differently for visual interest
      const bowOut = (i % 2 === 0 ? -1 : 1) * h * 0.06;

      return [
        dispatch,
        {
          x: dispX + (synthX - dispX) * 0.28,
          y: midY + bowOut,
        },
        {
          x: dispX + (synthX - dispX) * 0.72,
          y: midY - bowOut,
        },
        synthesis,
      ];
    });

    return { dispatch, synthesis, inputCurve, outputCurve, parallelCurves };
  }

  // ── Label position along a cubic curve ──
  function labelAlongCurve(pts, t) {
    return B.cubicPt(pts[0], pts[1], pts[2], pts[3], t);
  }

  // ── Draw ──
  function draw(ctx, w, h, time) {
    const t = (time % CYCLE) / CYCLE;   // 0-1 within cycle
    const sec = t * CYCLE;              // seconds within cycle

    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    const L = layout(w, h);

    const nodeRadius   = Math.max(6, Math.min(w, h) * 0.018);
    const dotRadius    = Math.max(4, Math.min(w, h) * 0.012);
    const curveWidth   = Math.max(1.5, Math.min(w, h) * 0.005);
    const glowAmount   = Math.max(8, Math.min(w, h) * 0.025);
    const labelFont    = `${Math.max(10, Math.min(w, h) * 0.028 | 0)}px "JetBrains Mono", monospace`;
    const smallFont    = `${Math.max(9, Math.min(w, h) * 0.024 | 0)}px "JetBrains Mono", monospace`;

    // ── 1. Draw static curves (dimmed) ──

    // Input curve
    B.drawCurve(ctx, L.inputCurve, 60, B.withAlpha('#ffffff', 0.18), curveWidth, 0);

    // Output curve
    B.drawCurve(ctx, L.outputCurve, 60, B.withAlpha('#ffffff', 0.18), curveWidth, 0);

    // Parallel curves
    L.parallelCurves.forEach((pts, i) => {
      B.drawCurve(ctx, pts, 80, B.withAlpha(agents[i].color, 0.12), curveWidth, 0);
    });

    // ── 2. Draw lit-up curves (as dots travel) ──

    // Input curve lights up as dot travels
    const inputT = B.clamp((sec) / INPUT_DUR, 0, 1);
    const inputEased = B.easeInOut(inputT);
    if (inputT > 0) {
      drawPartialCurve(ctx, L.inputCurve, 0, inputEased, P.white, curveWidth, glowAmount * 0.5);
    }

    // Parallel curves light up as dots travel
    L.parallelCurves.forEach((pts, i) => {
      const agentStart = SPAWN_START + stagger[i] * 0.3;
      const agentDur   = PARA_DUR - stagger[i];
      const paraT  = B.clamp((sec - agentStart) / agentDur, 0, 1);
      const paraE  = B.easeInOut(paraT);
      if (paraT > 0) {
        drawPartialCurve(ctx, pts, 0, paraE, agents[i].color, curveWidth, glowAmount);
      }
    });

    // Output curve lights up
    const outputT = B.clamp((sec - OUTPUT_START) / OUTPUT_DUR, 0, 1);
    const outputEased = B.easeInOut(outputT);
    if (outputT > 0) {
      drawPartialCurve(ctx, L.outputCurve, 0, outputEased, P.white, curveWidth, glowAmount * 0.5);
    }

    // ── 3. Draw dispatch & synthesis nodes ──

    // Dispatch node — pulse when input dot arrives
    const dispatchPulse = (inputT >= 0.95 && sec < SPAWN_START + PARA_DUR)
      ? 1.0 + 0.2 * Math.sin(sec * 6)
      : 0.6;
    B.drawDot(ctx, L.dispatch, nodeRadius * dispatchPulse, B.withAlpha('#ffffff', 0.15), 0);
    B.drawDot(ctx, L.dispatch, nodeRadius * 0.6 * dispatchPulse, P.white, glowAmount);

    // Synthesis node — pulse when all parallel dots have arrived
    const allArrived = agents.every((_, i) => {
      const agentStart = SPAWN_START + stagger[i] * 0.3;
      const agentDur   = PARA_DUR - stagger[i];
      return (sec - agentStart) / agentDur >= 1.0;
    });
    const synthPulse = (allArrived && sec < OUTPUT_START + OUTPUT_DUR)
      ? 1.0 + 0.2 * Math.sin(sec * 6)
      : 0.6;
    B.drawDot(ctx, L.synthesis, nodeRadius * synthPulse, B.withAlpha('#ffffff', 0.15), 0);
    B.drawDot(ctx, L.synthesis, nodeRadius * 0.6 * synthPulse, P.white, glowAmount);

    // ── 4. Node labels ──
    B.drawLabel(ctx, 'dispatch', { x: L.dispatch.x, y: L.dispatch.y + nodeRadius + 16 },
      P.text, labelFont, 'center');
    B.drawLabel(ctx, 'synthesis', { x: L.synthesis.x, y: L.synthesis.y + nodeRadius + 16 },
      P.text, labelFont, 'center');

    // ── 5. Subtask labels along each parallel curve ──
    L.parallelCurves.forEach((pts, i) => {
      const labelPt = labelAlongCurve(pts, 0.5);
      // Offset label above the curve
      const tangentY = (pts[2].y - pts[1].y);
      const offsetDir = tangentY > 0 ? -1 : 1;
      const labelOffset = Math.max(12, Math.min(w, h) * 0.035);

      const agentStart = SPAWN_START + stagger[i] * 0.3;
      const agentDur   = PARA_DUR - stagger[i];
      const paraT  = B.clamp((sec - agentStart) / agentDur, 0, 1);

      // Fade label in as dot approaches, fade out after it passes
      const labelAlpha = paraT > 0.1 && paraT < 0.95
        ? Math.min(1, (paraT - 0.1) / 0.2) * Math.min(1, (0.95 - paraT) / 0.15)
        : 0;

      if (labelAlpha > 0.01) {
        B.drawLabel(ctx, agents[i].name,
          { x: labelPt.x, y: labelPt.y + offsetDir * labelOffset },
          B.withAlpha(agents[i].color, labelAlpha * 0.85),
          smallFont, 'center');
      }
    });

    // ── 6. Animated dots ──

    // Input dot
    if (inputT > 0 && inputT < 1) {
      const pt = B.cubicPt(
        L.inputCurve[0], L.inputCurve[1], L.inputCurve[2], L.inputCurve[3], inputEased
      );
      B.drawDot(ctx, pt, dotRadius, P.white, glowAmount);
    }

    // Parallel dots
    L.parallelCurves.forEach((pts, i) => {
      const agentStart = SPAWN_START + stagger[i] * 0.3;
      const agentDur   = PARA_DUR - stagger[i];
      const paraT  = B.clamp((sec - agentStart) / agentDur, 0, 1);
      const paraE  = B.easeInOut(paraT);

      if (paraT > 0 && paraT < 1) {
        const pt = B.cubicPt(pts[0], pts[1], pts[2], pts[3], paraE);
        B.drawDot(ctx, pt, dotRadius, agents[i].color, glowAmount);
      }

      // Draw a small "arrival" ring at synthesis when each dot arrives
      if (paraT >= 1 && sec < OUTPUT_START) {
        const arrivalAge = sec - (agentStart + agentDur);
        const ringAlpha = Math.max(0, 1 - arrivalAge / 0.6);
        const ringR = dotRadius + arrivalAge * 20;
        if (ringAlpha > 0.01) {
          B.drawRing(ctx, L.synthesis, ringR, B.withAlpha(agents[i].color, ringAlpha * 0.5), 1.5);
        }
      }
    });

    // Output dot
    if (outputT > 0 && outputT < 1) {
      const pt = B.cubicPt(
        L.outputCurve[0], L.outputCurve[1], L.outputCurve[2], L.outputCurve[3], outputEased
      );
      B.drawDot(ctx, pt, dotRadius, P.white, glowAmount);
    }
  }

  // ── Draw a partial cubic Bézier (from t=tStart to t=tEnd) ──
  function drawPartialCurve(ctx, pts, tStart, tEnd, color, width, glow) {
    if (tEnd <= tStart) return;
    const steps = 80;
    const startStep = Math.floor(tStart * steps);
    const endStep   = Math.ceil(tEnd * steps);

    ctx.save();
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur  = glow;
    }
    ctx.strokeStyle = color;
    ctx.lineWidth   = width || 2;
    ctx.lineCap     = 'round';
    ctx.beginPath();

    for (let i = startStep; i <= endStep; i++) {
      const t  = B.clamp(i / steps, tStart, tEnd);
      const pt = B.cubicPt(pts[0], pts[1], pts[2], pts[3], t);
      if (i === startStep) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  return B.animate(canvas, container, draw);
}
