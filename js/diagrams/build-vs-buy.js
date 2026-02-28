// build-vs-buy.js — Build vs buy curves and the product layer moat
// Shows how the moat moved from models to the product layer

function BuildVsBuyDiagram(canvas, container) {
  const B = Bezier;
  const P = B.palette;
  const wA = B.withAlpha;

  const CYCLE = 10;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    const mx = w * 0.1;
    const my = h * 0.1;
    const gw = w - mx * 2;
    const gh = h * 0.38;
    const baseY = my + gh;
    const t = (time % CYCLE) / CYCLE;

    // Title
    B.drawLabel(ctx, 'build vs buy', { x: mx + 4, y: h * 0.05 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');

    // Axes
    B.drawLine(ctx, { x: mx, y: baseY }, { x: mx + gw, y: baseY },
      wA(P.white, 0.2), 1);
    B.drawLine(ctx, { x: mx, y: baseY }, { x: mx, y: my },
      wA(P.white, 0.2), 1);
    B.drawLabel(ctx, 'time \u2192', { x: mx + gw, y: baseY + 14 },
      P.textDim, '9px "JetBrains Mono", monospace', 'right');
    B.drawLabel(ctx, 'cumulative cost', { x: mx - 4, y: my - 8 },
      P.textDim, '9px "JetBrains Mono", monospace', 'right');

    // Build curve (teal): starts low, grows as you invest
    var buildPts = [
      { x: mx, y: baseY - gh * 0.05 },
      { x: mx + gw * 0.25, y: baseY - gh * 0.15 },
      { x: mx + gw * 0.55, y: baseY - gh * 0.55 },
      { x: mx + gw, y: baseY - gh * 0.85 }
    ];

    // Buy/API curve (coral): starts higher, stays flatter
    var buyPts = [
      { x: mx, y: baseY - gh * 0.3 },
      { x: mx + gw * 0.3, y: baseY - gh * 0.42 },
      { x: mx + gw * 0.6, y: baseY - gh * 0.52 },
      { x: mx + gw, y: baseY - gh * 0.58 }
    ];

    var curveT = B.easeInOut(B.clamp(t / 0.5, 0, 1));
    var steps = 80;
    var maxStep = Math.ceil(steps * curveT);

    // Draw build curve
    ctx.save();
    ctx.strokeStyle = wA(P.teal, 0.7);
    ctx.lineWidth = 2.5; ctx.shadowColor = P.teal; ctx.shadowBlur = 8;
    ctx.lineCap = 'round'; ctx.beginPath();
    for (var i = 0; i <= maxStep; i++) {
      var s = i / steps;
      var pt = B.cubicPt(buildPts[0], buildPts[1], buildPts[2], buildPts[3], s);
      if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke(); ctx.restore();
    // Glow
    B.drawCurve(ctx, buildPts, maxStep, wA(P.teal, 0.1), 6, 12);

    // Draw buy curve
    ctx.save();
    ctx.strokeStyle = wA(P.coral, 0.7);
    ctx.lineWidth = 2.5; ctx.shadowColor = P.coral; ctx.shadowBlur = 8;
    ctx.lineCap = 'round'; ctx.beginPath();
    for (var i = 0; i <= maxStep; i++) {
      var s = i / steps;
      var pt = B.cubicPt(buyPts[0], buyPts[1], buyPts[2], buyPts[3], s);
      if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke(); ctx.restore();
    B.drawCurve(ctx, buyPts, maxStep, wA(P.coral, 0.1), 6, 12);

    // Labels on curves
    if (curveT > 0.5) {
      var la = B.clamp((curveT - 0.5) / 0.3, 0, 1);
      var bm = B.cubicPt(buildPts[0], buildPts[1], buildPts[2], buildPts[3], 0.7);
      B.drawLabel(ctx, 'Build (custom)', { x: bm.x + 10, y: bm.y - 14 },
        wA(P.teal, la), '10px "JetBrains Mono", monospace', 'left');
      B.drawLabel(ctx, 'control \u2191', { x: bm.x + 10, y: bm.y },
        wA(P.teal, la * 0.5), '9px "JetBrains Mono", monospace', 'left');

      var sm = B.cubicPt(buyPts[0], buyPts[1], buyPts[2], buyPts[3], 0.7);
      B.drawLabel(ctx, 'Buy (API)', { x: sm.x + 10, y: sm.y + 14 },
        wA(P.coral, la), '10px "JetBrains Mono", monospace', 'left');
      B.drawLabel(ctx, 'speed \u2191', { x: sm.x + 10, y: sm.y + 28 },
        wA(P.coral, la * 0.5), '9px "JetBrains Mono", monospace', 'left');
    }

    // Crossover point
    var crossX = mx + gw * 0.42;
    var crossY = baseY - gh * 0.4;
    if (curveT > 0.45) {
      var ca = B.easeOut(B.clamp((curveT - 0.45) / 0.15, 0, 1));
      B.drawDot(ctx, { x: crossX, y: crossY }, 5, wA(P.yellow, ca * 0.7), 12);
      B.drawLabel(ctx, 'crossover', { x: crossX, y: crossY - 14 },
        wA(P.yellow, ca * 0.7), '9px "JetBrains Mono", monospace', 'center');
    }

    // --- Layer diagram (bottom half) ---
    var layerT = B.easeOut(B.clamp((t - 0.5) / 0.3, 0, 1));
    if (layerT > 0) {
      var layerTop = h * 0.6;
      var layerH = 28;
      var layerGap = 6;
      var layerW = gw * 0.7;
      var layerX = mx + (gw - layerW) / 2;

      // Layer 1: Foundation Model (gray, commodity)
      var l1y = layerTop + (layerH + layerGap) * 2;
      ctx.save();
      ctx.fillStyle = wA(P.white, layerT * 0.08);
      ctx.strokeStyle = wA(P.white, layerT * 0.2);
      ctx.lineWidth = 1;
      ctx.fillRect(layerX, l1y, layerW, layerH);
      ctx.strokeRect(layerX, l1y, layerW, layerH);
      ctx.restore();
      B.drawLabel(ctx, 'Foundation Model (commodity)', { x: layerX + layerW / 2, y: l1y + layerH / 2 },
        wA(P.white, layerT * 0.4), '10px "JetBrains Mono", monospace', 'center');

      // Layer 2: API Layer (dim)
      var l2y = layerTop + (layerH + layerGap);
      ctx.save();
      ctx.fillStyle = wA(P.blue, layerT * 0.08);
      ctx.strokeStyle = wA(P.blue, layerT * 0.25);
      ctx.lineWidth = 1;
      ctx.fillRect(layerX, l2y, layerW, layerH);
      ctx.strokeRect(layerX, l2y, layerW, layerH);
      ctx.restore();
      B.drawLabel(ctx, 'API Layer (thin)', { x: layerX + layerW / 2, y: l2y + layerH / 2 },
        wA(P.blue, layerT * 0.5), '10px "JetBrains Mono", monospace', 'center');

      // Layer 3: Product Layer (bright teal, the moat)
      var l3y = layerTop;
      ctx.save();
      ctx.fillStyle = wA(P.teal, layerT * 0.15);
      ctx.strokeStyle = wA(P.teal, layerT * 0.6);
      ctx.lineWidth = 2; ctx.shadowColor = P.teal; ctx.shadowBlur = 10 * layerT;
      ctx.fillRect(layerX, l3y, layerW, layerH);
      ctx.strokeRect(layerX, l3y, layerW, layerH);
      ctx.restore();
      B.drawLabel(ctx, 'Product Layer (the moat)', { x: layerX + layerW / 2, y: l3y + layerH / 2 },
        wA(P.teal, layerT * 0.9), '11px "JetBrains Mono", monospace', 'center');

      // Arrow pointing to product layer
      if (layerT > 0.5) {
        var aa = B.clamp((layerT - 0.5) / 0.5, 0, 1);
        B.drawLabel(ctx, '\u2190 moat is here', { x: layerX + layerW + 12, y: l3y + layerH / 2 },
          wA(P.yellow, aa * 0.7), '10px "JetBrains Mono", monospace', 'left');
      }
    }

    // Formula
    var fAlpha = t > 0.7 ? B.easeOut(B.clamp((t - 0.7) / 0.15, 0, 1)) : 0;
    B.drawLabel(ctx, 'moat = product_layer - commodity_model',
      { x: w / 2, y: h * 0.94 },
      wA(P.yellow, fAlpha * 0.6), '10px "JetBrains Mono", monospace', 'center');
  }

  return B.animate(canvas, container, draw);
}
