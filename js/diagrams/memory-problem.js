// memory-problem.js — Every AI memory solution is a workaround
// The model is stateless; information leaks from the context window

function MemoryProblemDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var infoStreams = [
    { label: 'conversation', offset: -0.15 },
    { label: 'preferences', offset: 0 },
    { label: 'past decisions', offset: 0.15 }
  ];
  var patches = [
    { label: 'RAG', sub: '(bandage)', x: 0.3, y: 0.72 },
    { label: 'memory files', sub: '(plug)', x: 0.5, y: 0.75 },
    { label: 'summary injection', sub: '(duct tape)', x: 0.7, y: 0.72 }
  ];
  var leakLabels = [
    { text: 'forgotten after conversation', x: 0.25, y: 0.88 },
    { text: 'stale summaries', x: 0.5, y: 0.91 },
    { text: 'retrieval misses', x: 0.75, y: 0.88 }
  ];

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var cx = w * 0.5;
    var bucketTop = h * 0.3, bucketBot = h * 0.75;
    var bucketL = w * 0.25, bucketR = w * 0.75;
    var bucketW = bucketR - bucketL, bucketH = bucketBot - bucketTop;

    // Bucket outline (trapezoid wider at top, gaps at bottom for leaks)
    var topL = bucketL - 10, topR = bucketR + 10;
    var botL = bucketL + 15, botR = bucketR - 15;
    var bw = botR - botL;
    ctx.save();
    ctx.strokeStyle = wA(P.white, 0.25);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(topL, bucketTop); ctx.lineTo(botL, bucketBot);
    ctx.moveTo(topR, bucketTop); ctx.lineTo(botR, bucketBot);
    ctx.moveTo(botL, bucketBot); ctx.lineTo(botL + bw * 0.2, bucketBot);
    ctx.moveTo(botL + bw * 0.35, bucketBot); ctx.lineTo(botL + bw * 0.45, bucketBot);
    ctx.moveTo(botL + bw * 0.55, bucketBot); ctx.lineTo(botL + bw * 0.65, bucketBot);
    ctx.moveTo(botL + bw * 0.8, bucketBot); ctx.lineTo(botR, bucketBot);
    ctx.stroke();
    ctx.restore();

    B.drawLabel(ctx, 'context window', { x: cx, y: bucketTop - 8 },
      wA(P.white, 0.4), '10px "JetBrains Mono", monospace', 'center');

    // Information flowing IN (top curves)
    for (var s = 0; s < infoStreams.length; s++) {
      var stream = infoStreams[s];
      var sx = cx + stream.offset * bucketW;
      var fromY = h * 0.05, toY = bucketTop + 10;
      var wave = Math.sin(time * 2 + s * 2) * 8;
      var pts = [
        { x: sx + wave * 0.5, y: fromY },
        { x: sx - wave, y: fromY + (toY - fromY) * 0.3 },
        { x: sx + wave, y: fromY + (toY - fromY) * 0.7 },
        { x: sx, y: toY }
      ];
      B.drawCurve(ctx, pts, 30, wA(P.teal, 0.4), 2, 6);
      var dotT = (time * 0.3 + s * 0.3) % 1;
      var dotPt = B.cubicPt(pts[0], pts[1], pts[2], pts[3], dotT);
      B.drawDot(ctx, dotPt, 3, wA(P.teal, 0.7), 8);
      B.drawLabel(ctx, stream.label, { x: sx, y: fromY - 4 },
        wA(P.teal, 0.5), '8px "JetBrains Mono", monospace', 'center');
    }

    // Oscillating water level (~60% retained)
    var level = 0.6 + Math.sin(time * 1.2) * 0.06 + Math.sin(time * 0.7) * 0.04;
    var waterY = bucketBot - bucketH * level;
    var wTopL = B.lerp(topL, botL, (waterY - bucketTop) / bucketH) + 4;
    var wTopR = B.lerp(topR, botR, (waterY - bucketTop) / bucketH) - 4;

    // Water fill
    ctx.save();
    ctx.fillStyle = wA(P.blue, 0.08);
    ctx.beginPath();
    ctx.moveTo(wTopL, waterY);
    for (var wx = 0; wx <= 20; wx++) {
      var wf = wx / 20;
      ctx.lineTo(B.lerp(wTopL, wTopR, wf),
        waterY + Math.sin(wf * Math.PI * 4 + time * 3) * 3);
    }
    ctx.lineTo(botR - 4, bucketBot);
    ctx.lineTo(botL + 4, bucketBot);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Water surface line
    ctx.save();
    ctx.strokeStyle = wA(P.blue, 0.3);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var wx2 = 0; wx2 <= 30; wx2++) {
      var wf2 = wx2 / 30;
      var wxx = B.lerp(wTopL, wTopR, wf2);
      var wy = waterY + Math.sin(wf2 * Math.PI * 4 + time * 3) * 3;
      if (wx2 === 0) ctx.moveTo(wxx, wy); else ctx.lineTo(wxx, wy);
    }
    ctx.stroke();
    ctx.restore();

    B.drawLabel(ctx, 'retained: ~' + Math.round(level * 100) + '%',
      { x: cx, y: (waterY + bucketBot) / 2 },
      wA(P.blue, 0.5), '10px "JetBrains Mono", monospace', 'center');

    // Leaks escaping bottom
    var leakPts = [0.28, 0.5, 0.72];
    for (var l = 0; l < leakPts.length; l++) {
      var lx = B.lerp(botL, botR, leakPts[l]);
      var wave2 = Math.sin(time * 2.5 + l * 1.7) * 10;
      var endY = h * 0.92;
      var lPts = [
        { x: lx, y: bucketBot },
        { x: lx + wave2, y: bucketBot + (endY - bucketBot) * 0.4 },
        { x: lx - wave2 * 0.5, y: bucketBot + (endY - bucketBot) * 0.7 },
        { x: lx + wave2 * 0.3, y: endY }
      ];
      B.drawCurve(ctx, lPts, 20, wA(P.coral, 0.3), 1.5, 4);
      var dT = (time * 0.4 + l * 0.33) % 1;
      B.drawDot(ctx, B.cubicPt(lPts[0], lPts[1], lPts[2], lPts[3], dT),
        2, wA(P.coral, 0.6), 4);
    }

    // Workaround patches
    for (var p = 0; p < patches.length; p++) {
      var patch = patches[p];
      var px = w * patch.x, py = h * patch.y;
      var pulse = 0.5 + Math.sin(time * 2 + p * 2) * 0.3;
      ctx.save();
      ctx.shadowColor = P.green;
      ctx.shadowBlur = 8 * pulse;
      ctx.fillStyle = wA(P.green, 0.15 * pulse);
      ctx.strokeStyle = wA(P.green, 0.4 * pulse);
      ctx.lineWidth = 1;
      ctx.fillRect(px - 20, py - 7, 40, 14);
      ctx.strokeRect(px - 20, py - 7, 40, 14);
      ctx.restore();
      B.drawLabel(ctx, patch.label, { x: px, y: py + 2 },
        wA(P.green, 0.7 * pulse), '8px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, patch.sub, { x: px, y: py + 14 },
        wA(P.green, 0.35), '7px "JetBrains Mono", monospace', 'center');
    }

    // Leak labels
    for (var ll = 0; ll < leakLabels.length; ll++) {
      var lbl = leakLabels[ll];
      B.drawLabel(ctx, lbl.text, { x: w * lbl.x, y: h * lbl.y },
        wA(P.coral, 0.35), '7px "JetBrains Mono", monospace', 'center');
    }

    // Formula
    B.drawLabel(ctx, 'memory = context_window + workarounds - leakage',
      { x: cx, y: h * 0.97 },
      wA(P.yellow, 0.5), '9px "JetBrains Mono", monospace', 'center');

    // Title
    B.drawLabel(ctx, 'the memory problem', { x: w * 0.08, y: h * 0.04 },
      wA(P.white, 0.35), '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
