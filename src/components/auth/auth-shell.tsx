import { Logo } from "@/components/landing/logo";
import { Card } from "@/components/ui/card";

export function AuthShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.05fr_.95fr]">
      <section className="hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Logo inverse />
        <div className="max-w-lg"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Learn deliberately</p><h2 className="mt-4 text-5xl font-black tracking-[-0.04em]">Vocabulary in your head. Better writing on the page.</h2><p className="mt-5 leading-7 text-slate-400">A focused IELTS workspace with smart flashcards, structured AI feedback, and simple progress history.</p></div>
        <p className="text-sm text-slate-500">Skibidi IELTS</p>
      </section>
      <section className="flex items-center justify-center p-5 sm:p-8">
        <Card className="w-full max-w-md p-7 shadow-soft sm:p-9">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          <div className="mt-7">{children}</div>
        </Card>
      </section>
    </main>
  );
}
