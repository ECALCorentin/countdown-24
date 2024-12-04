import { createEngine } from "../../shared/engine.js";
import { Spring } from "./Spring.js";

const { renderer, input, math, run } = createEngine();
const { ctx, canvas } = renderer;

const points = [];
const pathPixels = [
  { x: 100, y: 100 },
  { x: 200, y: 100 },
  { x: 300, y: 100 },
  { x: 1000, y: 100 },
  { x: 300, y: 1000 },
  { x: 100, y: 1000 },
  { x: 100, y: 500 },
];

console.log(pathPixels);

let posOnLine = 0;
pathPixels[0].positionOnLine = posOnLine;
let prevX = pathPixels[0].x;
let prevY = pathPixels[0].y;
for (let i = 0; i < pathPixels.length; i++) {
  const x = pathPixels[i].x;
  const y = pathPixels[i].y;
  posOnLine += math.dist(x, y, prevX, prevY);
  pathPixels[i].positionOnLine = posOnLine;
  prevX = x;
  prevY = y;
}
posOnLine += math.dist(prevX, prevY, pathPixels[0].x, pathPixels[0].y);
const totalLineLength = posOnLine;
console.log(totalLineLength);

const minPointDistance = 10; // Minimum distance between points to avoid overlap

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function drawTextAndExtractPath() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.font = `${canvas.height}px Helvetica Neue, Helvetica, bold`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("1", canvas.width / 2, canvas.height / 2);

  /*
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height, {
    willReadFrequently: true,
  });
  const data = imageData.data;
  pathPixels = [];

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4;
      if (data[index + 3] > 128) {
        pathPixels.push({ x, y });
      }
    }
  }*/
}

function getPositionOnLineInfo(positionOnLine) {
  for (let i = 0; i < pathPixels.length; i++) {
    if (pathPixels[i].positionOnLine > positionOnLine) {
      const endIndex = i;
      const startIndex = i - 1;
      const lerp = math.invLerp(
        pathPixels[startIndex].positionOnLine,
        pathPixels[endIndex].positionOnLine,
        positionOnLine
      );
      return {
        startIndex,
        endIndex,
        lerp,
      };
    }
  }

  const startIndex = pathPixels.length - 1;
  const endIndex = 0;
  console.log(
    pathPixels[startIndex].positionOnLine,
    pathPixels[endIndex].positionOnLine + totalLineLength
  );
  return {
    startIndex: startIndex,
    endIndex: endIndex,
    lerp: math.invLerp(
      pathPixels[startIndex].positionOnLine,
      pathPixels[endIndex].positionOnLine + totalLineLength,
      positionOnLine
    ),
  };
}

function movePointToPath(point) {
  const pathInfo = getPositionOnLineInfo(point.positionOnLine);
  const targetX = math.lerp(
    pathPixels[pathInfo.startIndex].x,
    pathPixels[pathInfo.endIndex].x,
    pathInfo.lerp
  );
  const targetY = math.lerp(
    pathPixels[pathInfo.startIndex].y,
    pathPixels[pathInfo.endIndex].y,
    pathInfo.lerp
  );

  const stiffness = 0.05;
  const damping = 0.8;

  const dx = targetX - point.x;
  const dy = targetY - point.y;

  point.vx = (point.vx + dx * stiffness) * damping;
  point.vy = (point.vy + dy * stiffness) * damping;

  point.x += point.vx;
  point.y += point.vy;
}

function pushAlongLine(point1, point2) {
  let dist = deltaWrapped(
    point1.positionOnLine,
    point2.positionOnLine,
    totalLineLength
  );

  let force = 0;
  const distAbs = Math.abs(dist);
  if (distAbs > 0.0001) {
    const dir = Math.sign(dist);

    force = math.mapClamped(dist, 0, 100, 40000, 0) * dir;
  } else {
    force = Math.random() * 10;
  }

  ctx.beginPath();
  ctx.strokeStyle = "red";
  ctx.moveTo(point1.x, point1.y);

  ctx.lineTo(point2.x, point2.y);
  ctx.stroke();

  point1.accelerationOnLine += -force / 2;
  point2.accelerationOnLine += force / 2;
}
function updateAlongLine(point, deltaTime) {
  point.velocityOnLine *= 0.9;
  point.velocityOnLine += point.accelerationOnLine * deltaTime;
  point.positionOnLine += point.velocityOnLine * deltaTime;

  point.positionOnLine = math.repeat(point.positionOnLine, totalLineLength);
  // if (point.positionOnLine < 0) {
  //   point.positionOnLine = 0;
  // }
  // if (point.positionOnLine > totalLineLength) {
  //   point.positionOnLine = totalLineLength;
  // }

  point.accelerationOnLine = 0;
}

// Function to draw points on the canvas
function drawPoints(deltaTime) {
  ctx.fillStyle = "white";
  points.sort((a, b) => a.positionOnLine - b.positionOnLine);
  points.forEach((point, index) => {
    movePointToPath(point);
    const nextId = math.repeat(index + 1, points.length);
    pushAlongLine(point, points[nextId]);
    updateAlongLine(point, deltaTime);

    // ctx.fillStyle =
    //  index === 0 || index === points.length - 1 ? "white" : "blue";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 20, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Handle mouse click to place points
function handleMouseClick(event) {
  // This function allows user clicks to place points
  const mouseXpercentage = (event.clientX / window.innerWidth) * 100;
  const mouseYpercentage = (event.clientY / window.innerHeight) * 100;

  // Convert mouse position to actual canvas coordinates
  const clickedX = (mouseXpercentage / 100) * canvas.width;
  const clickedY = (mouseYpercentage / 100) * canvas.height;

  // Find the closest point on the path to the clicked point
  let closestPoint = pathPixels[0];
  let minDistance = Infinity;

  for (const point of pathPixels) {
    const distance = Math.hypot(point.x - clickedX, point.y - clickedY);
    if (distance < minDistance) {
      closestPoint = point;
      minDistance = distance;
    }
  }

  let tooClose = false;
  /*
  for (const point of points) {
    const distance = Math.hypot(point.x - clickedX, point.y - clickedY);
    if (distance < minPointDistance) {
      tooClose = true;
      break;
    }
  }*/

  if (!tooClose) {
    const newPoint = {
      x: clickedX,
      y: clickedY,
      accelerationOnLine: 0,
      velocityOnLine: 0,
      positionOnLine: closestPoint.positionOnLine,
      vx: 0,
      vy: 0,
    };

    points.push(newPoint);
    console.log(points);
  }
}

function update(deltaTime) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTextAndExtractPath();
  drawPoints(deltaTime);
}

window.addEventListener("resize", () => {
  resizeCanvas();
  drawTextAndExtractPath();
});

canvas.addEventListener("click", handleMouseClick);

resizeCanvas();
drawTextAndExtractPath();

run(update);

export const deltaWrapped = (a1, a2, range) => {
  let diff = math.mod(a2 - a1, range);
  if (diff > range / 2) diff -= range;
  return diff;
};
