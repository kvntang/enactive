<template>
  <div ref="canvasContainer" class="canvas-container"></div>
</template>

<script setup lang="ts">
import p5 from "p5";
import { onMounted, onUnmounted, ref } from "vue";
import { fetchy } from "../../utils/fetchy";

interface ImageDoc {
  author: string;
  parent: string; // Parent ImageDoc ID
  coordinate: string; // stored as x, y
  prompt: string;
  type: string;
  step: string;
  originalImage: string;
  steppedImage: string;
  promptedImage: string;
  _id: string;
  p5Image?: p5.Image;
  caption: string;
  promptList: string;
}

const props = defineProps<{
  images: ImageDoc[];
}>();

const emit = defineEmits(["refreshImages"]);

const canvasContainer = ref(null);

/**
 * Create a new ImageDoc.
 *
 * @param parentId - The ID of the parent ImageDoc.
 * @param coordinate - The coordinate of the image in the 2D canvas.
 * @param type - The type of the image ("noise" or "denoise").
 * @param step - The step of the image in the prompt.
 * @param promptIndex - The prompt index calculated from angle deviation.
 * @returns The created ImageDoc's data.
 */
const createImageDoc = async (parentId: string, coordinate: string, type: string, step: string, promptIndex: number): Promise<ImageDoc | null> => {
  try {
    const authorId = "mocked-author-id"; // Mocked user
    const response = await fetchy("/api/images", "POST", {
      body: {
        author: authorId,
        parent: parentId,
        coordinate,
        type,
        step,
        prompt: promptIndex.toString(),
        originalImage: "",
        steppedImage: "",
        promptedImage: "",
        caption: "",
        promptList: "",
      },
    });
    console.log(`ImageDoc created successfully! Coordinate: ${coordinate}, Type: ${type}, Step: ${step}, Prompt Index: ${promptIndex}`);
    emit("refreshImages"); // Let the parent know to refresh the images
    return response as ImageDoc; // Return the created ImageDoc
  } catch (error) {
    console.error("Error creating ImageDoc:", error);
    return null;
  }
};

/**
 * Function to set the index logic.
 * The type determines the ordering of the index, which will be mapped to the similarity of the prompted word.
 */
function getPromptIndex(type: string, snappedAngleDegrees: number) {
  let promptIndex = 0;

  if (type === "noise") {
    if (snappedAngleDegrees === 0) {
      promptIndex = 0;
    } else if (snappedAngleDegrees > 0 && snappedAngleDegrees <= 180) {
      // Upper circle
      promptIndex = Math.ceil(snappedAngleDegrees / 10) * 2 - 1; // Converts 10° to 1, 20° to 3, etc.
    } else if (snappedAngleDegrees > 180) {
      // Lower circle
      promptIndex = Math.ceil((360 - snappedAngleDegrees) / 10) * 2;
    }
  } else if (type === "denoise") {
    if (snappedAngleDegrees === 180) {
      promptIndex = 0;
    } else if (snappedAngleDegrees < 180) {
      // Upper circle
      promptIndex = Math.ceil((180 - snappedAngleDegrees) / 10) * 2 - 1;
    } else if (snappedAngleDegrees > 180) {
      // Lower circle
      promptIndex = Math.ceil((snappedAngleDegrees - 180) / 10) * 2;
    }
  }

  // Return the calculated promptIndex
  return { promptIndex: Math.floor(promptIndex) };
}

//--------------------------------------------------------------------------------------------------------------

onMounted(() => {
  if (canvasContainer.value) {
    const sketch = new p5((p) => {
      // Variables
      let point: any; // Represents the moving square (for shooting)
      let isDraggingNew = false; // Flag for dragging to create new ImageDoc
      let isPanning = false;

      let staticPositions: {
        pos: p5.Vector;
        color: p5.Color;
        type: string;
        step: number;
        promptIndex: number;
        _id?: string;
        originalImage: string;
        parent_id?: string;
        p5Image?: p5.Image;
        caption: string;
        promptList: string;
      }[] = [];

      let currentColor: p5.Color;
      let initialPosition: p5.Vector;
      let initialDragDirection: "right" | "left" | null = null; // Determines noise or denoise

      // Camera variables
      let camPos = p.createVector(0, 0); // Camera position for panning
      let scaleFactor = 1;
      const minScale = 0.5;
      const maxScale = 2;
      let translateX = 0;
      let translateY = 0;
      let panStartX = 0;
      let panStartY = 0;
      let panStartTranslateX = 0;
      let panStartTranslateY = 0;

      // Selected parent ID for creating new ImageDocs
      let selectedParentId: string | null = null;

      //0. Conversion
      const stepFactor = 30;

      //-------------------SETUP----------------------------------------------------------------------------
      p.setup = async () => {
        const canvasWidth = p.windowWidth - 40;
        const canvasHeight = p.windowHeight - 120;
        const canvas = p.createCanvas(canvasWidth, canvasHeight);
        canvas.parent(canvasContainer.value);
        ///1. Initialize the first ImageDoc if staticPositions is empty
        // Initival Vector
        initialPosition = p.createVector(0, 0); // Start at (0, 0) in world coordinates
        camPos = initialPosition.copy(); // Center camera on initial position

        // Create New
        if (props.images.length === 0) {
          console.log("waiting for user to upload an image");
        } else {
          // 2. Load database initial static positions from props

          props.images.forEach((image) => {
            let parentPos = new p.createVector(0, 0);
            let parentAngle = 0;

            if (image.parent) {
              const parent = staticPositions.find((sp) => sp._id === image.parent);
              if (parent) {
                parentPos = parent.pos.copy();
                parentAngle = Math.atan2(-(parent.pos.y - parentPos.y), -(parent.pos.x - parentPos.x));
                parentAngle = p.degrees(parentAngle);
                if (parentAngle < 0) parentAngle += 360;
              }
            }

            let snappedAngleDegrees = 0;
            if (image.type === "noise") {
              if (image.prompt === "0") snappedAngleDegrees = 0;
              else if (parseInt(image.prompt) % 2 === 1) snappedAngleDegrees = ((parseInt(image.prompt) + 1) / 2) * 10;
              else snappedAngleDegrees = 360 - (parseInt(image.prompt) / 2) * 10;
            } else {
              if (image.prompt === "0") snappedAngleDegrees = 180;
              else if (parseInt(image.prompt) % 2 === 1) snappedAngleDegrees = 180 - ((parseInt(image.prompt) + 1) / 2) * 10;
              else snappedAngleDegrees = 180 + (parseInt(image.prompt) / 2) * 10;
            }

            snappedAngleDegrees = (snappedAngleDegrees + parentAngle) % 360;

            const step = parseFloat(image.step) * stepFactor;
            const angleRadians = p.radians(snappedAngleDegrees);
            const x = parentPos.x + step * Math.cos(angleRadians);
            const y = parentPos.y + step * Math.sin(angleRadians);

            let color = image.type === "noise" ? p.color(255, 0, 0) : p.color(0, 0, 255);

            staticPositions.push({
              pos: p.createVector(x, y),
              color,
              type: image.type,
              step: step,
              promptIndex: Number(image.prompt),
              _id: image._id,
              parent_id: image.parent,
              originalImage: image.originalImage,
              p5Image: image.originalImage ? p.loadImage(image.originalImage) : null,
              caption: image.caption,
              promptList: image.promptList,
            });
          });

          // Automatically select the last image as the parent
          if (props.images.length > 0) {
            selectedParentId = props.images[props.images.length - 1]._id;
            console.log(`Selected parent ID set to: ${selectedParentId}`);
          }
        }

        // Initialize point at the selected parent's position
        const parentPos = getSelectedParentPosition();
        point = {
          pos: parentPos.copy(),
          radius: 20,
          isMoving: false, // Flag to indicate movement towards final position
          finalPos: null, // Target position after move
          step: 0, // Original pixel length
          type: "", // "noise" or "denoise"
          promptIndex: 0, // Calculated from angle
        };
        currentColor = p.color(0, 0, 255); // Set initial color to blue (denoise)
      };

      /**
       * Convert mouse coordinates to world coordinates considering camera transformations.
       */
      function getMouseWorld() {
        return p.createVector((p.mouseX - p.width / 2 - translateX) / scaleFactor + camPos.x, (p.mouseY - p.height / 2 - translateY) / scaleFactor + camPos.y);
      }

      //-------------------DRAW----------------------------------------------------------------------------
      p.draw = () => {
        p.background(0);

        p.push();
        // Apply camera transformations
        p.translate(p.width / 2, p.height / 2);
        p.scale(scaleFactor);
        p.translate(translateX, translateY);

        // Draw lines based on parent-child relationships
        const idToPosition: { [key: string]: p5.Vector } = {};
        staticPositions.forEach((sp) => {
          if (sp._id) idToPosition[sp._id] = sp.pos;
        });

        staticPositions.forEach((sp) => {
          if (sp.parent_id && idToPosition[sp.parent_id]) {
            const parentPos = idToPosition[sp.parent_id];

            // Draw the connecting line
            p.stroke(150);
            p.line(parentPos.x, parentPos.y, sp.pos.x, sp.pos.y);

            // Calculate the midpoint
            const midX = (parentPos.x + sp.pos.x) / 2;
            const midY = (parentPos.y + sp.pos.y) / 2;

            // Render the promptIndex at the midpoint
            p.noStroke();
            p.fill(255); // Text color
            p.textAlign(p.CENTER, p.CENTER);
            p.text(sp.step, midX, midY);
          }
        });

        // Draw all static positions
        staticPositions.forEach((sp) => {
          p.push();
          p.fill(sp.color);
          p.stroke(
            sp._id === selectedParentId ? 255 : 0,
            sp._id === selectedParentId ? 255 : 0,
            0,
            sp._id === selectedParentId ? 255 : 0
          ); 
        p.strokeWeight(1);
        p.rectMode(p.CENTER);

        if (sp.p5Image) {
            p.imageMode(p.CENTER);
            p.image(sp.p5Image, sp.pos.x, sp.pos.y, 70, 70); // Display image
            p.noFill();
            p.rect(sp.pos.x, sp.pos.y, 70, 70);
          } else {
            p.rect(sp.pos.x, sp.pos.y, 70, 70); // Fallback to rectangle
          }
          p.pop();

          p.fill(255);
          p.textAlign(p.CENTER, p.CENTER);

          // In draw function, modify the promptList parsing:-------------------------------------------------
          if (sp.promptList) {
            try {
              const cleanedPromptList = sp.promptList.replace(/^"|"$/g, ""); // Remove surrounding quotes
              const prompts = cleanedPromptList.split(",").map(word => word.trim());

              const promptWord = prompts[sp.promptIndex]; //pick the right word
            } catch (e) {
              console.log(`Error parsing promptList for ImageDoc ID: ${sp._id}`);
            } 
            // display caption at the bottom 
            p.textSize(15);     
            p.textAlign(p.CENTER, p.TOP);
            p.textWrap(p.WORD);  // Wrap by word (use p.CHAR for character wrapping)
            const maxTextWidth = 140;  // Set maximum width for wrapping
            p.text(sp.caption, sp.pos.x - maxTextWidth/2, sp.pos.y + 50, maxTextWidth);
          }

        });

        // Draw the moving point when dragging or moving-------------------------------------------------
        // if (isDraggingNew || point.isMoving) {
        //   p.fill(currentColor);
        //   p.stroke(255);
        //   p.rectMode(p.CENTER);
        //   p.rect(point.pos.x, point.pos.y, 70, 70);
        // }

        // Dragging feedback for creating new ImageDoc
        if (isDraggingNew) {
          const mouseWorld = getMouseWorld();
          const dragVector = p5.Vector.sub(mouseWorld, point.pos);
          const dragDistance = dragVector.mag();
          const dynamicRadius = Math.max(dragDistance, 50);

          // Draw original circle visualization
          p.stroke(100);
          p.noFill();
          p.ellipse(point.pos.x, point.pos.y, dynamicRadius * 2);

          // Draw horizontal reference line
          p.stroke(100, 100, 100);
          p.line(point.pos.x - dynamicRadius, point.pos.y, point.pos.x + dynamicRadius, point.pos.y);

          // Calculate angle from horizontal
          let angleRadians = Math.atan2(dragVector.y, dragVector.x);
          let angleDegrees = p.degrees(angleRadians);

          // Snap angle to nearest 10 degrees
          let angleIncrement = 10;
          let snappedAngleDegrees = Math.round(angleDegrees / angleIncrement) * angleIncrement;

          // Normalize snappedAngleDegrees to be within 0-360
          if (snappedAngleDegrees >= 360) snappedAngleDegrees -= 360;
          if (snappedAngleDegrees < 0) snappedAngleDegrees += 360;

          let snappedAngleRadians = p.radians(snappedAngleDegrees);

          // The shooting direction should be opposite to the drag direction
          let direction = p.createVector(-Math.cos(snappedAngleRadians), -Math.sin(snappedAngleRadians)).mult(dynamicRadius);

          // Draw the launch line
          p.stroke(255);
          let lineEnd = p5.Vector.add(point.pos, direction);
          p.line(point.pos.x, point.pos.y, lineEnd.x, lineEnd.y);


          // Draw the angle index
          const { promptIndex } = getPromptIndex(point.type, snappedAngleDegrees);
          const lastImage = staticPositions[staticPositions.length - 1]; 
          const cleanedPromptList = lastImage.promptList.replace(/^"|"$/g, ""); // Remove surrounding quotes
          const prompts = cleanedPromptList.split(",").map(word => word.trim());
          const promptWord = prompts[promptIndex];
          const gridSize = 70; 
          const newY = lastImage.pos.y + 50; // Define newY
          p.textSize(25);
          p.fill(255);
          p.text(promptWord, lineEnd.x, lineEnd.y);
          p.text(point.type, point.pos.x, point.pos.y - dynamicRadius - 30);
        }

        p.pop();

        // Point movement towards final position
        if (point.isMoving) {
          let moveVector = p5.Vector.sub(point.finalPos, point.pos);
          let distance = moveVector.mag();
          let speed = 10; // Adjust speed as needed

          if (distance < speed) {
            // Close enough to final position
            point.pos = point.finalPos.copy();
            point.isMoving = false;

            // Add to static positions with the actual _id from the created ImageDoc
            // Assuming that the ImageDoc has been created and props.images have been refreshed
            // Find the newly created ImageDoc based on coordinates
            const newImage = props.images.find((img) => img.coordinate === `${Math.round(point.pos.x)},${Math.round(point.pos.y)}`);

            if (newImage) {
              staticPositions.push({
                pos: p.createVector(point.pos.x, point.pos.y),
                color: newImage.type === "noise" ? p.color(255, 0, 0) : p.color(0, 0, 255),
                type: newImage.type,
                step: Number(newImage.step),
                promptIndex: Number(newImage.prompt),
                _id: newImage._id,
                parent_id: newImage.parent,
                originalImage: newImage.originalImage,
                p5Image: newImage.originalImage ? p.loadImage(newImage.originalImage) : null,
                caption: newImage.caption,
                promptList: newImage.promptList,
              });

              // Automatically select the new ImageDoc as the parent
              selectedParentId = newImage._id;
              console.log(`New parent selected: ${selectedParentId}`);
            } else {
              console.error("New ImageDoc not found in props.images. Ensure that 'refreshImages' emits correctly.");
            }
          } else {
            moveVector.setMag(speed);
            point.pos.add(moveVector);
          }
        }
      };

      // Mouse interaction functions
      p.mousePressed = (event: MouseEvent) => {
        if (mouseInCanvas()) {
          if (p.keyIsDown(p.SHIFT)) { // Ensure SHIFT is pressed
            isPanning = true;
            panStartX = p.mouseX;
            panStartY = p.mouseY;
            panStartTranslateX = translateX;
            panStartTranslateY = translateY;
            return; // Prevent other interactions when panning
          }

          // Existing shooting logic
          const selectedParent = staticPositions.find((sp) => sp._id === selectedParentId);
          if (selectedParent) {
            const parentScreenPos = screenPos(selectedParent.pos);
            const distance = p.dist(p.mouseX, p.mouseY, parentScreenPos.x, parentScreenPos.y);
            if (distance < 20 * scaleFactor) {
              isDraggingNew = true;
              point.pos = selectedParent.pos.copy();
              console.log(`Started shooting from parent ID: ${selectedParentId}`);
            }
          }
        }
      };

      p.mouseDragged = (event: MouseEvent) => {
        if (isPanning) {
          let dx = (p.mouseX - panStartX) / scaleFactor;
          let dy = (p.mouseY - panStartY) / scaleFactor;
          translateX = panStartTranslateX + dx;
          translateY = panStartTranslateY + dy;
          event.preventDefault();
        }

        // Dragging to create new ImageDoc
        if (isDraggingNew) {
          const mouseWorld = getMouseWorld();
          const dragVector = p5.Vector.sub(mouseWorld, point.pos);

          // Determine type based on shooting direction
          // Lock the initial drag direction based on the horizontal movement
          if (!initialDragDirection) {
            if (dragVector.x > 20) {
              initialDragDirection = "right";
              currentColor = p.color(255, 0, 0); // Red for noise
              point.type = "noise";
              console.log("Shooting type set to 'noise'");
            } else if (dragVector.x < -20) {
              initialDragDirection = "left";
              currentColor = p.color(0, 0, 255); // Blue for denoise
              point.type = "denoise";
              console.log("Shooting type set to 'denoise'");
            }
          }
        }
      };

      p.mouseReleased = async () => {
        if (isPanning) {
          isPanning = false;
          console.log("Stopped panning");
          return;
        }

        // Finish dragging to create new ImageDoc
        if (isDraggingNew) {
          isDraggingNew = false;

          // Use the locked initial drag direction to finalize the type
          const type = initialDragDirection === "right" ? "noise" : "denoise";
          point.type = type;

          // Reset drag direction for the next drag
          initialDragDirection = null;

          const mouseWorld = getMouseWorld();
          const dragVector = p5.Vector.sub(mouseWorld, point.pos);

          // Calculate angle from horizontal
          let angleRadians = Math.atan2(dragVector.y, dragVector.x);
          let angleDegrees = p.degrees(angleRadians);

          // Snap angle to nearest 10 degrees
          let angleIncrement = 10;
          let snappedAngleDegrees = Math.round(angleDegrees / angleIncrement) * angleIncrement;

          // Normalize snappedAngleDegrees to be within 0-360
          if (snappedAngleDegrees >= 360) snappedAngleDegrees -= 360;
          if (snappedAngleDegrees < 0) snappedAngleDegrees += 360;

          let finalPromptIndex = 0;

          // Set color of latest box
          if (point.type == "denoise") {
            currentColor = p.color(0, 0, 255); // blue "denoise"
          } else {
            currentColor = p.color(255, 0, 0); // Red for "noise"
          }

          // Set the step as the magnitude of the drag vector
          let step = dragVector.mag();
          let convertedStep = Math.round(step / stepFactor);

          // Calculate movement direction (opposite to drag direction)
          let movementDirection = p.createVector(-Math.cos(p.radians(snappedAngleDegrees)), -Math.sin(p.radians(snappedAngleDegrees))).setMag(step);

          // Calculate final position
          let finalPos = p5.Vector.add(point.pos, movementDirection);

          // Assign final position and properties to point
          point.finalPos = finalPos.copy();
          const { promptIndex } = getPromptIndex(point.type, snappedAngleDegrees);
          finalPromptIndex = promptIndex;
          point.promptIndex = finalPromptIndex;
          point.step = convertedStep;
          point.isMoving = true;

          // Create ImageDoc in the backend
          const coordinate = `${Math.round(finalPos.x)},${Math.round(finalPos.y)}`;
          const stepString = convertedStep.toString();

          const parentId = selectedParentId;

          if (!parentId) {
            console.error("Parent ID is undefined. Skipping ImageDoc creation.");
            return;
          }

          console.log(`Parent ID is: ${parentId}`);

          const createdImageDoc = await createImageDoc(parentId, coordinate, point.type, stepString, point.promptIndex);

          if (!createdImageDoc) {
            console.error("Failed to create new ImageDoc.");
            return;
          }

          // The new ImageDoc will be added to staticPositions in the draw loop
          // and the parent will be updated automatically
        }
      };

      p.doubleClicked = () => {
        if (mouseInCanvas()) {
          let clickedBox = null;
          for (let i = staticPositions.length - 1; i >= 0; i--) {
            const sp = staticPositions[i];
            const screenPosition = screenPos(sp.pos);
            if (p.dist(p.mouseX, p.mouseY, screenPosition.x, screenPosition.y) < 20 * scaleFactor) {
              clickedBox = sp;
              break;
            }
          }

          if (clickedBox) {
            selectedParentId = clickedBox._id ?? null;
            console.log(`Selected parent ID: ${selectedParentId}`);
          }
        }
      };

      p.mouseWheel = (event: WheelEvent) => {
        if (mouseInCanvas()) {
          // Check if Ctrl or Cmd key is pressed for zooming
          if (event.ctrlKey || event.metaKey) {
            // Zooming
            let zoomAmount = event.deltaY * -0.001;
            scaleFactor += zoomAmount;
            scaleFactor = p.constrain(scaleFactor, minScale, maxScale);

            // Adjust translateX and translateY to keep the focus on the mouse position
            let mouseXWorld = (p.mouseX - translateX - p.width / 2) / scaleFactor;
            let mouseYWorld = (p.mouseY - translateY - p.height / 2) / scaleFactor;
            translateX -= mouseXWorld * zoomAmount;
            translateY -= mouseYWorld * zoomAmount;

            // Prevent default zooming behavior
            event.preventDefault();
          }
        }
      };

      p.keyPressed = () => {
        if (p.key === "Escape" && isDraggingNew) {
          isDraggingNew = false;
          initialDragDirection = null;
          point.isMoving = false;
          console.log("Drag operation canceled.");
        }
      };

      p.windowResized = () => {
        const canvasWidth = p.windowWidth - 70;
        const canvasHeight = p.windowHeight - 120;
        p.resizeCanvas(canvasWidth, canvasHeight);
      };

      function mouseInCanvas() {
        return p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height;
      }

      /**
       * Get the screen position of a world coordinate
       */
      function screenPos(worldPos: p5.Vector) {
        let x = (worldPos.x + translateX) * scaleFactor + p.width / 2;
        let y = (worldPos.y + translateY) * scaleFactor + p.height / 2;
        return { x, y };
      }

      /**
       * Get the position of the currently selected parent.
       */
      function getSelectedParentPosition(): p5.Vector {
        const parent = staticPositions.find((sp) => sp._id === selectedParentId);
        return parent ? parent.pos.copy() : initialPosition.copy();
      }
    });

    // Cleanup p5 instance on component unmount
    onUnmounted(() => {
      sketch.remove();
    });
  }
});
</script>

<style scoped>
.canvas-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px;
  padding: 20px;
  background: #000000;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgb(0, 0, 0);
  overflow: hidden;
}

canvas {
  display: block;
}
</style>