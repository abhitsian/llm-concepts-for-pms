// prompt-product.js — System prompt as invisible UI
// Shows how prompt guardrails constrain raw model output
// into smooth, directed behavior

function PromptProductDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;

  var CYCLE = 10;
  var WILD_DUR = 3.5;      // show unconstrained curve
  var TRANS_DUR = 2.0;      // guardrails fade in
  var CONSTRAINED_DUR = 3.5; // show constrained result
  var FADE_DUR = 1.0;       // fade before restart

  // Pseudo-random wobble for the wild curve
  function wildY(t, h, cy) {
    return cy + h * 0.3 * (
      Math.sin(t * 4.2) * 0.5 +
      Math.sin(t * 7.1 + 1.0) * 0.3 +
      Math.sin(t * 11.3 + 2.5) * 0.2
    );
  }

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var mx = w * 0.08;
    var my = h * 0.14;
    var usableW = w - mx * 2;
    var cy = h * 0.5;

    var t = time % CYCLE;

    // Phase determination
    var phase, phaseT;
    if (t < WILD_DUR) {
      phase = 'wild';
      phaseT = t / WILD_DUR;
    } else if (t < WILD_DUR + TRANS_DUR) {
      phase = 'transition';
      phaseT = (t - WILD_DUR) / TRANS_DUR;
    } else if (t < WILD_DUR + TRANS_DUR + CONSTRAINED_DUR) {
      phase = 'constrained';
      phaseT = (t - WILD_DUR - TRANS_DUR) / CONSTRAINED_DUR;
    } else {
      phase = 'fade';
      phaseT = (t - WILD_DUR - TRANS_DUR - CONSTRAINED_DUR) / FADE_DUR;
    }

    var globalAlpha = phase === 'fade' ? 1 - B.easeInOut(phaseT) : 1;
    var drawProgress = phase === 'wild' ? B.easeOut(phaseT) : 1;
    var guardrailAlpha = 0;
    var constrainAmount = 0;

    if (phase === 'transition') {
      guardrailAlpha = B.easeInOut(phaseT);
      constrainAmount = B.easeInOut(phaseT);
    } else if (phase === 'constrained' || phase === 'fade') {
      guardrailAlpha = 1;
      constrainAmount = 1;
    }

    // --- Guardrail boundary curves ---
    var upperPts = [
      { x: mx, y: cy - h * 0.12 },
      { x: mx + usableW * 0.33, y: cy - h * 0.15 },
      { x: mx + usableW * 0.66, y: cy - h * 0.10 },
      { x: mx + usableW, y: cy - h * 0.13 }
    ];
    var lowerPts = [
      { x: mx, y: cy + h * 0.12 },
      { x: mx + usableW * 0.33, y: cy + h * 0.10 },
      { x: mx + usableW * 0.66, y: cy + h * 0.15 },
      { x: mx + usableW, y: cy + h * 0.13 }
    ];

    // Draw guardrail fill
    if (guardrailAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = guardrailAlpha * 0.06 * globalAlpha;
      ctx.fillStyle = P.purple;
      ctx.beginPath();
      for (var g = 0; g <= 60; g++) {
        var gt = g / 60;
        var gp = B.cubicPt(upperPts[0], upperPts[1], upperPts[2], upperPts[3], gt);
        if (g === 0) ctx.moveTo(gp.x, gp.y); else ctx.lineTo(gp.x, gp.y);
      }
      for (var g2 = 60; g2 >= 0; g2--) {
        var gt2 = g2 / 60;
        var gp2 = B.cubicPt(lowerPts[0], lowerPts[1], lowerPts[2], lowerPts[3], gt2);
        ctx.lineTo(gp2.x, gp2.y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();

      // Upper guardrail line
      B.drawCurve(ctx, upperPts, 60,
        B.withAlpha(P.purple, 0.4 * guardrailAlpha * globalAlpha), 1.5, 6);
      // Lower guardrail line
      B.drawCurve(ctx, lowerPts, 60,
        B.withAlpha(P.purple, 0.4 * guardrailAlpha * globalAlpha), 1.5, 6);

      // Prompt text along guardrails
      var promptFrags = ['"You are a', 'helpful assistant', 'that responds', 'concisely..."'];
      for (var f = 0; f < promptFrags.length; f++) {
        var ft = (f + 0.5) / promptFrags.length;
        var upPt = B.cubicPt(upperPts[0], upperPts[1], upperPts[2], upperPts[3], ft);
        B.drawLabel(ctx, promptFrags[f], { x: upPt.x, y: upPt.y - 12 },
          B.withAlpha(P.purple, 0.3 * guardrailAlpha * globalAlpha),
          '9px "JetBrains Mono", monospace', 'center');
      }
    }

    // --- Output curve (wild → constrained) ---
    var curvePts = 80;
    var maxPt = Math.ceil(curvePts * drawProgress);

    ctx.save();
    ctx.shadowColor = constrainAmount < 0.5 ? P.coral : P.teal;
    ctx.shadowBlur = 10 * globalAlpha;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    // Color transitions from coral (wild) to teal (constrained)
    var curveColor = constrainAmount < 0.5
      ? B.withAlpha(P.coral, 0.8 * globalAlpha)
      : B.withAlpha(P.teal, (0.5 + constrainAmount * 0.4) * globalAlpha);
    ctx.strokeStyle = curveColor;

    ctx.beginPath();
    for (var i = 0; i <= maxPt; i++) {
      var ct = Math.min(i / curvePts, drawProgress);
      var px = mx + usableW * ct;

      // Wild Y position
      var wy = wildY(ct, h, cy);

      // Constrained Y: clamp wild Y between guardrail bounds
      var upperY = B.cubicPt(upperPts[0], upperPts[1], upperPts[2], upperPts[3], ct).y;
      var lowerY = B.cubicPt(lowerPts[0], lowerPts[1], lowerPts[2], lowerPts[3], ct).y;
      var midY = (upperY + lowerY) / 2;
      var constrainedY = B.lerp(wy, B.clamp(wy, upperY, lowerY), constrainAmount);
      // Also smooth toward center with some constraint
      constrainedY = B.lerp(constrainedY,
        B.lerp(midY, constrainedY, 0.7), constrainAmount * 0.3);

      if (i === 0) ctx.moveTo(px, constrainedY);
      else ctx.lineTo(px, constrainedY);
    }
    ctx.stroke();
    ctx.restore();

    // --- Phase labels ---
    if (phase === 'wild') {
      var wlAlpha = B.clamp(phaseT / 0.3, 0, 1) * globalAlpha;
      B.drawLabel(ctx, 'raw output (no system prompt)',
        { x: w / 2, y: h * 0.90 },
        B.withAlpha(P.coral, 0.6 * wlAlpha),
        '11px "JetBrains Mono", monospace', 'center');
    } else if (phase === 'transition') {
      var tlAlpha = B.easeInOut(phaseT) * globalAlpha;
      B.drawLabel(ctx, 'system prompt constraining output...',
        { x: w / 2, y: h * 0.90 },
        B.withAlpha(P.purple, 0.6 * tlAlpha),
        '11px "JetBrains Mono", monospace', 'center');
    } else if (phase === 'constrained') {
      B.drawLabel(ctx, 'output = f(prompt, input)',
        { x: w / 2, y: h * 0.90 },
        B.withAlpha(P.teal, 0.6 * globalAlpha),
        '12px "JetBrains Mono", monospace', 'center');
      if (phaseT > 0.3) {
        var subAlpha = B.clamp((phaseT - 0.3) / 0.3, 0, 1);
        B.drawLabel(ctx, 'prompt is the dominant variable',
          { x: w / 2, y: h * 0.90 + 18 },
          B.withAlpha(P.white, 0.35 * subAlpha * globalAlpha),
          '10px "JetBrains Mono", monospace', 'center');
      }
    }

    // Title
    B.drawLabel(ctx, 'prompt as product surface', { x: mx + 4, y: my * 0.5 },
      B.withAlpha(P.white, 0.35 * globalAlpha),
      '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
