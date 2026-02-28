// tools-hands.js — Animated tool-use / function-calling diagram
// Central LLM node with Bezier tendrils reaching out to tool nodes.

function ToolsHandsDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 12;
  var TOOLS = [
    { name: 'search()', color: P.teal },
    { name: 'calculate()', color: P.coral },
    { name: 'db.query()', color: P.yellow },
    { name: 'send_email()', color: P.green },
    { name: 'read_file()', color: P.blue }
  ];

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var cx = w * 0.5, cy = h * 0.48;
    var radius = Math.min(w, h) * 0.32;
    var t = (time % CYCLE) / CYCLE;

    // Tool positions in a circle
    var toolPts = [];
    for (var i = 0; i < TOOLS.length; i++) {
      var angle = -Math.PI / 2 + (i / TOOLS.length) * Math.PI * 2;
      toolPts.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
    }

    // Which tool is currently active? Each gets ~1/5 of the cycle
    var perTool = 1 / TOOLS.length;
    var activeIdx = Math.floor(t / perTool);
    var localT = (t % perTool) / perTool; // 0..1 within this tool's window

    // Phases: 0-0.15 pulse LLM, 0.15-0.5 dot travels out, 0.5-0.85 dot returns, 0.85-1.0 result glow
    var pulsePh = B.clamp(localT / 0.15, 0, 1);
    var outPh = B.clamp((localT - 0.15) / 0.35, 0, 1);
    var retPh = B.clamp((localT - 0.5) / 0.35, 0, 1);
    var glowPh = B.clamp((localT - 0.85) / 0.15, 0, 1);

    // Draw dim connection curves for all tools
    for (var i = 0; i < TOOLS.length; i++) {
      var tp = toolPts[i];
      var dx = tp.x - cx, dy = tp.y - cy;
      var perpX = -dy * 0.3, perpY = dx * 0.3;
      var cp1 = { x: cx + dx * 0.3 + perpX * 0.4, y: cy + dy * 0.3 + perpY * 0.4 };
      var cp2 = { x: cx + dx * 0.7 - perpX * 0.2, y: cy + dy * 0.7 - perpY * 0.2 };
      var pts = [{ x: cx, y: cy }, cp1, cp2, tp];
      var isActive = (i === activeIdx);
      var isDone = (i < activeIdx) || (i === activeIdx && localT > 0.85);

      // Curve brightness
      var alpha = isActive ? 0.3 + outPh * 0.5 : (isDone ? 0.5 : 0.1);
      var glow = isActive ? outPh * 12 : (isDone ? 4 : 0);
      B.drawCurve(ctx, pts, 60, wA(TOOLS[i].color, alpha), isActive ? 2.5 : 1.5, glow);

      // Travelling dot (outward)
      if (isActive && outPh > 0 && outPh < 1) {
        var dotPos = B.cubicPt(pts[0], pts[1], pts[2], pts[3], B.easeInOut(outPh));
        B.drawDot(ctx, dotPos, 4, TOOLS[i].color, 14);
        B.drawDot(ctx, dotPos, 2, '#ffffff');
      }

      // Travelling dot (return)
      if (isActive && retPh > 0 && retPh < 1) {
        var retPos = B.cubicPt(pts[3], pts[2], pts[1], pts[0], B.easeInOut(retPh));
        B.drawDot(ctx, retPos, 3, wA('#ffffff', 0.8), 10);
      }

      // Tool node
      var nodeAlpha = isActive ? 0.4 + outPh * 0.6 : (isDone ? 0.7 : 0.2);
      var nodeR = isActive && outPh > 0.9 ? 7 + Math.sin(time * 8) * 2 : 5;
      B.drawDot(ctx, tp, nodeR, wA(TOOLS[i].color, nodeAlpha), isActive ? 12 : 0);

      // Tool label
      var labelAngle = -Math.PI / 2 + (i / TOOLS.length) * Math.PI * 2;
      var labelR = radius + 22;
      var labelPt = { x: cx + Math.cos(labelAngle) * labelR, y: cy + Math.sin(labelAngle) * labelR };
      B.drawLabel(ctx, TOOLS[i].name, labelPt,
        wA(TOOLS[i].color, nodeAlpha), '10px "JetBrains Mono", monospace', 'center');
    }

    // Central LLM node
    var llmPulse = pulsePh > 0 ? Math.sin(pulsePh * Math.PI) * 0.3 : 0;
    var llmR = 14 + llmPulse * 6;
    B.drawDot(ctx, { x: cx, y: cy }, llmR + 4, wA(P.purple, 0.08 + llmPulse * 0.15), 25);
    B.drawDot(ctx, { x: cx, y: cy }, llmR, wA(P.purple, 0.5 + llmPulse * 0.3), 15);
    B.drawDot(ctx, { x: cx, y: cy }, 5, wA('#ffffff', 0.7));
    B.drawLabel(ctx, 'LLM', { x: cx, y: cy - llmR - 10 },
      wA(P.purple, 0.9), '13px "JetBrains Mono", monospace', 'center');

    // Function call JSON format (shown during outward phase of active tool)
    if (outPh > 0.1 && retPh < 0.5) {
      var jsonAlpha = B.clamp(outPh * 2, 0, 0.7) * (1 - retPh * 2);
      var jsonY = h * 0.88;
      var callText = '{"name": "' + TOOLS[activeIdx].name.replace('()', '') +
        '", "args": {...}}';
      B.drawLabel(ctx, callText, { x: cx, y: jsonY },
        wA(TOOLS[activeIdx].color, jsonAlpha),
        '9px "JetBrains Mono", monospace', 'center');
    }

    // Formula at bottom
    var formulaAlpha = 0.3 + Math.sin(time * 0.5) * 0.1;
    B.drawLabel(ctx, 'capability = model + \u03A3(tools)', { x: cx, y: h * 0.95 },
      wA(P.white, formulaAlpha), '10px "JetBrains Mono", monospace', 'center');

    // Title
    B.drawLabel(ctx, 'function calling / tool use', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
