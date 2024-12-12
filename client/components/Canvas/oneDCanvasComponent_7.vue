<template>
  <div ref="canvasContainer" class="canvas-container"></div>
</template>

<script setup lang="ts">
import { HfInference } from "@huggingface/inference";
import p5 from "p5";
import { onMounted, onUnmounted, ref } from "vue";
import { fetchy } from "../../utils/fetchy";

// Hugging Face Inference instance
const inference = new HfInference("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");

// Define the ImageDoc interface to match the 2D canvas structure
interface ImageDoc {
  author: string;
  parent?: string; // Optional for 1D canvas
  coordinate: string; // stored as x, y
  prompt: string;
  type: string;
  step: string;
  originalImage: string;
  steppedImage: string;
  promptedImage: string;
  _id?: string; // Optional, assigned after creation
  p5Image?: p5.Image; // store preloaded p5.Image
  caption: string;
  promptList: string;
  isLoading?: boolean; // Flag for loading state
}

const props = defineProps<{
  images: ImageDoc[];
}>();

const emit = defineEmits(["refreshImages", "selectImage"]);

const canvasContainer = ref(null);

/**
 * Function to create ImageDoc in the backend
 */
const createImageDoc = async (
  parentId: string,
  coordinate: string,
  type: string,
  step: string,
  promptIndex: number,
  originalImage: string,
  caption: string,
  promptList: string,
): Promise<ImageDoc | null> => {
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
        originalImage,
        steppedImage: "",
        promptedImage: "",
        caption,
        promptList,
      },
    });
    console.log(
      `ImageDoc created successfully! ParentID: ${parentId}, Coordinate: ${coordinate}, Type: ${type}, Step: ${step}, Prompt Index: ${promptIndex}, caption: ${caption}, promptList: ${promptList}`,
    );
    emit("refreshImages"); // Let the parent know to refresh the images
    console.log("refreshed");
    return response as ImageDoc; // Return the created ImageDoc
  } catch (error) {
    console.error("Error creating ImageDoc:", error);
    return null;
  }
};

const generateCaption = async (imageBase64: string): Promise<string> => {
  try {
    const base64Data = imageBase64.split(",")[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = Array.from(byteCharacters, (char) => char.charCodeAt(0));
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "image/jpeg" });

    const result = await inference.imageToText({
      data: blob,
      model: "nlpconnect/vit-gpt2-image-captioning",
    });

    return result.generated_text;
  } catch (error) {
    console.error("Error generating caption:", error);
    return "Failed to generate caption";
  }
};

async function getChatGPTResponse(prompt: string) {
  try {
    const result = await fetchy("/api/chatgpt", "POST", {
      body: { prompt }, // Send the prompt in the body
    });
    return result.response;
  } catch (error) {
    console.error("Error fetching ChatGPT response:", error);
    throw error;
  }
}

async function getStableDiffusionResponse(type: string, steps: number, prompt_word: string, originalImage: string) {
  try {
    // const result = await fetchy("/api/images/process", "POST", {
    //   body: {
    //     type,
    //     steps,
    //     prompt_word,
    //     original_image: originalImage,
    //   },
    // });
    // return result.new_image;
    const response = await fetch("https://app.unaliu.com/api/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: type,
        steps: steps,
        prompt_word: "An artist expression of " + prompt_word,
        original_image: originalImage,
      }),
    });

    console.log(response);

    if (!response.ok) {
      console.error(`Image processing failed with status: ${response.statusText}`);
      throw new Error(`Image processing failed: ${response.statusText}`);
    }

    const jsonResponse = await response.json();

    console.log("Stable Diffusion Response:", jsonResponse);
    return jsonResponse.new_image;
  } catch (error) {
    console.error("Error fetching stable diffusion response:", error);
    throw error;
  }
}

//--------------------------------------------------------------------------------------------------------------
const preventScroll = (e: Event) => e.preventDefault();

onMounted(() => {
  window.addEventListener("wheel", preventScroll, { passive: false });

  if (canvasContainer.value) {
    const sketch = new p5((p) => {
      // Variables
      let staticPositions: {
        pos: p5.Vector;
        color: p5.Color;
        type: string;
        step: number;
        promptIndex: number;
        _id?: string;
        parent_id?: string;
        isAnimating: boolean;
        currentY: number;
        startY?: number;
        targetY?: number;
        animationStartTime?: number;
        animationDuration?: number;
        p5Image?: p5.Image;
        caption?: string;
        promptList: string;
        isLoading?: boolean; // Flag for loading
        spinnerAngle?: number; // Angle for spinner animation
        originalImage?: string; // Add originalImage property
      }[] = [];

      let isDragging = false;
      let isPanning = false;
      let dragStartX = 0;
      let dragStartY = 0;
      let panStartX = 0;
      let panStartY = 0;
      let panStartTranslateX = 0;
      let panStartTranslateY = 0;
      const gridSize = 70;
      const padding = 0;
      const stepDistance = 60;
      let rowOccupancy: { [key: number]: number } = {}; // Track squares in each row
      let baseRowHeight = gridSize + padding;

      // Zoom and pan
      let scaleFactor = 1;
      const minScale = 0.5;
      const maxScale = 2;
      let translateX = 0;
      let translateY = 0;

      let initialPosition: p5.Vector;
      let selectedParentId: string | null = null; // To track the parent for new ImageDocs
      let selectedType: string;

      async function shiftPurplesDown(newY: number) {
        for (let img of staticPositions) {
          if (img.type === "noise" || img.type === "denoise") {
            if (img.currentY >= newY) {
              img.pos.y += gridSize + padding;
              img.currentY = img.pos.y;
              // Animation properties
              img.isAnimating = true;
              img.startY = img.currentY - (gridSize + padding);
              img.targetY = img.currentY;
              img.animationStartTime = p.millis();
              img.animationDuration = 500;
            }
          }
        }
      }

      //-------------------SETUP----------------------------------------------------------------------------
      p.setup = async () => {
        const canvasWidth = p.windowWidth + 100;
        const canvasHeight = p.windowHeight - 120;
        const canvas = p.createCanvas(canvasWidth, canvasHeight);
        canvas.parent(canvasContainer.value);

        p.rectMode(p.CORNER); // Ensure rectMode is CORNER

        // Initialize camera translation to center at (0, 0)
        translateX = canvasWidth / 2 - gridSize; // Start at 0 on X-axis
        translateY = 0; // Start at 0 on Y-axis

        // Preload images for each imagDoc
        for (let imgDoc of props.images) {
          if (imgDoc.originalImage) {
            const img = p.loadImage(imgDoc.originalImage);
            imgDoc.p5Image = img;
          }
        }

        //1. Initialize the first ImageDoc if staticPositions is empty
        // Initival Vector
        initialPosition = p.createVector(0, gridSize);

        // Create New
        if (props.images.length === 0) {
          console.log("waiting for user to upload an image");
        } else {
          // 2. Load database initial static positions from props

          // First, create a map of images by _id
          let imagesById: { [key: string]: ImageDoc } = {};
          props.images.forEach((image) => {
            imagesById[image._id!] = image;
          });

          // Now, we can traverse the images and set positions
          // Start with the root nodes (images without parents)
          let rootImages = props.images.filter((image) => !image.parent);

          let gridSizeWithPadding = gridSize + padding;

          // Function to set positions recursively ----------------------------------------------------
          function setPosition(image: ImageDoc, parentPosition: p5.Vector | null) {
            let color: p5.Color = image.type === "noise" 
              ? p.color(146, 128, 255) 
              : image.type === "denoise" 
                ? p.color(200, 255, 133) 
                : p.color(128, 0, 128);

            let posX: number;
            let posY: number;

            if (parentPosition) {
              // Preserve original type's direction
              posX = parentPosition.x + (image.type === "noise" ? -1 : 1) * Number(image.step) * (gridSize + padding);
              posY = parentPosition.y + gridSize + padding;
            } else {
              posX = initialPosition.x;
              posY = initialPosition.y;
            }

            let pos = p.createVector(posX, posY);

            // **Call shiftPurplesDown for both "noise" and "denoise" types**
            if (image.type === "noise" || image.type === "denoise") {
              shiftPurplesDown(pos.y);
            }

            // assign preloaded p5 image
            const preloadedImage = image.p5Image;

            staticPositions.push({
              pos: pos,
              color,
              type: image.type, // Explicitly preserve original type
              step: Number(image.step),
              promptIndex: Number(image.prompt),
              _id: image._id,
              parent_id: image.parent,
              isAnimating: false,
              currentY: pos.y,
              originalImage: image.originalImage,
              p5Image: preloadedImage,
              caption: image.caption,
              promptList: image.promptList,
              isLoading: false, // Initialize loading state
              spinnerAngle: 0, // Initialize spinner angle
            });

            // Recursively set positions for children
            let children = props.images.filter((img) => img.parent === image._id);
            for (let child of children) {
              setPosition(child, pos);
            }
          }

          for (let rootImage of rootImages) {
            setPosition(rootImage, null);
          }
        }
        // **Log the initial image's information**
        console.log("Loaded Static Positions:", staticPositions);
      };

      //-------------------DRAW----------------------------------------------------------------------------
      p.draw = async () => {
        p.background(255);
  
        // Draw faint light grey dotted background
        const dotSpacing = 30; // Adjust spacing between dots
        const dotSize = 3; // Size of each dot
        p.push();
        p.stroke(200, 200, 200, 120); // Light grey with low opacity
        p.strokeWeight(dotSize); // Use dotSize for strokeWeight
        for (let x = 0; x < p.width; x += dotSpacing) {
          for (let y = 0; y < p.height; y += dotSpacing) {
            p.point(x, y);
          }
        }
        p.pop();

        p.push();
        p.scale(scaleFactor);
        p.translate(translateX, translateY);

        // Draw right-angle lines connecting parent and child boxes
        for (let child of staticPositions) {
          if (child.parent_id) {
            let parent = staticPositions.find((pos) => pos._id === child.parent_id);
            if (parent) {
              // Calculate start (parent) and end (child) positions
              let parentCenterX = parent.pos.x + gridSize / 2;
              let parentCenterY = parent.currentY + gridSize / 2;
              let childCenterX = child.pos.x + gridSize / 2;
              let childCenterY = child.currentY + gridSize / 2;

              // Draw horizontal line from parent to the child's X
              p.stroke(0, 0, 0); // Line color
              p.strokeWeight(1 / scaleFactor);
              p.line(parentCenterX, parentCenterY, childCenterX, parentCenterY);

              // Draw vertical line from the child's X to the child's Y
              p.line(childCenterX, parentCenterY, childCenterX, childCenterY);

              // Draw a triangle to indicate the direction
              let triangleSize = 5 / scaleFactor; // Adjust size based on zoom level
              if (childCenterX > parentCenterX) {
                // Pointing right
                p.fill(255);
                p.triangle(
                  (parentCenterX + childCenterX) / 2 - triangleSize,
                  parentCenterY - triangleSize,
                  (parentCenterX + childCenterX) / 2 - triangleSize,
                  parentCenterY + triangleSize,
                  (parentCenterX + childCenterX) / 2 + triangleSize,
                  parentCenterY,
                );
              } else {
                // Pointing left
                p.fill(255);
                p.triangle(
                  (parentCenterX + childCenterX) / 2 + triangleSize,
                  parentCenterY - triangleSize,
                  (parentCenterX + childCenterX) / 2 + triangleSize,
                  parentCenterY + triangleSize,
                  (parentCenterX + childCenterX) / 2 - triangleSize,
                  parentCenterY,
                );
              }

              // Draw a box at the corner
              let cornerX = childCenterX;
              let cornerY = parentCenterY;

              // Set color based on type
              if (child.type === "noise") {
                p.fill(52, 29, 185); // Red for noise
              } else if (child.type === "denoise") {
                p.fill(140, 255, 0); // Blue for denoise
              }

              // Draw the corner box
              let boxSize = 10 / scaleFactor; // Adjust size based on zoom level
              p.noStroke();
              p.rect(cornerX - boxSize / 2, cornerY - boxSize / 2, boxSize, boxSize);
            }
          }
        }

        // Draw static positions
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(14 / scaleFactor);

        for (let sp of staticPositions) {
          // Handle elastic animation
          if (sp.isAnimating) {
            let t = sp.animationStartTime ? (p.millis() - sp.animationStartTime) / (sp.animationDuration || 1) : 0;
            t = p.constrain(t, 0, 1);
            let easeT = easeOutElastic(t);

            sp.currentY = p.lerp(sp.startY || sp.pos.y, sp.targetY || sp.pos.y, easeT);

            if (t >= 1) {
              sp.isAnimating = false;
              if (sp.targetY !== undefined) {
                sp.pos.y = sp.targetY;
              }
              sp.currentY = sp.targetY !== undefined ? sp.targetY : sp.currentY;
            }
          } else {
            sp.currentY = sp.pos.y;
          }

          let squareColor;
          if (sp._id == sp.parent_id) {
            squareColor =
              sp.type === "noise"
                ? p.color(146, 128, 255) // Horizontal noise
                : p.color(200, 255, 133); // Horizontal denoise
          } else {
            squareColor = sp.type === "noise" 
              ? p.color(52, 29, 185) // Vertical noise
              : p.color(140, 255, 0); // Vertical denoise
          }

          // Determine if the square is selected (last image or selectedParentId)
          const isSelected = sp === staticPositions[staticPositions.length - 1] || sp._id === selectedParentId;

          p.push(); // Save the current drawing state

          if (isSelected) {
            // Set shadow properties for the selected square
            p.drawingContext.shadowOffsetX = 3;
            p.drawingContext.shadowOffsetY = 3;
            p.drawingContext.shadowBlur = 12;
            p.drawingContext.shadowColor = 'rgba(20, 20, 20, 0.08)';
            p.stroke(255, 255, 0); // Yellow color
            p.strokeWeight(2 / scaleFactor);
          } else {
            p.noStroke(); // No stroke for other squares
            // Reset shadow properties
            p.drawingContext.shadowOffsetX = 0;
            p.drawingContext.shadowOffsetY = 0;
            p.drawingContext.shadowBlur = 0;
            p.drawingContext.shadowColor = 'rgba(0, 0, 0, 0)';
          }

          // Draw the preloaded image
          if (sp.p5Image) {
            p.noStroke();
            p.image(sp.p5Image, sp.pos.x, sp.currentY, gridSize, gridSize);

            if (sp._id === selectedParentId) {
              p.stroke(255, 255, 0); // Yellow color
              p.strokeWeight(2 / scaleFactor);
              p.noFill();
              p.rect(sp.pos.x, sp.currentY, gridSize, gridSize);
            }
          } else {
            // Draw the main colored square
            p.fill(squareColor);
            p.rect(sp.pos.x, sp.currentY, gridSize, gridSize); // Colored box
          }

          // Display the prompt index in the middle of the image -------------------------------------------------
          p.fill(255);
          // Display promptList
          if (sp.promptList && sp.promptIndex !== undefined) {
            try {
              // Split the promptList into an array by commas and trim whitespace
              const cleanedPromptList = sp.promptList.replace(/^"|"$/g, ""); // Remove surrounding quotes
              const prompts = cleanedPromptList.split(",").map((word) => word.trim());

              const promptWord = prompts[sp.promptIndex]; // Pick the right word
              // You can display the promptWord if needed
              // Example: p.text(promptWord, sp.pos.x + gridSize / 2, sp.currentY + gridSize + 5);
            } catch (e) {
              console.error(`Error parsing promptList for ImageDoc ID: ${sp._id}`, e);
            }
          }
          // Display the caption at the bottom of the image -------------------------------------------------
          p.textAlign(p.CENTER, p.TOP);
          p.textWrap(p.WORD); // Wrap by word (use p.CHAR for character wrapping)
          const maxTextWidth = 140; // Set maximum width for wrapping
          // Example: p.text(sp.caption, sp.pos.x + gridSize / 2, sp.currentY + gridSize + 10, maxTextWidth);

          p.pop(); // Restore the drawing state
        }

        // Draw loading animations
        for (let sp of staticPositions) {
          if (sp.isLoading) {
            if (sp.type === "noise") {
              p.stroke(140, 255, 0); // Green stroke for "noise"
            } else if (sp.type === "denoise") {
              p.stroke(52, 29, 185); // Blue stroke for "denoise"
            }
            drawSpinner(
              p,
              sp.pos.x + gridSize / 2,
              sp.currentY + gridSize / 2,
              16,
              sp.spinnerAngle || 0
            );
            sp.spinnerAngle = (sp.spinnerAngle || 0) + 5; // Increment angle for rotation
          }
        }

        if (isDragging) {
          // Adjust mouse coordinates for scaling and translation
          let mouseXWorld = (p.mouseX - translateX) / scaleFactor;
          let mouseYWorld = (p.mouseY - translateY) / scaleFactor;
          let dragStartXWorld = (dragStartX - translateX) / scaleFactor;
          let dragStartYWorld = (dragStartY - translateY) / scaleFactor;

          let dragDistanceX = mouseXWorld - dragStartXWorld;
          let dragDistanceY = mouseYWorld - dragStartYWorld;

          let lastImage = staticPositions[staticPositions.length - 1];

          if (Math.abs(dragDistanceY) > Math.abs(dragDistanceX) && dragDistanceY > gridSize / 2) {
            // Vertical dragging (editing prompt index)
            let lineX = lastImage.pos.x + gridSize / 2;
            let lineStartY = lastImage.pos.y + gridSize / 2;

            // Draw drag line centered on the square
            p.stroke(0);
            p.strokeWeight(1 / scaleFactor);
            p.line(lineX, lineStartY, lineX, mouseYWorld);

            // Calculate prompt steps (number of grid units dragged)
            let promptSteps = Math.floor((mouseYWorld - lineStartY) / (gridSize + padding));
            promptSteps = Math.max(1, promptSteps); // Ensure at least one step

            // Calculate new Y position
            let newY = lastImage.pos.y + (gridSize + padding) * promptSteps;

            // Draw drag preview as an outline rectangle
            p.noFill(); 
            if (lastImage.type === "denoise") {
              p.stroke(p.color(200, 255, 133)); // Set stroke color based on state
            } else {
              p.stroke(p.color(52, 29, 185)); // Set stroke color based on state
            }
            p.strokeWeight(1 / scaleFactor); // Consistent stroke weight
            p.rect(lastImage.pos.x, lastImage.pos.y + (gridSize + padding) * promptSteps, gridSize, gridSize);

            // Display prompt index (set based on current promptSteps)
            p.fill(255);
            const cleanedPromptList = lastImage.promptList.replace(/^"|"$/g, ""); // Remove surrounding quotes
            const prompts = cleanedPromptList.split(",").map((word) => word.trim());
            const promptWord = prompts[promptSteps]; // Pick the right word
            if (lastImage.type === "denoise") {
              p.fill(140, 255, 0);
              p.noStroke();
            } else{
              p.fill(52, 29, 185);
              p.noStroke();
            }
            p.text(promptWord, lastImage.pos.x + gridSize * 2, newY + gridSize / 2);
          } else if (Math.abs(dragDistanceX) > gridSize / 2) {
            // Horizontal dragging (noise/denoise)
            let steps = Math.floor(Math.abs(dragDistanceX) / stepDistance);
            let direction = dragDistanceX < 0 ? "noise" : "denoise";

            // Determine new X position
            let newX = lastImage.pos.x + steps * (gridSize + padding) * (direction === "noise" ? -1 : 1);

            // Draw preview line
            let lineY = lastImage.pos.y + gridSize / 2;
            p.stroke(0);
            p.strokeWeight(1 / scaleFactor);
            p.line(lastImage.pos.x + gridSize / 2, lineY, newX + gridSize / 2, lineY);

            // Draw preview square
            p.noFill();
            p.stroke(direction === "noise" ? p.color(146, 128, 255) : p.color(200, 255, 133));
            p.strokeWeight(1 / scaleFactor);
            p.rect(newX, lastImage.pos.y, gridSize, gridSize);

            // Display prompt index on preview
            p.fill(255);
            p.text(lastImage.promptIndex, newX + gridSize / 2, lastImage.pos.y + gridSize / 2);
          }
        }

        p.pop();
      };

      // Function to draw a spinner at a given position
      function drawSpinner(p: p5, x: number, y: number, size: number, angle: number) {
        p.push();
        p.translate(x, y);
        p.rotate(p.radians(angle));
        // p.stroke(0, 0, 255);
        p.strokeWeight(2 / scaleFactor);
        p.noFill();
        p.ellipse(0, 0, size, size);
        p.line(0, -size / 2, 0, -size / 4);
        p.pop();
      }

      // Mouse interaction functions
      p.mousePressed = (event: MouseEvent) => {
        // Only start interactions if the mouse is within the canvas
        if (mouseInCanvas()) {
          // Prevent default behavior only within the canvas
          event.preventDefault();

          if (p.keyIsDown(p.SHIFT)) {
            // Start panning
            isPanning = true;
            panStartX = p.mouseX;
            panStartY = p.mouseY;
            panStartTranslateX = translateX;
            panStartTranslateY = translateY;
            return;
          }

          dragStartX = p.mouseX;
          dragStartY = p.mouseY;
          isDragging = true;
        }
      };

      p.mouseDragged = (event: MouseEvent) => {
        if (isPanning) {
          // Calculate the amount of movement
          let dx = (p.mouseX - panStartX) / scaleFactor;
          let dy = (p.mouseY - panStartY) / scaleFactor;

          // Update the translation
          translateX = panStartTranslateX + dx;
          translateY = panStartTranslateY + dy;

          // Prevent default dragging behavior within the canvas
          event.preventDefault();
        }
      };

      p.mouseReleased = async () => {
        if (isPanning) {
          isPanning = false;
          return;
        }

        if (isDragging) {
          // Adjust mouse coordinates for scaling and translation
          let mouseXWorld = (p.mouseX - translateX) / scaleFactor;
          let mouseYWorld = (p.mouseY - translateY) / scaleFactor;
          let dragStartXWorld = (dragStartX - translateX) / scaleFactor;
          let dragStartYWorld = (dragStartY - translateY) / scaleFactor;

          let dragDistanceX = mouseXWorld - dragStartXWorld;
          let dragDistanceY = mouseYWorld - dragStartYWorld;

          // Set isDragging to false early to prevent drag preview from rendering
          isDragging = false;

          let lastImage = staticPositions[staticPositions.length - 1];
          let newImage: {
            pos: p5.Vector;
            color: p5.Color;
            type: string;
            step: number;
            promptIndex: number;
            _id?: string;
            parent_id?: string;
            isAnimating: boolean;
            currentY: number;
            originalImage: string;
            startY?: number;
            targetY?: number;
            animationStartTime?: number;
            animationDuration?: number;
            p5Image?: p5.Image;
            caption?: string;
            promptList: string;
            isLoading?: boolean;
            spinnerAngle?: number;
          };

          if (Math.abs(dragDistanceY) > Math.abs(dragDistanceX) && dragDistanceY > gridSize / 2) {
            const rowHeight = gridSize + padding;
            const newY = lastImage.pos.y + rowHeight;

            // Calculate prompt steps (number of grid units dragged)
            const promptSteps = Math.floor((mouseYWorld - (lastImage.pos.y + gridSize / 2)) / (gridSize + padding));
            const validPromptSteps = Math.max(1, promptSteps); // Ensure at least one step

            // Shift existing purples down
            shiftPurplesDown(newY);

            // Create new colored square with loading state
            newImage = {
              pos: p.createVector(lastImage.pos.x, newY),
              color: lastImage.type === "noise" ? p.color(52, 29, 185) : p.color(140, 255, 0),
              type: lastImage.type,
              step: lastImage.step,
              promptIndex: validPromptSteps,
              originalImage: lastImage.originalImage || "", // Ensure originalImage is a string
              _id: undefined, // Will be set after backend response
              parent_id: lastImage._id,
              isAnimating: true,
              currentY: lastImage.pos.y,
              startY: lastImage.pos.y,
              targetY: newY,
              animationStartTime: p.millis(),
              animationDuration: 500,
              promptList: lastImage.promptList,
              isLoading: true, // Set loading to true
              spinnerAngle: 0, // Initialize spinner angle
            };

            staticPositions.push(newImage);

            // Persist the new position to the backend
            const coordinate = `${Math.round(newImage.pos.x)},${Math.round(newImage.pos.y)}`;
            const pureBase64 = (lastImage.originalImage || "").replace(/^data:image\/\w+;base64,/, "");
            const cleanedPromptList = lastImage.promptList.replace(/^"|"$/g, "");
            const prompts = cleanedPromptList.split(",").map((word) => word.trim());
            const chosenPromptWord = prompts[newImage.promptIndex];

            if (!chosenPromptWord) {
              console.error("No valid prompt word found for the given prompt index.");
              staticPositions.pop(); // Remove the loading image
              return; // Stop if we don't have a valid prompt
            }

            // 1. create stable diffusion
            let steps = 0;
            try {
              if (newImage.type === "noise") {
                steps = Number(newImage.step)*40;
              } else {
                steps = Number(newImage.step)*10;
              }
              let sdBase64 = await getStableDiffusionResponse(newImage.type, steps, chosenPromptWord, pureBase64);
              newImage.originalImage = "data:image/png;base64," + sdBase64;
            } catch (error) {
              console.error("Failed to get Stable Diffusion response:", error);
              staticPositions.pop(); // Remove the loading image
              return;
            }

            // 2. create caption
            if (newImage.originalImage) {
              try {
                const imageBase64 = newImage.originalImage;
                const caption = await generateCaption(imageBase64);
                newImage.caption = caption;
                console.log("new image caption:", caption);
              } catch (error) {
                console.error("Error converting image or generating caption:", error);
                staticPositions.pop(); // Remove the loading image
                return; // Exit early if there's an error with the caption
              }
            }

            // 3. create promptList with chatgpt
            console.log("Waiting for ChatGPT response...");

            if (lastImage.type === "denoise") {
              try {
                newImage.promptList = await getChatGPTResponse(newImage.caption || "");
                console.log("new ChatGPT prompt list for denoise:", newImage.promptList);
              } catch (error) {
                console.error("Failed to get ChatGPT response:", error);
                staticPositions.pop(); // Remove the loading image
                return;
              }
            } else {
              newImage.promptList = lastImage.promptList;
              console.log("inherited parent prompt list:", newImage.promptList);
            }

            // 4. load image
            newImage.p5Image = p.loadImage(newImage.originalImage, () => {
              console.log("Image loaded successfully!");
              newImage.isLoading = false; // Stop loading
            }, (err: Error) => {
              console.error("Failed to load image:", err);
              staticPositions.pop(); // Remove the loading image
            });

            // 5. create imageDoc
            const createdImageDoc = await createImageDoc(
              lastImage._id || "null",
              coordinate,
              lastImage.type,
              newImage.step.toString(),
              newImage.promptIndex,
              newImage.originalImage,
              newImage.caption || "",
              newImage.promptList,
            );
            if (createdImageDoc) {
              newImage._id = createdImageDoc._id;
              newImage.type = createdImageDoc.type;
              newImage.originalImage = createdImageDoc.originalImage;
              newImage.caption = createdImageDoc.caption;
              newImage.promptList = createdImageDoc.promptList;
            } else {
              console.warn("Failed to create new ImageDoc. Removing new image from staticPositions.");
              staticPositions.pop();
            }

            if (createdImageDoc) {
              newImage._id = createdImageDoc._id;
              newImage.type = createdImageDoc.type; // Use type from the backend
            } else {
              console.warn("Failed to create new ImageDoc. Skipping addition to staticPositions.");
              staticPositions.pop(); // Remove the new image if creation fails
            }
          } else if (Math.abs(dragDistanceX) > gridSize / 2) {
            //----------------------------------------------------------------------------------------------------
            // Horizontal dragging (noise/denoise)
            let steps = Math.floor(Math.abs(dragDistanceX) / stepDistance);

            if (steps > 0) {
              let direction = dragDistanceX < 0 ? "noise" : "denoise";
              let isNoisy = direction === "noise";
              let newX = lastImage.pos.x + steps * (gridSize + padding) * (isNoisy ? -1 : 1);

              // Add new image state
              newImage = {
                pos: p.createVector(newX, lastImage.pos.y),
                color: isNoisy ? p.color(146, 128, 255) : p.color(200, 255, 133),
                type: direction,
                step: steps,
                promptIndex: lastImage.promptIndex ?? 0, // Keep existing promptIndex or default to 0
                _id: lastImage._id,
                parent_id: lastImage._id, // Link to the parent
                isAnimating: false,
                currentY: lastImage.pos.y,
                originalImage: lastImage.originalImage || "", // Add originalImage property with default value
                promptList: lastImage.promptList,
                isLoading: false,
                spinnerAngle: 0,
              };

              staticPositions.push(newImage);

              selectedParentId = lastImage._id || "null";
              selectedType = direction;
            }
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
            let mouseXWorld = (p.mouseX - translateX) / scaleFactor;
            let mouseYWorld = (p.mouseY - translateY) / scaleFactor;
            translateX -= mouseXWorld * zoomAmount;
            translateY -= mouseYWorld * zoomAmount;

            // Prevent default zooming behavior
            event.preventDefault();
          }
        }
      };

      p.doubleClicked = () => {
        // Adjust mouse coordinates for scaling and translation
        const mouseXWorld = (p.mouseX - translateX) / scaleFactor;
        const mouseYWorld = (p.mouseY - translateY) / scaleFactor;

        // Loop through the staticPositions array to check which square was double-clicked
        for (let i = 0; i < staticPositions.length; i++) {
          const img = staticPositions[i];

          if (mouseXWorld >= img.pos.x && mouseXWorld <= img.pos.x + gridSize && 
              mouseYWorld >= img.currentY && mouseYWorld <= img.currentY + gridSize) {
            // Move the selected square to the end of the array
            const [selectedImage] = staticPositions.splice(i, 1);
            staticPositions.push(selectedImage);
            selectedParentId = selectedImage._id || null;

            // Convert p5.Image to base64
            if (selectedImage.p5Image) {
              // Create a temporary canvas to draw the image
              const tempCanvas = p.createGraphics(selectedImage.p5Image.width, selectedImage.p5Image.height);
              tempCanvas.image(selectedImage.p5Image, 0, 0);
              
              // Convert canvas to base64
              const base64Image = tempCanvas.canvas.toDataURL('image/png');
            
              emit("selectImage", base64Image);
              
              // Clean up temporary canvas
              tempCanvas.remove();
            } else {
              console.warn('No p5 image found for the selected image');
            }
            break;
          }
        }
      };

      p.keyPressed = () => {
        if (p.key === "Escape" && isDragging) {
          isDragging = false;
          console.log("Drag operation canceled.");
        }
      };

      p.windowResized = () => {
        // Adjust the canvas size on window resize
        const canvasWidth = p.windowWidth + 100;
        const canvasHeight = p.windowHeight - 120;
        p.resizeCanvas(canvasWidth, canvasHeight);

        // Recalculate and update the initial square position
        const newInitialPosition = p.createVector(0, 0);

        if (staticPositions.length > 0) {
          staticPositions[0].pos.set(newInitialPosition.x, newInitialPosition.y);
          staticPositions[0].currentY = newInitialPosition.y;
        }
      };

      function mouseInCanvas() {
        // Since p.mouseX and p.mouseY are relative to the canvas, and the canvas is in the container, we can use them directly
        return p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height;
      }

      // Easing function for elastic effect
      function easeOutElastic(t: number) {
        const c4 = (2 * Math.PI) / 3;

        if (t === 0) return 0;
        if (t === 1) return 1;
        return Math.pow(2, -10 * t) * p.sin((t * 10 - 0.75) * c4) + 1;
      }
    });

    // Cleanup p5 instance on component unmount
    onUnmounted(() => {
      // Remove wheel event listener
      // const preventScroll = (e: Event) => e.preventDefault();
      window.removeEventListener("wheel", preventScroll);
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
  background: #FFFFFF;
  border-radius: 10px;
  width: 100%; /* Ensure the container can expand */
}

canvas {
  display: block;
}
</style>
