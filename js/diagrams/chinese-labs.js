// chinese-labs.js — US vs Chinese labs benchmark convergence

function ChineseLabsDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var drawT = B.easeOut(B.clamp(t / 0.75, 0, 1));

    var mx = w * 0.15;
    var topY = h * 0.18;
    var botY = h * 0.72;
    var chartH = botY - topY;
    var chartW = w - mx * 2;

    // US labs (left column)
    var usLabs = ['OpenAI', 'Anthropic', 'Google'];
    var usX = mx - 8;
    var usColor = P.blue;

    // China labs (right column)
    var cnLabs = ['DeepSeek', 'Qwen', 'Yi'];
    var cnX = w - mx + 8;
    var cnColor = P.coral;

    // Draw lab names on sides
    for (var i = 0; i < 3; i++) {
      var labY = topY + chartH * 0.15 + i * chartH * 0.3;

      // US lab dot and label
      B.drawDot(ctx, { x: usX - 28, y: labY }, 4, wA(usColor, 0.5), 6);
      B.drawLabel(ctx, usLabs[i], { x: usX - 38, y: labY },
        wA(usColor, 0.6), '9px "JetBrains Mono", monospace', 'right');

      // China lab dot and label
      B.drawDot(ctx, { x: cnX + 28, y: labY }, 4, wA(cnColor, 0.5), 6);
      B.drawLabel(ctx, cnLabs[i], { x: cnX + 38, y: labY },
        wA(cnColor, 0.6), '9px "JetBrains Mono", monospace', 'left');
    }

    // Column headers
    B.drawLabel(ctx, 'US', { x: usX - 28, y: topY - 12 },
      wA(usColor, 0.7), 'bold 11px "JetBrains Mono", monospace', 'right');
    B.drawLabel(ctx, 'China', { x: cnX + 28, y: topY - 12 },
      wA(cnColor, 0.7), 'bold 11px "JetBrains Mono", monospace', 'left');

    // Benchmarks
    var benchmarks = [
      { name: 'MMLU', usStart: 0.88, cnStart: 0.65, usEnd: 0.90, cnEnd: 0.89 },
      { name: 'HumanEval', usStart: 0.82, cnStart: 0.55, usEnd: 0.88, cnEnd: 0.86 },
      { name: 'MATH', usStart: 0.76, cnStart: 0.48, usEnd: 0.82, cnEnd: 0.80 }
    ];

    // Draw benchmark convergence lines
    for (var b = 0; b < 3; b++) {
      var bm = benchmarks[b];
      var bmY = topY + chartH * 0.15 + b * chartH * 0.3;

      // Benchmark name label in center
      B.drawLabel(ctx, bm.name, { x: w * 0.5, y: bmY - 16 },
        wA(P.white, 0.3), '8px "JetBrains Mono", monospace', 'center');

      // US score line (starts high, stays roughly same)
      var usStartY = bmY - (bm.usStart - 0.5) * chartH * 0.5;
      var usEndY = bmY - (bm.usEnd - 0.5) * chartH * 0.5;
      var usStartPt = { x: mx, y: usStartY };
      var usEndPt = { x: mx + chartW, y: usEndY };

      // China score line (starts low, climbs to match)
      var cnStartY = bmY - (bm.cnStart - 0.5) * chartH * 0.5;
      var cnEndY = bmY - (bm.cnEnd - 0.5) * chartH * 0.5;
      var cnStartPt = { x: mx, y: cnStartY };
      var cnEndPt = { x: mx + chartW, y: cnEndY };

      // US Bézier curve
      var usPts = [
        usStartPt,
        { x: mx + chartW * 0.35, y: usStartY + (usEndY - usStartY) * 0.2 },
        { x: mx + chartW * 0.7, y: usEndY - (usEndY - usStartY) * 0.1 },
        usEndPt
      ];

      // China Bézier curve (steeper climb)
      var cnPts = [
        cnStartPt,
        { x: mx + chartW * 0.25, y: cnStartY + (cnEndY - cnStartY) * 0.15 },
        { x: mx + chartW * 0.55, y: cnEndY + (cnStartY - cnEndY) * 0.1 },
        cnEndPt
      ];

      // Draw dim baselines
      B.drawCurve(ctx, usPts, 60, wA(usColor, 0.06), 1, 0);
      B.drawCurve(ctx, cnPts, 60, wA(cnColor, 0.06), 1, 0);

      // Animated draw up to drawT
      var steps = 60;
      var maxStep = Math.ceil(steps * drawT);

      // US line
      ctx.save();
      ctx.strokeStyle = wA(usColor, 0.7);
      ctx.lineWidth = 2;
      ctx.shadowColor = usColor;
      ctx.shadowBlur = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var si = 0; si <= maxStep; si++) {
        var st = si / steps;
        var pt = B.cubicPt(usPts[0], usPts[1], usPts[2], usPts[3], st);
        if (si === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();

      // China line
      ctx.save();
      ctx.strokeStyle = wA(cnColor, 0.7);
      ctx.lineWidth = 2;
      ctx.shadowColor = cnColor;
      ctx.shadowBlur = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var si = 0; si <= maxStep; si++) {
        var st = si / steps;
        var pt = B.cubicPt(cnPts[0], cnPts[1], cnPts[2], cnPts[3], st);
        if (si === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();

      // Score labels at current position
      if (drawT > 0.1) {
        var usScore = B.lerp(bm.usStart, bm.usEnd, drawT);
        var cnScore = B.lerp(bm.cnStart, bm.cnEnd, drawT);
        var usPt = B.cubicPt(usPts[0], usPts[1], usPts[2], usPts[3], drawT);
        var cnPt = B.cubicPt(cnPts[0], cnPts[1], cnPts[2], cnPts[3], drawT);

        B.drawDot(ctx, usPt, 3, usColor, 6);
        B.drawDot(ctx, cnPt, 3, cnColor, 6);

        B.drawLabel(ctx, (usScore * 100).toFixed(0) + '%',
          { x: usPt.x + 8, y: usPt.y - 8 },
          wA(usColor, 0.5), '8px "JetBrains Mono", monospace', 'left');
        B.drawLabel(ctx, (cnScore * 100).toFixed(0) + '%',
          { x: cnPt.x + 8, y: cnPt.y + 10 },
          wA(cnColor, 0.5), '8px "JetBrains Mono", monospace', 'left');
      }

      // Flash at convergence point
      if (drawT > 0.85) {
        var flashAlpha = B.clamp((drawT - 0.85) / 0.1, 0, 1);
        var flashPulse = Math.sin(time * 6) * 0.3 + 0.7;
        var convX = mx + chartW * 0.9;
        var convY = (usEndY + cnEndY) / 2;
        B.drawDot(ctx, { x: convX, y: convY }, 6 * flashPulse,
          wA(P.yellow, flashAlpha * 0.4), 18);
      }
    }

    // "despite export controls" label — fades in at end
    if (t > 0.7) {
      var despiteAlpha = B.easeOut(B.clamp((t - 0.7) / 0.2, 0, 1));
      B.drawLabel(ctx, 'despite export controls',
        { x: w * 0.5, y: h * 0.86 },
        wA(P.yellow, despiteAlpha * 0.6),
        '11px "JetBrains Mono", monospace', 'center');
    }

    // Time axis labels
    if (drawT > 0.05) {
      B.drawLabel(ctx, '2023', { x: mx, y: botY + 14 },
        wA(P.white, 0.3), '8px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, '2024', { x: mx + chartW * 0.5, y: botY + 14 },
        wA(P.white, 0.3), '8px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, '2025', { x: mx + chartW, y: botY + 14 },
        wA(P.white, 0.3), '8px "JetBrains Mono", monospace', 'center');
    }

    // Formula
    if (t > 0.8) {
      var fAlpha = B.easeOut(B.clamp((t - 0.8) / 0.15, 0, 1));
      B.drawLabel(ctx, 'open research + talent + compute = convergence',
        { x: w * 0.5, y: h * 0.93 },
        wA(P.white, fAlpha * 0.35), '9px "JetBrains Mono", monospace', 'center');
    }

    // Title
    B.drawLabel(ctx, 'the convergence', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
