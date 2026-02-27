// temperature.js — Animated temperature dial diagram
// Shows how temperature controls LLM sampling randomness
// via diverging Bezier curves

function TemperatureDiagram(canvas, container) {
  const B = Bezier;
  const { palette, withAlpha, clamp, cubicPt, lerpPt, pingPong, easeInOut } = B;

  // Number of output curves
  const NUM_CURVES = 10;

  // Duration (seconds) for one full 0 -> 2.0 -> 0 cycle
  const CYCLE_DURATION = 6;

  // Build a color gradient: teal -> blue -> purple -> coral
  // Returns a hex color string compatible with withAlpha
  function curveColor(i, n) {
    var t = i / (n - 1);
    var stops = [
      { t: 0.00, r: 78,  g: 205, b: 196 },  // teal #4ecdc4
      { t: 0.33, r: 77,  g: 150, b: 255 },  // blue #4d96ff
      { t: 0.66, r: 176, g: 122, b: 255 },  // purple #b07aff
      { t: 1.00, r: 255, g: 107, b: 107 },  // coral #ff6b6b
    ];
    // Find the two stops we sit between
    var lo = stops[0], hi = stops[stops.length - 1];
    for (var s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s].t && t <= stops[s + 1].t) {
        lo = stops[s];
        hi = stops[s + 1];
        break;
      }
    }
    var f = (hi.t === lo.t) ? 0 : (t - lo.t) / (hi.t - lo.t);
    var r = Math.round(lo.r + (hi.r - lo.r) * f);
    var g = Math.round(lo.g + (hi.g - lo.g) * f);
    var b = Math.round(lo.b + (hi.b - lo.b) * f);
    return '#' + [r, g, b].map(function(c) { return c.toString(16).padStart(2, '0'); }).join('');
  }

  // Pre-compute per-curve "personality" offsets (normalized -1 to 1 range)
  // These define how each curve deviates when temperature rises
  const curveSeeds = [];
  for (let i = 0; i < NUM_CURVES; i++) {
    // Spread evenly from -1 to 1, with slight asymmetry for visual interest
    const norm = (i / (NUM_CURVES - 1)) * 2 - 1; // -1 to 1
    // Add a subtle non-linear warp so curves aren't perfectly symmetric
    const warp = norm + 0.15 * Math.sin(norm * Math.PI * 1.3);
    curveSeeds.push({
      // Control point 1 Y-offset factor
      cp1y: warp * 0.7 + 0.1 * Math.sin(i * 2.1),
      // Control point 2 Y-offset factor
      cp2y: warp * 1.0 + 0.15 * Math.cos(i * 1.7),
      // End point Y-offset factor (curves can land at different spots at high temp)
      endy: warp * 0.5 + 0.08 * Math.sin(i * 3.2),
    });
  }

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    // Margins
    const mx = w * 0.1;
    const my = h * 0.12;
    const usableW = w - mx * 2;
    const usableH = h - my * 2;
    const centerY = h / 2;

    // Animate temperature: 0 -> 2.0 -> 0 over CYCLE_DURATION seconds
    const rawT = (time % CYCLE_DURATION) / CYCLE_DURATION;
    const pingPongT = pingPong(rawT);
    const easedT = easeInOut(pingPongT);
    const temperature = easedT * 2.0; // 0.0 to 2.0

    // The maximum Y-spread at temperature=2.0 (in pixels)
    const maxSpread = usableH * 0.45;

    // Shared start point (left side, vertically centered)
    const startPt = { x: mx, y: centerY };

    // Shared base end point (right side, vertically centered)
    const baseEndX = mx + usableW;
    const baseEndY = centerY;

    // Base control points (the "zero temperature" path — a gentle S-curve heading right)
    const baseCp1 = { x: mx + usableW * 0.33, y: centerY };
    const baseCp2 = { x: mx + usableW * 0.66, y: centerY };

    // Draw curves back-to-front (outer curves first, so inner curves are on top)
    // Sort by absolute deviation so the most central curves render last
    const indices = [];
    for (let i = 0; i < NUM_CURVES; i++) indices.push(i);
    indices.sort((a, b) => {
      const devA = Math.abs(curveSeeds[a].cp1y) + Math.abs(curveSeeds[a].cp2y);
      const devB = Math.abs(curveSeeds[b].cp1y) + Math.abs(curveSeeds[b].cp2y);
      return devB - devA; // larger deviation drawn first (behind)
    });

    for (const i of indices) {
      const seed = curveSeeds[i];
      const spread = temperature * maxSpread;

      const cp1 = {
        x: baseCp1.x,
        y: baseCp1.y + seed.cp1y * spread,
      };
      const cp2 = {
        x: baseCp2.x,
        y: baseCp2.y + seed.cp2y * spread,
      };
      const endPt = {
        x: baseEndX,
        y: baseEndY + seed.endy * spread,
      };

      const color = curveColor(i, NUM_CURVES);

      // Glow layer (wider, more transparent)
      var glowAlpha = clamp(0.15 + temperature * 0.05, 0.1, 0.3);
      B.drawCurve(
        ctx,
        [startPt, cp1, cp2, endPt],
        80,
        withAlpha(color, glowAlpha),
        4,
        12
      );

      // Main curve
      B.drawCurve(
        ctx,
        [startPt, cp1, cp2, endPt],
        80,
        withAlpha(color, clamp(0.6 + (1 - temperature / 2) * 0.35, 0.5, 0.95)),
        2,
        6
      );

      // Small endpoint dot
      var dotAlpha = clamp(0.3 + temperature * 0.2, 0.3, 0.7);
      B.drawDot(ctx, endPt, 2.5, withAlpha(color, dotAlpha));
    }

    // Bright white starting dot (on top of everything)
    B.drawDot(ctx, startPt, 5, palette.white, 15);
    B.drawDot(ctx, startPt, 3, '#ffffff', 0);

    // Temperature label (top-left)
    var tempStr = temperature.toFixed(2);
    B.drawLabel(
      ctx,
      't = ' + tempStr,
      { x: mx + 4, y: my * 0.6 },
      palette.white,
      '14px "JetBrains Mono", monospace',
      'left'
    );

    // "temperature" sub-label
    B.drawLabel(
      ctx,
      'temperature',
      { x: mx + 4, y: my * 0.6 + 18 },
      palette.textDim,
      '10px "JetBrains Mono", monospace',
      'left'
    );

    // Descriptive text based on temperature range (bottom-right)
    var desc = '';
    if (temperature < 0.15) {
      desc = 'deterministic';
    } else if (temperature < 0.6) {
      desc = 'focused';
    } else if (temperature < 1.1) {
      desc = 'balanced';
    } else if (temperature < 1.6) {
      desc = 'creative';
    } else {
      desc = 'chaotic';
    }

    B.drawLabel(
      ctx,
      desc,
      { x: w - mx - 4, y: h - my * 0.5 },
      palette.text,
      '11px "JetBrains Mono", monospace',
      'right'
    );

    // Thin horizontal baseline (the "zero temperature" path reference)
    B.drawLine(
      ctx,
      { x: mx, y: centerY },
      { x: mx + usableW, y: centerY },
      withAlpha(palette.white, 0.06),
      1,
      [2, 6]
    );
  }

  return B.animate(canvas, container, draw);
}
