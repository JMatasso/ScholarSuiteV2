/**
 * Icon adapter — maps lucide-react icon names to Hugeicons equivalents.
 * Import from "@/lib/icons" instead of "lucide-react" for the modern icon set.
 *
 * Hugeicons: https://hugeicons.com — 4,600+ modern rounded icons
 */

export {
  // ── Navigation & Layout ──
  Home02Icon as Home,
  DashboardSpeed02Icon as LayoutDashboard,
  Menu01Icon as Menu,
  PanelLeftIcon as PanelLeft,
  PanelLeftCloseIcon as PanelLeftClose,
  ArrowLeft01Icon as ArrowLeft,
  ArrowRight01Icon as ArrowRight,
  ArrowUp01Icon as ArrowUp,
  ArrowDown01Icon as ArrowDown,
  ArrowUpDownIcon as ArrowUpDown,
  ChevronDownIcon as ChevronDown,
  ChevronDownIcon as ChevronDownIcon,
  ChevronUpIcon as ChevronUpIcon,
  ArrowLeft01Icon as ChevronLeft,
  ArrowLeft01Icon as ChevronLeftIcon,
  ArrowRight01Icon as ChevronRight,
  ArrowRight01Icon as ChevronRightIcon,
  UnfoldMoreIcon as ChevronsUpDown,
  ExternalLinkIcon as ExternalLink,
  GlobeIcon as Globe,
  LinkSquare01Icon as Link,

  // ── Actions ──
  Search01Icon as Search,
  Search01Icon as SearchIcon,
  PlusSignIcon as Plus,
  Tick02Icon as Check,
  Tick02Icon as CheckIcon,
  Cancel01Icon as X,
  Cancel01Icon as XIcon,
  Cancel01Icon as XCircle,
  Copy01Icon as Copy,
  Pencil02Icon as Pencil,
  PencilEdit02Icon as Edit3,
  Delete02Icon as Trash2,
  Download04Icon as Download,
  Upload04Icon as Upload,
  Save01Icon as Save,
  RefreshIcon as RefreshCw,
  Loading03Icon as Loader2,
  Loading03Icon as Loader2Icon,
  MoreHorizontalIcon as MoreHorizontal,
  ViewIcon as Eye,
  ViewOffSlashIcon as EyeOff,
  GripVerticalIcon as GripVertical,
  DragDropVerticalIcon as FolderKanban,

  // ── Communication ──
  Mail01Icon as Mail,
  SentIcon as Send,
  Message01Icon as MessageSquare,
  MessageAdd01Icon as MessageSquarePlus,
  BubbleChatIcon as MessageCircle,
  Notification03Icon as Bell,
  Megaphone01Icon as Megaphone,
  Mic01Icon as Mic,
  MicOff01Icon as MicOff,
  SmartPhone01Icon as Smartphone,
  TelephoneIcon as Phone,
  CallOutgoing01Icon as PhoneCall,
  CallBlockedIcon as PhoneOff,

  // ── Content & Files ──
  File02Icon as FileText,
  FileExportIcon as FileBarChart,
  FileRemoveIcon as FileX,
  Folder02Icon as FolderOpen,
  Note01Icon as ClipboardList,
  PenTool01Icon as PenTool,
  Attachment01Icon as Paperclip,
  ImageAdd01Icon as ImagePlus,
  Pin01Icon as Pin,

  // ── Status & Feedback ──
  CheckmarkCircle02Icon as CheckCircle,
  CheckmarkCircle02Icon as CheckCircle2,
  CheckmarkCircle02Icon as CircleCheckIcon,
  CheckmarkSquare02Icon as CheckSquare,
  BadgeCheckIcon as BadgeCheck,
  AlertCircleIcon as AlertCircle,
  Alert02Icon as AlertTriangle,
  Alert02Icon as TriangleAlertIcon,
  InformationCircleIcon as Info,
  InformationCircleIcon as InfoIcon,
  Cancel01Icon as OctagonXIcon,
  CircleIcon as Circle,
  MinusSignIcon as Minus,

  // ── Business & Finance ──
  Dollar02Icon as DollarSign,
  Briefcase01Icon as Briefcase,
  Analytics02Icon as Activity,
  ChartHistogramIcon as TrendingUp,
  ChartDecreaseIcon as TrendingDown,
  Target02Icon as Target,
  ShieldCheckIcon as Shield,
  LockIcon as Lock,

  // ── Education ──
  GraduationScrollIcon as GraduationCap,
  BookOpen02Icon as BookOpen,
  School01Icon as School,
  Building04Icon as Building2,
  Award02Icon as Award,
  Trophy01Icon as Trophy,
  CrownIcon as Crown,
  Medal01Icon as Medal,

  // ── Calendar & Time ──
  Calendar03Icon as Calendar,
  Calendar03Icon as CalendarDays,
  CalendarAdd01Icon as CalendarPlus,
  CalendarCheckIn01Icon as CalendarRange,
  Clock02Icon as Clock,
  Clock02Icon as CalendarClock,
  WorkHistoryIcon as History,

  // ── People ──
  User02Icon as User,
  UserAdd01Icon as UserPlus,
  UserMultiple02Icon as Users,
  UserCircle02Icon as CircleUserRound,

  // ── Media & Display ──
  Video02Icon as Video,
  VideoOffIcon as VideoOff,
  Moon02Icon as Moon,
  Sun03Icon as Sun,
  ComputerIcon as Monitor,
  ComputerPhoneSyncIcon as MonitorUp,

  // ── AI & Creative ──
  SparklesIcon as Sparkles,
  AiChat02Icon as Bot,
  Lightbulb02Icon as Lightbulb,
  Rocket01Icon as Rocket,
  PaintBrush04Icon as Palette,
  StarIcon as Star,
  FavouriteIcon as Heart,
  HandPrayerIcon as HandHeart,
  Dumbbell03Icon as Dumbbell,
  TestTube01Icon as FlaskConical,
  Task01Icon as ListTodo,
  TaskDone01Icon as ListChecks,

  // ── Misc ──
  SortingUpIcon as FileUp,
  MonitorIcon as MonitorIcon,
} from "hugeicons-react"

// Re-export the LucideIcon type equivalent for Hugeicons
// Hugeicons components accept the same props pattern as lucide
export type { HugeiconsProps as LucideProps } from "hugeicons-react"

// Type alias for icon components
import type { FC } from "react"
import type { HugeiconsProps } from "hugeicons-react"
export type LucideIcon = FC<HugeiconsProps>
