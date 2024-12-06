import { createEngine } from "../../shared/engine.js";
import { Spring } from "./Spring.js";

const { renderer, input, math, run, finish, audio } = createEngine();
const { ctx, canvas } = renderer;

const validateSound = await audio.load("validate.wav");

let mouseXpercentage = 0;
let mouseYpercentage = 0;

let spring = new Spring(0, 0.1, 0.4);

const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

let fadeOutProgress = 0; // To control the fade-out progress for the background
let fadeOutStartTime = null; // To store the time when fade-out started
let fadeOutDuration = 1000; // Duration of the fade-out (in ms)

let fadeOutTextProgress = 0; // To control the fade-out progress for the text
let fadeOutTextDelay = 500; // Delay before text starts fading (in ms)

let audioPlayed = false; // Track if audio has already been played
let finished = false; // Track if the finish logic has been executed

canvas.addEventListener("mousemove", (event) => {
  mouseXpercentage = Math.round((event.pageX / windowWidth) * 100);
  mouseYpercentage = Math.round((event.pageY / windowHeight) * 100);

  // Start fade-out when mouseYpercentage reaches 99 and audio has not been played yet
  if (mouseYpercentage >= 99 && fadeOutProgress === 0 && !audioPlayed) {
    fadeOutStartTime = Date.now();
    validateSound.play();
    audioPlayed = true; // Mark the audio as played
  }
});

function update() {
  if (finished) return; // Stop updating if finish() has already been called

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  spring.update(mouseYpercentage);

  const mouseY = (spring.value / 100) * canvas.height;

  // Handle fade-out effect
  if (fadeOutStartTime) {
    let elapsedTime = Date.now() - fadeOutStartTime;
    fadeOutProgress = Math.min(elapsedTime / fadeOutDuration, 1); // Background fade-out progress from 0 to 1

    // Delay fade-out for the text
    let textElapsedTime = Math.max(0, elapsedTime - fadeOutTextDelay);
    fadeOutTextProgress = Math.min(textElapsedTime / fadeOutDuration, 1); // Text fade-out progress from 0 to 1

    // Stop fade-out after the duration
    if (fadeOutProgress === 1 && fadeOutTextProgress === 1 && !finished) {
      finish(); // Call finish() when both fade-outs are complete
      finished = true; // Prevent further updates
      return; // Stop rendering after calling finish
    }
  }

  // Create a background gradient
  const backgroundGradient = ctx.createLinearGradient(0, 0, 0, mouseY);
  backgroundGradient.addColorStop(0, "black");
  backgroundGradient.addColorStop(1, "pink");

  // Apply fade-out effect to the background
  ctx.fillStyle = backgroundGradient;
  ctx.globalAlpha = 1 - fadeOutProgress; // Gradually reduce opacity for the background
  ctx.fillRect(0, 0, canvas.width, mouseY);

  // Reset global alpha for the text fade-out
  ctx.globalAlpha = 1 - fadeOutTextProgress; // Gradually reduce opacity for the text

  // Drawing the text "3"
  ctx.fillStyle = "transparent";
  ctx.font = `${canvas.height}px Helvetica Neue, Helvetica, bold`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("3", canvas.width / 2, canvas.height / 2);

  ctx.globalCompositeOperation = "";
  ctx.fillStyle = "black";
  ctx.fillText("3", canvas.width / 2, canvas.height / 2);

  ctx.globalCompositeOperation = "source-over";

  // Add the fade-out effect to the final white text
  if (mouseYpercentage >= 99) {
    ctx.fillStyle = "white";
    ctx.fillText("3", canvas.width / 2, canvas.height / 2);
  }

  // Restore global alpha for other elements
  ctx.globalAlpha = 1;

  // Black rectangle from the bottom to the mouseY position (in front)
  ctx.globalCompositeOperation = "source-over"; // Ensure normal composition mode
  ctx.fillStyle = "black";
  ctx.fillRect(0, mouseY, canvas.width, canvas.height - mouseY);
}

run(update);
