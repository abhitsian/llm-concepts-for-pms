// hallucinations.js — Animated hallucination diagram
// Shows how LLMs confidently produce wrong answers:
// truth and model output diverge while confidence stays high

function HallucinationsDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;

  var CYCLE = 8;          // total seconds per loop
  var DRAW_DUR = 4.0;     // time to draw curves
  var HOLD_DUR = 3.0;     // hold final state
  var FADE_DUR = 1.0;     // fade before restart

  // Seed-based pseudo-random for repeatable wobble
  function wobble(t, freq, amp) {
    return Math.sin(t * freq) * amp + Math.sin(t * freq * 1.7 + 1.3) * amp * 0.4;
  }

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var mx = w * 0.1;
    var my = h * 0.14;
    var usableW = w - mx * 2;
    var cy = h * 0.48;

    var t = time % CYCLE;
    var drawT = B.clamp(t / DRAW_DUR, 0, 1);
    var fadeT = t > (CYCLE - FADE_DUR)
      ? B.clamp((t - (CYCLE - FADE_DUR)) / FADE_DUR, 0, 1) : 0;
    var globalAlpha = 1 - fadeT;

    // Shared start point
    var start = { x: mx, y: cy };

    // Divergence starts at ~35% along the path
    var divX = 0.35;

    // Truth curve: gentle S-curve staying near center
    var truthPts = [
      start,
      { x: mx + usableW * 0.3, y: cy - 10 },
      { x: mx + usableW * 0.65, y: cy + 15 },
      { x: mx + usableW, y: cy - 5 }
    ];

    // Model output: follows truth initially, then veers off confidently
    var modelPts = [
      start,
      { x: mx + usableW * 0.3, y: cy - 12 },
      { x: mx + usableW * 0.6, y: cy - h * 0.25 },
      { x: mx + usableW, y: cy - h * 0.32 }
    ];

    var progress = B.easeInOut(drawT);
    var steps = 80;
    var maxStep = Math.ceil(steps * progress);

    // Draw truth curve (green) — partial
    if (maxStep > 0) {
      ctx.save();
      ctx.shadowColor = P.green;
      ctx.shadowBlur = 10 * globalAlpha;
      ctx.strokeStyle = B.withAlpha(P.green, 0.7 * globalAlpha);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var i = 0; i <= maxStep; i++) {
        var st = Math.min(i / steps, progress);
        var pt = B.cubicPt(truthPts[0], truthPts[1], truthPts[2], truthPts[3], st);
        if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw model output curve (coral) — partial
    if (maxStep > 0) {
      ctx.save();
      ctx.shadowColor = P.coral;
      ctx.shadowBlur = 12 * globalAlpha;
      ctx.strokeStyle = B.withAlpha(P.coral, 0.8 * globalAlpha);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var j = 0; j <= maxStep; j++) {
        var sm = Math.min(j / steps, progress);
        var pm = B.cubicPt(modelPts[0], modelPts[1], modelPts[2], modelPts[3], sm);
        if (j === 0) ctx.moveTo(pm.x, pm.y); else ctx.lineTo(pm.x, pm.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Gap shading between the two curves (hallucination region)
    if (progress > divX) {
      var gapAlpha = B.clamp((progress - divX) / (1 - divX), 0, 1) * 0.12 * globalAlpha;
      ctx.save();
      ctx.fillStyle = B.withAlpha(P.coral, gapAlpha);
      ctx.beginPath();
      // Forward along model curve
      var gapSteps = 50;
      for (var g = 0; g <= gapSteps; g++) {
        var gt = B.lerp(divX, progress, g / gapSteps);
        var gp = B.cubicPt(modelPts[0], modelPts[1], modelPts[2], modelPts[3], gt);
        if (g === 0) ctx.moveTo(gp.x, gp.y); else ctx.lineTo(gp.x, gp.y);
      }
      // Backward along truth curve
      for (var g2 = gapSteps; g2 >= 0; g2--) {
        var gt2 = B.lerp(divX, progress, g2 / gapSteps);
        var gp2 = B.cubicPt(truthPts[0], truthPts[1], truthPts[2], truthPts[3], gt2);
        ctx.lineTo(gp2.x, gp2.y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Divergence point marker
    if (progress > divX) {
      var divPt = B.cubicPt(truthPts[0], truthPts[1], truthPts[2], truthPts[3], divX);
      var markerAlpha = B.clamp((progress - divX) / 0.15, 0, 1) * globalAlpha;
      B.drawDot(ctx, divPt, 4, B.withAlpha(P.yellow, markerAlpha * 0.8), 10 * markerAlpha);
      B.drawLabel(ctx, 'hallucination begins',
        { x: divPt.x + 5, y: divPt.y + 20 },
        B.withAlpha(P.yellow, markerAlpha * 0.7),
        '10px "JetBrains Mono", monospace', 'left');
    }

    // Start dot
    B.drawDot(ctx, start, 5, B.withAlpha(P.white, globalAlpha), 12 * globalAlpha);

    // Curve labels at endpoints
    if (progress > 0.85) {
      var endAlpha = B.clamp((progress - 0.85) / 0.15, 0, 1) * globalAlpha;
      var truthEnd = B.cubicPt(truthPts[0], truthPts[1], truthPts[2], truthPts[3], progress);
      var modelEnd = B.cubicPt(modelPts[0], modelPts[1], modelPts[2], modelPts[3], progress);
      B.drawLabel(ctx, 'truth', { x: truthEnd.x + 8, y: truthEnd.y },
        B.withAlpha(P.green, endAlpha * 0.8), '11px "JetBrains Mono", monospace', 'left');
      B.drawLabel(ctx, 'model output', { x: modelEnd.x + 8, y: modelEnd.y },
        B.withAlpha(P.coral, endAlpha * 0.8), '11px "JetBrains Mono", monospace', 'left');
    }

    // Prompt label
    B.drawLabel(ctx, '"prompt"', { x: start.x, y: start.y + 20 },
      B.withAlpha(P.white, 0.5 * globalAlpha),
      '10px "JetBrains Mono", monospace', 'center');

    // Confidence bar (stays high even when wrong)
    var barX = mx;
    var barY = h * 0.82;
    var barW = usableW * progress;
    var barH = 14;
    var confidence = 0.93 + 0.04 * Math.sin(time * 2.1); // 93-97%

    // Bar background
    ctx.save();
    ctx.strokeStyle = B.withAlpha(P.white, 0.15 * globalAlpha);
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, barY, usableW, barH);

    // Bar fill — starts green, turns coral after divergence
    if (barW > 0) {
      var grad = ctx.createLinearGradient(mx, 0, mx + usableW, 0);
      var divPixelFrac = divX;
      grad.addColorStop(0, B.withAlpha(P.green, 0.6 * globalAlpha));
      grad.addColorStop(divPixelFrac, B.withAlpha(P.green, 0.5 * globalAlpha));
      grad.addColorStop(Math.min(divPixelFrac + 0.05, 1), B.withAlpha(P.coral, 0.6 * globalAlpha));
      grad.addColorStop(1, B.withAlpha(P.coral, 0.7 * globalAlpha));
      ctx.fillStyle = grad;
      ctx.fillRect(mx, barY, barW, barH);
    }
    ctx.restore();

    // Confidence percentage
    B.drawLabel(ctx, 'confidence: ' + (confidence * 100).toFixed(0) + '%',
      { x: mx + usableW + 8, y: barY + barH / 2 },
      B.withAlpha(P.coral, 0.8 * globalAlpha),
      '10px "JetBrains Mono", monospace', 'left');

    // Formula
    if (progress > 0.5) {
      var fAlpha = B.clamp((progress - 0.5) / 0.2, 0, 1) * globalAlpha;
      B.drawLabel(ctx, 'P(correct) \u2260 P(confident)',
        { x: w / 2, y: h * 0.95 },
        B.withAlpha(P.yellow, fAlpha * 0.6),
        '12px "JetBrains Mono", monospace', 'center');
    }

    // Title
    B.drawLabel(ctx, 'hallucination', { x: mx + 4, y: my * 0.5 },
      B.withAlpha(P.white, 0.35 * globalAlpha),
      '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
