"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getInitials } from "@/lib/format";
import {
  User,
  GraduationCap,
  Globe,
  Target,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Pencil,
  Save,
  Bell,
} from "lucide-react";

/* ─── Types ─── */

interface StudentProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  dateOfBirth?: string;
  gpa?: number;
  gradeLevel?: number;
  highSchool?: string;
  graduationYear?: number;
  satScore?: number;
  actScore?: number;
  intendedMajor?: string;
  ethnicity?: string;
  citizenship?: string;
  isFirstGen?: boolean;
  isPellEligible?: boolean;
  hasFinancialNeed?: boolean;
  journeyStage?: string;
  postSecondaryPath?: string;
  personalComplete?: boolean;
  academicComplete?: boolean;
  backgroundComplete?: boolean;
  financialComplete?: boolean;
  activitiesComplete?: boolean;
  goalsComplete?: boolean;
}

interface Student {
  id: string;
  name?: string;
  email: string;
  image?: string | null;
  studentProfile?: StudentProfile;
  school?: { name: string };
}

interface ParentData {
  phone?: string;
  relationship?: string;
  notifyTasks?: boolean;
  notifyDeadlines?: boolean;
  notifyAwards?: boolean;
  notifyMessages?: boolean;
  tourComplete?: boolean;
}

/* ─── Helpers ─── */

function getJourneyStageIndex(stage?: string) {
  const stages = [
    "EARLY_EXPLORATION",
    "ACTIVE_PREP",
    "APPLICATION_PHASE",
    "POST_ACCEPTANCE",
  ];
  return stages.indexOf(stage ?? "") ?? 0;
}

function getJourneyStageName(stage?: string) {
  const map: Record<string, string> = {
    EARLY_EXPLORATION: "Early Exploration",
    ACTIVE_PREP: "Active Prep",
    APPLICATION_PHASE: "Application Phase",
    POST_ACCEPTANCE: "Post Acceptance",
  };
  return stage ? (map[stage] ?? stage) : "Unknown";
}

function getGradeLabel(level?: number) {
  if (!level) return "Unknown Grade";
  const suffix = ["th", "st", "nd", "rd"];
  const v = level % 100;
  return `${level}${suffix[(v - 20) % 10] ?? suffix[v] ?? suffix[0]} Grade`;
}

function computeProfileCompletion(profile?: StudentProfile): number {
  if (!profile) return 0;
  const flags = [
    profile.personalComplete,
    profile.academicComplete,
    profile.backgroundComplete,
    profile.financialComplete,
    profile.activitiesComplete,
    profile.goalsComplete,
  ];
  const done = flags.filter(Boolean).length;
  return Math.round((done / flags.length) * 100);
}

/* ─── Subcomponents ─── */

function ProfileSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white p-5 [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-[#1E3A5F]/10">
          <Icon className="size-4 text-[#1E3A5F]" />
        </div>
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <span className="text-xs text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm text-gray-700">
        {typeof value === "string" ? value : value}
      </span>
    </div>
  );
}

/* ─── Page ─── */

export default function ParentProfilePage() {
  const { data: session } = useSession();

  /* Parent state */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  /* Notification state */
  const [notifyTasks, setNotifyTasks] = useState(true);
  const [notifyDeadlines, setNotifyDeadlines] = useState(true);
  const [notifyAwards, setNotifyAwards] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [savingNotifs, setSavingNotifs] = useState(false);

  /* Student state */
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  /* Fetch parent data + student data on mount */
  useEffect(() => {
    // Fetch parent profile
    fetch("/api/parents/onboarding")
      .then((r) => r.json())
      .then((d: ParentData) => {
        setPhone(d.phone ?? "");
        setRelationship(d.relationship ?? "");
        setNotifyTasks(d.notifyTasks ?? true);
        setNotifyDeadlines(d.notifyDeadlines ?? true);
        setNotifyAwards(d.notifyAwards ?? true);
        setNotifyMessages(d.notifyMessages ?? true);
      })
      .catch(() => {});

    // Fetch student data
    fetch("/api/students")
      .then((r) => r.json())
      .then((d: Student[]) => {
        const list = Array.isArray(d) ? d : [];
        setStudent(list[0] ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* Populate name from session */
  useEffect(() => {
    if (session?.user?.name) {
      const parts = session.user.name.split(" ");
      setFirstName(parts[0] ?? "");
      setLastName(parts.slice(1).join(" ") ?? "");
    }
  }, [session]);

  /* Save parent profile */
  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/parents/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone, relationship }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Profile updated");
      setEditing(false);
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  }

  /* Save notification preferences */
  async function handleSaveNotifications() {
    setSavingNotifs(true);
    try {
      const res = await fetch("/api/parents/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          relationship,
          notifyTasks,
          notifyDeadlines,
          notifyAwards,
          notifyMessages,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Notification preferences updated");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSavingNotifs(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-400">Loading profile...</p>
      </div>
    );
  }

  /* Student-derived values */
  const profile = student?.studentProfile;
  const profileCompletion = computeProfileCompletion(profile);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (profileCompletion / 100) * circumference;

  const fullName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : student?.name ?? student?.email ?? "";

  const schoolName =
    student?.school?.name ?? profile?.highSchool ?? "Unknown School";
  const gradeLabel = getGradeLabel(profile?.gradeLevel);
  const stage = getJourneyStageName(profile?.journeyStage);
  const stageIndex = getJourneyStageIndex(profile?.journeyStage);
  const stageLabels = [
    "Early Exploration",
    "Active Prep",
    "Application Phase",
    "Post Acceptance",
  ];

  const addressParts = [
    profile?.address,
    profile?.city,
    profile?.state,
    profile?.zipCode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Manage your profile and notification preferences"
      />

      {/* ─── Parent Profile Card ─── */}
      <motion.div
        className="rounded-xl bg-white p-5 [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#1E3A5F]/10">
              <User className="size-4 text-[#1E3A5F]" />
            </div>
            <h3 className="text-sm font-semibold text-[#1E3A5F]">
              My Profile
            </h3>
          </div>
          {!editing && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              First Name
            </label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={!editing}
              placeholder="First name"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Last Name
            </label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={!editing}
              placeholder="Last name"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Phone
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!editing}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Relationship
            </label>
            <Select
              value={relationship}
              onValueChange={(v) => setRelationship(v || "")}
              disabled={!editing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mother">Mother</SelectItem>
                <SelectItem value="Father">Father</SelectItem>
                <SelectItem value="Guardian">Guardian</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {editing && (
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-1.5"
              onClick={handleSaveProfile}
              disabled={savingProfile}
            >
              <Save className="size-3.5" />
              {savingProfile ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </motion.div>

      {/* ─── Notification Preferences Card ─── */}
      <motion.div
        className="rounded-xl bg-white p-5 [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#1E3A5F]/10">
            <Bell className="size-4 text-[#1E3A5F]" />
          </div>
          <h3 className="text-sm font-semibold text-[#1E3A5F]">
            Notification Preferences
          </h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Task Updates</p>
              <p className="text-xs text-muted-foreground">
                Get notified when tasks are assigned or updated
              </p>
            </div>
            <Switch checked={notifyTasks} onCheckedChange={setNotifyTasks} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Deadline Reminders
              </p>
              <p className="text-xs text-muted-foreground">
                Receive reminders before upcoming deadlines
              </p>
            </div>
            <Switch
              checked={notifyDeadlines}
              onCheckedChange={setNotifyDeadlines}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Award Notifications
              </p>
              <p className="text-xs text-muted-foreground">
                Get notified about scholarship awards and decisions
              </p>
            </div>
            <Switch checked={notifyAwards} onCheckedChange={setNotifyAwards} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">New Messages</p>
              <p className="text-xs text-muted-foreground">
                Get notified when you receive a new message
              </p>
            </div>
            <Switch
              checked={notifyMessages}
              onCheckedChange={setNotifyMessages}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            size="sm"
            className="bg-[#2563EB] hover:bg-[#2563EB]/90 gap-1.5"
            onClick={handleSaveNotifications}
            disabled={savingNotifs}
          >
            <Save className="size-3.5" />
            {savingNotifs ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </motion.div>

      {/* ─── Student Profile Section (read-only) ─── */}
      {!student ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-gray-400">No linked student found.</p>
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-lg font-semibold text-[#1E3A5F]">
              Student Profile
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Read-only view of your child&apos;s profile information
            </p>
          </div>

          {/* Top row: avatar card + journey + completion */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Student card */}
            <motion.div
              className="rounded-xl bg-white p-5 [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.16,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  {student.image && <AvatarImage src={student.image} alt={student.name || student.email} />}
                  <AvatarFallback className="bg-[#1E3A5F] text-white text-xl font-semibold">
                    {getInitials(student.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {fullName}
                  </h2>
                  <p className="text-sm text-gray-500">{schoolName}</p>
                  <p className="text-sm text-gray-400">
                    {gradeLabel}
                    {profile?.gpa ? ` · GPA ${profile.gpa}` : ""}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Journey stage */}
            <motion.div
              className="rounded-xl bg-white p-5 [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] flex flex-col justify-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.24,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-[#2563EB]/10">
                  <TrendingUp className="size-5 text-[#2563EB]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Journey Stage</p>
                  <p className="text-lg font-semibold text-[#1E3A5F]">
                    {stage}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-1">
                {stageLabels.map((s, i) => (
                  <div
                    key={s}
                    className={cn(
                      "h-1.5 flex-1 rounded-full",
                      i <= stageIndex ? "bg-[#2563EB]" : "bg-gray-200"
                    )}
                  />
                ))}
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-gray-400">
                <span>Early Exploration</span>
                <span>Post Acceptance</span>
              </div>
            </motion.div>

            {/* Profile completion ring */}
            <motion.div
              className="rounded-xl bg-white p-5 [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] flex flex-col items-center justify-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.32,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div className="relative size-24">
                <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#f0f0f0"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-gray-900">
                    {profileCompletion}%
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">Profile Completion</p>
            </motion.div>
          </div>

          {/* Profile sections */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Personal Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
            >
              <ProfileSection title="Personal Information" icon={User}>
                <div className="grid grid-cols-2 gap-x-6">
                  <InfoRow label="Full Name" value={fullName} />
                  <InfoRow
                    label="Date of Birth"
                    value={
                      profile?.dateOfBirth
                        ? new Date(profile.dateOfBirth).toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }
                          )
                        : "\u2014"
                    }
                  />
                  <InfoRow
                    label="Email"
                    value={
                      <span className="flex items-center gap-1.5">
                        <Mail className="size-3 text-gray-400" />
                        {student.email}
                      </span>
                    }
                  />
                  <InfoRow
                    label="Phone"
                    value={
                      profile?.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="size-3 text-gray-400" />
                          {profile.phone}
                        </span>
                      ) : (
                        "\u2014"
                      )
                    }
                  />
                  <div className="col-span-2">
                    <InfoRow
                      label="Address"
                      value={
                        addressParts ? (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="size-3 text-gray-400" />
                            {addressParts}
                          </span>
                        ) : (
                          "\u2014"
                        )
                      }
                    />
                  </div>
                  {profile?.ethnicity && (
                    <InfoRow label="Ethnicity" value={profile.ethnicity} />
                  )}
                </div>
              </ProfileSection>
            </motion.div>

            {/* Academic Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              viewport={{ once: true }}
            >
              <ProfileSection title="Academic Information" icon={GraduationCap}>
                <div className="grid grid-cols-2 gap-x-6">
                  <InfoRow label="School" value={schoolName} />
                  <InfoRow label="Grade" value={gradeLabel} />
                  <InfoRow
                    label="GPA"
                    value={profile?.gpa ? String(profile.gpa) : "\u2014"}
                  />
                  <InfoRow
                    label="Graduation Year"
                    value={
                      profile?.graduationYear
                        ? String(profile.graduationYear)
                        : "\u2014"
                    }
                  />
                  <InfoRow
                    label="SAT Score"
                    value={
                      profile?.satScore
                        ? String(profile.satScore)
                        : "Not taken"
                    }
                  />
                  <InfoRow
                    label="ACT Score"
                    value={
                      profile?.actScore
                        ? String(profile.actScore)
                        : "Not taken"
                    }
                  />
                  {profile?.intendedMajor && (
                    <div className="col-span-2">
                      <InfoRow
                        label="Intended Major"
                        value={profile.intendedMajor}
                      />
                    </div>
                  )}
                </div>
              </ProfileSection>
            </motion.div>

            {/* Background */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.16,
                ease: [0.16, 1, 0.3, 1],
              }}
              viewport={{ once: true }}
            >
              <ProfileSection title="Background" icon={Globe}>
                <div className="grid grid-cols-2 gap-x-6">
                  <InfoRow
                    label="First Generation"
                    value={profile?.isFirstGen ? "Yes" : "No"}
                  />
                  <InfoRow
                    label="Citizenship"
                    value={profile?.citizenship ?? "\u2014"}
                  />
                  <InfoRow
                    label="Financial Need"
                    value={profile?.hasFinancialNeed ? "Yes" : "No"}
                  />
                  <InfoRow
                    label="Pell Eligible"
                    value={profile?.isPellEligible ? "Yes" : "No"}
                  />
                </div>
              </ProfileSection>
            </motion.div>

            {/* Goals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.24,
                ease: [0.16, 1, 0.3, 1],
              }}
              viewport={{ once: true }}
            >
              <ProfileSection title="Goals &amp; Preferences" icon={Target}>
                <div className="grid grid-cols-2 gap-x-6">
                  <InfoRow
                    label="Path"
                    value={profile?.postSecondaryPath ?? "\u2014"}
                  />
                  <InfoRow
                    label="Intended Major"
                    value={profile?.intendedMajor ?? "\u2014"}
                  />
                </div>
              </ProfileSection>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
