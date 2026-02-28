// context-window.js — Context window visualization
// Shows fixed-size memory filling up and overflowing

function ContextWindowDiagram(canvas, container) {
  var B = Bezier, P = B.palette;
  var CYCLE = 12, FILL_DUR = 7.0, OVERFLOW_DUR = 2.5, FADE_DUR = 1.0;

  var chunks = [
    { label: 'system prompt', tokens: 2,  color: P.purple },
    { label: 'conversation',  tokens: 40, color: P.teal },
    { label: 'retrieved docs', tokens: 20, color: P.blue },
    { label: 'user input',    tokens: 66, color: P.green },
  ];
  var totalK = 128;
  var usedK = [2, 40, 20, 66];
  var cumulativeK = [];
  var run = 0;
  for (var k = 0; k < usedK.length; k++) { cumulativeK.push(run); run += usedK[k]; }

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);
    var mx = w * 0.10, my = h * 0.16, t = time % CYCLE;
    var fadeT = t > (CYCLE - FADE_DUR) ? B.clamp((t - (CYCLE - FADE_DUR)) / FADE_DUR, 0, 1) : 0;
    var gA = 1 - fadeT; // globalAlpha

    // Context window box
    var bx = w * 0.25, by = h * 0.22, bw = w * 0.50, bh = h * 0.45, r = 6;
    ctx.save();
    ctx.strokeStyle = B.withAlpha(P.white, 0.3 * gA);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx + r, by);
    ctx.lineTo(bx + bw - r, by); ctx.arcTo(bx + bw, by, bx + bw, by + r, r);
    ctx.lineTo(bx + bw, by + bh - r); ctx.arcTo(bx + bw, by + bh, bx + bw - r, by + bh, r);
    ctx.lineTo(bx + r, by + bh); ctx.arcTo(bx, by + bh, bx, by + bh - r, r);
    ctx.lineTo(bx, by + r); ctx.arcTo(bx, by, bx + r, by, r);
    ctx.closePath(); ctx.stroke(); ctx.restore();

    B.drawLabel(ctx, '128K tokens', { x: bx + bw / 2, y: by - 12 },
      B.withAlpha(P.white, 0.5 * gA), '11px "JetBrains Mono", monospace', 'center');

    var fillProgress = B.easeOut(B.clamp(t / FILL_DUR, 0, 1));
    var cn = chunks.length;

    // Draw each chunk
    for (var c = 0; c < cn; c++) {
      var cp = B.easeOut(B.clamp((fillProgress - c / cn) / (1 / cn), 0, 1));
      if (cp <= 0) continue;
      var sf = cumulativeK[c] / totalK, ef = (cumulativeK[c] + usedK[c]) / totalK;
      var ce = B.lerp(sf, ef, cp);
      var sx = bx + 2 + sf * (bw - 4), sw = (ce - sf) * (bw - 4);

      ctx.save();
      ctx.fillStyle = B.withAlpha(chunks[c].color, 0.25 * gA);
      ctx.fillRect(sx, by + 2, sw, bh - 4);
      ctx.fillStyle = B.withAlpha(chunks[c].color, 0.4 * gA);
      ctx.fillRect(sx, by + 2, sw, 2);
      ctx.restore();

      // Flowing Bezier curve entering from left
      if (cp < 1) {
        var fy = by + bh * (0.2 + c * 0.2), fsx = bx - w * 0.15;
        var fPts = [
          { x: fsx, y: fy - 10 + Math.sin(time * 2 + c) * 8 },
          { x: B.lerp(fsx, bx, 0.5), y: fy + Math.cos(time * 3 + c) * 5 },
          { x: bx, y: fy }, { x: sx + sw, y: by + bh / 2 }
        ];
        B.drawCurve(ctx, fPts, 40, B.withAlpha(chunks[c].color, 0.5 * cp * gA), 1.5, 6);
        var dT = (time * 0.8 + c * 0.3) % 1;
        var dP = B.cubicPt(fPts[0], fPts[1], fPts[2], fPts[3], dT);
        B.drawDot(ctx, dP, 2, B.withAlpha(chunks[c].color, 0.6 * gA), 4);
      }

      // Chunk label inside segment
      if (cp > 0.5 && sw > 30) {
        var la = B.clamp((cp - 0.5) / 0.3, 0, 1);
        var fs = Math.max(8, Math.min(10, sw / chunks[c].label.length * 1.2));
        B.drawLabel(ctx, chunks[c].label, { x: sx + sw / 2, y: by + bh / 2 - 7 },
          B.withAlpha(chunks[c].color, 0.7 * la * gA), fs + 'px "JetBrains Mono", monospace', 'center');
        B.drawLabel(ctx, usedK[c] + 'K', { x: sx + sw / 2, y: by + bh / 2 + 8 },
          B.withAlpha(chunks[c].color, 0.5 * la * gA), '9px "JetBrains Mono", monospace', 'center');
      }
    }

    // Fill level indicator bar
    var totalUsed = 0;
    for (var u = 0; u < cn; u++) totalUsed += usedK[u] * B.clamp((fillProgress - u / cn) / (1 / cn), 0, 1);
    var ff = totalUsed / totalK;
    var barX = bx + bw + 15, barW = 8;
    ctx.save();
    ctx.strokeStyle = B.withAlpha(P.white, 0.2 * gA); ctx.lineWidth = 1;
    ctx.strokeRect(barX, by, barW, bh);
    var barC = ff > 0.9 ? P.coral : ff > 0.7 ? P.yellow : P.teal;
    ctx.fillStyle = B.withAlpha(barC, 0.5 * gA);
    ctx.fillRect(barX, by + bh * (1 - ff), barW, bh * ff);
    ctx.restore();
    B.drawLabel(ctx, Math.round(ff * 100) + '%', { x: barX + barW / 2, y: by + bh + 14 },
      B.withAlpha(barC, 0.7 * gA), '10px "JetBrains Mono", monospace', 'center');

    // Overflow animation
    if (t > FILL_DUR && t < FILL_DUR + OVERFLOW_DUR) {
      var oT = B.easeInOut((t - FILL_DUR) / OVERFLOW_DUR);
      for (var o = 0; o < 3; o++) {
        var oY = by + bh * (0.3 + o * 0.2);
        B.drawCurve(ctx, [
          { x: bx + bw, y: oY },
          { x: bx + bw + 20, y: oY + 5 - o * 3 },
          { x: bx + bw + w * 0.12 * oT, y: oY + 3 - o * 2 }
        ], 30, B.withAlpha(P.coral, 0.4 * oT * gA), 1.5, 4);
      }
      B.drawLabel(ctx, 'truncated', { x: bx + bw + 15, y: by - 12 },
        B.withAlpha(P.coral, 0.6 * oT * gA), '9px "JetBrains Mono", monospace', 'left');
    }

    // Math formula
    if (fillProgress > 0.7) {
      var fa = B.clamp((fillProgress - 0.7) / 0.2, 0, 1) * gA;
      B.drawLabel(ctx, 'available = window - system - history - retrieval',
        { x: w / 2, y: h * 0.80 }, B.withAlpha(P.white, 0.4 * fa), '10px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, '128K - 2K - 40K - 20K = 66K remaining',
        { x: w / 2, y: h * 0.80 + 18 }, B.withAlpha(P.yellow, 0.6 * fa), '11px "JetBrains Mono", monospace', 'center');
    }

    B.drawLabel(ctx, 'context window', { x: mx + 4, y: my * 0.45 },
      B.withAlpha(P.white, 0.35 * gA), '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
