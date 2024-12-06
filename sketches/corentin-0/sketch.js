import { createEngine } from "../../shared/engine.js";
import { Spring } from "./Spring.js";

const { renderer, input, math, run, finish, audio } = createEngine();
const { ctx, canvas } = renderer;

let mouseXpercentage = 0;
let mouseYpercentage = 0;

let spring = new Spring(0, 0.1, 0.4);
let isDragging = false; // To know if the object is being dragged
let objectPositionY = canvas.height / 2; // Initial position in the middle of the screen
let velocityY = 0; // Fall velocity
let dragOffsetY = 0; // Offset between the mouse and the object during drag

const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

// Detection radius to grab the object
const objectRadius = 100;

// Text size
const textHeight = 1900; // Font size in pixels
const textMargin = textHeight / 3; // Margin to prevent text overflow

const crackSound = await audio.load("./crack_sound.wav");

// Load images
const images = [
  new Image(),
  new Image(),
  new Image(),
  new Image(),
  new Image(),
  new Image(),
  new Image(),
  new Image(),
  new Image(),
];

// Assign sources to each image
images[0].src = "0_step_0.png";
images[1].src = "0_step_1.png";
images[2].src = "0_step_2.png";
images[3].src = "0_step_3.png";
images[4].src = "0_step_4.png";
images[5].src = "0_step_5.png";
images[6].src = "0_step_6.png";
images[7].src = "0_step_7.png";
images[8].src = "0_step_8.png";

let currentImageIndex = 0; // Current image to display
let isBouncing = false; // Variable to check if a bounce occurred

// Check that all images are loaded
let imagesLoaded = false;
Promise.all(
  images.map((image) => {
    return new Promise((resolve) => {
      image.onload = resolve;
    });
  })
).then(() => {
  imagesLoaded = true; // Mark images as fully loaded
});

// Track mouse position
canvas.addEventListener("mousemove", (event) => {
  mouseXpercentage = Math.round((event.pageX / windowWidth) * 100);
  mouseYpercentage = Math.round((event.pageY / windowHeight) * 100);
  if (isDragging) {
    objectPositionY = event.pageY - dragOffsetY; // Follow the mouse position
  }
});

// Start dragging
canvas.addEventListener("mousedown", (event) => {
  const distance = Math.sqrt(
    Math.pow(event.pageX - canvas.width / 2, 2) +
      Math.pow(event.pageY - objectPositionY, 2)
  );
  if (distance < objectRadius) {
    isDragging = true;
    velocityY = 0; // Reset velocity
    dragOffsetY = event.pageY - objectPositionY; // Calculate offset
  }
});

canvas.addEventListener("mouseup", () => {
  isDragging = false;
});

// Variables for fade-in effect
let opacity = 0; // Initial opacity
const fadeDuration = 1000; // Duration of fade-in in milliseconds
const fadeDelay = 500; // Delay before fade-in starts in milliseconds

let fadeStartTime = null; // Time when fade starts
let isFadingIn = true; // Control whether to fade in the first image

function fadeIn(timestamp) {
  if (!fadeStartTime) fadeStartTime = timestamp; // Initialize fade start time

  const elapsedTime = timestamp - fadeStartTime;
  if (elapsedTime >= fadeDelay) {
    // Calculate the progress of the fade-in (after delay)
    const fadeProgress = Math.min((elapsedTime - fadeDelay) / fadeDuration, 1);
    opacity = fadeProgress; // Update opacity (from 0 to 1)

    // Stop fading in once complete
    if (fadeProgress >= 1) {
      isFadingIn = false;
    }
  }

  // Continue the fade-in animation
  if (isFadingIn) {
    requestAnimationFrame(fadeIn);
  }
}

// Start the fade-in animation
requestAnimationFrame(fadeIn);

// Update the scene
function update() {
  if (!imagesLoaded) return; // Wait for images to load

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!isDragging) {
    velocityY += 0.5; // Acceleration due to gravity
    objectPositionY += velocityY; // Update Y position based on velocity

    // Check for bounce
    if (objectPositionY > canvas.height - textMargin) {
      objectPositionY = canvas.height - textMargin;

      // If velocity is large enough, change the image
      if (velocityY > 25 && currentImageIndex < images.length - 1) {
        currentImageIndex++;
        crackSound.play(); // Play crack sound
      }

      velocityY *= -0.8; // Reduce velocity after a bounce (invert and dampen)
      isBouncing = true;
    } else {
      isBouncing = false; // Reset if the object is no longer bouncing
    }
  }

  // Draw the current image with fade-in effect if it's the first image
  if (images[currentImageIndex].complete) {
    if (currentImageIndex === 0 && isFadingIn) {
      ctx.globalAlpha = opacity; // Apply fade-in opacity
    } else {
      ctx.globalAlpha = 1; // Reset opacity for other images
    }

    ctx.drawImage(
      images[currentImageIndex],
      canvas.width / 2 - images[currentImageIndex].width / 2,
      objectPositionY - images[currentImageIndex].height / 2
    );
  }

  ctx.globalAlpha = 1; // Reset globalAlpha to default after drawing

  // Call finish() when all images are displayed and the object is off-screen
  if (
    currentImageIndex === images.length - 1 &&
    objectPositionY - images[currentImageIndex].height / 2 > canvas.height
  ) {
    finish(); // End the animation
  }
}

run(update);
