import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ExamDetailClient from "./ExamDetailClient";

// Static params for top exams (ISR + SSG)
export async function generateStaticParams() {
  return [
    { slug: "upsc-cse" },
    { slug: "ssc-cgl" },
    { slug: "ibps-po" },
    { slug: "jee-main" },
    { slug: "jee-advanced" },
    { slug: "neet-ug" },
    { slug: "neet-pg" },
    { slug: "aiims-nursing" },
    { slug: "rrb-ntpc" },
    { slug: "nda" },
    { slug: "rbi-grade-b" },
    { slug: "ssc-chsl" },
    { slug: "ctet" },
    { slug: "rrb-group-d" },
    { slug: "sbi-po" },
    { slug: "ibps-clerk" },
    { slug: "cds" },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const title = slug
    .split("-")
    .map((w) => w.toUpperCase())
    .join(" ");
  return {
    title: `${title} Predicted Paper 2025 — ExamEdge`,
    description: `AI-predicted question paper for ${title} 2025. Based on 10+ years of exam pattern analysis with 94%+ accuracy.`,
  };
}

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ExamDetailClient slug={slug} />;
}
