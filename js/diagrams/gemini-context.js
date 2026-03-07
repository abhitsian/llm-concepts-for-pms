// gemini-context.js — Context window scaling from 4K to 1M tokens
// Expanding bars with lost-in-the-middle effect and ring attention visual.

function GeminiContextDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  var contexts = [
    { label: '4K', size: 4, color: P.teal },
    { label: '32K', size: 32, color: P.green },
    { label: '128K', size: 128, color: P.blue },
    { label: '1M', size: 1000, color: P.purple }
  ];

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var mx = w * 0.1;
    var barAreaTop = h * 0.14;
    var barAreaBottom = h * 0.52;
    var barAreaH = barAreaBottom - barAreaTop;

    // === CONTEXT BARS ===
    var barSpacing = (w - mx * 2) / contexts.length;

    for (var i = 0; i < contexts.length; i++) {
      var cx = contexts[i];
      var barX = mx + i * barSpacing + barSpacing * 0.15;
      var barW = barSpacing * 0.7;

      // Each bar triggers slightly later
      var triggerT = i * 0.12;
      var barPhase = B.clamp((t - triggerT) / 0.2, 0, 1);
      var barEased = B.easeOut(barPhase);

      // Bar height proportional to log of size
      var logSize = Math.log10(cx.size);
      var maxLog = Math.log10(1000);
      var barH = (logSize / maxLog) * barAreaH * barEased;

      if (barEased <= 0) continue;

      var alpha = barEased * 0.6;

      // Bar fill
      ctx.save();
      ctx.fillStyle = wA(cx.color, alpha * 0.25);
      ctx.shadowColor = cx.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(barX, barAreaBottom - barH, barW, barH);
      ctx.restore();

      // Bar border
      ctx.save();
      ctx.strokeStyle = wA(cx.color, alpha * 0.5);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(barX, barAreaBottom - barH, barW, barH);
      ctx.restore();

      // Size label above bar
      if (barEased > 0.5) {
        var labelAlpha = B.clamp((barEased - 0.5) / 0.3, 0, 0.8);
        B.drawLabel(ctx, cx.label, { x: barX + barW / 2, y: barAreaBottom - barH - 12 },
          wA(cx.color, labelAlpha), 'bold 11px "JetBrains Mono", monospace', 'center');
      }

      // Label below
      B.drawLabel(ctx, cx.label + ' tokens', { x: barX + barW / 2, y: barAreaBottom + 14 },
        wA(cx.color, alpha * 0.5), '7px "JetBrains Mono", monospace', 'center');

      // === 1M bar special: token dots with "lost in the middle" ===
      if (i === 3 && barEased > 0.7) {
        var dotPhase = B.clamp((barEased - 0.7) / 0.3, 0, 1);
        var numDots = 20;
        var dotAreaTop = barAreaBottom - barH + 6;
        var dotAreaBottom = barAreaBottom - 6;
        var dotAreaH = dotAreaBottom - dotAreaTop;

        for (var d = 0; d < numDots; d++) {
          var dfrac = d / (numDots - 1); // 0 = top (start), 1 = bottom (end)
          var dy = dotAreaTop + dfrac * dotAreaH;
          var dx = barX + barW * 0.3 + (d % 3) * barW * 0.2;

          // "Lost in the middle" — dots in center are dimmer
          var middleness = 1 - 2 * Math.abs(dfrac - 0.5); // 1 at center, 0 at edges
          var dotAlpha = (1 - middleness * 0.75) * dotPhase;

          B.drawDot(ctx, { x: dx, y: dy }, 2, wA(cx.color, dotAlpha * 0.8), dotAlpha * 4);
        }

        // "Lost in the middle" label
        if (dotPhase > 0.5) {
          var lostAlpha = B.clamp((dotPhase - 0.5) / 0.5, 0, 0.5);
          B.drawLabel(ctx, 'dim center',
            { x: barX + barW + 8, y: barAreaBottom - barH / 2 },
            wA(P.coral, lostAlpha), '7px "JetBrains Mono", monospace', 'left');

          // Small bracket indicating the middle zone
          var midTop = dotAreaTop + dotAreaH * 0.3;
          var midBot = dotAreaTop + dotAreaH * 0.7;
          B.drawLine(ctx, { x: barX + barW + 3, y: midTop }, { x: barX + barW + 3, y: midBot },
            wA(P.coral, lostAlpha * 0.5), 1);
        }
      }
    }

    // === RING ATTENTION VISUAL (bottom half) ===
    var ringPhase = B.clamp((t - 0.55) / 0.2, 0, 1);
    var ringEased = B.easeOut(ringPhase);

    if (ringEased > 0) {
      var ringCx = w * 0.5;
      var ringCy = h * 0.76;
      var ringR = Math.min(w, h) * 0.14;
      var numTPUs = 8;

      B.drawLabel(ctx, 'Ring Attention', { x: ringCx, y: ringCy - ringR - 18 },
        wA(P.purple, ringEased * 0.5), '10px "JetBrains Mono", monospace', 'center');

      // Draw ring
      B.drawRing(ctx, { x: ringCx, y: ringCy }, ringR,
        wA(P.purple, ringEased * 0.15), 1);

      // TPU nodes on ring
      for (var tp = 0; tp < numTPUs; tp++) {
        var tpAngle = (Math.PI * 2 / numTPUs) * tp - Math.PI / 2;
        var tpx = ringCx + ringR * Math.cos(tpAngle);
        var tpy = ringCy + ringR * Math.sin(tpAngle);

        B.drawDot(ctx, { x: tpx, y: tpy }, 4,
          wA(P.blue, ringEased * 0.5), 6 * ringEased);

        // Label every other TPU
        if (tp % 2 === 0) {
          var labelDist = ringR + 14;
          var lx = ringCx + labelDist * Math.cos(tpAngle);
          var ly = ringCy + labelDist * Math.sin(tpAngle);
          B.drawLabel(ctx, 'TPU', { x: lx, y: ly },
            wA(P.blue, ringEased * 0.3), '6px "JetBrains Mono", monospace', 'center');
        }
      }

      // Animated data flowing around the ring
      var dataAngle = time * 1.5;
      var numDataDots = 3;
      for (var dd = 0; dd < numDataDots; dd++) {
        var dAngle = dataAngle + (Math.PI * 2 / numDataDots) * dd;
        var ddx = ringCx + ringR * Math.cos(dAngle);
        var ddy = ringCy + ringR * Math.sin(dAngle);
        B.drawDot(ctx, { x: ddx, y: ddy }, 2.5,
          wA(P.teal, ringEased * 0.7), 10 * ringEased);
      }

      // "KV blocks passed between TPUs" label
      if (ringEased > 0.6) {
        var descAlpha = B.clamp((ringEased - 0.6) / 0.4, 0, 0.35);
        B.drawLabel(ctx, 'KV blocks circulate between devices',
          { x: ringCx, y: ringCy + ringR + 18 },
          wA(P.white, descAlpha), '8px "JetBrains Mono", monospace', 'center');
      }
    }

    // === Key insight ===
    if (t > 0.82) {
      var insightAlpha = B.clamp((t - 0.82) / 0.12, 0, 0.45);
      B.drawLabel(ctx, 'bigger context != better recall (the middle gets lost)',
        { x: w * 0.5, y: h * 0.94 },
        wA(P.white, insightAlpha), '9px "JetBrains Mono", monospace', 'center');
    }

    // Title
    B.drawLabel(ctx, 'context window scaling', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
