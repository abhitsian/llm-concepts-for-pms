// mcp-boring.js — MCP won because it was simple: USB-C for AI tools
// Before: chaotic N×M. After: clean N+M star topology via standard protocol.

function McpBoringDiagram(canvas, container) {
  const B = Bezier;
  const P = B.palette;

  var models = ['GPT-4', 'Claude', 'Gemini', 'Llama'];
  var tools  = ['GitHub', 'Slack', 'DB', 'Search', 'Mail'];
  var CYCLE = 10;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var mx = w * 0.04, my = h * 0.10;
    var half = w * 0.48;
    var phase = (time % CYCLE) / CYCLE;
    var transition = B.easeInOut(B.clamp((phase - 0.35) * 3.3, 0, 1));
    var chaosAlpha = 1 - transition;
    var cleanAlpha = transition;

    // === LEFT SIDE: Before MCP ===
    var lCx = mx + half * 0.5;
    B.drawLabel(ctx, 'Before MCP', { x: lCx, y: my * 0.55 },
      B.withAlpha(P.coral, 0.5 + chaosAlpha * 0.4),
      'bold 12px "JetBrains Mono", monospace');

    var lModels = [], lTools = [];
    for (var i = 0; i < models.length; i++) {
      var yf = (i + 0.5) / models.length;
      lModels.push({ x: mx + half * 0.15, y: my + (h - my * 2) * (0.12 + yf * 0.76) });
    }
    for (var j = 0; j < tools.length; j++) {
      var yf2 = (j + 0.5) / tools.length;
      lTools.push({ x: mx + half * 0.85, y: my + (h - my * 2) * (0.08 + yf2 * 0.84) });
    }

    // Chaotic N×M connections
    for (var mi = 0; mi < models.length; mi++) {
      for (var ti = 0; ti < tools.length; ti++) {
        var wobble = Math.sin(time * 0.7 + mi * 2.3 + ti * 1.7) * 15;
        var wobble2 = Math.cos(time * 0.5 + mi * 1.1 + ti * 3.1) * 12;
        var cp1 = { x: B.lerp(lModels[mi].x, lTools[ti].x, 0.35),
                    y: B.lerp(lModels[mi].y, lTools[ti].y, 0.3) + wobble };
        var cp2 = { x: B.lerp(lModels[mi].x, lTools[ti].x, 0.65),
                    y: B.lerp(lModels[mi].y, lTools[ti].y, 0.7) + wobble2 };
        var cc = [P.coral, P.yellow, P.purple, P.blue][(mi + ti) % 4];
        B.drawCurve(ctx, [lModels[mi], cp1, cp2, lTools[ti]], 40,
          B.withAlpha(cc, chaosAlpha * 0.25), 1.2, 4);
      }
    }

    // Model & tool dots (left)
    for (var mi2 = 0; mi2 < models.length; mi2++) {
      B.drawDot(ctx, lModels[mi2], 5, B.withAlpha(P.blue, 0.6 + chaosAlpha * 0.3), 6);
      B.drawLabel(ctx, models[mi2], { x: lModels[mi2].x - 12, y: lModels[mi2].y + 1 },
        B.withAlpha(P.white, 0.5), '9px "JetBrains Mono", monospace', 'right');
    }
    for (var ti2 = 0; ti2 < tools.length; ti2++) {
      B.drawDot(ctx, lTools[ti2], 4, B.withAlpha(P.green, 0.5 + chaosAlpha * 0.3), 4);
      B.drawLabel(ctx, tools[ti2], { x: lTools[ti2].x + 12, y: lTools[ti2].y + 1 },
        B.withAlpha(P.white, 0.5), '9px "JetBrains Mono", monospace', 'left');
    }

    B.drawLabel(ctx, 'N×M custom integrations', { x: lCx, y: h - my * 0.9 },
      B.withAlpha(P.coral, 0.4 + chaosAlpha * 0.3),
      '9px "JetBrains Mono", monospace');

    // === Divider ===
    var divX = w * 0.5;
    B.drawLine(ctx, { x: divX, y: my }, { x: divX, y: h - my },
      B.withAlpha(P.white, 0.06), 1, [2, 6]);

    // === RIGHT SIDE: After MCP ===
    var rOff = half + mx * 2;
    var rCx = rOff + half * 0.5;
    B.drawLabel(ctx, 'After MCP', { x: rCx, y: my * 0.55 },
      B.withAlpha(P.teal, 0.5 + cleanAlpha * 0.4),
      'bold 12px "JetBrains Mono", monospace');

    // MCP hub center
    var hubX = rOff + half * 0.5, hubY = h * 0.5;
    var rModels = [], rTools = [];
    for (var i2 = 0; i2 < models.length; i2++) {
      var yf3 = (i2 + 0.5) / models.length;
      rModels.push({ x: rOff + half * 0.08, y: my + (h - my * 2) * (0.12 + yf3 * 0.76) });
    }
    for (var j2 = 0; j2 < tools.length; j2++) {
      var yf4 = (j2 + 0.5) / tools.length;
      rTools.push({ x: rOff + half * 0.92, y: my + (h - my * 2) * (0.08 + yf4 * 0.84) });
    }

    // Clean star connections
    var hub = { x: hubX, y: hubY };
    for (var mi3 = 0; mi3 < models.length; mi3++) {
      var cp = { x: B.lerp(rModels[mi3].x, hubX, 0.5), y: rModels[mi3].y };
      B.drawCurve(ctx, [rModels[mi3], cp, hub], 40,
        B.withAlpha(P.teal, cleanAlpha * 0.45), 1.5, 6);
      B.drawDot(ctx, rModels[mi3], 5, B.withAlpha(P.blue, 0.5 + cleanAlpha * 0.4), 6);
      B.drawLabel(ctx, models[mi3], { x: rModels[mi3].x - 12, y: rModels[mi3].y + 1 },
        B.withAlpha(P.white, 0.5), '9px "JetBrains Mono", monospace', 'right');
    }
    for (var ti3 = 0; ti3 < tools.length; ti3++) {
      var cp3 = { x: B.lerp(hubX, rTools[ti3].x, 0.5), y: rTools[ti3].y };
      B.drawCurve(ctx, [hub, cp3, rTools[ti3]], 40,
        B.withAlpha(P.teal, cleanAlpha * 0.45), 1.5, 6);
      B.drawDot(ctx, rTools[ti3], 4, B.withAlpha(P.green, 0.5 + cleanAlpha * 0.4), 4);
      B.drawLabel(ctx, tools[ti3], { x: rTools[ti3].x + 12, y: rTools[ti3].y + 1 },
        B.withAlpha(P.white, 0.5), '9px "JetBrains Mono", monospace', 'left');
    }

    // MCP hub node
    var pulse = 0.5 + 0.5 * Math.sin(time * 2.5);
    B.drawDot(ctx, hub, 10 + pulse * 3, B.withAlpha(P.teal, cleanAlpha * 0.7), 20);
    B.drawRing(ctx, hub, 16 + pulse * 4, B.withAlpha(P.teal, cleanAlpha * 0.3), 1.5);
    B.drawLabel(ctx, 'MCP', { x: hubX, y: hubY + 24 },
      B.withAlpha(P.teal, cleanAlpha * 0.9),
      'bold 11px "JetBrains Mono", monospace');

    B.drawLabel(ctx, 'N+M standard connections', { x: rCx, y: h - my * 0.9 },
      B.withAlpha(P.teal, 0.4 + cleanAlpha * 0.3),
      '9px "JetBrains Mono", monospace');

    // Formula bottom center
    B.drawLabel(ctx, 'complexity: O(n×m) → O(n+m)', { x: w / 2, y: h - my * 0.2 },
      B.withAlpha(P.white, 0.4), '10px "JetBrains Mono", monospace');
  }

  return B.animate(canvas, container, draw);
}
