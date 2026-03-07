// compaction.js — Long conversation shrinking into summary block
// Shows context window filling up, compressing into summary, then refilling

function CompactionDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 12;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var mx = w * 0.08;

    // --- Context window container ---
    var boxL = w * 0.15, boxR = w * 0.65;
    var boxT = h * 0.15, boxB = h * 0.82;
    var boxW = boxR - boxL, boxH = boxB - boxT;
    var r = 6;

    ctx.save();
    ctx.strokeStyle = wA(P.white, 0.25);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(boxL + r, boxT);
    ctx.lineTo(boxR - r, boxT); ctx.arcTo(boxR, boxT, boxR, boxT + r, r);
    ctx.lineTo(boxR, boxB - r); ctx.arcTo(boxR, boxB, boxR - r, boxB, r);
    ctx.lineTo(boxL + r, boxB); ctx.arcTo(boxL, boxB, boxL, boxB - r, r);
    ctx.lineTo(boxL, boxT + r); ctx.arcTo(boxL, boxT, boxL + r, boxT, r);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    B.drawLabel(ctx, 'context window', { x: boxL + boxW / 2, y: boxT - 10 },
      wA(P.white, 0.5), '10px "JetBrains Mono", monospace', 'center');

    // --- Animation phases ---
    // Phase 1: Fill (0 to 0.35) — messages accumulate to ~90%
    // Phase 2: Compact (0.35 to 0.50) — messages squeeze into summary
    // Phase 3: Refill (0.50 to 0.80) — new messages fill again
    // Phase 4: Compact again (0.80 to 0.95) — second compression
    // Phase 5: Hold (0.95 to 1.0)

    var maxMessages = 18;
    var lineH = (boxH - 10) / maxMessages;
    var lineGap = 3;

    // Compute fill level and summary state
    var fillLevel = 0;      // 0 to 1 of box
    var summaryVisible = 0;  // 0 or 1
    var summaryY = boxT + 10;
    var summaryH = lineH * 3;
    var messagesAboveSummary = 0;
    var newMessages = 0;
    var compactProgress = 0;
    var phase = 0;

    if (t < 0.35) {
      // Phase 1: filling
      phase = 1;
      var fillT = B.easeOut(t / 0.35);
      messagesAboveSummary = Math.floor(fillT * maxMessages);
      fillLevel = messagesAboveSummary / maxMessages;
    } else if (t < 0.50) {
      // Phase 2: compacting
      phase = 2;
      compactProgress = B.easeInOut((t - 0.35) / 0.15);
      messagesAboveSummary = maxMessages;
      fillLevel = B.lerp(0.9, 0.22, compactProgress);
      summaryVisible = compactProgress;
    } else if (t < 0.80) {
      // Phase 3: refilling after first compaction
      phase = 3;
      summaryVisible = 1;
      var refillT = B.easeOut((t - 0.50) / 0.30);
      newMessages = Math.floor(refillT * (maxMessages - 4));
      fillLevel = 0.22 + (newMessages / maxMessages) * 0.68;
    } else if (t < 0.95) {
      // Phase 4: second compaction
      phase = 4;
      compactProgress = B.easeInOut((t - 0.80) / 0.15);
      summaryVisible = 1;
      newMessages = maxMessages - 4;
      fillLevel = B.lerp(0.90, 0.22, compactProgress);
    } else {
      // Phase 5: hold
      phase = 5;
      summaryVisible = 1;
      fillLevel = 0.22;
    }

    // --- Draw messages ---
    if (phase === 1) {
      // Simple message lines filling up
      for (var i = 0; i < messagesAboveSummary; i++) {
        var my = boxT + 8 + i * lineH;
        if (my + lineH > boxB - 5) break;
        var lineW = boxW * (0.3 + 0.5 * ((i * 7 + 3) % 11) / 11);
        var msgAlpha = 0.5;
        // Latest messages are brighter
        if (i >= messagesAboveSummary - 2) {
          msgAlpha = 0.8;
        }
        ctx.save();
        ctx.fillStyle = wA(P.teal, msgAlpha);
        ctx.fillRect(boxL + 8, my, lineW, lineH - lineGap);
        ctx.restore();
      }
    } else if (phase === 2) {
      // Messages squeezing down into summary block
      for (var i = 0; i < maxMessages; i++) {
        var origY = boxT + 8 + i * lineH;
        var targetY = boxT + 10 + (summaryH / maxMessages) * i;
        var my = B.lerp(origY, targetY, compactProgress);
        var lineW = boxW * (0.3 + 0.5 * ((i * 7 + 3) % 11) / 11);
        var squeezeW = B.lerp(lineW, boxW * 0.7, compactProgress);
        var squeezeH = B.lerp(lineH - lineGap, summaryH / maxMessages - 1, compactProgress);

        ctx.save();
        ctx.fillStyle = wA(P.teal, B.lerp(0.5, 0, compactProgress));
        ctx.fillRect(boxL + 8, my, squeezeW, Math.max(squeezeH, 1));
        ctx.restore();
      }

      // Summary block fading in
      if (compactProgress > 0.4) {
        var sAlpha = B.clamp((compactProgress - 0.4) / 0.6, 0, 1);
        ctx.save();
        ctx.fillStyle = wA(P.purple, 0.3 * sAlpha);
        ctx.strokeStyle = wA(P.purple, 0.5 * sAlpha);
        ctx.lineWidth = 1.5;
        ctx.fillRect(boxL + 6, summaryY, boxW - 12, summaryH);
        ctx.strokeRect(boxL + 6, summaryY, boxW - 12, summaryH);
        ctx.restore();

        B.drawLabel(ctx, 'summary', { x: boxL + boxW / 2, y: summaryY + summaryH / 2 },
          wA(P.purple, 0.8 * sAlpha), '11px "JetBrains Mono", monospace', 'center');
      }
    } else {
      // Phases 3, 4, 5: summary block + new messages
      // Draw summary block
      ctx.save();
      ctx.fillStyle = wA(P.purple, 0.3 * summaryVisible);
      ctx.strokeStyle = wA(P.purple, 0.5 * summaryVisible);
      ctx.lineWidth = 1.5;
      ctx.shadowColor = P.purple;
      ctx.shadowBlur = 8 * summaryVisible;
      ctx.fillRect(boxL + 6, summaryY, boxW - 12, summaryH);
      ctx.strokeRect(boxL + 6, summaryY, boxW - 12, summaryH);
      ctx.restore();

      B.drawLabel(ctx, 'summary', { x: boxL + boxW / 2, y: summaryY + summaryH / 2 },
        wA(P.purple, 0.8 * summaryVisible), '11px "JetBrains Mono", monospace', 'center');

      // New messages below summary
      var startY = summaryY + summaryH + 6;
      var effectiveNew = phase === 4 ? Math.floor(B.lerp(newMessages, 0, compactProgress)) : newMessages;

      if (phase === 4) {
        // Second compaction
        for (var i = 0; i < newMessages; i++) {
          var origY = startY + i * lineH;
          var targetY = summaryY + summaryH + 6 + (summaryH / newMessages) * i;
          var my = B.lerp(origY, targetY, compactProgress);
          var lineW = boxW * (0.3 + 0.5 * ((i * 5 + 7) % 11) / 11);
          var fadeAlpha = B.lerp(0.5, 0, compactProgress);

          if (my + lineH > boxB - 5 && compactProgress < 0.5) continue;
          ctx.save();
          ctx.fillStyle = wA(P.teal, fadeAlpha);
          ctx.fillRect(boxL + 8, my, lineW, Math.max(lineH - lineGap, 1));
          ctx.restore();
        }
      } else if (phase === 5) {
        // Hold — empty after summary
      } else {
        for (var i = 0; i < newMessages; i++) {
          var my = startY + i * lineH;
          if (my + lineH > boxB - 5) break;
          var lineW = boxW * (0.3 + 0.5 * ((i * 5 + 7) % 11) / 11);
          var msgAlpha = 0.5;
          if (i >= newMessages - 2) msgAlpha = 0.8;
          ctx.save();
          ctx.fillStyle = wA(P.teal, msgAlpha);
          ctx.fillRect(boxL + 8, my, lineW, lineH - lineGap);
          ctx.restore();
        }
      }
    }

    // --- Fill level meter (right side) ---
    var meterX = boxR + 15, meterW = 10;
    ctx.save();
    ctx.strokeStyle = wA(P.white, 0.2);
    ctx.lineWidth = 1;
    ctx.strokeRect(meterX, boxT, meterW, boxH);
    ctx.restore();

    var meterColor = fillLevel > 0.85 ? P.coral : fillLevel > 0.6 ? P.yellow : P.teal;
    ctx.save();
    ctx.fillStyle = wA(meterColor, 0.5);
    ctx.fillRect(meterX, boxT + boxH * (1 - fillLevel), meterW, boxH * fillLevel);
    ctx.restore();

    B.drawLabel(ctx, Math.round(fillLevel * 100) + '%', { x: meterX + meterW / 2, y: boxB + 14 },
      wA(meterColor, 0.7), '10px "JetBrains Mono", monospace', 'center');

    // 90% danger line
    var dangerY = boxT + boxH * 0.1;
    B.drawLine(ctx, { x: meterX - 2, y: dangerY }, { x: meterX + meterW + 2, y: dangerY },
      wA(P.coral, 0.4), 1, [3, 3]);
    B.drawLabel(ctx, '90%', { x: meterX + meterW + 8, y: dangerY },
      wA(P.coral, 0.3), '7px "JetBrains Mono", monospace', 'left');

    // --- Cycle arrows / labels ---
    var infoX = w * 0.78;
    if (phase === 2 || phase === 4) {
      var cmpAlpha = 0.6;
      B.drawLabel(ctx, '\u2B07 compacting', { x: infoX, y: h * 0.40 },
        wA(P.purple, cmpAlpha), '11px "JetBrains Mono", monospace', 'left');
    } else if (phase === 1 || phase === 3) {
      B.drawLabel(ctx, '\u2B06 filling', { x: infoX, y: h * 0.40 },
        wA(P.teal, 0.5), '11px "JetBrains Mono", monospace', 'left');
    }

    // Cycle description
    B.drawLabel(ctx, 'fill \u2192 compact \u2192 fill \u2192 compact',
      { x: infoX + 10, y: h * 0.52 },
      wA(P.white, 0.3), '8px "JetBrains Mono", monospace', 'left');

    // Formula
    if (t > 0.25) {
      var fAlpha = B.clamp((t - 0.25) / 0.1, 0, 0.45);
      B.drawLabel(ctx, 'context_used = summary + recent_messages',
        { x: w / 2, y: h * 0.93 },
        wA(P.white, fAlpha), '9px "JetBrains Mono", monospace', 'center');
    }

    // Title
    B.drawLabel(ctx, 'compaction', { x: mx + 4, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
