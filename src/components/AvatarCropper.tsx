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

// Bandit Engine Watermark: BL-WM-D92A-F4D6ED
const __banditFingerprint_components_AvatarCroppertsx = 'BL-FP-0C6AA6-121B';
const __auditTrail_components_AvatarCroppertsx = 'BL-AU-MGOIKVV8-VV3E';
// File: AvatarCropper.tsx | Path: src/components/AvatarCropper.tsx | Hash: d92a121b

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
} from '@mui/material';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

interface AvatarCropperProps {
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

const AvatarCropper: React.FC<AvatarCropperProps> = ({
  open,
  onClose,
  onCrop,
  imageFile,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  const CROP_SIZE = 400; // Fixed crop area size
  const OUTPUT_SIZE = 512; // Final output size

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
      const minScale = Math.max(
        CROP_SIZE / naturalWidth,
        CROP_SIZE / naturalHeight
      );
      
      setCropSettings({
        x: 0,
        y: 0,
        scale: Math.max(minScale, 0.5),
        rotation: 0,
      });
      
      setImageLoaded(true);
    }
  }, []);

  // Draw the crop preview
  const drawCropPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image || !imageLoaded) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;

    // Clear canvas
    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);

    // Save context
    ctx.save();

    // Apply transformations
    ctx.translate(CROP_SIZE / 2, CROP_SIZE / 2);
    ctx.rotate((cropSettings.rotation * Math.PI) / 180);
    ctx.scale(cropSettings.scale, cropSettings.scale);
    ctx.translate(-image.naturalWidth / 2 + cropSettings.x, -image.naturalHeight / 2 + cropSettings.y);

    // Draw image
    ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);

    // Restore context
    ctx.restore();

    // Draw crop circle overlay
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, [cropSettings, imageLoaded]);

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
    onClose();
  }, [onClose]);

  // Handle crop and output
  const handleCrop = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = imageRef.current;

    if (!ctx || !image) return;

    // Set output canvas size
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    // Fill background with white for transparency support
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    // Save context
    ctx.save();

    // Create circular clipping path
    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    // Apply transformations (scaled for output size)
    const scale = OUTPUT_SIZE / CROP_SIZE;
    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
    ctx.rotate((cropSettings.rotation * Math.PI) / 180);
    ctx.scale(cropSettings.scale * scale, cropSettings.scale * scale);
    ctx.translate(
      -image.naturalWidth / 2 + cropSettings.x * scale,
      -image.naturalHeight / 2 + cropSettings.y * scale
    );

    // Draw image
    ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);

    // Restore context
    ctx.restore();

    // Export as data URL with high quality
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onCrop(croppedDataUrl);
    handleClose();
  }, [cropSettings, onCrop, handleClose]);

  const handleScaleChange = useCallback((value: number) => {
    const minScale = Math.max(
      CROP_SIZE / imageNaturalSize.width,
      CROP_SIZE / imageNaturalSize.height
    );
    setCropSettings(prev => ({
      ...prev,
      scale: Math.max(value, minScale),
    }));
  }, [imageNaturalSize]);

  const handleRotation = useCallback((direction: 'left' | 'right') => {
    setCropSettings(prev => ({
      ...prev,
      rotation: prev.rotation + (direction === 'left' ? -90 : 90),
    }));
  }, []);

  const minScale = Math.max(
    CROP_SIZE / Math.max(imageNaturalSize.width, 1),
    CROP_SIZE / Math.max(imageNaturalSize.height, 1)
  );

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          🎯 Crop Your Avatar
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Position and resize your image to create the perfect avatar
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
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                {/* Crop Preview */}
                <Paper
                  elevation={3}
                  sx={{
                    width: CROP_SIZE,
                    height: CROP_SIZE,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '4px solid',
                    borderColor: 'primary.main',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    position: 'relative',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    '&:hover': {
                      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                      transform: 'scale(1.02)',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <canvas
                    ref={canvasRef}
                    width={CROP_SIZE}
                    height={CROP_SIZE}
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
                        bottom: 8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        pointerEvents: 'none',
                        opacity: 0.8,
                      }}
                    >
                      Drag to reposition
                    </Box>
                  )}
                </Paper>

                {/* Controls */}
                <Box sx={{ width: '100%', maxWidth: 400 }}>
                  {/* Zoom Control */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      🔍 Zoom: {Math.round(cropSettings.scale * 100)}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                        max={3}
                        step={0.1}
                        sx={{ flex: 1 }}
                      />
                      <IconButton
                        onClick={() => handleScaleChange(cropSettings.scale + 0.1)}
                        disabled={cropSettings.scale >= 3}
                        size="small"
                      >
                        <ZoomInIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Rotation Controls */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<RotateLeftIcon />}
                      onClick={() => handleRotation('left')}
                      size="small"
                    >
                      Rotate Left
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<RotateRightIcon />}
                      onClick={() => handleRotation('right')}
                      size="small"
                    >
                      Rotate Right
                    </Button>
                  </Box>

                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2">
                      <strong>💡 Pro Tips:</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      • <strong>Drag</strong> the image to reposition it<br/>
                      • <strong>Zoom</strong> to get the perfect framing<br/>
                      • <strong>Rotate</strong> if your image is sideways<br/>
                      • Final avatar will be <strong>{OUTPUT_SIZE}×{OUTPUT_SIZE}px</strong> and optimized for web
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
          ✂️ Crop Avatar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AvatarCropper;
