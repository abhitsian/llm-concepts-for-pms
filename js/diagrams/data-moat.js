// data-moat.js — Data value increasing over time
// Reddit and Stack Overflow selling data to AI model companies

function DataMoatDiagram(canvas, container) {
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
    B.drawLabel(ctx, 'data as moat', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');

    // --- Reddit node (center-left) ---
    var redditPt = { x: w * 0.25, y: h * 0.42 };
    var redditGlow = 8 + phase * 14;
    B.drawDot(ctx, redditPt, 14 + phase * 4, wA(P.coral, 0.3 + phase * 0.3), redditGlow);
    B.drawDot(ctx, redditPt, 8, wA(P.coral, 0.6 + phase * 0.2));
    B.drawLabel(ctx, 'Reddit', { x: redditPt.x, y: redditPt.y - 24 },
      wA(P.coral, 0.9), '11px "JetBrains Mono", monospace', 'center');

    // --- Stack Overflow node (center-left, below) ---
    var soPt = { x: w * 0.22, y: h * 0.68 };
    var soGlow = 6 + phase * 10;
    B.drawDot(ctx, soPt, 11 + phase * 3, wA(P.yellow, 0.25 + phase * 0.25), soGlow);
    B.drawDot(ctx, soPt, 6, wA(P.yellow, 0.5 + phase * 0.2));
    B.drawLabel(ctx, 'Stack Overflow', { x: soPt.x, y: soPt.y - 20 },
      wA(P.yellow, 0.8), '10px "JetBrains Mono", monospace', 'center');

    // --- AI model nodes (right side) ---
    var models = [
      { label: 'GPT', pt: { x: w * 0.72, y: h * 0.28 }, color: P.green },
      { label: 'Gemini', pt: { x: w * 0.78, y: h * 0.50 }, color: P.blue },
      { label: 'Claude', pt: { x: w * 0.72, y: h * 0.72 }, color: P.teal }
    ];

    for (var mi = 0; mi < models.length; mi++) {
      var m = models[mi];
      var mAlpha = B.clamp(phase * 1.5 - mi * 0.15, 0, 1);

      B.drawDot(ctx, m.pt, 10, wA(m.color, mAlpha * 0.5), mAlpha * 10);
      B.drawDot(ctx, m.pt, 5, wA(m.color, mAlpha * 0.7));
      B.drawLabel(ctx, m.label, { x: m.pt.x + 16, y: m.pt.y },
        wA(m.color, mAlpha * 0.8), '10px "JetBrains Mono", monospace', 'left');
    }

    // --- Data streams from Reddit to models ---
    for (var si = 0; si < models.length; si++) {
      var target = models[si].pt;
      var streamAlpha = B.clamp(phase * 1.2 - si * 0.1, 0, 1);
      // Stream thickness grows over time (data becoming more valuable)
      var streamWidth = 1 + phase * 3;

      // Bezier control points for curved streams
      var cp1 = { x: B.lerp(redditPt.x, target.x, 0.35), y: B.lerp(redditPt.y, target.y, 0.2) };
      var cp2 = { x: B.lerp(redditPt.x, target.x, 0.65), y: B.lerp(redditPt.y, target.y, 0.8) };

      // Glow stream
      B.drawCurve(ctx, [redditPt, cp1, cp2, target], 50,
        wA(P.coral, streamAlpha * 0.12), streamWidth + 4, streamAlpha * 8);
      // Main stream
      B.drawCurve(ctx, [redditPt, cp1, cp2, target], 50,
        wA(P.coral, streamAlpha * 0.5), streamWidth, 0);

      // Flowing particles along stream
      var particleCount = 3;
      for (var pi = 0; pi < particleCount; pi++) {
        var particleT = ((phase * 2 + pi / particleCount) % 1);
        if (streamAlpha > 0.3) {
          var pp = B.cubicPt(redditPt, cp1, cp2, target, particleT);
          B.drawDot(ctx, pp, 2, wA(P.coral, streamAlpha * 0.7), 4);
        }
      }
    }

    // --- Data streams from Stack Overflow to models ---
    for (var sj = 0; sj < models.length; sj++) {
      var target2 = models[sj].pt;
      var streamAlpha2 = B.clamp(phase * 1.1 - sj * 0.12 - 0.15, 0, 1);
      var streamWidth2 = 0.8 + phase * 2;

      var scp1 = { x: B.lerp(soPt.x, target2.x, 0.3), y: B.lerp(soPt.y, target2.y, 0.15) };
      var scp2 = { x: B.lerp(soPt.x, target2.x, 0.7), y: B.lerp(soPt.y, target2.y, 0.85) };

      B.drawCurve(ctx, [soPt, scp1, scp2, target2], 50,
        wA(P.yellow, streamAlpha2 * 0.1), streamWidth2 + 3, streamAlpha2 * 6);
      B.drawCurve(ctx, [soPt, scp1, scp2, target2], 50,
        wA(P.yellow, streamAlpha2 * 0.4), streamWidth2, 0);

      // Flowing particles
      for (var pk = 0; pk < 2; pk++) {
        var particleT2 = ((phase * 1.8 + pk / 2 + 0.3) % 1);
        if (streamAlpha2 > 0.3) {
          var pp2 = B.cubicPt(soPt, scp1, scp2, target2, particleT2);
          B.drawDot(ctx, pp2, 2, wA(P.yellow, streamAlpha2 * 0.6), 3);
        }
      }
    }

    // --- Deal value counter ---
    if (phase > 0.3) {
      var counterAlpha = B.easeOut(B.clamp((phase - 0.3) / 0.2, 0, 1));
      var dealValue = Math.floor(B.lerp(0, 203, B.clamp((phase - 0.3) / 0.5, 0, 1)));
      B.drawLabel(ctx, '$' + dealValue + 'M', { x: w * 0.48, y: h * 0.18 },
        wA(P.green, counterAlpha * 0.9), 'bold 16px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, 'Reddit-Google deal', { x: w * 0.48, y: h * 0.24 },
        wA(P.green, counterAlpha * 0.5), '9px "JetBrains Mono", monospace', 'center');
    }

    // --- "Data" label in center ---
    if (phase > 0.5) {
      var dataAlpha = B.easeOut(B.clamp((phase - 0.5) / 0.2, 0, 1));
      // Arrow showing value increasing
      B.drawLine(ctx,
        { x: w * 0.46, y: h * 0.56 },
        { x: w * 0.46, y: h * 0.38 },
        wA(P.white, dataAlpha * 0.3), 1.5);
      B.drawLabel(ctx, 'value \u2191', { x: w * 0.46, y: h * 0.60 },
        wA(P.white, dataAlpha * 0.5), '9px "JetBrains Mono", monospace', 'center');
    }

    // --- Bottom insight ---
    if (t > 0.7) {
      var insAlpha = B.easeOut(B.clamp((t - 0.7) / 0.15, 0, 1));
      B.drawLabel(ctx, 'proprietary data = the real AI moat',
        { x: w * 0.5, y: h * 0.88 },
        wA(P.white, insAlpha * 0.5), '10px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, 'thicker streams = more valuable over time',
        { x: w * 0.5, y: h * 0.94 },
        wA(P.white, insAlpha * 0.3), '8px "JetBrains Mono", monospace', 'center');
    }
  }

  return B.animate(canvas, container, draw);
}
