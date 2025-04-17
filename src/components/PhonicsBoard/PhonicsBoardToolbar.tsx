
import React, { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { CanvasState } from "./PhonicsBoard";
import { Upload, Pencil, Repeat } from "lucide-react";

interface PhonicsBoardToolbarProps {
  canvasState: CanvasState;
  onPenSizeChange: (size: "small" | "medium" | "large") => void;
  onColorChange: (color: string) => void;
  onBackgroundUpload: (imageUrl: string) => void;
  onReplayStroke: () => void;
  onSpeedChange: (speed: number) => void;
  onCustomCursorChange: (imageUrl: string | null) => void;
}

const PhonicsBoardToolbar: React.FC<PhonicsBoardToolbarProps> = ({
  canvasState,
  onPenSizeChange,
  onColorChange,
  onBackgroundUpload,
  onReplayStroke,
  onSpeedChange,
  onCustomCursorChange,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>([
    "#00A3FF", "#FF3B9A", "#7CFF6B", "#FFDE59"
  ]);
  
  // For file uploads
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleColorSelect = (color: string) => {
    onColorChange(color);
    
    // Add to recent colors if not already included
    if (!recentColors.includes(color)) {
      setRecentColors(prev => [color, ...prev.slice(0, 7)]); // Keep last 8 colors
    }
    
    // Close color picker
    setShowColorPicker(false);
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: "background" | "cursor") => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Show progress animation
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 10;
      });
    }, 100);
    
    // Process file
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      // Complete the upload
      clearInterval(interval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        
        if (type === "background") {
          onBackgroundUpload(result);
        } else {
          onCustomCursorChange(result);
        }
      }, 500);
    };
    
    reader.readAsDataURL(file);
  };
  
  return (
    <div className="flex items-center justify-between w-full h-full px-6 bg-gradient-to-r from-indigo-900/80 via-purple-900/80 to-indigo-900/80 backdrop-blur-md shadow-lg">
      <div className="flex items-center space-x-6">
        {/* App Title */}
        <h1 className="text-2xl font-bold text-white tracking-wide">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Phonics</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Board</span>
        </h1>
        
        {/* Pen Size Selector */}
        <div className="flex items-center space-x-2">
          <div 
            className={`flex items-center justify-center h-10 w-10 rounded-full transition-all duration-300 cursor-pointer
              ${canvasState.penSize === "small" 
                ? "bg-gradient-to-r from-blue-400 to-indigo-500 shadow-lg shadow-blue-500/50 scale-110" 
                : "bg-gray-700/60 hover:bg-gray-600/60"}`}
            onClick={() => onPenSizeChange("small")}
          >
            <div className={`h-2 w-2 rounded-full bg-white transition-transform ${canvasState.penSize === "small" ? "animate-pulse" : ""}`}></div>
          </div>
          
          <div 
            className={`flex items-center justify-center h-10 w-10 rounded-full transition-all duration-300 cursor-pointer
              ${canvasState.penSize === "medium" 
                ? "bg-gradient-to-r from-blue-400 to-indigo-500 shadow-lg shadow-blue-500/50 scale-110" 
                : "bg-gray-700/60 hover:bg-gray-600/60"}`}
            onClick={() => onPenSizeChange("medium")}
          >
            <div className={`h-4 w-4 rounded-full bg-white transition-transform ${canvasState.penSize === "medium" ? "animate-pulse" : ""}`}></div>
          </div>
          
          <div 
            className={`flex items-center justify-center h-10 w-10 rounded-full transition-all duration-300 cursor-pointer
              ${canvasState.penSize === "large" 
                ? "bg-gradient-to-r from-blue-400 to-indigo-500 shadow-lg shadow-blue-500/50 scale-110" 
                : "bg-gray-700/60 hover:bg-gray-600/60"}`}
            onClick={() => onPenSizeChange("large")}
          >
            <div className={`h-6 w-6 rounded-full bg-white transition-transform ${canvasState.penSize === "large" ? "animate-pulse" : ""}`}></div>
          </div>
        </div>
        
        {/* Color Picker */}
        <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
          <PopoverTrigger asChild>
            <button 
              className="h-10 w-10 rounded-full border-2 border-white/30 shadow-inner shadow-black/20 transition-transform hover:scale-110"
              style={{ backgroundColor: canvasState.penColor }}
            />
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 bg-gray-900/90 backdrop-blur-xl border-gray-700 shadow-xl rounded-xl">
            <div className="space-y-4">
              <HexColorPicker 
                color={canvasState.penColor} 
                onChange={handleColorSelect}
                className="w-full" 
              />
              
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  value={canvasState.penColor} 
                  onChange={(e) => handleColorSelect(e.target.value)}
                  className="flex-1 bg-gray-800 border-gray-700 text-white rounded-md px-2 py-1"
                />
                <button 
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  onClick={() => setShowColorPicker(false)}
                >
                  Apply
                </button>
              </div>
              
              <div>
                <p className="text-gray-400 text-xs mb-1">Recent Colors</p>
                <div className="flex flex-wrap gap-2">
                  {recentColors.map((color, i) => (
                    <button
                      key={i}
                      className="h-6 w-6 rounded-full border border-white/30 transition-transform hover:scale-110"
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorSelect(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex items-center space-x-6">
        {/* Upload Background */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20">
              <Upload size={16} />
              <span>Background</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 bg-gray-900/90 backdrop-blur-xl border-gray-700 shadow-xl rounded-xl">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Upload Background</h3>
              <p className="text-sm text-gray-400">Select an image to use as background</p>
              
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  className="bg-gray-800 border-gray-700 text-white cursor-pointer"
                  onChange={(e) => handleFileUpload(e, "background")}
                />
                
                {isUploading && (
                  <div className="w-full bg-gray-800 rounded-full h-2.5">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%`, transition: 'width 0.3s ease-in-out' }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Custom Cursor */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md shadow-purple-500/20">
              <Pencil size={16} />
              <span>Custom Cursor</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 bg-gray-900/90 backdrop-blur-xl border-gray-700 shadow-xl rounded-xl">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Custom Cursor</h3>
              <p className="text-sm text-gray-400">Upload an image to use as your cursor</p>
              
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/png,image/svg+xml,image/gif"
                  className="bg-gray-800 border-gray-700 text-white cursor-pointer"
                  onChange={(e) => handleFileUpload(e, "cursor")}
                />
                
                {isUploading && (
                  <div className="w-full bg-gray-800 rounded-full h-2.5">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%`, transition: 'width 0.3s ease-in-out' }}
                    ></div>
                  </div>
                )}
                
                {canvasState.customCursor && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img src={canvasState.customCursor} alt="Custom cursor" className="h-8 w-8 object-contain" />
                      <span className="text-xs text-gray-400">Current cursor</span>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => onCustomCursorChange(null)}
                    >
                      Reset
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Replay Tools */}
        <div className="flex flex-col space-y-2">
          <Button 
            variant="outline" 
            className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 border-none shadow-md shadow-green-500/20"
            onClick={onReplayStroke}
          >
            <Repeat size={16} className="animate-pulse" />
            <span>Repeat</span>
          </Button>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-white/70">Speed</span>
            <Slider 
              min={0.5} 
              max={3} 
              step={0.1} 
              value={[canvasState.replaySpeed]}
              onValueChange={(values) => onSpeedChange(values[0])}
              className="w-32"
            />
            <span className="text-xs text-white font-mono">{canvasState.replaySpeed.toFixed(1)}x</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhonicsBoardToolbar;
