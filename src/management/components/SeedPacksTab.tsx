/*
  (c) 2025 Burtson Labs - Licensed under Business Source License 1.1
  https://burtson.ai/license

  This file is protected intellectual property.
  Do NOT use in commercial software, prompts, AI training data, or derivative works without a valid commercial license.

  AI NOTICE: This file contains visible and invisible watermarks.
  VIOLATION NOTICE: Removing, modifying, or obscuring these watermarks is a license violation.
  LICENSE TERMINATION: Upon license termination, ALL forks, copies, and derivatives must be permanently deleted.
  AUDIT TRAIL: File usage is logged and monitored for compliance verification.
*/

// Bandit Engine Watermark: BL-WM-1F3C-7D9A12
const __banditFingerprint_components_SeedPacksTabtsx = "BL-FP-5A7C2E-4C11";
const __auditTrail_components_SeedPacksTabtsx = "BL-AU-MGOIKVWY-KL2N";
// File: SeedPacksTab.tsx | Path: src/management/components/SeedPacksTab.tsx | Hash: 1f3c4c11

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItemButton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArchiveIcon from "@mui/icons-material/Archive";
import DeleteIcon from "@mui/icons-material/Delete";
import DescriptionIcon from "@mui/icons-material/Description";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import GroupIcon from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";
import PublishIcon from "@mui/icons-material/Publish";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { usePackageSettingsStore } from "../../store/packageSettingsStore";
import { useAuthenticationStore } from "../../store/authenticationStore";
import StreamingMarkdown from "../../components/StreamingMarkdown";
import { debugLogger } from "../../services/logging/debugLogger";
import {
  archiveSeedPack,
  createSeedPack,
  deleteSeedPack,
  getSeedPack,
  listSeedPacks,
  publishSeedPack,
  updateSeedPack,
  type SeedPack,
  type SeedPackDraft,
  type SeedPackStatus,
} from "../../services/seedPacks/seedPackService";

type SnackbarSeverity = "success" | "error" | "info" | "warning";
type ImportSource = "local" | "azure-wiki";

interface SeedPackFormState {
  name: string;
  description: string;
  content: string;
}

interface ImportedMarkdownFile {
  id: string;
  name: string;
  size: number;
  content: string;
  lastModified: number;
  relativePath?: string;
  source: ImportSource;
}

const parseTags = (value: string): string[] =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

const normalizeTags = (tags?: string[]): string[] =>
  (tags ?? [])
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

const areArraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
};

const formatTimestamp = (value?: string): string => {
  if (!value) {
    return "Not set";
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Date(parsed).toLocaleString();
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const getPreviewSnippet = (content: string): string => {
  const trimmed = content.trim();
  if (!trimmed) {
    return "No preview available";
  }
  return trimmed.length > 120 ? `${trimmed.slice(0, 120)}...` : trimmed;
};

const getImportedFileKey = (file: Pick<ImportedMarkdownFile, "name" | "relativePath">): string =>
  (file.relativePath ?? file.name).toLowerCase();

const isMarkdownFileName = (name: string): boolean => {
  const lower = name.toLowerCase();
  return lower.endsWith(".md") || lower.endsWith(".markdown");
};

const getWebkitRelativePath = (file: File): string | undefined => {
  const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  if (!relativePath) {
    return undefined;
  }
  const trimmed = relativePath.trim().replace(/^\/+/, "");
  return trimmed.length > 0 ? trimmed : undefined;
};

const mergeMarkdownFiles = (
  existing: ImportedMarkdownFile[],
  incoming: ImportedMarkdownFile[]
): ImportedMarkdownFile[] => {
  const next = [...existing];
  incoming.forEach((file) => {
    const index = next.findIndex((item) => getImportedFileKey(item) === getImportedFileKey(file));
    if (index >= 0) {
      next[index] = file;
    } else {
      next.push(file);
    }
  });
  return next;
};

const buildMarkdownContent = (files: ImportedMarkdownFile[]): string => {
  return files
    .map((file) => file.content.trim())
    .filter((content) => content.length > 0)
    .join("\n\n---\n\n");
};

const readMarkdownFiles = async (
  files: FileList | File[],
  source: ImportSource = "local"
): Promise<{ imported: ImportedMarkdownFile[]; skipped: number }> => {
  const list = Array.from(files);
  const markdownFiles = list.filter((file) => isMarkdownFileName(file.name));
  const imported = await Promise.all(
    markdownFiles.map(async (file) => {
      const relativePath = getWebkitRelativePath(file);
      return {
        id: `${source}-${relativePath ?? file.name}-${file.lastModified}-${file.size}`,
        name: file.name,
        size: file.size,
        content: await file.text(),
        lastModified: file.lastModified,
        relativePath,
        source,
      };
    })
  );
  return { imported, skipped: list.length - markdownFiles.length };
};

const getStatusChip = (status: SeedPackStatus) => {
  switch (status) {
    case "published":
      return { label: "Published", color: "success" as const };
    case "archived":
      return { label: "Archived", color: "default" as const };
    case "draft":
    default:
      return { label: "Draft", color: "warning" as const };
  }
};

const getSeedPackTimestamp = (pack: SeedPack): number => {
  const candidate = pack.updatedAt ?? pack.publishedAt ?? pack.createdAt;
  if (!candidate) {
    return 0;
  }
  const parsed = Date.parse(candidate);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const SeedPackFileCard: React.FC<{
  file: ImportedMarkdownFile;
  onPreview: () => void;
  onRemove: () => void;
  isReadOnly: boolean;
}> = ({ file, onPreview, onRemove, isReadOnly }) => (
  <Card
    sx={{
      position: "relative",
      height: { xs: 240, sm: 260, md: 280 },
      cursor: "pointer",
      transition: "all 0.3s ease-in-out",
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
      display: "flex",
      flexDirection: "column",
      "&:hover": {
        boxShadow: 6,
        transform: "translateY(-2px)",
      },
    }}
    onClick={onPreview}
  >
    <CardContent
      sx={{
        p: { xs: 1.5, sm: 2 },
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 1,
          height: 32,
        }}
      >
        <DescriptionIcon sx={{ fontSize: 32, color: "#388e3c", flexShrink: 0 }} />
        {!isReadOnly && (
          <IconButton
            size="small"
            color="error"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            sx={{ width: 24, height: 24 }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Box
        sx={{
          mb: 1.5,
          p: { xs: 1, sm: 1.5 },
          borderRadius: 1.5,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
          position: "relative",
          height: { xs: 60, sm: 70, md: 80 },
          display: "flex",
          alignItems: "center",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: "text.secondary",
            lineHeight: 1.3,
            fontSize: "0.8rem",
          }}
        >
          {getPreviewSnippet(file.content)}
        </Typography>
      </Box>

      <Tooltip title={file.relativePath ?? file.name} arrow>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            mb: 1,
            color: "text.primary",
            fontSize: { xs: "0.8rem", sm: "0.875rem" },
            height: { xs: "1.2rem", sm: "1.3rem" },
          }}
        >
          {file.name}
        </Typography>
      </Tooltip>
      {file.relativePath && file.relativePath !== file.name && (
        <Tooltip title={file.relativePath} arrow>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              mb: 1,
            }}
          >
            {file.relativePath}
          </Typography>
        </Tooltip>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 1,
          minHeight: 40,
        }}
      >
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", flex: 1, mr: 1 }}>
          <Chip
            icon={<PersonIcon sx={{ fontSize: "0.9rem !important" }} />}
            label={file.source === "azure-wiki" ? "Azure Wiki" : "Local"}
            size="small"
            sx={{
              bgcolor: "#388e3c20",
              color: "#388e3c",
              fontWeight: 700,
              fontSize: "0.75rem",
              border: "2px solid #388e3c60",
              "& .MuiChip-icon": {
                color: "#388e3c !important",
              },
              boxShadow: "0 2px 4px #388e3c20",
            }}
          />
          <Chip
            icon={<DescriptionIcon sx={{ fontSize: "0.85rem !important" }} />}
            label="Markdown"
            size="small"
            sx={{
              bgcolor: "#388e3c15",
              color: "#388e3c",
              fontWeight: 500,
              fontSize: "0.65rem",
            }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
          {formatFileSize(file.size)}
        </Typography>
      </Box>

      <Box sx={{ mt: "auto" }}>
        <Button
          variant="outlined"
          size="small"
          fullWidth
          sx={{
            textTransform: "none",
            height: { xs: 32, sm: 36, md: 40 },
            flexShrink: 0,
            borderWidth: 2,
            fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.875rem" },
            fontWeight: 600,
            "&:hover": {
              borderWidth: 2,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              transform: "translateY(-1px)",
              boxShadow: 2,
            },
          }}
          onClick={(event) => {
            event.stopPropagation();
            onPreview();
          }}
          startIcon={<SearchIcon sx={{ fontSize: { xs: "1rem", sm: "1.1rem" } }} />}
        >
          Preview
        </Button>
      </Box>
    </CardContent>
  </Card>
);

const SeedPacksTab: React.FC = () => {
  const { settings } = usePackageSettingsStore();
  const authStore = useAuthenticationStore();

  const gatewayConfigured = Boolean(settings?.gatewayApiUrl);
  const isTeamScope = Boolean(authStore.user?.teamSid);
  const seedPackAdminRoles = new Set(["admin", "super-user", "team_admin", "team_owner"]);
  const userRoles = authStore.user?.roles ?? [];
  const canManage = userRoles.some((role) => seedPackAdminRoles.has(role));

  const [seedPacks, setSeedPacks] = useState<SeedPack[]>([]);
  const [selectedSid, setSelectedSid] = useState<string | null>(null);
  const [selectedSeedPack, setSelectedSeedPack] = useState<SeedPack | null>(null);
  const [draft, setDraft] = useState<SeedPackFormState>({
    name: "",
    description: "",
    content: "",
  });
  const [tagsInput, setTagsInput] = useState("");
  const [importedFiles, setImportedFiles] = useState<ImportedMarkdownFile[]>([]);
  const [createImportedFiles, setCreateImportedFiles] = useState<ImportedMarkdownFile[]>([]);
  const [previewFile, setPreviewFile] = useState<ImportedMarkdownFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const wikiFolderInputRef = useRef<HTMLInputElement | null>(null);
  const createFileInputRef = useRef<HTMLInputElement | null>(null);
  const createWikiFolderInputRef = useRef<HTMLInputElement | null>(null);

  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [newPackName, setNewPackName] = useState("");
  const [newPackDescription, setNewPackDescription] = useState("");
  const [newPackTags, setNewPackTags] = useState("");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<SnackbarSeverity>("success");

  const parsedTags = useMemo(() => parseTags(tagsInput), [tagsInput]);
  const normalizedSelectedTags = useMemo(
    () => normalizeTags(selectedSeedPack?.tags),
    [selectedSeedPack?.tags]
  );

  const isDirty = useMemo(() => {
    if (!selectedSeedPack) {
      return false;
    }
    const nameChanged = draft.name.trim() !== (selectedSeedPack.name ?? "").trim();
    const descriptionChanged =
      draft.description.trim() !== (selectedSeedPack.description ?? "").trim();
    const contentChanged = draft.content !== (selectedSeedPack.content ?? "");
    const tagsChanged = !areArraysEqual(parsedTags, normalizedSelectedTags);
    return nameChanged || descriptionChanged || contentChanged || tagsChanged;
  }, [draft, parsedTags, normalizedSelectedTags, selectedSeedPack]);

  const isReadOnly = !canManage || selectedSeedPack?.status === "archived";

  const sortedSeedPacks = useMemo(() => {
    return [...seedPacks].sort((a, b) => getSeedPackTimestamp(b) - getSeedPackTimestamp(a));
  }, [seedPacks]);

  const scopeLabel = isTeamScope ? "Team scope" : "Personal scope";
  const scopeDescription = isTeamScope
    ? "Applies to all members of your team."
    : "Applies only to your account.";

  const showSnackbar = useCallback((message: string, severity: SnackbarSeverity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const hydrateDraft = useCallback((pack: SeedPack) => {
    setDraft({
      name: pack.name ?? "",
      description: pack.description ?? "",
      content: pack.content ?? "",
    });
    setTagsInput((pack.tags ?? []).join(", "));
    setImportedFiles([]);
    setPreviewFile(null);
  }, []);

  const resetCreateDialog = useCallback(() => {
    setCreateDialogOpen(false);
    setNewPackName("");
    setNewPackDescription("");
    setNewPackTags("");
    setCreateImportedFiles([]);
  }, []);

  const refreshSeedPacks = useCallback(
    async (nextSelectedSid?: string) => {
      if (!gatewayConfigured) {
        return;
      }
      setIsLoadingList(true);
      try {
        const packs = await listSeedPacks();
        setSeedPacks(packs);

        const activeSid = nextSelectedSid ?? selectedSid;
        if (activeSid && !packs.some((pack) => pack.sid === activeSid)) {
          setSelectedSid(null);
          setSelectedSeedPack(null);
        }
      } catch (error) {
        showSnackbar("Failed to load seed packs.", "error");
        debugLogger.error("SeedPacksTab: failed to load seed packs", {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setIsLoadingList(false);
      }
    },
    [gatewayConfigured, selectedSid, showSnackbar]
  );

  const loadSeedPackDetail = useCallback(
    async (sid: string) => {
      if (!gatewayConfigured) {
        return;
      }
      setIsLoadingDetail(true);
      try {
        const pack = await getSeedPack(sid);
        setSelectedSeedPack(pack);
        hydrateDraft(pack);
      } catch (error) {
        showSnackbar("Failed to load seed pack details.", "error");
        debugLogger.error("SeedPacksTab: failed to load seed pack details", {
          sid,
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [gatewayConfigured, hydrateDraft, showSnackbar]
  );

  useEffect(() => {
    void refreshSeedPacks();
  }, [refreshSeedPacks, authStore.token]);

  useEffect(() => {
    if (selectedSid) {
      void loadSeedPackDetail(selectedSid);
    }
  }, [selectedSid, loadSeedPackDetail]);

  useEffect(() => {
    const setDirectoryUploadAttributes = (input: HTMLInputElement | null) => {
      if (!input) {
        return;
      }
      input.setAttribute("webkitdirectory", "");
      input.setAttribute("directory", "");
    };

    setDirectoryUploadAttributes(wikiFolderInputRef.current);
    setDirectoryUploadAttributes(createWikiFolderInputRef.current);
  }, [selectedSeedPack, createDialogOpen]);

  const handleSelectPack = (pack: SeedPack) => {
    setSelectedSid(pack.sid);
    setSelectedSeedPack(pack);
    hydrateDraft(pack);
  };

  const handleImportFiles = useCallback(
    async (files: FileList | null, source: ImportSource = "local") => {
      if (!files || files.length === 0) {
        return;
      }

      const { imported, skipped } = await readMarkdownFiles(files, source);
      if (skipped > 0) {
        showSnackbar("Only .md and .markdown files are supported for seed packs.", "error");
      }

      if (imported.length === 0) {
        return;
      }

      try {
        const newlyAdded = imported.filter(
          (file) =>
            !importedFiles.some((existing) => getImportedFileKey(existing) === getImportedFileKey(file))
        );
        setImportedFiles((prev) => mergeMarkdownFiles(prev, imported));

        const combined = buildMarkdownContent(newlyAdded);
        if (combined.length > 0) {
          setDraft((prev) => {
            const current = prev.content.trim();
            const nextContent = current ? `${current}\n\n---\n\n${combined}` : combined;
            return { ...prev, content: nextContent };
          });
        }
        const importLabel =
          source === "azure-wiki" ? "from Azure DevOps wiki folder into the editor" : "into the editor";
        showSnackbar(
          `Imported ${imported.length} markdown file${imported.length === 1 ? "" : "s"} ${importLabel}.`,
          "success"
        );
      } catch (error) {
        showSnackbar("Failed to import markdown files.", "error");
        debugLogger.error("SeedPacksTab: failed to import markdown files", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [importedFiles, showSnackbar]
  );

  const handleFileInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      await handleImportFiles(event.target.files, "local");
      event.target.value = "";
    },
    [handleImportFiles]
  );

  const handleWikiFolderInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      await handleImportFiles(event.target.files, "azure-wiki");
      event.target.value = "";
    },
    [handleImportFiles]
  );

  const handleRemoveImportedFile = useCallback((id: string) => {
    setImportedFiles((prev) => prev.filter((file) => file.id !== id));
  }, []);

  const handleCreateImportFiles = useCallback(
    async (files: FileList | null, source: ImportSource = "local") => {
      if (!files || files.length === 0) {
        return;
      }

      const { imported, skipped } = await readMarkdownFiles(files, source);
      if (skipped > 0) {
        showSnackbar("Only .md and .markdown files are supported for seed packs.", "error");
      }
      if (imported.length === 0) {
        return;
      }

      setCreateImportedFiles((prev) => mergeMarkdownFiles(prev, imported));
      const importLabel =
        source === "azure-wiki" ? "from Azure DevOps wiki folder for this seed pack" : "for this seed pack";
      showSnackbar(
        `Imported ${imported.length} markdown file${imported.length === 1 ? "" : "s"} ${importLabel}.`,
        "success"
      );
    },
    [showSnackbar]
  );

  const handleCreateFileInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      await handleCreateImportFiles(event.target.files, "local");
      event.target.value = "";
    },
    [handleCreateImportFiles]
  );

  const handleCreateWikiFolderInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      await handleCreateImportFiles(event.target.files, "azure-wiki");
      event.target.value = "";
    },
    [handleCreateImportFiles]
  );

  const handleRemoveCreateImportedFile = useCallback((id: string) => {
    setCreateImportedFiles((prev) => prev.filter((file) => file.id !== id));
  }, []);

  const buildDraftPayload = useCallback((): SeedPackDraft | null => {
    const name = draft.name.trim();
    if (!name) {
      showSnackbar("Seed pack name is required.", "error");
      return null;
    }
    return {
      name,
      description: draft.description.trim(),
      content: draft.content,
      tags: parsedTags,
      contentType: "markdown",
    };
  }, [draft, parsedTags, showSnackbar]);

  const saveDraft = useCallback(async (): Promise<SeedPack | null> => {
    if (!selectedSeedPack) {
      return null;
    }
    const payload = buildDraftPayload();
    if (!payload) {
      return null;
    }
    setIsSaving(true);
    try {
      const updated = await updateSeedPack(selectedSeedPack.sid, payload);
      setSelectedSeedPack(updated);
      hydrateDraft(updated);
      await refreshSeedPacks(updated.sid);
      return updated;
    } catch (error) {
      showSnackbar("Failed to save seed pack.", "error");
      debugLogger.error("SeedPacksTab: failed to save seed pack", {
        sid: selectedSeedPack.sid,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [selectedSeedPack, buildDraftPayload, hydrateDraft, refreshSeedPacks, showSnackbar]);

  const handleSaveDraft = async () => {
    const updated = await saveDraft();
    if (updated) {
      showSnackbar("Seed pack saved.", "success");
    }
  };

  const handleResetDraft = () => {
    if (selectedSeedPack) {
      hydrateDraft(selectedSeedPack);
    }
  };

  const handleCreateSeedPack = async () => {
    const name = newPackName.trim();
    if (!name) {
      showSnackbar("Seed pack name is required.", "error");
      return;
    }

    const importedContent = buildMarkdownContent(createImportedFiles);
    const payload: SeedPackDraft = {
      name,
      description: newPackDescription.trim(),
      tags: parseTags(newPackTags),
      content: importedContent,
      contentType: "markdown",
    };

    setIsCreating(true);
    try {
      const created = await createSeedPack(payload);
      resetCreateDialog();
      await refreshSeedPacks(created.sid);
      setSelectedSid(created.sid);
      setSelectedSeedPack(created);
      hydrateDraft(created);
      if (createImportedFiles.length > 0) {
        setImportedFiles(createImportedFiles);
      }
      setCreateImportedFiles([]);
      showSnackbar("Seed pack created.", "success");
    } catch (error) {
      showSnackbar("Failed to create seed pack.", "error");
      debugLogger.error("SeedPacksTab: failed to create seed pack", {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedSeedPack) {
      return;
    }
    setPublishDialogOpen(false);
    setIsPublishing(true);
    try {
      if (isDirty) {
        const saved = await saveDraft();
        if (!saved) {
          return;
        }
      }
      const published = await publishSeedPack(selectedSeedPack.sid);
      setSelectedSeedPack(published);
      hydrateDraft(published);
      await refreshSeedPacks(published.sid);
      showSnackbar("Seed pack published.", "success");
    } catch (error) {
      showSnackbar("Failed to publish seed pack.", "error");
      debugLogger.error("SeedPacksTab: failed to publish seed pack", {
        sid: selectedSeedPack.sid,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedSeedPack) {
      return;
    }
    setArchiveDialogOpen(false);
    setIsArchiving(true);
    try {
      const archived = await archiveSeedPack(selectedSeedPack.sid);
      setSelectedSeedPack(archived);
      hydrateDraft(archived);
      await refreshSeedPacks(archived.sid);
      showSnackbar("Seed pack archived.", "success");
    } catch (error) {
      showSnackbar("Failed to archive seed pack.", "error");
      debugLogger.error("SeedPacksTab: failed to archive seed pack", {
        sid: selectedSeedPack.sid,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSeedPack) {
      return;
    }
    const deletingSid = selectedSeedPack.sid;
    const deletingName = selectedSeedPack.name;
    setDeleteDialogOpen(false);
    setIsDeleting(true);
    try {
      await deleteSeedPack(deletingSid);
      setSelectedSid(null);
      setSelectedSeedPack(null);
      setDraft({ name: "", description: "", content: "" });
      setTagsInput("");
      setImportedFiles([]);
      setPreviewFile(null);
      await refreshSeedPacks();
      showSnackbar(`Deleted seed pack "${deletingName}".`, "success");
    } catch (error) {
      showSnackbar("Failed to delete seed pack.", "error");
      debugLogger.error("SeedPacksTab: failed to delete seed pack", {
        sid: deletingSid,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const previewContent =
    draft.content.trim().length > 0
      ? draft.content
      : "Preview will appear here as you type.";

  const selectedStatus = selectedSeedPack?.status ?? "draft";
  const statusChip = getStatusChip(selectedStatus);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3, md: 4 } }}>
      <Box sx={{ mb: { xs: 2.5, md: 3 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 1.5, md: 2 }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography
              variant="h5"
              color="text.primary"
              sx={{ mb: 1, fontWeight: 600, fontSize: { xs: "1.55rem", md: "1.8rem" } }}
            >
              Seed Packs
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Curated internal knowledge that is always available to assistants, without showing up as
              visible sources.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              icon={isTeamScope ? <GroupIcon /> : <PersonIcon />}
              label={scopeLabel}
              color="info"
              variant="outlined"
            />
          </Stack>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {scopeDescription}
        </Typography>
      </Box>

      {!gatewayConfigured && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Gateway API is not configured. Seed packs require a gateway URL in package settings.
        </Alert>
      )}

      {gatewayConfigured && !canManage && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have view-only access. Admin rights are required to create, publish, or archive team seed
          packs.
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "320px 1fr" },
          gap: { xs: 2, md: 3 },
        }}
      >
        <Card sx={{ height: "fit-content" }}>
          <CardContent sx={{ pb: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Packs
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => refreshSeedPacks()}
                  startIcon={<RefreshIcon />}
                  disabled={!gatewayConfigured || isLoadingList}
                >
                  Refresh
                </Button>
                {canManage && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateDialogOpen(true)}
                    disabled={!gatewayConfigured}
                  >
                    New
                  </Button>
                )}
              </Stack>
            </Stack>
          </CardContent>
          <Divider />
          <Box sx={{ px: 2, pb: 2 }}>
            {isLoadingList && <LinearProgress sx={{ mb: 2 }} />}
            {sortedSeedPacks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No seed packs yet. Create one to start sharing internal knowledge.
              </Typography>
            ) : (
              <List sx={{ px: 0 }}>
                {sortedSeedPacks.map((pack) => {
                  const status = getStatusChip(pack.status);
                  const tags = normalizeTags(pack.tags);
                  return (
                    <ListItemButton
                      key={pack.sid}
                      selected={pack.sid === selectedSid}
                      onClick={() => handleSelectPack(pack)}
                      sx={{
                        mb: 1,
                        borderRadius: 2,
                        alignItems: "flex-start",
                        border: pack.sid === selectedSid ? "1px solid" : "1px solid transparent",
                        borderColor: pack.sid === selectedSid ? "primary.main" : "transparent",
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {pack.name}
                          </Typography>
                          <Chip size="small" label={status.label} color={status.color} />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {pack.version ? `v${pack.version}` : "v0"} | Last published:{" "}
                          {formatTimestamp(pack.publishedAt)}
                        </Typography>
                        {tags.length > 0 && (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
                            {tags.map((tag) => (
                              <Chip key={tag} size="small" label={tag} variant="outlined" />
                            ))}
                          </Stack>
                        )}
                      </Box>
                    </ListItemButton>
                  );
                })}
              </List>
            )}
          </Box>
        </Card>

        <Card>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedSeedPack ? "Seed Pack Editor" : "Seed Pack Details"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Draft content stays internal and is never shown as user-facing sources.
                </Typography>
              </Box>
              {selectedSeedPack && (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {isDirty && <Chip size="small" label="Unsaved changes" color="warning" />}
                  <Chip size="small" label={statusChip.label} color={statusChip.color} />
                </Stack>
              )}
            </Stack>

            <Divider sx={{ my: 2 }} />

            {!selectedSeedPack && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select a seed pack from the list or create a new one to begin editing.
                </Typography>
                {canManage && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateDialogOpen(true)}
                    disabled={!gatewayConfigured}
                  >
                    Create seed pack
                  </Button>
                )}
              </Box>
            )}

            {selectedSeedPack && (
              <Stack spacing={2}>
                {isLoadingDetail && <LinearProgress />}

                <TextField
                  label="Name"
                  value={draft.name}
                  onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                  fullWidth
                  disabled={isReadOnly}
                />

                <TextField
                  label="Description"
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, description: event.target.value }))
                  }
                  fullWidth
                  multiline
                  minRows={2}
                  disabled={isReadOnly}
                />

                <TextField
                  label="Tags (comma separated)"
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  fullWidth
                  disabled={isReadOnly}
                />

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip size="small" label={scopeLabel} icon={isTeamScope ? <GroupIcon /> : <PersonIcon />} />
                  {selectedSeedPack.version && (
                    <Chip size="small" label={`Version ${selectedSeedPack.version}`} variant="outlined" />
                  )}
                  {selectedSeedPack.updatedAt && (
                    <Chip size="small" label={`Updated ${formatTimestamp(selectedSeedPack.updatedAt)}`} variant="outlined" />
                  )}
                </Stack>

                <Alert severity="info">
                  Treat seed pack content as internal knowledge. Do not include instructions that override
                  system or developer messages.
                </Alert>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 2,
                    alignItems: "start",
                  }}
                >
                  <Box>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="subtitle2">Markdown content</Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<UploadFileIcon />}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isReadOnly}
                      >
                        Import .md
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FolderOpenIcon />}
                        onClick={() => wikiFolderInputRef.current?.click()}
                        disabled={isReadOnly}
                      >
                        Import wiki folder
                      </Button>
                    </Stack>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".md,.markdown,text/markdown"
                      multiple
                      onChange={handleFileInputChange}
                      style={{ display: "none" }}
                    />
                    <input
                      ref={wikiFolderInputRef}
                      type="file"
                      accept=".md,.markdown,text/markdown"
                      multiple
                      onChange={handleWikiFolderInputChange}
                      style={{ display: "none" }}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                    Paste or import markdown files. Use folder import for Azure DevOps wiki clones.
                  </Typography>
                  <TextField
                    label="Content"
                    value={draft.content}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, content: event.target.value }))
                    }
                    fullWidth
                    multiline
                    minRows={12}
                    disabled={isReadOnly}
                  />
                  {importedFiles.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Imported markdown files
                      </Typography>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2, minmax(0, 1fr))",
                            md: "repeat(3, minmax(0, 1fr))",
                          },
                          gap: 2,
                        }}
                      >
                        {importedFiles.map((file) => (
                          <SeedPackFileCard
                            key={file.id}
                            file={file}
                            isReadOnly={isReadOnly}
                            onPreview={() => setPreviewFile(file)}
                            onRemove={() => handleRemoveImportedFile(file.id)}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Preview
                      </Typography>
                      <StreamingMarkdown content={previewContent} />
                    </CardContent>
                  </Card>
                </Box>

                {selectedSeedPack.summary && (
                  <TextField
                    label="Summary (auto-generated)"
                    value={selectedSeedPack.summary}
                    fullWidth
                    multiline
                    minRows={3}
                    InputProps={{ readOnly: true }}
                  />
                )}

                {canManage && (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
                    <Button
                      variant="outlined"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveDraft}
                      disabled={isReadOnly || !isDirty || isSaving}
                    >
                      {isSaving ? "Saving..." : "Save draft"}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleResetDraft}
                      disabled={!isDirty || isReadOnly}
                    >
                      Reset changes
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<PublishIcon />}
                      onClick={() => setPublishDialogOpen(true)}
                      disabled={isReadOnly || isPublishing}
                    >
                      {isPublishing ? "Publishing..." : "Publish"}
                    </Button>
                    <Button
                      variant="text"
                      color="error"
                      startIcon={<ArchiveIcon />}
                      onClick={() => setArchiveDialogOpen(true)}
                      disabled={isReadOnly || isArchiving}
                    >
                      {isArchiving ? "Archiving..." : "Archive"}
                    </Button>
                    <Button
                      variant="text"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => setDeleteDialogOpen(true)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                  </Stack>
                )}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Box>

      <Dialog open={createDialogOpen} onClose={resetCreateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create seed pack</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Seed packs are scoped automatically based on your sign-in. {scopeLabel} - {scopeDescription}
          </DialogContentText>
          <Stack spacing={2}>
            <TextField
              label="Name"
              value={newPackName}
              onChange={(event) => setNewPackName(event.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="Description"
              value={newPackDescription}
              onChange={(event) => setNewPackDescription(event.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Tags (comma separated)"
              value={newPackTags}
              onChange={(event) => setNewPackTags(event.target.value)}
              fullWidth
            />
            <Divider />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<UploadFileIcon />}
                  onClick={() => createFileInputRef.current?.click()}
                  disabled={!canManage}
                >
                  Import .md files
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<FolderOpenIcon />}
                  onClick={() => createWikiFolderInputRef.current?.click()}
                  disabled={!canManage}
                >
                  Import wiki folder
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Optional. Local files or cloned Azure DevOps wiki folders are merged into draft content.
              </Typography>
              <input
                ref={createFileInputRef}
                type="file"
                accept=".md,.markdown,text/markdown"
                multiple
                onChange={handleCreateFileInputChange}
                style={{ display: "none" }}
              />
              <input
                ref={createWikiFolderInputRef}
                type="file"
                accept=".md,.markdown,text/markdown"
                multiple
                onChange={handleCreateWikiFolderInputChange}
                style={{ display: "none" }}
              />
            </Stack>
            {createImportedFiles.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Imported markdown files
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: 2,
                  }}
                >
                  {createImportedFiles.map((file) => (
                    <SeedPackFileCard
                      key={file.id}
                      file={file}
                      isReadOnly={!canManage}
                      onPreview={() => setPreviewFile(file)}
                      onRemove={() => handleRemoveCreateImportedFile(file.id)}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetCreateDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateSeedPack}
            disabled={!gatewayConfigured || isCreating}
          >
            {isCreating ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={publishDialogOpen} onClose={() => setPublishDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Publish seed pack</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Publishing locks a new version and makes it available for internal retrieval. This content is
            never shown as a user-facing source.
          </DialogContentText>
          {isDirty && (
            <Alert severity="info" sx={{ mt: 2 }}>
              You have unsaved changes. They will be included in the published version.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? "Publishing..." : "Publish"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={archiveDialogOpen} onClose={() => setArchiveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Archive seed pack</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Archiving stops this seed pack from being used in new conversations. You can keep it for
            reference or audit history.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleArchive} disabled={isArchiving}>
            {isArchiving ? "Archiving..." : "Archive"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete seed pack</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete "{selectedSeedPack?.name ?? "this seed pack"}" permanently from this scope.
            Published versions and draft content will no longer be available.
          </DialogContentText>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{previewFile?.name ?? "Markdown preview"}</DialogTitle>
        <DialogContent dividers>
          <StreamingMarkdown content={previewFile?.content ?? ""} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewFile(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SeedPacksTab;
