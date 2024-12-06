import { createEngine } from "../../shared/engine.js";
import { Spring } from "./Spring.js";

const { renderer, input, math, run, audio, finish } = createEngine();
const { ctx, canvas } = renderer;

let points = [];
let pathPixels = [
  { x: 35.0, y: 355.85 },
  { x: 229.23, y: 203.7 },
  { x: 444.58, y: 35.0 },
  { x: 585.08, y: 35.0 },
  { x: 713.15, y: 35.0 },
  { x: 713.15, y: 365.78 },
  { x: 713.15, y: 672.78 },
  { x: 713.15, y: 956.68 },
  { x: 713.15, y: 1275.3 },
  { x: 871.3, y: 1275.3 },
  { x: 1023.68, y: 1275.3 },
  { x: 1023.68, y: 1416.02 },
  { x: 1023.68, y: 1553.08 },
  { x: 511.83, y: 1553.08 },
  { x: 35.0, y: 1553.08 },
  { x: 35.0, y: 1416.02 },
  { x: 35.0, y: 1276.32 },
  { x: 225.0, y: 1276.32 },
  { x: 414.83, y: 1276.32 },
  { x: 414.83, y: 855.13 },
  { x: 414.83, y: 379.53 },
  { x: 228.7, y: 526.2 },
  { x: 35.0, y: 678.82 },
  { x: 35.0, y: 504.28 },
  { x: 35.0, y: 355.85 },
];

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

const minPointDistance = 10;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function centerPathPixels() {
  let centroidX = 0;
  let centroidY = 0;

  for (const point of pathPixels) {
    centroidX += point.x;
    centroidY += point.y;
  }

  centroidX /= pathPixels.length;
  centroidY /= pathPixels.length;
  const offsetX = canvas.width / 2 - centroidX;
  const offsetY = canvas.height / 2 - centroidY;

  // Appliquer le décalage à chaque point
  for (const point of pathPixels) {
    point.x += offsetX;
    point.y += offsetY;
  }
}

function drawTextAndExtractPath() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const maxPoints = 150; // Nombre maximum de points autorisés avant de changer la couleur
  const fillColor = points.length > maxPoints ? "white" : "black";

  // Dessiner le texte "1" avec la couleur déterminée
  ctx.fillStyle = fillColor;
  ctx.font = `${canvas.height}px Helvetica Neue, Helvetica, bold`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("1", canvas.width / 2, canvas.height / 2);

  centerPathPixels();
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
  const damping = 0.4;

  const dx = targetX - point.x;
  const dy = targetY - point.y;

  point.vx = (point.vx + dx * stiffness) * damping;
  point.vy = (point.vy + dy * stiffness) * damping;
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

  const midX = (point1.x + point2.x) / 2;
  const midY = (point1.y + point2.y) / 2;

  const maxLineWidth = 20;
  const minLineWidth = 0;
  const t = 1 - Math.abs(dist / 100);
  const lineWidth = math.lerp(minLineWidth, maxLineWidth, t);

  ctx.beginPath();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = "pink";
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

  point.accelerationOnLine = 0;
}

function updatePointsOnLine(deltaTime) {}
function drawPoints() {
  points.forEach((point, index) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 20, 0, Math.PI * 2);
    ctx.fill();
  });
}

function dropAllPoints(deltaTime) {}

function handleMouseClick(event) {
  const mouseXpercentage = (event.clientX / window.innerWidth) * 100;
  const mouseYpercentage = (event.clientY / window.innerHeight) * 100;

  const clickedX = (mouseXpercentage / 100) * canvas.width;
  const clickedY = (mouseYpercentage / 100) * canvas.height;

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
  }
}

function fillPathInterior(color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  // Début du chemin avec le premier point
  ctx.moveTo(pathPixels[0].x, pathPixels[0].y);

  // Ajout de chaque point au chemin
  for (let i = 1; i < pathPixels.length; i++) {
    ctx.lineTo(pathPixels[i].x, pathPixels[i].y);
  }

  // Fermer le chemin pour relier le dernier point au premier
  ctx.closePath();
  ctx.fill(); // Remplir l'intérieur du contour
}

let shouldDrop = false; // État pour déclencher la chute des points
let dropStartTime = null; // Timestamp pour enregistrer le début du délai
const dropDelay = 2000;

function update(deltaTime) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (points.length >= 85) {
    fillPathInterior("white");

    if (!shouldDrop) {
      shouldDrop = true;
      dropStartTime = Date.now();
    }
  }

  if (shouldDrop) {
    ctx.fillStyle = "white";
    const elapsedTime = Date.now() - dropStartTime;

    points.forEach((point) => {
      const pushForce = 0.1;
      point.vx += (point.x - canvas.width / 2) * deltaTime * pushForce;
      point.vy += (point.y - canvas.height / 2) * deltaTime * pushForce;
      point.vy += 10 * deltaTime;
    });

    points = points.filter(
      (point) =>
        point.y > 0 &&
        point.y < canvas.height &&
        point.x > 0 &&
        point.x < canvas.width
    );

    if (points.length === 0) {
      finish(); // Call finish() when all points are off-screen
      return;
    }
  } else {
    drawTextAndExtractPath();
    ctx.fillStyle = "white";

    points.sort((a, b) => a.positionOnLine - b.positionOnLine);
    points.forEach((point, index) => {
      movePointToPath(point);
      const nextId = math.repeat(index + 1, points.length);
      pushAlongLine(point, points[nextId]);
      updateAlongLine(point, deltaTime);
    });
  }
  points.forEach((point) => {
    point.x += point.vx;
    point.y += point.vy;
  });
  drawPoints();
}

canvas.addEventListener("click", handleMouseClick);

resizeCanvas();
drawTextAndExtractPath();

run(update);

export const deltaWrapped = (a1, a2, range) => {
  let diff = math.mod(a2 - a1, range);
  if (diff > range / 2) diff -= range;
  return diff;
};
