import { createEngine } from "../../shared/engine.js";
import { Spring } from "./Spring.js";

const { renderer, input, math, run, finish } = createEngine();
const { ctx, canvas } = renderer;
const gradientSquareSize = 100;

let mouseXpercentage = 0;
let mouseYpercentage = 0;

let spring = new Spring(0, 0.1, 0.4);

const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

// const opacitySlowdownFactor = 0.0000005;

canvas.addEventListener("mousemove", (event) => {
  mouseXpercentage = Math.round((event.pageX / windowWidth) * 100);
  mouseYpercentage = Math.round((event.pageY / windowHeight) * 100);
});

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  spring.update(mouseYpercentage);

  const mouseY = (spring.value / 100) * canvas.height;

  // Dégradé depuis le haut jusqu'à la position Y du curseur
  const backgroundGradient = ctx.createLinearGradient(0, 0, 0, mouseY);
  backgroundGradient.addColorStop(0, "green");
  backgroundGradient.addColorStop(1, "pink");

  ctx.fillStyle = backgroundGradient;
  ctx.fillRect(0, 0, canvas.width, mouseY);

  // Transition douce de l'opacité pour le texte
  // let targetOpacity = 0;
  // if (mouseYpercentage > 35) {
  //   targetOpacity = (mouseYpercentage - 35) / 35;
  // }

  // let currentOpacity = Math.min(targetOpacity, 1);
  // currentOpacity =
  //   currentOpacity - (currentOpacity - targetOpacity) * opacitySlowdownFactor;

  // ctx.globalAlpha = currentOpacity;

  // Dessin du texte "3"
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

  // Rectangle noir depuis le bas jusqu'à la position Y du curseur (placé tout devant)
  ctx.globalCompositeOperation = "source-over"; // S'assurer d'être dans le mode de composition normal
  ctx.fillStyle = "black";
  ctx.fillRect(0, mouseY, canvas.width, canvas.height - mouseY);
}

run(update);
