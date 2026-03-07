// diffusion-llm.js — Autoregressive vs diffusion text generation
// Top: sequential left-to-right. Bottom: noisy dots iteratively refined to coherent text.

function DiffusionLlmDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;
  var NUM_TOKENS = 10;
  var DIFF_STEPS = 6;

  // Seeded pseudo-random for consistent noise positions
  function seededRandom(seed) {
    var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var mx = w * 0.1;
    var topY = h * 0.22;
    var botY = h * 0.62;
    var tokenSpacing = (w - mx * 2) / (NUM_TOKENS - 1);

    // Target positions (the clean row)
    var targets = [];
    for (var i = 0; i < NUM_TOKENS; i++) {
      targets.push({ x: mx + i * tokenSpacing, y: botY });
    }

    // === TOP: Autoregressive (green, sequential) ===
    B.drawLabel(ctx, 'Autoregressive', { x: mx - 4, y: topY - 24 },
      wA(P.green, 0.6), '10px "JetBrains Mono", monospace', 'left');

    // Tokens appear one at a time, each taking equal fraction
    var arProgress = B.clamp(t / 0.8, 0, 1);
    var arTokensComplete = Math.floor(arProgress * NUM_TOKENS);
    var arCurrentFrac = (arProgress * NUM_TOKENS) - arTokensComplete;

    for (var ai = 0; ai < NUM_TOKENS; ai++) {
      var ax = mx + ai * tokenSpacing;

      if (ai < arTokensComplete) {
        // Complete token
        B.drawDot(ctx, { x: ax, y: topY }, 5, wA(P.green, 0.8), 8);
        B.drawDot(ctx, { x: ax, y: topY }, 2.5, wA('#ffffff', 0.5));

        // Connection to next
        if (ai < arTokensComplete - 1 || ai < NUM_TOKENS - 1) {
          var nextAx = mx + (ai + 1) * tokenSpacing;
          if (ai < arTokensComplete - 1) {
            B.drawLine(ctx, { x: ax + 6, y: topY }, { x: nextAx - 6, y: topY },
              wA(P.green, 0.2), 1);
          }
        }
      } else if (ai === arTokensComplete && arTokensComplete < NUM_TOKENS) {
        // Currently generating
        var curEased = B.easeOut(arCurrentFrac);
        B.drawDot(ctx, { x: ax, y: topY }, 5 * curEased,
          wA(P.green, curEased * 0.6), 12 * curEased);

        // Arrow from previous
        if (ai > 0) {
          var prevAx = mx + (ai - 1) * tokenSpacing;
          var arrowLen = tokenSpacing * curEased;
          B.drawLine(ctx, { x: prevAx + 6, y: topY },
            { x: prevAx + 6 + arrowLen - 12, y: topY },
            wA(P.green, curEased * 0.3), 1.5);
        }
      } else {
        // Placeholder
        B.drawDot(ctx, { x: ax, y: topY }, 2, wA(P.white, 0.06));
      }
    }

    // Speed label for autoregressive
    B.drawLabel(ctx, 'sequential', { x: w - mx + 10, y: topY },
      wA(P.green, 0.3), '8px "JetBrains Mono", monospace', 'right');

    // === BOTTOM: Diffusion (purple, all-at-once refinement) ===
    B.drawLabel(ctx, 'Diffusion', { x: mx - 4, y: botY - 50 },
      wA(P.purple, 0.6), '10px "JetBrains Mono", monospace', 'left');

    // Diffusion runs in discrete steps, faster overall
    var diffProgress = B.clamp(t / 0.55, 0, 1); // finishes faster
    var currentStep = diffProgress * DIFF_STEPS;
    var stepInt = Math.min(Math.floor(currentStep), DIFF_STEPS - 1);
    var stepFrac = currentStep - stepInt;

    // Step counter
    var displayStep = Math.min(stepInt + 1, DIFF_STEPS);
    B.drawLabel(ctx, 'step ' + displayStep + '/' + DIFF_STEPS,
      { x: w - mx + 10, y: botY - 50 },
      wA(P.purple, 0.5), '8px "JetBrains Mono", monospace', 'right');

    // Each token has a random starting position (noise)
    for (var di = 0; di < NUM_TOKENS; di++) {
      var target = targets[di];

      // Noise offsets (consistent per token)
      var noiseX = (seededRandom(di * 7 + 1) - 0.5) * w * 0.6;
      var noiseY = (seededRandom(di * 7 + 2) - 0.5) * h * 0.25;

      // For each refinement step, lerp position closer to target
      var prevX = target.x + noiseX;
      var prevY = target.y + noiseY;
      var curX = prevX;
      var curY = prevY;
      var brightness = 0.15;

      // Apply completed steps
      for (var s = 0; s <= stepInt; s++) {
        var stepProgress = (s < stepInt) ? 1 : B.easeInOut(B.clamp(stepFrac, 0, 1));
        var stepLerp = (s + stepProgress) / DIFF_STEPS;

        // Gradually reduce noise
        var noiseFrac = 1 - stepLerp;
        curX = target.x + noiseX * noiseFrac;
        curY = target.y + noiseY * noiseFrac;
        brightness = 0.15 + stepLerp * 0.75;
      }

      // Draw the token dot
      var dotR = 3 + brightness * 3;
      var dotGlow = brightness * 10;
      B.drawDot(ctx, { x: curX, y: curY }, dotR,
        wA(P.purple, brightness), dotGlow);

      // White core appears as token stabilizes
      if (brightness > 0.5) {
        B.drawDot(ctx, { x: curX, y: curY }, 2,
          wA('#ffffff', (brightness - 0.5) * 1.2));
      }

      // Ghost trail showing previous position (during current step transition)
      if (stepFrac > 0 && stepFrac < 1 && stepInt < DIFF_STEPS) {
        var prevNoiseFrac = 1 - stepInt / DIFF_STEPS;
        var ghostX = target.x + noiseX * prevNoiseFrac;
        var ghostY = target.y + noiseY * prevNoiseFrac;
        var ghostAlpha = (1 - stepFrac) * 0.15;
        B.drawDot(ctx, { x: ghostX, y: ghostY }, 2, wA(P.purple, ghostAlpha));

        // Subtle line from ghost to current
        B.drawLine(ctx, { x: ghostX, y: ghostY }, { x: curX, y: curY },
          wA(P.purple, ghostAlpha * 0.5), 0.5);
      }
    }

    // "ALL tokens edited" indicator during diffusion steps
    if (diffProgress > 0.05 && diffProgress < 1) {
      var allAlpha = 0.2 + 0.15 * Math.sin(time * 4);
      B.drawLabel(ctx, 'all tokens refined simultaneously',
        { x: w * 0.5, y: botY + 28 },
        wA(P.purple, allAlpha), '8px "JetBrains Mono", monospace', 'center');
    }

    // === Completion race ===
    if (diffProgress >= 1 && arProgress < 1) {
      var doneAlpha = B.clamp((t - 0.55) / 0.1, 0, 0.7);
      B.drawLabel(ctx, 'done!', { x: w * 0.5, y: botY + 28 },
        wA(P.purple, doneAlpha), 'bold 11px "JetBrains Mono", monospace', 'center');

      // Draw checkmark-like indicator
      B.drawDot(ctx, { x: w * 0.5 - 28, y: botY + 28 }, 3,
        wA(P.purple, doneAlpha), 8);
    }

    // Both done comparison
    if (t > 0.85) {
      var compAlpha = B.clamp((t - 0.85) / 0.1, 0, 0.5);
      B.drawLabel(ctx, 'noise -> refine -> coherent text',
        { x: w * 0.5, y: h * 0.84 },
        wA(P.purple, compAlpha), '9px "JetBrains Mono", monospace', 'center');
      B.drawLabel(ctx, 'parallel editing can be faster than sequential writing',
        { x: w * 0.5, y: h * 0.92 },
        wA(P.white, compAlpha * 0.7), '9px "JetBrains Mono", monospace', 'center');
    }

    // Title
    B.drawLabel(ctx, 'diffusion llms', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
