// vibe-coding.js — The skill inversion: producing code got easy, evaluating didn't
// Two crossing curves showing the inversion of bottleneck skills

function VibeCodingDiagram(canvas, container) {
  const B = Bezier;
  const P = B.palette;

  var CYCLE = 8;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var mx = w * 0.11, my = h * 0.14;
    var iw = w - mx * 2, ih = h - my * 2.4;
    var phase = (time % CYCLE) / CYCLE;
    var drawT = B.easeOut(B.clamp(phase * 1.6, 0, 1));

    var originX = mx, originY = my + ih;

    // Axes
    B.drawLine(ctx, { x: originX, y: my * 1.2 }, { x: originX, y: originY },
      B.withAlpha(P.white, 0.15), 1);
    B.drawLine(ctx, { x: originX, y: originY }, { x: mx + iw, y: originY },
      B.withAlpha(P.white, 0.15), 1);

    // Y-axis label
    B.drawLabel(ctx, 'skill difficulty', { x: mx - 4, y: my * 1.1 },
      P.textDim, '9px "JetBrains Mono", monospace', 'right');

    // X-axis labels
    B.drawLabel(ctx, '2022', { x: mx, y: originY + 18 },
      P.textDim, '9px "JetBrains Mono", monospace');
    B.drawLabel(ctx, '2024', { x: mx + iw * 0.5, y: originY + 18 },
      P.textDim, '9px "JetBrains Mono", monospace');
    B.drawLabel(ctx, '2026', { x: mx + iw, y: originY + 18 },
      P.textDim, '9px "JetBrains Mono", monospace');

    // Production curve (green): starts high, drops sharply
    // Evaluation curve (coral): starts lower, stays flat / rises slightly
    var STEPS = 80;

    function productionY(t) {
      // Starts at 0.85, drops via sigmoid to 0.12
      var sig = 1 / (1 + Math.exp(-12 * (t - 0.4)));
      return 0.85 - 0.73 * sig;
    }

    function evaluationY(t) {
      // Starts at 0.55, rises gently to 0.68
      return 0.55 + 0.13 * t + 0.05 * Math.sin(t * Math.PI);
    }

    // Find crossing point
    var crossT = 0, crossX = 0, crossY = 0;
    for (var ci = 1; ci < 100; ci++) {
      var ct = ci / 100;
      if (productionY(ct) < evaluationY(ct)) {
        crossT = ct;
        crossX = mx + ct * iw;
        crossY = originY - productionY(ct) * ih;
        break;
      }
    }

    // Draw production curve (green)
    ctx.beginPath();
    for (var i = 0; i <= STEPS; i++) {
      var t = (i / STEPS) * drawT;
      var px = mx + t * iw;
      var py = originY - productionY(t) * ih;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = B.withAlpha(P.green, 0.75);
    ctx.lineWidth = 2.5;
    ctx.shadowColor = P.green;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw evaluation curve (coral)
    ctx.beginPath();
    for (var j = 0; j <= STEPS; j++) {
      var t2 = (j / STEPS) * drawT;
      var ex = mx + t2 * iw;
      var ey = originY - evaluationY(t2) * ih;
      if (j === 0) ctx.moveTo(ex, ey); else ctx.lineTo(ex, ey);
    }
    ctx.strokeStyle = B.withAlpha(P.coral, 0.75);
    ctx.lineWidth = 2.5;
    ctx.shadowColor = P.coral;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Endpoint dots
    if (drawT > 0.05) {
      var pEnd = { x: mx + drawT * iw, y: originY - productionY(drawT) * ih };
      var eEnd = { x: mx + drawT * iw, y: originY - evaluationY(drawT) * ih };
      B.drawDot(ctx, pEnd, 4, P.green, 8);
      B.drawDot(ctx, eEnd, 4, P.coral, 8);
    }

    // Curve labels
    if (drawT > 0.15) {
      B.drawLabel(ctx, 'producing code', { x: mx + iw * 0.12, y: originY - ih * 0.90 },
        B.withAlpha(P.green, 0.7), '10px "JetBrains Mono", monospace', 'left');
      B.drawLabel(ctx, 'evaluating code', { x: mx + iw * 0.12, y: originY - ih * 0.48 },
        B.withAlpha(P.coral, 0.7), '10px "JetBrains Mono", monospace', 'left');
    }

    // Crossing point marker
    if (drawT >= crossT) {
      var crossAlpha = B.easeOut(B.clamp((drawT - crossT) * 8, 0, 1));
      var pulse = 0.5 + 0.5 * Math.sin(time * 3);
      B.drawDot(ctx, { x: crossX, y: crossY }, 6 + pulse * 2,
        B.withAlpha(P.yellow, crossAlpha * 0.7), 15);
      B.drawRing(ctx, { x: crossX, y: crossY }, 12 + pulse * 3,
        B.withAlpha(P.yellow, crossAlpha * 0.25), 1.5);

      // Crossing label
      B.drawLabel(ctx, 'skill inversion', { x: crossX, y: crossY - 22 },
        B.withAlpha(P.yellow, crossAlpha * 0.9),
        'bold 11px "JetBrains Mono", monospace');

      // Vertical dashed line at crossing
      B.drawLine(ctx, { x: crossX, y: my * 1.5 }, { x: crossX, y: originY },
        B.withAlpha(P.yellow, crossAlpha * 0.12), 1, [3, 5]);
    }

    // Zone labels (before and after)
    if (drawT > 0.6) {
      var zoneAlpha = B.easeOut(B.clamp((drawT - 0.6) * 4, 0, 1));
      B.drawLabel(ctx, 'writing code = the job',
        { x: mx + iw * 0.18, y: originY - ih * 0.15 },
        B.withAlpha(P.white, zoneAlpha * 0.3),
        '9px "JetBrains Mono", monospace', 'left');
    }
    if (drawT > 0.85) {
      var zone2Alpha = B.easeOut(B.clamp((drawT - 0.85) * 6, 0, 1));
      B.drawLabel(ctx, 'reviewing code = the job',
        { x: mx + iw * 0.78, y: originY - ih * 0.15 },
        B.withAlpha(P.white, zone2Alpha * 0.3),
        '9px "JetBrains Mono", monospace', 'right');
    }

    // Formula
    var fAlpha = B.easeInOut(B.clamp(phase * 3 - 1.5, 0, 1));
    B.drawLabel(ctx, 'value = evaluation_skill / production_ease',
      { x: w / 2, y: h - my * 0.25 },
      B.withAlpha(P.white, fAlpha * 0.4),
      '10px "JetBrains Mono", monospace');

    // Top title
    B.drawLabel(ctx, 'the skill inversion',
      { x: w / 2, y: my * 0.45 },
      B.withAlpha(P.purple, 0.55), '11px "JetBrains Mono", monospace');
  }

  return B.animate(canvas, container, draw);
}
