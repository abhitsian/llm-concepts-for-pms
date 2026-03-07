// thinking-tokens.js — Hidden thinking scratchpad expanding, then visible output compressing
// Shows how reasoning models spend most tokens on hidden thinking, with a small visible answer

function ThinkingTokensDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var mx = w * 0.08;

    // --- Layout ---
    var queryX = w * 0.08, midX = w * 0.50, answerX = w * 0.88;
    var cy = h * 0.45;

    // --- Query dot ---
    var queryPt = { x: queryX, y: cy };
    var queryAlpha = B.clamp(t / 0.05, 0, 1);
    B.drawDot(ctx, queryPt, 6, wA(P.white, 0.7 * queryAlpha), 8);
    B.drawLabel(ctx, 'Query', { x: queryPt.x, y: queryPt.y - 18 },
      wA(P.white, 0.7 * queryAlpha), '10px "JetBrains Mono", monospace', 'center');

    // --- Thinking box (dashed) ---
    var boxL = w * 0.18, boxR = w * 0.72;
    var boxT = cy - h * 0.22, boxB = cy + h * 0.22;
    var boxW = boxR - boxL, boxH = boxB - boxT;

    // Thinking phase: 0.05 to 0.80
    var thinkStart = 0.05, thinkEnd = 0.80;
    var thinkT = B.clamp((t - thinkStart) / (thinkEnd - thinkStart), 0, 1);
    var thinkEased = B.easeOut(thinkT);

    // Box appears and grows slightly
    if (thinkT > 0) {
      var boxAlpha = B.clamp(thinkT * 3, 0, 1);
      ctx.save();
      ctx.strokeStyle = wA(P.purple, 0.3 * boxAlpha);
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(boxL, boxT, boxW, boxH);
      ctx.restore();

      // Background fill
      ctx.save();
      ctx.fillStyle = wA(P.purple, 0.04 * boxAlpha);
      ctx.fillRect(boxL, boxT, boxW, boxH);
      ctx.restore();

      // "thinking..." label
      var thinkLabelPulse = 0.5 + 0.3 * Math.sin(time * 3);
      B.drawLabel(ctx, 'thinking...', { x: boxL + boxW / 2, y: boxT - 10 },
        wA(P.purple, 0.6 * boxAlpha * (thinkT < 1 ? thinkLabelPulse : 0.3)),
        '10px "JetBrains Mono", monospace', 'center');

      // --- Purple tokens streaming in zigzag ---
      var numTokens = Math.floor(thinkEased * 48);
      var cols = 12, rowSpacing = boxH / 6;
      var colSpacing = boxW / (cols + 1);

      for (var i = 0; i < numTokens; i++) {
        var row = Math.floor(i / cols);
        var col = i % cols;
        // Zigzag: even rows left-to-right, odd rows right-to-left
        var effectiveCol = row % 2 === 0 ? col : (cols - 1 - col);

        var tx = boxL + colSpacing * (effectiveCol + 1);
        var ty = boxT + 20 + row * rowSpacing;

        if (ty > boxB - 10) continue;

        // Trailing tokens are brighter
        var age = (numTokens - i) / numTokens;
        var tokenAlpha = 0.3 + 0.5 * (1 - age);
        var tokenGlow = i >= numTokens - 3 ? 8 : 0;
        B.drawDot(ctx, { x: tx, y: ty }, 2.5, wA(P.purple, tokenAlpha), tokenGlow);
      }

      // Bezier curve from query to box entrance
      var entryPt = { x: boxL, y: cy };
      var cp1 = { x: queryPt.x + (boxL - queryPt.x) * 0.4, y: cy - 10 };
      var cp2 = { x: queryPt.x + (boxL - queryPt.x) * 0.7, y: cy + 5 };
      B.drawCurve(ctx, [queryPt, cp1, cp2, entryPt], 40,
        wA(P.purple, 0.4 * boxAlpha), 2, 6);

      // Tracer dot on the entry curve
      if (thinkT < 1) {
        var tracerT = (time * 0.5) % 1;
        var tracerPt = B.cubicPt(queryPt, cp1, cp2, entryPt, tracerT);
        B.drawDot(ctx, tracerPt, 3, P.purple, 10);
      }
    }

    // --- Token counter ---
    if (thinkT > 0) {
      var count = Math.floor(thinkEased * 3247);
      var countStr = count.toLocaleString() + ' tokens';
      B.drawLabel(ctx, countStr, { x: boxR + 12, y: boxT + 14 },
        wA(P.purple, 0.7), '11px "JetBrains Mono", monospace', 'left');

      // Cost indicator
      var costVal = (count * 0.000015).toFixed(3);
      B.drawLabel(ctx, '$' + costVal, { x: boxR + 12, y: boxT + 30 },
        wA(P.coral, 0.5), '9px "JetBrains Mono", monospace', 'left');
    }

    // --- Answer phase: 0.80 to 0.95 ---
    var answerStart = 0.80, answerEnd = 0.95;
    var answerT = B.clamp((t - answerStart) / (answerEnd - answerStart), 0, 1);
    var answerEased = B.easeOut(answerT);

    if (answerT > 0) {
      var answerPt = { x: answerX, y: cy };

      // Curve from box exit to answer
      var exitPt = { x: boxR, y: cy };
      var acp1 = { x: boxR + (answerX - boxR) * 0.35, y: cy - 5 };
      var acp2 = { x: boxR + (answerX - boxR) * 0.65, y: cy + 3 };

      // Draw partial curve
      ctx.save();
      ctx.strokeStyle = wA(P.green, 0.7);
      ctx.lineWidth = 2;
      ctx.shadowColor = P.green;
      ctx.shadowBlur = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var s = 0; s <= 40; s++) {
        var st = s / 40;
        if (st > answerEased) break;
        var pt = B.cubicPt(exitPt, acp1, acp2, answerPt, st);
        if (s === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();

      // Answer dots (just 4 — much fewer than thinking tokens)
      var answerDots = Math.floor(answerEased * 4);
      for (var d = 0; d < answerDots; d++) {
        var dt = (d + 1) / 5;
        var dp = B.cubicPt(exitPt, acp1, acp2, answerPt, dt);
        B.drawDot(ctx, dp, 4, wA(P.green, 0.7), 8);
      }

      // Answer label
      if (answerEased > 0.6) {
        var aLabelAlpha = B.clamp((answerEased - 0.6) / 0.4, 0, 1);
        B.drawDot(ctx, answerPt, 7, wA(P.green, 0.6 * aLabelAlpha), 12);
        B.drawLabel(ctx, 'Answer', { x: answerPt.x, y: answerPt.y - 18 },
          wA(P.green, 0.8 * aLabelAlpha), '10px "JetBrains Mono", monospace', 'center');
        B.drawLabel(ctx, '85 tokens', { x: answerPt.x, y: answerPt.y + 18 },
          wA(P.green, 0.5 * aLabelAlpha), '9px "JetBrains Mono", monospace', 'center');
      }
    }

    // --- Size comparison bars ---
    if (t > 0.85) {
      var barAlpha = B.clamp((t - 0.85) / 0.1, 0, 1);
      var barY = h * 0.78, barH = 10;
      var thinkBarW = (boxR - boxL) * 0.9;
      var ansBarW = thinkBarW * (85 / 3247);

      // Thinking bar
      ctx.save();
      ctx.fillStyle = wA(P.purple, 0.35 * barAlpha);
      ctx.fillRect(boxL, barY, thinkBarW, barH);
      ctx.restore();
      B.drawLabel(ctx, '3,247 thinking', { x: boxL + thinkBarW / 2, y: barY + barH + 12 },
        wA(P.purple, 0.5 * barAlpha), '8px "JetBrains Mono", monospace', 'center');

      // Answer bar (tiny)
      ctx.save();
      ctx.fillStyle = wA(P.green, 0.6 * barAlpha);
      ctx.fillRect(boxL, barY + barH + 28, Math.max(ansBarW, 6), barH);
      ctx.restore();
      B.drawLabel(ctx, '85 output', { x: boxL + 50, y: barY + barH + 28 + barH / 2 },
        wA(P.green, 0.5 * barAlpha), '8px "JetBrains Mono", monospace', 'left');
    }

    // --- Formula ---
    if (t > 0.88) {
      var fAlpha = B.clamp((t - 0.88) / 0.08, 0, 0.6);
      B.drawLabel(ctx, 'answer_quality \u221D thinking_budget',
        { x: w / 2, y: h * 0.93 },
        wA(P.yellow, fAlpha), '10px "JetBrains Mono", monospace', 'center');
    }

    // Title
    B.drawLabel(ctx, 'thinking tokens', { x: mx + 4, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
