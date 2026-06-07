"use client";

import { useEffect } from "react";
import ExamsPage from "@/app/exams/page";
import type { ExamCategory } from "@/types";

// Simple wrapper that renders the shared exams page
// Category filtering is handled via URL params in ExamsPage
export default function ExamsContent({ category }: { category: ExamCategory }) {
  // Set the initial category filter via a custom event
  useEffect(() => {
    window.__initialCategory = category;
  }, [category]);

  return <ExamsPage />;
}

// Extend Window type
declare global {
  interface Window {
    __initialCategory?: ExamCategory;
  }
}
