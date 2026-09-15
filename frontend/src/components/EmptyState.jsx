export default function EmptyState({ title, description }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-1 p-10 text-center">
      <p className="font-medium text-ink-800">{title}</p>
      {description && <p className="text-sm text-ink-500">{description}</p>}
    </div>
  );
}
