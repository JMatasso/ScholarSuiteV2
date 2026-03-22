import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * Maps lucide-react / internal icon names to 3D Fluency icon filenames.
 * Only sidebar-nav and dashboard-card icons are mapped here.
 */
const ICON_MAP: Record<string, string> = {
  // Navigation
  Home: "home",
  LayoutDashboard: "dashboard",
  Calendar: "calendar",
  CalendarDays: "calendar",
  CalendarPlus: "calendar",
  Clock: "clock",
  Search: "search",
  Settings: "settings",
  Bell: "bell",

  // People
  User: "user",
  Users: "users",
  UserPlus: "user-plus",
  UserCheck: "user-check",
  CircleUserRound: "user",

  // Education
  GraduationCap: "graduation-cap",
  BookOpen: "book-open",
  School: "school",
  Trophy: "trophy",
  Award: "award",
  Star: "star",
  Medal: "award",

  // Business
  Briefcase: "briefcase",
  DollarSign: "dollar-sign",
  BarChart3: "bar-chart",
  TrendingUp: "chart",
  Activity: "activity",
  Target: "target",
  Shield: "shield",

  // Communication
  MessageSquare: "message",
  Mail: "mail",
  Megaphone: "megaphone",
  Video: "video",
  Phone: "phone",

  // Content
  FileText: "file",
  FileBarChart: "file",
  FolderOpen: "folder",
  ClipboardList: "clipboard",
  ClipboardCheck: "clipboard",
  PenTool: "pen-tool",
  Paperclip: "paperclip",

  // Status
  CheckCircle: "check-circle",
  CheckCircle2: "check-circle",
  CheckSquare: "todo",
  ListTodo: "todo",

  // AI
  Bot: "bot",
  Sparkles: "sparkles",
  Lightbulb: "lightbulb",
  Rocket: "rocket",
  Brain: "brain",

  // Misc
  MapPin: "pin",
  Building2: "building",
  Layers: "layers",
  LifeBuoy: "lifebuoy",
  Lock: "lock",
  LogOut: "logout",
  Help: "help",
  Tasks: "tasks",
}

interface Icon3DProps {
  /** The lucide-react icon name (e.g. "GraduationCap", "Settings") */
  name: string
  /** Size in pixels (default 24) */
  size?: number
  className?: string
}

export function Icon3D({ name, size = 24, className }: Icon3DProps) {
  const filename = ICON_MAP[name]
  if (!filename) {
    // Fallback: return empty span if no 3D icon mapped
    return <span className={cn("inline-block", className)} style={{ width: size, height: size }} />
  }

  return (
    <Image
      src={`/icons/3d/${filename}.png`}
      alt={name}
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      unoptimized
    />
  )
}
