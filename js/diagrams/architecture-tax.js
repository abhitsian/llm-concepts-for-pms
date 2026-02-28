// architecture-tax.js — Compound interest curve of architectural decisions
// Shows how tech debt from architecture choices compounds over time

function ArchitectureTaxDiagram(canvas, container) {
  const B = Bezier;
  const P = B.palette;
  const wA = B.withAlpha;

  const CYCLE = 10;

  // Inflection points along the curve (normalized 0-1 on x-axis)
  var inflections = [
    { t: 0.15, label: 'chose embedding model', cost: '$100/mo' },
    { t: 0.38, label: 'added caching layer', cost: '$800/mo' },
    { t: 0.62, label: 'multi-model routing', cost: '$3,200/mo' },
    { t: 0.82, label: 'custom fine-tuning', cost: '$8,400/mo' }
  ];

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    const mx = w * 0.1;
    const my = h * 0.12;
    const gw = w - mx * 2;
    const gh = h * 0.6;
    const baseY = my + gh;
    const t = (time % CYCLE) / CYCLE;

    // Title
    B.drawLabel(ctx, 'architecture tax', { x: mx + 4, y: h * 0.05 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');

    // Axes
    B.drawLine(ctx, { x: mx, y: baseY }, { x: mx + gw, y: baseY },
      wA(P.white, 0.2), 1);
    B.drawLine(ctx, { x: mx, y: baseY }, { x: mx, y: my },
      wA(P.white, 0.2), 1);
    B.drawLabel(ctx, 'months \u2192', { x: mx + gw, y: baseY + 16 },
      P.textDim, '9px "JetBrains Mono", monospace', 'right');
    B.drawLabel(ctx, 'ongoing cost \u2192', { x: mx - 4, y: my - 8 },
      P.textDim, '9px "JetBrains Mono", monospace', 'right');

    // Month markers
    for (var m = 1; m <= 12; m++) {
      var mx2 = mx + (gw * m / 12);
      B.drawLine(ctx, { x: mx2, y: baseY }, { x: mx2, y: baseY + 4 },
        wA(P.white, 0.15), 1);
      if (m % 3 === 0) {
        B.drawLabel(ctx, 'm' + m, { x: mx2, y: baseY + 12 },
          wA(P.white, 0.25), '8px "JetBrains Mono", monospace', 'center');
      }
    }

    // Exponential compound curve via cubic Bezier
    var curvePts = [
      { x: mx, y: baseY - gh * 0.02 },
      { x: mx + gw * 0.35, y: baseY - gh * 0.05 },
      { x: mx + gw * 0.65, y: baseY - gh * 0.25 },
      { x: mx + gw, y: baseY - gh * 0.95 }
    ];

    // Animate curve drawing
    var drawProgress = B.easeInOut(B.clamp(t / 0.65, 0, 1));
    var steps = 100;
    var maxStep = Math.ceil(steps * drawProgress);

    // Glow layer
    ctx.save();
    ctx.strokeStyle = wA(P.purple, 0.12);
    ctx.lineWidth = 6; ctx.shadowColor = P.purple; ctx.shadowBlur = 15;
    ctx.lineCap = 'round'; ctx.beginPath();
    for (var i = 0; i <= maxStep; i++) {
      var s = i / steps;
      var pt = B.cubicPt(curvePts[0], curvePts[1], curvePts[2], curvePts[3], s);
      if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke(); ctx.restore();

    // Main curve
    ctx.save();
    ctx.strokeStyle = wA(P.purple, 0.8);
    ctx.lineWidth = 2.5; ctx.shadowColor = P.purple; ctx.shadowBlur = 6;
    ctx.lineCap = 'round'; ctx.beginPath();
    for (var i = 0; i <= maxStep; i++) {
      var s = i / steps;
      var pt = B.cubicPt(curvePts[0], curvePts[1], curvePts[2], curvePts[3], s);
      if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke(); ctx.restore();

    // Leading dot
    if (drawProgress > 0 && drawProgress < 1) {
      var leadPt = B.cubicPt(curvePts[0], curvePts[1], curvePts[2], curvePts[3], drawProgress);
      B.drawDot(ctx, leadPt, 5, P.purple, 15);
      B.drawDot(ctx, leadPt, 2.5, '#ffffff');
    }

    // Starting dot
    B.drawDot(ctx, curvePts[0], 4, wA(P.purple, 0.6), 8);

    // Inflection points with labels
    for (var inf = 0; inf < inflections.length; inf++) {
      var ip = inflections[inf];
      if (drawProgress >= ip.t) {
        var appear = B.easeOut(B.clamp((drawProgress - ip.t) / 0.08, 0, 1));
        var pt = B.cubicPt(curvePts[0], curvePts[1], curvePts[2], curvePts[3], ip.t);

        // Dot at inflection
        B.drawDot(ctx, pt, 5, wA(P.teal, appear * 0.8), 10);
        B.drawDot(ctx, pt, 2.5, wA('#ffffff', appear * 0.7));

        // Vertical dashed line down to axis
        B.drawLine(ctx, pt, { x: pt.x, y: baseY },
          wA(P.teal, appear * 0.15), 1, [3, 3]);

        // Label (alternate above/below to avoid overlap)
        var labelSide = inf % 2 === 0 ? -1 : 1;
        var labelY = pt.y + labelSide * 22;
        B.drawLabel(ctx, ip.label, { x: pt.x, y: labelY },
          wA(P.teal, appear * 0.7), '9px "JetBrains Mono", monospace', 'center');

        // Cost label
        B.drawLabel(ctx, ip.cost, { x: pt.x, y: labelY + labelSide * 14 },
          wA(P.coral, appear * 0.6), '9px "JetBrains Mono", monospace', 'center');
      }
    }

    // Linear comparison line (what you might expect without compounding)
    if (drawProgress > 0.3) {
      var la = B.clamp((drawProgress - 0.3) / 0.2, 0, 0.3);
      B.drawLine(ctx, curvePts[0],
        { x: mx + gw * drawProgress, y: baseY - gh * 0.3 * drawProgress },
        wA(P.white, la), 1, [6, 4]);
      if (drawProgress > 0.6) {
        B.drawLabel(ctx, 'expected (linear)', { x: mx + gw * 0.5, y: baseY - gh * 0.16 },
          wA(P.white, 0.3), '9px "JetBrains Mono", monospace', 'center');
      }
    }

    // Formula and cost comparison (bottom)
    var fAlpha = t > 0.6 ? B.easeOut(B.clamp((t - 0.6) / 0.15, 0, 1)) : 0;
    var formulaY = h * 0.82;

    B.drawLabel(ctx, 'tech_debt = \u03a3(decisions \u00d7 time_compounding)',
      { x: w / 2, y: formulaY },
      wA(P.white, fAlpha * 0.7), '10px "JetBrains Mono", monospace', 'center');

    if (fAlpha > 0.5) {
      var ca = B.clamp((fAlpha - 0.5) / 0.5, 0, 1);
      B.drawLabel(ctx, 'month 1: $100    \u2192    month 12: $8,400',
        { x: w / 2, y: formulaY + 22 },
        wA(P.coral, ca * 0.7), '11px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, 'each decision compounds on previous ones',
        { x: w / 2, y: formulaY + 42 },
        wA(P.yellow, ca * 0.45), '9px "JetBrains Mono", monospace', 'center');
    }
  }

  return B.animate(canvas, container, draw);
}
