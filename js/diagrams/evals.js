// evals.js — Evals: measuring LLM quality
// Two prompt variants compared via noisy accuracy curves,
// means, confidence intervals, and statistical significance

function EvalsDiagram(canvas, container) {
  var B = Bezier, P = B.palette;
  var CYCLE = 10, DRAW_DUR = 5.0, STATS_DUR = 2.5, FADE_DUR = 1.0;
  var NUM_POINTS = 40, meanA = 0.72, meanB = 0.81;
  var scoresA = [], scoresB = [];

  function seededRand(seed) {
    var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  for (var i = 0; i < NUM_POINTS; i++) {
    scoresA.push(B.clamp(meanA + (seededRand(i * 3 + 1) - 0.5) * 0.18, 0.45, 0.95));
    scoresB.push(B.clamp(meanB + (seededRand(i * 3 + 2) - 0.5) * 0.15, 0.55, 0.98));
  }
  var actualMeanA = 0, actualMeanB = 0, stdA = 0, stdB = 0;
  for (var m = 0; m < NUM_POINTS; m++) { actualMeanA += scoresA[m]; actualMeanB += scoresB[m]; }
  actualMeanA /= NUM_POINTS; actualMeanB /= NUM_POINTS;
  for (var s = 0; s < NUM_POINTS; s++) {
    stdA += (scoresA[s] - actualMeanA) * (scoresA[s] - actualMeanA);
    stdB += (scoresB[s] - actualMeanB) * (scoresB[s] - actualMeanB);
  }
  stdA = Math.sqrt(stdA / NUM_POINTS); stdB = Math.sqrt(stdB / NUM_POINTS);

  // Helper to draw a score polyline with glow
  function drawScoreCurve(ctx, scores, count, color, gA) {
    if (count < 2) return;
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = 6 * gA;
    ctx.strokeStyle = B.withAlpha(color, 0.7 * gA);
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    for (var j = 0; j < count; j++) {
      var jx = ctx._chartX + (j / (NUM_POINTS - 1)) * ctx._chartW;
      var jy = ctx._chartY + ctx._chartH - (scores[j] - 0.4) / 0.6 * ctx._chartH;
      if (j === 0) ctx.moveTo(jx, jy); else ctx.lineTo(jx, jy);
    }
    ctx.stroke(); ctx.restore();
    for (var d = 0; d < count; d += 3) {
      var dx = ctx._chartX + (d / (NUM_POINTS - 1)) * ctx._chartW;
      var dy = ctx._chartY + ctx._chartH - (scores[d] - 0.4) / 0.6 * ctx._chartH;
      B.drawDot(ctx, { x: dx, y: dy }, 2, B.withAlpha(color, 0.5 * gA));
    }
  }

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);
    var mx = w * 0.10, my = h * 0.14;
    var cX = mx, cY = h * 0.18, cW = w * 0.75, cH = h * 0.52;
    // Stash for helper
    ctx._chartX = cX; ctx._chartY = cY; ctx._chartW = cW; ctx._chartH = cH;

    var t = time % CYCLE;
    var fadeT = t > (CYCLE - FADE_DUR) ? B.clamp((t - (CYCLE - FADE_DUR)) / FADE_DUR, 0, 1) : 0;
    var gA = 1 - fadeT;
    var drawP = B.easeOut(B.clamp(t / DRAW_DUR, 0, 1));
    var vis = Math.floor(drawP * NUM_POINTS);
    var statsT = B.easeOut(B.clamp((t - DRAW_DUR) / STATS_DUR, 0, 1));

    function sToY(sc) { return cY + cH - (sc - 0.4) / 0.6 * cH; }

    // Axes
    B.drawLine(ctx, { x: cX, y: cY }, { x: cX, y: cY + cH }, B.withAlpha(P.white, 0.15 * gA), 1);
    B.drawLine(ctx, { x: cX, y: cY + cH }, { x: cX + cW, y: cY + cH }, B.withAlpha(P.white, 0.15 * gA), 1);
    for (var yl = 0.5; yl <= 1.0; yl += 0.1) {
      var yy = sToY(yl);
      B.drawLine(ctx, { x: cX - 4, y: yy }, { x: cX, y: yy }, B.withAlpha(P.white, 0.2 * gA), 1);
      B.drawLabel(ctx, (yl * 100).toFixed(0) + '%', { x: cX - 8, y: yy },
        B.withAlpha(P.white, 0.25 * gA), '8px "JetBrains Mono", monospace', 'right');
      B.drawLine(ctx, { x: cX, y: yy }, { x: cX + cW, y: yy },
        B.withAlpha(P.white, 0.04 * gA), 1, [2, 6]);
    }

    // Confidence bands
    if (statsT > 0) {
      var ba = statsT * 0.08 * gA;
      [[P.teal, actualMeanA, stdA], [P.coral, actualMeanB, stdB]].forEach(function(d) {
        ctx.save(); ctx.fillStyle = B.withAlpha(d[0], ba); ctx.beginPath();
        ctx.rect(cX, sToY(d[1] + d[2]), cW, sToY(d[1] - d[2]) - sToY(d[1] + d[2]));
        ctx.fill(); ctx.restore();
      });
    }

    // Score curves
    drawScoreCurve(ctx, scoresA, vis, P.teal, gA);
    drawScoreCurve(ctx, scoresB, vis, P.coral, gA);

    // Mean lines
    if (statsT > 0) {
      var mA = statsT * gA;
      var rA = 0, rB = 0, cnt = Math.max(vis, 1);
      for (var rm = 0; rm < cnt; rm++) { rA += scoresA[rm]; rB += scoresB[rm]; }
      var dA = B.lerp(rA / cnt, actualMeanA, statsT), dB = B.lerp(rB / cnt, actualMeanB, statsT);
      B.drawLine(ctx, { x: cX, y: sToY(dA) }, { x: cX + cW, y: sToY(dA) },
        B.withAlpha(P.teal, 0.5 * mA), 1.5, [6, 4]);
      B.drawLine(ctx, { x: cX, y: sToY(dB) }, { x: cX + cW, y: sToY(dB) },
        B.withAlpha(P.coral, 0.5 * mA), 1.5, [6, 4]);
      var lx = cX + cW + 10;
      B.drawLabel(ctx, 'A: ' + (dA * 100).toFixed(0) + '%', { x: lx, y: sToY(dA) },
        B.withAlpha(P.teal, 0.7 * mA), '10px "JetBrains Mono", monospace', 'left');
      B.drawLabel(ctx, 'B: ' + (dB * 100).toFixed(0) + '%', { x: lx, y: sToY(dB) },
        B.withAlpha(P.coral, 0.7 * mA), '10px "JetBrains Mono", monospace', 'left');
    }

    // Legend
    B.drawDot(ctx, { x: cX + 10, y: cY - 10 }, 4, B.withAlpha(P.teal, 0.6 * gA));
    B.drawLabel(ctx, 'Prompt A', { x: cX + 20, y: cY - 10 },
      B.withAlpha(P.teal, 0.6 * gA), '10px "JetBrains Mono", monospace', 'left');
    B.drawDot(ctx, { x: cX + 90, y: cY - 10 }, 4, B.withAlpha(P.coral, 0.6 * gA));
    B.drawLabel(ctx, 'Prompt B', { x: cX + 100, y: cY - 10 },
      B.withAlpha(P.coral, 0.6 * gA), '10px "JetBrains Mono", monospace', 'left');

    // Delta and p-value
    if (statsT > 0.5) {
      var ra = B.clamp((statsT - 0.5) / 0.5, 0, 1) * gA;
      var delta = actualMeanB - actualMeanA;
      B.drawLabel(ctx, '\u0394 = B_mean - A_mean = +' + (delta * 100).toFixed(0) + '%',
        { x: w / 2, y: h * 0.80 }, B.withAlpha(P.yellow, 0.7 * ra), '12px "JetBrains Mono", monospace', 'center');
      var pD = statsT < 0.8 ? 'p = ' + (0.2 - statsT * 0.22).toFixed(2) + '...' : 'p < 0.05';
      B.drawLabel(ctx, pD, { x: w / 2, y: h * 0.80 + 20 },
        B.withAlpha(statsT >= 0.8 ? P.green : P.white, 0.6 * ra), '11px "JetBrains Mono", monospace', 'center');
      if (statsT > 0.85) {
        var wa = B.clamp((statsT - 0.85) / 0.15, 0, 1) * ra;
        B.drawLabel(ctx, 'Prompt B wins', { x: w / 2, y: h * 0.80 + 40 },
          B.withAlpha(P.coral, 0.8 * wa), 'bold 12px "JetBrains Mono", monospace', 'center');
      }
    }

    B.drawLabel(ctx, 'eval samples', { x: cX + cW / 2, y: cY + cH + 16 },
      B.withAlpha(P.white, 0.25 * gA), '9px "JetBrains Mono", monospace', 'center');
    B.drawLabel(ctx, 'evals', { x: mx + 4, y: my * 0.45 },
      B.withAlpha(P.white, 0.35 * gA), '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
