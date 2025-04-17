
import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "fabric";
import PhonicsBoardToolbar from "./PhonicsBoardToolbar";
import { toast } from "@/components/ui/sonner";
import { CanvasState } from "./types";
import { getPenSizeValue, initializeCanvas, handleCanvasResize, updatePenSettings, setBackgroundImage, setCustomCursor } from "./utils/canvasUtils";
import { refreshPhonicsLines } from "./utils/phonicsLineUtils";
import { replayLastStroke } from "./utils/strokeReplayUtils";

const PhonicsBoard: React.FC = () => {
  // Canvas reference
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Fabric.js canvas instance
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  
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
      const fabricCanvas = initializeCanvas(
        canvasRef.current,
        canvasState,
        // Callback for when a stroke is recorded
        (path, duration) => {
          setCanvasState(prev => ({
            ...prev,
            lastStroke: { path, duration }
          }));
        },
        // Callback for drawing state changes
        (isDrawing) => setIsDrawing(isDrawing)
      );
      
      // Handle window resize
      const cleanupResizeHandler = handleCanvasResize(fabricCanvas, refreshPhonicsLines);
      
      // Save canvas instance to state
      setCanvas(fabricCanvas);
      
      // Clean up on unmount
      return () => {
        cleanupResizeHandler();
        fabricCanvas.dispose();
      };
    }
  }, [canvasRef]);

  // Update brush when pen size or color changes
  useEffect(() => {
    if (canvas) {
      updatePenSettings(canvas, canvasState.penColor, canvasState.penSize);
    }
  }, [canvas, canvasState.penColor, canvasState.penSize]);

  // Handle background image upload
  const handleBackgroundUpload = (imageUrl: string) => {
    if (!canvas) return;
    
    setBackgroundImage(
      canvas,
      imageUrl,
      refreshPhonicsLines,
      // Success callback
      () => {
        setCanvasState(prev => ({
          ...prev,
          backgroundImage: imageUrl
        }));
        toast.success("Background updated!");
      },
      // Error callback
      () => toast.error("Failed to load background image")
    );
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
  const handleReplayLastStroke = () => {
    if (!canvas || !canvasState.lastStroke) {
      toast.error("No stroke to replay");
      return;
    }
    
    replayLastStroke(
      canvas,
      canvasState.lastStroke.path,
      canvasState.lastStroke.duration,
      canvasState.replaySpeed
    );
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
    
    setCustomCursor(canvas, imageUrl);
    
    setCanvasState(prev => ({
      ...prev,
      customCursor: imageUrl
    }));
    
    if (imageUrl) {
      toast.success("Custom cursor applied!");
    } else {
      toast("Reset to default cursor");
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
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
          onReplayStroke={handleReplayLastStroke}
          onSpeedChange={handleSpeedChange}
          onCustomCursorChange={handleCustomCursor}
        />
      </div>
      
      {/* Status indicators */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${isDrawing ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-700 opacity-70">{isDrawing ? 'Drawing' : 'Ready'}</span>
        </div>
      </div>
    </div>
  );
};

export default PhonicsBoard;
