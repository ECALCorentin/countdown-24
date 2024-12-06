import { createEngine } from "../../shared/engine.js";

const { renderer, input, math, run, audio, finish } = createEngine();
const { ctx, canvas } = renderer;

let numSections = 30;
let rotation = 0;
let rotationSpeed = 0;
let grabbing = false;
let grabRotationOffset = 0;
let detectedValue = null;
let lastStoppedSegment = null;
let revealSpeed = 0.05;
let revealTimer = 0;
let disappearing = false;
let disappearanceProgress = 1;

let lastActiveSlot = 0;
let values = generateValues(numSections);
let revealedSegments = Array(numSections).fill(false);
let revealIndex = 0;

let delayBeforeStart = 2; // Seconds before the wheel appears
let startTimer = 0;
let wheelVisible = false; // Indicates if the wheel is visible
let finished = false; // Flag to track if finish() has been called

const clickSound = await audio.load("./click.wav");
const correctSound = await audio.load("./Correct.wav");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function generateValues(numSections) {
  let maxTwos = 1;
  let twosPlaced = 0;
  let generatedValues = [];
  const fixedIndex = Math.floor((0.05 / (2 * Math.PI)) * numSections); // Winning segment index

  for (let i = 0; i < numSections; i++) {
    let newValue;

    do {
      newValue = Math.floor(Math.random() * 4);
    } while (
      (newValue === 2 && twosPlaced >= maxTwos) || // Enforce max '2's
      (i === fixedIndex && newValue === 2) // Avoid '2' on the winning segment
    );

    if (newValue === 2) twosPlaced++;
    generatedValues.push(newValue);
  }

  return generatedValues;
}

function update(deltaTime) {
  if (finished) return; // Stop updating if finish() has been called

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Handle delay before showing the wheel
  if (!wheelVisible) {
    startTimer += deltaTime;
    if (startTimer >= delayBeforeStart) {
      wheelVisible = true;
    } else {
      ctx.font = `${canvas.width / 20}px Helvetica Neue, Helvetica, bold`;
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.fillText("Loading...", canvas.width / 2, canvas.height / 2);
      return;
    }
  }

  const circleX = canvas.width / 2;
  const circleY = canvas.height / 2;
  const radius =
    (Math.min(canvas.width, canvas.height) / 2.2) * disappearanceProgress;

  // Handle wheel disappearance
  if (disappearing) {
    disappearanceProgress -= deltaTime * 1;
    if (disappearanceProgress <= 0) {
      disappearanceProgress = 0;

      if (!finished) {
        finish(); // Call finish() when the wheel disappears completely
        finished = true; // Prevent further updates
      }
      return;
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

      if (detectedValue === 2) {
        correctSound.play();
        disappearing = true;
      }
    }
  }

  revealTimer += deltaTime;

  const currentActiveSlot = Math.round((rotation / Math.PI / 2) * numSections);
  if (lastActiveSlot !== currentActiveSlot) {
    clickSound.play({
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

  // Draw the wheel
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

    ctx.fillStyle = values[i] === 2 ? "pink" : i % 2 === 0 ? "black" : "white";
    ctx.fill();

    const angleMiddle = (angleStart + angleEnd) / 2;
    const textX = (radius / 1.15) * Math.cos(angleMiddle);
    const textY = (radius / 1.15) * Math.sin(angleMiddle);

    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate(angleMiddle + Math.PI / 2);
    ctx.font = `${canvas.width / 30}px Helvetica Neue, Helvetica, bold`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = i % 2 === 0 ? "white" : "black";
    ctx.fillText(values[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();

  // Draw the triangle indicator
  ctx.save();
  ctx.translate(circleX, circleY); // Move to the center of the wheel
  ctx.rotate((95 * Math.PI) / 180); // Rotate by 95 degrees to the right

  ctx.fillStyle = "pink";
  const triangleSize = 80;
  ctx.beginPath();
  ctx.moveTo(0, -radius - triangleSize); // Position the triangle relative to the new rotation
  ctx.lineTo(-triangleSize / 2, -radius - triangleSize * 2);
  ctx.lineTo(triangleSize / 2, -radius - triangleSize * 2);
  ctx.closePath();
  ctx.fill();

  ctx.restore(); // Restore original context state

  // Draw the inner circle
  const innerRadius = (canvas.width / 15) * disappearanceProgress;
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(circleX, circleY, innerRadius, 0, Math.PI * 2);
  ctx.fill();
}

run(update);
