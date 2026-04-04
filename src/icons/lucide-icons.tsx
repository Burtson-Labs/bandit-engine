import React from "react";
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { LucideIcon, LucideProps } from "lucide-react";
import {
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowUp,
  AudioLines,
  BookOpen,
  BookOpenText,
  Brain,
  Braces,
  Brush,
  BrushCleaning,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  CirclePlus,
  Cloud,
  CloudCheck,
  CloudOff,
  Copy,
  Cpu,
  Database,
  Download,
  EarOff,
  Eye,
  FileText,
  FileUp,
  Folder,
  FolderOpen,
  Globe,
  Grip,
  History,
  House,
  Info,
  LayoutGrid,
  Link,
  List,
  Lock,
  Maximize,
  MessageSquare,
  Mic,
  Minimize,
  Minus,
  NotebookPen,
  Pencil,
  Pin,
  PinOff,
  Play,
  Plus,
  RectangleHorizontal,
  RectangleVertical,
  RefreshCw,
  Rocket,
  RotateCcw,
  RotateCw,
  Save,
  ScanFace,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Square,
  TriangleAlert,
  Trash2,
  Type,
  Upload,
  User,
  UserCog,
  Users,
  Wifi,
  WifiHigh,
  WifiLow,
  WifiOff,
  Wrench,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

type MuiIconColor =
  | "inherit"
  | "action"
  | "disabled"
  | "primary"
  | "secondary"
  | "error"
  | "info"
  | "success"
  | "warning"
  | string;

type MuiIconFontSize = "inherit" | "small" | "medium" | "large" | number | string;

interface MuiLucideIconProps extends Omit<LucideProps, "color"> {
  color?: MuiIconColor;
  fontSize?: MuiIconFontSize;
  htmlColor?: string;
  sx?: SxProps<Theme>;
  titleAccess?: string;
}

const fontSizeMap = {
  inherit: "inherit",
  small: "1.25rem",
  medium: "1.5rem",
  large: "2.1875rem",
} as const;

const colorMap = {
  inherit: "inherit",
  action: "action.active",
  disabled: "action.disabled",
  primary: "primary.main",
  secondary: "secondary.main",
  error: "error.main",
  info: "info.main",
  success: "success.main",
  warning: "warning.main",
} as const;

const toSxArray = (sx?: SxProps<Theme>) => (Array.isArray(sx) ? sx : sx ? [sx] : []);

const resolveFontSize = (fontSize: MuiIconFontSize = "medium") => {
  if (typeof fontSize === "number") {
    return `${fontSize}px`;
  }

  return fontSizeMap[fontSize as keyof typeof fontSizeMap] ?? fontSize;
};

const resolveColor = (color: MuiIconColor = "inherit") =>
  colorMap[color as keyof typeof colorMap] ?? color;

const createMuiLucideIcon = (Icon: LucideIcon) => {
  const MuiLucideIcon = React.forwardRef<SVGSVGElement, MuiLucideIconProps>(
    function MuiLucideIcon(
      {
        sx,
        size,
        fontSize = "medium",
        color = "inherit",
        htmlColor,
        absoluteStrokeWidth = true,
        titleAccess,
        role,
        ...props
      },
      ref
    ) {
      const BoxIcon = Box as any;
      const forwardedProps = props as Record<string, unknown>;

      return (
        <BoxIcon
          component={Icon}
          ref={ref}
          size={size ?? "1em"}
          absoluteStrokeWidth={absoluteStrokeWidth}
          aria-hidden={titleAccess ? undefined : true}
          aria-label={titleAccess}
          role={titleAccess ? "img" : role}
          sx={[
            {
              color: htmlColor ?? resolveColor(color),
              fontSize: size ? undefined : resolveFontSize(fontSize),
              flexShrink: 0,
            },
            ...toSxArray(sx),
          ]}
          {...forwardedProps}
        />
      );
    }
  );

  MuiLucideIcon.displayName = `${Icon.displayName ?? Icon.name ?? "Lucide"}MuiIcon`;

  return MuiLucideIcon;
};

export const AddIcon = createMuiLucideIcon(Plus);
export const CloudDoneIcon = createMuiLucideIcon(CloudCheck);
export const CloudOffIcon = createMuiLucideIcon(CloudOff);
export const ErrorOutlineIcon = createMuiLucideIcon(CircleAlert);
export const HomeIcon = createMuiLucideIcon(House);
export const NotesIcon = createMuiLucideIcon(NotebookPen);
export const NotesIconOutlined = createMuiLucideIcon(NotebookPen);
export const RecordVoiceOverIcon = createMuiLucideIcon(Mic);
export const SettingsIcon = createMuiLucideIcon(Settings);
export const SyncIcon = createMuiLucideIcon(RefreshCw);
export const ArrowUpwardIcon = createMuiLucideIcon(ArrowUp);
export const CloseIcon = createMuiLucideIcon(X);
export const ExpandMoreIcon = createMuiLucideIcon(ChevronDown);
export const FeedbackIcon = createMuiLucideIcon(MessageSquare);
export const GraphicEqIcon = createMuiLucideIcon(AudioLines);
export const HearingDisabledIcon = createMuiLucideIcon(EarOff);
export const PsychologyIcon = createMuiLucideIcon(Brain);
export const ArrowDownwardIcon = createMuiLucideIcon(ArrowDown);
export const CheckCircleIcon = createMuiLucideIcon(CircleCheck);
export const SignalWifi2BarIcon = createMuiLucideIcon(WifiLow);
export const SignalWifiStatusbar4BarIcon = createMuiLucideIcon(WifiHigh);
export const WifiOffIcon = createMuiLucideIcon(WifiOff);
export const DeleteIcon = createMuiLucideIcon(Trash2);
export const PushPinIcon = createMuiLucideIcon(Pin);
export const PushPinOutlinedIcon = createMuiLucideIcon(PinOff);
export const CloudSyncIcon = createMuiLucideIcon(RefreshCw);
export const RotateLeftIcon = createMuiLucideIcon(RotateCcw);
export const RotateRightIcon = createMuiLucideIcon(RotateCw);
export const ZoomInIcon = createMuiLucideIcon(ZoomIn);
export const ZoomOutIcon = createMuiLucideIcon(ZoomOut);
export const WifiIcon = createMuiLucideIcon(Wifi);
export const Crop169Icon = createMuiLucideIcon(RectangleHorizontal);
export const CropPortraitIcon = createMuiLucideIcon(RectangleVertical);
export const CropSquareIcon = createMuiLucideIcon(Square);
export const ContentCopyIcon = createMuiLucideIcon(Copy);
export const FileUploadIcon = createMuiLucideIcon(FileUp);
export const PreviewIcon = createMuiLucideIcon(Eye);
export const RestoreIcon = createMuiLucideIcon(RotateCcw);
export const SaveIcon = createMuiLucideIcon(Save);
export const UploadIcon = createMuiLucideIcon(Upload);
export const AutoAwesomeIcon = createMuiLucideIcon(Sparkles);
export const AutoStoriesIcon = createMuiLucideIcon(BookOpenText);
export const DescriptionIcon = createMuiLucideIcon(FileText);
export const ArticleIcon = createMuiLucideIcon(FileText);
export const CheckIcon = createMuiLucideIcon(Check);
export const CodeIcon = createMuiLucideIcon(Braces);
export const DataObjectIcon = createMuiLucideIcon(Braces);
export const DownloadIcon = createMuiLucideIcon(Download);
export const ErrorIcon = createMuiLucideIcon(CircleAlert);
export const FolderIcon = createMuiLucideIcon(Folder);
export const GroupIcon = createMuiLucideIcon(Users);
export const LockIcon = createMuiLucideIcon(Lock);
export const PersonIcon = createMuiLucideIcon(User);
export const PictureAsPdfIcon = createMuiLucideIcon(FileText);
export const PublicIcon = createMuiLucideIcon(Globe);
export const SearchIcon = createMuiLucideIcon(Search);
export const UploadFileIcon = createMuiLucideIcon(FileUp);
export const ViewListIcon = createMuiLucideIcon(List);
export const ViewModuleIcon = createMuiLucideIcon(LayoutGrid);
export const AddCircleIcon = createMuiLucideIcon(CirclePlus);
export const EditIcon = createMuiLucideIcon(Pencil);
export const PlayArrowIcon = createMuiLucideIcon(Play);
export const VisibilityIcon = createMuiLucideIcon(Eye);
export const HealthAndSafetyIcon = createMuiLucideIcon(ShieldCheck);
export const RefreshIcon = createMuiLucideIcon(RefreshCw);
export const EditNoteOutlinedIcon = createMuiLucideIcon(NotebookPen);
export const ManageAccountsOutlinedIcon = createMuiLucideIcon(UserCog);
export const PlayArrowRoundedIcon = createMuiLucideIcon(Play);
export const RocketLaunchOutlinedIcon = createMuiLucideIcon(Rocket);
export const ViewModuleOutlinedIcon = createMuiLucideIcon(LayoutGrid);
export const LinkIcon = createMuiLucideIcon(Link);
export const ArchiveIcon = createMuiLucideIcon(Archive);
export const FolderOpenIcon = createMuiLucideIcon(FolderOpen);
export const PublishIcon = createMuiLucideIcon(Upload);
export const ChatIcon = createMuiLucideIcon(MessageSquare);
export const CleaningServicesIcon = createMuiLucideIcon(BrushCleaning);
export const InfoIcon = createMuiLucideIcon(Info);
export const WarningIcon = createMuiLucideIcon(AlertTriangle);
export const BrushIcon = createMuiLucideIcon(Brush);
export const BuildIcon = createMuiLucideIcon(Wrench);
export const ChevronLeftIcon = createMuiLucideIcon(ChevronLeft);
export const CloudIcon = createMuiLucideIcon(Cloud);
export const FaceRetouchingNaturalIcon = createMuiLucideIcon(ScanFace);
export const MenuBookIcon = createMuiLucideIcon(BookOpen);
export const StorageIcon = createMuiLucideIcon(Database);
export const TuneIcon = createMuiLucideIcon(SlidersHorizontal);
export const SendIcon = createMuiLucideIcon(Send);
export const ExpandLessIcon = createMuiLucideIcon(ChevronUp);
export const HistoryIcon = createMuiLucideIcon(History);
export const InfoOutlinedIcon = createMuiLucideIcon(Info);
export const MemoryIcon = createMuiLucideIcon(Cpu);
export const FullscreenIcon = createMuiLucideIcon(Maximize);
export const FullscreenExitIcon = createMuiLucideIcon(Minimize);
export const MinimizeIcon = createMuiLucideIcon(Minus);
export const DragIndicatorIcon = createMuiLucideIcon(Grip);
export const MicIcon = createMuiLucideIcon(Mic);
export const TextFieldsIcon = createMuiLucideIcon(Type);
export const TriangleAlertIcon = createMuiLucideIcon(TriangleAlert);
