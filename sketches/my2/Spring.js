export class Spring {
  constructor(initialValue, springConstant, dampingFactor) {
    this.value = initialValue;
    this.springConstant = springConstant;
    this.dampingFactor = dampingFactor;
    this.velocity = 3;
  }

  update(target) {
    const force = (target - this.value) * this.springConstant;
    this.velocity += force;
    this.velocity *= this.dampingFactor;
    this.value += this.velocity;
  }
}
