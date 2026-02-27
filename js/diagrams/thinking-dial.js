// thinking-dial.js — "Thinking Became a Dial"
// Animated Bezier curve showing variable reasoning effort
// Shallow curve = fast/cheap, Deep curve = slow/expensive

function ThinkingDialDiagram(canvas, container) {
  const B = Bezier;
  const P = B.palette;

  // Colors for the depth gradient
  const greenHex  = P.green;   // #6bcb77 — shallow / cheap
  const purpleHex = P.purple;  // #b07aff — deep / expensive

  // Lerp between two hex colors
  function lerpColor(hex1, hex2, t) {
    const r1 = parseInt(hex1.slice(1, 3), 16);
    const g1 = parseInt(hex1.slice(3, 5), 16);
    const b1 = parseInt(hex1.slice(5, 7), 16);
    const r2 = parseInt(hex2.slice(1, 3), 16);
    const g2 = parseInt(hex2.slice(3, 5), 16);
    const b2 = parseInt(hex2.slice(5, 7), 16);
    const r = Math.round(B.lerp(r1, r2, t));
    const g = Math.round(B.lerp(g1, g2, t));
    const b = Math.round(B.lerp(b1, b2, t));
    return `rgb(${r},${g},${b})`;
  }

  function lerpColorHex(hex1, hex2, t) {
    const r1 = parseInt(hex1.slice(1, 3), 16);
    const g1 = parseInt(hex1.slice(3, 5), 16);
    const b1 = parseInt(hex1.slice(5, 7), 16);
    const r2 = parseInt(hex2.slice(1, 3), 16);
    const g2 = parseInt(hex2.slice(3, 5), 16);
    const b2 = parseInt(hex2.slice(5, 7), 16);
    const r = Math.round(B.lerp(r1, r2, t));
    const g = Math.round(B.lerp(g1, g2, t));
    const b = Math.round(B.lerp(b1, b2, t));
    const toHex = (v) => v.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  const CYCLE = 5; // seconds for full oscillation

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h);

    // --- Layout ---
    const pad = Math.min(w, h) * 0.12;
    const curveLeft  = pad + 20;
    const curveRight = w - pad - 20;
    const baselineY  = h * 0.32; // anchor line for A and B

    // --- Animation parameter ---
    const rawT = (time % CYCLE) / CYCLE;      // 0..1 over CYCLE seconds
    const pp   = B.pingPong(rawT);             // 0..1..0
    const depth = B.easeInOut(pp);             // eased depth 0 (shallow) to 1 (deep)

    // --- Control points ---
    // A and B are the endpoints
    const pA = { x: curveLeft,  y: baselineY };
    const pB = { x: curveRight, y: baselineY };

    // Control points dip below the baseline
    // Shallow: small dip (~15% of height), Deep: large dip (~65% of height)
    const minDip = h * 0.10;
    const maxDip = h * 0.52;
    const dip = B.lerp(minDip, maxDip, depth);

    const thirdX = (curveRight - curveLeft) / 3;
    const cp1 = { x: curveLeft  + thirdX, y: baselineY + dip };
    const cp2 = { x: curveRight - thirdX, y: baselineY + dip };

    // --- Current color based on depth ---
    const curveColor = lerpColorHex(greenHex, purpleHex, depth);
    const fillAlpha  = B.lerp(0.06, 0.18, depth);
    const fillColor  = B.withAlpha(curveColor, fillAlpha);
    const glowAlpha  = B.lerp(0.3, 0.7, depth);

    // --- Draw filled area under the curve ---
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);

    const steps = 80;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const pt = B.cubicPt(pA, cp1, cp2, pB, t);
      ctx.lineTo(pt.x, pt.y);
    }

    // Close back along the baseline
    ctx.lineTo(pB.x, baselineY);
    ctx.lineTo(pA.x, baselineY);
    ctx.closePath();

    // Gradient fill for the area
    const grad = ctx.createLinearGradient(pA.x, baselineY, pA.x, baselineY + dip);
    const gradColorTop    = B.withAlpha(curveColor, fillAlpha * 0.3);
    const gradColorBottom = B.withAlpha(curveColor, fillAlpha);
    grad.addColorStop(0, gradColorTop);
    grad.addColorStop(1, gradColorBottom);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    // --- Draw the baseline (faint) ---
    B.drawLine(ctx, pA, pB, P.dimmer, 1, [6, 4]);

    // --- Draw dashed lines from control points to endpoints ---
    const dashColor = B.withAlpha(curveColor, 0.25);
    B.drawLine(ctx, pA,  cp1, dashColor, 1, [4, 4]);
    B.drawLine(ctx, cp1, cp2, dashColor, 1, [4, 4]);
    B.drawLine(ctx, cp2, pB,  dashColor, 1, [4, 4]);

    // --- Draw the curve itself ---
    B.drawCurve(ctx, [pA, cp1, cp2, pB], steps, lerpColor(greenHex, purpleHex, depth), 2.5, 12 * glowAlpha);

    // --- Draw control point rings ---
    const ringColor = B.withAlpha(curveColor, 0.7);
    B.drawRing(ctx, cp1, 5, ringColor, 1.5);
    B.drawRing(ctx, cp2, 5, ringColor, 1.5);

    // --- Draw endpoint dots ---
    B.drawDot(ctx, pA, 5, P.white, 8);
    B.drawDot(ctx, pB, 5, P.white, 8);

    // --- Labels for endpoints ---
    B.drawLabel(ctx, 'Query', { x: pA.x, y: pA.y - 18 }, P.text, '12px "JetBrains Mono", monospace', 'center');
    B.drawLabel(ctx, 'Answer', { x: pB.x, y: pB.y - 18 }, P.text, '12px "JetBrains Mono", monospace', 'center');

    // --- "thinking tokens" label in the filled area ---
    const areaLabelY = baselineY + dip * 0.5;
    const areaLabelX = (curveLeft + curveRight) / 2;
    const tokenLabelAlpha = B.lerp(0.15, 0.6, depth);
    B.drawLabel(
      ctx, 'thinking tokens',
      { x: areaLabelX, y: areaLabelY },
      B.withAlpha(curveColor, tokenLabelAlpha),
      '11px "JetBrains Mono", monospace',
      'center'
    );

    // --- Top label: "fast / cheap" <-> "slow / expensive" ---
    const topY = Math.min(baselineY - 44, h * 0.08 + 10);
    const topX = (curveLeft + curveRight) / 2;

    // Crossfade between the two labels
    const shallowAlpha = B.lerp(0.7, 0.0, B.clamp(depth * 2, 0, 1));
    const deepAlpha    = B.lerp(0.0, 0.7, B.clamp((depth - 0.5) * 2, 0, 1));

    if (shallowAlpha > 0.01) {
      B.drawLabel(
        ctx, 'fast / cheap',
        { x: topX, y: topY },
        B.withAlpha(greenHex, shallowAlpha),
        '13px "JetBrains Mono", monospace',
        'center'
      );
    }
    if (deepAlpha > 0.01) {
      B.drawLabel(
        ctx, 'slow / expensive',
        { x: topX, y: topY },
        B.withAlpha(purpleHex, deepAlpha),
        '13px "JetBrains Mono", monospace',
        'center'
      );
    }

    // --- Budget bar on the right side ---
    const barX      = w - pad * 0.5 + 4;
    const barTop    = baselineY;
    const barHeight = h * 0.52;
    const barWidth  = 6;
    const barBottom = barTop + barHeight;

    // Bar track (dim)
    ctx.save();
    ctx.fillStyle = P.dimmer;
    ctx.beginPath();
    ctx.roundRect(barX - barWidth / 2, barTop, barWidth, barHeight, 3);
    ctx.fill();
    ctx.restore();

    // Bar fill (from top, proportional to depth)
    const barFillH = barHeight * depth;
    if (barFillH > 1) {
      ctx.save();
      const barGrad = ctx.createLinearGradient(barX, barTop, barX, barTop + barFillH);
      barGrad.addColorStop(0, B.withAlpha(greenHex, 0.6));
      barGrad.addColorStop(1, B.withAlpha(purpleHex, 0.8));
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(barX - barWidth / 2, barTop, barWidth, barFillH, 3);
      ctx.fill();
      ctx.restore();
    }

    // Bar label
    B.drawLabel(
      ctx, 'budget',
      { x: barX, y: barTop - 12 },
      P.textDim,
      '9px "JetBrains Mono", monospace',
      'center'
    );

    // Percentage indicator next to bar
    const pct = Math.round(depth * 100);
    B.drawLabel(
      ctx, pct + '%',
      { x: barX + 14, y: barTop + barFillH },
      B.withAlpha(curveColor, 0.6),
      '9px "JetBrains Mono", monospace',
      'left'
    );
  }

  return B.animate(canvas, container, draw);
}
