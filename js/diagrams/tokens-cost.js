// tokens-cost.js — Token stream flowing along a Bezier curve with running cost
// Visualises tokens as the atomic unit of LLM cost.

function TokensCostDiagram(canvas, container) {
  const B = Bezier;
  const P = B.palette;
  const wA = B.withAlpha;

  var TOKEN_LABELS = ['The', 'mod', 'el', 'pred', 'icts', 'the', 'next', 'tok', 'en'];
  var TOKENS_PER_SEC = 2.5;       // visual token flow speed
  var PRICE_PER_TOKEN = 0.000003; // $0.003 per 1K tokens
  var BATCH_INTERVAL = 5;         // seconds between batch summaries
  var BATCH_SHOW_DUR = 2;         // how long batch summary shows

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var mx = w * 0.08;
    var streamY = h * 0.35;

    // Stream curve (gentle wave left to right)
    var sStart = { x: mx, y: streamY };
    var sEnd = { x: w - mx, y: streamY };
    var span = sEnd.x - sStart.x;
    var sCp1 = { x: sStart.x + span * 0.3, y: streamY - h * 0.06 };
    var sCp2 = { x: sStart.x + span * 0.7, y: streamY + h * 0.06 };
    var sPts = [sStart, sCp1, sCp2, sEnd];

    // Draw the stream curve (dim)
    B.drawCurve(ctx, sPts, 60, wA(P.teal, 0.15), 1.5, 0);
    // Glow
    B.drawCurve(ctx, sPts, 60, wA(P.teal, 0.05), 4, 8);

    // Token flow: continuously moving tokens along the curve
    var totalTokens = Math.floor(time * TOKENS_PER_SEC);
    var visibleCount = 8; // max tokens visible at once
    var spacing = 1.0 / (visibleCount + 1);

    for (var i = 0; i < visibleCount; i++) {
      // Each token's position on curve (0-1), wrapping
      var baseOffset = (time * TOKENS_PER_SEC * spacing) % 1;
      var tPos = (baseOffset + i * spacing) % 1;

      var pt = B.cubicPt(sPts[0], sPts[1], sPts[2], sPts[3], tPos);
      var tokenIdx = (totalTokens - i + TOKEN_LABELS.length * 100) % TOKEN_LABELS.length;
      var label = TOKEN_LABELS[tokenIdx];

      // Token rectangle
      var rw = Math.max(24, label.length * 8 + 8);
      var rh = 18;
      var alpha = 1 - Math.abs(tPos - 0.5) * 1.2; // fade near edges
      alpha = B.clamp(alpha, 0.1, 0.8);

      // Background rect
      ctx.save();
      ctx.fillStyle = wA(P.teal, alpha * 0.2);
      ctx.strokeStyle = wA(P.teal, alpha * 0.5);
      ctx.lineWidth = 1;
      ctx.shadowColor = P.teal;
      ctx.shadowBlur = alpha * 6;
      var rx = pt.x - rw / 2;
      var ry = pt.y - rh / 2;
      ctx.beginPath();
      // Rounded rect
      var cr = 3;
      ctx.moveTo(rx + cr, ry);
      ctx.lineTo(rx + rw - cr, ry);
      ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + cr);
      ctx.lineTo(rx + rw, ry + rh - cr);
      ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - cr, ry + rh);
      ctx.lineTo(rx + cr, ry + rh);
      ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - cr);
      ctx.lineTo(rx, ry + cr);
      ctx.quadraticCurveTo(rx, ry, rx + cr, ry);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Token label
      B.drawLabel(ctx, '"' + label + '"', pt,
        wA(P.white, alpha), '9px "JetBrains Mono", monospace', 'center');
    }

    // Running cost counter
    var costY = h * 0.56;
    var runningCost = totalTokens * PRICE_PER_TOKEN;
    var costStr = '$' + runningCost.toFixed(6);

    B.drawLabel(ctx, 'running cost', { x: w / 2, y: costY },
      wA(P.white, 0.4), '9px "JetBrains Mono", monospace', 'center');

    // Cost number (larger, glowing)
    ctx.save();
    ctx.shadowColor = P.yellow;
    ctx.shadowBlur = 8;
    ctx.restore();
    B.drawLabel(ctx, costStr, { x: w / 2, y: costY + 20 },
      wA(P.yellow, 0.85), '16px "JetBrains Mono", monospace', 'center');

    // Formula
    var formulaY = h * 0.70;
    B.drawLabel(ctx, 'cost = tokens x price_per_token',
      { x: w / 2, y: formulaY },
      wA(P.white, 0.45), '10px "JetBrains Mono", monospace', 'center');

    // Token count
    B.drawLabel(ctx, totalTokens + ' tokens x $0.000003',
      { x: w / 2, y: formulaY + 16 },
      wA(P.teal, 0.5), '9px "JetBrains Mono", monospace', 'center');

    // Comparison: SaaS vs LLM
    var compY = h * 0.84;
    B.drawLabel(ctx, 'SaaS: $0 / marginal call',
      { x: w * 0.3, y: compY },
      wA(P.green, 0.45), '9px "JetBrains Mono", monospace', 'center');
    B.drawLabel(ctx, 'vs', { x: w * 0.5, y: compY },
      wA(P.white, 0.3), '9px "JetBrains Mono", monospace', 'center');
    B.drawLabel(ctx, 'LLM: $0.003/call x \u221E',
      { x: w * 0.7, y: compY },
      wA(P.coral, 0.45), '9px "JetBrains Mono", monospace', 'center');

    // Batch summary (appears periodically)
    var batchCycleT = time % BATCH_INTERVAL;
    if (batchCycleT > (BATCH_INTERVAL - BATCH_SHOW_DUR)) {
      var batchAlpha = 1 - (batchCycleT - (BATCH_INTERVAL - BATCH_SHOW_DUR)) / BATCH_SHOW_DUR;
      batchAlpha = B.easeOut(B.clamp(batchAlpha, 0, 1)) * 0.8;

      // Background pill
      var batchY = h * 0.93;
      ctx.save();
      ctx.fillStyle = wA(P.coral, batchAlpha * 0.15);
      ctx.beginPath();
      var bw = 160, bh2 = 12;
      ctx.arc(w / 2 - bw / 2, batchY, bh2, Math.PI / 2, Math.PI * 1.5);
      ctx.arc(w / 2 + bw / 2, batchY, bh2, -Math.PI / 2, Math.PI / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      B.drawLabel(ctx, '1000 calls = $3.00', { x: w / 2, y: batchY },
        wA(P.coral, batchAlpha), '11px "JetBrains Mono", monospace', 'center');
    }

    // Title
    B.drawLabel(ctx, 'tokens & cost', { x: mx + 4, y: h * 0.08 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
