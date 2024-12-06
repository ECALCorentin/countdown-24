import { createEngine } from "../../shared/engine.js";
import { Spring } from "./Spring.js";

const { renderer, input, math, run, finish } = createEngine();
const { ctx, canvas } = renderer;

// Variables globales
let mouseXpercentage = 0;
let mouseYpercentage = 0;
let isDragging = false;
let objectPositionY = canvas.height / 2;
let velocityY = 0;
let dragOffsetY = 0;
let opacity = 0;
let startTime = null; // Pour suivre le début du délai

const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

const objectRadius = 100;
const textHeight = 2900;
const textMargin = textHeight / 3;

// Charger les images
const images = Array(9)
  .fill(null)
  .map(() => new Image());
images.forEach((img, i) => (img.src = `0_step_${i}.png`));

let currentImageIndex = 0;
let isBouncing = false;

// Vérifier que toutes les images sont chargées
let imagesLoaded = false;
Promise.all(
  images.map((image) => new Promise((resolve) => (image.onload = resolve)))
).then(() => {
  imagesLoaded = true;
  startTime = Date.now(); // Démarrer le chronomètre lorsque les images sont chargées
});

// Gestion des événements de souris
canvas.addEventListener("mousemove", (event) => {
  mouseXpercentage = Math.round((event.pageX / windowWidth) * 100);
  mouseYpercentage = Math.round((event.pageY / windowHeight) * 100);
  if (isDragging) {
    objectPositionY = event.pageY - dragOffsetY;
  }
});

canvas.addEventListener("mousedown", (event) => {
  const distance = Math.hypot(
    event.pageX - canvas.width / 2,
    event.pageY - objectPositionY
  );
  if (distance < objectRadius) {
    isDragging = true;
    velocityY = 0;
    dragOffsetY = event.pageY - objectPositionY;
  }
});

canvas.addEventListener("mouseup", () => {
  isDragging = false;
});

// Mise à jour de la scène
function update() {
  if (!imagesLoaded || startTime === null) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!isDragging) {
    velocityY += 0.5;
    objectPositionY += velocityY;

    if (objectPositionY > canvas.height - textMargin) {
      objectPositionY = canvas.height - textMargin;

      if (velocityY > 25 && currentImageIndex < images.length - 1) {
        currentImageIndex++;
      }

      velocityY *= -0.8;
      isBouncing = true;
    } else {
      isBouncing = false;
    }
  }

  // Gestion de l'opacité pour la première image avec délai
  if (currentImageIndex === 0 && opacity < 1) {
    const elapsedTime = Date.now() - startTime; // Temps écoulé depuis le chargement
    if (elapsedTime > 2000) {
      // Délai de 2 secondes
      opacity += 0.01; // Augmentation progressive de l'opacité
    }
  }

  // Affichage de l'image actuelle
  if (images[currentImageIndex].complete) {
    ctx.globalAlpha = currentImageIndex === 0 ? opacity : 1;
    ctx.drawImage(
      images[currentImageIndex],
      canvas.width / 2 - images[currentImageIndex].width / 2,
      objectPositionY - images[currentImageIndex].height / 2
    );
    ctx.globalAlpha = 1;
  }
}

run(update);
