"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourSlide {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface WelcomeTourProps {
  slides: TourSlide[];
  onComplete: () => void;
  onSkip: () => void;
}

export function WelcomeTour({ slides, onComplete, onSkip }: WelcomeTourProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const isLast = currentSlide === slides.length - 1;

  const nextSlide = () => {
    if (isLast) {
      onComplete();
    } else {
      setDirection(1);
      setCurrentSlide((s) => s + 1);
    }
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide((s) => Math.max(s - 1, 0));
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 200 : -200,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -200 : 200,
      opacity: 0,
    }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-md mx-4 rounded-3xl bg-white shadow-2xl overflow-hidden"
      >
        {/* Skip button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Slide content */}
        <div className="px-8 pt-12 pb-6 min-h-[280px] flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col items-center"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#1E3A5F]/10 text-[#1E3A5F] mb-6">
                {slides[currentSlide].icon}
              </div>
              <h2 className="text-xl font-bold text-[#1E3A5F] mb-2">
                {slides[currentSlide].title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 pb-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > currentSlide ? 1 : -1);
                setCurrentSlide(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? "w-6 bg-[#2563EB]"
                  : "w-1.5 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-8 pb-8 pt-2">
          {currentSlide > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={prevSlide}
              className="gap-1 text-muted-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-muted-foreground"
            >
              Skip tour
            </Button>
          )}

          <Button
            onClick={nextSlide}
            className="rounded-2xl gap-1.5 bg-[#2563EB] hover:bg-[#2563EB]/90"
          >
            {isLast ? "Get Started" : "Next"}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
