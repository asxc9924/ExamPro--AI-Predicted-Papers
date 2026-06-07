import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ExamCategory } from "@/types";
import { CATEGORY_META } from "@/types";
import ExamsContent from "./ExamsContent";

const VALID_CATEGORIES: ExamCategory[] = [
  "upsc","ssc","banking","railway","defence","teaching","state","engineering","medical"
];

export async function generateStaticParams() {
  return VALID_CATEGORIES.map(c => ({ category: c }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string }> }
): Promise<Metadata> {
  const { category } = await params;
  const meta = CATEGORY_META[category as ExamCategory];
  if (!meta) return { title: "Not Found" };
  return {
    title: `${meta.label} Exams — AI Predicted Papers | ExamEdge`,
    description: `Browse all ${meta.label} exams. ${meta.description}. AI-predicted papers with 90%+ accuracy.`,
  };
}

export default async function CategoryPage(
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params;
  if (!VALID_CATEGORIES.includes(category as ExamCategory)) notFound();
  return <ExamsContent category={category as ExamCategory} />;
}
