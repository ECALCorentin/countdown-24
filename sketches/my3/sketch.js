import { createEngine } from "../../shared/engine.js";
import { Spring } from "./Spring.js";

const { renderer, input, math, run, finish } = createEngine();
const { ctx, canvas } = renderer;

let mouseXpercentage = 0;
let mouseYpercentage = 0;

let spring = new Spring(0, 0.1, 0.4);

const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

let fadeOutProgress = 0; // To control the fade-out progress
let fadeOutStartTime = null; // To store the time when fade-out started
let fadeOutDuration = 1000; // Duration of the fade-out (in ms)

canvas.addEventListener("mousemove", (event) => {
  mouseXpercentage = Math.round((event.pageX / windowWidth) * 100);
  mouseYpercentage = Math.round((event.pageY / windowHeight) * 100);

  // Start fade-out when mouseYpercentage reaches 99
  if (mouseYpercentage >= 99 && fadeOutProgress === 0) {
    fadeOutStartTime = Date.now();
  }
});

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  spring.update(mouseYpercentage);

  const mouseY = (spring.value / 100) * canvas.height;

  // Handle fade-out effect
  if (fadeOutStartTime) {
    let elapsedTime = Date.now() - fadeOutStartTime;
    fadeOutProgress = Math.min(elapsedTime / fadeOutDuration, 1); // Fade-out progress from 0 to 1

    // Stop fade-out after the duration
    if (fadeOutProgress === 1) {
      fadeOutStartTime = null; // Reset fade-out
    }
  }

  // Create a background gradient
  const backgroundGradient = ctx.createLinearGradient(0, 0, 0, mouseY);
  backgroundGradient.addColorStop(0, "black");
  backgroundGradient.addColorStop(1, "white");

  // Apply fade-out effect based on fadeOutProgress
  ctx.fillStyle = backgroundGradient;
  ctx.globalAlpha = 1 - fadeOutProgress; // Gradually reduce opacity
  ctx.fillRect(0, 0, canvas.width, mouseY);

  // Drawing the text "3"
  ctx.fillStyle = "transparent";
  ctx.font = `${canvas.height}px Helvetica Neue, Helvetica, bold`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("3", canvas.width / 2, canvas.height / 2);

  ctx.globalCompositeOperation = "difference";
  ctx.fillStyle = "white";
  ctx.fillText("3", canvas.width / 2, canvas.height / 2);

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;

  if (mouseYpercentage >= 99) {
    ctx.fillStyle = "white";
    ctx.fillText("3", canvas.width / 2, canvas.height / 2);
    ctx.save();
  }

  // Black rectangle from the bottom to the mouseY position (in front)
  ctx.globalCompositeOperation = "source-over"; // Ensure normal composition mode
  ctx.fillStyle = "black";
  ctx.fillRect(0, mouseY, canvas.width, canvas.height - mouseY);
}

run(update);
