// prompt-caching.js — First request builds cache (slow), subsequent requests hit cache (fast)
// Two horizontal paths showing cold vs cached request processing

function PromptCachingDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var mx = w * 0.08;

    var topY = h * 0.32, botY = h * 0.62;
    var lx = w * 0.22, rx = w * 0.88;
    var barW = rx - lx;

    // --- System Prompt block (shared, left side) ---
    var spX = w * 0.03, spW = w * 0.15, spH = h * 0.50;
    var spY = h * 0.25;
    var spAlpha = B.clamp(t / 0.08, 0, 1);

    ctx.save();
    ctx.fillStyle = wA(P.blue, 0.12 * spAlpha);
    ctx.strokeStyle = wA(P.blue, 0.35 * spAlpha);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.fillRect(spX, spY, spW, spH);
    ctx.strokeRect(spX, spY, spW, spH);
    ctx.restore();

    B.drawLabel(ctx, 'System', { x: spX + spW / 2, y: spY + spH / 2 - 8 },
      wA(P.blue, 0.7 * spAlpha), '10px "JetBrains Mono", monospace', 'center');
    B.drawLabel(ctx, 'Prompt', { x: spX + spW / 2, y: spY + spH / 2 + 8 },
      wA(P.blue, 0.7 * spAlpha), '10px "JetBrains Mono", monospace', 'center');
    B.drawLabel(ctx, '(4K tokens)', { x: spX + spW / 2, y: spY + spH / 2 + 22 },
      wA(P.blue, 0.4 * spAlpha), '8px "JetBrains Mono", monospace', 'center');

    // --- Top path: Request 1 (cold, slow, coral) ---
    var coldStart = 0.05, coldEnd = 0.48;
    var coldT = B.clamp((t - coldStart) / (coldEnd - coldStart), 0, 1);
    var coldEased = B.easeInOut(coldT);

    // Path labels
    B.drawLabel(ctx, 'Request 1', { x: lx, y: topY - 22 },
      wA(P.coral, 0.7), '10px "JetBrains Mono", monospace', 'left');

    // Processing bar background
    ctx.save();
    ctx.fillStyle = wA(P.coral, 0.06);
    ctx.fillRect(lx, topY - 8, barW, 16);
    ctx.restore();

    // Animated processing bar (full width, slow)
    if (coldT > 0) {
      ctx.save();
      ctx.fillStyle = wA(P.coral, 0.3);
      ctx.fillRect(lx, topY - 8, barW * coldEased, 16);
      ctx.restore();

      // Tracer dot
      if (coldT < 1) {
        var coldDotX = lx + barW * coldEased;
        B.drawDot(ctx, { x: coldDotX, y: topY }, 4, P.coral, 10);
      }

      // Processing segments (to show full parsing)
      var numSegs = 8;
      for (var i = 0; i < numSegs; i++) {
        var segX = lx + (barW / numSegs) * i;
        var segAlpha = B.clamp((coldEased - i / numSegs) / (1 / numSegs), 0, 1);
        if (segAlpha > 0) {
          B.drawLine(ctx, { x: segX, y: topY - 8 }, { x: segX, y: topY + 8 },
            wA(P.coral, 0.2 * segAlpha), 1);
        }
      }
    }

    // Response dot for cold path
    if (coldT >= 1) {
      var respAlpha = B.clamp((t - coldEnd) / 0.05, 0, 1);
      B.drawDot(ctx, { x: rx, y: topY }, 6, wA(P.coral, 0.6 * respAlpha), 8);
      B.drawLabel(ctx, 'Response', { x: rx, y: topY - 18 },
        wA(P.coral, 0.6 * respAlpha), '9px "JetBrains Mono", monospace', 'center');
    }

    // Cold label
    B.drawLabel(ctx, 'cold: full processing', { x: lx + barW / 2, y: topY + 20 },
      wA(P.coral, 0.4), '8px "JetBrains Mono", monospace', 'center');

    // --- Cache build animation ---
    if (coldT >= 1 && t < 0.55) {
      var cacheAlpha = B.clamp((t - coldEnd) / 0.06, 0, 1) * (1 - B.clamp((t - 0.52) / 0.03, 0, 1));
      B.drawLabel(ctx, 'cache stored \u2713', { x: lx + barW * 0.5, y: topY + 34 },
        wA(P.green, 0.6 * cacheAlpha), '9px "JetBrains Mono", monospace', 'center');
    }

    // --- Bottom path: Request 2 (cached, fast, green) ---
    var hotStart = 0.55, hotEnd = 0.72;
    var hotT = B.clamp((t - hotStart) / (hotEnd - hotStart), 0, 1);
    var hotEased = B.easeOut(hotT);

    B.drawLabel(ctx, 'Request 2', { x: lx, y: botY - 22 },
      wA(P.green, 0.7), '10px "JetBrains Mono", monospace', 'left');

    // Processing bar background
    ctx.save();
    ctx.fillStyle = wA(P.green, 0.06);
    ctx.fillRect(lx, botY - 8, barW, 16);
    ctx.restore();

    if (hotT > 0) {
      // Cache hit section (most of the bar flashes instantly)
      var cacheHitW = barW * 0.85;
      var cacheFlash = B.clamp(hotT * 8, 0, 1);
      ctx.save();
      ctx.fillStyle = wA(P.green, 0.15 * cacheFlash);
      ctx.fillRect(lx, botY - 8, cacheHitW, 16);
      ctx.restore();

      // Cache hit symbol
      if (cacheFlash > 0.5) {
        B.drawLabel(ctx, '\u26A1 cache hit', { x: lx + cacheHitW / 2, y: botY },
          wA(P.green, 0.6 * cacheFlash), '9px "JetBrains Mono", monospace', 'center');
      }

      // Small processing section (only the new part)
      var newProcessW = barW * 0.15;
      var newT = B.clamp((hotT - 0.3) / 0.7, 0, 1);
      var newEased = B.easeOut(newT);
      ctx.save();
      ctx.fillStyle = wA(P.green, 0.4);
      ctx.fillRect(lx + cacheHitW, botY - 8, newProcessW * newEased, 16);
      ctx.restore();

      // Tracer dot
      if (hotT < 1) {
        var hotDotX = lx + cacheHitW + newProcessW * newEased;
        B.drawDot(ctx, { x: hotDotX, y: botY }, 4, P.green, 12);
      }
    }

    // Response dot for cached path
    if (hotT >= 1) {
      var hRespAlpha = B.clamp((t - hotEnd) / 0.05, 0, 1);
      B.drawDot(ctx, { x: rx, y: botY }, 6, wA(P.green, 0.7 * hRespAlpha), 10);
      B.drawLabel(ctx, 'Response', { x: rx, y: botY - 18 },
        wA(P.green, 0.7 * hRespAlpha), '9px "JetBrains Mono", monospace', 'center');
    }

    // Cached label
    B.drawLabel(ctx, 'cached: 90% cheaper', { x: lx + barW / 2, y: botY + 20 },
      wA(P.green, 0.4), '8px "JetBrains Mono", monospace', 'center');

    // --- Connection lines from system prompt to both paths ---
    var spRight = spX + spW;
    var cp1Top = { x: B.lerp(spRight, lx, 0.5), y: topY - 10 };
    var cp1Bot = { x: B.lerp(spRight, lx, 0.5), y: botY + 10 };
    B.drawCurve(ctx, [{ x: spRight, y: spY + spH * 0.3 }, cp1Top, { x: lx - 5, y: topY }], 30,
      wA(P.blue, 0.2), 1, 0);
    B.drawCurve(ctx, [{ x: spRight, y: spY + spH * 0.7 }, cp1Bot, { x: lx - 5, y: botY }], 30,
      wA(P.blue, 0.2), 1, 0);

    // --- Cost comparison ---
    if (t > 0.78) {
      var costAlpha = B.clamp((t - 0.78) / 0.1, 0, 0.8);

      B.drawLabel(ctx, '$0.03', { x: rx + 5, y: topY + 2 },
        wA(P.coral, costAlpha), '11px "JetBrains Mono", monospace', 'left');

      B.drawLabel(ctx, '$0.003', { x: rx + 5, y: botY + 2 },
        wA(P.green, costAlpha), '11px "JetBrains Mono", monospace', 'left');

      // Savings arrow
      if (costAlpha > 0.5) {
        var savAlpha = (costAlpha - 0.5) * 2;
        B.drawLabel(ctx, '10x savings', { x: w / 2, y: h * 0.85 },
          wA(P.yellow, 0.6 * savAlpha), '12px "JetBrains Mono", monospace', 'center');
      }
    }

    // --- Formula ---
    if (t > 0.85) {
      var fAlpha = B.clamp((t - 0.85) / 0.1, 0, 0.5);
      B.drawLabel(ctx, 'cache hit \u2192 skip re-processing shared prefix',
        { x: w / 2, y: h * 0.93 },
        wA(P.white, fAlpha), '9px "JetBrains Mono", monospace', 'center');
    }

    // Title
    B.drawLabel(ctx, 'prompt caching', { x: mx + 4, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
