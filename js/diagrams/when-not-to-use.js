// when-not-to-use.js — Decision flow: deterministic code vs LLM
// Shows when to use an LLM vs plain code via a branching Bezier path

function WhenNotToUseDiagram(canvas, container) {
  const B = Bezier;
  const P = B.palette;
  const wA = B.withAlpha;

  const CYCLE = 8;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    const mx = w * 0.08;
    const cy = h * 0.42;
    const t = (time % CYCLE) / CYCLE;

    // Title
    B.drawLabel(ctx, 'when not to use an LLM', { x: mx + 4, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');

    // Input point
    var inputPt = { x: mx + 20, y: cy };
    // Decision node
    var decisionX = w * 0.32;
    var decisionPt = { x: decisionX, y: cy };

    // Top path: deterministic -> checkmark
    var detEnd = { x: w - mx - 20, y: h * 0.22 };
    var detCp1 = { x: decisionX + (detEnd.x - decisionX) * 0.4, y: cy - 10 };
    var detCp2 = { x: decisionX + (detEnd.x - decisionX) * 0.7, y: detEnd.y + 10 };
    var detPts = [decisionPt, detCp1, detCp2, detEnd];

    // Bottom path: LLM -> result (wavy path)
    var llmEnd = { x: w - mx - 20, y: h * 0.62 };
    var llmCp1 = { x: decisionX + (llmEnd.x - decisionX) * 0.25, y: cy + 40 };
    var llmCp2 = { x: decisionX + (llmEnd.x - decisionX) * 0.65, y: llmEnd.y - 20 };
    var llmPts = [decisionPt, llmCp1, llmCp2, llmEnd];

    // Animation phases
    var inputT = B.clamp(t / 0.15, 0, 1);
    var splitT = B.clamp((t - 0.15) / 0.35, 0, 1);
    var labelT = B.clamp((t - 0.45) / 0.2, 0, 1);

    // Input line
    var inputDraw = B.easeOut(inputT);
    B.drawLine(ctx, inputPt, B.lerpPt(inputPt, decisionPt, inputDraw),
      wA(P.white, 0.7), 2);

    // Input dot travels
    if (inputT > 0 && inputT < 1) {
      var ip = B.lerpPt(inputPt, decisionPt, inputDraw);
      B.drawDot(ctx, ip, 5, P.white, 12);
    }

    // Input label
    B.drawLabel(ctx, 'input', { x: inputPt.x, y: inputPt.y - 16 },
      wA(P.white, 0.6), '10px "JetBrains Mono", monospace', 'center');

    // Decision node
    if (inputT > 0.5) {
      var dAlpha = B.easeOut(B.clamp((inputT - 0.5) / 0.5, 0, 1));
      // Diamond shape
      ctx.save();
      ctx.strokeStyle = wA(P.yellow, dAlpha * 0.8);
      ctx.lineWidth = 2;
      ctx.shadowColor = P.yellow; ctx.shadowBlur = 10 * dAlpha;
      ctx.beginPath();
      var ds = 14;
      ctx.moveTo(decisionPt.x, decisionPt.y - ds);
      ctx.lineTo(decisionPt.x + ds, decisionPt.y);
      ctx.lineTo(decisionPt.x, decisionPt.y + ds);
      ctx.lineTo(decisionPt.x - ds, decisionPt.y);
      ctx.closePath(); ctx.stroke(); ctx.restore();
      B.drawLabel(ctx, '?', { x: decisionPt.x, y: decisionPt.y },
        wA(P.yellow, dAlpha), '12px "JetBrains Mono", monospace', 'center');
    }

    // Branching paths
    if (splitT > 0) {
      var sd = B.easeOut(splitT);
      var steps = 60;
      var maxStep = Math.ceil(steps * sd);

      // Top path: green, clean straight-ish curve
      ctx.save();
      ctx.strokeStyle = wA(P.green, 0.7);
      ctx.lineWidth = 2.5; ctx.shadowColor = P.green; ctx.shadowBlur = 8;
      ctx.lineCap = 'round'; ctx.beginPath();
      for (var i = 0; i <= maxStep; i++) {
        var s = i / steps;
        var pt = B.cubicPt(detPts[0], detPts[1], detPts[2], detPts[3], s);
        if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke(); ctx.restore();

      // Bottom path: teal, wavier
      ctx.save();
      ctx.strokeStyle = wA(P.teal, 0.7);
      ctx.lineWidth = 2.5; ctx.shadowColor = P.teal; ctx.shadowBlur = 8;
      ctx.lineCap = 'round'; ctx.beginPath();
      for (var i = 0; i <= maxStep; i++) {
        var s = i / steps;
        var pt = B.cubicPt(llmPts[0], llmPts[1], llmPts[2], llmPts[3], s);
        // Add waviness to LLM path
        var wave = Math.sin(s * Math.PI * 6 + time * 2) * 4 * s;
        if (i === 0) ctx.moveTo(pt.x, pt.y + wave);
        else ctx.lineTo(pt.x, pt.y + wave);
      }
      ctx.stroke(); ctx.restore();

      // Traveling dots
      if (sd < 1) {
        var dp = B.cubicPt(detPts[0], detPts[1], detPts[2], detPts[3], sd);
        B.drawDot(ctx, dp, 4, P.green, 10);
        var lp = B.cubicPt(llmPts[0], llmPts[1], llmPts[2], llmPts[3], sd);
        B.drawDot(ctx, lp, 4, P.teal, 10);
      }
    }

    // Path labels
    if (splitT > 0.3) {
      var pla = B.easeOut(B.clamp((splitT - 0.3) / 0.3, 0, 1));
      var dm = B.cubicPt(detPts[0], detPts[1], detPts[2], detPts[3], 0.45);
      B.drawLabel(ctx, 'Deterministic \u2192 Use code', { x: dm.x, y: dm.y - 16 },
        wA(P.green, pla * 0.8), '10px "JetBrains Mono", monospace', 'center');
      var lm = B.cubicPt(llmPts[0], llmPts[1], llmPts[2], llmPts[3], 0.45);
      B.drawLabel(ctx, 'Fuzzy/creative \u2192 Use LLM', { x: lm.x, y: lm.y + 18 },
        wA(P.teal, pla * 0.8), '10px "JetBrains Mono", monospace', 'center');
    }

    // End markers
    if (splitT > 0.8) {
      var ea = B.easeOut(B.clamp((splitT - 0.8) / 0.2, 0, 1));
      // Checkmark for deterministic
      B.drawDot(ctx, detEnd, 8, wA(P.green, ea * 0.3), 12);
      B.drawLabel(ctx, '\u2713', { x: detEnd.x, y: detEnd.y },
        wA(P.green, ea), '16px "JetBrains Mono", monospace', 'center');
      // Result circle for LLM
      B.drawDot(ctx, llmEnd, 8, wA(P.teal, ea * 0.3), 12);
      B.drawLabel(ctx, '\u2248', { x: llmEnd.x, y: llmEnd.y },
        wA(P.teal, ea), '16px "JetBrains Mono", monospace', 'center');
    }

    // Stats comparison (bottom section)
    if (labelT > 0) {
      var la = B.easeOut(labelT);
      var statsY = h * 0.82;
      var col1 = w * 0.28;
      var col2 = w * 0.72;

      B.drawLabel(ctx, '\u2500\u2500 deterministic \u2500\u2500', { x: col1, y: statsY - 20 },
        wA(P.green, la * 0.7), '10px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, '$0  |  1ms  |  100%', { x: col1, y: statsY },
        wA(P.green, la * 0.9), '11px "JetBrains Mono", monospace', 'center');

      B.drawLabel(ctx, '\u2500\u2500 LLM \u2500\u2500', { x: col2, y: statsY - 20 },
        wA(P.teal, la * 0.7), '10px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, '$0.01  |  800ms  |  ~92%', { x: col2, y: statsY },
        wA(P.teal, la * 0.9), '11px "JetBrains Mono", monospace', 'center');

      // Criteria labels
      if (la > 0.5) {
        var ca = B.clamp((la - 0.5) / 0.5, 0, 1);
        var critY = h * 0.93;
        B.drawLabel(ctx, 'exact rules?  \u2192 code    |    needs creativity?  \u2192 LLM    |    error tolerance?  \u2192 depends',
          { x: w / 2, y: critY },
          wA(P.yellow, ca * 0.5), '9px "JetBrains Mono", monospace', 'center');
      }
    }
  }

  return B.animate(canvas, container, draw);
}
