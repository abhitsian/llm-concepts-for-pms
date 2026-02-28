// jevons-paradox.js — Cheaper inference led to MORE total spending
// Two curves: price per token falls, total spend rises — the Jevons paradox

function JevonsParadoxDiagram(canvas, container) {
  const B = Bezier;
  const P = B.palette;

  var CYCLE = 7;

  // Data-inspired curve shapes (normalized 0-1)
  function priceCurve(t) { return Math.exp(-3.2 * t); }            // drops ~96%
  function usageCurve(t) { return 1 + 19 * (1 - Math.exp(-2.5 * t)); } // 20x growth
  function spendCurve(t) { return priceCurve(t) * usageCurve(t); }

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var mx = w * 0.12, my = h * 0.14;
    var iw = w - mx * 2, ih = h - my * 2.2;
    var phase = (time % CYCLE) / CYCLE;
    var drawT = B.easeOut(B.clamp(phase * 1.8, 0, 1));

    // Axis lines
    var originX = mx, originY = my + ih;
    B.drawLine(ctx, { x: originX, y: my }, { x: originX, y: originY },
      B.withAlpha(P.white, 0.15), 1);
    B.drawLine(ctx, { x: originX, y: originY }, { x: mx + iw, y: originY },
      B.withAlpha(P.white, 0.15), 1);

    // Right Y-axis
    B.drawLine(ctx, { x: mx + iw, y: my }, { x: mx + iw, y: originY },
      B.withAlpha(P.white, 0.1), 1);

    // X-axis label
    B.drawLabel(ctx, 'time →', { x: mx + iw * 0.5, y: originY + 28 },
      P.textDim, '10px "JetBrains Mono", monospace');

    // Left Y-axis label (price)
    B.drawLabel(ctx, '$/token', { x: mx - 4, y: my - 10 },
      B.withAlpha(P.coral, 0.6), '9px "JetBrains Mono", monospace', 'right');

    // Right Y-axis label (spend)
    B.drawLabel(ctx, 'total spend', { x: mx + iw + 4, y: my - 10 },
      B.withAlpha(P.teal, 0.6), '9px "JetBrains Mono", monospace', 'left');

    // --- Price curve (coral, drops) ---
    var STEPS = 80;
    var priceMax = 1, spendMax = 2.2;

    // Draw price curve
    ctx.beginPath();
    for (var i = 0; i <= STEPS; i++) {
      var t = (i / STEPS) * drawT;
      var px = mx + t * iw;
      var py = originY - (priceCurve(t) / priceMax) * ih;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = B.withAlpha(P.coral, 0.7);
    ctx.lineWidth = 2.5;
    ctx.shadowColor = P.coral;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw total spend curve (teal, rises)
    ctx.beginPath();
    for (var j = 0; j <= STEPS; j++) {
      var t2 = (j / STEPS) * drawT;
      var sx = mx + t2 * iw;
      var sy = originY - (spendCurve(t2) / spendMax) * ih;
      if (j === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.strokeStyle = B.withAlpha(P.teal, 0.7);
    ctx.lineWidth = 2.5;
    ctx.shadowColor = P.teal;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Curve endpoint dots
    if (drawT > 0.05) {
      var priceEnd = { x: mx + drawT * iw, y: originY - (priceCurve(drawT) / priceMax) * ih };
      var spendEnd = { x: mx + drawT * iw, y: originY - (spendCurve(drawT) / spendMax) * ih };
      B.drawDot(ctx, priceEnd, 4, P.coral, 10);
      B.drawDot(ctx, spendEnd, 4, P.teal, 10);
    }

    // Curve labels
    if (drawT > 0.4) {
      B.drawLabel(ctx, 'price/token ↓', { x: mx + iw * 0.55, y: originY - ih * 0.08 },
        B.withAlpha(P.coral, 0.6), '10px "JetBrains Mono", monospace', 'left');
      B.drawLabel(ctx, 'total spend ↑', { x: mx + iw * 0.55, y: originY - ih * 0.75 },
        B.withAlpha(P.teal, 0.6), '10px "JetBrains Mono", monospace', 'left');
    }

    // Data callouts (appear progressively)
    var callouts = [
      { t: 0.25, label: 'price: −90%',   color: P.coral,  yOff: 0.35 },
      { t: 0.50, label: 'usage: +2000%',  color: P.green,  yOff: 0.50 },
      { t: 0.75, label: 'spend: +110%',   color: P.teal,   yOff: 0.65 },
    ];
    for (var ci = 0; ci < callouts.length; ci++) {
      var c = callouts[ci];
      var appear = B.easeOut(B.clamp((drawT - c.t) * 5, 0, 1));
      if (appear > 0.01) {
        var cx = mx + iw * (0.12 + ci * 0.3);
        var cy = my + ih * c.yOff;
        B.drawDot(ctx, { x: cx - 40, y: cy }, 3, B.withAlpha(c.color, appear * 0.6), 6);
        B.drawLabel(ctx, c.label, { x: cx - 24, y: cy + 4 },
          B.withAlpha(c.color, appear * 0.8),
          '11px "JetBrains Mono", monospace', 'left');
      }
    }

    // Formula
    var formulaAlpha = B.easeInOut(B.clamp(phase * 3 - 1.2, 0, 1));
    B.drawLabel(ctx, 'total_spend = price × usage   where usage ∝ 1/price^α, α > 1',
      { x: w / 2, y: h - my * 0.25 },
      B.withAlpha(P.white, formulaAlpha * 0.45),
      '9px "JetBrains Mono", monospace');

    // Title insight
    B.drawLabel(ctx, 'Jevons Paradox — cheaper but spending more',
      { x: w / 2, y: my * 0.45 },
      B.withAlpha(P.yellow, 0.55), '11px "JetBrains Mono", monospace');
  }

  return B.animate(canvas, container, draw);
}
