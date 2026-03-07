// inference-costs.js — Cost per million tokens dropping dramatically over time

function InferenceCostsDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var drawT = B.easeOut(B.clamp(t / 0.7, 0, 1));

    var mx = w * 0.14;
    var my = h * 0.14;
    var gw = w - mx * 2;
    var gh = h * 0.58;
    var baseY = my + gh;

    // Axes
    B.drawLine(ctx, { x: mx, y: baseY }, { x: mx + gw, y: baseY },
      wA(P.white, 0.2), 1);
    B.drawLine(ctx, { x: mx, y: baseY }, { x: mx, y: my },
      wA(P.white, 0.2), 1);

    // Y-axis label
    B.drawLabel(ctx, '$/M tokens', { x: mx - 6, y: my - 10 },
      wA(P.white, 0.35), '8px "JetBrains Mono", monospace', 'right');

    // Y-axis tick marks
    var yTicks = [
      { label: '$60', frac: 0 },
      { label: '$45', frac: 0.25 },
      { label: '$30', frac: 0.5 },
      { label: '$15', frac: 0.75 },
      { label: '$0', frac: 1 }
    ];
    for (var yi = 0; yi < yTicks.length; yi++) {
      var yy = my + gh * yTicks[yi].frac;
      B.drawLine(ctx, { x: mx - 3, y: yy }, { x: mx, y: yy },
        wA(P.white, 0.25), 1);
      B.drawLabel(ctx, yTicks[yi].label, { x: mx - 8, y: yy },
        wA(P.white, 0.3), '8px "JetBrains Mono", monospace', 'right');
      // Horizontal gridline
      if (yi > 0 && yi < yTicks.length - 1) {
        B.drawLine(ctx, { x: mx, y: yy }, { x: mx + gw, y: yy },
          wA(P.white, 0.04), 1, [4, 8]);
      }
    }

    // X-axis: time markers
    var years = ['2023', '2024', '2025'];
    for (var xi = 0; xi < years.length; xi++) {
      var xx = mx + gw * xi / (years.length - 1);
      B.drawLine(ctx, { x: xx, y: baseY }, { x: xx, y: baseY + 4 },
        wA(P.white, 0.25), 1);
      B.drawLabel(ctx, years[xi], { x: xx, y: baseY + 16 },
        wA(P.white, 0.4), '9px "JetBrains Mono", monospace', 'center');
    }

    // The cost curve — exponential decay shape
    // $60 (top) to ~$1.10 (near bottom)
    // Using cubic Bézier for the classic decay
    var curvePts = [
      { x: mx, y: my + gh * 0.02 },             // $60 — start high
      { x: mx + gw * 0.15, y: my + gh * 0.35 }, // steep initial drop
      { x: mx + gw * 0.45, y: my + gh * 0.82 }, // flattening
      { x: mx + gw, y: my + gh * 0.98 }          // $1.10 — near bottom
    ];

    // Dim base curve
    B.drawCurve(ctx, curvePts, 80, wA(P.white, 0.05), 1, 0);

    // Animated curve draw
    var steps = 80;
    var maxStep = Math.ceil(steps * drawT);

    // Glow layer
    ctx.save();
    ctx.strokeStyle = wA(P.teal, 0.12);
    ctx.lineWidth = 6;
    ctx.shadowColor = P.teal;
    ctx.shadowBlur = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (var i = 0; i <= maxStep; i++) {
      var s = i / steps;
      var pt = B.cubicPt(curvePts[0], curvePts[1], curvePts[2], curvePts[3], s);
      if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.restore();

    // Main line
    ctx.save();
    ctx.strokeStyle = wA(P.teal, 0.8);
    ctx.lineWidth = 2.5;
    ctx.shadowColor = P.teal;
    ctx.shadowBlur = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (var i = 0; i <= maxStep; i++) {
      var s = i / steps;
      var pt = B.cubicPt(curvePts[0], curvePts[1], curvePts[2], curvePts[3], s);
      if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.restore();

    // Tracer dot
    if (drawT > 0 && drawT < 1) {
      var tracePt = B.cubicPt(curvePts[0], curvePts[1], curvePts[2], curvePts[3], drawT);
      B.drawDot(ctx, tracePt, 5, P.teal, 14);
      B.drawDot(ctx, tracePt, 2, '#ffffff');
    }

    // Key points on the curve
    var keyPoints = [
      { t: 0.0, label: '$60/M', sub: 'GPT-4 launch', color: P.coral },
      { t: 0.5, label: '$15/M', sub: 'Claude 3.5', color: P.yellow },
      { t: 1.0, label: '$1.10/M', sub: 'DeepSeek V3', color: P.green }
    ];

    for (var k = 0; k < keyPoints.length; k++) {
      var kp = keyPoints[k];
      if (drawT >= kp.t) {
        var kAlpha = B.clamp((drawT - kp.t) / 0.15, 0, 1);
        var kPt = B.cubicPt(curvePts[0], curvePts[1], curvePts[2], curvePts[3], kp.t);

        B.drawDot(ctx, kPt, 5, wA(kp.color, kAlpha * 0.7), 10);

        // Label placement — adjust to avoid overlaps
        var labelOffX, labelOffY, labelAlign;
        if (k === 0) {
          labelOffX = 12; labelOffY = -6; labelAlign = 'left';
        } else if (k === 1) {
          labelOffX = 12; labelOffY = -12; labelAlign = 'left';
        } else {
          labelOffX = -12; labelOffY = -14; labelAlign = 'right';
        }

        B.drawLabel(ctx, kp.label,
          { x: kPt.x + labelOffX, y: kPt.y + labelOffY },
          wA(kp.color, kAlpha * 0.8),
          'bold 10px "JetBrains Mono", monospace', labelAlign);
        B.drawLabel(ctx, kp.sub,
          { x: kPt.x + labelOffX, y: kPt.y + labelOffY + 13 },
          wA(kp.color, kAlpha * 0.45),
          '8px "JetBrains Mono", monospace', labelAlign);
      }
    }

    // Innovation annotations along the curve
    var innovations = [
      { t: 0.20, label: 'MoE' },
      { t: 0.38, label: 'speculative decoding' },
      { t: 0.60, label: 'quantization' },
      { t: 0.82, label: 'competition' }
    ];

    for (var n = 0; n < innovations.length; n++) {
      var inn = innovations[n];
      if (drawT >= inn.t + 0.05) {
        var innAlpha = B.clamp((drawT - inn.t - 0.05) / 0.1, 0, 1);
        var innPt = B.cubicPt(curvePts[0], curvePts[1], curvePts[2], curvePts[3], inn.t);

        // Small tick mark
        B.drawLine(ctx,
          { x: innPt.x, y: innPt.y + 4 },
          { x: innPt.x, y: innPt.y + 14 },
          wA(P.white, innAlpha * 0.2), 1);

        B.drawLabel(ctx, inn.label,
          { x: innPt.x, y: innPt.y + 22 },
          wA(P.white, innAlpha * 0.3),
          '7px "JetBrains Mono", monospace', 'center');
      }
    }

    // Formula at bottom
    if (t > 0.75) {
      var fAlpha = B.easeOut(B.clamp((t - 0.75) / 0.15, 0, 1));
      B.drawLabel(ctx, '100x drop in 2 years',
        { x: w * 0.5, y: h * 0.86 },
        wA(P.yellow, fAlpha * 0.7),
        '12px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, 'what costs $60 in 2023 costs $0.60 in 2025',
        { x: w * 0.5, y: h * 0.93 },
        wA(P.white, fAlpha * 0.35),
        '9px "JetBrains Mono", monospace', 'center');
    }

    // Title
    B.drawLabel(ctx, 'inference cost curve', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
