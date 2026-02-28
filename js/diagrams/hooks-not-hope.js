// hooks-not-hope.js — Guardrails moved from prompts to code
// Enforcement replaced trust: hooks catch what hope cannot

function HooksNotHopeDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  // Seeded pseudo-random wandering offsets
  function wander(t, seed) {
    return Math.sin(t * 2.3 + seed) * 0.6 + Math.sin(t * 3.7 + seed * 1.4) * 0.4;
  }

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var mx = w * 0.08, my = h * 0.06;
    var usableW = w - mx * 2;
    var t = (time % CYCLE) / CYCLE;
    var progress = B.easeInOut(B.clamp(t / 0.7, 0, 1));

    // --- Layout: top half = HOPE, bottom half = HOOKS ---
    var topY = h * 0.25, botY = h * 0.72;
    var dangerTop = topY - h * 0.13, dangerBot = botY - h * 0.13;
    var safeTop = topY + h * 0.02, safeBot = botY + h * 0.02;

    // Section labels
    B.drawLabel(ctx, 'HOPE', { x: mx, y: topY - h * 0.18 },
      wA(P.coral, 0.8), '13px "JetBrains Mono", monospace', 'left');
    B.drawLabel(ctx, 'HOOKS', { x: mx, y: botY - h * 0.18 },
      wA(P.green, 0.8), '13px "JetBrains Mono", monospace', 'left');

    // Divider
    B.drawLine(ctx, { x: mx, y: h * 0.48 }, { x: mx + usableW, y: h * 0.48 },
      wA(P.white, 0.08), 1, [4, 8]);

    // --- DANGER ZONES (red shaded regions above each curve area) ---
    var dzH = h * 0.1;
    // Top danger zone
    ctx.save();
    ctx.fillStyle = wA(P.coral, 0.06);
    ctx.fillRect(mx, dangerTop - dzH * 0.5, usableW, dzH);
    ctx.restore();
    B.drawLine(ctx, { x: mx, y: dangerTop + dzH * 0.5 },
      { x: mx + usableW, y: dangerTop + dzH * 0.5 }, wA(P.coral, 0.2), 1, [3, 3]);
    B.drawLabel(ctx, 'danger zone', { x: mx + usableW - 4, y: dangerTop - dzH * 0.3 },
      wA(P.coral, 0.35), '9px "JetBrains Mono", monospace', 'right');

    // Bottom danger zone
    ctx.save();
    ctx.fillStyle = wA(P.coral, 0.06);
    ctx.fillRect(mx, dangerBot - dzH * 0.5, usableW, dzH);
    ctx.restore();
    B.drawLine(ctx, { x: mx, y: dangerBot + dzH * 0.5 },
      { x: mx + usableW, y: dangerBot + dzH * 0.5 }, wA(P.coral, 0.2), 1, [3, 3]);

    // --- TOP: HOPE curve — wanders freely into danger ---
    var wanderAmt = h * 0.16;
    var hopeSteps = 80;
    var hopePts = [];
    for (var i = 0; i <= hopeSteps; i++) {
      var frac = i / hopeSteps;
      if (frac > progress) break;
      var x = mx + usableW * frac;
      var yOff = wander(frac * 6 + time * 0.3, 1.0) * wanderAmt * frac;
      hopePts.push({ x: x, y: topY - yOff });
    }
    if (hopePts.length > 1) {
      ctx.save();
      ctx.shadowColor = P.coral;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = wA(P.coral, 0.7);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hopePts[0].x, hopePts[0].y);
      for (var i = 1; i < hopePts.length; i++) ctx.lineTo(hopePts[i].x, hopePts[i].y);
      ctx.stroke();
      ctx.restore();
    }

    // Prompt label on HOPE
    if (progress > 0.1) {
      B.drawLabel(ctx, '"please don\'t do bad things"',
        { x: mx + usableW * 0.2, y: topY + h * 0.08 },
        wA(P.coral, 0.4), '9px "JetBrains Mono", monospace', 'left');
    }

    // --- BOTTOM: HOOKS curve — bounces off boundaries ---
    var boundaryY = dangerBot + dzH * 0.5;
    var hooksPts = [];
    var hookNodes = [];
    for (var i = 0; i <= hopeSteps; i++) {
      var frac = i / hopeSteps;
      if (frac > progress) break;
      var x = mx + usableW * frac;
      var rawY = botY - wander(frac * 6 + time * 0.3, 1.0) * wanderAmt * frac;
      // Clamp: enforce the boundary
      if (rawY < boundaryY) {
        hookNodes.push({ x: x, y: boundaryY });
        rawY = boundaryY + 2;
      }
      hooksPts.push({ x: x, y: rawY });
    }
    if (hooksPts.length > 1) {
      ctx.save();
      ctx.shadowColor = P.green;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = wA(P.green, 0.7);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hooksPts[0].x, hooksPts[0].y);
      for (var i = 1; i < hooksPts.length; i++) ctx.lineTo(hooksPts[i].x, hooksPts[i].y);
      ctx.stroke();
      ctx.restore();
    }

    // Draw hard boundary line for HOOKS
    B.drawLine(ctx, { x: mx, y: boundaryY }, { x: mx + usableW, y: boundaryY },
      wA(P.green, 0.5), 2);

    // Hook catch points — bright nodes
    for (var h2 = 0; h2 < hookNodes.length; h2++) {
      var pulse = 0.6 + Math.sin(time * 4 + h2) * 0.3;
      B.drawDot(ctx, hookNodes[h2], 5, wA(P.yellow, pulse), 12);
      B.drawRing(ctx, hookNodes[h2], 8, wA(P.yellow, pulse * 0.4), 1);
    }

    // Hook labels
    var hookLabels = ['pre-commit hooks', 'output validators', 'permission checks'];
    var hookLabelX = [0.2, 0.5, 0.8];
    for (var i = 0; i < hookLabels.length; i++) {
      var labelProg = B.clamp((progress - hookLabelX[i] + 0.15) / 0.2, 0, 1);
      if (labelProg > 0) {
        B.drawLabel(ctx, hookLabels[i],
          { x: mx + usableW * hookLabelX[i], y: boundaryY + 16 },
          wA(P.teal, labelProg * 0.6),
          '9px "JetBrains Mono", monospace', 'center');
      }
    }

    // Start dots
    B.drawDot(ctx, { x: mx, y: topY }, 4, wA(P.white, 0.8), 10);
    B.drawDot(ctx, { x: mx, y: botY }, 4, wA(P.white, 0.8), 10);

    // Formula
    if (progress > 0.5) {
      var fA = B.clamp((progress - 0.5) / 0.2, 0, 1);
      B.drawLabel(ctx, 'safety = code_enforcement > prompt_suggestions',
        { x: w * 0.5, y: h * 0.95 },
        wA(P.yellow, fA * 0.6), '10px "JetBrains Mono", monospace', 'center');
    }

    // Title
    B.drawLabel(ctx, 'hooks, not hope', { x: mx, y: my },
      wA(P.white, 0.35), '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
