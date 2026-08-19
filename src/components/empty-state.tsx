export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="surface p-8 text-center"><h2 className="font-semibold">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}
