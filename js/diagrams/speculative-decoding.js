// speculative-decoding.js — Small model racing ahead, large model verifying tokens
// Two parallel tracks: fast draft model and slow verifier working in batches

function SpeculativeDecodingDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  // Draft generates batches of 5, verifier checks them
  var BATCH_SIZE = 5;
  var NUM_BATCHES = 4;
  // Per batch: which tokens get accepted (true) or rejected (false)
  var batchResults = [
    [true, true, true, true, false],
    [true, true, true, false, false],
    [true, true, true, true, true],
    [true, true, true, true, false]
  ];

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var mx = w * 0.08;

    var topY = h * 0.30, botY = h * 0.55;
    var lx = w * 0.14, rx = w * 0.86;
    var trackW = rx - lx;

    // --- Track labels ---
    B.drawLabel(ctx, 'Draft model (small, fast)', { x: lx, y: topY - 20 },
      wA(P.green, 0.6), '9px "JetBrains Mono", monospace', 'left');
    B.drawLabel(ctx, 'Verifier (large, accurate)', { x: lx, y: botY - 20 },
      wA(P.blue, 0.6), '9px "JetBrains Mono", monospace', 'left');

    // --- Track baselines ---
    B.drawLine(ctx, { x: lx, y: topY }, { x: rx, y: topY },
      wA(P.white, 0.08), 1, [4, 6]);
    B.drawLine(ctx, { x: lx, y: botY }, { x: rx, y: botY },
      wA(P.white, 0.08), 1, [4, 6]);

    // --- Animate batches ---
    // Each batch takes 1/NUM_BATCHES of the cycle (with some overlap)
    var batchDuration = 0.85 / NUM_BATCHES;
    var tokenW = trackW / (NUM_BATCHES * BATCH_SIZE + 2);

    var acceptedTotal = 0;

    for (var b = 0; b < NUM_BATCHES; b++) {
      var batchStart = 0.05 + b * batchDuration;
      var batchT = B.clamp((t - batchStart) / batchDuration, 0, 1);
      if (batchT <= 0) continue;

      // Phase 1: Draft generates tokens quickly (0 to 0.4 of batch)
      var draftPhase = B.clamp(batchT / 0.4, 0, 1);
      // Phase 2: Verifier checks all at once (0.4 to 0.7)
      var verifyPhase = B.clamp((batchT - 0.4) / 0.3, 0, 1);
      // Phase 3: Results shown (0.7 to 1.0)
      var resultPhase = B.clamp((batchT - 0.7) / 0.3, 0, 1);

      var batchBaseX = lx + b * BATCH_SIZE * tokenW;

      for (var tk = 0; tk < BATCH_SIZE; tk++) {
        var tokenX = batchBaseX + tk * tokenW + tokenW / 2;
        var tokenDraftT = B.clamp((draftPhase - tk / BATCH_SIZE) / (1 / BATCH_SIZE), 0, 1);
        var accepted = batchResults[b][tk];

        // Draft token dot (top track)
        if (tokenDraftT > 0) {
          var draftEased = B.easeOut(tokenDraftT);
          var draftAlpha = draftEased * 0.7;
          var fromX = batchBaseX;
          var dotX = B.lerp(fromX, tokenX, draftEased);

          B.drawDot(ctx, { x: dotX, y: topY }, 4, wA(P.green, draftAlpha), 6);

          // Connection curve down to verifier track
          if (verifyPhase > 0) {
            var vAlpha = B.easeOut(verifyPhase) * 0.3;
            var cp1 = { x: tokenX, y: topY + (botY - topY) * 0.3 };
            var cp2 = { x: tokenX, y: topY + (botY - topY) * 0.7 };
            B.drawCurve(ctx, [{ x: tokenX, y: topY }, cp1, cp2, { x: tokenX, y: botY }], 20,
              wA(P.blue, vAlpha), 1, 0);
          }

          // Verification flash on verifier track
          if (verifyPhase > 0.3) {
            var flashAlpha = B.easeOut(B.clamp((verifyPhase - 0.3) / 0.5, 0, 1));
            B.drawDot(ctx, { x: tokenX, y: botY }, 4, wA(P.blue, flashAlpha * 0.5), 10 * flashAlpha);
          }

          // Result: accepted or rejected
          if (resultPhase > 0) {
            var resEased = B.easeOut(resultPhase);
            if (accepted) {
              // Turn bright green
              B.drawDot(ctx, { x: tokenX, y: topY }, 5, wA(P.green, resEased * 0.9), 10);
              B.drawDot(ctx, { x: tokenX, y: botY }, 4, wA(P.green, resEased * 0.5), 6);
              acceptedTotal++;
            } else {
              // Flash red and shrink
              var rejectAlpha = (1 - resEased) * 0.8;
              B.drawDot(ctx, { x: tokenX, y: topY }, 4 * (1 - resEased * 0.5), wA(P.coral, rejectAlpha), 8 * rejectAlpha);

              // Red X
              if (resEased > 0.3) {
                var xAlpha = B.clamp((resEased - 0.3) / 0.4, 0, 0.6);
                B.drawLabel(ctx, '\u2717', { x: tokenX, y: topY - 12 },
                  wA(P.coral, xAlpha), '8px "JetBrains Mono", monospace', 'center');
              }
            }
          }
        }
      }

      // Batch bracket on verifier track
      if (verifyPhase > 0.2) {
        var brackAlpha = B.easeOut(B.clamp((verifyPhase - 0.2) / 0.3, 0, 1)) * 0.3;
        var brackL = batchBaseX + tokenW * 0.3;
        var brackR = batchBaseX + (BATCH_SIZE - 0.7) * tokenW;
        ctx.save();
        ctx.strokeStyle = wA(P.blue, brackAlpha);
        ctx.lineWidth = 1;
        ctx.strokeRect(brackL, botY - 8, brackR - brackL, 16);
        ctx.restore();

        if (verifyPhase > 0.5) {
          B.drawLabel(ctx, 'verify', { x: (brackL + brackR) / 2, y: botY + 16 },
            wA(P.blue, brackAlpha), '7px "JetBrains Mono", monospace', 'center');
        }
      }
    }

    // --- Speed comparison ---
    if (t > 0.80) {
      var statsAlpha = B.clamp((t - 0.80) / 0.1, 0, 0.7);

      // Sequential baseline
      B.drawLabel(ctx, 'sequential:', { x: w * 0.15, y: h * 0.76 },
        wA(P.white, statsAlpha * 0.6), '10px "JetBrains Mono", monospace', 'left');
      B.drawLabel(ctx, '30 tok/s', { x: w * 0.38, y: h * 0.76 },
        wA(P.coral, statsAlpha), '11px "JetBrains Mono", monospace', 'left');

      // Speculative
      B.drawLabel(ctx, 'speculative:', { x: w * 0.15, y: h * 0.76 + 20 },
        wA(P.white, statsAlpha * 0.6), '10px "JetBrains Mono", monospace', 'left');
      B.drawLabel(ctx, '90 tok/s', { x: w * 0.38, y: h * 0.76 + 20 },
        wA(P.green, statsAlpha), '11px "JetBrains Mono", monospace', 'left');

      // Speed bar visualization
      var barY1 = h * 0.76, barY2 = h * 0.76 + 20, barH = 10;
      var barStartX = w * 0.55;
      var seqBarW = (rx - barStartX) * 0.33;
      var specBarW = (rx - barStartX) * 1.0;

      ctx.save();
      ctx.fillStyle = wA(P.coral, 0.3 * statsAlpha);
      ctx.fillRect(barStartX, barY1 - barH / 2, seqBarW, barH);
      ctx.fillStyle = wA(P.green, 0.4 * statsAlpha);
      ctx.fillRect(barStartX, barY2 - barH / 2, specBarW * B.easeOut(B.clamp((t - 0.82) / 0.1, 0, 1)), barH);
      ctx.restore();
    }

    // --- Formula ---
    if (t > 0.88) {
      var fAlpha = B.clamp((t - 0.88) / 0.08, 0, 0.5);
      B.drawLabel(ctx, 'draft many, verify once \u2192 net speedup 2\u20135x',
        { x: w / 2, y: h * 0.93 },
        wA(P.yellow, fAlpha), '9px "JetBrains Mono", monospace', 'center');
    }

    // Title
    B.drawLabel(ctx, 'speculative decoding', { x: mx + 4, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
