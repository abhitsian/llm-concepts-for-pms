// headcount-proof.js — Decision flow for hiring vs AI
// "Need more people?" → "Can AI do it?" → Use AI (green) or Hire (coral)

function HeadcountProofDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var phase = B.easeOut(B.clamp(t / 0.8, 0, 1));

    // Title
    B.drawLabel(ctx, 'the headcount test', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');

    // Node positions
    var startPt = { x: w * 0.15, y: h * 0.42 };
    var decisionPt = { x: w * 0.42, y: h * 0.42 };
    var aiPt = { x: w * 0.72, y: h * 0.25 };
    var hirePt = { x: w * 0.72, y: h * 0.62 };

    // Phase for each node appearing
    var startAlpha = B.clamp(phase / 0.2, 0, 1);
    var decAlpha = B.clamp((phase - 0.15) / 0.2, 0, 1);
    var pathAlpha = B.clamp((phase - 0.35) / 0.25, 0, 1);
    var resultAlpha = B.clamp((phase - 0.55) / 0.2, 0, 1);

    // === START NODE: "Need more people?" ===
    if (startAlpha > 0) {
      // Rounded box
      var boxW = 110, boxH = 36;
      ctx.save();
      ctx.strokeStyle = wA(P.white, startAlpha * 0.5);
      ctx.lineWidth = 1.5;
      ctx.shadowColor = P.white;
      ctx.shadowBlur = startAlpha * 6;
      ctx.beginPath();
      ctx.roundRect(startPt.x - boxW / 2, startPt.y - boxH / 2, boxW, boxH, 6);
      ctx.stroke();
      ctx.restore();

      B.drawLabel(ctx, 'Need more', { x: startPt.x, y: startPt.y - 5 },
        wA(P.white, startAlpha * 0.8), '10px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, 'people?', { x: startPt.x, y: startPt.y + 9 },
        wA(P.white, startAlpha * 0.8), '10px "JetBrains Mono", monospace', 'center');
    }

    // Arrow from start → decision
    if (decAlpha > 0) {
      var arrowMid = { x: B.lerp(startPt.x + 55, decisionPt.x - 45, 0.5), y: startPt.y };
      B.drawLine(ctx,
        { x: startPt.x + 56, y: startPt.y },
        { x: B.lerp(startPt.x + 56, decisionPt.x - 45, decAlpha), y: startPt.y },
        wA(P.white, decAlpha * 0.4), 2);
      // Arrowhead
      if (decAlpha > 0.8) {
        var ahx = decisionPt.x - 46;
        B.drawLine(ctx, { x: ahx, y: startPt.y }, { x: ahx - 6, y: startPt.y - 4 },
          wA(P.white, 0.4), 1.5);
        B.drawLine(ctx, { x: ahx, y: startPt.y }, { x: ahx - 6, y: startPt.y + 4 },
          wA(P.white, 0.4), 1.5);
      }
    }

    // === DECISION NODE: "Can AI do it?" (diamond) ===
    if (decAlpha > 0) {
      var dSize = 44;
      ctx.save();
      ctx.strokeStyle = wA(P.yellow, decAlpha * 0.6);
      ctx.lineWidth = 1.5;
      ctx.shadowColor = P.yellow;
      ctx.shadowBlur = decAlpha * 8;
      ctx.beginPath();
      ctx.moveTo(decisionPt.x, decisionPt.y - dSize);
      ctx.lineTo(decisionPt.x + dSize, decisionPt.y);
      ctx.lineTo(decisionPt.x, decisionPt.y + dSize);
      ctx.lineTo(decisionPt.x - dSize, decisionPt.y);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      B.drawLabel(ctx, 'Can AI', { x: decisionPt.x, y: decisionPt.y - 6 },
        wA(P.yellow, decAlpha * 0.8), '10px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, 'do it?', { x: decisionPt.x, y: decisionPt.y + 8 },
        wA(P.yellow, decAlpha * 0.8), '10px "JetBrains Mono", monospace', 'center');
    }

    // === YES PATH: thick green arrow → "Use AI" ===
    if (pathAlpha > 0) {
      // Curved path upward to AI node
      var yesCp1 = { x: decisionPt.x + 50, y: decisionPt.y - 45 };
      var yesCp2 = { x: aiPt.x - 50, y: aiPt.y + 10 };
      var yesStart = { x: decisionPt.x + 30, y: decisionPt.y - 30 };

      // Thick green glow path
      B.drawCurve(ctx, [yesStart, yesCp1, yesCp2, { x: aiPt.x - 50, y: aiPt.y }], 50,
        wA(P.green, pathAlpha * 0.15), 8, pathAlpha * 12);
      B.drawCurve(ctx, [yesStart, yesCp1, yesCp2, { x: aiPt.x - 50, y: aiPt.y }], 50,
        wA(P.green, pathAlpha * 0.6), 3.5, 0);

      // "YES" label on path
      B.drawLabel(ctx, 'YES', { x: decisionPt.x + 55, y: decisionPt.y - 52 },
        wA(P.green, pathAlpha * 0.8), 'bold 11px "JetBrains Mono", monospace', 'center');

      // Flowing particle
      var particleT = ((phase * 2) % 1);
      var pp = B.cubicPt(yesStart, yesCp1, yesCp2, { x: aiPt.x - 50, y: aiPt.y }, particleT);
      B.drawDot(ctx, pp, 3, wA(P.green, pathAlpha * 0.8), 8);
    }

    // === NO PATH: thin coral arrow → "Hire" ===
    if (pathAlpha > 0) {
      var noStart = { x: decisionPt.x + 30, y: decisionPt.y + 30 };
      var noCp1 = { x: decisionPt.x + 50, y: decisionPt.y + 50 };
      var noCp2 = { x: hirePt.x - 50, y: hirePt.y - 10 };

      // Thin dim coral path
      B.drawCurve(ctx, [noStart, noCp1, noCp2, { x: hirePt.x - 50, y: hirePt.y }], 50,
        wA(P.coral, pathAlpha * 0.08), 4, pathAlpha * 4);
      B.drawCurve(ctx, [noStart, noCp1, noCp2, { x: hirePt.x - 50, y: hirePt.y }], 50,
        wA(P.coral, pathAlpha * 0.3), 1.5, 0);

      // "NO" label
      B.drawLabel(ctx, 'NO', { x: decisionPt.x + 55, y: decisionPt.y + 55 },
        wA(P.coral, pathAlpha * 0.5), '10px "JetBrains Mono", monospace', 'center');
    }

    // === "Use AI" result node (green, bright) ===
    if (resultAlpha > 0) {
      var aiBoxW = 90, aiBoxH = 36;
      ctx.save();
      ctx.fillStyle = wA(P.green, resultAlpha * 0.12);
      ctx.strokeStyle = wA(P.green, resultAlpha * 0.6);
      ctx.lineWidth = 2;
      ctx.shadowColor = P.green;
      ctx.shadowBlur = resultAlpha * 14;
      ctx.beginPath();
      ctx.roundRect(aiPt.x - aiBoxW / 2, aiPt.y - aiBoxH / 2, aiBoxW, aiBoxH, 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      B.drawLabel(ctx, 'Use AI', { x: aiPt.x, y: aiPt.y + 3 },
        wA(P.green, resultAlpha * 0.9), 'bold 12px "JetBrains Mono", monospace', 'center');
    }

    // === "Hire" result node (coral, dim) ===
    if (resultAlpha > 0) {
      var hireBoxW = 78, hireBoxH = 32;
      ctx.save();
      ctx.fillStyle = wA(P.coral, resultAlpha * 0.05);
      ctx.strokeStyle = wA(P.coral, resultAlpha * 0.3);
      ctx.lineWidth = 1;
      ctx.shadowColor = P.coral;
      ctx.shadowBlur = resultAlpha * 4;
      ctx.beginPath();
      ctx.roundRect(hirePt.x - hireBoxW / 2, hirePt.y - hireBoxH / 2, hireBoxW, hireBoxH, 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      B.drawLabel(ctx, 'Hire', { x: hirePt.x, y: hirePt.y + 3 },
        wA(P.coral, resultAlpha * 0.5), '11px "JetBrains Mono", monospace', 'center');
    }

    // === Company labels ===
    if (resultAlpha > 0.5) {
      var compAlpha = B.easeOut(B.clamp((resultAlpha - 0.5) / 0.5, 0, 1));
      B.drawLabel(ctx, 'Shopify', { x: w * 0.85, y: h * 0.15 },
        wA(P.teal, compAlpha * 0.6), '9px "JetBrains Mono", monospace', 'right');
      B.drawLabel(ctx, 'Salesforce', { x: w * 0.85, y: h * 0.20 },
        wA(P.blue, compAlpha * 0.6), '9px "JetBrains Mono", monospace', 'right');
    }

    // === Counter: 9,000 → 5,000 ===
    if (phase > 0.6) {
      var countPhase = B.clamp((phase - 0.6) / 0.3, 0, 1);
      var headcount = Math.round(B.lerp(9000, 5000, B.easeOut(countPhase)));
      B.drawLabel(ctx, headcount.toLocaleString() + ' heads',
        { x: w * 0.5, y: h * 0.82 },
        wA(P.coral, 0.8), 'bold 14px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, '9,000 \u2192 5,000', { x: w * 0.5, y: h * 0.87 },
        wA(P.white, 0.4), '9px "JetBrains Mono", monospace', 'center');
    }

    // Bottom insight
    if (t > 0.75) {
      var insAlpha = B.easeOut(B.clamp((t - 0.75) / 0.15, 0, 1));
      B.drawLabel(ctx, 'every new hire must pass the AI test first',
        { x: w * 0.5, y: h * 0.94 },
        wA(P.yellow, insAlpha * 0.5), '9px "JetBrains Mono", monospace', 'center');
    }
  }

  return B.animate(canvas, container, draw);
}
