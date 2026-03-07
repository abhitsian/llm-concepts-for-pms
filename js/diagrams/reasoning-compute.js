// reasoning-compute.js — Two compute demand curves
// Pre-reasoning flat vs post-reasoning exponential. Jevons paradox callout.

function ReasoningComputeDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var phase = B.easeOut(B.clamp(t / 0.75, 0, 1));
    var drawT = B.clamp(phase / 0.85, 0, 1);

    // Title
    B.drawLabel(ctx, 'reasoning compute', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');

    var mx = w * 0.14;
    var my = h * 0.14;
    var gw = w - mx * 2;
    var gh = h * 0.55;
    var baseY = my + gh;

    // Axes
    B.drawLine(ctx, { x: mx, y: baseY }, { x: mx + gw, y: baseY },
      wA(P.white, 0.2), 1);
    B.drawLine(ctx, { x: mx, y: baseY }, { x: mx, y: my },
      wA(P.white, 0.2), 1);

    // Y-axis label
    B.drawLabel(ctx, 'compute demand', { x: mx - 6, y: my - 10 },
      wA(P.white, 0.4), '8px "JetBrains Mono", monospace', 'right');

    // X-axis label
    B.drawLabel(ctx, 'training + inference \u2192', { x: mx + gw * 0.5, y: baseY + 22 },
      wA(P.white, 0.35), '9px "JetBrains Mono", monospace', 'center');

    // X-axis time markers
    var xLabels = ['2022', '2023', '2024', '2025'];
    for (var xi = 0; xi < xLabels.length; xi++) {
      var xx = mx + gw * xi / (xLabels.length - 1);
      B.drawLine(ctx, { x: xx, y: baseY }, { x: xx, y: baseY + 4 },
        wA(P.white, 0.2), 1);
      B.drawLabel(ctx, xLabels[xi], { x: xx, y: baseY + 34 },
        wA(P.white, 0.3), '8px "JetBrains Mono", monospace', 'center');
    }

    // === Pre-reasoning curve (moderate, flat-ish) ===
    var prePts = [
      { x: mx, y: baseY - gh * 0.15 },
      { x: mx + gw * 0.3, y: baseY - gh * 0.2 },
      { x: mx + gw * 0.6, y: baseY - gh * 0.28 },
      { x: mx + gw, y: baseY - gh * 0.35 }
    ];

    var STEPS = 80;
    var maxStep = Math.ceil(STEPS * drawT);

    // Pre-reasoning: glow
    ctx.save();
    ctx.strokeStyle = wA(P.blue, 0.1);
    ctx.lineWidth = 5;
    ctx.shadowColor = P.blue;
    ctx.shadowBlur = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (var i = 0; i <= maxStep; i++) {
      var s = i / STEPS;
      var pt = B.cubicPt(prePts[0], prePts[1], prePts[2], prePts[3], s);
      if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.restore();

    // Pre-reasoning: main line
    ctx.save();
    ctx.strokeStyle = wA(P.blue, 0.6);
    ctx.lineWidth = 2;
    ctx.shadowColor = P.blue;
    ctx.shadowBlur = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (var i2 = 0; i2 <= maxStep; i2++) {
      var s2 = i2 / STEPS;
      var pt2 = B.cubicPt(prePts[0], prePts[1], prePts[2], prePts[3], s2);
      if (i2 === 0) ctx.moveTo(pt2.x, pt2.y); else ctx.lineTo(pt2.x, pt2.y);
    }
    ctx.stroke();
    ctx.restore();

    // Label
    if (drawT > 0.3) {
      B.drawLabel(ctx, 'pre-reasoning', { x: mx + gw * 0.25, y: baseY - gh * 0.22 - 12 },
        wA(P.blue, 0.6), '9px "JetBrains Mono", monospace', 'center');
    }

    // === Post-reasoning curve (steep exponential) ===
    // Starts at same point but diverges dramatically
    var postPts = [
      { x: mx, y: baseY - gh * 0.15 },
      { x: mx + gw * 0.25, y: baseY - gh * 0.22 },
      { x: mx + gw * 0.5, y: baseY - gh * 0.45 },
      { x: mx + gw, y: baseY - gh * 0.95 }
    ];

    var postDelay = 0.15;
    var postDrawT = B.clamp((drawT - postDelay) / (1 - postDelay), 0, 1);
    var postMaxStep = Math.ceil(STEPS * postDrawT);

    if (postDrawT > 0) {
      // Post-reasoning: glow
      ctx.save();
      ctx.strokeStyle = wA(P.coral, 0.12);
      ctx.lineWidth = 6;
      ctx.shadowColor = P.coral;
      ctx.shadowBlur = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var j = 0; j <= postMaxStep; j++) {
        var sj = j / STEPS;
        var ptj = B.cubicPt(postPts[0], postPts[1], postPts[2], postPts[3], sj);
        if (j === 0) ctx.moveTo(ptj.x, ptj.y); else ctx.lineTo(ptj.x, ptj.y);
      }
      ctx.stroke();
      ctx.restore();

      // Post-reasoning: main line
      ctx.save();
      ctx.strokeStyle = wA(P.coral, 0.8);
      ctx.lineWidth = 2.5;
      ctx.shadowColor = P.coral;
      ctx.shadowBlur = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var j2 = 0; j2 <= postMaxStep; j2++) {
        var sj2 = j2 / STEPS;
        var ptj2 = B.cubicPt(postPts[0], postPts[1], postPts[2], postPts[3], sj2);
        if (j2 === 0) ctx.moveTo(ptj2.x, ptj2.y); else ctx.lineTo(ptj2.x, ptj2.y);
      }
      ctx.stroke();
      ctx.restore();

      // Leading dot
      if (postDrawT > 0 && postDrawT < 1) {
        var leadPt = B.cubicPt(postPts[0], postPts[1], postPts[2], postPts[3], postDrawT);
        B.drawDot(ctx, leadPt, 4, P.coral, 12);
      }

      // Label
      if (postDrawT > 0.4) {
        B.drawLabel(ctx, 'post-reasoning', { x: mx + gw * 0.6, y: baseY - gh * 0.65 - 12 },
          wA(P.coral, 0.7), '9px "JetBrains Mono", monospace', 'center');
      }
    }

    // === Gap annotation: "100x more compute" ===
    if (drawT > 0.6) {
      var gapAlpha = B.easeOut(B.clamp((drawT - 0.6) / 0.2, 0, 1));
      var gapX = mx + gw * 0.75;
      var gapY1 = baseY - gh * 0.32; // pre-reasoning level
      var gapY2 = baseY - gh * 0.82; // post-reasoning level

      // Vertical bracket
      B.drawLine(ctx, { x: gapX, y: gapY1 }, { x: gapX, y: gapY2 },
        wA(P.yellow, gapAlpha * 0.5), 1.5, [3, 3]);
      // Top/bottom ticks
      B.drawLine(ctx, { x: gapX - 4, y: gapY1 }, { x: gapX + 4, y: gapY1 },
        wA(P.yellow, gapAlpha * 0.4), 1);
      B.drawLine(ctx, { x: gapX - 4, y: gapY2 }, { x: gapX + 4, y: gapY2 },
        wA(P.yellow, gapAlpha * 0.4), 1);

      B.drawLabel(ctx, '100x more', { x: gapX + 10, y: (gapY1 + gapY2) / 2 - 5 },
        wA(P.yellow, gapAlpha * 0.8), 'bold 10px "JetBrains Mono", monospace', 'left');
      B.drawLabel(ctx, 'compute', { x: gapX + 10, y: (gapY1 + gapY2) / 2 + 9 },
        wA(P.yellow, gapAlpha * 0.6), '9px "JetBrains Mono", monospace', 'left');
    }

    // === NVIDIA chip icon (pulsing) ===
    if (phase > 0.4) {
      var chipAlpha = B.clamp((phase - 0.4) / 0.2, 0, 1);
      var chipX = w * 0.88;
      var chipY = h * 0.18;
      var chipSize = 16;
      var pulse = Math.sin(time * 3) * 0.3 + 0.7;

      ctx.save();
      ctx.fillStyle = wA(P.green, chipAlpha * 0.25 * pulse);
      ctx.strokeStyle = wA(P.green, chipAlpha * 0.5);
      ctx.lineWidth = 1;
      ctx.shadowColor = P.green;
      ctx.shadowBlur = chipAlpha * pulse * 15;
      ctx.fillRect(chipX - chipSize, chipY - chipSize, chipSize * 2, chipSize * 2);
      ctx.strokeRect(chipX - chipSize, chipY - chipSize, chipSize * 2, chipSize * 2);
      ctx.restore();

      B.drawDot(ctx, { x: chipX, y: chipY }, 4, wA(P.green, chipAlpha * pulse * 0.7), 8);
      B.drawLabel(ctx, 'GPU', { x: chipX, y: chipY + chipSize + 12 },
        wA(P.green, chipAlpha * 0.6), '8px "JetBrains Mono", monospace', 'center');
    }

    // === Jevons paradox callout ===
    if (t > 0.65) {
      var jevAlpha = B.easeOut(B.clamp((t - 0.65) / 0.15, 0, 1));
      B.drawLabel(ctx, 'Jevons paradox:', { x: w * 0.5, y: h * 0.82 },
        wA(P.yellow, jevAlpha * 0.7), 'bold 10px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, 'cheaper per unit \u2192 more total demand',
        { x: w * 0.5, y: h * 0.88 },
        wA(P.white, jevAlpha * 0.5), '10px "JetBrains Mono", monospace', 'center');
    }

    // Bottom insight
    if (t > 0.8) {
      var insAlpha = B.easeOut(B.clamp((t - 0.8) / 0.12, 0, 1));
      B.drawLabel(ctx, 'reasoning models turned inference into a compute-hungry problem',
        { x: w * 0.5, y: h * 0.95 },
        wA(P.white, insAlpha * 0.35), '8px "JetBrains Mono", monospace', 'center');
    }
  }

  return B.animate(canvas, container, draw);
}
