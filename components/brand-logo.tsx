import Image from "next/image";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-20 w-20",
};

export default function BrandLogo({
  size = "md",
  showText = true,
  showTagline = true,
  className = "",
}: BrandLogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <span
        className={`relative shrink-0 overflow-hidden rounded-xl border border-[var(--color-border-muted)] bg-white shadow-[var(--shadow-card-soft)] ${sizeClasses[size]}`}
      >
        <Image
          src="/unified-steele-logo.jpeg"
          alt="Unified Steele logo"
          fill
          sizes={size === "lg" ? "80px" : size === "md" ? "56px" : "40px"}
          className="object-contain p-1"
          priority={size !== "sm"}
        />
      </span>
      {showText ? (
        <span className="min-w-0">
          <span className="block text-base font-extrabold tracking-tight text-[var(--color-text)]">
            Unified Steele
          </span>
          {showTagline ? (
            <span className="block text-xs font-bold text-[var(--color-text-secondary)]">
              Your business. Unified.
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
