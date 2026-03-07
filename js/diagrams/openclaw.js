// openclaw.js — AI OS layer: hub connecting models, tools, and interfaces
// Center hub routes data between models (top), tools (bottom), users (left), memory (right).

function OpenclawDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  var models = [
    { name: 'Claude', color: P.purple },
    { name: 'GPT', color: P.green },
    { name: 'Gemini', color: P.blue }
  ];

  var tools = [
    { name: 'Search', color: P.teal },
    { name: 'Code', color: P.green },
    { name: 'DB', color: P.blue },
    { name: 'API', color: P.yellow }
  ];

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var cx = w * 0.5;
    var cy = h * 0.5;

    // Hub pulse
    var pulse = 0.5 + 0.5 * Math.sin(time * 2);

    // === CENTER HUB: Hexagonal OS Layer ===
    var hubR = Math.min(w, h) * 0.09;
    var hubAlpha = 0.4 + pulse * 0.3;

    // Draw hexagon
    ctx.save();
    ctx.strokeStyle = wA(P.teal, hubAlpha);
    ctx.lineWidth = 2;
    ctx.shadowColor = P.teal;
    ctx.shadowBlur = 15 + pulse * 10;
    ctx.beginPath();
    for (var hi = 0; hi < 6; hi++) {
      var angle = (Math.PI / 3) * hi - Math.PI / 6;
      var hx = cx + hubR * Math.cos(angle);
      var hy = cy + hubR * Math.sin(angle);
      if (hi === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();

    // Fill hex
    ctx.fillStyle = wA(P.teal, hubAlpha * 0.08);
    ctx.fill();
    ctx.restore();

    // Outer ring
    B.drawRing(ctx, { x: cx, y: cy }, hubR + 6 + pulse * 3,
      wA(P.teal, 0.15 + pulse * 0.1), 1);

    B.drawLabel(ctx, 'OS Layer', { x: cx, y: cy },
      wA(P.teal, 0.8), 'bold 10px "JetBrains Mono", monospace', 'center');

    // === TOP: Models ===
    var modelY = h * 0.12;
    var modelSpacing = w * 0.22;
    var modelStartX = cx - (models.length - 1) * modelSpacing / 2;

    for (var mi = 0; mi < models.length; mi++) {
      var mx = modelStartX + mi * modelSpacing;
      var mPt = { x: mx, y: modelY };
      var mColor = models[mi].color;

      // Bezier from model to hub
      var mcp1 = { x: mx, y: B.lerp(modelY, cy, 0.4) };
      var mcp2 = { x: cx, y: B.lerp(modelY, cy, 0.6) };
      B.drawCurve(ctx, [mPt, mcp1, mcp2, { x: cx, y: cy - hubR }],
        40, wA(mColor, 0.2), 1.5, 4);

      // Animated data dot flowing from model to hub
      var dotPhase = (t + mi * 0.33) % 1;
      var dotT = B.easeInOut(dotPhase);
      var dataDot = B.cubicPt(mPt, mcp1, mcp2, { x: cx, y: cy - hubR }, dotT);
      B.drawDot(ctx, dataDot, 3, wA(mColor, 0.7), 10);

      // Model node
      B.drawDot(ctx, mPt, 6, wA(mColor, 0.6), 10);
      B.drawDot(ctx, mPt, 3, wA('#ffffff', 0.4));
      B.drawLabel(ctx, models[mi].name, { x: mx, y: modelY - 14 },
        wA(mColor, 0.6), '9px "JetBrains Mono", monospace', 'center');
    }

    B.drawLabel(ctx, 'Models', { x: cx, y: modelY - 28 },
      wA(P.white, 0.3), '8px "JetBrains Mono", monospace', 'center');

    // === BOTTOM: Tools ===
    var toolY = h * 0.88;
    var toolSpacing = w * 0.17;
    var toolStartX = cx - (tools.length - 1) * toolSpacing / 2;

    for (var ti = 0; ti < tools.length; ti++) {
      var tx = toolStartX + ti * toolSpacing;
      var tPt = { x: tx, y: toolY };
      var tColor = tools[ti].color;

      // Bezier from hub to tool
      var tcp1 = { x: cx, y: B.lerp(cy, toolY, 0.4) };
      var tcp2 = { x: tx, y: B.lerp(cy, toolY, 0.6) };
      B.drawCurve(ctx, [{ x: cx, y: cy + hubR }, tcp1, tcp2, tPt],
        40, wA(tColor, 0.2), 1.5, 4);

      // Data dot flowing from hub to tool
      var tDotPhase = (t + ti * 0.25 + 0.5) % 1;
      var tDotT = B.easeInOut(tDotPhase);
      var tDataDot = B.cubicPt({ x: cx, y: cy + hubR }, tcp1, tcp2, tPt, tDotT);
      B.drawDot(ctx, tDataDot, 2.5, wA(tColor, 0.7), 8);

      // Tool node
      B.drawDot(ctx, tPt, 5, wA(tColor, 0.5), 8);
      B.drawDot(ctx, tPt, 2.5, wA('#ffffff', 0.3));
      B.drawLabel(ctx, tools[ti].name, { x: tx, y: toolY + 14 },
        wA(tColor, 0.5), '8px "JetBrains Mono", monospace', 'center');
    }

    B.drawLabel(ctx, 'Tools', { x: cx, y: toolY + 28 },
      wA(P.white, 0.3), '8px "JetBrains Mono", monospace', 'center');

    // === LEFT: User/Interface ===
    var userX = w * 0.08;
    var userY = cy;
    var userPt = { x: userX, y: userY };

    // Bezier from user to hub
    var ucp1 = { x: B.lerp(userX, cx, 0.4), y: userY };
    var ucp2 = { x: B.lerp(userX, cx, 0.65), y: cy };
    B.drawCurve(ctx, [userPt, ucp1, ucp2, { x: cx - hubR, y: cy }],
      40, wA(P.coral, 0.2), 1.5, 4);

    // Data dots (bidirectional)
    var uDotPhase1 = (t + 0.15) % 1;
    var uDot1 = B.cubicPt(userPt, ucp1, ucp2, { x: cx - hubR, y: cy }, B.easeInOut(uDotPhase1));
    B.drawDot(ctx, uDot1, 3, wA(P.coral, 0.7), 10);

    var uDotPhase2 = (t + 0.65) % 1;
    var uDot2 = B.cubicPt({ x: cx - hubR, y: cy }, ucp2, ucp1, userPt, B.easeInOut(uDotPhase2));
    B.drawDot(ctx, uDot2, 2.5, wA(P.teal, 0.5), 8);

    // User node
    B.drawDot(ctx, userPt, 7, wA(P.coral, 0.5), 12);
    B.drawDot(ctx, userPt, 3.5, wA('#ffffff', 0.4));
    B.drawLabel(ctx, 'User', { x: userX, y: userY - 18 },
      wA(P.coral, 0.6), '9px "JetBrains Mono", monospace', 'center');
    B.drawLabel(ctx, 'Interface', { x: userX, y: userY + 18 },
      wA(P.coral, 0.35), '7px "JetBrains Mono", monospace', 'center');

    // === RIGHT: Memory/State ===
    var memX = w * 0.92;
    var memY = cy;
    var memPt = { x: memX, y: memY };

    // Bezier from hub to memory
    var mecp1 = { x: B.lerp(cx, memX, 0.35), y: cy };
    var mecp2 = { x: B.lerp(cx, memX, 0.65), y: memY };
    B.drawCurve(ctx, [{ x: cx + hubR, y: cy }, mecp1, mecp2, memPt],
      40, wA(P.yellow, 0.2), 1.5, 4);

    // Data dot flowing to memory
    var memDotPhase = (t + 0.4) % 1;
    var memDot = B.cubicPt({ x: cx + hubR, y: cy }, mecp1, mecp2, memPt, B.easeInOut(memDotPhase));
    B.drawDot(ctx, memDot, 2.5, wA(P.yellow, 0.6), 8);

    // Memory node
    B.drawDot(ctx, memPt, 6, wA(P.yellow, 0.5), 10);
    B.drawDot(ctx, memPt, 3, wA('#ffffff', 0.3));
    B.drawLabel(ctx, 'Memory', { x: memX, y: memY - 16 },
      wA(P.yellow, 0.6), '9px "JetBrains Mono", monospace', 'center');
    B.drawLabel(ctx, 'State', { x: memX, y: memY + 16 },
      wA(P.yellow, 0.35), '7px "JetBrains Mono", monospace', 'center');

    // === Routing pulse: hub highlights when data arrives ===
    // Flash the hub when a data dot is near it
    var hubFlash = 0;
    var flashCheck = [
      { phase: (t + 0 * 0.33) % 1 },
      { phase: (t + 1 * 0.33) % 1 },
      { phase: (t + 2 * 0.33) % 1 },
      { phase: (t + 0.5) % 1 },
      { phase: (t + 0.15) % 1 }
    ];
    for (var fc = 0; fc < flashCheck.length; fc++) {
      var fp = flashCheck[fc].phase;
      if (fp > 0.85 || fp < 0.15) {
        hubFlash = Math.max(hubFlash, 1 - Math.min(fp, 1 - fp) / 0.15);
      }
    }
    if (hubFlash > 0) {
      B.drawDot(ctx, { x: cx, y: cy }, hubR * 0.6,
        wA(P.teal, hubFlash * 0.12), hubFlash * 20);
    }

    // Title
    B.drawLabel(ctx, 'ai operating system', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
