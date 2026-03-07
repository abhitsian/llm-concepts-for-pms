// claude-code-loop.js — Read -> Think -> Act -> Observe agentic loop
// Four nodes in a diamond with a tracer dot, tool branches from Act, subagent from Think.

function ClaudeCodeLoopDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 8;
  var LABELS = ['Think', 'Act', 'Observe', 'Read'];
  var COLORS = [P.purple, P.coral, P.teal, P.blue];
  var TOOLS = ['edit file', 'run cmd', 'search'];

  function buildGeometry(w, h) {
    var cx = w * 0.45;
    var cy = h * 0.5;
    var rx = Math.min(w, h) * 0.28;
    var ry = Math.min(w, h) * 0.28;
    var handleFrac = 0.55;

    // Nodes: top=Think, right=Act, bottom=Observe, left=Read
    var nodes = [
      { x: cx, y: cy - ry },
      { x: cx + rx, y: cy },
      { x: cx, y: cy + ry },
      { x: cx - rx, y: cy }
    ];

    var hx = rx * handleFrac;
    var hy = ry * handleFrac;

    // Cubic Bezier segments forming the loop
    var segments = [
      // Think -> Act
      [nodes[0], { x: cx + hx, y: cy - ry }, { x: cx + rx, y: cy - hy }, nodes[1]],
      // Act -> Observe
      [nodes[1], { x: cx + rx, y: cy + hy }, { x: cx + hx, y: cy + ry }, nodes[2]],
      // Observe -> Read
      [nodes[2], { x: cx - hx, y: cy + ry }, { x: cx - rx, y: cy + hy }, nodes[3]],
      // Read -> Think
      [nodes[3], { x: cx - rx, y: cy - hy }, { x: cx - hx, y: cy - ry }, nodes[0]]
    ];

    // Label positions (offset away from center)
    var labelOff = Math.min(w, h) * 0.065;
    var labelPts = [
      { x: cx, y: cy - ry - labelOff },
      { x: cx + rx + labelOff, y: cy },
      { x: cx, y: cy + ry + labelOff },
      { x: cx - rx - labelOff, y: cy }
    ];

    return { nodes: nodes, segments: segments, labelPts: labelPts, cx: cx, cy: cy };
  }

  function loopPt(segments, globalT) {
    var n = segments.length;
    var scaled = ((globalT % 1) + 1) % 1 * n;
    var segIdx = Math.floor(scaled) % n;
    var localT = scaled - Math.floor(scaled);
    var seg = segments[segIdx];
    return B.cubicPt(seg[0], seg[1], seg[2], seg[3], localT);
  }

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var geo = buildGeometry(w, h);
    var nodes = geo.nodes;
    var segments = geo.segments;
    var labelPts = geo.labelPts;

    var globalT = (time % CYCLE) / CYCLE;

    // === Draw the loop path (dimmed) ===
    for (var s = 0; s < segments.length; s++) {
      B.drawCurve(ctx, segments[s], 60, wA(P.white, 0.1), 2, 0);
    }

    // === Glowing trail ===
    var trailLen = 0.12;
    var trailSegs = 40;
    for (var tr = trailSegs; tr >= 0; tr--) {
      var frac = tr / trailSegs;
      var trailT = globalT - trailLen * frac;
      var nextT = globalT - trailLen * (Math.max(0, tr - 1) / trailSegs);
      var trAlpha = (1 - frac) * 0.6;
      var pA = loopPt(segments, trailT);
      var pB = loopPt(segments, nextT);
      if (tr > 0) {
        B.drawLine(ctx, pA, pB, wA(P.white, trAlpha), 3);
      }
    }

    // === Node dots and labels ===
    for (var ni = 0; ni < 4; ni++) {
      var nodeT = ni / 4;
      var diff = Math.abs(globalT - nodeT);
      if (diff > 0.5) diff = 1 - diff;
      var activity = Math.max(0, 1 - diff / 0.1);
      activity = B.easeInOut(activity);

      var baseAlpha = 0.3;
      var glowAlpha = baseAlpha + activity * 0.7;
      var nodeColor = wA(COLORS[ni], glowAlpha);
      var nodeRadius = 6 + activity * 5;
      var nodeGlow = activity * 20;

      B.drawDot(ctx, nodes[ni], nodeRadius, nodeColor, nodeGlow);
      B.drawDot(ctx, nodes[ni], 3, wA('#ffffff', glowAlpha * 0.5));

      // Label
      var labelAlpha = 0.4 + activity * 0.5;
      var fontSize = Math.round(10 + activity * 3);
      B.drawLabel(ctx, LABELS[ni], labelPts[ni],
        wA(COLORS[ni], labelAlpha),
        fontSize + 'px "JetBrains Mono", monospace', 'center');

      // Arrow indicators between nodes
      if (activity > 0.3) {
        var arrowSeg = segments[ni];
        var arrowPt = B.cubicPt(arrowSeg[0], arrowSeg[1], arrowSeg[2], arrowSeg[3], 0.5);
        B.drawDot(ctx, arrowPt, 2, wA(COLORS[ni], activity * 0.4), 6);
      }
    }

    // === Tracer dot ===
    var dotPos = loopPt(segments, globalT);
    B.drawDot(ctx, dotPos, 10, wA('#ffffff', 0.08), 25);
    B.drawDot(ctx, dotPos, 5, wA('#ffffff', 0.5), 15);
    B.drawDot(ctx, dotPos, 2.5, '#ffffff', 6);

    // === TOOL BRANCHES from Act node (node[1]) ===
    var actNode = nodes[1];
    var toolAreaX = actNode.x + Math.min(w, h) * 0.12;
    var toolSpacing = Math.min(w, h) * 0.13;
    var toolStartY = actNode.y - toolSpacing;

    // Determine Act node activity for branch visibility
    var actDiff = Math.abs(globalT - 0.25); // Act is at 1/4
    if (actDiff > 0.5) actDiff = 1 - actDiff;
    var actActivity = Math.max(0, 1 - actDiff / 0.15);
    var branchAlpha = 0.2 + actActivity * 0.5;

    for (var ti = 0; ti < TOOLS.length; ti++) {
      var toolPt = { x: toolAreaX + 20, y: toolStartY + ti * toolSpacing };

      // Bezier branch from Act to tool
      var bcp1 = { x: actNode.x + 15, y: actNode.y + (toolPt.y - actNode.y) * 0.2 };
      var bcp2 = { x: toolPt.x - 15, y: toolPt.y };
      B.drawCurve(ctx, [actNode, bcp1, bcp2, toolPt],
        30, wA(P.coral, branchAlpha * 0.3), 1, 3);

      // Tool dot
      B.drawDot(ctx, toolPt, 3, wA(P.coral, branchAlpha * 0.6), 5 * branchAlpha);

      // Tool label
      B.drawLabel(ctx, TOOLS[ti], { x: toolPt.x + 10, y: toolPt.y },
        wA(P.coral, branchAlpha * 0.5),
        '8px "JetBrains Mono", monospace', 'left');

      // Animated dot along branch when Act is active
      if (actActivity > 0.3) {
        var tDotPhase = (time * 0.8 + ti * 0.33) % 1;
        var tDotPt = B.cubicPt(actNode, bcp1, bcp2, toolPt, B.easeOut(tDotPhase));
        B.drawDot(ctx, tDotPt, 2, wA(P.coral, actActivity * 0.6), 6);
      }
    }

    // === SUBAGENT from Think node ===
    var thinkNode = nodes[0];
    var subCx = thinkNode.x + Math.min(w, h) * 0.18;
    var subCy = thinkNode.y - Math.min(w, h) * 0.05;
    var subR = Math.min(w, h) * 0.06;

    // Think activity
    var thinkDiff = Math.abs(globalT - 0);
    if (thinkDiff > 0.5) thinkDiff = 1 - thinkDiff;
    var thinkActivity = Math.max(0, 1 - thinkDiff / 0.15);
    var subAlpha = 0.15 + thinkActivity * 0.5;

    // Connection from Think to subagent
    var subcp1 = { x: thinkNode.x + 10, y: thinkNode.y - 10 };
    var subcp2 = { x: subCx - 10, y: subCy + 5 };
    B.drawCurve(ctx, [thinkNode, subcp1, subcp2, { x: subCx, y: subCy }],
      30, wA(P.purple, subAlpha * 0.3), 1, 3);

    // Small subagent loop (miniature circle)
    B.drawRing(ctx, { x: subCx, y: subCy }, subR,
      wA(P.purple, subAlpha * 0.3), 1);

    // Tiny tracer on subagent loop
    var subAngle = time * 3;
    var subDotX = subCx + subR * Math.cos(subAngle);
    var subDotY = subCy + subR * Math.sin(subAngle);
    B.drawDot(ctx, { x: subDotX, y: subDotY }, 2,
      wA(P.purple, subAlpha * 0.6), 6 * subAlpha);

    B.drawLabel(ctx, 'subagent', { x: subCx, y: subCy - subR - 8 },
      wA(P.purple, subAlpha * 0.5),
      '7px "JetBrains Mono", monospace', 'center');

    // Small dots around subagent loop to indicate mini Think/Act
    var miniLabels = ['T', 'A', 'O'];
    for (var ml = 0; ml < miniLabels.length; ml++) {
      var mAngle = (Math.PI * 2 / 3) * ml - Math.PI / 2;
      var mlx = subCx + subR * Math.cos(mAngle);
      var mly = subCy + subR * Math.sin(mAngle);
      B.drawDot(ctx, { x: mlx, y: mly }, 2, wA(P.purple, subAlpha * 0.4));
    }

    // Title
    B.drawLabel(ctx, 'agentic loop', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
