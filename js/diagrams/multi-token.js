// multi-token.js — Standard vs multi-head token prediction comparison
// Top row: one token at a time. Bottom row: 4 tokens predicted simultaneously.

function MultiTokenDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;
  var TOKEN_COUNT = 12;
  var HEADS = 4;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var mx = w * 0.1;
    var topY = h * 0.3;
    var botY = h * 0.68;
    var tokenSpacing = (w - mx * 2) / (TOKEN_COUNT - 1);

    // === TOP ROW: Standard (one at a time) ===
    B.drawLabel(ctx, 'Standard', { x: mx - 4, y: topY - 24 },
      wA(P.green, 0.6), '10px "JetBrains Mono", monospace', 'left');

    // Standard tokens appear one at a time over 80% of cycle
    var stdProgress = t / 0.85;
    var stdTokensShown = Math.floor(stdProgress * TOKEN_COUNT);
    stdTokensShown = B.clamp(stdTokensShown, 0, TOKEN_COUNT);

    for (var i = 0; i < TOKEN_COUNT; i++) {
      var tx = mx + i * tokenSpacing;
      if (i < stdTokensShown) {
        // Fully visible token
        B.drawDot(ctx, { x: tx, y: topY }, 5, wA(P.green, 0.8), 8);
        B.drawDot(ctx, { x: tx, y: topY }, 2.5, wA('#ffffff', 0.6));
      } else if (i === stdTokensShown) {
        // Currently generating token (pulsing)
        var pulse = (stdProgress * TOKEN_COUNT) - stdTokensShown;
        var eased = B.easeOut(pulse);
        B.drawDot(ctx, { x: tx, y: topY }, 5 * eased, wA(P.green, eased * 0.7), 12 * eased);
      } else {
        // Placeholder
        B.drawDot(ctx, { x: tx, y: topY }, 2, wA(P.white, 0.08));
      }

      // Draw connection line to previous token
      if (i > 0 && i <= stdTokensShown) {
        var prevX = mx + (i - 1) * tokenSpacing;
        B.drawLine(ctx, { x: prevX + 6, y: topY }, { x: tx - 6, y: topY },
          wA(P.green, 0.2), 1);
      }
    }

    // === BOTTOM ROW: Multi-token (4 at a time) ===
    B.drawLabel(ctx, 'Multi-token', { x: mx - 4, y: botY - 40 },
      wA(P.purple, 0.6), '10px "JetBrains Mono", monospace', 'left');

    // Multi-token works in bursts of 4
    var multiProgress = t / 0.5; // finishes in half the time
    var multiBursts = Math.floor(multiProgress * (TOKEN_COUNT / HEADS));
    multiBursts = B.clamp(multiBursts, 0, TOKEN_COUNT / HEADS);
    var multiTokensShown = multiBursts * HEADS;
    var burstFrac = (multiProgress * (TOKEN_COUNT / HEADS)) - multiBursts;

    // Current burst index (which group of 4 is being predicted)
    var currentBurst = B.clamp(multiBursts, 0, (TOKEN_COUNT / HEADS) - 1);

    for (var j = 0; j < TOKEN_COUNT; j++) {
      var mx2 = mx + j * tokenSpacing;
      var burstIdx = Math.floor(j / HEADS);

      if (j < multiTokensShown) {
        // Completed tokens
        B.drawDot(ctx, { x: mx2, y: botY }, 5, wA(P.purple, 0.8), 8);
        B.drawDot(ctx, { x: mx2, y: botY }, 2.5, wA('#ffffff', 0.6));
      } else if (burstIdx === multiBursts && multiBursts < TOKEN_COUNT / HEADS) {
        // Currently predicting burst — fan out effect
        var headIdx = j % HEADS;
        var fanEased = B.easeOut(B.clamp(burstFrac, 0, 1));

        // Source point (where the burst originates)
        var srcX = mx + burstIdx * HEADS * tokenSpacing;
        if (burstIdx > 0) srcX = mx + (burstIdx * HEADS - 1) * tokenSpacing;

        // Fan out: heads spread from source like a peacock tail
        var fanAngle = (headIdx - (HEADS - 1) / 2) * 0.35;
        var fanDist = tokenSpacing * 2.5 * fanEased;
        var fanY = botY - Math.abs(fanAngle) * fanDist * 0.6 * (1 - fanEased * 0.7);

        // Intermediate fan position
        var interX = B.lerp(srcX, mx2, fanEased);
        var interY = B.lerp(botY + fanAngle * 30, botY, fanEased);

        // Draw Bezier from source to fan position
        if (fanEased > 0.05) {
          var cp1 = { x: B.lerp(srcX, interX, 0.3), y: botY + fanAngle * 20 * (1 - fanEased) };
          var cp2 = { x: B.lerp(srcX, interX, 0.7), y: interY + fanAngle * 10 * (1 - fanEased) };
          B.drawCurve(ctx, [{ x: srcX, y: botY }, cp1, cp2, { x: interX, y: interY }],
            30, wA(P.purple, fanEased * 0.4), 1.5, 6);
        }

        // The prediction head dot
        B.drawDot(ctx, { x: interX, y: interY }, 4 * fanEased,
          wA(P.purple, fanEased * 0.7), 10 * fanEased);

        // Head label
        if (fanEased > 0.3) {
          B.drawLabel(ctx, 'h' + (headIdx + 1),
            { x: interX, y: interY - 10 },
            wA(P.purple, (fanEased - 0.3) * 0.6),
            '7px "JetBrains Mono", monospace', 'center');
        }
      } else {
        // Placeholder
        B.drawDot(ctx, { x: mx2, y: botY }, 2, wA(P.white, 0.08));
      }

      // Connection lines for completed tokens
      if (j > 0 && j < multiTokensShown) {
        var prevMx = mx + (j - 1) * tokenSpacing;
        B.drawLine(ctx, { x: prevMx + 6, y: botY }, { x: mx2 - 6, y: botY },
          wA(P.purple, 0.2), 1);
      }
    }

    // === Speed labels ===
    var labelX = w - mx + 10;

    // Standard speed
    if (stdTokensShown > 0) {
      B.drawLabel(ctx, '1x', { x: labelX, y: topY },
        wA(P.green, 0.5), 'bold 12px "JetBrains Mono", monospace', 'right');
    }

    // Multi-token speed
    if (multiTokensShown > 0) {
      var speedPulse = 0.5 + 0.3 * Math.sin(time * 3);
      B.drawLabel(ctx, HEADS + 'x throughput', { x: labelX, y: botY },
        wA(P.purple, speedPulse + 0.2), 'bold 12px "JetBrains Mono", monospace', 'right');
    }

    // === Completion comparison ===
    if (t > 0.55 && multiTokensShown >= TOKEN_COUNT && stdTokensShown < TOKEN_COUNT) {
      var doneAlpha = B.clamp((t - 0.55) / 0.1, 0, 0.7);
      B.drawLabel(ctx, 'done!', { x: w * 0.5, y: botY + 28 },
        wA(P.purple, doneAlpha), 'bold 11px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, 'still generating...', { x: w * 0.5, y: topY + 28 },
        wA(P.green, doneAlpha * 0.5), '9px "JetBrains Mono", monospace', 'center');
    }

    // === Bottom explanation ===
    if (t > 0.88) {
      var expAlpha = B.clamp((t - 0.88) / 0.1, 0, 0.4);
      B.drawLabel(ctx, 'predict multiple tokens per forward pass',
        { x: w * 0.5, y: h * 0.92 },
        wA(P.white, expAlpha), '9px "JetBrains Mono", monospace', 'center');
    }

    // Title
    B.drawLabel(ctx, 'multi-token prediction', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
