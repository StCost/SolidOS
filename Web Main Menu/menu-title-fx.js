(function () {
  var titleElement = document.querySelector(".term-title");
  var titleBlock = document.getElementById("titleBlock");
  if (!titleElement || !titleBlock) return;

  var maxParticles = 160;
  var particles = [];
  var pulseTimer = null;

  var fxLayer = document.createElement("div");
  fxLayer.className = "title-fx-layer";
  fxLayer.setAttribute("aria-hidden", "true");
  titleBlock.appendChild(fxLayer);

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function recycleParticle(node) {
    if (!node || !node.parentNode) return;
    node.parentNode.removeChild(node);
    var index = particles.indexOf(node);
    if (index >= 0) particles.splice(index, 1);
  }

  function trimParticles() {
    while (particles.length > maxParticles) {
      recycleParticle(particles.shift());
    }
  }

  function spawnParticle(originX, originY, kind) {
    trimParticles();

    var particle = document.createElement("span");
    particle.className = "title-fx-particle title-fx-particle--" + kind;

    var angle = randomBetween(0, Math.PI * 2);
    var speed = 0;
    var size = 4;
    var duration = 520;
    var scaleEnd = 0.15;

    if (kind === "spark") {
      speed = randomBetween(48, 140);
      size = randomBetween(2, 5);
      duration = randomBetween(280, 520);
      scaleEnd = randomBetween(0, 0.2);
    } else if (kind === "fire") {
      speed = randomBetween(36, 110);
      size = randomBetween(7, 14);
      duration = randomBetween(420, 780);
      scaleEnd = randomBetween(0.1, 0.35);
    } else {
      speed = randomBetween(22, 72);
      size = randomBetween(12, 26);
      duration = randomBetween(680, 1100);
      scaleEnd = randomBetween(0.5, 1.1);
    }

    var travelX = Math.cos(angle) * speed;
    var travelY = Math.sin(angle) * speed - randomBetween(6, 28);

    particle.style.left = originX + "px";
    particle.style.top = originY + "px";
    particle.style.setProperty("--fx-tx", travelX.toFixed(1) + "px");
    particle.style.setProperty("--fx-ty", travelY.toFixed(1) + "px");
    particle.style.setProperty("--fx-rot", randomBetween(-220, 220).toFixed(1) + "deg");
    particle.style.setProperty("--fx-size", size.toFixed(1) + "px");
    particle.style.setProperty("--fx-duration", duration.toFixed(0) + "ms");
    particle.style.setProperty("--fx-scale-end", scaleEnd.toFixed(2));

    fxLayer.appendChild(particle);
    particles.push(particle);

    particle.addEventListener("animationend", function onAnimationEnd() {
      particle.removeEventListener("animationend", onAnimationEnd);
      recycleParticle(particle);
    });
  }

  function spawnGlowBurst(originX, originY) {
    trimParticles();

    var glow = document.createElement("span");
    glow.className = "title-fx-glow-burst";
    glow.style.left = originX + "px";
    glow.style.top = originY + "px";
    glow.style.setProperty("--fx-glow-duration", randomBetween(380, 560).toFixed(0) + "ms");
    glow.style.setProperty("--fx-glow-scale", randomBetween(3.5, 5.5).toFixed(2));

    fxLayer.appendChild(glow);
    particles.push(glow);

    glow.addEventListener("animationend", function onGlowEnd() {
      glow.removeEventListener("animationend", onGlowEnd);
      recycleParticle(glow);
    });
  }

  function spawnBurst(clientX, clientY) {
    var layerRect = fxLayer.getBoundingClientRect();
    var originX = clientX - layerRect.left;
    var originY = clientY - layerRect.top;

    spawnGlowBurst(originX, originY);

    var sparkCount = 5 + Math.floor(Math.random() * 4);
    var fireCount = 2 + Math.floor(Math.random() * 3);
    var smokeCount = 2 + Math.floor(Math.random() * 2);
    var index = 0;

    for (index = 0; index < sparkCount; index++) spawnParticle(originX, originY, "spark");
    for (index = 0; index < fireCount; index++) spawnParticle(originX, originY, "fire");
    for (index = 0; index < smokeCount; index++) spawnParticle(originX, originY, "smoke");
  }

  function pulseTitle() {
    titleElement.classList.remove("term-title--pulse");
    void titleElement.offsetWidth;
    titleElement.classList.add("term-title--pulse");
    if (pulseTimer) window.clearTimeout(pulseTimer);
    pulseTimer = window.setTimeout(function () {
      titleElement.classList.remove("term-title--pulse");
      pulseTimer = null;
    }, 160);
  }

  titleElement.addEventListener("pointerdown", function (event) {
    if (event.button !== 0) return;
    spawnBurst(event.clientX, event.clientY);
    pulseTitle();
  });
})();
