// race-to-zero.js — Inference cost curves dropping over time (log scale)
// Shows GPT-4, Claude, and open-weight models converging toward zero

function RaceToZeroDiagram(canvas, container) {
  const B = Bezier;
  const P = B.palette;
  const wA = B.withAlpha;

  const CYCLE = 10;

  // Y-axis log scale: $60 -> $6 -> $0.60 -> $0.06
  var yLabels = ['$60/M', '$6/M', '$0.60/M', '$0.06/M'];
  var years = ['2023', '2024', '2025', '2026'];

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    const mx = w * 0.12;
    const my = h * 0.12;
    const gw = w - mx * 2;
    const gh = h * 0.6;
    const baseY = my + gh;
    const t = (time % CYCLE) / CYCLE;

    // Title
    B.drawLabel(ctx, 'race to zero', { x: mx + 4, y: h * 0.05 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');

    // Axes
    B.drawLine(ctx, { x: mx, y: baseY }, { x: mx + gw, y: baseY },
      wA(P.white, 0.2), 1);
    B.drawLine(ctx, { x: mx, y: baseY }, { x: mx, y: my },
      wA(P.white, 0.2), 1);

    // Y-axis labels (log scale)
    for (var yi = 0; yi < yLabels.length; yi++) {
      var yy = my + (gh * yi / (yLabels.length - 1));
      B.drawLine(ctx, { x: mx - 4, y: yy }, { x: mx, y: yy },
        wA(P.white, 0.3), 1);
      B.drawLabel(ctx, yLabels[yi], { x: mx - 8, y: yy },
        wA(P.white, 0.4), '9px "JetBrains Mono", monospace', 'right');
      // Horizontal gridline
      if (yi > 0) {
        B.drawLine(ctx, { x: mx, y: yy }, { x: mx + gw, y: yy },
          wA(P.white, 0.05), 1, [4, 8]);
      }
    }

    // X-axis labels
    for (var xi = 0; xi < years.length; xi++) {
      var xx = mx + (gw * xi / (years.length - 1));
      B.drawLine(ctx, { x: xx, y: baseY }, { x: xx, y: baseY + 4 },
        wA(P.white, 0.3), 1);
      B.drawLabel(ctx, years[xi], { x: xx, y: baseY + 16 },
        wA(P.white, 0.4), '9px "JetBrains Mono", monospace', 'center');
    }

    // "Free" asymptote line at bottom
    var freeY = baseY - 8;
    B.drawLine(ctx, { x: mx, y: freeY }, { x: mx + gw, y: freeY },
      wA(P.green, 0.15), 1, [8, 4]);
    B.drawLabel(ctx, 'free \u2192', { x: mx + gw + 8, y: freeY },
      wA(P.green, 0.3), '9px "JetBrains Mono", monospace', 'left');

    // Draw progress (curves draw left to right over ~8 seconds)
    var drawT = B.easeOut(B.clamp(t / 0.8, 0, 1));
    var steps = 80;
    var maxStep = Math.ceil(steps * drawT);

    // GPT-4 class (coral): starts highest, drops steeply
    var gptPts = [
      { x: mx, y: my + gh * 0.02 },
      { x: mx + gw * 0.3, y: my + gh * 0.2 },
      { x: mx + gw * 0.6, y: my + gh * 0.55 },
      { x: mx + gw, y: my + gh * 0.78 }
    ];

    // Claude class (teal): starts mid-high, drops similarly
    var claudePts = [
      { x: mx, y: my + gh * 0.12 },
      { x: mx + gw * 0.25, y: my + gh * 0.32 },
      { x: mx + gw * 0.55, y: my + gh * 0.62 },
      { x: mx + gw, y: my + gh * 0.82 }
    ];

    // Open-weight (green): starts lower, drops faster, converges
    var openPts = [
      { x: mx, y: my + gh * 0.25 },
      { x: mx + gw * 0.2, y: my + gh * 0.5 },
      { x: mx + gw * 0.5, y: my + gh * 0.75 },
      { x: mx + gw, y: my + gh * 0.88 }
    ];

    var curves = [
      { pts: gptPts, color: P.coral, label: 'GPT-4 class' },
      { pts: claudePts, color: P.teal, label: 'Claude class' },
      { pts: openPts, color: P.green, label: 'Open-weight' }
    ];

    for (var c = 0; c < curves.length; c++) {
      var cv = curves[c];
      var pts = cv.pts;

      // Glow
      ctx.save();
      ctx.strokeStyle = wA(cv.color, 0.12);
      ctx.lineWidth = 6; ctx.shadowColor = cv.color; ctx.shadowBlur = 14;
      ctx.lineCap = 'round'; ctx.beginPath();
      for (var i = 0; i <= maxStep; i++) {
        var s = i / steps;
        var pt = B.cubicPt(pts[0], pts[1], pts[2], pts[3], s);
        if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke(); ctx.restore();

      // Main
      ctx.save();
      ctx.strokeStyle = wA(cv.color, 0.8);
      ctx.lineWidth = 2.5; ctx.shadowColor = cv.color; ctx.shadowBlur = 6;
      ctx.lineCap = 'round'; ctx.beginPath();
      for (var i = 0; i <= maxStep; i++) {
        var s = i / steps;
        var pt = B.cubicPt(pts[0], pts[1], pts[2], pts[3], s);
        if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke(); ctx.restore();

      // Leading dot
      if (drawT > 0 && drawT < 1) {
        var lp = B.cubicPt(pts[0], pts[1], pts[2], pts[3], drawT);
        B.drawDot(ctx, lp, 4, cv.color, 10);
      }

      // Endpoint dot
      if (drawT >= 1) {
        var ep = pts[3];
        B.drawDot(ctx, ep, 4, wA(cv.color, 0.7), 8);
      }

      // Labels at start of each curve
      if (drawT > 0.1) {
        var la = B.clamp((drawT - 0.1) / 0.2, 0, 1);
        var lp = B.cubicPt(pts[0], pts[1], pts[2], pts[3], 0.08);
        B.drawLabel(ctx, cv.label, { x: lp.x + 60, y: lp.y - 4 },
          wA(cv.color, la * 0.7), '10px "JetBrains Mono", monospace', 'left');
      }
    }

    // "10x/year" annotation
    if (drawT > 0.4) {
      var annA = B.easeOut(B.clamp((drawT - 0.4) / 0.2, 0, 1));
      var annX = mx + gw * 0.5;
      var annY1 = my + gh * 0.2;
      var annY2 = my + gh * 0.55;
      B.drawLine(ctx, { x: annX, y: annY1 }, { x: annX, y: annY2 },
        wA(P.yellow, annA * 0.4), 1, [3, 3]);
      B.drawLabel(ctx, '10x drop', { x: annX + 8, y: (annY1 + annY2) / 2 },
        wA(P.yellow, annA * 0.6), '9px "JetBrains Mono", monospace', 'left');
    }

    // Convergence zone highlight
    if (drawT > 0.8) {
      var cza = B.clamp((drawT - 0.8) / 0.2, 0, 1);
      ctx.save();
      ctx.fillStyle = wA(P.yellow, cza * 0.04);
      ctx.fillRect(mx + gw * 0.8, my + gh * 0.7, gw * 0.2, gh * 0.25);
      ctx.restore();
      B.drawLabel(ctx, 'converging', { x: mx + gw * 0.9, y: my + gh * 0.68 },
        wA(P.yellow, cza * 0.5), '9px "JetBrains Mono", monospace', 'center');
    }

    // Formula section (bottom)
    var fAlpha = t > 0.6 ? B.easeOut(B.clamp((t - 0.6) / 0.15, 0, 1)) : 0;
    var formulaY = h * 0.82;

    B.drawLabel(ctx, 'cost(t) = cost\u2080 \u00d7 0.1^(t/year)',
      { x: w / 2, y: formulaY },
      wA(P.white, fAlpha * 0.7), '11px "JetBrains Mono", monospace', 'center');

    if (fAlpha > 0.5) {
      var ea = B.clamp((fAlpha - 0.5) / 0.5, 0, 1);
      B.drawLabel(ctx, '10x cheaper every 12 months \u2014 plan accordingly',
        { x: w / 2, y: formulaY + 22 },
        wA(P.yellow, ea * 0.5), '9px "JetBrains Mono", monospace', 'center');
    }
  }

  return B.animate(canvas, container, draw);
}
