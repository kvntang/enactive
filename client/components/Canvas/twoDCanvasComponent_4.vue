<template>
  <div ref="canvasContainer" class="canvas-container"></div>
</template>

<script setup lang="ts">
import { HfInference } from "@huggingface/inference";
import p5 from "p5";
import { onMounted, onUnmounted, ref } from "vue";
import { fetchy } from "../../utils/fetchy";

const inference = new HfInference("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");

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
  isLoading?: boolean; // Loading state
  spinnerAngle?: number; // Spinner rotation
}

const props = defineProps<{
  images: ImageDoc[];
}>();

const emit = defineEmits(["refreshImages", "selectImage"]);

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

// Direct Hugging Face caption generation
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

async function getStableDiffusionResponse(
  type: string,
  steps: number, 
  prompt_word: string,
  originalImage: string
) {
  try {
    const result = await fetchy("/api/images/process", "POST", {
      body: {
        type,
        steps, 
        prompt_word,
        original_image: originalImage, 
      },
    });
    return result.new_image;
  } catch (error) {
    console.error("Error fetching stable diffusion response:", error);
    throw error;
  }
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
        isLoading?: boolean; // Loading state
        spinnerAngle?: number; // Spinner rotation
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
      const stepFactor = 50;

      // New flags for processing
      let isProcessing = false;

      //-------------------SETUP----------------------------------------------------------------------------
      p.setup = async () => {
        const canvasWidth = p.windowWidth + 100;
        const canvasHeight = p.windowHeight - 120;
        const canvas = p.createCanvas(canvasWidth, canvasHeight);
        canvas.parent(canvasContainer.value);
        ///1. Initialize the first ImageDoc if staticPositions is empty
        // Initial Vector
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

            let color = image.type === "noise" ? p.color(146, 128, 255) : p.color(200, 255, 133);

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
              promptList: image.promptList || "",
              isLoading: false,
              spinnerAngle: 0,
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
        currentColor = p.color(200, 255, 133); // Set initial color to blue (denoise)
      };

      /**
       * Convert mouse coordinates to world coordinates considering camera transformations.
       */
      function getMouseWorld() {
        return p.createVector((p.mouseX - p.width / 2 - translateX) / scaleFactor + camPos.x, (p.mouseY - p.height / 2 - translateY) / scaleFactor + camPos.y);
      }

      //-------------------DRAW----------------------------------------------------------------------------
      p.draw = () => {

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
            p.stroke(0);
            p.strokeWeight(1);
            p.line(parentPos.x, parentPos.y, sp.pos.x, sp.pos.y);

            // Calculate the midpoint
            const midX = (parentPos.x + sp.pos.x) / 2;
            const midY = (parentPos.y + sp.pos.y) / 2;

            // Calculate the angle of the line
            const dx = sp.pos.x - parentPos.x;
            const dy = sp.pos.y - parentPos.y;
            const angle = Math.atan2(dy, dx);

            // Draw triangle at the midpoint with conditional stroke color
            const triangleSizeMid = 5 / scaleFactor;
            p.push();
            p.translate(midX, midY);
            p.rotate(angle);
            p.fill(255);
            p.stroke(0, 0, 0);
            p.strokeWeight(1);
            p.triangle(-triangleSizeMid, -triangleSizeMid, -triangleSizeMid, triangleSizeMid, triangleSizeMid, 0);
            p.pop();
          }
        });

        // Draw all static positions
        staticPositions.forEach((sp) => {
          p.push();
          p.rectMode(p.CENTER);

          // Determine if the current square is selected
          const isSelected = sp._id === selectedParentId;

          if (sp.p5Image) {
            p.imageMode(p.CENTER);
            
            // Apply shadow only if the square is selected
            if (isSelected) {
              // Set shadow properties
              p.drawingContext.shadowOffsetX = 3;
              p.drawingContext.shadowOffsetY = 3;
              p.drawingContext.shadowBlur = 12;
              p.drawingContext.shadowColor = 'rgba(20, 20, 20, 0.08)';
            } else {
              // Reset shadow properties for non-selected squares
              p.drawingContext.shadowOffsetX = 0;
              p.drawingContext.shadowOffsetY = 0;
              p.drawingContext.shadowBlur = 0;
              p.drawingContext.shadowColor = 'rgba(0, 0, 0, 0)';
            }

            // Draw the image
            p.image(sp.p5Image, sp.pos.x, sp.pos.y, 70, 70); // Display image

            // Draw the yellow outline if selected
            if (isSelected) {
              p.noFill();
              p.stroke(255, 255, 0); // Yellow color
              p.strokeWeight(2 / scaleFactor);
              p.rect(sp.pos.x, sp.pos.y, 70, 70);
            }
          } else {
            // Apply shadow only if the square is selected
            if (isSelected) {
              // Set shadow properties
              p.drawingContext.shadowOffsetX = 3;
              p.drawingContext.shadowOffsetY = 3;
              p.drawingContext.shadowBlur = 12;
              p.drawingContext.shadowColor = 'rgba(20, 20, 20, 0.08)';
            } else {
              // Reset shadow properties for non-selected squares
              p.drawingContext.shadowOffsetX = 0;
              p.drawingContext.shadowOffsetY = 0;
              p.drawingContext.shadowBlur = 0;
              p.drawingContext.shadowColor = 'rgba(0, 0, 0, 0)';
            }

            // Draw the placeholder rectangle
            p.fill(sp.color);
            p.noStroke();
            p.rect(sp.pos.x, sp.pos.y, 70, 70); // Draw placeholder

            // Draw the yellow outline if selected
            if (isSelected) {
              p.noFill();
              p.stroke(255, 255, 0); // Yellow color
              p.strokeWeight(2 / scaleFactor);
              p.rect(sp.pos.x, sp.pos.y, 70, 70);
            }
          }
          p.pop();

          // Draw spinner if loading
          if (sp.isLoading) {
            drawSpinner(
              p,
              sp.pos.x,
              sp.pos.y,
              16,
              sp.spinnerAngle || 0,
              sp.type // Pass the type here
            );
            sp.spinnerAngle = (sp.spinnerAngle || 0) + 5; // Increment angle for rotation
          }

          p.fill(255);
          p.textAlign(p.CENTER, p.CENTER);

          if (sp.promptList) {
            try {
              const cleanedPromptList = sp.promptList.replace(/^"|"$/g, ""); // Remove surrounding quotes
              const prompts = cleanedPromptList.split(",").map((word) => word.trim());

              const promptWord = prompts[sp.promptIndex] || "";
              // You can uncomment the line below to display the promptWord if needed
              // p.text(promptWord, sp.pos.x, sp.pos.y + 40);
            } catch (e) {
              console.log(`Error parsing promptList for ImageDoc ID: ${sp._id}`);
            }
            // display caption at the bottom
            p.textSize(15);
            p.textAlign(p.CENTER, p.TOP);
            p.textWrap(p.WORD); // Wrap by word (use p.CHAR for character wrapping)
            const maxTextWidth = 140; // Set maximum width for wrapping
            // p.text(sp.caption, sp.pos.x - maxTextWidth / 2, sp.pos.y + 50, maxTextWidth);
          }
        });

        // Draw the moving point when dragging or moving-------------------------------------------------
        if (isDraggingNew || point.isMoving) {
          p.fill(currentColor);
          p.stroke(255);
          p.rectMode(p.CENTER);
          p.rect(point.pos.x, point.pos.y, 70, 70);
        }

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
          p.stroke(0);
          let lineEnd = p5.Vector.add(point.pos, direction);
          p.line(point.pos.x, point.pos.y, lineEnd.x, lineEnd.y);

          // Draw the angle index
          const { promptIndex } = getPromptIndex(point.type, snappedAngleDegrees);

          const selectedParent = staticPositions.find((sp) => sp._id === selectedParentId);
          if (selectedParent && selectedParent.promptList) {
            const cleanedPromptList = selectedParent.promptList.replace(/^"|"$/g, "");
            const prompts = cleanedPromptList.split(",").map((word) => word.trim());
            const promptWord = prompts[promptIndex] || "";

            p.textSize(14);
            p.fill(0);
            p.noStroke();
            p.text(promptWord, lineEnd.x, lineEnd.y);
            p.text(point.type, point.pos.x, point.pos.y - dynamicRadius - 30);
          }
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

            // Trigger placeholder creation and async operations after movement ends
            if (!isProcessing) {
              isProcessing = true;
              onMovementEnd();
            }
          } else {
            moveVector.setMag(speed);
            point.pos.add(moveVector);
          }
        }
      };

      // Function to handle actions after movement ends
      const onMovementEnd = async () => {
        // Add placeholder with loading state
        staticPositions.push({
          pos: p.createVector(point.finalPos.x, point.finalPos.y),
          // color: point.type === "noise" ? p.color(146, 128, 255) : p.color(200, 255, 133),
          color: point.type === "noise" ? p.color(52, 29, 185) : p.color(140, 255, 0),
          type: point.type,
          step: point.step,
          promptIndex: point.promptIndex,
          _id: "", // Temporary, will set after creation
          parent_id: selectedParentId!,
          originalImage: "", // Placeholder has no image yet
          p5Image: undefined,
          caption: "", // Placeholder caption
          promptList: "", // Placeholder promptList
          isLoading: true,
          spinnerAngle: 0,
        });

        const loadingImage = staticPositions[staticPositions.length - 1];

        // Proceed with async operations
        try {
          // Find parent image
          const parentImage = staticPositions.find((sp) => sp._id === selectedParentId);
          if (!parentImage || !parentImage.promptList) {
            console.error("Parent image or promptList not found");
            staticPositions.pop(); // Remove loading image
            isProcessing = false;
            return;
          }

          // Extract prompt word
          const cleanedPromptList = parentImage.promptList.replace(/^"|"$/g, "");
          const prompts = cleanedPromptList.split(",").map((word) => word.trim());
          const promptWord = prompts[point.promptIndex] || "";

          if (!promptWord) {
            console.error("No valid prompt word found for the given prompt index.");
            staticPositions.pop(); // Remove loading image
            isProcessing = false;
            return;
          }

          // Add this check before processing original_image
          if (!parentImage.originalImage) {
            console.error("parentImage.originalImage is undefined or invalid");
            staticPositions.pop(); // Remove loading image
            isProcessing = false;
            return;
          }

          const pureBase64 = parentImage.originalImage.replace(/^data:image\/\w+;base64,/, "");

          let steps = point.step;
          let stepValue;
          console.log(steps)
          if (point.type === "noise") {
            steps = Math.floor(Number(point.step) * 40);
            stepValue = Number(steps) / 40;
          } else {
            steps = Math.floor(Number(point.step) * 10);
            stepValue = Number(steps) / 10;
          }
          if (steps <= 0) {
            console.error("Steps must be a positive integer");
            staticPositions.pop(); // Remove loading image
            isProcessing = false;
            return;
          }

          // 1. Get Stable Diffusion response
          console.log(">>>>>>>>> 1 running stable diffusion");
          const generatedImage = await getStableDiffusionResponse(point.type, steps, promptWord, pureBase64);
          console.log(">>>>>>>>> 4", steps);

          if (!generatedImage) {
            console.error("Stable Diffusion did not return a new image.");
            staticPositions.pop(); // Remove loading image
            isProcessing = false;
            return;
          }

          // 2. Create caption
          const caption = await generateCaption(`data:image/png;base64,${generatedImage}`);

          // 3. Get ChatGPT response based on the caption
          console.log("Waiting for ChatGPT response...");
          let chatGPTResponse;
          if (point.type === "denoise") {
            try {
              chatGPTResponse = await getChatGPTResponse(caption);
              console.log("new ChatGPT prompt list for denoise:", chatGPTResponse);
            } catch (error) {
              console.error("Failed to get ChatGPT response:", error);
              staticPositions.pop(); // Remove loading image
              isProcessing = false;
              return;
            }
          } else {
            chatGPTResponse = parentImage.promptList;
            console.log("inherited parent prompt list:", chatGPTResponse);
          }
          
          // 4. Create ImageDoc with generated image
          loadingImage.originalImage = `data:image/png;base64,${generatedImage}`;
          loadingImage.caption = caption;
          loadingImage.promptList = chatGPTResponse;

          const coordinate = `${Math.round(point.finalPos.x)},${Math.round(point.finalPos.y)}`;
          const createdImageDoc = await createImageDoc(selectedParentId!, coordinate, point.type, stepValue.toString(), point.promptIndex, `data:image/png;base64,${generatedImage}`, caption, chatGPTResponse);

          if (!createdImageDoc || !createdImageDoc._id) {
            console.error("Failed to create ImageDoc or missing ID");
            staticPositions.pop(); // Remove loading image
            isProcessing = false;
            return;
          }

          createdImageDoc.caption = caption;
          createdImageDoc.promptList = chatGPTResponse;

          // Load the image
          createdImageDoc.p5Image = p.loadImage(
            createdImageDoc.originalImage,
            () => {
              console.log("Image loaded successfully!");
              loadingImage.isLoading = false; // Stop loading
              loadingImage._id = createdImageDoc._id;
              loadingImage.p5Image = createdImageDoc.p5Image;
            },
            (err: Error) => {
              console.error("Failed to load image:", err);
              staticPositions.pop(); // Remove loading image
            },
          );

          // Update selectedParentId
          selectedParentId = createdImageDoc._id;
          console.log(`New image created: ${createdImageDoc._id}`);

          // Trigger refresh to update images
          emit("refreshImages");
        } catch (error) {
          console.error("Error in image creation process:", error);
          staticPositions.pop(); // Remove loading image on error
        } finally {
          isProcessing = false;
        }
      };

      // Function to draw a spinner at a given position
      function drawSpinner(p: p5, x: number, y: number, size: number, angle: number, type: string) {
        p.push();
        p.translate(x, y);
        p.rotate(p.radians(angle));
        
        // Set color based on type
        if (type === "noise") {
          p.stroke(140, 255, 0); // Green for noise
        } else if (type === "denoise") {
          p.stroke(52, 29, 185); // Blue for denoise
        } else {
          p.stroke(0); // Default color
        }

        p.strokeWeight(2 / scaleFactor);
        p.noFill();
        p.ellipse(0, 0, size, size);
        p.line(0, -size / 2, 0, -size / 4);
        p.pop();
      }


      // Mouse interaction functions
      p.mousePressed = (event: MouseEvent) => {
        if (mouseInCanvas()) {
          if (p.keyIsDown(p.SHIFT)) {
            // Ensure SHIFT is pressed
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
              currentColor = p.color(146, 128, 255); // Red for noise
              point.type = "noise";
              console.log("Shooting type set to 'noise'");
            } else if (dragVector.x < -20) {
              initialDragDirection = "left";
              currentColor = p.color(200, 255, 133); // Blue for denoise
              point.type = "denoise";
              console.log("Shooting type set to 'denoise'");
            }
          }
        }
      };

      p.mouseReleased = () => {
        if (isPanning) {
          isPanning = false;
          return;
        }

        if (isDraggingNew) {
          isDraggingNew = false;

          // Calculate the final position based on drag
          const mouseWorld = getMouseWorld();
          const dragVector = p5.Vector.sub(mouseWorld, point.pos);
          let angleRadians = Math.atan2(dragVector.y, dragVector.x);
          let angleDegrees = p.degrees(angleRadians);
          let snappedAngleDegrees = Math.round(angleDegrees / 10) * 10;

          // Normalize snappedAngleDegrees to 0-360
          snappedAngleDegrees = (snappedAngleDegrees + 360) % 360;

          // Determine type based on drag direction
          const type = dragVector.x > 0 ? "noise" : "denoise";
          currentColor = type === "denoise" ? p.color(200, 255, 133) : p.color(146, 128, 255);

          // Calculate step based on drag distance
          let step = dragVector.mag();
          console.log("step:", step);
          let convertedStep = Math.round(step / stepFactor);
          console.log("convertedStep:", convertedStep);

          // Calculate movement direction
          let movementDirection = p.createVector(-Math.cos(p.radians(snappedAngleDegrees)), -Math.sin(p.radians(snappedAngleDegrees))).setMag(step);

          // Determine final position
          let finalPos = p5.Vector.add(point.pos, movementDirection);

          // Set up flying animation
          point.isMoving = true;
          point.finalPos = finalPos;
          point.type = type;
          point.step = convertedStep;

          const { promptIndex } = getPromptIndex(type, snappedAngleDegrees);
          point.promptIndex = promptIndex;
          const coordinate = `${Math.round(finalPos.x)},${Math.round(finalPos.y)}`;

          // Update point properties
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
            emit("selectImage", clickedBox.originalImage); // Emit the selected image's _id
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
        const canvasWidth = p.windowWidth + 100;
        const canvasHeight = p.windowHeight - 120;
        p.resizeCanvas(canvasWidth, canvasHeight);
      };

      function mouseInCanvas() {
        return p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height;
      }

      // Helper function to draw a rotated triangle
      function drawArrow(x: number, y: number, angle: number, size: number) {
        p.push();
        p.translate(x, y);
        p.rotate(angle);
        
        // Set fill color to white to match existing triangle
        p.strokeWeight(1);
        p.stroke(0, 0, 0);
        p.fill(255);
        p.triangle(-size, -size / 2, -size, size / 2, size, 0);
        
        p.pop();
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
  background: #FFFFFF;
  border-radius: 10px;
  width: 100%; /* Ensure the container can expand */
  position: relative;
}
canvas {
  display: block;
}
</style>
