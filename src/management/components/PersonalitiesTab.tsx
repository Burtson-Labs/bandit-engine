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

// Bandit Engine Watermark: BL-WM-FAB9-58E90B
const __banditFingerprint_components_PersonalitiesTabtsx = 'BL-FP-A5FD2B-5424';
const __auditTrail_components_PersonalitiesTabtsx = 'BL-AU-MGOIKVVJ-SL4R';
// File: PersonalitiesTab.tsx | Path: src/management/components/PersonalitiesTab.tsx | Hash: fab95424

import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
  Avatar,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
  Alert,
  Chip,
  GlobalStyles,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import ViewModuleOutlinedIcon from '@mui/icons-material/ViewModuleOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import AvatarCropper from '../../components/AvatarCropper';
import { BanditPersonality, useModelStore } from "../../store/modelStore";
import { models as defaultModels } from "../../models/models";
import { resolveAvatar } from "../../util";
import indexedDBService from "../../services/indexedDB/indexedDBService";
import { debugLogger } from "../../services/logging/debugLogger";

export interface LocalModelState {
  name: string;
  tagline: string;
  systemPrompt: string;
  selectedModel: string;
}

interface PersonalitiesTabProps {
  availableModels: BanditPersonality[];
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  localSelectedModel: LocalModelState;
  setLocalSelectedModel: (model: LocalModelState) => void;
  customAvatarBase64: string | null;
  setCustomAvatarBase64: (avatar: string | null) => void;
  presetAvatar: string | null;
  setPresetAvatar: (avatar: string | null) => void;
  handleSaveModel: () => Promise<void>;
  handleResetModel: () => void;
  restoreDefaultModelsAndConfig: () => Promise<void>;
  restoreBanditModels: () => Promise<void>;
  showSnackbar?: (message: string, severity: 'success' | 'error') => void;
}const PersonalitiesTab: React.FC<PersonalitiesTabProps> = ({
  availableModels,
  selectedModel,
  setSelectedModel,
  localSelectedModel,
  setLocalSelectedModel,
  customAvatarBase64,
  setCustomAvatarBase64,
  presetAvatar,
  setPresetAvatar,
  handleSaveModel,
  handleResetModel,
  restoreDefaultModelsAndConfig,
  restoreBanditModels,
  showSnackbar,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [personalityTabIndex, setPersonalityTabIndex] = useState(0);
  const sectionGap = isMobile ? 2 : 3;
  const tabWrapperStyles = isMobile ? { flexDirection: 'column', gap: 0.35, fontSize: '0.78rem' } : { flexDirection: 'row', gap: 0.75, fontSize: '0.95rem' };
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [personalityToDelete, setPersonalityToDelete] = useState<string | null>(null);
  const [clickedChips, setClickedChips] = useState<Set<string>>(new Set());
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const promptTemplates = [
    {
      name: "Business Professional",
      tagline: "Your reliable business companion",
      avatar: "https://cdn.burtson.ai/avatars/businessman.png",
      prompt: "You are a professional AI assistant specializing in business and productivity. You provide clear, concise, and actionable advice. Always maintain a professional tone while being helpful and efficient. Focus on practical solutions and best practices.",
      description: "Perfect for business environments, meetings, and professional communication."
    },
    {
      name: "Creative Media Specialist",
      tagline: "Unleash your imagination together",
      avatar: "https://cdn.burtson.ai/avatars/mediagal.png",
      prompt: "You are a creative AI partner who loves to brainstorm, write, and explore imaginative ideas. You're enthusiastic, inspiring, and always ready to think outside the box. Help users unlock their creativity with vivid descriptions, innovative concepts, and artistic flair.",
      description: "Great for writers, designers, marketers, and creative projects."
    },
    {
      name: "Data Science Expert",
      tagline: "Turn data into insights",
      avatar: "https://cdn.burtson.ai/avatars/datascience.png",
      prompt: "You are a data science expert who excels at analyzing data, creating visualizations, and extracting meaningful insights. You help with statistical analysis, machine learning models, and data interpretation. Always explain your reasoning and suggest actionable next steps based on data findings.",
      description: "Perfect for data analysis, research, and statistical insights."
    },
    {
      name: "Customer Support Pro",
      tagline: "Helpful, patient, and solution-focused",
      avatar: "https://cdn.burtson.ai/avatars/support.png",
      prompt: "You are a customer support specialist who is patient, empathetic, and solution-focused. You listen carefully to customer concerns, ask clarifying questions, and provide step-by-step solutions. Always maintain a positive, helpful attitude even with difficult situations.",
      description: "Designed for customer service and support interactions."
    },
    {
      name: "Startup Mentor",
      tagline: "From idea to unicorn",
      avatar: "https://cdn.burtson.ai/avatars/startupmentor.png",
      prompt: "You are an experienced startup mentor who has helped dozens of companies go from idea to successful business. You provide practical advice on product development, fundraising, marketing, and scaling. You're direct but encouraging, with a bias toward action and customer validation.",
      description: "Essential for entrepreneurs, founders, and startup teams."
    },
    {
      name: "Learning Coach",
      tagline: "Master any skill together",
      avatar: "https://cdn.burtson.ai/avatars/trainer.png",
      prompt: "You are an expert learning coach who adapts to any subject and learning style. You break down complex topics into digestible chunks, create practice exercises, and provide encouraging feedback. You use analogies, examples, and interactive methods to make learning engaging and effective.",
      description: "Great for students, educators, and lifelong learners."
    },
    {
      name: "Research Assistant",
      tagline: "Deep dives, accurate sources",
      avatar: "https://cdn.burtson.ai/avatars/researcher.png",
      prompt: "You are a meticulous research assistant who excels at finding reliable sources, synthesizing information, and presenting comprehensive findings. You approach topics systematically, consider multiple perspectives, and always cite your sources. You help users understand complex subjects through thorough investigation.",
      description: "Ideal for academics, journalists, and research projects."
    },
    {
      name: "Travel Expert",
      tagline: "Adventures await everywhere",
      avatar: "https://cdn.burtson.ai/avatars/travel.png",
      prompt: "You are an experienced travel companion who knows hidden gems, local customs, and practical travel tips worldwide. You help plan itineraries, suggest activities, and provide cultural insights. You're enthusiastic about exploration while being mindful of budget, safety, and local etiquette.",
      description: "Essential for travelers, adventure seekers, and culture enthusiasts."
    }
  ];

  const moodSuggestions = [
    { label: "Friendly", color: "#4CAF50" },
    { label: "Professional", color: "#2196F3" },
    { label: "Casual", color: "#FF9800" },
    { label: "Enthusiastic", color: "#E91E63" },
    { label: "Calm", color: "#9C27B0" },
    { label: "Witty", color: "#FF5722" },
    { label: "Serious", color: "#607D8B" },
    { label: "Supportive", color: "#009688" }
  ];

  const handleTemplateSelect = (template: typeof promptTemplates[0]) => {
    setLocalSelectedModel({
      ...localSelectedModel,
      name: template.name,
      tagline: template.tagline,
      systemPrompt: template.prompt,
      selectedModel: "", // Clear selected model to indicate new model creation
    });
    // Set the template's avatar
    setPresetAvatar(template.avatar);
    setCustomAvatarBase64(null);
    setPersonalityTabIndex(1); // Switch to Create/Edit tab
  };

  const handleMoodSelect = (mood: string) => {
    const currentPrompt = localSelectedModel.systemPrompt || "";
    let moodInstruction = "";
    
    switch (mood.toLowerCase()) {
      case "friendly":
        moodInstruction = "Always be warm, welcoming, and approachable in your responses.";
        break;
      case "professional":
        moodInstruction = "Maintain a professional, business-appropriate tone in all interactions.";
        break;
      case "casual":
        moodInstruction = "Use a relaxed, conversational tone as if talking to a friend.";
        break;
      case "enthusiastic":
        moodInstruction = "Show excitement and energy in your responses, use positive language.";
        break;
      case "calm":
        moodInstruction = "Speak in a soothing, peaceful manner that helps users feel at ease.";
        break;
      case "witty":
        moodInstruction = "Use clever humor and wordplay when appropriate, but stay helpful.";
        break;
      case "serious":
        moodInstruction = "Maintain a focused, no-nonsense approach to problem-solving.";
        break;
      case "supportive":
        moodInstruction = "Be encouraging and understanding, offering emotional support when needed.";
        break;
    }

    const updatedPrompt = currentPrompt + (currentPrompt ? "\n\n" : "") + moodInstruction;
    setLocalSelectedModel({
      ...localSelectedModel,
      systemPrompt: updatedPrompt
    });

    // Add visual feedback
    const chipKey = `mood-${mood}`;
    setClickedChips(prev => new Set(prev).add(chipKey));
    setTimeout(() => {
      setClickedChips(prev => {
        const newSet = new Set(prev);
        newSet.delete(chipKey);
        return newSet;
      });
    }, 1000);

    // Show snackbar feedback
    if (showSnackbar) {
      showSnackbar(`Added "${mood}" mood to your personality!`, 'success');
    }
  };

  const handleDeletePersonality = (modelNameToDelete?: string) => {
    const nameToDelete = modelNameToDelete || localSelectedModel.selectedModel;
    
    if (!nameToDelete) {
      debugLogger.warn("No model selected for deletion");
      return;
    }
    
    setPersonalityToDelete(nameToDelete);
    setDeleteDialogOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      if (showSnackbar) {
        showSnackbar('Please select a JPG or PNG image file.', 'error');
      }
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      if (showSnackbar) {
        showSnackbar('Image file size must be less than 10MB.', 'error');
      }
      return;
    }

    setSelectedImageFile(file);
    setCropperOpen(true);
  };

  const handleCropComplete = (croppedImageData: string) => {
    setCustomAvatarBase64(croppedImageData);
    setPresetAvatar(null);
    setCropperOpen(false);
    setSelectedImageFile(null);
    
    if (showSnackbar) {
      showSnackbar('Avatar cropped successfully!', 'success');
    }
  };

  const handleCropperClose = () => {
    setCropperOpen(false);
    setSelectedImageFile(null);
  };

  const confirmDeletePersonality = async () => {
    if (!personalityToDelete) return;

    debugLogger.info("Deleting personality", { modelName: personalityToDelete });
    
    try {
      const storeConfigs = [{ name: "config", keyPath: "id" }];
      
      // Check if this is a Bandit personality that should be tracked as deleted
      const isBanditPersonality = defaultModels.some(banditModel => banditModel.name === personalityToDelete);
      
      if (isBanditPersonality) {
        // Add to deleted models tracking list
        const deletedEntry = await indexedDBService.get("banditConfig", 1, "config", "deletedModels", storeConfigs);
        const deletedModelNames = deletedEntry?.deleted ?? [];
        
        if (!deletedModelNames.includes(personalityToDelete)) {
          const updatedDeletedNames = [...deletedModelNames, personalityToDelete];
          await indexedDBService.put("banditConfig", 1, "config", {
            id: "deletedModels",
            deleted: updatedDeletedNames,
          }, storeConfigs);
          debugLogger.info("Added Bandit personality to deleted tracking list", { 
            deletedPersonality: personalityToDelete 
          });
        }
      }
      
      // Remove from IndexedDB
      await indexedDBService.delete("banditConfig", 1, "config", personalityToDelete, storeConfigs);
      
      // Update Zustand store
      useModelStore.setState({
        availableModels: availableModels.filter(model => model.name !== personalityToDelete),
      });
      
      // Reset form to first available model (or empty if no custom models)
      const remainingModels = availableModels.filter(model => model.name !== personalityToDelete);
      const firstModel = remainingModels.length > 0 ? remainingModels[0] : null;
      
      if (firstModel) {
        setSelectedModel(firstModel.name);
        setLocalSelectedModel({
          selectedModel: firstModel.name,
          name: firstModel.name,
          tagline: firstModel.tagline || "",
          systemPrompt: firstModel.systemPrompt || "",
        });
        setCustomAvatarBase64(firstModel.avatarBase64 || null);
        setPresetAvatar(null);
      } else {
        // No custom models left, reset form
        setSelectedModel("");
        setLocalSelectedModel({
          selectedModel: "",
          name: "",
          tagline: "",
          systemPrompt: "",
        });
        setCustomAvatarBase64(null);
        setPresetAvatar(null);
      }
      
      debugLogger.info("✅ Personality deleted successfully");
      
      // Show success message
      if (showSnackbar) {
        showSnackbar(`Personality "${personalityToDelete}" deleted successfully!`, 'success');
      }
      
    } catch (error) {
      debugLogger.error("Failed to delete personality", { error });
      
      // Show error message
      if (showSnackbar) {
        showSnackbar("Failed to delete personality. Please try again.", 'error');
      }
    } finally {
      setDeleteDialogOpen(false);
      setPersonalityToDelete(null);
    }
  };

  const renderTemplatesTab = () => (
    <>
      <GlobalStyles
        styles={{
          '@keyframes pulse': {
            '0%': {
              transform: 'scale(1)',
              opacity: 1,
            },
            '50%': {
              transform: 'scale(1.05)',
              opacity: 0.8,
            },
            '100%': {
              transform: 'scale(1)',
              opacity: 1,
            },
          },
        }}
      />
      <Box sx={{ 
        height: "100%", 
        overflow: "auto",
        p: { xs: 1.5, sm: 2 },
        // Hide scrollbars while keeping scroll functionality
        scrollbarWidth: "none", // Firefox
        "&::-webkit-scrollbar": {
          display: "none", // Chrome, Safari, Edge
        },
        "-ms-overflow-style": "none", // IE and Edge
      }}>
      <Box sx={{ 
        display: "flex", 
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "flex-start", md: "center" },
        justifyContent: "space-between",
        mb: { xs: 2, md: 3 },
        flexWrap: "wrap",
        gap: { xs: 1.5, md: 2 }
      }}>
        <Box sx={{ 
          display: "flex", 
          alignItems: "center", 
          gap: { xs: 1.1, sm: 1.5 },
          width: { xs: "100%", md: "auto" }
        }}>
          <Box sx={{
            background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
            borderRadius: 2,
            p: { xs: 0.75, sm: 1 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: { xs: "42px", sm: "48px" },
            height: { xs: "42px", sm: "48px" },
            boxShadow: "0 4px 12px rgba(25,118,210,0.25)",
          }}>
            <RocketLaunchOutlinedIcon sx={{ fontSize: { xs: "1.3rem", sm: "1.5rem" }, color: 'common.white' }} />
          </Box>
          <Box sx={{ textAlign: { xs: "left", md: "initial" }, flex: 1 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700,
                background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 0.5,
                fontSize: { xs: "1.55rem", sm: "1.75rem" }
              }}
            >
              Quick Start Templates
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", fontWeight: 500, fontSize: { xs: "0.85rem", sm: "0.9rem" } }}
            >
              12 curated personalities • Ready to use
            </Typography>
          </Box>
        </Box>
        <Chip
          label="New"
          size="small"
          sx={{
            background: "linear-gradient(135deg, #ff4081 0%, #f06292 100%)",
            color: "white",
            fontWeight: 600,
            animation: "pulse 2s infinite",
            alignSelf: { xs: "flex-start", md: "center" }
          }}
        />
      </Box>
      
      <Alert 
        severity="info" 
        sx={{ 
          mb: { xs: 2.5, md: 4 }, 
          borderRadius: 2,
          border: "1px solid rgba(25, 118, 210, 0.2)",
          background: "linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(66, 165, 245, 0.05) 100%)",
          px: { xs: 1.5, sm: 2 },
          py: { xs: 1.25, sm: 1.5 },
          "& .MuiAlert-icon": {
            color: "primary.main"
          }
        }}
        icon={<Typography sx={{ fontSize: "1.2rem" }}>💡</Typography>}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main", fontSize: { xs: "0.85rem", sm: "0.9rem" } }}>
            Choose a template to get started instantly
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: { xs: "0.85rem", sm: "0.9rem" }, lineHeight: 1.5 }}>
            Click any template to automatically fill the creation form with a proven personality setup. 
            You can then customize it further to match your specific needs.
          </Typography>
        </Box>
      </Alert>
      
      {/* Create from Scratch Card */}
      <Card
        sx={{
          mb: { xs: 3, md: 4 },
          background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
          border: "2px solid transparent",
          borderRadius: 3,
          cursor: "pointer",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          overflow: "hidden",
          "&:hover": {
            transform: "translateY(-4px) scale(1.02)",
            boxShadow: "0 12px 40px rgba(25, 118, 210, 0.3)",
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
            pointerEvents: "none",
          }
        }}
        onClick={() => {
          setLocalSelectedModel({
            name: "",
            tagline: "",
            systemPrompt: "",
            selectedModel: "",
          });
          setCustomAvatarBase64(null);
          setPresetAvatar(null);
          setPersonalityTabIndex(1); // Switch to Create/Edit tab
        }}
      >
        <CardContent sx={{ 
          p: { xs: 3, sm: 4 }, 
          color: "white",
          textAlign: "center",
          position: "relative",
          zIndex: 1
        }}>
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 0,
            mb: { xs: 1.5, sm: 2 },
          }}>
            <AutoAwesomeIcon sx={{ fontSize: { xs: 36, sm: 44 }, color: 'common.white', filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.25))" }} />
          </Box>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700,
              mb: { xs: 0.75, sm: 1 },
              textShadow: "0 2px 4px rgba(0,0,0,0.2)"
            }}
          >
            Create from Scratch
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              opacity: 0.9,
              fontWeight: 500,
              textShadow: "0 1px 2px rgba(0,0,0,0.2)"
            }}
          >
            Start with a blank canvas and build your perfect AI personality
          </Typography>
        </CardContent>
      </Card>
      
      <Box sx={{ 
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
          lg: "repeat(4, 1fr)",
          xl: "repeat(4, 1fr)",
        },
        gap: { xs: 2, sm: 2.5, md: 3 },
        alignItems: "stretch"
      }}>
        {promptTemplates.map((template, index) => (
          <Card
            key={index}
            sx={{
              cursor: "pointer",
              position: "relative",
              background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
              backdropFilter: "blur(10px)",
              border: "1px solid",
              borderColor: "rgba(255,255,255,0.1)",
              borderRadius: 3,
              minHeight: { xs: "auto", md: "280px" },
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: `linear-gradient(90deg, 
                  hsl(${(index * 30) % 360}, 70%, 60%) 0%, 
                  hsl(${(index * 30 + 60) % 360}, 70%, 60%) 100%)`,
                opacity: 0,
                transition: "opacity 0.3s ease",
              },
              "&:hover": {
                transform: "translateY(-8px) scale(1.02)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                borderColor: "primary.main",
                "&::before": {
                  opacity: 1,
                },
                "& .template-icon": {
                  transform: "scale(1.1) rotate(5deg)",
                },
                "& .template-chip": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                },
              },
              "&:active": {
                transform: "translateY(-4px) scale(1.01)",
              }
            }}
            onClick={() => handleTemplateSelect(template)}
          >
            <CardContent sx={{ 
              p: { xs: 2.5, sm: 3 }, 
              display: "flex", 
              flexDirection: "column", 
              height: "100%",
              justifyContent: "space-between"
            }}>
              {/* Header Section */}
              <Box>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  mb: { xs: 2, md: 2.5 },
                  minHeight: { xs: "auto", md: "60px" }
                }}>
                  <Avatar
                    src={template.avatar}
                    alt={template.name}
                    sx={{
                      width: { xs: 48, sm: 56, md: 60 },
                      height: { xs: 48, sm: 56, md: 60 },
                      mr: { xs: 1.5, md: 2 },
                      transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      border: "2px solid rgba(255,255,255,0.8)",
                    }}
                  />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: { xs: "1rem", sm: "1.05rem", md: "1.1rem" },
                        lineHeight: 1.2,
                        mb: 0.5,
                        color: "text.primary",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}
                    >
                      {template.name}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: "text.secondary",
                        fontStyle: "italic",
                        fontSize: { xs: "0.75rem", sm: "0.78rem", md: "0.8rem" },
                        fontWeight: 500,
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}
                    >
                      {template.tagline}
                    </Typography>
                  </Box>
                </Box>

                {/* Description Section */}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: "text.secondary",
                    lineHeight: 1.5,
                    fontSize: { xs: "0.82rem", sm: "0.85rem", md: "0.875rem" },
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    mb: { xs: 1.5, md: 2 },
                    minHeight: { xs: "auto", md: "84px" },
                  }}
                >
                  {template.description}
                </Typography>
              </Box>

              {/* Footer Section */}
              <Box sx={{ 
                display: "flex", 
                justifyContent: "center",
                alignItems: "center"
              }}>
                <Chip
                  className="template-chip"
                  label="Apply Template"
                  size="small"
                  icon={<PlayArrowRoundedIcon sx={{ color: 'inherit', fontSize: '1rem !important' }} />}
                  sx={{
                    background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                    color: "white",
                    fontWeight: 600,
                    fontSize: { xs: "0.72rem", md: "0.75rem" },
                    height: { xs: "30px", md: "32px" },
                    px: { xs: 1.5, md: 2 },
                    borderRadius: 2,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #1565c0 0%, #1e88e5 100%)",
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Alert 
        severity="info" 
        sx={{ mt: { xs: 2.5, md: 4 }, borderRadius: 2, px: { xs: 1.5, sm: 2 }, py: { xs: 1.25, sm: 1.5 } }}
        icon={<Typography>💡</Typography>}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: "0.85rem", sm: "0.9rem" } }}>
          Pro Tip:
        </Typography>
        <Typography variant="body2" sx={{ fontSize: { xs: "0.85rem", sm: "0.9rem" }, lineHeight: 1.5 }}>
          Click any template to automatically switch to the Create/Edit tab with the form pre-filled. Mix and match ideas to create your perfect AI personality!
        </Typography>
      </Alert>
      </Box>
    </>
  );

  const renderCreateEditTab = () => (
    <Box sx={{ 
      height: "100%", 
      overflow: "auto",
      p: { xs: 1.5, sm: 2 },
      // Hide scrollbars while keeping scroll functionality
      scrollbarWidth: "none", // Firefox
      "&::-webkit-scrollbar": {
        display: "none", // Chrome, Safari, Edge
      },
      "-ms-overflow-style": "none", // IE and Edge
    }}>
      <Box sx={{ mb: { xs: 2.5, md: 4 } }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            mb: 1,
            color: "primary.main",
            fontSize: { xs: "1.55rem", sm: "1.7rem" },
          }}
        >
          {localSelectedModel.selectedModel ? "Edit Personality" : "Create New Personality"}
        </Typography>
        
        <Typography
          variant="body1"
          sx={{ color: "text.secondary", mb: { xs: 2, md: 3 }, fontSize: { xs: "0.95rem", sm: "1rem" }, lineHeight: 1.5 }}
        >
          {localSelectedModel.selectedModel 
            ? `Customize and modify the "${localSelectedModel.selectedModel}" personality to better suit your needs.`
            : "Design a custom AI personality that matches your brand, use case, and communication style."
          }
        </Typography>

        {!localSelectedModel.selectedModel && (
          <Alert 
            severity="info" 
            sx={{ 
              mb: { xs: 2.5, md: 3 }, 
              borderRadius: 2,
              border: "1px solid rgba(25, 118, 210, 0.2)",
              background: "linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(66, 165, 245, 0.05) 100%)",
              px: { xs: 1.5, sm: 2 },
              py: { xs: 1.25, sm: 1.5 }
            }}
            icon={<Typography sx={{ fontSize: "1.2rem" }}>🎯</Typography>}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main", fontSize: { xs: "0.85rem", sm: "0.9rem" } }}>
              Creating a new personality
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", fontSize: { xs: "0.85rem", sm: "0.9rem" }, lineHeight: 1.5 }}>
              Fill out the form below to create your custom AI assistant. Start with a template from the Templates tab, or build from scratch!
            </Typography>
          </Alert>
        )}
      </Box>

      <Box sx={{ mb: sectionGap }}>
        {localSelectedModel.selectedModel && (
          <Box sx={{ display: "flex", alignItems: "center", mt: 2, mb: 3 }}>
            <Avatar
              src={
                resolveAvatar(
                  availableModels.find((m) => m.name === localSelectedModel.selectedModel) || {
                    name: localSelectedModel.selectedModel,
                    avatarBase64: customAvatarBase64,
                  }
                )
              }
              alt={localSelectedModel.selectedModel}
              sx={{ width: 48, height: 48, mr: 2, filter: "brightness(1.5)" }}
            />
            <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary" }}>{localSelectedModel.selectedModel}</Typography>
          </Box>
        )}
        
        <TextField
          label="Select Existing Personality to Edit"
          variant="outlined"
          value={localSelectedModel.selectedModel}
          onChange={(e) => {
            const selectedModelName = e.target.value;
            if (selectedModelName) {
              // Find the selected model and populate the form
              const selectedModelData = availableModels.find(m => m.name === selectedModelName);
              if (selectedModelData) {
                setLocalSelectedModel({
                  name: selectedModelData.name,
                  tagline: selectedModelData.tagline,
                  systemPrompt: selectedModelData.systemPrompt as string,
                  selectedModel: selectedModelName,
                });
                setCustomAvatarBase64(selectedModelData.avatarBase64 || null);
                setPresetAvatar(null);
              }
            } else {
              // Clear form for new personality
              setLocalSelectedModel({
                name: "",
                tagline: "",
                systemPrompt: "",
                selectedModel: "",
              });
              setCustomAvatarBase64(null);
              setPresetAvatar(null);
            }
            setSelectedModel(selectedModelName);
          }}
          fullWidth
          select
          sx={{ mb: sectionGap }}
        >
          <MenuItem value="">Create New Personality</MenuItem>
          {availableModels.map((model, index) => (
            <MenuItem key={index} value={model.name}>
              {model.name}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <TextField
        label="Personality Name"
        variant="outlined"
        value={localSelectedModel.name}
        onChange={(e) =>
          setLocalSelectedModel({ ...localSelectedModel, name: e.target.value })
        }
        fullWidth
        placeholder="e.g., My Custom Assistant"
        sx={{ mb: sectionGap }}
      />
      
      <TextField
        label="Tagline"
        variant="outlined"
        value={localSelectedModel.tagline}
        onChange={(e) =>
          setLocalSelectedModel({ ...localSelectedModel, tagline: e.target.value })
        }
        fullWidth
        placeholder="e.g., Your helpful companion for daily tasks"
        sx={{ mb: sectionGap }}
      />

      <Box sx={{ mb: sectionGap }}>
        <Typography variant="body1" sx={{ mb: 2, fontWeight: 600, color: "text.primary" }}>
          Mood & Personality
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          Click any mood to automatically add personality instructions to your system prompt:
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {moodSuggestions.map((mood) => (
            <Chip
              key={mood.label}
              label={mood.label}
              onClick={() => handleMoodSelect(mood.label)}
              sx={{
                bgcolor: mood.color + "20",
                color: mood.color,
                border: `1px solid ${mood.color}40`,
                "&:hover": {
                  bgcolor: mood.color + "30",
                  transform: "scale(1.05)",
                },
                transition: "all 0.2s ease-in-out",
                cursor: "pointer",
                ...(clickedChips.has(`mood-${mood.label}`) && {
                  transform: "scale(1.1)",
                  bgcolor: mood.color + "40",
                  boxShadow: `0 0 20px ${mood.color}60`,
                }),
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Formatting Guidance */}
      <Box sx={{ mb: sectionGap }}>
        <Typography variant="body1" sx={{ mb: 2, fontWeight: 600, color: "text.primary" }}>
          ✨ Formatting Tips
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          Click any tip to add professional formatting to your system prompt:
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {[
            { label: "Be Specific", text: "Always be specific and detailed in your responses.", color: "#2196F3" },
            { label: "Stay In Character", text: "Maintain your personality consistently throughout the conversation.", color: "#4CAF50" },
            { label: "Ask Questions", text: "Ask clarifying questions when you need more information to help effectively.", color: "#FF9800" },
            { label: "Be Helpful", text: "Always prioritize being helpful and providing actionable advice.", color: "#9C27B0" },
            { label: "Use Examples", text: "Provide concrete examples whenever possible to illustrate your points.", color: "#F44336" },
            { label: "Be Concise", text: "Keep responses focused and concise while still being thorough.", color: "#00BCD4" },
          ].map((tip) => (
            <Chip
              key={tip.label}
              label={tip.label}
              onClick={() => {
                const currentPrompt = localSelectedModel.systemPrompt || "";
                const updatedPrompt = currentPrompt + (currentPrompt ? "\n\n" : "") + tip.text;
                setLocalSelectedModel({
                  ...localSelectedModel,
                  systemPrompt: updatedPrompt
                });

                // Add visual feedback
                const chipKey = `tip-${tip.label}`;
                setClickedChips(prev => new Set(prev).add(chipKey));
                setTimeout(() => {
                  setClickedChips(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(chipKey);
                    return newSet;
                  });
                }, 1000);

                // Show snackbar feedback
                if (showSnackbar) {
                  showSnackbar(`Added "${tip.label}" tip to your prompt!`, 'success');
                }
              }}
              sx={{
                bgcolor: tip.color + "20",
                color: tip.color,
                border: `1px solid ${tip.color}40`,
                "&:hover": {
                  bgcolor: tip.color + "30",
                  transform: "scale(1.05)",
                },
                transition: "all 0.2s ease-in-out",
                cursor: "pointer",
                ...(clickedChips.has(`tip-${tip.label}`) && {
                  transform: "scale(1.1)",
                  bgcolor: tip.color + "40",
                  boxShadow: `0 0 20px ${tip.color}60`,
                }),
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Formatting Tools */}
      <Box sx={{ mb: sectionGap }}>
        <Typography variant="body1" sx={{ mb: 2, fontWeight: 600, color: "text.primary" }}>
          Formatting Tools
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          Add visual formatting to make your AI responses more engaging:
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {[
            { 
              label: "Highlight Text", 
              text: "Use <mark>highlighted text</mark> to emphasize important points.", 
              color: "#FFC107",
              icon: "🔍"
            },
            { 
              label: "Bold Emphasis", 
              text: "Use **bold text** to make key concepts stand out.", 
              color: "#795548",
              icon: "💪"
            },
            { 
              label: "Add Emojis", 
              text: "Use relevant emojis 🎯 to make responses more friendly and engaging.", 
              color: "#FF9800",
              icon: "😊"
            },
            { 
              label: "Code Blocks", 
              text: "Use `code snippets` or ```code blocks``` for technical content.", 
              color: "#424242",
              icon: "💻"
            },
            { 
              label: "Lists & Structure", 
              text: "Use bullet points:\n• Point 1\n• Point 2\n• Point 3", 
              color: "#607D8B",
              icon: "📝"
            },
            { 
              label: "Action Items", 
              text: "Create actionable steps:\n✅ Do this first\n🔄 Then this\n🎯 Finally this", 
              color: "#4CAF50",
              icon: "✅"
            },
          ].map((tool) => (
            <Chip
              key={tool.label}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography component="span" sx={{ fontSize: "0.85rem" }}>
                    {tool.icon}
                  </Typography>
                  <Typography component="span" sx={{ fontSize: "0.875rem" }}>
                    {tool.label}
                  </Typography>
                </Box>
              }
              onClick={() => {
                const currentPrompt = localSelectedModel.systemPrompt || "";
                const updatedPrompt = currentPrompt + (currentPrompt ? "\n\n" : "") + tool.text;
                setLocalSelectedModel({
                  ...localSelectedModel,
                  systemPrompt: updatedPrompt
                });

                // Add visual feedback
                const chipKey = `tool-${tool.label}`;
                setClickedChips(prev => new Set(prev).add(chipKey));
                setTimeout(() => {
                  setClickedChips(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(chipKey);
                    return newSet;
                  });
                }, 1000);

                // Show snackbar feedback
                if (showSnackbar) {
                  showSnackbar(`Added "${tool.label}" formatting to your prompt!`, 'success');
                }
              }}
              sx={{
                bgcolor: tool.color + "20",
                color: tool.color,
                border: `1px solid ${tool.color}40`,
                "&:hover": {
                  bgcolor: tool.color + "30",
                  transform: "scale(1.05)",
                },
                transition: "all 0.2s ease-in-out",
                cursor: "pointer",
                height: "36px",
                "& .MuiChip-label": {
                  px: 1.5,
                },
                ...(clickedChips.has(`tool-${tool.label}`) && {
                  transform: "scale(1.1)",
                  bgcolor: tool.color + "40",
                  boxShadow: `0 0 20px ${tool.color}60`,
                }),
              }}
            />
          ))}
        </Box>
      </Box>

      <TextField
        label="System Prompt"
        variant="outlined"
        value={localSelectedModel.systemPrompt}
        onChange={(e) =>
          setLocalSelectedModel({ ...localSelectedModel, systemPrompt: e.target.value })
        }
        fullWidth
        multiline
        rows={10}
        placeholder="Describe how your assistant should behave..."
        InputLabelProps={{ shrink: true }}
        InputProps={{
          style: {
            minHeight: isMobile ? "180px" : "240px",
            maxHeight: "360px",
          },
        }}
        sx={{ mb: 3 }}
      />

      {/* Avatar selection: show for all models */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" sx={{ mb: 2, fontWeight: 600, color: "text.primary" }}>
          Select an Avatar
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          Choose from our curated collection of avatars to give your AI personality a face:
        </Typography>
        
        {/* Premium Professional Avatars */}
        <Typography variant="caption" sx={{ mb: 1, color: "primary.main", fontWeight: 600, display: "block" }}>
          🤖 Robotic Collection
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          {[
            { label: 'Fembot', src: "https://cdn.burtson.ai/avatars/fembot.png" },
            { label: 'Dudebot', src: "https://cdn.burtson.ai/avatars/dudebot.png" },
            { label: 'Coolbot', src: "https://cdn.burtson.ai/avatars/coolbot.png" }
          ].map(({ label, src }) => (
            <Avatar
              key={label}
              src={src}
              alt={label}
              onClick={() => {
                setPresetAvatar(src);
                setCustomAvatarBase64(null);
              }}
              sx={{
                width: 72,
                height: 72,
                border: presetAvatar === src ? "3px solid #1976d2" : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: presetAvatar === src ? "0 4px 12px rgba(25,118,210,0.3)" : "none",
                '&:hover': {
                  border: "3px solid #1976d2",
                  transform: "scale(1.05)",
                  boxShadow: "0 4px 12px rgba(25,118,210,0.3)",
                },
              }}
            />
          ))}
        </Box>

        {/* Professional Character Avatars */}
        <Typography variant="caption" sx={{ mb: 1, color: "secondary.main", fontWeight: 600, display: "block" }}>
          👥 Professional Characters
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          {[
            { label: 'Business Professional', src: "https://cdn.burtson.ai/avatars/businessman.png", role: 'Business & Strategy' },
            { label: 'Data Scientist', src: "https://cdn.burtson.ai/avatars/datascience.png", role: 'Analytics & Insights' },
            { label: 'Support Specialist', src: "https://cdn.burtson.ai/avatars/support.png", role: 'Customer Support' },
            { label: 'Creative Professional', src: "https://cdn.burtson.ai/avatars/mediagal.png", role: 'Media & Design' },
            { label: 'Trainer & Mentor', src: "https://cdn.burtson.ai/avatars/trainer.png", role: 'Learning & Development' },
            { label: 'Researcher', src: "https://cdn.burtson.ai/avatars/researcher.png", role: 'Research & Analysis' },
            { label: 'Startup Mentor', src: "https://cdn.burtson.ai/avatars/startupmentor.png", role: 'Entrepreneurship' },
            { label: 'Travel Expert', src: "https://cdn.burtson.ai/avatars/travel.png", role: 'Travel & Adventure' },
          ].map(({ label, src, role }) => (
            <Box key={label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <Avatar
                src={src}
                alt={label}
                onClick={() => {
                  setPresetAvatar(src);
                  setCustomAvatarBase64(null);
                }}
                sx={{
                  width: 72,
                  height: 72,
                  border: presetAvatar === src ? "3px solid #1976d2" : "2px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: presetAvatar === src ? "0 4px 12px rgba(25,118,210,0.3)" : "none",
                  '&:hover': {
                    border: "3px solid #1976d2",
                    transform: "scale(1.05)",
                    boxShadow: "0 4px 12px rgba(25,118,210,0.3)",
                  },
                }}
              />
              <Typography variant="caption" sx={{ 
                textAlign: 'center', 
                maxWidth: '80px', 
                fontSize: '0.7rem',
                lineHeight: 1.2,
                color: 'text.secondary',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {role}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Custom Upload Section */}
        <Typography variant="caption" sx={{ mb: 1, color: "warning.main", fontWeight: 600, display: "block" }}>
          📸 Custom Upload
        </Typography>
        <Button 
          variant="outlined" 
          component="label"
          sx={{
            mb: 2,
            px: { xs: 2.2, sm: 3 },
            py: { xs: 1.2, sm: 1.5 },
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            borderStyle: 'dashed',
            borderWidth: 2,
            '&:hover': {
              borderStyle: 'dashed',
              borderWidth: 2,
            },
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          🎯 Upload & Crop Custom Avatar
          <input 
            type="file" 
            accept="image/png, image/jpeg, image/jpg" 
            hidden 
            onChange={handleImageUpload}
          />
        </Button>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.8rem' }}>
          • Supports JPG/PNG up to 10MB • Built-in cropper for perfect sizing • Final output: 512×512px
        </Typography>

        {(customAvatarBase64 || presetAvatar) && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={(customAvatarBase64 || presetAvatar) as string}
              alt="Avatar Preview"
              sx={{ 
                width: 96, 
                height: 96,
                border: '3px solid',
                borderColor: 'primary.main',
                boxShadow: 3
              }}
            />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                ✅ Avatar Ready
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {customAvatarBase64 ? 'Custom uploaded image' : 'Professional avatar selected'}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Avatar Cropper Dialog */}
        <AvatarCropper
          open={cropperOpen}
          onClose={handleCropperClose}
          onCrop={handleCropComplete}
          imageFile={selectedImageFile}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 1.5, sm: 2 },
          justifyContent: "flex-start", // Changed from flex-end to flex-start
          mr: { xs: 0, sm: 10 }, // Add right margin to avoid FAB
          mb: { xs: 8, sm: 2 }, // Add bottom margin on mobile for FAB clearance
        }}
      >
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleResetModel}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Reset Form
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveModel}
          disabled={!localSelectedModel.name || !localSelectedModel.systemPrompt}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Save Personality
        </Button>
      </Box>
    </Box>
  );

  const renderManageTab = () => (
    <Box sx={{ 
      height: "100%", 
      overflow: "auto",
      p: { xs: 1.5, sm: 2 },
      // Hide scrollbars while keeping scroll functionality
      scrollbarWidth: "none", // Firefox
      "&::-webkit-scrollbar": {
        display: "none", // Chrome, Safari, Edge
      },
      "-ms-overflow-style": "none", // IE and Edge
    }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          mb: { xs: 2, md: 3 },
          flexWrap: "wrap",
          gap: { xs: 1.5, md: 2 },
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, color: "primary.main", fontSize: { xs: "1.45rem", md: "1.65rem" } }}
        >
          📋 Manage Personalities ({availableModels.length})
        </Typography>
        <Box sx={{ display: "flex", gap: { xs: 1, md: 2 }, flexWrap: "wrap", width: { xs: "100%", md: "auto" } }}>
          <Button
            variant="contained"
            color="primary"
            size={isMobile ? "medium" : "large"}
            startIcon={<AutoAwesomeIcon fontSize={isMobile ? 'small' : 'medium'} />}
            onClick={() => {
              setLocalSelectedModel({
                name: "",
                tagline: "",
                systemPrompt: "",
                selectedModel: "",
              });
              setCustomAvatarBase64(null);
              setPresetAvatar(null);
              setPersonalityTabIndex(1); // Switch to Create/Edit tab
            }}
            sx={{ 
              px: { xs: 2.2, md: 3 },
              py: { xs: 0.95, md: 1 },
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: 3,
              '&:hover': {
                boxShadow: 6,
              },
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Create Personality
          </Button>
          <Button
            variant="outlined"
            color="info"
            onClick={() => setRestoreDialogOpen(true)}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Restore Defaults
          </Button>
        </Box>
      </Box>

      {availableModels.length === 0 ? (
        <Card sx={{ textAlign: "center", py: 8, border: "2px dashed", borderColor: "divider" }}>
          <CardContent>
            <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary" }} gutterBottom>
              🤖 No Personalities Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Get started by creating your first custom AI personality or choosing from our templates.
            </Typography>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap", mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setLocalSelectedModel({
                    name: "",
                    tagline: "",
                    systemPrompt: "",
                    selectedModel: "",
                  });
                  setCustomAvatarBase64(null);
              setPresetAvatar(null);
              setPersonalityTabIndex(1); // Switch to Create/Edit tab
            }}
            sx={{ px: { xs: 2.4, md: 3 }, py: { xs: 0.95, md: 1 }, width: { xs: '100%', sm: 'auto' } }}
          >
            ✨ Create From Scratch
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setPersonalityTabIndex(0)} // Switch to Templates tab
            sx={{ px: { xs: 2.4, md: 3 }, py: { xs: 0.95, md: 1 }, width: { xs: '100%', sm: 'auto' } }}
          >
            🎭 Browse Templates
          </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 3 } }}>
          {availableModels.map((model) => (
          <Card key={model.name} sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: { xs: 1.5, md: 2 } }}>
                <Avatar
                  src={resolveAvatar(model)}
                  alt={model.name}
                  sx={{ width: { xs: 44, sm: 48 }, height: { xs: 44, sm: 48 }, mr: { xs: 1.5, sm: 2 } }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary" }}>
                    {model.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                    {model.tagline}
                  </Typography>
                </Box>
              </Box>
              
              <Typography 
                variant="body2" 
                sx={{ 
                  color: "text.secondary", 
                  mb: 3,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {model.systemPrompt}
              </Typography>

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    setLocalSelectedModel({
                      name: model.name,
                      tagline: model.tagline,
                      systemPrompt: model.systemPrompt as string,
                      selectedModel: model.name,
                    });
                    setCustomAvatarBase64(model.avatarBase64 || null);
                    setPresetAvatar(null);
                    setPersonalityTabIndex(1); // Switch to edit tab
                  }}
                  sx={{ flex: 1 }}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleDeletePersonality(model.name)}
                  sx={{ flex: 1 }}
                >
                  Delete
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
        </Box>
      )}

      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)}>
        <DialogTitle>Restore Default Personalities?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will delete all custom personalities and reset to the original configuration.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={async () => {
              useModelStore.setState({ isInitializing: true });
              
              try {
                useModelStore.setState({ availableModels: [] });
                setSelectedModel("");
                setLocalSelectedModel({
                  name: "",
                  tagline: "",
                  systemPrompt: "",
                  selectedModel: "",
                });
                setPresetAvatar(null);
                setCustomAvatarBase64(null);
                await restoreDefaultModelsAndConfig();
                setRestoreDialogOpen(false);
              } catch (error) {
                debugLogger.error("Failed to restore defaults", { error });
                setRestoreDialogOpen(false);
              } finally {
                useModelStore.setState({ isInitializing: false });
              }
            }}
            color="error"
            variant="contained"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Personality Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Personality?</DialogTitle>
        <DialogContent>
          {personalityToDelete && (
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Avatar
                src={resolveAvatar(
                  availableModels.find(m => m.name === personalityToDelete) || {
                    name: personalityToDelete,
                    avatarBase64: null,
                  }
                )}
                alt={personalityToDelete}
                sx={{ width: 56, height: 56, mr: 2 }}
              />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {personalityToDelete}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {availableModels.find(m => m.name === personalityToDelete)?.tagline || "Custom personality"}
                </Typography>
              </Box>
            </Box>
          )}
          <DialogContentText>
            Are you sure you want to delete this personality? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={confirmDeletePersonality}
            color="error"
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          mb: { xs: 2, md: 3 },
          gap: { xs: 1.5, md: 2 },
        }}
      >
        <Box sx={{ textAlign: { xs: "left", md: "initial" } }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, mb: 1, color: "primary.main", fontSize: { xs: "1.6rem", md: "1.8rem" } }}
          >
            Personalities
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "text.secondary", fontSize: { xs: "0.95rem", sm: "1rem" }, lineHeight: 1.5 }}
          >
            Create and manage AI personalities that match your brand and use case.
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          size={isMobile ? "medium" : "large"}
          startIcon={<AutoAwesomeIcon fontSize={isMobile ? 'small' : 'medium'} />}
          onClick={() => {
            setLocalSelectedModel({
              name: "",
              tagline: "",
              systemPrompt: "",
              selectedModel: "",
            });
            setCustomAvatarBase64(null);
            setPresetAvatar(null);
            setPersonalityTabIndex(1); // Switch to Create/Edit tab
          }}
          sx={{ 
            px: { xs: 2.4, sm: 3 },
            py: { xs: 0.95, sm: 1 },
            fontWeight: 600,
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: 3,
            '&:hover': {
              boxShadow: 6,
            },
            width: { xs: '100%', md: 'auto' },
            minWidth: { xs: 'auto', md: '200px' }
          }}
        >
          Create Personality
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: { xs: 1.5, md: 2 } }}>
        <Tabs 
          value={personalityTabIndex} 
          onChange={(_, newValue) => setPersonalityTabIndex(newValue)}
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              minWidth: { xs: 'auto', md: 160 },
              px: { xs: 1.1, sm: 1.5 },
              ...(isMobile ? { minHeight: 52 } : {}),
            },
            '& .MuiTab-wrapper': tabWrapperStyles,
          }}
        >
          <Tab 
            icon={<ViewModuleOutlinedIcon fontSize={isMobile ? 'small' : 'medium'} />} 
            iconPosition={isMobile ? 'top' : 'start'}
            label="Templates" 
            sx={{ 
              color: personalityTabIndex === 0 ? 'primary.main' : 'text.secondary',
              py: { xs: 0.5, sm: 0.75 },
              gap: { xs: 0.5, sm: 1 }
            }}
          />
          <Tab 
            icon={<EditNoteOutlinedIcon fontSize={isMobile ? 'small' : 'medium'} />} 
            iconPosition={isMobile ? 'top' : 'start'}
            label="Create / Edit" 
            sx={{ 
              color: personalityTabIndex === 1 ? 'primary.main' : 'text.secondary',
              py: { xs: 0.7, sm: 0.75 }
            }}
          />
          <Tab 
            icon={<ManageAccountsOutlinedIcon fontSize={isMobile ? 'small' : 'medium'} />} 
            iconPosition={isMobile ? 'top' : 'start'}
            label="Manage" 
            sx={{ 
              color: personalityTabIndex === 2 ? 'primary.main' : 'text.secondary',
              py: { xs: 0.7, sm: 0.75 }
            }}
          />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, overflow: "hidden" }}>
        {personalityTabIndex === 0 && renderTemplatesTab()}
        {personalityTabIndex === 1 && renderCreateEditTab()}
        {personalityTabIndex === 2 && renderManageTab()}
      </Box>
    </Box>
  );
};

export default PersonalitiesTab;
