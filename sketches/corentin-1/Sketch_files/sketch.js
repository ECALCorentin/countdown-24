import { createEngine } from "../../shared/engine.js";

const { renderer, input, math, run, audio } = createEngine();
const { ctx, canvas } = renderer;

let numSections = 24;
let mouseXpercentage = 0;
let rotation = 0;
let rotationSpeed = 0;
let grabbing = false;
let grabRotationOffset = 0;
let detectedValue = null;
let lastStoppedSegment = null;
let revealSpeed = 0.05;
let revealTimer = 0;
let disappearing = false; // Indique si la roue est en train de disparaître
let disappearanceProgress = 1; // Progression de la disparition (1 = pleine visibilité)

let lastActiveSlot = 0;
let values = generateValues(numSections);
let revealedSegments = Array(numSections).fill(false);
let revealIndex = 0;

const clickSound = await audio.load("./click.wav");
const correctSound = await audio.load("./Correct.wav");
const incorrectSound = await audio.load("./incorrect.wav");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas(); // Initial resize when the page loads

const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

canvas.addEventListener("mousemove", (event) => {
  mouseXpercentage = Math.round((event.pageX / windowWidth) * 100);
});

// canvas.addEventListener("click", (event) => {
//   if (mouseXpercentage >= 45 && mouseXpercentage <= 55) {
//     numSections += 2;
//     values = generateValues(numSections);
//     revealedSegments = Array(numSections).fill(false);
//     revealIndex = 0;
//   }
// });

function generateValues(numSections) {
  let maxTwos;

  if (numSections <= 2) {
    maxTwos = 1;
  } else if (numSections >= 4 && numSections <= 30) {
    maxTwos = 1;
  } else {
    maxTwos = 1;
  }

  let twosPlaced = 0;
  let generatedValues = [];
  let lastTwoIndex = -Infinity;

  for (let i = 0; i < numSections; i++) {
    let newValue;

    do {
      newValue = Math.floor(Math.random() * 4);
    } while (
      newValue === 2 &&
      (twosPlaced >= maxTwos ||
        i - lastTwoIndex < Math.floor(Math.random() * 3) + 2) // 2 à 3 cases d'espacement
    );

    if (newValue === 2) {
      twosPlaced++;
      lastTwoIndex = i; // Mémorise l'index de la dernière occurrence d'un 2
    }

    generatedValues.push(newValue);
  }

  return generatedValues;
}

function update(deltaTime) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const circleX = canvas.width / 2;
  const circleY = canvas.height / 2;
  const radius =
    (Math.min(canvas.width, canvas.height) / 2.2) * disappearanceProgress; // Réduction de la taille

  // Gérer la disparition
  if (disappearing) {
    disappearanceProgress -= deltaTime * 1; // Ajuste la vitesse de disparition
    finish();
    if (disappearanceProgress <= 0) {
      disappearanceProgress = 0; // Empêche une progression négative
      return; // Arrête de dessiner si la roue est totalement disparue
    }
  }

  if (input.isPressed()) {
    const mouseXRelative = input.getX() - circleX;
    const mouseYRelative = input.getY() - circleY;
    const mouseRotation = Math.atan2(mouseYRelative, mouseXRelative);

    if (!grabbing) {
      grabbing = true;
      grabRotationOffset = math.deltaAngleRad(rotation, mouseRotation);
    }

    const targetGrabRotation = mouseRotation - grabRotationOffset;
    const angleToGrabTarget = math.deltaAngleRad(rotation, targetGrabRotation);
    const springForce = 500;
    const springDamping = 10;
    const force =
      angleToGrabTarget * springForce - rotationSpeed * springDamping;
    rotationSpeed += force * deltaTime;
  } else if (grabbing) {
    grabbing = false;
  }

  const segmentAngle = (Math.PI * 2) / numSections;
  const closestSegment = Math.round(rotation / segmentAngle);
  const targetAngle = closestSegment * segmentAngle;
  const angleToTarget = math.deltaAngleRad(rotation, targetAngle);
  const springForce = 100;
  const springDamping = 1;
  const force = angleToTarget * springForce - rotationSpeed * springDamping;
  const drag = 0.1;

  if (!grabbing) {
    rotationSpeed += force * deltaTime;
    rotationSpeed *= Math.exp(-drag * deltaTime);
  }
  rotation += rotationSpeed * deltaTime;

  const normalizedRotation =
    ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

  const fixedAngle = 0.05;

  let stoppedSegmentIndex = null;
  if (!grabbing && Math.abs(rotationSpeed) < 0.0005) {
    stoppedSegmentIndex =
      Math.floor(
        ((fixedAngle - normalizedRotation + 2 * Math.PI) % (2 * Math.PI)) /
          segmentAngle
      ) % numSections;

    if (lastStoppedSegment !== stoppedSegmentIndex) {
      detectedValue = values[stoppedSegmentIndex];
      lastStoppedSegment = stoppedSegmentIndex;
      console.log(
        "Le segment gagnant est le segment",
        stoppedSegmentIndex,
        "avec la valeur",
        detectedValue
      );

      // Déclenche la disparition si le segment gagnant est un 2
      if (detectedValue === 2) {
        correctSound.play();
        disappearing = true;
      }
    }
  }

  revealTimer += deltaTime;

  const currentActiveSlot = Math.round((rotation / Math.PI / 2) * numSections);
  if (lastActiveSlot !== currentActiveSlot) {
    const maxRate = math.mapClamped(Math.abs(rotationSpeed), 0, 20, 2.0, 3.0);
    console.log(rotationSpeed);
    clickSound.play({
      //rate: math.lerp(0.8, maxRate, Math.random()),
      volume: math.lerp(0.5, 1, Math.random()),
    });
    lastActiveSlot = currentActiveSlot;
  }

  if (revealTimer >= revealSpeed) {
    if (revealIndex < numSections) {
      revealedSegments[revealIndex] = true;
      revealIndex++;
    }
    revealTimer = 0;
  }

  ctx.save();
  ctx.translate(circleX, circleY);
  ctx.rotate(rotation);
  for (let i = 0; i < numSections; i++) {
    if (!revealedSegments[i]) continue;

    const angleStart = (i * 2 * Math.PI) / numSections;
    const angleEnd = ((i + 1) * 2 * Math.PI) / numSections;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, angleStart, angleEnd);
    ctx.closePath();

    if (values[i] === 2) {
      ctx.fillStyle = "pink";
    } else {
      ctx.fillStyle = i % 2 === 0 ? "grey" : "white";
    }
    ctx.fill();

    ctx.fillStyle = i % 2 === 0 ? "white" : "black";

    const angleMiddle = (angleStart + angleEnd) / 2;
    const textX = (radius / 1.15) * Math.cos(angleMiddle);
    const textY = (radius / 1.15) * Math.sin(angleMiddle);

    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate(angleMiddle + Math.PI / 2);
    ctx.font = `${canvas.width / 30}px Helvetica Neue, Helvetica, bold`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(values[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();

  const innerRadius = (canvas.width / 15) * disappearanceProgress;
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(circleX, circleY, innerRadius, 0, Math.PI * 2);
  ctx.fill();
}

run(update);
