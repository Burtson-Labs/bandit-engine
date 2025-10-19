/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  This file is protected intellectual property.
  Do NOT use in commercial software, prompts, AI training data, or derivative works without a valid commercial license.

  🚫 AI NOTICE: This file contains visible and invisible watermarks.
  ⚖️  VIOLATION NOTICE: Removing, modifying, or obscuring these watermarks is a license violation.
  🔒 LICENSE TERMINATION: Upon license termination, ALL forks, copies, and derivatives must be permanently deleted.
  📋 AUDIT TRAIL: File usage is logged and monitored for compliance verification.
*/

// Bandit Engine Watermark: BL-WM-FCA3-C93D1A
const __banditFingerprint_components_LogoCroppertsx = 'BL-FP-8A6FB7-D540';
const __auditTrail_components_LogoCroppertsx = 'BL-AU-MGOIKVV8-FTQA';
// File: LogoCropper.tsx | Path: src/components/LogoCropper.tsx | Hash: fca3d540

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Slider,
  IconButton,
  Paper,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
} from '@mui/material';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import Crop169Icon from '@mui/icons-material/Crop169';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import CropPortraitIcon from '@mui/icons-material/CropPortrait';

interface LogoCropperProps {
  open: boolean;
  onClose: () => void;
  onCrop: (croppedImageData: string) => void;
  imageFile: File | null;
}

interface CropSettings {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

type AspectRatio = 'free' | 'square' | 'landscape' | 'portrait';

const LOGO_OUTPUT_SIZES = {
  small: 256,
  medium: 512,
  large: 1024,
} as const;

const LogoCropper: React.FC<LogoCropperProps> = ({
  open,
  onClose,
  onCrop,
  imageFile,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [cropSettings, setCropSettings] = useState<CropSettings>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('square');
  const [cropArea, setCropArea] = useState({ width: 400, height: 400 });

  const CANVAS_SIZE = 500; // Fixed canvas size for editing
  const [outputSize, setOutputSize] = useState<keyof typeof LOGO_OUTPUT_SIZES>('large');

  // Calculate crop dimensions based on aspect ratio
  const getCropDimensions = useCallback(() => {
    const maxSize = 380; // Leave some padding in the canvas
    switch (aspectRatio) {
      case 'square':
        return { width: maxSize, height: maxSize };
      case 'landscape':
        return { width: maxSize, height: maxSize * 0.6 }; // 16:9-ish
      case 'portrait':
        return { width: maxSize * 0.6, height: maxSize };
      case 'free':
      default:
        return cropArea;
    }
  }, [aspectRatio, cropArea]);

  // Load image from file
  useEffect(() => {
    if (imageFile && open) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImageSrc(e.target.result as string);
          setImageLoaded(false);
        }
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile, open]);

  // Handle image load
  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setImageNaturalSize({ width: naturalWidth, height: naturalHeight });
      
      // Calculate initial scale to fit the crop area
      const cropDims = getCropDimensions();
      const minScale = Math.max(
        cropDims.width / naturalWidth,
        cropDims.height / naturalHeight
      );
      
      setCropSettings({
        x: 0,
        y: 0,
        scale: Math.max(minScale, 0.3),
        rotation: 0,
      });
      
      setImageLoaded(true);
    }
  }, [getCropDimensions]);

  // Update crop area when aspect ratio changes
  useEffect(() => {
    if (imageLoaded) {
      const cropDims = getCropDimensions();
      setCropArea(cropDims);
      
      // Recalculate minimum scale
      const minScale = Math.max(
        cropDims.width / imageNaturalSize.width,
        cropDims.height / imageNaturalSize.height
      );
      
      setCropSettings(prev => ({
        ...prev,
        scale: Math.max(prev.scale, minScale)
      }));
    }
  }, [aspectRatio, imageLoaded, imageNaturalSize, getCropDimensions]);

  const updatePreview = useCallback((cropX: number, cropY: number, cropDims: { width: number; height: number }) => {
    const previewCanvas = previewCanvasRef.current;
    const mainCanvas = canvasRef.current;
    
    if (!previewCanvas || !mainCanvas) return;
    
    const previewCtx = previewCanvas.getContext('2d');
    if (!previewCtx) return;

    previewCanvas.width = 120;
    previewCanvas.height = 120;

    // Clear preview
    previewCtx.clearRect(0, 0, 120, 120);

    // Calculate scale to fit preview
    const scale = Math.min(120 / cropDims.width, 120 / cropDims.height);
    const scaledWidth = cropDims.width * scale;
    const scaledHeight = cropDims.height * scale;
    const offsetX = (120 - scaledWidth) / 2;
    const offsetY = (120 - scaledHeight) / 2;

    // Draw scaled crop area
    previewCtx.drawImage(
      mainCanvas,
      cropX, cropY, cropDims.width, cropDims.height,
      offsetX, offsetY, scaledWidth, scaledHeight
    );

    // Add border
    previewCtx.strokeStyle = '#1976d2';
    previewCtx.lineWidth = 2;
    previewCtx.strokeRect(offsetX, offsetY, scaledWidth, scaledHeight);
  }, []);

  // Draw the crop preview
  const drawCropPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image || !imageLoaded) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cropDims = getCropDimensions();

    // Set canvas size
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw background pattern for transparency visibility
    const patternSize = 20;
    ctx.fillStyle = '#f0f0f0';
    for (let x = 0; x < CANVAS_SIZE; x += patternSize) {
      for (let y = 0; y < CANVAS_SIZE; y += patternSize) {
        if ((x / patternSize + y / patternSize) % 2 === 0) {
          ctx.fillRect(x, y, patternSize, patternSize);
        }
      }
    }

    // Save context
    ctx.save();

    // Create crop rectangle clipping path
    const cropX = (CANVAS_SIZE - cropDims.width) / 2;
    const cropY = (CANVAS_SIZE - cropDims.height) / 2;
    
    ctx.beginPath();
    ctx.rect(cropX, cropY, cropDims.width, cropDims.height);
    ctx.clip();

    // Apply transformations
    ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    ctx.rotate((cropSettings.rotation * Math.PI) / 180);
    ctx.scale(cropSettings.scale, cropSettings.scale);
    ctx.translate(-image.naturalWidth / 2 + cropSettings.x, -image.naturalHeight / 2 + cropSettings.y);

    // Draw image
    ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);

    // Restore context
    ctx.restore();

    // Draw crop area border
    ctx.strokeStyle = '#1976d2';
    ctx.lineWidth = 3;
    ctx.strokeRect(cropX, cropY, cropDims.width, cropDims.height);

    // Draw corner indicators
    const cornerSize = 20;
    ctx.fillStyle = '#1976d2';
    // Top-left
    ctx.fillRect(cropX - 1, cropY - 1, cornerSize, 3);
    ctx.fillRect(cropX - 1, cropY - 1, 3, cornerSize);
    // Top-right
    ctx.fillRect(cropX + cropDims.width - cornerSize + 1, cropY - 1, cornerSize, 3);
    ctx.fillRect(cropX + cropDims.width - 1, cropY - 1, 3, cornerSize);
    // Bottom-left
    ctx.fillRect(cropX - 1, cropY + cropDims.height - 2, cornerSize, 3);
    ctx.fillRect(cropX - 1, cropY + cropDims.height - cornerSize + 1, 3, cornerSize);
    // Bottom-right
    ctx.fillRect(cropX + cropDims.width - cornerSize + 1, cropY + cropDims.height - 2, cornerSize, 3);
    ctx.fillRect(cropX + cropDims.width - 1, cropY + cropDims.height - cornerSize + 1, 3, cornerSize);

    // Update preview canvas
    updatePreview(cropX, cropY, cropDims);
  }, [cropSettings, imageLoaded, getCropDimensions, updatePreview]);

  // Update preview when settings change
  useEffect(() => {
    drawCropPreview();
  }, [drawCropPreview]);

  // Mouse/touch handlers for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setCropSettings(prev => ({
      ...prev,
      x: prev.x + deltaX / prev.scale,
      y: prev.y + deltaY / prev.scale,
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClose = useCallback(() => {
    setImageSrc('');
    setImageLoaded(false);
    setCropSettings({ x: 0, y: 0, scale: 1, rotation: 0 });
    setAspectRatio('square');
    onClose();
  }, [onClose]);

  // Handle crop and output
  const handleCrop = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = imageRef.current;

    if (!ctx || !image) return;

    const cropDims = getCropDimensions();
    const finalSize = LOGO_OUTPUT_SIZES[outputSize];
    
    // Set output canvas size maintaining aspect ratio
    const aspectRatioValue = cropDims.width / cropDims.height;
    let outputWidth = finalSize;
    let outputHeight = finalSize;
    
    if (aspectRatio !== 'square') {
      if (aspectRatioValue > 1) {
        // Landscape
        outputHeight = finalSize / aspectRatioValue;
      } else {
        // Portrait
        outputWidth = finalSize * aspectRatioValue;
      }
    }

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    // Save context
    ctx.save();

    // Apply transformations (scaled for output size)
    const scaleX = outputWidth / cropDims.width;
    const scaleY = outputHeight / cropDims.height;
    
    ctx.translate(outputWidth / 2, outputHeight / 2);
    ctx.rotate((cropSettings.rotation * Math.PI) / 180);
    ctx.scale(cropSettings.scale * scaleX, cropSettings.scale * scaleY);
    ctx.translate(
      -image.naturalWidth / 2 + cropSettings.x * scaleX,
      -image.naturalHeight / 2 + cropSettings.y * scaleY
    );

    // Draw image
    ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);

    // Restore context
    ctx.restore();

    // Export as PNG to preserve transparency
    const croppedDataUrl = canvas.toDataURL('image/png', 1.0);
    onCrop(croppedDataUrl);
    
    // Reset state and close
    setImageSrc('');
    setImageLoaded(false);
    setCropSettings({ x: 0, y: 0, scale: 1, rotation: 0 });
    setAspectRatio('square');
    onClose();
  }, [cropSettings, onCrop, getCropDimensions, outputSize, aspectRatio, onClose]);

  const handleScaleChange = useCallback((value: number) => {
    const cropDims = getCropDimensions();
    const minScale = Math.max(
      cropDims.width / imageNaturalSize.width,
      cropDims.height / imageNaturalSize.height
    );
    setCropSettings(prev => ({
      ...prev,
      scale: Math.max(value, minScale),
    }));
  }, [imageNaturalSize, getCropDimensions]);

  const handleRotation = useCallback((direction: 'left' | 'right') => {
    setCropSettings(prev => ({
      ...prev,
      rotation: prev.rotation + (direction === 'left' ? -90 : 90),
    }));
  }, []);

  const minScale = Math.max(
    getCropDimensions().width / Math.max(imageNaturalSize.width, 1),
    getCropDimensions().height / Math.max(imageNaturalSize.height, 1)
  );

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          🎨 Crop Your Logo
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Position, resize, and format your logo for perfect branding
        </Typography>
      </DialogTitle>

      <DialogContent>
        {imageSrc && (
          <>
            {/* Hidden image for loading */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop source"
              style={{ display: 'none' }}
              onLoad={handleImageLoad}
            />

            {imageLoaded ? (
              <Box sx={{ display: 'flex', gap: 3 }}>
                {/* Main Crop Area */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Paper
                    elevation={3}
                    sx={{
                      width: CANVAS_SIZE,
                      height: CANVAS_SIZE,
                      overflow: 'hidden',
                      border: '2px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      cursor: isDragging ? 'grabbing' : 'grab',
                      position: 'relative',
                      background: 'repeating-conic-gradient(#f0f0f0 0% 25%, transparent 0% 50%) 50% / 20px 20px',
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <canvas
                      ref={canvasRef}
                      width={CANVAS_SIZE}
                      height={CANVAS_SIZE}
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'block',
                      }}
                    />
                    
                    {/* Overlay hint */}
                    {!isDragging && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          background: 'rgba(0,0,0,0.8)',
                          color: 'white',
                          px: 2,
                          py: 0.5,
                          borderRadius: 2,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          pointerEvents: 'none',
                          opacity: 0.9,
                        }}
                      >
                        Drag to reposition • Blue area will be exported
                      </Box>
                    )}
                  </Paper>
                </Box>

                {/* Controls Panel */}
                <Box sx={{ width: 300, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Preview */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                      📋 Preview ({LOGO_OUTPUT_SIZES[outputSize]}px)
                    </Typography>
                    <Paper elevation={2} sx={{ p: 1, borderRadius: 2, background: 'repeating-conic-gradient(#f0f0f0 0% 25%, transparent 0% 50%) 50% / 10px 10px' }}>
                      <canvas
                        ref={previewCanvasRef}
                        width={120}
                        height={120}
                        style={{
                          width: '120px',
                          height: '120px',
                          display: 'block',
                          borderRadius: '4px',
                        }}
                      />
                    </Paper>
                  </Box>

                  {/* Aspect Ratio */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                      📐 Aspect Ratio
                    </Typography>
                    <ToggleButtonGroup
                      value={aspectRatio}
                      exclusive
                      onChange={(_, newRatio) => newRatio && setAspectRatio(newRatio)}
                      size="small"
                      fullWidth
                    >
                      <ToggleButton value="square">
                        <CropSquareIcon fontSize="small" />
                        <Typography variant="caption" sx={{ ml: 0.5 }}>Square</Typography>
                      </ToggleButton>
                      <ToggleButton value="landscape">
                        <Crop169Icon fontSize="small" />
                        <Typography variant="caption" sx={{ ml: 0.5 }}>Wide</Typography>
                      </ToggleButton>
                      <ToggleButton value="portrait">
                        <CropPortraitIcon fontSize="small" />
                        <Typography variant="caption" sx={{ ml: 0.5 }}>Tall</Typography>
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  {/* Output Size */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                      📏 Output Size
                    </Typography>
                    <ToggleButtonGroup
                      value={outputSize}
                      exclusive
                      onChange={(_, newSize) => newSize && setOutputSize(newSize)}
                      size="small"
                      fullWidth
                    >
                      <ToggleButton value="small">256px</ToggleButton>
                      <ToggleButton value="medium">512px</ToggleButton>
                      <ToggleButton value="large">1024px</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  {/* Zoom Control */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                      🔍 Zoom: {Math.round(cropSettings.scale * 100)}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        onClick={() => handleScaleChange(cropSettings.scale - 0.1)}
                        disabled={cropSettings.scale <= minScale}
                        size="small"
                      >
                        <ZoomOutIcon />
                      </IconButton>
                      <Slider
                        value={cropSettings.scale}
                        onChange={(_, value) => handleScaleChange(value as number)}
                        min={minScale}
                        max={4}
                        step={0.1}
                        sx={{ flex: 1 }}
                      />
                      <IconButton
                        onClick={() => handleScaleChange(cropSettings.scale + 0.1)}
                        disabled={cropSettings.scale >= 4}
                        size="small"
                      >
                        <ZoomInIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Rotation Controls */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                      🔄 Rotation
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<RotateLeftIcon />}
                        onClick={() => handleRotation('left')}
                        size="small"
                        fullWidth
                      >
                        Rotate Left
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<RotateRightIcon />}
                        onClick={() => handleRotation('right')}
                        size="small"
                        fullWidth
                      >
                        Rotate Right
                      </Button>
                    </Box>
                    {cropSettings.rotation !== 0 && (
                      <Chip 
                        label={`${cropSettings.rotation}°`} 
                        size="small" 
                        color="primary" 
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>

                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2">
                      <strong>✨ Logo Features:</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.8rem' }}>
                      • <strong>Transparency preserved</strong> for clean logos<br/>
                      • <strong>High quality PNG</strong> output<br/>
                      • <strong>Multiple sizes</strong> for different uses<br/>
                      • <strong>Perfect for branding</strong> across platforms
                    </Typography>
                  </Alert>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <Typography>Loading image...</Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={handleCrop}
          variant="contained"
          disabled={!imageLoaded}
          sx={{
            px: 3,
            fontWeight: 600,
          }}
        >
          ✂️ Crop Logo
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogoCropper;
