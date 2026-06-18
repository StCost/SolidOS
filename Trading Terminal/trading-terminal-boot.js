(function () {
  var canvas = document.getElementById("bootCanvas");
  if (!canvas) return;
  var context = canvas.getContext("2d");
  var progress = 0;
  var lastTime = 0;

  function drawHandDraw(timestamp) {
    if (!context) return;
    if (!lastTime) lastTime = timestamp;
    var delta = timestamp - lastTime;
    lastTime = timestamp;
    progress += delta * 0.00015;
    if (progress > 1) progress = 0;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#ff8000";
    context.lineWidth = 2;
    context.lineCap = "round";
    context.beginPath();

    var points = [
      [40, 150], [80, 60], [120, 140], [160, 50], [200, 130], [240, 80]
    ];
    var maxIndex = Math.floor(progress * points.length);
    var partial = (progress * points.length) - maxIndex;

    for (var i = 0; i < maxIndex; i++) {
      var point = points[i];
      if (i === 0) context.moveTo(point[0], point[1]);
      else context.lineTo(point[0], point[1]);
    }

    if (maxIndex < points.length && maxIndex > 0) {
      var from = points[maxIndex - 1];
      var to = points[maxIndex];
      context.lineTo(
        from[0] + (to[0] - from[0]) * partial,
        from[1] + (to[1] - from[1]) * partial
      );
    }

    context.stroke();
    requestAnimationFrame(drawHandDraw);
  }

  requestAnimationFrame(drawHandDraw);
})();
