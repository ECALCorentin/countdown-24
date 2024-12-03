import { createEngine } from "../../shared/engine.js";
import { Spring } from "./Spring.js";

const { renderer, input, math, run, finish } = createEngine();
const { ctx, canvas } = renderer;

let numSections = 16;
let mouseXpercentage = 0;
let rotation = 0;
let rotationSpeed = 15;

let values = Array.from({ length: numSections }, () =>
  Math.floor(Math.random() * 4)
);

const windowWidth = window.innerWidth;

canvas.addEventListener("mousemove", (event) => {
  mouseXpercentage = Math.round((event.pageX / windowWidth) * 100);
  console.log(mouseXpercentage);
});

function update(deltaTime) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const circleX = canvas.width / 2;
  const circleY = canvas.height / 2;
  const radius = canvas.width / 2;

  const segmentAngle = (Math.PI * 2) / numSections;
  const closestSegment = Math.round(rotation / segmentAngle);
  const targetAngle = closestSegment * segmentAngle;
  const angleToTarget = math.deltaAngleRad(rotation, targetAngle);
  const springForce = 2;
  const springDamping = 1;
  const force =
    angleToTarget * springForce - rotationSpeed * springDamping - 0.1;

  const drag = 0.1; // 0 to infinity
  rotationSpeed += force * deltaTime;
  rotationSpeed *= Math.exp(-drag * deltaTime);
  rotation += rotationSpeed * deltaTime;

  ctx.translate(circleX, circleY);
  ctx.rotate(rotation);
  console.log(rotation);
  for (let i = 0; i < numSections; i++) {
    const angleStart = (i * 2 * Math.PI) / numSections;
    const angleEnd = ((i + 1) * 2 * Math.PI) / numSections;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, angleStart, angleEnd);
    ctx.closePath();

    ctx.fillStyle = i % 2 === 0 ? "grey" : "white";
    ctx.fill();

    ctx.fillStyle = i % 2 === 0 ? "white" : "black";

    const angleMiddle = (angleStart + angleEnd) / 2;
    const textX = 0 + (radius / 1.1) * Math.cos(angleMiddle);
    const textY = 0 + (radius / 1.1) * Math.sin(angleMiddle);

    const angleRotation = angleMiddle + Math.PI / 2;

    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate(angleRotation);
    ctx.font = `${canvas.width / 30}px Helvetica Neue, Helvetica, bold`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(values[i], 0, 0);

    ctx.restore();
  }

  const innerRadius = canvas.width / 15;
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = `${canvas.width / 9}px Helvetica Neue, Helvetica, bold`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("2", 0, 0);
}

canvas.addEventListener("click", (event) => {
  if (mouseXpercentage >= 45 && mouseXpercentage <= 55) {
    numSections += 2;
    const newValues = Array.from({ length: 2 }, () =>
      Math.floor(Math.random() * 4)
    );
    values = values.concat(newValues);
  }
  update();
});

run(update);
