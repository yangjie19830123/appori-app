type Props = {
  size?: number;
  className?: string;
};

export default function ApporiLogo({ size = 18, className = "" }: Props) {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div
        className="rounded bg-ink flex items-center justify-center text-cream-100 font-display"
        style={{ width: size, height: size, fontSize: size * 0.6, lineHeight: 1 }}
      >
        A
      </div>
      <span className="font-bold tracking-tight text-ink" style={{ fontSize: size * 0.72 }}>
        Appori
      </span>
    </div>
  );
}
