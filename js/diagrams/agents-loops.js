// agents-loops.js — Animated agent loop spiral diagram
// Spiral Bezier that tightens inward with quality rising per iteration.

function AgentsLoopsDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;
  var ITERATIONS = 3;
  var SPIRAL_STEPS = 200;

  // Build spiral points: 3 revolutions tightening inward
  function spiralPt(frac, cx, cy, maxR) {
    var angle = frac * ITERATIONS * Math.PI * 2 - Math.PI / 2;
    var r = maxR * (1 - frac * 0.7); // tightens from maxR to 30%
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  }

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var cx = w * 0.45, cy = h * 0.5;
    var maxR = Math.min(w * 0.32, h * 0.38);
    var t = (time % CYCLE) / CYCLE;

    // Draw progress: spiral draws in over 0..0.75 of cycle
    var drawT = B.clamp(t / 0.75, 0, 1);
    var eased = B.easeInOut(drawT);

    // Draw the spiral as small line segments
    var prevPt = spiralPt(0, cx, cy, maxR);
    for (var i = 1; i <= SPIRAL_STEPS; i++) {
      var frac = i / SPIRAL_STEPS;
      if (frac > eased) break;
      var pt = spiralPt(frac, cx, cy, maxR);

      // Color shifts from teal to green as quality improves
      var tealAmt = 1 - frac;
      var r = Math.round(78 * tealAmt + 107 * (1 - tealAmt));
      var g = Math.round(205 * tealAmt + 203 * (1 - tealAmt));
      var b2 = Math.round(196 * tealAmt + 119 * (1 - tealAmt));
      var color = 'rgba(' + r + ',' + g + ',' + b2 + ',' + (0.3 + frac * 0.5) + ')';
      var glow = frac > eased - 0.05 ? 10 : 0;

      ctx.save();
      if (glow) { ctx.shadowColor = P.teal; ctx.shadowBlur = glow; }
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5 + frac * 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(prevPt.x, prevPt.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      ctx.restore();

      prevPt = pt;
    }

    // Tracer dot at the drawing front
    if (eased > 0.01) {
      var tracerPt = spiralPt(eased, cx, cy, maxR);
      B.drawDot(ctx, tracerPt, 5, P.teal, 16);
      B.drawDot(ctx, tracerPt, 2.5, '#ffffff');
    }

    // Iteration labels at the start of each revolution
    var iterLabels = ['Iteration 1: attempt', 'Iteration 2: refine', 'Iteration 3: converge'];
    var iterColors = [P.teal, P.yellow, P.green];
    for (var it = 0; it < ITERATIONS; it++) {
      var iterFrac = it / ITERATIONS;
      if (iterFrac > eased) break;
      var labelAlpha = B.clamp((eased - iterFrac) * 5, 0, 0.8);
      var lpt = spiralPt(iterFrac + 0.02, cx, cy, maxR);
      B.drawDot(ctx, spiralPt(iterFrac, cx, cy, maxR), 4, wA(iterColors[it], labelAlpha), 8);
      B.drawLabel(ctx, iterLabels[it], { x: lpt.x, y: lpt.y - 14 },
        wA(iterColors[it], labelAlpha), '9px "JetBrains Mono", monospace', 'left');
    }

    // "done." at center when spiral completes
    if (eased > 0.95) {
      var doneAlpha = B.clamp((eased - 0.95) / 0.05, 0, 1);
      B.drawDot(ctx, { x: cx, y: cy }, 8, wA(P.green, doneAlpha * 0.5), 20);
      B.drawLabel(ctx, 'done.', { x: cx, y: cy + 2 },
        wA(P.green, doneAlpha), '12px "JetBrains Mono", monospace', 'center');
    }

    // Quality line (right side) — rises with spiral progress
    var qx = w * 0.78, qTop = h * 0.18, qBot = h * 0.78;
    var qH = qBot - qTop;

    // Axis
    B.drawLine(ctx, { x: qx, y: qTop }, { x: qx, y: qBot }, wA(P.white, 0.15), 1);
    B.drawLabel(ctx, 'quality', { x: qx, y: qTop - 10 },
      wA(P.white, 0.4), '9px "JetBrains Mono", monospace', 'center');

    // Quality bar that fills up
    var quality = eased * 0.9; // max 90%
    var qFill = qBot - quality * qH;
    if (quality > 0.01) {
      ctx.save();
      var grad = ctx.createLinearGradient(qx - 8, qBot, qx - 8, qFill);
      grad.addColorStop(0, wA(P.teal, 0.3));
      grad.addColorStop(1, wA(P.green, 0.7));
      ctx.fillStyle = grad;
      ctx.shadowColor = P.green;
      ctx.shadowBlur = 8;
      ctx.fillRect(qx - 8, qFill, 16, qBot - qFill);
      ctx.restore();

      var pctText = Math.round(quality * 100) + '%';
      B.drawLabel(ctx, pctText, { x: qx, y: qFill - 12 },
        wA(P.green, 0.8), '10px "JetBrains Mono", monospace', 'center');
    }

    // Cost counter (below quality bar)
    var costY = qBot + 30;
    var itersComplete = Math.min(ITERATIONS, Math.floor(eased * ITERATIONS + 0.01));
    var costVal = (itersComplete * 0.08).toFixed(2);
    B.drawLabel(ctx, 'cost: $' + costVal, { x: qx, y: costY },
      wA(P.coral, 0.6), '10px "JetBrains Mono", monospace', 'center');

    // Formula + example at bottom
    var fAlpha = 0.3 + (t > 0.8 ? B.clamp((t - 0.8) / 0.1, 0, 0.4) : 0);
    B.drawLabel(ctx, 'total_cost = iterations \u00D7 avg_cost_per_loop',
      { x: w * 0.4, y: h * 0.9 },
      wA(P.white, fAlpha), '9px "JetBrains Mono", monospace', 'center');
    if (t > 0.82) {
      var exAlpha = B.clamp((t - 0.82) / 0.1, 0, 0.5);
      B.drawLabel(ctx, '5 iterations \u00D7 $0.08 = $0.40',
        { x: w * 0.4, y: h * 0.95 },
        wA(P.yellow, exAlpha), '9px "JetBrains Mono", monospace', 'center');
    }

    // Title
    B.drawLabel(ctx, 'agents are loops', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
