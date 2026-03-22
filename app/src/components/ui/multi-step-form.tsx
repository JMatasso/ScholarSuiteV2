"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

const multiStepFormVariants = cva("", {
  variants: {
    size: {
      default: "sm:max-w-xl",
      sm: "sm:max-w-lg",
      lg: "sm:max-w-2xl",
      xl: "sm:max-w-3xl",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

interface MultiStepFormProps extends VariantProps<typeof multiStepFormVariants> {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStep: number
  totalSteps: number
  title: string
  description?: string
  onBack: () => void
  onNext: () => void
  backButtonText?: string
  nextButtonText?: string
  footerContent?: React.ReactNode
  children: React.ReactNode
  className?: string
}

function MultiStepForm({
  className,
  size,
  open,
  onOpenChange,
  currentStep,
  totalSteps,
  title,
  description,
  onBack,
  onNext,
  backButtonText = "Back",
  nextButtonText = "Next Step",
  footerContent,
  children,
}: MultiStepFormProps) {
  const progress = Math.round((currentStep / totalSteps) * 100)

  const variants = {
    hidden: { opacity: 0, x: 50 },
    enter: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(multiStepFormVariants({ size }), "max-h-[90vh] overflow-y-auto", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
          <div className="flex items-center gap-4 pt-2">
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
              {currentStep}/{totalSteps}
            </p>
          </div>
        </DialogHeader>

        <div className="min-h-[200px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={variants}
              initial="hidden"
              animate="enter"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        <DialogFooter>
          {footerContent && <div className="mr-auto">{footerContent}</div>}
          {currentStep > 1 && (
            <Button variant="outline" onClick={onBack}>
              {backButtonText}
            </Button>
          )}
          <Button onClick={onNext}>
            {nextButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { MultiStepForm }
