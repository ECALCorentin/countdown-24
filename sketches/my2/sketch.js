import { createEngine } from "../../shared/engine.js";

const { renderer, input, math, run } = createEngine();
const { ctx, canvas } = renderer;

let numSections = 10; // Initial number of segments
let mouseXpercentage = 0;
let rotation = 0;
let rotationSpeed = 0;
let grabbing = false;
let grabRotationOffset = 0;
let detectedValue = null;
let lastStoppedSegment = null;

let values = generateValues(numSections);

const windowWidth = window.innerWidth;

canvas.addEventListener("mousemove", (event) => {
  mouseXpercentage = Math.round((event.pageX / windowWidth) * 100);
});

canvas.addEventListener("click", (event) => {
  if (mouseXpercentage >= 45 && mouseXpercentage <= 55) {
    numSections += 2;
    values = generateValues(numSections);
  }
});

function generateValues(numSections) {
  let maxTwos;

  if (numSections <= 2) {
    maxTwos = 1;
  } else if (numSections >= 4 && numSections <= 30) {
    maxTwos = 2;
  } else {
    maxTwos = 3;
  }

  let twosPlaced = 0;
  let generatedValues = [];

  for (let i = 0; i < numSections; i++) {
    let newValue;

    do {
      newValue = Math.floor(Math.random() * 3);
    } while (
      newValue === 2 &&
      (twosPlaced >= maxTwos || (i > 0 && generatedValues[i - 1] === 2))
    );

    if (newValue === 2) {
      twosPlaced++;
    }

    generatedValues.push(newValue);
  }

  return generatedValues;
}

function update(deltaTime) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const circleX = canvas.width / 2;
  const circleY = canvas.height / 2;
  const radius = canvas.width / 2;

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

  if (!grabbing && Math.abs(rotationSpeed) < 0.0005) {
    const stoppedSegmentIndex =
      Math.floor(normalizedRotation / segmentAngle) % numSections;

    if (lastStoppedSegment !== stoppedSegmentIndex) {
      detectedValue = values[stoppedSegmentIndex];
      lastStoppedSegment = stoppedSegmentIndex;
      console.log("Wheel stopped on number", detectedValue);
    }
  }

  ctx.save();
  ctx.translate(circleX, circleY);
  ctx.rotate(rotation);
  for (let i = 0; i < numSections; i++) {
    const angleStart = (i * 2 * Math.PI) / numSections;
    const angleEnd = ((i + 1) * 2 * Math.PI) / numSections;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, angleStart, angleEnd);
    ctx.closePath();

    // Highlight segments with value 2
    if (values[i] === 2) {
      ctx.fillStyle = "pink"; // Highlight color for segments with value 2
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

  const innerRadius = canvas.width / 15;
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(circleX, circleY, innerRadius, 0, Math.PI * 2);
  ctx.fill();
}

run(update);
