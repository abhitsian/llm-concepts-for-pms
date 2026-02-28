// feature-math.js — Build cost vs run cost over time
// Shows how LLM run costs grow linearly and dominate after the build phase

function FeatureMathDiagram(canvas, container) {
  const B = Bezier;
  const P = B.palette;
  const wA = B.withAlpha;

  const CYCLE = 10;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    const mx = w * 0.12;
    const my = h * 0.14;
    const gw = w - mx * 2;
    const gh = h * 0.48;
    const baseY = my + gh;
    const t = (time % CYCLE) / CYCLE;
    var drawT = B.easeInOut(B.clamp(t / 0.6, 0, 1));

    // Title
    B.drawLabel(ctx, 'build cost vs run cost', { x: mx + 4, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');

    // Axes
    B.drawLine(ctx, { x: mx, y: baseY }, { x: mx + gw, y: baseY },
      wA(P.white, 0.2), 1);
    B.drawLine(ctx, { x: mx, y: baseY }, { x: mx, y: my },
      wA(P.white, 0.2), 1);
    B.drawLabel(ctx, 'time \u2192', { x: mx + gw, y: baseY + 16 },
      P.textDim, '9px "JetBrains Mono", monospace', 'right');
    B.drawLabel(ctx, 'cost \u2192', { x: mx - 8, y: my },
      P.textDim, '9px "JetBrains Mono", monospace', 'right');

    // Build cost curve (green): starts high, drops steeply via cubic Bezier
    var buildPts = [
      { x: mx, y: my + gh * 0.05 },
      { x: mx + gw * 0.15, y: my + gh * 0.1 },
      { x: mx + gw * 0.35, y: my + gh * 0.85 },
      { x: mx + gw, y: my + gh * 0.92 }
    ];

    // Run cost curve (coral): starts low, grows linearly
    var runPts = [
      { x: mx, y: baseY - gh * 0.02 },
      { x: mx + gw * 0.33, y: baseY - gh * 0.18 },
      { x: mx + gw * 0.66, y: baseY - gh * 0.5 },
      { x: mx + gw, y: baseY - gh * 0.88 }
    ];

    // Draw partial curves based on animation progress
    var steps = 80;
    var maxStep = Math.ceil(steps * drawT);

    // Build cost curve (green)
    ctx.save();
    ctx.strokeStyle = wA(P.green, 0.15);
    ctx.lineWidth = 5; ctx.shadowColor = P.green; ctx.shadowBlur = 12;
    ctx.lineCap = 'round'; ctx.beginPath();
    for (var i = 0; i <= maxStep; i++) {
      var s = i / steps;
      var pt = B.cubicPt(buildPts[0], buildPts[1], buildPts[2], buildPts[3], s);
      if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke(); ctx.restore();
    // Main line
    ctx.save();
    ctx.strokeStyle = wA(P.green, 0.8);
    ctx.lineWidth = 2.5; ctx.shadowColor = P.green; ctx.shadowBlur = 6;
    ctx.lineCap = 'round'; ctx.beginPath();
    for (var i = 0; i <= maxStep; i++) {
      var s = i / steps;
      var pt = B.cubicPt(buildPts[0], buildPts[1], buildPts[2], buildPts[3], s);
      if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke(); ctx.restore();

    // Run cost curve (coral)
    ctx.save();
    ctx.strokeStyle = wA(P.coral, 0.15);
    ctx.lineWidth = 5; ctx.shadowColor = P.coral; ctx.shadowBlur = 12;
    ctx.lineCap = 'round'; ctx.beginPath();
    for (var i = 0; i <= maxStep; i++) {
      var s = i / steps;
      var pt = B.cubicPt(runPts[0], runPts[1], runPts[2], runPts[3], s);
      if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke(); ctx.restore();
    ctx.save();
    ctx.strokeStyle = wA(P.coral, 0.8);
    ctx.lineWidth = 2.5; ctx.shadowColor = P.coral; ctx.shadowBlur = 6;
    ctx.lineCap = 'round'; ctx.beginPath();
    for (var i = 0; i <= maxStep; i++) {
      var s = i / steps;
      var pt = B.cubicPt(runPts[0], runPts[1], runPts[2], runPts[3], s);
      if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke(); ctx.restore();

    // Curve labels
    if (drawT > 0.3) {
      var la = B.clamp((drawT - 0.3) / 0.3, 0, 1);
      var bLbl = B.cubicPt(buildPts[0], buildPts[1], buildPts[2], buildPts[3], 0.15);
      B.drawLabel(ctx, 'Build Cost', { x: bLbl.x + 50, y: bLbl.y - 12 },
        wA(P.green, la), '11px "JetBrains Mono", monospace', 'left');
      var rLbl = B.cubicPt(runPts[0], runPts[1], runPts[2], runPts[3], 0.7);
      B.drawLabel(ctx, 'Run Cost', { x: rLbl.x + 10, y: rLbl.y - 14 },
        wA(P.coral, la), '11px "JetBrains Mono", monospace', 'left');
    }

    // Crossover point (approximate: find where build ~ run around t=0.3)
    var crossX = mx + gw * 0.28;
    var crossY = baseY - gh * 0.42;
    if (drawT > 0.4) {
      var ca = B.easeOut(B.clamp((drawT - 0.4) / 0.2, 0, 1));
      B.drawDot(ctx, { x: crossX, y: crossY }, 6, wA(P.yellow, ca * 0.6), 15);
      B.drawDot(ctx, { x: crossX, y: crossY }, 3, wA(P.yellow, ca));
      B.drawLabel(ctx, 'breakeven illusion', { x: crossX, y: crossY - 16 },
        wA(P.yellow, ca * 0.8), '10px "JetBrains Mono", monospace', 'center');
    }

    // SaaS comparison line (flat near zero)
    if (drawT > 0.6) {
      var sa = B.easeOut(B.clamp((drawT - 0.6) / 0.2, 0, 1));
      B.drawLine(ctx, { x: mx + gw * 0.3, y: baseY - 6 }, { x: mx + gw, y: baseY - 6 },
        wA(P.blue, sa * 0.5), 1.5, [6, 4]);
      B.drawLabel(ctx, 'traditional SaaS (near-zero marginal)', { x: mx + gw * 0.65, y: baseY - 18 },
        wA(P.blue, sa * 0.5), '9px "JetBrains Mono", monospace', 'center');
    }

    // Formula section (bottom)
    var formulaY = h * 0.76;
    var fAlpha = t > 0.5 ? B.easeOut(B.clamp((t - 0.5) / 0.2, 0, 1)) : 0;

    B.drawLabel(ctx, 'total_cost = build_cost + (calls \u00d7 cost_per_call \u00d7 time)',
      { x: w / 2, y: formulaY },
      wA(P.white, fAlpha * 0.7), '10px "JetBrains Mono", monospace', 'center');

    // Emphasis: run cost dominates
    if (fAlpha > 0.5) {
      var eAlpha = B.clamp((fAlpha - 0.5) / 0.5, 0, 1);
      B.drawLabel(ctx, 'run cost dominates after month 3',
        { x: w / 2, y: formulaY + 20 },
        wA(P.coral, eAlpha * 0.7), '10px "JetBrains Mono", monospace', 'center');

      // Month cost breakdown
      B.drawLabel(ctx, 'month 1: build $50k + run $2k  |  month 12: build $0 + run $24k',
        { x: w / 2, y: formulaY + 40 },
        wA(P.yellow, eAlpha * 0.5), '9px "JetBrains Mono", monospace', 'center');
    }
  }

  return B.animate(canvas, container, draw);
}
