// streaming.js — Animated streaming vs non-streaming comparison
// Shows how streaming tokens one-at-a-time changes perceived speed

function StreamingDiagram(canvas, container) {
  const B = Bezier;
  const P = B.palette;
  const wA = B.withAlpha;

  const CYCLE = 8;
  const tokens = ['The', 'model', 'generates', 'tokens', 'one', 'by', 'one'];

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    const mx = w * 0.08;
    const t = (time % CYCLE) / CYCLE;
    const topY = h * 0.28;
    const botY = h * 0.58;
    const barW = w - mx * 2;

    // Title
    B.drawLabel(ctx, 'streaming vs batch', { x: mx + 4, y: h * 0.07 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');

    // --- Timeline axis ---
    B.drawLine(ctx, { x: mx, y: topY - 30 }, { x: mx + barW, y: topY - 30 },
      wA(P.white, 0.1), 1, [4, 4]);
    B.drawLine(ctx, { x: mx, y: botY - 30 }, { x: mx + barW, y: botY - 30 },
      wA(P.white, 0.1), 1, [4, 4]);

    // --- Scenario labels ---
    B.drawLabel(ctx, 'no streaming', { x: mx, y: topY - 46 },
      wA(P.coral, 0.8), '11px "JetBrains Mono", monospace', 'left');
    B.drawLabel(ctx, 'streaming', { x: mx, y: botY - 46 },
      wA(P.teal, 0.8), '11px "JetBrains Mono", monospace', 'left');

    // --- No-streaming scenario ---
    // Wait until 60% of cycle, then show all tokens at once
    var batchAppear = t > 0.6 ? B.easeOut(B.clamp((t - 0.6) / 0.1, 0, 1)) : 0;
    var waitAlpha = t < 0.6 ? 0.3 + 0.15 * Math.sin(time * 4) : 0;

    if (t < 0.6) {
      // Waiting indicator: pulsing dots
      for (var d = 0; d < 3; d++) {
        var dx = mx + 40 + d * 12;
        var da = waitAlpha * (0.5 + 0.5 * Math.sin(time * 6 + d * 1.2));
        B.drawDot(ctx, { x: dx, y: topY }, 3, wA(P.coral, da));
      }
      B.drawLabel(ctx, 'waiting...', { x: mx + 80, y: topY },
        wA(P.coral, waitAlpha), '10px "JetBrains Mono", monospace', 'left');
    }

    if (batchAppear > 0) {
      // All tokens appear at once in a block
      var blockX = mx + 10;
      for (var i = 0; i < tokens.length; i++) {
        B.drawLabel(ctx, tokens[i], { x: blockX, y: topY },
          wA(P.coral, batchAppear * 0.9),
          '12px "JetBrains Mono", monospace', 'left');
        blockX += ctx.measureText(tokens[i]).width + 10;
      }
      // Draw a bracket/block around them
      ctx.save();
      ctx.strokeStyle = wA(P.coral, batchAppear * 0.3);
      ctx.lineWidth = 1;
      ctx.strokeRect(mx + 4, topY - 12, blockX - mx, 24);
      ctx.restore();
    }

    // --- Streaming scenario ---
    // Tokens appear one by one, each taking a fraction of the cycle
    var streamX = mx + 10;
    var tokenDelay = 0.08; // delay between tokens
    var firstTokenTime = 0.08; // TTFT

    // Draw curve path for streaming tokens
    var curveStart = { x: mx, y: botY };
    var curveEnd = { x: mx + barW * 0.85, y: botY };
    var curveCp1 = { x: mx + barW * 0.3, y: botY - 15 };
    var curveCp2 = { x: mx + barW * 0.6, y: botY + 10 };
    B.drawCurve(ctx, [curveStart, curveCp1, curveCp2, curveEnd], 60,
      wA(P.teal, 0.08), 1.5, 0);

    for (var i = 0; i < tokens.length; i++) {
      var tokenStart = firstTokenTime + i * tokenDelay;
      var tokenProgress = B.clamp((t - tokenStart) / 0.06, 0, 1);
      if (tokenProgress > 0) {
        var eased = B.easeOut(tokenProgress);
        var curveT = (i + eased) / tokens.length;
        var pt = B.cubicPt(curveStart, curveCp1, curveCp2, curveEnd, B.clamp(curveT, 0, 1));
        B.drawLabel(ctx, tokens[i], { x: pt.x, y: pt.y },
          wA(P.teal, eased * 0.9),
          '12px "JetBrains Mono", monospace', 'center');
        // Glowing dot at the leading edge
        if (i === Math.floor((t - firstTokenTime) / tokenDelay) && tokenProgress < 1) {
          B.drawDot(ctx, pt, 4, P.teal, 12);
        }
      }
    }

    // Draw partial curve up to current progress
    var streamProgress = B.clamp((t - firstTokenTime) / (tokens.length * tokenDelay), 0, 1);
    if (streamProgress > 0) {
      ctx.save();
      ctx.strokeStyle = wA(P.teal, 0.5);
      ctx.lineWidth = 2;
      ctx.shadowColor = P.teal;
      ctx.shadowBlur = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var s = 0; s <= 60; s++) {
        var st = s / 60;
        if (st > streamProgress) break;
        var sp = B.cubicPt(curveStart, curveCp1, curveCp2, curveEnd, st);
        if (s === 0) ctx.moveTo(sp.x, sp.y); else ctx.lineTo(sp.x, sp.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // --- TTFT markers ---
    var markerY = h * 0.78;
    var ttftX = mx + barW * firstTokenTime;
    var totalX = mx + barW * 0.6;

    // TTFT line
    B.drawLine(ctx, { x: mx, y: markerY }, { x: ttftX, y: markerY },
      wA(P.teal, 0.6), 2);
    B.drawDot(ctx, { x: ttftX, y: markerY }, 4, P.teal, 10);
    B.drawLabel(ctx, 'TTFT: 180ms', { x: ttftX + 8, y: markerY },
      wA(P.teal, 0.9), '11px "JetBrains Mono", monospace', 'left');

    // Total time line
    B.drawLine(ctx, { x: mx, y: markerY + 22 }, { x: totalX, y: markerY + 22 },
      wA(P.coral, 0.4), 2);
    B.drawDot(ctx, { x: totalX, y: markerY + 22 }, 4, P.coral, 10);
    B.drawLabel(ctx, 'Total: 2400ms', { x: totalX + 8, y: markerY + 22 },
      wA(P.coral, 0.7), '11px "JetBrains Mono", monospace', 'left');

    // --- Formula ---
    var formulaAlpha = t > 0.5 ? B.easeOut(B.clamp((t - 0.5) / 0.2, 0, 1)) : 0;
    B.drawLabel(ctx, 'perceived_speed = 1/TTFT  not  1/total_time',
      { x: w / 2, y: h * 0.93 },
      wA(P.yellow, formulaAlpha * 0.7),
      '10px "JetBrains Mono", monospace', 'center');
  }

  return B.animate(canvas, container, draw);
}
