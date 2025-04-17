
import * as fabric from "fabric";
import { CanvasState, PenSize } from "../types";
import { addPhonicsLines } from "./phonicsLineUtils";

// Helper to get pixel value for pen sizes
export const getPenSizeValue = (size: PenSize): number => {
  switch (size) {
    case "small": return 4;
    case "medium": return 10;
    case "large": return 20;
    default: return 10;
  }
};

// Initialize the canvas with default settings
export const initializeCanvas = (
  canvasElement: HTMLCanvasElement,
  canvasState: CanvasState,
  onStrokeRecorded: (path: any, duration: number) => void,
  onDrawingStateChange: (isDrawing: boolean) => void
): fabric.Canvas => {
  console.log("Initializing canvas");
  
  // Create canvas with dimensions matching the parent container
  const fabricCanvas = new fabric.Canvas(canvasElement, {
    isDrawingMode: true,
    width: window.innerWidth,
    height: window.innerHeight - 100, // Account for toolbar height
    backgroundColor: "#FFFFFF" // White background
  });

  // Initialize brush
  if (fabricCanvas.freeDrawingBrush) {
    fabricCanvas.freeDrawingBrush.color = canvasState.penColor;
    fabricCanvas.freeDrawingBrush.width = getPenSizeValue(canvasState.penSize);
    // Ensure smooth drawing
    fabricCanvas.freeDrawingBrush.strokeLineCap = 'round';
    fabricCanvas.freeDrawingBrush.strokeLineJoin = 'round';
  }
  
  // Add phonics lines
  addPhonicsLines(fabricCanvas);
  
  // Track stroke timing
  let strokeStartTime: number | null = null;
  
  // Register path creation event for storing stroke history
  fabricCanvas.on('path:created', (e: any) => {
    const path = e.path;
    console.log("Path created:", path);
    if (strokeStartTime) {
      const duration = Date.now() - strokeStartTime;
      onStrokeRecorded(path, duration);
      strokeStartTime = null;
    }
  });
  
  // Handle mouse down for stroke timing
  fabricCanvas.on('mouse:down', () => {
    console.log("Mouse down, isDrawingMode:", fabricCanvas.isDrawingMode);
    if (fabricCanvas.isDrawingMode) {
      strokeStartTime = Date.now();
      onDrawingStateChange(true);
    }
  });
  
  // Handle mouse up for stroke timing
  fabricCanvas.on('mouse:up', () => {
    console.log("Mouse up");
    onDrawingStateChange(false);
  });
  
  return fabricCanvas;
};

// Handle window resize
export const handleCanvasResize = (
  canvas: fabric.Canvas,
  refreshPhonicsLines: (canvas: fabric.Canvas) => void
): (() => void) => {
  const resizeHandler = () => {
    canvas.setDimensions({
      width: window.innerWidth,
      height: window.innerHeight - 100
    });
    canvas.renderAll();
    refreshPhonicsLines(canvas);
  };
  
  window.addEventListener('resize', resizeHandler);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('resize', resizeHandler);
  };
};

// Update pen settings
export const updatePenSettings = (
  canvas: fabric.Canvas,
  penColor: string,
  penSize: PenSize
): void => {
  if (canvas?.freeDrawingBrush) {
    console.log("Updating brush:", penColor, penSize);
    canvas.freeDrawingBrush.color = penColor;
    canvas.freeDrawingBrush.width = getPenSizeValue(penSize);
    // Ensure canvas is in drawing mode
    canvas.isDrawingMode = true;
  }
};

// Handle background image upload
export const setBackgroundImage = (
  canvas: fabric.Canvas,
  imageUrl: string,
  refreshPhonicsLines: (canvas: fabric.Canvas) => void,
  onSuccess: () => void,
  onError: () => void
): void => {
  // Use a DOM Image element
  const imgElement = document.createElement('img');
  imgElement.crossOrigin = "Anonymous";
  
  imgElement.onload = () => {
    // Create fabric image using the DOM element
    const fabricImage = new fabric.Image(imgElement);
    
    // Get canvas dimensions
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    
    // Calculate scaling to fit
    const scaleX = canvasWidth / imgElement.width;
    const scaleY = canvasHeight / imgElement.height;
    const scale = Math.max(scaleX, scaleY);
    
    // Apply scaling
    fabricImage.scale(scale);
    
    // Set as background
    canvas.backgroundImage = fabricImage;
    canvas.renderAll();
    
    // Refresh phonics lines to ensure they're visible
    refreshPhonicsLines(canvas);
    
    onSuccess();
  };
  
  imgElement.onerror = onError;
  
  // Set source to start loading
  imgElement.src = imageUrl;
};

// Handle custom cursor
export const setCustomCursor = (
  canvas: fabric.Canvas,
  imageUrl: string | null
): void => {
  if (imageUrl) {
    // Apply custom cursor
    canvas.defaultCursor = `url(${imageUrl}), auto`;
    canvas.hoverCursor = `url(${imageUrl}), auto`;
    canvas.freeDrawingCursor = `url(${imageUrl}) 0 30, auto`;
  } else {
    // Reset to default
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';
    canvas.freeDrawingCursor = 'crosshair';
  }
};
