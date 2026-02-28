// training-inference.js — Animated split-screen: Training vs Inference
// Left: many curves converging slowly (months, $100M). Right: single fast curve.

function TrainingInferenceDiagram(canvas, container) {
  const B = Bezier;
  const P = B.palette;
  const wA = B.withAlpha;

  const CYCLE = 8;
  const NUM_TRAIN_CURVES = 8;

  // Seed random-ish positions for training data points
  var trainSeeds = [];
  for (var i = 0; i < NUM_TRAIN_CURVES; i++) {
    var angle = (i / NUM_TRAIN_CURVES) * Math.PI * 2 + 0.3;
    trainSeeds.push({
      ax: Math.cos(angle) * 0.7 + (Math.sin(i * 2.7) * 0.2),
      ay: Math.sin(angle) * 0.7 + (Math.cos(i * 3.1) * 0.2),
      delay: i * 0.06  // stagger
    });
  }

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var midX = w * 0.5;
    var cy = h * 0.5;
    var t = (time % CYCLE) / CYCLE;

    // Divider line
    B.drawLine(ctx, { x: midX, y: h * 0.1 }, { x: midX, y: h * 0.9 },
      wA(P.white, 0.08), 1, [4, 8]);

    // === LEFT SIDE: TRAINING ===
    var trainCenterX = w * 0.28;
    var trainCenterY = cy;
    var modelPt = { x: w * 0.40, y: cy };
    var trainRadius = Math.min(w * 0.22, h * 0.35);

    // Training phase: curves draw in slowly over 0-0.7 of cycle
    var trainT = B.clamp(t / 0.70, 0, 1);
    var trainEased = B.easeInOut(trainT);

    // Draw converging training curves
    for (var i = 0; i < NUM_TRAIN_CURVES; i++) {
      var seed = trainSeeds[i];
      var delayed = B.clamp((trainEased - seed.delay) / (1 - seed.delay), 0, 1);
      if (delayed <= 0) continue;

      var fromPt = {
        x: trainCenterX + seed.ax * trainRadius,
        y: trainCenterY + seed.ay * trainRadius
      };

      // Curve from scattered data point to model center
      var cp1 = {
        x: fromPt.x + (modelPt.x - fromPt.x) * 0.3,
        y: fromPt.y + (modelPt.y - fromPt.y) * 0.1 + Math.sin(i * 1.5) * 15
      };
      var cp2 = {
        x: fromPt.x + (modelPt.x - fromPt.x) * 0.7,
        y: modelPt.y + Math.cos(i * 1.8) * 10
      };

      var curveAlpha = 0.15 + delayed * 0.45;
      var pts = [fromPt, cp1, cp2, modelPt];

      // Draw partial curve
      ctx.save();
      ctx.strokeStyle = wA(P.purple, curveAlpha);
      ctx.lineWidth = 1.5;
      ctx.shadowColor = P.purple;
      ctx.shadowBlur = delayed * 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var s = 0; s <= 50; s++) {
        var st = s / 50;
        if (st > delayed) break;
        var pt = B.cubicPt(pts[0], pts[1], pts[2], pts[3], st);
        if (s === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();

      // Source dot
      B.drawDot(ctx, fromPt, 2.5, wA(P.purple, 0.3 + delayed * 0.3));
    }

    // Model node (grows as training converges)
    var modelGlow = trainEased * 20;
    var modelR = 6 + trainEased * 6;
    B.drawDot(ctx, modelPt, modelR, wA(P.purple, 0.2 + trainEased * 0.4), modelGlow);
    B.drawDot(ctx, modelPt, modelR * 0.5, wA('#ffffff', trainEased * 0.5));

    // Training labels
    B.drawLabel(ctx, 'TRAINING', { x: trainCenterX, y: h * 0.1 },
      wA(P.purple, 0.8), '12px "JetBrains Mono", monospace', 'center');

    var statsAlpha = B.clamp(trainEased * 1.2, 0, 0.6);
    B.drawLabel(ctx, '2T tokens', { x: w * 0.13, y: h * 0.22 },
      wA(P.purple, statsAlpha), '10px "JetBrains Mono", monospace', 'left');
    B.drawLabel(ctx, '$100M+', { x: w * 0.13, y: h * 0.30 },
      wA(P.coral, statsAlpha), '10px "JetBrains Mono", monospace', 'left');
    B.drawLabel(ctx, 'months', { x: w * 0.13, y: h * 0.38 },
      wA(P.white, statsAlpha * 0.7), '10px "JetBrains Mono", monospace', 'left');

    // === RIGHT SIDE: INFERENCE ===
    var infStart = { x: w * 0.58, y: cy };
    var infEnd = { x: w * 0.88, y: cy };
    var infSpan = infEnd.x - infStart.x;

    // Inference fires repeatedly: fast bursts within 0.3-1.0 of cycle
    var infRegion = B.clamp((t - 0.25) / 0.70, 0, 1);
    // Multiple quick pulses
    var pulseCount = 4;
    var pulsePhase = (infRegion * pulseCount) % 1;
    var pulseT = B.easeOut(B.clamp(pulsePhase / 0.6, 0, 1));
    var pulseVisible = infRegion > 0 && infRegion < 1;

    // Dim base curve
    var infCp1 = { x: infStart.x + infSpan * 0.35, y: cy - 2 };
    var infCp2 = { x: infStart.x + infSpan * 0.65, y: cy + 2 };
    var infPts = [infStart, infCp1, infCp2, infEnd];
    B.drawCurve(ctx, infPts, 50, wA(P.teal, 0.15), 1.5, 0);

    if (pulseVisible) {
      // Active curve
      ctx.save();
      ctx.strokeStyle = wA(P.teal, 0.8);
      ctx.lineWidth = 2.5;
      ctx.shadowColor = P.teal;
      ctx.shadowBlur = 12;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var s = 0; s <= 50; s++) {
        var st = s / 50;
        if (st > pulseT) break;
        var pt = B.cubicPt(infPts[0], infPts[1], infPts[2], infPts[3], st);
        if (s === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();

      // Travelling dot
      if (pulseT > 0 && pulseT < 1) {
        var dotPt = B.cubicPt(infPts[0], infPts[1], infPts[2], infPts[3], pulseT);
        B.drawDot(ctx, dotPt, 4, P.teal, 12);
        B.drawDot(ctx, dotPt, 2, '#ffffff', 0);
      }
    }

    // Endpoint dots
    B.drawDot(ctx, infStart, 5, wA(P.teal, 0.5), 6);
    B.drawLabel(ctx, 'prompt', { x: infStart.x, y: infStart.y - 16 },
      wA(P.teal, 0.6), '9px "JetBrains Mono", monospace', 'center');

    B.drawDot(ctx, infEnd, 5, wA(P.teal, 0.5), 6);
    B.drawLabel(ctx, 'response', { x: infEnd.x, y: infEnd.y - 16 },
      wA(P.teal, 0.6), '9px "JetBrains Mono", monospace', 'center');

    // Inference labels
    B.drawLabel(ctx, 'INFERENCE', { x: w * 0.73, y: h * 0.1 },
      wA(P.teal, 0.8), '12px "JetBrains Mono", monospace', 'center');

    B.drawLabel(ctx, '1 prompt', { x: w * 0.60, y: h * 0.22 },
      wA(P.teal, 0.6), '10px "JetBrains Mono", monospace', 'left');
    B.drawLabel(ctx, '$0.003', { x: w * 0.60, y: h * 0.30 },
      wA(P.green, 0.6), '10px "JetBrains Mono", monospace', 'left');
    B.drawLabel(ctx, '~800ms', { x: w * 0.60, y: h * 0.38 },
      wA(P.white, 0.5), '10px "JetBrains Mono", monospace', 'left');

    // Bottom comparison
    B.drawLabel(ctx, 'train once, infer millions of times',
      { x: w / 2, y: h * 0.90 },
      wA(P.white, 0.4), '10px "JetBrains Mono", monospace', 'center');

    // Title
    B.drawLabel(ctx, 'training vs inference', { x: w * 0.12 + 4, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
