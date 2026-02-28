// llm-landscape.js — 2D landscape of LLM providers
// X = capability, Y = openness. Frontier curve shifts right over time.

function LlmLandscapeDiagram(canvas, container) {
  const B = Bezier;
  const P = B.palette;
  const wA = B.withAlpha;

  const CYCLE = 10;

  // Model definitions: name, x(capability 0-1), y(openness 0-1), color
  var models = [
    { name: 'GPT-4',   cx: 0.88, cy: 0.18, color: P.coral },
    { name: 'Claude',  cx: 0.85, cy: 0.22, color: P.teal },
    { name: 'Gemini',  cx: 0.82, cy: 0.15, color: P.blue },
    { name: 'Llama',   cx: 0.78, cy: 0.82, color: P.green },
    { name: 'Mistral', cx: 0.60, cy: 0.75, color: P.yellow },
    { name: 'Phi',     cx: 0.38, cy: 0.85, color: P.purple }
  ];

  // Faint connections between models (indices)
  var connections = [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [2, 3]];

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var mx = w * 0.12;
    var my = h * 0.14;
    var plotW = w - mx * 2;
    var plotH = h - my * 2;

    // Map model coords to canvas
    function toCanvas(mx2, my2) {
      return {
        x: mx + mx2 * plotW,
        y: my + (1 - my2) * plotH  // flip Y: openness up
      };
    }

    // Axes
    var origin = { x: mx, y: my + plotH };
    var xEnd = { x: mx + plotW, y: my + plotH };
    var yEnd = { x: mx, y: my };

    B.drawLine(ctx, origin, xEnd, wA(P.white, 0.15), 1);
    B.drawLine(ctx, origin, yEnd, wA(P.white, 0.15), 1);

    // Axis labels
    B.drawLabel(ctx, 'capability \u2192', { x: mx + plotW / 2, y: my + plotH + 22 },
      wA(P.white, 0.4), '9px "JetBrains Mono", monospace', 'center');
    // Vertical label (draw rotated)
    ctx.save();
    ctx.translate(mx - 22, my + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = wA(P.white, 0.4);
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('openness \u2192', 0, 0);
    ctx.restore();

    // Zone labels
    B.drawLabel(ctx, 'closed / proprietary', toCanvas(0.85, 0.05),
      wA(P.white, 0.2), '8px "JetBrains Mono", monospace', 'right');
    B.drawLabel(ctx, 'open-weight', toCanvas(0.5, 0.95),
      wA(P.white, 0.2), '8px "JetBrains Mono", monospace', 'center');

    // Faint connections as Bezier curves
    for (var c = 0; c < connections.length; c++) {
      var mA = models[connections[c][0]];
      var mB = models[connections[c][1]];
      var pA = toCanvas(mA.cx, mA.cy);
      var pB = toCanvas(mB.cx, mB.cy);
      var midY = (pA.y + pB.y) / 2;
      var cp1 = { x: pA.x + (pB.x - pA.x) * 0.3, y: midY - 8 };
      var cp2 = { x: pA.x + (pB.x - pA.x) * 0.7, y: midY + 8 };
      B.drawCurve(ctx, [pA, cp1, cp2, pB], 30, wA(P.white, 0.06), 1, 0);
    }

    // Frontier curve (dashed) — shifts right over time
    var shift = t * 0.08; // slow rightward drift
    var fPts = [
      toCanvas(0.70 + shift, 0.02),
      { x: toCanvas(0.90 + shift, 0.25).x, y: toCanvas(0.90 + shift, 0.25).y },
      { x: toCanvas(0.88 + shift, 0.60).x, y: toCanvas(0.88 + shift, 0.60).y },
      toCanvas(0.72 + shift, 0.92)
    ];

    // Frontier glow
    B.drawCurve(ctx, fPts, 60, wA(P.white, 0.06), 3, 6);

    // Frontier dashed
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = wA(P.white, 0.25);
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (var i = 0; i <= 60; i++) {
      var s = i / 60;
      var pt = B.cubicPt(fPts[0], fPts[1], fPts[2], fPts[3], s);
      if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.restore();

    // Frontier label
    var frontierLabelPt = B.cubicPt(fPts[0], fPts[1], fPts[2], fPts[3], 0.15);
    B.drawLabel(ctx, 'frontier', { x: frontierLabelPt.x + 16, y: frontierLabelPt.y },
      wA(P.white, 0.35), '9px "JetBrains Mono", monospace', 'left');

    // Model dots with gentle pulsing
    for (var m = 0; m < models.length; m++) {
      var model = models[m];
      var pt = toCanvas(model.cx, model.cy);

      // Pulse: each model pulses at a slightly different phase
      var pulse = 0.7 + 0.3 * Math.sin(time * 1.5 + m * 1.2);
      var radius = 5 + pulse * 2;
      var glow = 8 + pulse * 8;

      // Outer glow
      B.drawDot(ctx, pt, radius + 3, wA(model.color, 0.12), glow);
      // Main dot
      B.drawDot(ctx, pt, radius, wA(model.color, 0.7), glow * 0.5);
      // Core
      B.drawDot(ctx, pt, 2.5, wA('#ffffff', 0.6));

      // Model name
      var labelY = pt.y - radius - 10;
      // Push label away if near edges
      var align = model.cx > 0.75 ? 'right' : (model.cx < 0.4 ? 'left' : 'center');
      var labelX = align === 'right' ? pt.x - 4 : (align === 'left' ? pt.x + 4 : pt.x);
      B.drawLabel(ctx, model.name, { x: labelX, y: labelY },
        wA(model.color, 0.8), '10px "JetBrains Mono", monospace', align);
    }

    // Title
    B.drawLabel(ctx, 'llm landscape', { x: mx + 4, y: my * 0.45 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
