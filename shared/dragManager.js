export class DragManager {

    constructor() {

        this.dragObjects = []
    }

    createDragObject({ target, isOverlapping, onStartDrag, onStopDrag }) {

        const obj = {
            target: target,
            isOverlapping: isOverlapping,
            onStartDrag: onStartDrag,
            onStopDrag: onStopDrag,
            isGrabbed: false,
            isOver: false
        }
        this.dragObjects.push(obj)
        return obj
    }

    update(mouseX, mouseY, mouseIsPressed) {

        for (const obj of this.dragObjects) {

            let overlapping
            if (obj.isOverlapping)
                overlapping = obj.isOverlapping(mouseX, mouseY)
            else
                overlapping = dist(obj.target.positionX, obj.target.positionY, mouseX, mouseY) < (obj.target.radius || 30)

            obj.isOver = overlapping;
        }
        if (this.currentDragObject) {

            // release object if not pressed
            if (!mouseIsPressed) {
                if (this.currentDragObject.onStopDrag)
                    this.currentDragObject.onStopDrag(this.currentDragObject.target)
                this.currentDragObject.isGrabbed = false
                this.currentDragObject = undefined
            }
        } else {
            // try find newly grabbed object
            for (const obj of this.dragObjects) {

                if (mouseIsPressed && obj.isOver) {

                    obj.isGrabbed = true
                    obj.grabOffsetX = obj.target.positionX - mouseX
                    obj.grabOffsetY = obj.target.positionY - mouseY
                    this.currentDragObject = obj
                    if (this.currentDragObject.onStartDrag)
                        this.currentDragObject.onStartDrag(this.currentDragObject.target)
                    break

                }
            }
        }

        // update grabbed object, if it exists
        if (this.currentDragObject) {
            this.currentDragObject.target.positionX = mouseX + this.currentDragObject.grabOffsetX
            this.currentDragObject.target.positionY = mouseY + this.currentDragObject.grabOffsetY
        }
    }
}
export const len = (x, y) => Math.sqrt(x * x + y * y)
export const dist = (x1, y1, x2, y2) => len(x1 - x2, y1 - y2)