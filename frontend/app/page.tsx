import type { Metadata } from "next";
import Hero from "@/components/Hero";
import ExamCategories from "@/components/ExamCategories";
import TrendingExams from "@/components/TrendingExams";
import FeaturesSection from "@/components/FeaturesSection";
import StatsSection from "@/components/StatsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";

export const metadata: Metadata = {
  title: "ExamEdge — AI-Predicted Question Papers for UPSC, SSC, JEE, NEET",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsSection />
      <ExamCategories />
      <TrendingExams />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
    </>
  );
}
