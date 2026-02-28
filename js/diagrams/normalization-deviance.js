// normalization-deviance.js — When risky shortcuts work, baseline drifts
// Each small dip becomes the new normal until catastrophic failure

function NormalizationDevianceDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 14;
  var STEPS_DUR = 9;    // time to draw the drifting steps
  var CRASH_AT = 0.72;  // fraction of STEPS_DUR when crash begins
  var HOLD = 3;
  var FADE = 2;

  var deviations = [
    { label: 'skipped review once', drop: 0.07 },
    { label: 'disabled tests', drop: 0.09 },
    { label: 'hardcoded credentials', drop: 0.1 },
    { label: 'deployed on Friday', drop: 0.08 },
    { label: '"it works on my machine"', drop: 0.06 }
  ];

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var mx = w * 0.1, my = h * 0.1;
    var usableW = w - mx * 2, usableH = h * 0.6;
    var baseY = h * 0.2; // original safety baseline

    var t = time % CYCLE;
    var stepT = B.clamp(t / STEPS_DUR, 0, 1);
    var fadeT = t > (CYCLE - FADE) ? B.clamp((t - (CYCLE - FADE)) / FADE, 0, 1) : 0;
    var alpha = 1 - fadeT;

    // --- Original baseline (dashed green) ---
    B.drawLine(ctx, { x: mx, y: baseY }, { x: mx + usableW, y: baseY },
      wA(P.green, 0.4 * alpha), 1.5, [6, 6]);
    B.drawLabel(ctx, 'original safety baseline', { x: mx + usableW + 6, y: baseY },
      wA(P.green, 0.35 * alpha), '9px "JetBrains Mono", monospace', 'left');

    // --- Step-by-step deviation ---
    var n = deviations.length;
    var segW = usableW * CRASH_AT / n;
    var currentY = baseY;
    var stepsDrawn = 0;

    for (var i = 0; i < n; i++) {
      var stepStart = i / n * CRASH_AT;
      var stepEnd = (i + 1) / n * CRASH_AT;
      var localProg = B.clamp((stepT - stepStart) / (stepEnd - stepStart), 0, 1);
      var eased = B.easeInOut(localProg);

      if (localProg <= 0) break;
      stepsDrawn++;

      var x0 = mx + segW * i;
      var x1 = mx + segW * (i + 1);
      var dropPx = deviations[i].drop * usableH;
      var newY = currentY + dropPx * eased;

      // Horizontal "plateau" at current level
      if (eased > 0) {
        var plateauEnd = B.lerp(x0, x1 - segW * 0.4, eased);
        B.drawLine(ctx, { x: x0, y: currentY }, { x: plateauEnd, y: currentY },
          wA(P.yellow, 0.6 * alpha), 2);
      }

      // Downward curve to next level
      if (eased > 0.3) {
        var dProg = B.clamp((eased - 0.3) / 0.7, 0, 1);
        var cx0 = x1 - segW * 0.4;
        var cx1 = x1;
        var cp1 = { x: B.lerp(cx0, cx1, 0.5), y: currentY };
        var cp2 = { x: B.lerp(cx0, cx1, 0.5), y: currentY + dropPx };
        var curveSteps = 30;
        var maxS = Math.ceil(curveSteps * dProg);
        ctx.save();
        ctx.shadowColor = P.yellow;
        ctx.shadowBlur = 6 * alpha;
        ctx.strokeStyle = wA(P.yellow, 0.6 * alpha);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (var s = 0; s <= maxS; s++) {
          var sf = s / curveSteps;
          var pt = B.cubicPt({ x: cx0, y: currentY }, cp1, cp2,
            { x: cx1, y: currentY + dropPx }, sf);
          if (s === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // "Nothing bad happened" checkmark
      if (eased > 0.9 && i < n - 1) {
        B.drawLabel(ctx, '\u2713 nothing happened',
          { x: x0 + segW * 0.5, y: currentY + dropPx + 16 },
          wA(P.green, 0.35 * alpha), '8px "JetBrains Mono", monospace', 'center');
      }

      // Deviation label
      if (eased > 0.5) {
        var lA = B.clamp((eased - 0.5) / 0.3, 0, 1) * alpha;
        B.drawLabel(ctx, deviations[i].label,
          { x: x0 + segW * 0.3, y: currentY - 12 },
          wA(P.coral, lA * 0.6), '8px "JetBrains Mono", monospace', 'center');
      }

      // Dot at inflection
      if (eased > 0.5) {
        B.drawDot(ctx, { x: cx0, y: currentY }, 3, wA(P.yellow, 0.6 * alpha), 6);
      }

      currentY = currentY + dropPx * eased;
    }

    // Continue the line at final drifted level
    var lastX = mx + segW * stepsDrawn;
    var crashStartX = mx + usableW * CRASH_AT;
    if (stepT > (stepsDrawn > 0 ? (stepsDrawn - 1) / n * CRASH_AT : 0)) {
      B.drawLine(ctx, { x: lastX, y: currentY }, { x: crashStartX, y: currentY },
        wA(P.yellow, 0.6 * alpha), 2);
    }

    // "New normal" label at current level
    if (stepsDrawn >= 2) {
      B.drawLine(ctx, { x: crashStartX + 4, y: currentY },
        { x: crashStartX + 30, y: currentY },
        wA(P.yellow, 0.3 * alpha), 1, [2, 3]);
      B.drawLabel(ctx, '"new normal"', { x: crashStartX + 34, y: currentY },
        wA(P.yellow, 0.4 * alpha), '9px "JetBrains Mono", monospace', 'left');
    }

    // --- Gap indicator ---
    if (stepsDrawn >= 2) {
      var gapX = mx + usableW * CRASH_AT + 50;
      B.drawLine(ctx, { x: gapX, y: baseY }, { x: gapX, y: currentY },
        wA(P.coral, 0.3 * alpha), 1, [3, 3]);
      B.drawLabel(ctx, 'drift', { x: gapX + 8, y: (baseY + currentY) / 2 },
        wA(P.coral, 0.4 * alpha), '9px "JetBrains Mono", monospace', 'left');
    }

    // --- Catastrophic failure ---
    var crashProg = B.clamp((stepT - CRASH_AT) / (1 - CRASH_AT), 0, 1);
    if (crashProg > 0) {
      var crashEased = B.easeInOut(crashProg);
      var crashEndY = h * 0.88;
      var cp1 = { x: crashStartX + usableW * 0.1, y: currentY };
      var cp2 = { x: crashStartX + usableW * 0.15, y: crashEndY };
      var crashEnd = { x: mx + usableW, y: crashEndY };

      var crashSteps = 40;
      var maxCS = Math.ceil(crashSteps * crashEased);
      ctx.save();
      ctx.shadowColor = P.coral;
      ctx.shadowBlur = 14 * alpha;
      ctx.strokeStyle = wA(P.coral, 0.9 * alpha);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var c = 0; c <= maxCS; c++) {
        var cf = c / crashSteps;
        var cp = B.cubicPt({ x: crashStartX, y: currentY }, cp1, cp2, crashEnd, cf);
        if (c === 0) ctx.moveTo(cp.x, cp.y); else ctx.lineTo(cp.x, cp.y);
      }
      ctx.stroke();
      ctx.restore();

      // Crash label
      if (crashEased > 0.5) {
        var clA = B.clamp((crashEased - 0.5) / 0.3, 0, 1) * alpha;
        B.drawLabel(ctx, 'CATASTROPHIC FAILURE',
          { x: mx + usableW * 0.82, y: crashEndY - 16 },
          wA(P.coral, clA * 0.9), '11px "JetBrains Mono", monospace', 'center');
      }
    }

    // Formula
    var fA = B.clamp(stepT / 0.3, 0, 1) * alpha;
    B.drawLabel(ctx,
      'risk_perceived \u2192 0  as  violations_without_consequence \u2192 \u221E',
      { x: w * 0.5, y: h * 0.96 },
      wA(P.yellow, fA * 0.5), '9px "JetBrains Mono", monospace', 'center');

    // Title
    B.drawLabel(ctx, 'normalization of deviance', { x: mx, y: my * 0.6 },
      wA(P.white, 0.35 * alpha), '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
