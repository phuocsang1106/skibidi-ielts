import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Flashcards } from "@/components/flashcards";
import { requireUser } from "@/lib/auth";
import { vocabularyTopicForUser } from "@/lib/services/vocabulary";
import { AppError } from "@/lib/errors";

export default async function TopicPage({ params }: { params: Promise<{ levelSlug: string; topicSlug: string }> }) {
  const user=await requireUser(); const {levelSlug,topicSlug}=await params;
  try {
    const topic=await vocabularyTopicForUser(user.id,levelSlug,topicSlug);
    return <><PageHeader title={topic.name} description={`${topic.level.name} · ${topic.level.bandRange}`} action={<Link href="/app/vocabulary" className="btn btn-secondary">All levels</Link>}/><Flashcards words={topic.words}/></>;
  } catch(error){ if(error instanceof AppError&&error.status===403) redirect("/app/pricing"); if(error instanceof AppError&&error.status===404) notFound(); throw error; }
}
