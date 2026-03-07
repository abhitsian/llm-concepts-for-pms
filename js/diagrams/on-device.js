// on-device.js — Cloud model (big, slow) vs on-device model (small, fast)

function OnDeviceDiagram(canvas, container) {
  var B = Bezier;
  var P = B.palette;
  var wA = B.withAlpha;

  var CYCLE = 10;

  function draw(ctx, w, h, time) {
    B.clear(ctx, w, h);
    B.drawGrid(ctx, w, h, 40);

    var t = (time % CYCLE) / CYCLE;
    var midX = w * 0.5;

    // Divider line
    B.drawLine(ctx, { x: midX, y: h * 0.12 }, { x: midX, y: h * 0.88 },
      wA(P.white, 0.06), 1, [4, 6]);

    // === LEFT HALF: Cloud ===
    var cloudCx = w * 0.25;
    var cloudTopY = h * 0.2;    // Cloud position
    var deviceY = h * 0.62;     // Device/user position

    // Cloud icon (rounded shape at top)
    ctx.save();
    ctx.fillStyle = wA(P.blue, 0.08);
    ctx.strokeStyle = wA(P.blue, 0.25);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cloudCx, cloudTopY - 6, 20, Math.PI, 0);
    ctx.arc(cloudCx + 14, cloudTopY + 2, 12, -Math.PI * 0.5, Math.PI * 0.3);
    ctx.arc(cloudCx - 14, cloudTopY + 2, 12, Math.PI * 0.7, -Math.PI * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    B.drawLabel(ctx, 'Cloud', { x: cloudCx, y: cloudTopY - 30 },
      wA(P.blue, 0.6), '11px "JetBrains Mono", monospace', 'center');

    // Large model circle (70B)
    var pulse = 0.5 + 0.5 * Math.sin(time * 2);
    B.drawDot(ctx, { x: cloudCx, y: cloudTopY }, 18 + pulse * 2, wA(P.blue, 0.12), 20);
    B.drawDot(ctx, { x: cloudCx, y: cloudTopY }, 12, wA(P.blue, 0.3), 10);
    B.drawLabel(ctx, '70B', { x: cloudCx, y: cloudTopY },
      wA(P.blue, 0.7), 'bold 9px "JetBrains Mono", monospace', 'center');

    // User/device at bottom-left
    B.drawDot(ctx, { x: cloudCx, y: deviceY }, 5, wA(P.white, 0.4), 6);
    B.drawLabel(ctx, 'user', { x: cloudCx, y: deviceY + 14 },
      wA(P.white, 0.3), '8px "JetBrains Mono", monospace', 'center');

    // Network path (dashed line up to cloud, and back)
    B.drawLine(ctx,
      { x: cloudCx - 8, y: deviceY - 8 },
      { x: cloudCx - 8, y: cloudTopY + 18 },
      wA(P.blue, 0.12), 1, [3, 5]);
    B.drawLine(ctx,
      { x: cloudCx + 8, y: cloudTopY + 18 },
      { x: cloudCx + 8, y: deviceY - 8 },
      wA(P.blue, 0.12), 1, [3, 5]);

    // "request" / "response" labels on the paths
    B.drawLabel(ctx, 'req', { x: cloudCx - 18, y: (deviceY + cloudTopY) * 0.5 },
      wA(P.blue, 0.2), '7px "JetBrains Mono", monospace', 'center');
    B.drawLabel(ctx, 'res', { x: cloudCx + 18, y: (deviceY + cloudTopY) * 0.5 },
      wA(P.blue, 0.2), '7px "JetBrains Mono", monospace', 'center');

    // Data leaving indicator (no lock)
    ctx.save();
    ctx.strokeStyle = wA(P.coral, 0.3);
    ctx.lineWidth = 1;
    // Open lock shape
    var lockX = cloudCx - 28;
    var lockY = (deviceY + cloudTopY) * 0.5 + 14;
    ctx.beginPath();
    ctx.arc(lockX, lockY - 4, 4, Math.PI, 0);
    ctx.stroke();
    ctx.strokeRect(lockX - 5, lockY, 10, 7);
    // Strikethrough
    ctx.strokeStyle = wA(P.coral, 0.4);
    ctx.beginPath();
    ctx.moveTo(lockX - 7, lockY + 8);
    ctx.lineTo(lockX + 7, lockY - 8);
    ctx.stroke();
    ctx.restore();
    B.drawLabel(ctx, 'data leaves', { x: lockX, y: lockY + 14 },
      wA(P.coral, 0.25), '6px "JetBrains Mono", monospace', 'center');

    // === RIGHT HALF: Device ===
    var devCx = w * 0.75;
    var devModelY = h * 0.42;  // Model lives on device

    B.drawLabel(ctx, 'Device', { x: devCx, y: h * 0.17 },
      wA(P.teal, 0.6), '11px "JetBrains Mono", monospace', 'center');

    // Device rectangle outline
    ctx.save();
    ctx.strokeStyle = wA(P.teal, 0.2);
    ctx.lineWidth = 1;
    var devBoxX = devCx - 30;
    var devBoxY = devModelY - 28;
    var devBoxW = 60;
    var devBoxH = 56;
    ctx.beginPath();
    var dr = 8;
    ctx.moveTo(devBoxX + dr, devBoxY);
    ctx.lineTo(devBoxX + devBoxW - dr, devBoxY);
    ctx.quadraticCurveTo(devBoxX + devBoxW, devBoxY, devBoxX + devBoxW, devBoxY + dr);
    ctx.lineTo(devBoxX + devBoxW, devBoxY + devBoxH - dr);
    ctx.quadraticCurveTo(devBoxX + devBoxW, devBoxY + devBoxH, devBoxX + devBoxW - dr, devBoxY + devBoxH);
    ctx.lineTo(devBoxX + dr, devBoxY + devBoxH);
    ctx.quadraticCurveTo(devBoxX, devBoxY + devBoxH, devBoxX, devBoxY + devBoxH - dr);
    ctx.lineTo(devBoxX, devBoxY + dr);
    ctx.quadraticCurveTo(devBoxX, devBoxY, devBoxX + dr, devBoxY);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Small model circle (3B) — on the device
    B.drawDot(ctx, { x: devCx, y: devModelY }, 10, wA(P.teal, 0.15), 12);
    B.drawDot(ctx, { x: devCx, y: devModelY }, 6, wA(P.teal, 0.4), 6);
    B.drawLabel(ctx, '3B', { x: devCx, y: devModelY },
      wA(P.teal, 0.8), 'bold 8px "JetBrains Mono", monospace', 'center');

    // Direct connection — no network hop
    B.drawLabel(ctx, 'local', { x: devCx, y: devModelY + 20 },
      wA(P.teal, 0.25), '7px "JetBrains Mono", monospace', 'center');

    // Lock icon (privacy)
    ctx.save();
    var rLockX = devCx + 36;
    var rLockY = devModelY - 2;
    ctx.strokeStyle = wA(P.green, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(rLockX, rLockY - 4, 4, Math.PI, 0);
    ctx.lineTo(rLockX + 4, rLockY);
    ctx.stroke();
    ctx.fillStyle = wA(P.green, 0.3);
    ctx.fillRect(rLockX - 5, rLockY, 10, 7);
    ctx.restore();
    B.drawLabel(ctx, 'private', { x: rLockX, y: rLockY + 14 },
      wA(P.green, 0.3), '6px "JetBrains Mono", monospace', 'center');

    // === Animated query race ===
    // Both receive query at t=0.1, device finishes first

    var queryStart = 0.1;
    var cloudFinish = 0.65;   // Cloud takes longer
    var deviceFinish = 0.40;  // Device finishes first

    // Cloud query animation
    var cloudT = B.clamp((t - queryStart) / (cloudFinish - queryStart), 0, 1);
    if (cloudT > 0) {
      // Phase 1: travel up (0-0.3)
      // Phase 2: processing (0.3-0.7)
      // Phase 3: travel back (0.7-1.0)
      if (cloudT < 0.3) {
        // Going up
        var upT = cloudT / 0.3;
        var dotY = B.lerp(deviceY - 8, cloudTopY + 18, B.easeIn(upT));
        B.drawDot(ctx, { x: cloudCx - 8, y: dotY }, 3, P.blue, 8);
      } else if (cloudT < 0.7) {
        // Processing at cloud — pulsing
        var procPulse = Math.sin((cloudT - 0.3) / 0.4 * Math.PI * 4) * 0.3 + 0.7;
        B.drawDot(ctx, { x: cloudCx, y: cloudTopY }, 14 * procPulse,
          wA(P.blue, 0.3), 18);
      } else {
        // Coming back
        var downT = (cloudT - 0.7) / 0.3;
        var dotY = B.lerp(cloudTopY + 18, deviceY - 8, B.easeOut(downT));
        B.drawDot(ctx, { x: cloudCx + 8, y: dotY }, 3, P.blue, 8);
      }
    }

    // Cloud completion indicator
    if (t > cloudFinish) {
      var doneAlpha = B.clamp((t - cloudFinish) / 0.05, 0, 1);
      B.drawDot(ctx, { x: cloudCx, y: deviceY }, 7, wA(P.blue, doneAlpha * 0.4), 10);
      B.drawLabel(ctx, 'done', { x: cloudCx, y: deviceY - 16 },
        wA(P.blue, doneAlpha * 0.5), '8px "JetBrains Mono", monospace', 'center');
    }

    // Device query animation
    var devT = B.clamp((t - queryStart) / (deviceFinish - queryStart), 0, 1);
    if (devT > 0 && devT < 1) {
      // Processing locally — just glowing on device
      var devPulse = Math.sin(devT * Math.PI * 6) * 0.3 + 0.7;
      B.drawDot(ctx, { x: devCx, y: devModelY }, 8 * devPulse,
        wA(P.teal, 0.35), 14);
    }

    // Device completion indicator (finishes first!)
    if (t > deviceFinish) {
      var devDoneAlpha = B.clamp((t - deviceFinish) / 0.05, 0, 1);
      B.drawDot(ctx, { x: devCx, y: devModelY + 30 }, 7,
        wA(P.teal, devDoneAlpha * 0.5), 10);
      B.drawLabel(ctx, 'done', { x: devCx, y: devModelY + 46 },
        wA(P.teal, devDoneAlpha * 0.6), '8px "JetBrains Mono", monospace', 'center');

      // "FIRST!" indicator
      if (t < cloudFinish) {
        var firstPulse = 0.5 + 0.5 * Math.sin(time * 5);
        B.drawLabel(ctx, 'FIRST',
          { x: devCx + 30, y: devModelY + 38 },
          wA(P.green, devDoneAlpha * firstPulse * 0.6),
          'bold 8px "JetBrains Mono", monospace', 'left');
      }
    }

    // Latency labels
    B.drawLabel(ctx, '500ms + network', { x: cloudCx, y: h * 0.8 },
      wA(P.blue, 0.4), '10px "JetBrains Mono", monospace', 'center');
    B.drawLabel(ctx, '50ms local', { x: devCx, y: h * 0.8 },
      wA(P.teal, 0.4), '10px "JetBrains Mono", monospace', 'center');

    // Quantization visual at bottom
    if (t > 0.5) {
      var qAlpha = B.easeOut(B.clamp((t - 0.5) / 0.2, 0, 1));
      var qY = h * 0.88;

      // Large block (16-bit)
      var bigX = w * 0.35;
      ctx.save();
      ctx.fillStyle = wA(P.blue, qAlpha * 0.15);
      ctx.strokeStyle = wA(P.blue, qAlpha * 0.3);
      ctx.lineWidth = 1;
      ctx.fillRect(bigX - 16, qY - 8, 32, 16);
      ctx.strokeRect(bigX - 16, qY - 8, 32, 16);
      ctx.restore();
      B.drawLabel(ctx, '16-bit', { x: bigX, y: qY },
        wA(P.blue, qAlpha * 0.5), '7px "JetBrains Mono", monospace', 'center');

      // Arrow
      B.drawLine(ctx,
        { x: bigX + 20, y: qY },
        { x: w * 0.58, y: qY },
        wA(P.white, qAlpha * 0.2), 1);
      ctx.save();
      ctx.fillStyle = wA(P.white, qAlpha * 0.3);
      ctx.beginPath();
      ctx.moveTo(w * 0.58, qY);
      ctx.lineTo(w * 0.57, qY - 3);
      ctx.lineTo(w * 0.57, qY + 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Small block (4-bit)
      var smallX = w * 0.65;
      ctx.save();
      ctx.fillStyle = wA(P.teal, qAlpha * 0.2);
      ctx.strokeStyle = wA(P.teal, qAlpha * 0.4);
      ctx.lineWidth = 1;
      ctx.fillRect(smallX - 8, qY - 4, 16, 8);
      ctx.strokeRect(smallX - 8, qY - 4, 16, 8);
      ctx.restore();
      B.drawLabel(ctx, '4-bit', { x: smallX, y: qY },
        wA(P.teal, qAlpha * 0.6), '7px "JetBrains Mono", monospace', 'center');

      // Label
      B.drawLabel(ctx, 'quantization: 4x smaller',
        { x: (bigX + smallX) / 2 + 4, y: qY + 14 },
        wA(P.white, qAlpha * 0.3), '7px "JetBrains Mono", monospace', 'center');
    }

    // Formula
    if (t > 0.75) {
      var fAlpha = B.easeOut(B.clamp((t - 0.75) / 0.15, 0, 1));
      B.drawLabel(ctx, 'latency + privacy + cost = on-device wins for simple tasks',
        { x: w * 0.5, y: h * 0.96 },
        wA(P.white, fAlpha * 0.3), '8px "JetBrains Mono", monospace', 'center');
    }

    // Title
    B.drawLabel(ctx, 'on-device llms', { x: w * 0.06, y: h * 0.06 },
      P.textDim, '10px "JetBrains Mono", monospace', 'left');
  }

  return B.animate(canvas, container, draw);
}
