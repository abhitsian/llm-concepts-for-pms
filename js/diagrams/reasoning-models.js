// reasoning-models.js — Standard vs Reasoning model comparison
// Two paths from Query to Answer: fast/cheap vs slow/deep/better.

function ReasoningModelsDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var lx = w * 0.1, rx = w * 0.9;
    var topY = h * 0.28, botY = h * 0.68;
    var midX = w * 0.5;

    // Query and Answer endpoints
    var queryPt = { x: lx, y: h * 0.48 };
    var answerTop = { x: rx, y: topY };
    var answerBot = { x: rx, y: botY };

    B.drawDot(ctx, queryPt, 6, wA(P.white, 0.6), 8);
    B.drawLabel(ctx, 'Query', { x: queryPt.x, y: queryPt.y - 16 },
      wA(P.white, 0.7), '11px "JetBrains Mono", monospace', 'center');

    // === STANDARD PATH (top, green, thin, fast) ===
    var stdPts = [
      queryPt,
      { x: lx + (rx - lx) * 0.3, y: topY + 5 },
      { x: lx + (rx - lx) * 0.7, y: topY - 5 },
      answerTop
    ];

    // Standard finishes fast: 0 to 0.3 of cycle
    var stdT = B.clamp(t / 0.3, 0, 1);
    var stdEased = B.easeOut(stdT);

    // Dim base
    B.drawCurve(ctx, stdPts, 60, wA(P.green, 0.08), 1.5, 0);

    // Animated draw
    if (stdEased > 0) {
      ctx.save();
      ctx.strokeStyle = wA(P.green, 0.7);
      ctx.lineWidth = 2;
      ctx.shadowColor = P.green;
      ctx.shadowBlur = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var i = 0; i <= 60; i++) {
        var st = i / 60;
        if (st > stdEased) break;
        var pt = B.cubicPt(stdPts[0], stdPts[1], stdPts[2], stdPts[3], st);
        if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();

      // Tracer dot
      if (stdEased < 1) {
        var sdot = B.cubicPt(stdPts[0], stdPts[1], stdPts[2], stdPts[3], stdEased);
        B.drawDot(ctx, sdot, 3, P.green, 10);
      }
    }

    // Standard label
    B.drawLabel(ctx, 'Standard model', { x: midX, y: topY - 22 },
      wA(P.green, 0.6), '10px "JetBrains Mono", monospace', 'center');

    // Standard stats (appear when path completes)
    if (stdT > 0.8) {
      var sAlpha = B.clamp((stdT - 0.8) / 0.2, 0, 0.5);
      B.drawLabel(ctx, '50 tokens  $0.002  200ms', { x: midX, y: topY - 8 },
        wA(P.green, sAlpha), '8px "JetBrains Mono", monospace', 'center');
    }

    // Standard answer dot (small)
    if (stdT >= 1) {
      var sDoneAlpha = B.clamp((t - 0.3) / 0.05, 0, 1);
      B.drawDot(ctx, answerTop, 5, wA(P.green, sDoneAlpha * 0.6), 6);
      B.drawLabel(ctx, 'Answer', { x: answerTop.x, y: answerTop.y - 14 },
        wA(P.green, sDoneAlpha * 0.5), '9px "JetBrains Mono", monospace', 'center');
    }

    // === REASONING PATH (bottom, purple, thick, slow, winding) ===
    var thinkStart = lx + (rx - lx) * 0.2, thinkEnd = lx + (rx - lx) * 0.75;
    var rSegs = [
      [queryPt, { x: thinkStart - 20, y: botY - 30 }, { x: thinkStart + 10, y: botY + 20 }, { x: thinkStart + 50, y: botY - 15 }],
      [{ x: thinkStart + 50, y: botY - 15 }, { x: thinkStart + 90, y: botY + 30 }, { x: midX - 20, y: botY - 25 }, { x: midX + 20, y: botY + 15 }],
      [{ x: midX + 20, y: botY + 15 }, { x: midX + 60, y: botY - 30 }, { x: thinkEnd - 40, y: botY + 20 }, { x: thinkEnd, y: botY - 5 }],
      [{ x: thinkEnd, y: botY - 5 }, { x: thinkEnd + 30, y: botY + 10 }, { x: rx - 30, y: botY }, answerBot]
    ];

    // Reasoning finishes at 0.85 of cycle
    var rT = B.clamp(t / 0.85, 0, 1);
    var rEased = B.easeInOut(rT);

    // Thinking region box (subtle dashed rectangle)
    if (rEased > 0.1) {
      var boxAlpha = B.clamp((rEased - 0.1) / 0.2, 0, 0.06);
      ctx.save(); ctx.fillStyle = wA(P.purple, boxAlpha);
      ctx.strokeStyle = wA(P.purple, boxAlpha * 2); ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      var bx = thinkStart - 10, bw = thinkEnd - thinkStart + 20, by = botY - 45, bh = 90;
      ctx.fillRect(bx, by, bw, bh); ctx.strokeRect(bx, by, bw, bh); ctx.restore();
      B.drawLabel(ctx, 'thinking...', { x: (thinkStart + thinkEnd) / 2, y: by - 8 },
        wA(P.purple, boxAlpha * 6), '8px "JetBrains Mono", monospace', 'center');
    }

    // Draw reasoning path segments
    var totalSegs = rSegs.length;
    for (var s = 0; s < totalSegs; s++) {
      var segStart = s / totalSegs;
      var segEnd = (s + 1) / totalSegs;
      var segProgress = B.clamp((rEased - segStart) / (segEnd - segStart), 0, 1);

      // Dim base
      B.drawCurve(ctx, rSegs[s], 40, wA(P.purple, 0.06), 1, 0);

      if (segProgress > 0) {
        ctx.save();
        ctx.strokeStyle = wA(P.purple, 0.6);
        ctx.lineWidth = 3;
        ctx.shadowColor = P.purple;
        ctx.shadowBlur = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (var i = 0; i <= 40; i++) {
          var lt = i / 40;
          if (lt > segProgress) break;
          var pt = B.cubicPt(rSegs[s][0], rSegs[s][1], rSegs[s][2], rSegs[s][3], lt);
          if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    // Reasoning tracer dot
    if (rEased > 0 && rEased < 1) {
      var rSeg = Math.min(Math.floor(rEased * totalSegs), totalSegs - 1);
      var rLocal = (rEased * totalSegs) - rSeg;
      rLocal = B.clamp(rLocal, 0, 1);
      var rdot = B.cubicPt(rSegs[rSeg][0], rSegs[rSeg][1], rSegs[rSeg][2], rSegs[rSeg][3], rLocal);
      B.drawDot(ctx, rdot, 4, P.purple, 14);
      B.drawDot(ctx, rdot, 2, '#ffffff');

      // Show thinking tokens streaming
      var tokenCount = Math.floor(rEased * 5000);
      B.drawLabel(ctx, tokenCount + ' tokens', { x: rdot.x, y: rdot.y + 18 },
        wA(P.purple, 0.4), '7px "JetBrains Mono", monospace', 'center');
    }

    // Reasoning label
    B.drawLabel(ctx, 'Reasoning model', { x: midX, y: botY + 55 },
      wA(P.purple, 0.6), '10px "JetBrains Mono", monospace', 'center');

    // Reasoning stats
    if (rT > 0.9) {
      var rAlpha = B.clamp((rT - 0.9) / 0.1, 0, 0.5);
      B.drawLabel(ctx, '5000 tokens  $0.15  8s', { x: midX, y: botY + 68 },
        wA(P.purple, rAlpha), '8px "JetBrains Mono", monospace', 'center');
    }

    // Reasoning answer dot (large, bright — quality!)
    if (rT >= 1) {
      var rDoneAlpha = B.clamp((t - 0.85) / 0.08, 0, 1);
      B.drawDot(ctx, answerBot, 10, wA(P.purple, rDoneAlpha * 0.3), 25);
      B.drawDot(ctx, answerBot, 7, wA(P.purple, rDoneAlpha * 0.7), 15);
      B.drawDot(ctx, answerBot, 3, wA('#ffffff', rDoneAlpha * 0.8));
      B.drawLabel(ctx, 'Answer', { x: answerBot.x, y: answerBot.y - 18 },
        wA(P.purple, rDoneAlpha * 0.8), '10px "JetBrains Mono", monospace', 'center');
    }

    // Quality comparison (right side, after both finish)
    if (t > 0.88) {
      var qAlpha = B.clamp((t - 0.88) / 0.08, 0, 0.7);
      B.drawLabel(ctx, 'Standard:  72%', { x: rx, y: topY + 18 },
        wA(P.green, qAlpha), '9px "JetBrains Mono", monospace', 'right');
      B.drawLabel(ctx, 'Reasoning: 94%', { x: rx, y: botY + 18 },
        wA(P.purple, qAlpha), '9px "JetBrains Mono", monospace', 'right');
    }

    // Formula
    var fAlpha = 0.25 + (t > 0.9 ? (t - 0.9) * 3 : 0);
    B.drawLabel(ctx, 'quality \u221D thinking_tokens (up to a point)',
      { x: w * 0.5, y: h * 0.93 },
      wA(P.white, B.clamp(fAlpha, 0, 0.5)), '9px "JetBrains Mono", monospace', 'center');

    // Title
    B.drawLabel(ctx, 'reasoning models', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
