// harness-shrink.js — Animated diagram: "The Harness Designed to Shrink"
// Shows model capability (teal Bézier wave) growing while
// product scaffolding / harness (coral dashed boundary) shrinks over time.

function HarnessShrinkDiagram(canvas, container) {
  var B = Bezier;
  var palette = B.palette;
  var withAlpha = B.withAlpha;
  var cubicPt = B.cubicPt;
  var lerpPt = B.lerpPt;
  var clamp = B.clamp;
  var easeInOut = B.easeInOut;
  var pingPong = B.pingPong;

  // Full animation cycle: 8 seconds, ping-ponged
  var CYCLE = 8;

  // Number of wave segments in the compound Bézier path
  var NUM_SEGMENTS = 4;

  // Resolution per segment
  var CURVE_STEPS = 60;

  // ---------- helpers -------------------------------------------------------

  // Draw a dashed rounded rectangle
  function drawDashedRect(ctx, x, y, w, h, color, lineWidth, dash, radius) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    if (dash) ctx.setLineDash(dash);
    var r = Math.min(radius || 0, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  // Build a flowing wave path as an array of cubic Bézier segments.
  // amplitude: wave height, width: total horizontal span, cx/cy: center
  // complexity: 0..1 controls how many sub-oscillations appear
  function buildWavePath(cx, cy, width, amplitude, complexity) {
    var segments = [];
    var halfW = width / 2;
    var segW = width / NUM_SEGMENTS;

    for (var i = 0; i < NUM_SEGMENTS; i++) {
      var x0 = cx - halfW + segW * i;
      var x3 = x0 + segW;
      var xMid = (x0 + x3) / 2;

      // Alternate wave direction each segment
      var dir = (i % 2 === 0) ? -1 : 1;

      // Primary amplitude
      var amp = amplitude * dir;

      // Add complexity: secondary wobble grows with complexity factor
      var wobble = amplitude * 0.3 * complexity * (i % 2 === 0 ? 1 : -1);
      var wobble2 = amplitude * 0.2 * complexity * Math.sin((i + 1) * 1.8);

      var p0 = { x: x0, y: cy };
      var p1 = { x: x0 + segW * 0.25, y: cy + amp * 0.9 + wobble };
      var p2 = { x: x0 + segW * 0.75, y: cy + amp * 1.1 + wobble2 };
      var p3 = { x: x3, y: cy };

      // For first segment, start smoothly from the left
      if (i === 0) {
        p0.y = cy;
      }
      // For last segment, end smoothly at the right
      if (i === NUM_SEGMENTS - 1) {
        p3.y = cy;
      }

      segments.push([p0, p1, p2, p3]);
    }

    return segments;
  }

  // Draw a compound Bézier path from an array of segments with glow
  function drawCompoundCurve(ctx, segments, color, width, glow) {
    ctx.save();
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = glow;
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    for (var s = 0; s < segments.length; s++) {
      var seg = segments[s];
      for (var i = 0; i <= CURVE_STEPS; i++) {
        var t = i / CURVE_STEPS;
        var pt = cubicPt(seg[0], seg[1], seg[2], seg[3], t);
        if (s === 0 && i === 0) {
          ctx.moveTo(pt.x, pt.y);
        } else {
          ctx.lineTo(pt.x, pt.y);
        }
      }
    }

    ctx.stroke();
    ctx.restore();
  }

  // Smoothly interpolate via lerp
  function smoothLerp(a, b, t) {
    return a + (b - a) * t;
  }

  // ---------- main draw -----------------------------------------------------

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var cx = w / 2;
    var cy = h / 2;
    var mx = w * 0.08;
    var my = h * 0.12;

    // Animate: 0 -> 1 -> 0 over CYCLE seconds
    var rawT = (time % CYCLE) / CYCLE;
    var pp = pingPong(rawT);
    var t = easeInOut(pp); // 0..1 smooth

    // --- Harness boundary (shrinks from large to small) ---
    // At t=0: harness is large, covering most of the canvas
    // At t=1: harness is a thin border close to the curve
    var harnessMaxPadX = w * 0.38;
    var harnessMinPadX = w * 0.06;
    var harnessMaxPadY = h * 0.36;
    var harnessMinPadY = h * 0.06;

    var harnessPadX = smoothLerp(harnessMaxPadX, harnessMinPadX, t);
    var harnessPadY = smoothLerp(harnessMaxPadY, harnessMinPadY, t);

    var harnessX = cx - harnessPadX;
    var harnessY = cy - harnessPadY;
    var harnessW = harnessPadX * 2;
    var harnessH = harnessPadY * 2;

    // Harness opacity: starts bright, dims slightly at end
    var harnessAlpha = smoothLerp(0.7, 0.3, t);
    var harnessColor = withAlpha(palette.coral, harnessAlpha);
    var harnessLineW = smoothLerp(2.5, 1.2, t);
    var dashLen = smoothLerp(10, 5, t);
    var dashGap = smoothLerp(8, 4, t);

    drawDashedRect(
      ctx, harnessX, harnessY, harnessW, harnessH,
      harnessColor, harnessLineW,
      [dashLen, dashGap],
      12
    );

    // --- "scaffolding" fill between harness and curve area ---
    // Semi-transparent fill that fades as harness shrinks
    var scaffoldAlpha = smoothLerp(0.08, 0.01, t);
    ctx.save();
    ctx.fillStyle = withAlpha(palette.coral, scaffoldAlpha);
    // Draw the harness rect as fill
    var r = 12;
    ctx.beginPath();
    ctx.moveTo(harnessX + r, harnessY);
    ctx.lineTo(harnessX + harnessW - r, harnessY);
    ctx.quadraticCurveTo(harnessX + harnessW, harnessY, harnessX + harnessW, harnessY + r);
    ctx.lineTo(harnessX + harnessW, harnessY + harnessH - r);
    ctx.quadraticCurveTo(harnessX + harnessW, harnessY + harnessH, harnessX + harnessW - r, harnessY + harnessH);
    ctx.lineTo(harnessX + r, harnessY + harnessH);
    ctx.quadraticCurveTo(harnessX, harnessY + harnessH, harnessX, harnessY + harnessH - r);
    ctx.lineTo(harnessX, harnessY + r);
    ctx.quadraticCurveTo(harnessX, harnessY, harnessX + r, harnessY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // --- Model capability curve (grows from small to large) ---
    // Wave width grows
    var minWaveW = w * 0.18;
    var maxWaveW = w * 0.72;
    var waveW = smoothLerp(minWaveW, maxWaveW, t);

    // Wave amplitude grows
    var minAmp = h * 0.04;
    var maxAmp = h * 0.28;
    var waveAmp = smoothLerp(minAmp, maxAmp, t);

    // Complexity grows
    var complexity = smoothLerp(0.0, 1.0, t);

    var waveSegments = buildWavePath(cx, cy, waveW, waveAmp, complexity);

    // Glow layer (wider, softer)
    var glowIntensity = smoothLerp(8, 20, t);
    drawCompoundCurve(
      ctx, waveSegments,
      withAlpha(palette.teal, 0.3),
      smoothLerp(4, 6, t),
      glowIntensity
    );

    // Main curve
    var curveAlpha = smoothLerp(0.7, 1.0, t);
    drawCompoundCurve(
      ctx, waveSegments,
      withAlpha(palette.teal, curveAlpha),
      smoothLerp(2, 3, t),
      smoothLerp(4, 10, t)
    );

    // Bright core line
    drawCompoundCurve(
      ctx, waveSegments,
      withAlpha('#ffffff', smoothLerp(0.1, 0.25, t)),
      1,
      0
    );

    // --- Endpoint dots on the model curve ---
    var startPt = waveSegments[0][0];
    var endPt = waveSegments[waveSegments.length - 1][3];

    B.drawDot(ctx, startPt, 4, withAlpha(palette.teal, 0.8), 10);
    B.drawDot(ctx, endPt, 4, withAlpha(palette.teal, 0.8), 10);

    // --- Animated tracer dot along the wave ---
    var tracerSpeed = 2.5; // seconds per traversal
    var tracerRaw = (time % tracerSpeed) / tracerSpeed;
    var tracerT = easeInOut(tracerRaw);

    // Map tracerT across all segments
    var totalSegs = waveSegments.length;
    var tracerScaled = tracerT * totalSegs;
    var tracerSegIdx = Math.min(Math.floor(tracerScaled), totalSegs - 1);
    var tracerLocalT = clamp(tracerScaled - tracerSegIdx, 0, 1);
    var tracerSeg = waveSegments[tracerSegIdx];
    var tracerPt = cubicPt(tracerSeg[0], tracerSeg[1], tracerSeg[2], tracerSeg[3], tracerLocalT);

    B.drawDot(ctx, tracerPt, 6, withAlpha('#ffffff', 0.15), 20);
    B.drawDot(ctx, tracerPt, 3.5, withAlpha('#ffffff', 0.6), 12);
    B.drawDot(ctx, tracerPt, 2, '#ffffff', 4);

    // --- Labels ---

    // "model" label — near the curve, offset slightly above
    var modelLabelT = 0.25; // at 25% along first segment
    var modelLabelSeg = waveSegments[0];
    var modelLabelPt = cubicPt(
      modelLabelSeg[0], modelLabelSeg[1],
      modelLabelSeg[2], modelLabelSeg[3],
      modelLabelT
    );
    var modelLabelOffset = smoothLerp(-14, -22, t);
    B.drawLabel(
      ctx, 'model',
      { x: modelLabelPt.x, y: modelLabelPt.y + modelLabelOffset },
      withAlpha(palette.teal, smoothLerp(0.6, 1.0, t)),
      '12px "JetBrains Mono", monospace',
      'center'
    );

    // "harness" label — near the top-right corner of the boundary
    var harnessLabelX = harnessX + harnessW - 8;
    var harnessLabelY = harnessY - 10;
    B.drawLabel(
      ctx, 'harness',
      { x: harnessLabelX, y: harnessLabelY },
      withAlpha(palette.coral, harnessAlpha),
      '12px "JetBrains Mono", monospace',
      'right'
    );

    // "scaffolding" label — between harness boundary and curve
    // Positioned in upper-right gap between boundary and wave
    var scaffoldLabelAlpha = smoothLerp(0.45, 0.0, t);
    if (scaffoldLabelAlpha > 0.02) {
      var scaffLabelX = harnessX + harnessW * 0.78;
      var scaffLabelY = harnessY + harnessH * 0.18;
      B.drawLabel(
        ctx, 'scaffolding',
        { x: scaffLabelX, y: scaffLabelY },
        withAlpha(palette.coral, scaffoldLabelAlpha),
        '10px "JetBrains Mono", monospace',
        'center'
      );
    }

    // --- Timeline labels at the bottom ---
    var timelineY = h - my * 0.5;
    var years = ['2023', '2024', '2025'];
    var yearPositions = [0.22, 0.50, 0.78]; // proportional x positions

    for (var yi = 0; yi < years.length; yi++) {
      var yearX = w * yearPositions[yi];

      // Highlight the year closest to current animation phase
      // t=0 -> 2023, t=0.5 -> 2024, t=1 -> 2025
      var yearPhase = yi / (years.length - 1); // 0, 0.5, 1
      var yearDist = Math.abs(t - yearPhase);
      var yearActivity = Math.max(0, 1 - yearDist / 0.35);
      yearActivity = easeInOut(yearActivity);

      var yearAlpha = 0.25 + yearActivity * 0.65;
      var yearColor = withAlpha('#ffffff', yearAlpha);
      var yearFont = yearActivity > 0.5
        ? '13px "JetBrains Mono", monospace'
        : '11px "JetBrains Mono", monospace';

      B.drawLabel(ctx, years[yi], { x: yearX, y: timelineY }, yearColor, yearFont, 'center');

      // Small dot marker above the year
      var markerY = timelineY - 14;
      var markerAlpha = 0.15 + yearActivity * 0.5;
      B.drawDot(
        ctx,
        { x: yearX, y: markerY },
        2 + yearActivity * 2,
        withAlpha(palette.teal, markerAlpha),
        yearActivity * 8
      );
    }

    // Thin timeline connector line
    B.drawLine(
      ctx,
      { x: w * yearPositions[0], y: timelineY - 14 },
      { x: w * yearPositions[2], y: timelineY - 14 },
      withAlpha(palette.white, 0.08),
      1,
      [2, 6]
    );

    // --- Title area (top-left, subtle) ---
    // Phase descriptor
    var phaseDesc = '';
    if (t < 0.25) {
      phaseDesc = 'heavy scaffolding';
    } else if (t < 0.55) {
      phaseDesc = 'balanced';
    } else if (t < 0.8) {
      phaseDesc = 'scaffolding fading';
    } else {
      phaseDesc = 'model-native';
    }

    B.drawLabel(
      ctx, phaseDesc,
      { x: mx + 4, y: my * 0.55 },
      palette.text,
      '12px "JetBrains Mono", monospace',
      'left'
    );

    B.drawLabel(
      ctx, 'harness \u2192 model',
      { x: mx + 4, y: my * 0.55 + 18 },
      palette.textDim,
      '10px "JetBrains Mono", monospace',
      'left'
    );
  }

  // ---------- start ---------------------------------------------------------
  return B.animate(canvas, container, draw);
}
