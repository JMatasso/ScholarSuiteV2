"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  GraduationCap,
  Search,
  BarChart3,
  Users,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BookOpen,
  DollarSign,
  Menu,
  X,
} from "lucide-react";
import { motion, useInView, useScroll } from "motion/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";
import { ElegantShape } from "@/components/ui/elegant-shape";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";

const testimonials = [
  {
    text: "ScholarSuite helped me find 23 scholarships I never knew I qualified for. I ended up winning $15,000 in awards my senior year alone.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    name: "Jessica Martinez",
    role: "College Freshman, UT Austin",
  },
  {
    text: "The application tracking board is a lifesaver. I went from missing deadlines to submitting every single one on time. Totally changed my process.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    name: "Marcus Thompson",
    role: "High School Senior",
  },
  {
    text: "As a consultant managing 40+ students, ScholarSuite cut my admin time in half. The dashboard gives me everything I need at a glance.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face",
    name: "Dr. Maria Santos",
    role: "College Prep Consultant",
  },
  {
    text: "I can finally see exactly where my daughter stands with all her applications. The parent dashboard gives me peace of mind without being overbearing.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    name: "Patricia Chen",
    role: "Parent",
  },
  {
    text: "The essay tools alone are worth it. Having AI feedback before my consultant review saved so much back-and-forth. My essays were polished and ready.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    name: "David Okafor",
    role: "Scholarship Recipient, Spelman College",
  },
  {
    text: "We adopted ScholarSuite for our entire college prep program. The matching engine alone helped our students collectively win over $2M last year.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
    name: "Angela Rivera",
    role: "Director, Pathways Educational Services",
  },
  {
    text: "The financial planning feature opened my eyes. I could actually see my funding gap and knew exactly how many more scholarships I needed to apply for.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face",
    name: "James Park",
    role: "Pre-Med Student, UCLA",
  },
  {
    text: "My students love the Kanban boards. They went from scattered spreadsheets to organized pipelines practically overnight. It just clicks.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    name: "Keisha Washington",
    role: "High School Counselor",
  },
  {
    text: "I was overwhelmed by the scholarship search until I found ScholarSuite. It matched me with scholarships based on my actual profile — not just GPA.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    name: "Ryan Gonzalez",
    role: "First-Gen College Student",
  },
];

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      delay: 0.3 + i * 0.15,
      ease: [0.25, 0.4, 0.25, 1],
    },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", bounce: 0.3, duration: 1.5 },
  },
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      setScrolled(latest > 0.02);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Navigation */}
      <nav
        className={cn(
          "fixed top-0 z-50 w-full border-b transition-all duration-300",
          scrolled
            ? "bg-white/80 backdrop-blur-xl border-gray-200/50 shadow-sm"
            : "bg-transparent border-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-[#1A1A1A]">
              ScholarSuite
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-sm text-gray-600 hover:text-[#1A1A1A] transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-gray-600 hover:text-[#1A1A1A] transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#features"
              className="text-sm text-gray-600 hover:text-[#1A1A1A] transition-colors"
            >
              Pricing
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/request-access"
              className="text-sm font-medium text-gray-600 hover:text-[#1A1A1A] transition-colors px-4 py-2"
            >
              Request Access
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium bg-[#1E3A5F] text-white px-5 py-2.5 rounded-lg hover:bg-[#162d4a] transition-colors"
            >
              Sign In
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden relative z-20 -m-2.5 p-2.5"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
            <Link href="#features" className="block text-sm text-gray-600 py-2">Features</Link>
            <Link href="#how-it-works" className="block text-sm text-gray-600 py-2">How It Works</Link>
            <Link href="/request-access" className="block text-sm text-gray-600 py-2">Request Access</Link>
            <Link href="/login" className="block text-sm font-medium bg-[#1E3A5F] text-white px-5 py-2.5 rounded-lg text-center">Sign In</Link>
          </div>
        )}
      </nav>

      {/* Hero Section — Light with floating shapes */}
      <section className="relative pt-32 pb-8 w-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#FAFAF8] via-blue-50/30 to-[#FAFAF8]">
        {/* Floating elegant shapes — light mode */}
        <div className="absolute inset-0 overflow-hidden">
          <ElegantShape
            delay={0.3}
            width={600}
            height={140}
            rotate={12}
            gradient="from-[#2563EB]/[0.07]"
            className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
            light
          />
          <ElegantShape
            delay={0.5}
            width={500}
            height={120}
            rotate={-15}
            gradient="from-[#1E3A5F]/[0.06]"
            className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
            light
          />
          <ElegantShape
            delay={0.4}
            width={300}
            height={80}
            rotate={-8}
            gradient="from-blue-400/[0.08]"
            className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
            light
          />
          <ElegantShape
            delay={0.6}
            width={200}
            height={60}
            rotate={20}
            gradient="from-sky-300/[0.08]"
            className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
            light
          />
          <ElegantShape
            delay={0.7}
            width={150}
            height={40}
            rotate={-25}
            gradient="from-indigo-400/[0.06]"
            className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
            light
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 py-24">
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-8"
          >
            <Sparkles className="w-4 h-4 text-[#2563EB]" />
            <span className="text-sm text-[#2563EB] font-medium tracking-wide">
              AI-Powered Scholarship Matching
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 text-[#1A1A1A]"
          >
            Your scholarship journey,{" "}
            <span className="text-[#2563EB]">organized.</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            ScholarSuite helps students discover scholarships, track
            applications, and plan their financial future — with expert guidance
            every step of the way.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/request-access"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1E3A5F] text-white px-8 py-3.5 rounded-xl text-base font-medium hover:bg-[#162d4a] transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#1E3A5F]/20"
            >
              Request Access
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl text-base font-medium hover:bg-white hover:border-gray-300 transition-all"
            >
              Sign In
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Product Screenshot */}
      <section className="relative px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <div className="relative rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-gray-300/30 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-gray-100 rounded-md px-4 py-1 text-xs text-gray-400">
                  app.scholarsuite.com
                </div>
              </div>
            </div>
            <div className="p-8 bg-gradient-to-br from-[#FAFAF8] to-blue-50/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardMockCard
                  title="Scholarships Matched"
                  value="47"
                  subtitle="12 new this week"
                  icon={<Search className="w-5 h-5 text-[#2563EB]" />}
                />
                <DashboardMockCard
                  title="Applications Active"
                  value="8"
                  subtitle="3 due this month"
                  icon={<BookOpen className="w-5 h-5 text-purple-600" />}
                />
                <DashboardMockCard
                  title="Awards Won"
                  value="$12,500"
                  subtitle="From 4 scholarships"
                  icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
                />
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { title: "Not Started", count: 3, color: "bg-gray-100", dotColor: "bg-gray-400" },
                  { title: "In Progress", count: 5, color: "bg-blue-50", dotColor: "bg-blue-400" },
                  { title: "Submitted", count: 2, color: "bg-purple-50", dotColor: "bg-purple-400" },
                  { title: "Awarded", count: 4, color: "bg-emerald-50", dotColor: "bg-emerald-400" },
                ].map((col) => (
                  <div key={col.title} className={`${col.color} rounded-lg p-4`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                      <span className="text-sm font-medium text-gray-700">{col.title}</span>
                      <span className="text-xs text-gray-400 ml-auto">{col.count}</span>
                    </div>
                    {Array.from({ length: Math.min(col.count, 2) }).map((_, i) => (
                      <div key={i} className="bg-white rounded-md p-3 mb-2 border border-gray-100 shadow-sm">
                        <div className="h-2.5 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-2 bg-gray-100 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section — animated counters */}
      <StatsSection />

      {/* Features Bento Grid */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-blue-50 text-[#2563EB] text-sm font-medium px-4 py-1.5 rounded-full mb-5">
              Features
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
              Everything you need to win scholarships
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              From discovery to award — ScholarSuite streamlines the entire
              scholarship journey for students, consultants, and families.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
          >
            <BentoGrid className="lg:grid-rows-3 auto-rows-[18rem]">
              <BentoCard
                Icon={Search}
                name="Smart Scholarship Matching"
                description="AI-powered matching finds scholarships you actually qualify for. Hard filters on GPA, state, and eligibility — plus soft scoring on fit, deadline proximity, and award amount."
                href="#features"
                cta="Learn more"
                background={<FeatureCardBg color="blue" />}
                className="lg:row-start-1 lg:row-end-4 lg:col-start-1 lg:col-end-2"
              />
              <BentoCard
                Icon={BarChart3}
                name="Application Tracking"
                description="Kanban-style boards keep every scholarship and college application on track. Never miss a deadline again."
                href="#features"
                cta="Learn more"
                background={<FeatureCardBg color="purple" />}
                className="lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-3"
              />
              <BentoCard
                Icon={DollarSign}
                name="Financial Planning"
                description="See your full college cost picture, semester by semester. Map scholarships, grants, and loans to visualize your funding gap."
                href="#features"
                cta="Learn more"
                background={<FeatureCardBg color="emerald" />}
                className="lg:col-start-2 lg:col-end-3 lg:row-start-3 lg:row-end-4"
              />
              <BentoCard
                Icon={Users}
                name="Built for Teams"
                description="Consultants, students, and parents — all on the same page. Manage cohorts, assign tasks, and track progress at scale."
                href="#features"
                cta="Learn more"
                background={<FeatureCardBg color="sky" />}
                className="lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2"
              />
              <BentoCard
                Icon={BookOpen}
                name="Essay Tools & AI Review"
                description="Craft winning scholarship essays with version tracking, AI-powered feedback, and consultant review workflows."
                href="#features"
                cta="Learn more"
                background={<FeatureCardBg color="amber" />}
                className="lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4"
              />
            </BentoGrid>
          </motion.div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-24 px-6 bg-[#1E3A5F] relative overflow-hidden">
        {/* Subtle floating shapes */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <ElegantShape
            delay={0}
            width={400}
            height={100}
            rotate={15}
            gradient="from-[#2563EB]/[0.2]"
            className="right-[-10%] top-[10%]"
          />
          <ElegantShape
            delay={0.3}
            width={300}
            height={80}
            rotate={-10}
            gradient="from-blue-300/[0.15]"
            className="left-[-5%] bottom-[15%]"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 text-blue-200 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                <Sparkles className="w-4 h-4" />
                AI-Powered
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Meet your AI scholarship advisor
              </h2>
              <p className="text-lg text-blue-100/80 mb-8 leading-relaxed">
                Get instant answers about scholarships, receive AI-generated
                essay feedback, and let our matching engine work around the clock
                to find opportunities you qualify for.
              </p>
              <div className="space-y-4">
                {[
                  "AI-driven intake summaries from student profiles",
                  "First-pass essay review before consultant feedback",
                  "Intelligent scholarship recommendations",
                  "Natural language Q&A about the application process",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-blue-100">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <div className="w-8 h-8 bg-[#2563EB] rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">ScholarSuite AI</p>
                  <p className="text-xs text-gray-400">Always available</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <ChatBubble isUser message="What scholarships am I eligible for with a 3.7 GPA in California?" />
                <ChatBubble message="Based on your profile, I found 23 scholarships matching your criteria. Here are the top 3 by match score:" />
                <div className="space-y-2 ml-2">
                  {[
                    { name: "California Dream Scholarship", amount: "$5,000", match: "95%" },
                    { name: "STEM Leaders Fund", amount: "$3,000", match: "91%" },
                    { name: "Community Impact Award", amount: "$2,500", match: "88%" },
                  ].map((s) => (
                    <div key={s.name} className="bg-blue-50 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.amount}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#2563EB] bg-blue-100 px-2 py-1 rounded-full">
                        {s.match} match
                      </span>
                    </div>
                  ))}
                </div>
                <ChatBubble isUser message="Can you help me start the essay for the California Dream Scholarship?" />
                <div className="flex gap-2 ml-2">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-blue-50 text-[#2563EB] text-sm font-medium px-4 py-1.5 rounded-full mb-5">
              How It Works
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
              Get started in minutes
            </h2>
            <p className="text-lg text-gray-500">
              Three simple steps to transform your scholarship search
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Complete Your Profile",
                description:
                  "Fill out our guided intake form with your academic, financial, and personal details. Takes about 10 minutes.",
              },
              {
                step: "02",
                title: "Discover Matches",
                description:
                  "Our matching engine instantly finds scholarships you qualify for, ranked by fit and deadline urgency.",
              },
              {
                step: "03",
                title: "Track & Apply",
                description:
                  "Manage your applications with Kanban boards, checklists, and essay tools. Your consultant guides you every step.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.15,
                  ease: [0.16, 1, 0.3, 1],
                }}
                viewport={{ once: true }}
                className="relative group"
              >
                <div className="text-6xl font-bold text-[#2563EB]/10 mb-4 transition-colors group-hover:text-[#2563EB]/20">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-blue-50 text-[#2563EB] text-sm font-medium px-4 py-1.5 rounded-full mb-5">
              Testimonials
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] tracking-tight text-center">
              What our users say
            </h2>
            <p className="text-center mt-4 text-gray-500">
              See how ScholarSuite is helping students, parents, and consultants
              win more scholarships.
            </p>
          </motion.div>

          <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
            <TestimonialsColumn testimonials={testimonials.slice(0, 3)} duration={15} />
            <TestimonialsColumn testimonials={testimonials.slice(3, 6)} className="hidden md:block" duration={19} />
            <TestimonialsColumn testimonials={testimonials.slice(6, 9)} className="hidden lg:block" duration={17} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-blue-50/50 to-[#FAFAF8] relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <ElegantShape
            delay={0}
            width={500}
            height={120}
            rotate={10}
            gradient="from-[#2563EB]/[0.06]"
            className="left-[-10%] top-[20%]"
            light
          />
          <ElegantShape
            delay={0.2}
            width={400}
            height={100}
            rotate={-12}
            gradient="from-blue-400/[0.05]"
            className="right-[-5%] bottom-[20%]"
            light
          />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-6">
              Ready to transform your scholarship practice?
            </h2>
            <p className="text-lg text-gray-500 mb-10">
              Join hundreds of consultants and thousands of students already
              using ScholarSuite to discover, apply, and win scholarships.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/request-access"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1E3A5F] text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-[#162d4a] transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#1E3A5F]/20"
              >
                Request Access
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl text-base font-medium hover:bg-white hover:border-gray-300 transition-all"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1E3A5F] text-blue-200/60 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-white/90 font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#features" className="hover:text-white/90 transition-colors">Features</Link></li>
                <li><Link href="#features" className="hover:text-white/90 transition-colors">Pricing</Link></li>
                <li><button onClick={() => toast.info("Coming soon")} className="hover:text-white/90 transition-colors cursor-pointer">Integrations</button></li>
                <li><button onClick={() => toast.info("Coming soon")} className="hover:text-white/90 transition-colors cursor-pointer">Changelog</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white/90 font-semibold mb-4">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => toast.info("Coming soon")} className="hover:text-white/90 transition-colors cursor-pointer">Documentation</button></li>
                <li><button onClick={() => toast.info("Coming soon")} className="hover:text-white/90 transition-colors cursor-pointer">Help Center</button></li>
                <li><button onClick={() => toast.info("Coming soon")} className="hover:text-white/90 transition-colors cursor-pointer">Blog</button></li>
                <li><button onClick={() => toast.info("Coming soon")} className="hover:text-white/90 transition-colors cursor-pointer">Webinars</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white/90 font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => toast.info("Coming soon")} className="hover:text-white/90 transition-colors cursor-pointer">About</button></li>
                <li><button onClick={() => toast.info("Coming soon")} className="hover:text-white/90 transition-colors cursor-pointer">Careers</button></li>
                <li><button onClick={() => toast.info("Coming soon")} className="hover:text-white/90 transition-colors cursor-pointer">Contact</button></li>
                <li><button onClick={() => toast.info("Coming soon")} className="hover:text-white/90 transition-colors cursor-pointer">Partners</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white/90 font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => toast.info("Coming soon")} className="hover:text-white/90 transition-colors cursor-pointer">Privacy Policy</button></li>
                <li><button onClick={() => toast.info("Coming soon")} className="hover:text-white/90 transition-colors cursor-pointer">Terms of Service</button></li>
                <li><button onClick={() => toast.info("Coming soon")} className="hover:text-white/90 transition-colors cursor-pointer">FERPA Compliance</button></li>
                <li><button onClick={() => toast.info("Coming soon")} className="hover:text-white/90 transition-colors cursor-pointer">Data Security</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-blue-200/40">
                ScholarSuite &copy; 2026. All rights reserved.
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Sub-components ─── */

function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const stats = [
    { value: 2500, label: "Students Served", suffix: "+" },
    { value: 8, label: "In Scholarship Awards", prefix: "$", suffix: "M+" },
    { value: 150, label: "Partner Schools", suffix: "+" },
    { value: 95, label: "Student Satisfaction", suffix: "%" },
  ];

  return (
    <section ref={ref} className="py-20 px-6 border-t border-gray-100">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-2 flex items-center justify-center">
                {stat.prefix && <span>{stat.prefix}</span>}
                {isInView ? (
                  <AnimatedNumber
                    value={stat.value}
                    className="text-3xl md:text-4xl font-bold"
                    springOptions={{ bounce: 0, duration: 2000 }}
                  />
                ) : (
                  <span>0</span>
                )}
                {stat.suffix && <span>{stat.suffix}</span>}
              </div>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardMockCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-500">{title}</p>
        <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-[#1A1A1A] mb-1">{value}</p>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}

function FeatureCardBg({ color }: { color: string }) {
  const colorMap: Record<string, string> = {
    blue: "from-blue-100/80 to-blue-50/30",
    purple: "from-purple-100/80 to-purple-50/30",
    emerald: "from-emerald-100/80 to-emerald-50/30",
    sky: "from-sky-100/80 to-sky-50/30",
    amber: "from-amber-100/80 to-amber-50/30",
  };
  return (
    <div
      className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-40",
        colorMap[color] || colorMap.blue
      )}
    />
  );
}

function ChatBubble({
  message,
  isUser,
}: {
  message: string;
  isUser?: boolean;
}) {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
          isUser
            ? "bg-[#1E3A5F] text-white rounded-br-md"
            : "bg-gray-100 text-gray-800 rounded-bl-md"
        }`}
      >
        {message}
      </div>
    </div>
  );
}
