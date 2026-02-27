// permission-gradient.js — The Permission Gradient: tiered AI permissions
// Read freely, Write with approval, Execute with confirmation, Push with consent

function PermissionGradientDiagram(canvas, container) {
  const B = Bezier;
  const P = B.palette;

  // Zone colors
  const zoneColors = [P.green, P.teal, P.yellow, P.coral];
  const zoneLabels = ['READ', 'WRITE', 'EXECUTE', 'PUSH'];
  const zoneSubs = ['freely', 'with approval', 'with confirmation', 'with consent'];

  // Full cycle duration in seconds
  const CYCLE = 10;

  // Pause duration at each gate (fraction of cycle)
  const GATE_PAUSE = 0.06;

  // Number of gates (boundaries between zones)
  const NUM_GATES = 3;

  // Total pause time as fraction of cycle
  const TOTAL_PAUSE = GATE_PAUSE * NUM_GATES;

  // Travel time (remaining fraction)
  const TRAVEL = 1 - TOTAL_PAUSE;

  function draw(ctx, w, h, t) {
    B.clear(ctx, w, h);

    // --- Layout ---
    const margin = { left: 100, right: 30, top: 30, bottom: 30 };
    const zoneH = (h - margin.top - margin.bottom) / 4;
    const curveLeft = margin.left + 20;
    const curveRight = w - margin.right;
    const curveMidX = (curveLeft + curveRight) / 2;
    const curveW = curveRight - curveLeft;

    // --- Draw zone backgrounds and labels ---
    for (let i = 0; i < 4; i++) {
      const y0 = margin.top + i * zoneH;

      // Subtle tinted background
      ctx.save();
      ctx.fillStyle = B.withAlpha(zoneColors[i], 0.04);
      ctx.fillRect(0, y0, w, zoneH);
      ctx.restore();

      // Horizontal divider at zone top (except first)
      if (i > 0) {
        B.drawLine(ctx,
          { x: 0, y: y0 },
          { x: w, y: y0 },
          B.withAlpha(zoneColors[i], 0.15), 1, [6, 4]
        );
      }

      // Zone label
      B.drawLabel(ctx, zoneLabels[i],
        { x: margin.left / 2, y: y0 + zoneH * 0.4 },
        B.withAlpha(zoneColors[i], 0.9),
        'bold 13px "JetBrains Mono", monospace',
        'center'
      );

      // Sub-label
      B.drawLabel(ctx, zoneSubs[i],
        { x: margin.left / 2, y: y0 + zoneH * 0.62 },
        B.withAlpha(zoneColors[i], 0.4),
        '10px "JetBrains Mono", monospace',
        'center'
      );

      // Permission level indicator (small dots on the left margin showing restriction level)
      const lockDots = i + 1;
      for (let d = 0; d < lockDots; d++) {
        const dotX = margin.left / 2 - (lockDots - 1) * 5 + d * 10;
        const dotY = y0 + zoneH * 0.82;
        B.drawDot(ctx, { x: dotX, y: dotY }, 2.5, B.withAlpha(zoneColors[i], 0.35));
      }
    }

    // --- Define curve path per zone ---
    // Each zone has a cubic Bezier from top-center to bottom-center of that zone.
    // The "freedom" (control point spread) decreases per zone.
    function zoneCurve(zoneIdx) {
      const y0 = margin.top + zoneIdx * zoneH;
      const y1 = y0 + zoneH;

      // Amplitude decreases per zone: wide -> moderate -> tight -> nearly flat
      const amplitudes = [curveW * 0.38, curveW * 0.22, curveW * 0.10, curveW * 0.03];
      const amp = amplitudes[zoneIdx];

      // Subtle time-based sway to make the curve feel alive
      const sway = Math.sin(t * 0.5 + zoneIdx * 1.2) * amp * 0.15;

      // Start and end at center
      const p0 = { x: curveMidX, y: y0 + 2 };
      const p3 = { x: curveMidX, y: y1 - 2 };

      // Control points oscillate left-right, with decreasing amplitude
      const p1 = { x: curveMidX + amp + sway, y: y0 + zoneH * 0.33 };
      const p2 = { x: curveMidX - amp - sway, y: y0 + zoneH * 0.67 };

      return [p0, p1, p2, p3];
    }

    // --- Draw curves ---
    for (let i = 0; i < 4; i++) {
      const pts = zoneCurve(i);
      const color = zoneColors[i];

      // Glow layer
      B.drawCurve(ctx, pts, 80, B.withAlpha(color, 0.15), 6, 20);
      // Main curve
      B.drawCurve(ctx, pts, 80, B.withAlpha(color, 0.85), 2.5, 8);
    }

    // --- Gate checkpoints (at zone boundaries) ---
    const gateYs = [];
    for (let i = 1; i <= 3; i++) {
      gateYs.push(margin.top + i * zoneH);
    }

    // --- Animated dot traversal ---
    // Progress through cycle (0..1), looping
    const cycleT = (t % CYCLE) / CYCLE;

    // Map cycleT to a position along the 4-zone path, with pauses at gates.
    // Timeline: [travel zone0] [pause gate0] [travel zone1] [pause gate1] [travel zone2] [pause gate2] [travel zone3]
    // Each travel segment = TRAVEL / 4, each pause = GATE_PAUSE
    const segTravel = TRAVEL / 4;

    let dotZone = -1;       // Which zone the dot is in (0-3), or -1 if at a gate
    let dotZoneT = 0;       // Parameter within current zone (0..1)
    let gateIdx = -1;       // Which gate is active (-1 if none)
    let gateLocalT = 0;     // Parameter within gate pause (0..1)

    let elapsed = cycleT;
    for (let z = 0; z < 4; z++) {
      if (elapsed <= segTravel) {
        dotZone = z;
        dotZoneT = B.easeInOut(B.clamp(elapsed / segTravel, 0, 1));
        break;
      }
      elapsed -= segTravel;

      if (z < 3) {
        if (elapsed <= GATE_PAUSE) {
          gateIdx = z;
          gateLocalT = elapsed / GATE_PAUSE;
          break;
        }
        elapsed -= GATE_PAUSE;
      }

      if (z === 3) {
        dotZone = 3;
        dotZoneT = 1;
      }
    }

    // Compute dot position
    let dotPt = null;
    let dotColor = P.white;

    if (dotZone >= 0) {
      const pts = zoneCurve(dotZone);
      dotPt = B.cubicPt(pts[0], pts[1], pts[2], pts[3], dotZoneT);
      dotColor = zoneColors[dotZone];
    } else if (gateIdx >= 0) {
      // At a gate boundary — dot sits at the boundary point
      dotPt = { x: curveMidX, y: gateYs[gateIdx] };
      // Blend colors between zones
      const fromColor = zoneColors[gateIdx];
      const toColor = zoneColors[gateIdx + 1];
      dotColor = gateLocalT < 0.5 ? fromColor : toColor;
    }

    // --- Draw gate checkpoints ---
    for (let g = 0; g < 3; g++) {
      const gPt = { x: curveMidX, y: gateYs[g] };
      const isActive = gateIdx === g;

      // Static gate ring
      B.drawRing(ctx, gPt, 12,
        B.withAlpha(zoneColors[g + 1], isActive ? 0.6 : 0.2), 1.5);

      // Inner small dot
      B.drawDot(ctx, gPt, 3,
        B.withAlpha(zoneColors[g + 1], isActive ? 0.8 : 0.15));

      if (isActive) {
        // Pulsing gate animation — ring expands and contracts
        const pulseT = Math.sin(gateLocalT * Math.PI);
        const pulseR = 12 + pulseT * 18;
        const pulseAlpha = 0.7 * (1 - gateLocalT * 0.5);

        B.drawRing(ctx, gPt, pulseR,
          B.withAlpha(zoneColors[g + 1], pulseAlpha), 2);

        // Second ring, offset phase
        const pulse2T = Math.sin(gateLocalT * Math.PI * 2);
        const pulse2R = 12 + Math.abs(pulse2T) * 10;
        B.drawRing(ctx, gPt, pulse2R,
          B.withAlpha(zoneColors[g], pulseAlpha * 0.5), 1);

        // Gate label flash
        const flashAlpha = 0.5 + 0.5 * pulseT;
        B.drawLabel(ctx, 'GATE',
          { x: curveMidX + 30, y: gateYs[g] },
          B.withAlpha(P.white, flashAlpha * 0.6),
          '9px "JetBrains Mono", monospace',
          'left'
        );
      }
    }

    // --- Draw the traveling dot ---
    if (dotPt) {
      // Glow
      B.drawDot(ctx, dotPt, 10, B.withAlpha(dotColor, 0.2), 25);
      // Outer ring
      B.drawRing(ctx, dotPt, 8, B.withAlpha(dotColor, 0.4), 1.5);
      // Core dot
      B.drawDot(ctx, dotPt, 5, dotColor, 12);
      // Bright center
      B.drawDot(ctx, dotPt, 2, P.white);
    }

    // --- Checkpoint dots within EXECUTE zone (zone 2) ---
    // Small checkpoint markers along the execute curve
    if (true) {
      const exePts = zoneCurve(2);
      const numChecks = 5;
      for (let c = 1; c < numChecks; c++) {
        const ct = c / numChecks;
        const cp = B.cubicPt(exePts[0], exePts[1], exePts[2], exePts[3], ct);

        // Subtle checkpoint dot
        const checkAlpha = 0.2 + 0.1 * Math.sin(t * 2 + c);
        B.drawDot(ctx, cp, 2.5, B.withAlpha(P.yellow, checkAlpha));
        B.drawRing(ctx, cp, 5, B.withAlpha(P.yellow, checkAlpha * 0.5), 1);
      }
    }

    // --- Vertical "freedom" indicator lines (subtle) ---
    // Show the amplitude envelope per zone as faint vertical guidelines
    for (let i = 0; i < 4; i++) {
      const y0 = margin.top + i * zoneH;
      const yCtr = y0 + zoneH / 2;
      const amplitudes = [curveW * 0.38, curveW * 0.22, curveW * 0.10, curveW * 0.03];
      const amp = amplitudes[i];

      // Left boundary
      B.drawLine(ctx,
        { x: curveMidX - amp * 1.1, y: y0 + 8 },
        { x: curveMidX - amp * 1.1, y: y0 + zoneH - 8 },
        B.withAlpha(zoneColors[i], 0.06), 1, [2, 6]
      );
      // Right boundary
      B.drawLine(ctx,
        { x: curveMidX + amp * 1.1, y: y0 + 8 },
        { x: curveMidX + amp * 1.1, y: y0 + zoneH - 8 },
        B.withAlpha(zoneColors[i], 0.06), 1, [2, 6]
      );
    }

    // --- Trail behind the dot (fading tail) ---
    if (dotPt && dotZone >= 0) {
      const pts = zoneCurve(dotZone);
      const trailLen = 12;
      for (let i = 1; i <= trailLen; i++) {
        const trailT = dotZoneT - (i / trailLen) * 0.15;
        if (trailT < 0) break;
        const tp = B.cubicPt(pts[0], pts[1], pts[2], pts[3], trailT);
        const alpha = (1 - i / trailLen) * 0.4;
        const r = (1 - i / trailLen) * 3;
        B.drawDot(ctx, tp, r, B.withAlpha(dotColor, alpha));
      }
    }

    // --- Top and bottom border accents ---
    B.drawLine(ctx,
      { x: curveLeft, y: margin.top },
      { x: curveRight, y: margin.top },
      B.withAlpha(P.green, 0.2), 1
    );
    B.drawLine(ctx,
      { x: curveLeft, y: h - margin.bottom },
      { x: curveRight, y: h - margin.bottom },
      B.withAlpha(P.coral, 0.2), 1
    );

    // --- Arrow at bottom indicating direction of flow ---
    const arrowY = h - margin.bottom + 15;
    const arrowX = curveMidX;
    B.drawLabel(ctx, '\u25BC',
      { x: arrowX, y: margin.top - 14 },
      B.withAlpha(P.green, 0.3 + 0.15 * Math.sin(t * 2)),
      '12px sans-serif',
      'center'
    );

    // --- Title ---
    B.drawLabel(ctx, 'increasing restriction',
      { x: w - margin.right - 5, y: h / 2 },
      B.withAlpha(P.white, 0.12),
      '10px "JetBrains Mono", monospace',
      'right'
    );
  }

  return B.animate(canvas, container, draw);
}
