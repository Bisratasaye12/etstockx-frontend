type AdminPlaceholderPanelProps = {
  title: string;
  description: string;
};

export function AdminPlaceholderPanel({
  title,
  description,
}: AdminPlaceholderPanelProps) {
  return (
    <div className="border-border bg-card/40 rounded-xl border border-dashed p-10 text-center shadow-sm">
      <p className="text-foreground text-lg font-medium tracking-tight">
        {title}
      </p>
      <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
