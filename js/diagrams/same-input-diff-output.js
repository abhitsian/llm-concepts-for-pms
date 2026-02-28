// same-input-diff-output.js — Non-determinism in LLMs
// Same prompt produces different outputs each time

function SameInputDiffOutputDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;

  var NUM_CURVES = 6;
  var CYCLE = 10;
  var STAGGER = 1.0;       // delay between each curve appearing
  var DRAW_EACH = 1.2;     // time to draw each curve
  var HOLD = 2.5;           // hold final state

  // Pre-defined curve personalities
  var curves = [
    { cp1y: -0.18, cp2y: -0.10, endY: -0.22, prob: 0.28, color: P.teal },
    { cp1y:  0.05, cp2y:  0.15, endY:  0.08, prob: 0.22, color: P.blue },
    { cp1y: -0.08, cp2y:  0.20, endY:  0.18, prob: 0.18, color: P.green },
    { cp1y:  0.15, cp2y: -0.12, endY: -0.10, prob: 0.14, color: P.purple },
    { cp1y: -0.25, cp2y: -0.22, endY: -0.35, prob: 0.10, color: P.yellow },
    { cp1y:  0.20, cp2y:  0.30, endY:  0.32, prob: 0.08, color: P.coral },
  ];

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var mx = w * 0.10;
    var my = h * 0.12;
    var usableW = w - mx * 2.6; // leave room for labels on right
    var cy = h * 0.5;

    var t = time % CYCLE;
    var totalDraw = STAGGER * (NUM_CURVES - 1) + DRAW_EACH;
    var fadeStart = totalDraw + HOLD;
    var fadeT = t > fadeStart ? B.clamp((t - fadeStart) / (CYCLE - fadeStart), 0, 1) : 0;
    var globalAlpha = 1 - fadeT;

    // Input point
    var startPt = { x: mx, y: cy };

    // Draw each curve with stagger
    for (var i = 0; i < NUM_CURVES; i++) {
      var c = curves[i];
      var curveStart = STAGGER * i;
      var elapsed = t - curveStart;
      if (elapsed < 0) continue;

      var progress = B.clamp(elapsed / DRAW_EACH, 0, 1);
      progress = B.easeOut(progress);

      var endPt = { x: mx + usableW, y: cy + c.endY * h * 0.7 };
      var cp1 = { x: mx + usableW * 0.3, y: cy + c.cp1y * h * 0.7 };
      var cp2 = { x: mx + usableW * 0.65, y: cy + c.cp2y * h * 0.7 };
      var pts = [startPt, cp1, cp2, endPt];

      var steps = 60;
      var maxStep = Math.ceil(steps * progress);

      // Glow layer
      if (maxStep > 0) {
        ctx.save();
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 10 * globalAlpha;
        ctx.strokeStyle = B.withAlpha(c.color, 0.15 * globalAlpha);
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (var s = 0; s <= maxStep; s++) {
          var st = Math.min(s / steps, progress);
          var pt = B.cubicPt(pts[0], pts[1], pts[2], pts[3], st);
          if (s === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.restore();

        // Main curve
        ctx.save();
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 6 * globalAlpha;
        ctx.strokeStyle = B.withAlpha(c.color, 0.75 * globalAlpha);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (var s2 = 0; s2 <= maxStep; s2++) {
          var st2 = Math.min(s2 / steps, progress);
          var pt2 = B.cubicPt(pts[0], pts[1], pts[2], pts[3], st2);
          if (s2 === 0) ctx.moveTo(pt2.x, pt2.y); else ctx.lineTo(pt2.x, pt2.y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Endpoint dot and label
      if (progress > 0.9) {
        var epAlpha = B.clamp((progress - 0.9) / 0.1, 0, 1) * globalAlpha;
        B.drawDot(ctx, endPt, 3.5, B.withAlpha(c.color, epAlpha * 0.8), 8 * epAlpha);

        // Response label
        B.drawLabel(ctx, 'response ' + (i + 1),
          { x: endPt.x + 8, y: endPt.y - 10 },
          B.withAlpha(c.color, epAlpha * 0.6),
          '9px "JetBrains Mono", monospace', 'left');

        // Probability
        B.drawLabel(ctx, (c.prob * 100).toFixed(0) + '%',
          { x: endPt.x + 8, y: endPt.y + 6 },
          B.withAlpha(c.color, epAlpha * 0.45),
          '9px "JetBrains Mono", monospace', 'left');
      }
    }

    // Input dot (on top)
    B.drawDot(ctx, startPt, 6, B.withAlpha(P.white, globalAlpha), 15 * globalAlpha);
    B.drawDot(ctx, startPt, 3, B.withAlpha('#ffffff', 0.9 * globalAlpha));

    // "same prompt" label
    B.drawLabel(ctx, 'same prompt', { x: startPt.x, y: startPt.y + 24 },
      B.withAlpha(P.white, 0.5 * globalAlpha),
      '10px "JetBrains Mono", monospace', 'center');

    // Formula (appears after all curves drawn)
    if (t > totalDraw * 0.8) {
      var fAlpha = B.clamp((t - totalDraw * 0.8) / 1.0, 0, 1) * globalAlpha;
      B.drawLabel(ctx, 'P(output | input) \u2260 1.0',
        { x: w / 2, y: h * 0.92 },
        B.withAlpha(P.yellow, 0.6 * fAlpha),
        '12px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, 'non-deterministic sampling',
        { x: w / 2, y: h * 0.92 + 16 },
        B.withAlpha(P.white, 0.3 * fAlpha),
        '10px "JetBrains Mono", monospace', 'center');
    }

    // Title
    B.drawLabel(ctx, 'same input, different output', { x: mx + 4, y: my * 0.5 },
      B.withAlpha(P.white, 0.35 * globalAlpha),
      '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
