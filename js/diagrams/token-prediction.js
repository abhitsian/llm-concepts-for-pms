// token-prediction.js — Animated next-token prediction tree diagram
// Shows how an LLM generates text by predicting the most probable next token
// at each step, visualised as a branching tree of Bezier curves.

function TokenPredictionDiagram(canvas, container) {
  var B = Bezier;
  var palette = B.palette;
  var withAlpha = B.withAlpha;

  // ---- timing constants --------------------------------------------------
  var CYCLE = 10;            // total seconds per loop
  var PAUSE_END = 1.5;       // hold final state before restarting
  var PAUSE_START = 0.6;     // hold before first branch appears
  var FADE_DURATION = 1.0;   // how long non-chosen branches take to fade out

  // ---- tree data ---------------------------------------------------------
  // Each level: chosen token + alternatives with probabilities
  var levels = [
    {
      chosen: { token: 'model', prob: 0.62 },
      alts: [
        { token: 'cat', prob: 0.23 },
        { token: 'quick', prob: 0.15 }
      ]
    },
    {
      chosen: { token: 'predicts', prob: 0.55 },
      alts: [
        { token: 'learns', prob: 0.30 },
        { token: 'outputs', prob: 0.15 }
      ]
    },
    {
      chosen: { token: 'the', prob: 0.71 },
      alts: [
        { token: 'each', prob: 0.18 },
        { token: 'a', prob: 0.11 }
      ]
    },
    {
      chosen: { token: 'next', prob: 0.68 },
      alts: [
        { token: 'most', prob: 0.20 },
        { token: 'best', prob: 0.12 }
      ]
    }
  ];

  // Full token sequence including the starting word
  var chosenTokens = ['The'];
  for (var i = 0; i < levels.length; i++) {
    chosenTokens.push(levels[i].chosen.token);
  }

  // ---- layout helpers ----------------------------------------------------
  // Compute node positions and curve geometry relative to canvas size
  function buildLayout(w, h) {
    var mx = w * 0.08;
    var my = h * 0.15;
    var usableW = w - mx * 2;
    var usableH = h - my * 2;
    var cy = h / 2;
    var numNodes = chosenTokens.length; // 5 nodes on the chosen path
    var stepX = usableW / (numNodes - 1);

    // Chosen-path node positions (evenly spaced left to right)
    var nodes = [];
    for (var n = 0; n < numNodes; n++) {
      nodes.push({ x: mx + stepX * n, y: cy });
    }

    // For each level, compute branch curves (3 branches: chosen + 2 alts)
    // Branches are cubic Bezier curves from nodes[i] to a target endpoint
    var branchSets = [];
    for (var lvl = 0; lvl < levels.length; lvl++) {
      var from = nodes[lvl];
      var toChosen = nodes[lvl + 1];
      var branches = [];

      // The vertical spread for alternatives
      var spread = Math.min(usableH * 0.32, 80);
      // Alt branch length (shorter than chosen)
      var altLen = stepX * 0.7;

      // Chosen branch (straight-ish, gentle S-curve)
      var cp1Chosen = { x: from.x + stepX * 0.35, y: from.y };
      var cp2Chosen = { x: from.x + stepX * 0.65, y: toChosen.y };
      branches.push({
        points: [from, cp1Chosen, cp2Chosen, toChosen],
        token: levels[lvl].chosen.token,
        prob: levels[lvl].chosen.prob,
        isChosen: true,
        endPt: toChosen
      });

      // Alternative branches (curve upward and downward)
      var altOffsets = [-1, 1]; // top and bottom
      for (var a = 0; a < levels[lvl].alts.length; a++) {
        var alt = levels[lvl].alts[a];
        var dir = altOffsets[a];
        var yOff = dir * spread * (0.6 + a * 0.15);
        var endX = from.x + altLen;
        var endY = from.y + yOff;
        var cp1 = {
          x: from.x + altLen * 0.3,
          y: from.y + yOff * 0.1
        };
        var cp2 = {
          x: from.x + altLen * 0.65,
          y: from.y + yOff * 0.7
        };
        var endPt = { x: endX, y: endY };
        branches.push({
          points: [from, cp1, cp2, endPt],
          token: alt.token,
          prob: alt.prob,
          isChosen: false,
          endPt: endPt
        });
      }

      branchSets.push(branches);
    }

    return { nodes: nodes, branchSets: branchSets };
  }

  // ---- timing helpers ----------------------------------------------------
  // Animation is divided into phases:
  //   pauseStart -> level0 branch+choose -> level1 branch+choose -> ... -> pauseEnd
  // Each level has: branch-grow (0.4s), choose (0.3s), fade-alts (0.5s)

  var LEVEL_DURATION = 1.6;  // time per level
  var GROW_FRAC = 0.30;      // fraction for growing branches
  var CHOOSE_FRAC = 0.20;    // fraction for "choosing" highlight
  var FADE_FRAC = 0.50;      // fraction for fading alternatives

  function getLevelTiming(levelIdx, cycleTime) {
    var levelStart = PAUSE_START + levelIdx * LEVEL_DURATION;
    var elapsed = cycleTime - levelStart;
    if (elapsed < 0) return { phase: 'waiting', progress: 0 };

    var growEnd = LEVEL_DURATION * GROW_FRAC;
    var chooseEnd = growEnd + LEVEL_DURATION * CHOOSE_FRAC;
    var fadeEnd = chooseEnd + LEVEL_DURATION * FADE_FRAC;

    if (elapsed < growEnd) {
      return { phase: 'growing', progress: B.clamp(elapsed / growEnd, 0, 1) };
    } else if (elapsed < chooseEnd) {
      return { phase: 'choosing', progress: B.clamp((elapsed - growEnd) / (chooseEnd - growEnd), 0, 1) };
    } else if (elapsed < fadeEnd) {
      return { phase: 'fading', progress: B.clamp((elapsed - chooseEnd) / (fadeEnd - chooseEnd), 0, 1) };
    } else {
      return { phase: 'done', progress: 1 };
    }
  }

  // ---- partial curve drawing ---------------------------------------------
  // Draw a cubic Bezier curve up to parameter tMax (0..1)
  function drawPartialCurve(ctx, pts, tMax, color, width, glow) {
    if (tMax <= 0) return;
    var steps = 60;
    var maxStep = Math.ceil(steps * tMax);
    ctx.save();
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = glow;
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (var i = 0; i <= maxStep; i++) {
      var t = Math.min(i / steps, tMax);
      var pt = B.cubicPt(pts[0], pts[1], pts[2], pts[3], t);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // ---- main draw function ------------------------------------------------
  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var layout = buildLayout(w, h);
    var nodes = layout.nodes;
    var branchSets = layout.branchSets;

    // Cycle time (loops)
    var cycleTime = time % CYCLE;

    // ---- draw each level's branches ----
    for (var lvl = 0; lvl < levels.length; lvl++) {
      var timing = getLevelTiming(lvl, cycleTime);
      if (timing.phase === 'waiting') continue;

      var branches = branchSets[lvl];

      for (var b = 0; b < branches.length; b++) {
        var branch = branches[b];
        var pts = branch.points;
        var prob = branch.prob;
        var isChosen = branch.isChosen;

        // Base line width scales with probability
        var baseWidth = 1 + prob * 4;
        var altBaseWidth = 0.8 + prob * 2;

        if (timing.phase === 'growing') {
          // All branches grow together
          var growT = B.easeOut(timing.progress);
          if (isChosen) {
            // Chosen branch: teal, partial
            drawPartialCurve(ctx, pts, growT, withAlpha(palette.teal, 0.5), baseWidth, 0);
          } else {
            // Alt branch: dim gray, partial
            var altAlpha = 0.15 + prob * 0.25;
            drawPartialCurve(ctx, pts, growT, withAlpha(palette.white, altAlpha), altBaseWidth, 0);
          }

          // Token labels appear as branches reach their endpoints
          if (growT > 0.8) {
            var labelAlpha = B.clamp((growT - 0.8) / 0.2, 0, 1);
            var ep = B.cubicPt(pts[0], pts[1], pts[2], pts[3], growT);
            var labelY = branch.endPt.y + (isChosen ? -14 : (b === 1 ? -12 : 12));
            if (isChosen) {
              B.drawLabel(ctx, branch.token, { x: ep.x, y: labelY },
                withAlpha(palette.teal, labelAlpha * 0.7),
                '10px "JetBrains Mono", monospace', 'center');
            } else {
              B.drawLabel(ctx, branch.token, { x: branch.endPt.x, y: labelY },
                withAlpha(palette.white, labelAlpha * 0.3),
                '9px "JetBrains Mono", monospace', 'center');
            }
          }

        } else if (timing.phase === 'choosing') {
          // All branches fully drawn; chosen one lights up
          var chooseT = B.easeInOut(timing.progress);

          if (isChosen) {
            // Glow layer builds up
            drawPartialCurve(ctx, pts, 1, withAlpha(palette.teal, 0.15 + chooseT * 0.2), baseWidth + 4, 15 * chooseT);
            // Main bright curve
            drawPartialCurve(ctx, pts, 1, withAlpha(palette.teal, 0.5 + chooseT * 0.45), baseWidth + chooseT * 1.5, 8 * chooseT);
          } else {
            var altAlpha = 0.15 + prob * 0.25;
            drawPartialCurve(ctx, pts, 1, withAlpha(palette.white, altAlpha), altBaseWidth, 0);
          }

          // Show construction lines on chosen branch during choosing phase
          if (isChosen && chooseT > 0.1 && chooseT < 0.9) {
            var constructT = 0.3 + chooseT * 0.4;
            var cAlpha = Math.sin(chooseT * Math.PI) * 0.6;
            var dc = B.deCasteljau(pts[0], pts[1], pts[2], pts[3], constructT);
            var dimC = withAlpha(palette.teal, cAlpha * 0.3);
            var midC = withAlpha(palette.teal, cAlpha * 0.5);
            B.drawLine(ctx, dc.l1[0], dc.l1[1], dimC, 1, [3, 3]);
            B.drawLine(ctx, dc.l1[1], dc.l1[2], dimC, 1, [3, 3]);
            B.drawLine(ctx, dc.l2[0], dc.l2[1], midC, 1, [3, 3]);
            dc.l1.forEach(function(p) { B.drawDot(ctx, p, 2, dimC); });
            dc.l2.forEach(function(p) { B.drawDot(ctx, p, 2, midC); });
            B.drawDot(ctx, dc.pt, 3.5, withAlpha(palette.teal, cAlpha), 8 * cAlpha);
          }

          // All labels visible
          for (var lb = 0; lb < branches.length; lb++) {
            var br = branches[lb];
            var ly = br.endPt.y + (br.isChosen ? -14 : (lb === 1 ? -12 : 12));
            if (br.isChosen) {
              var brightT = 0.7 + chooseT * 0.3;
              B.drawLabel(ctx, br.token, { x: br.endPt.x, y: ly },
                withAlpha(palette.teal, brightT),
                '11px "JetBrains Mono", monospace', 'center');
            } else {
              B.drawLabel(ctx, br.token, { x: br.endPt.x, y: ly },
                withAlpha(palette.white, 0.3),
                '9px "JetBrains Mono", monospace', 'center');
            }
          }

          // Probability labels during choosing
          if (chooseT > 0.2) {
            var probAlpha = B.clamp((chooseT - 0.2) / 0.4, 0, 1) * 0.5;
            for (var pb = 0; pb < branches.length; pb++) {
              var pbr = branches[pb];
              var midPt = B.cubicPt(pbr.points[0], pbr.points[1], pbr.points[2], pbr.points[3], 0.5);
              var probY = midPt.y + (pbr.isChosen ? 12 : (pb === 1 ? 10 : -10));
              var probColor = pbr.isChosen ? withAlpha(palette.teal, probAlpha) : withAlpha(palette.white, probAlpha * 0.6);
              B.drawLabel(ctx, (pbr.prob * 100).toFixed(0) + '%', { x: midPt.x, y: probY },
                probColor, '8px "JetBrains Mono", monospace', 'center');
            }
          }

        } else {
          // fading or done
          var fadeT = timing.phase === 'fading' ? B.easeInOut(timing.progress) : 1;

          if (isChosen) {
            // Chosen stays bright
            drawPartialCurve(ctx, pts, 1, withAlpha(palette.teal, 0.15), baseWidth + 4, 15);
            drawPartialCurve(ctx, pts, 1, withAlpha(palette.teal, 0.9), baseWidth + 1.5, 8);

            // Chosen label stays
            B.drawLabel(ctx, branch.token, { x: branch.endPt.x, y: branch.endPt.y - 14 },
              withAlpha(palette.teal, 1.0),
              '11px "JetBrains Mono", monospace', 'center');
          } else {
            // Alternatives fade out
            var altRemain = 1 - fadeT;
            if (altRemain > 0.01) {
              var altAlpha = (0.15 + prob * 0.25) * altRemain;
              drawPartialCurve(ctx, pts, 1, withAlpha(palette.white, altAlpha), altBaseWidth * altRemain, 0);
              // Labels fade
              var labelY = branch.endPt.y + (b === 1 ? -12 : 12);
              B.drawLabel(ctx, branch.token, { x: branch.endPt.x, y: labelY },
                withAlpha(palette.white, 0.3 * altRemain),
                '9px "JetBrains Mono", monospace', 'center');
            }
          }
        }
      }
    }

    // ---- draw node dots on the chosen path ----
    for (var nd = 0; nd < nodes.length; nd++) {
      // A node is visible once its level starts (or for node 0, always)
      var nodeVisible = false;
      var nodeActivity = 0;

      if (nd === 0) {
        // "The" node: visible after PAUSE_START with a quick fade-in
        var nodeAppear = B.clamp((cycleTime - PAUSE_START * 0.3) / 0.3, 0, 1);
        nodeVisible = nodeAppear > 0;
        nodeActivity = nodeAppear;
      } else {
        var lvlTiming = getLevelTiming(nd - 1, cycleTime);
        if (lvlTiming.phase === 'growing') {
          nodeVisible = lvlTiming.progress > 0.9;
          nodeActivity = B.clamp((lvlTiming.progress - 0.9) / 0.1, 0, 1);
        } else if (lvlTiming.phase !== 'waiting') {
          nodeVisible = true;
          // Extra glow during choosing
          if (lvlTiming.phase === 'choosing') {
            nodeActivity = 0.7 + 0.3 * Math.sin(lvlTiming.progress * Math.PI);
          } else {
            nodeActivity = 1;
          }
        }
      }

      if (nodeVisible) {
        var dotAlpha = 0.3 + nodeActivity * 0.7;
        var dotRadius = 4 + nodeActivity * 2;
        var dotGlow = nodeActivity * 12;
        B.drawDot(ctx, nodes[nd], dotRadius, withAlpha(palette.teal, dotAlpha), dotGlow);
        // White core
        B.drawDot(ctx, nodes[nd], 2, withAlpha('#ffffff', dotAlpha * 0.8));
      }
    }

    // ---- draw "The" starting label (always once visible) ----
    var startAlpha = B.clamp((cycleTime - PAUSE_START * 0.1) / 0.4, 0, 1);
    if (startAlpha > 0) {
      B.drawLabel(ctx, '"The"', { x: nodes[0].x, y: nodes[0].y - 16 },
        withAlpha(palette.teal, startAlpha),
        '12px "JetBrains Mono", monospace', 'center');
    }

    // ---- draw the assembled sentence at the bottom once all levels are done ----
    var allDoneTiming = getLevelTiming(levels.length - 1, cycleTime);
    if (allDoneTiming.phase === 'fading' || allDoneTiming.phase === 'done') {
      var sentenceT = allDoneTiming.phase === 'fading' ? B.easeOut(allDoneTiming.progress) : 1;

      // Draw the final assembled sentence
      var sentence = '"The model predicts the next"';
      var sentenceY = h * 0.88;
      var sentenceAlpha = sentenceT * 0.85;

      // Subtle glow background
      B.drawLabel(ctx, sentence, { x: w / 2, y: sentenceY },
        withAlpha(palette.teal, sentenceAlpha * 0.3),
        '13px "JetBrains Mono", monospace', 'center');

      // Main text
      B.drawLabel(ctx, sentence, { x: w / 2, y: sentenceY },
        withAlpha(palette.teal, sentenceAlpha),
        '13px "JetBrains Mono", monospace', 'center');

      // Subtitle
      if (sentenceT > 0.5) {
        var subAlpha = B.clamp((sentenceT - 0.5) / 0.5, 0, 1) * 0.4;
        B.drawLabel(ctx, 'next-token prediction', { x: w / 2, y: sentenceY + 18 },
          withAlpha(palette.white, subAlpha),
          '10px "JetBrains Mono", monospace', 'center');
      }
    }

    // ---- title label (top-left) ----
    B.drawLabel(ctx, 'token prediction', { x: w * 0.08 + 4, y: h * 0.07 },
      palette.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  // ---- start animation ---------------------------------------------------
  return B.animate(canvas, container, draw);
}
