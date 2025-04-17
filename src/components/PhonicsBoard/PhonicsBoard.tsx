
import React, { useEffect, useRef, useState } from "react";
import { Canvas, Line, Path, Image } from "fabric";
import PhonicsBoardToolbar from "./PhonicsBoardToolbar";
import { toast } from "@/components/ui/sonner";

// Import fabric.js namespace correctly
import * as fabric from "fabric";

// Define interfaces for our canvas state
interface StrokeHistory {
  path: any; // Using any for now to avoid TypeScript issues with fabric.js
  duration: number;
}

export interface CanvasState {
  penSize: "small" | "medium" | "large";
  penColor: string;
  backgroundImage: string | null;
  replaySpeed: number;
  lastStroke: StrokeHistory | null;
  customCursor: string | null;
}

const PhonicsBoard: React.FC = () => {
  // Canvas reference
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Fabric.js canvas instance
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeStartTime, setStrokeStartTime] = useState<number | null>(null);
  
  // Canvas state
  const [canvasState, setCanvasState] = useState<CanvasState>({
    penSize: "medium",
    penColor: "#00A3FF", // Bright blue default
    backgroundImage: null,
    replaySpeed: 1,
    lastStroke: null,
    customCursor: null,
  });

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (canvasRef.current && !canvas) {
      // Create canvas with dimensions matching the parent container
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        isDrawingMode: true,
        width: window.innerWidth,
        height: window.innerHeight - 100, // Account for toolbar height
        backgroundColor: "#121726" // Dark futuristic background
      });

      // Initialize brush
      if (fabricCanvas.freeDrawingBrush) {
        fabricCanvas.freeDrawingBrush.color = canvasState.penColor;
        fabricCanvas.freeDrawingBrush.width = getPenSizeValue(canvasState.penSize);
      }
      
      // Add phonics lines
      addPhonicsLines(fabricCanvas);
      
      // Handle window resize
      const handleResize = () => {
        fabricCanvas.setDimensions({
          width: window.innerWidth,
          height: window.innerHeight - 100
        });
        fabricCanvas.renderAll();
        refreshPhonicsLines(fabricCanvas);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Save canvas instance to state
      setCanvas(fabricCanvas);
      
      // Register path creation event for storing stroke history
      fabricCanvas.on('path:created', (e: any) => {
        const path = e.path;
        if (strokeStartTime) {
          const duration = Date.now() - strokeStartTime;
          setCanvasState(prev => ({
            ...prev,
            lastStroke: {
              path: path,
              duration
            }
          }));
          setStrokeStartTime(null);
        }
      });
      
      // Handle mouse down for stroke timing
      fabricCanvas.on('mouse:down', () => {
        if (fabricCanvas.isDrawingMode) {
          setStrokeStartTime(Date.now());
          setIsDrawing(true);
        }
      });
      
      // Handle mouse up for stroke timing
      fabricCanvas.on('mouse:up', () => {
        setIsDrawing(false);
      });
      
      // Clean up on unmount
      return () => {
        window.removeEventListener('resize', handleResize);
        fabricCanvas.dispose();
      };
    }
  }, [canvasRef]);

  // Update brush when pen size or color changes
  useEffect(() => {
    if (canvas?.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = canvasState.penColor;
      canvas.freeDrawingBrush.width = getPenSizeValue(canvasState.penSize);
    }
  }, [canvas, canvasState.penColor, canvasState.penSize]);

  // Helper to get pixel value for pen sizes
  const getPenSizeValue = (size: "small" | "medium" | "large") => {
    switch (size) {
      case "small": return 4;
      case "medium": return 10;
      case "large": return 20;
      default: return 10;
    }
  };

  // Add phonics guide lines to canvas
  const addPhonicsLines = (canvas: fabric.Canvas) => {
    const width = canvas.getWidth();
    const height = canvas.getHeight();
    const lineSpacing = 80; // Spacing between line sets
    const lineColor = 'rgba(173, 216, 230, 0.4)'; // Light blue with opacity
    const dashedLineColor = 'rgba(255, 182, 193, 0.4)'; // Light red with opacity
    
    // Create groups of lines that repeat across the canvas
    for (let y = 40; y < height; y += lineSpacing) {
      // Top solid line
      const topLine = new fabric.Line([0, y, width, y], {
        stroke: lineColor,
        strokeWidth: 1.5,
        selectable: false,
        evented: false,
        hoverCursor: 'default'
      });
      
      // Center dashed line
      const middleLine = new fabric.Line([0, y + lineSpacing/2, width, y + lineSpacing/2], {
        stroke: dashedLineColor,
        strokeWidth: 1,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        hoverCursor: 'default'
      });
      
      // Bottom solid line
      const bottomLine = new fabric.Line([0, y + lineSpacing, width, y + lineSpacing], {
        stroke: lineColor,
        strokeWidth: 1.5,
        selectable: false,
        evented: false,
        hoverCursor: 'default'
      });
      
      canvas.add(topLine);
      canvas.add(middleLine);
      canvas.add(bottomLine);
    }
    
    canvas.renderAll();
  };

  // Refresh phonics lines (e.g., after resize)
  const refreshPhonicsLines = (canvas: fabric.Canvas) => {
    // Remove all existing lines
    canvas.getObjects().forEach((obj) => {
      if (obj.type === 'line') {
        canvas.remove(obj);
      }
    });
    
    // Add new lines
    addPhonicsLines(canvas);
  };

  // Handle background image upload
  const handleBackgroundUpload = (imageUrl: string) => {
    if (!canvas) return;
    
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
      
      // Update state and show success message
      setCanvasState(prev => ({
        ...prev,
        backgroundImage: imageUrl
      }));
      
      // Refresh phonics lines to ensure they're visible
      refreshPhonicsLines(canvas);
      
      toast.success("Background updated!");
    };
    
    imgElement.onerror = () => {
      toast.error("Failed to load background image");
    };
    
    // Set source to start loading
    imgElement.src = imageUrl;
  };

  // Handle pen size change
  const handlePenSizeChange = (size: "small" | "medium" | "large") => {
    setCanvasState(prev => ({
      ...prev,
      penSize: size
    }));
    
    toast("Pen size changed", {
      description: `Switched to ${size} pen`
    });
  };

  // Handle color picker change
  const handleColorChange = (color: string) => {
    setCanvasState(prev => ({
      ...prev,
      penColor: color
    }));
  };

  // Handle replay of last stroke
  const replayLastStroke = () => {
    if (!canvas || !canvasState.lastStroke) {
      toast.error("No stroke to replay");
      return;
    }
    
    const { path, duration } = canvasState.lastStroke;
    const pathCopy = JSON.parse(JSON.stringify(path));
    
    // Remove the original path temporarily for animation
    canvas.remove(path);
    
    // Calculate animation duration based on speed
    const animationDuration = duration / canvasState.replaySpeed;
    
    // Create a temporary path for animation
    const animPath = new fabric.Path(pathCopy.path, {
      stroke: pathCopy.stroke,
      strokeWidth: pathCopy.strokeWidth,
      fill: '',
      strokeLineCap: 'round',
      strokeLineJoin: 'round'
    });
    
    // Add to canvas
    canvas.add(animPath);
    
    // Animate stroke creation
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Calculate visible portion of the path
      const points = pathCopy.path.length;
      const visiblePoints = Math.floor(points * progress);
      
      // Update path
      animPath.set({path: pathCopy.path.slice(0, visiblePoints)});
      canvas.renderAll();
      
      // Continue animation if not complete
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete - restore original path
        canvas.remove(animPath);
        canvas.add(path);
        canvas.renderAll();
        toast.success("Replay complete!");
      }
    };
    
    // Start animation
    toast("Replaying stroke...");
    requestAnimationFrame(animate);
  };

  // Handle replay speed change
  const handleSpeedChange = (speed: number) => {
    setCanvasState(prev => ({
      ...prev,
      replaySpeed: speed
    }));
  };

  // Handle custom cursor
  const handleCustomCursor = (imageUrl: string | null) => {
    if (!canvas) return;
    
    setCanvasState(prev => ({
      ...prev,
      customCursor: imageUrl
    }));
    
    if (imageUrl) {
      // Apply custom cursor
      canvas.defaultCursor = `url(${imageUrl}), auto`;
      canvas.hoverCursor = `url(${imageUrl}), auto`;
      canvas.freeDrawingCursor = `url(${imageUrl}) 0 30, auto`;
      
      toast.success("Custom cursor applied!");
    } else {
      // Reset to default
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
      canvas.freeDrawingCursor = 'crosshair';
      
      toast("Reset to default cursor");
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-blue-900 to-black">
      {/* Main canvas */}
      <div className="absolute inset-0 pt-[100px]">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      
      {/* Toolbar */}
      <div className="absolute top-0 left-0 right-0 h-[100px] z-10">
        <PhonicsBoardToolbar 
          canvasState={canvasState}
          onPenSizeChange={handlePenSizeChange}
          onColorChange={handleColorChange}
          onBackgroundUpload={handleBackgroundUpload}
          onReplayStroke={replayLastStroke}
          onSpeedChange={handleSpeedChange}
          onCustomCursorChange={handleCustomCursor}
        />
      </div>
      
      {/* Status indicators */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${isDrawing ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-white opacity-70">{isDrawing ? 'Drawing' : 'Ready'}</span>
        </div>
      </div>
    </div>
  );
};

export default PhonicsBoard;
