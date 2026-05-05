import { cn } from "@/src/lib/utils"

interface LogoProps {
  className?: string
  iconOnly?: boolean
  variant?: 'light' | 'dark'
}

export function Logo({ className, iconOnly = true, variant = 'dark' }: LogoProps) {
  const isDark = variant === 'dark'
  
  return (
    <div className={cn("flex items-center justify-center", className)}>
      {/* The Icon: Circular with prong cutout */}
      <div className={cn(
        "relative w-10 h-10 rounded-full flex items-center justify-center overflow-hidden",
        isDark ? "bg-midnight" : "bg-white"
      )}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
           <circle cx="50" cy="50" r="50" fill="currentColor" className={isDark ? "text-midnight" : "text-white"} />
           {/* Recreating the two prongs cutout from image */}
           <rect x="30" y="75" width="16" height="30" rx="8" className={isDark ? "fill-bone" : "fill-midnight"} />
           <rect x="54" y="75" width="16" height="30" rx="8" className={isDark ? "fill-bone" : "fill-midnight"} />
        </svg>
      </div>
    </div>
  )
}
