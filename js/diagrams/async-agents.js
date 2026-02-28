// async-agents.js — Fire-and-forget agents timeline
// Human assigns, goes idle, agent works, human reviews result

function AsyncAgentsDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 12;

  var agentPhases = [
    { name: 'planning', start: 0.12, end: 0.3, color: P.blue },
    { name: 'coding', start: 0.3, end: 0.58, color: P.purple },
    { name: 'testing', start: 0.58, end: 0.75, color: P.yellow },
    { name: 'PR ready', start: 0.75, end: 0.82, color: P.green }
  ];

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var mx = w * 0.1, my = h * 0.08;
    var usableW = w - mx * 2;
    var humanY = h * 0.3, agentY = h * 0.58;

    var t = (time % CYCLE) / CYCLE;
    var progress = B.easeInOut(B.clamp(t / 0.85, 0, 1));
    var fadeT = t > 0.9 ? B.clamp((t - 0.9) / 0.1, 0, 1) : 0;
    var alpha = 1 - fadeT;

    // --- Lane labels ---
    B.drawLabel(ctx, 'HUMAN', { x: mx - 6, y: humanY },
      wA(P.teal, 0.6 * alpha), '11px "JetBrains Mono", monospace', 'right');
    B.drawLabel(ctx, 'AGENT', { x: mx - 6, y: agentY },
      wA(P.purple, 0.6 * alpha), '11px "JetBrains Mono", monospace', 'right');

    // --- Lane baselines ---
    B.drawLine(ctx, { x: mx, y: humanY }, { x: mx + usableW, y: humanY },
      wA(P.white, 0.06 * alpha), 1, [2, 6]);
    B.drawLine(ctx, { x: mx, y: agentY }, { x: mx + usableW, y: agentY },
      wA(P.white, 0.06 * alpha), 1, [2, 6]);

    // Key timeline positions (as fractions)
    var assignF = 0.08, reviewF = 0.85;
    var agentStartF = 0.12, agentEndF = 0.82;

    // --- Human lane ---
    // "Assign task" dot
    if (progress > assignF) {
      var aA = B.clamp((progress - assignF) / 0.05, 0, 1) * alpha;
      var assignPt = { x: mx + usableW * assignF, y: humanY };
      B.drawDot(ctx, assignPt, 6, wA(P.teal, aA), 12);
      B.drawLabel(ctx, 'assign task', { x: assignPt.x, y: humanY - 18 },
        wA(P.teal, aA * 0.7), '9px "JetBrains Mono", monospace', 'center');
    }

    // Idle gap (dashed line — human doing other work)
    if (progress > 0.15) {
      var idleEnd = Math.min(progress, reviewF);
      var x0 = mx + usableW * (assignF + 0.04);
      var x1 = mx + usableW * idleEnd;
      if (x1 > x0) {
        B.drawLine(ctx, { x: x0, y: humanY }, { x: x1, y: humanY },
          wA(P.teal, 0.15 * alpha), 1.5, [4, 8]);
        // "doing other work" label
        if (progress > 0.4) {
          B.drawLabel(ctx, '(doing other work)', { x: (x0 + x1) / 2, y: humanY + 16 },
            wA(P.teal, 0.25 * alpha), '8px "JetBrains Mono", monospace', 'center');
        }
      }
    }

    // "Review result" dot
    if (progress > reviewF) {
      var rA = B.clamp((progress - reviewF) / 0.08, 0, 1) * alpha;
      var reviewPt = { x: mx + usableW * reviewF, y: humanY };
      B.drawDot(ctx, reviewPt, 6, wA(P.teal, rA), 12);
      B.drawLabel(ctx, 'review result', { x: reviewPt.x, y: humanY - 18 },
        wA(P.teal, rA * 0.7), '9px "JetBrains Mono", monospace', 'center');
    }

    // --- Agent lane: flowing Bezier activity ---
    for (var p = 0; p < agentPhases.length; p++) {
      var phase = agentPhases[p];
      if (progress < phase.start) continue;
      var pProg = B.clamp((progress - phase.start) / (phase.end - phase.start), 0, 1);

      var x0 = mx + usableW * phase.start;
      var x1 = mx + usableW * phase.end;
      var xEnd = B.lerp(x0, x1, pProg);

      // Flowing curve with activity
      var curveSteps = 40;
      var maxStep = Math.ceil(curveSteps * pProg);
      ctx.save();
      ctx.shadowColor = phase.color;
      ctx.shadowBlur = 10 * alpha;
      ctx.strokeStyle = wA(phase.color, 0.7 * alpha);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (var s = 0; s <= maxStep; s++) {
        var sf = s / curveSteps;
        var sx = B.lerp(x0, x1, sf);
        var sy = agentY + Math.sin(sf * Math.PI * 3 + time * 2 + p) * 8;
        if (s === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.restore();

      // Phase label
      if (pProg > 0.3) {
        var lA = B.clamp((pProg - 0.3) / 0.3, 0, 1) * alpha;
        B.drawLabel(ctx, phase.name, { x: (x0 + xEnd) / 2, y: agentY - 18 },
          wA(phase.color, lA * 0.7), '9px "JetBrains Mono", monospace', 'center');
      }
    }

    // --- Connecting curves (assignment -> agent, agent -> review) ---
    // Assignment to agent start
    if (progress > agentStartF) {
      var cA = B.clamp((progress - assignF) / 0.08, 0, 1) * alpha;
      var from = { x: mx + usableW * assignF, y: humanY };
      var to = { x: mx + usableW * agentStartF, y: agentY };
      var cp1 = { x: from.x + 10, y: humanY + (agentY - humanY) * 0.3 };
      var cp2 = { x: to.x - 10, y: humanY + (agentY - humanY) * 0.7 };
      B.drawCurve(ctx, [from, cp1, cp2, to], 30, wA(P.white, 0.25 * cA), 1.5, 4);
      // Arrow dot at agent end
      B.drawDot(ctx, to, 3, wA(P.purple, cA), 6);
    }

    // Agent end to review
    if (progress > agentEndF) {
      var rCA = B.clamp((progress - agentEndF) / 0.08, 0, 1) * alpha;
      var from2 = { x: mx + usableW * agentEndF, y: agentY };
      var to2 = { x: mx + usableW * reviewF, y: humanY };
      var cp3 = { x: from2.x + 10, y: agentY - (agentY - humanY) * 0.3 };
      var cp4 = { x: to2.x - 10, y: agentY - (agentY - humanY) * 0.7 };
      B.drawCurve(ctx, [from2, cp3, cp4, to2], 30, wA(P.white, 0.25 * rCA), 1.5, 4);
      B.drawDot(ctx, from2, 3, wA(P.green, rCA), 6);
    }

    // --- Time labels ---
    if (progress > 0.5) {
      var tlA = B.clamp((progress - 0.5) / 0.2, 0, 1) * alpha;
      var timeLabels = [
        { text: 'human: 5 min active', x: 0.08, y: humanY + 32, c: P.teal },
        { text: 'agent: 45 min working', x: 0.47, y: agentY + 28, c: P.purple },
        { text: 'human: 10 min review', x: 0.85, y: humanY + 32, c: P.teal }
      ];
      for (var tl = 0; tl < timeLabels.length; tl++) {
        var lb = timeLabels[tl];
        if (progress > lb.x) {
          B.drawLabel(ctx, lb.text, { x: mx + usableW * lb.x, y: lb.y },
            wA(lb.c, tlA * 0.45), '8px "JetBrains Mono", monospace', 'center');
        }
      }
    }

    // --- Formula ---
    if (progress > 0.7) {
      var fA = B.clamp((progress - 0.7) / 0.15, 0, 1) * alpha;
      B.drawLabel(ctx, 'leverage = agent_work / human_active = 45/15 = 3\u00D7',
        { x: w * 0.5, y: h * 0.88 },
        wA(P.yellow, fA * 0.6), '10px "JetBrains Mono", monospace', 'center');
    }

    // --- Time arrow at bottom ---
    B.drawLine(ctx, { x: mx, y: h * 0.78 }, { x: mx + usableW * progress, y: h * 0.78 },
      wA(P.white, 0.1 * alpha), 1);
    if (progress > 0.05) {
      B.drawLabel(ctx, 'time \u2192', { x: mx + usableW * progress + 8, y: h * 0.78 },
        wA(P.white, 0.2 * alpha), '8px "JetBrains Mono", monospace', 'left');
    }

    // Title
    B.drawLabel(ctx, 'async agents', { x: mx, y: my },
      wA(P.white, 0.35 * alpha), '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
