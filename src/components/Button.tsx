import * as React from "react"
import { cn } from "@/src/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost'
  fullWidth?: boolean
}

export function Button({ 
  className, 
  variant = 'primary', 
  fullWidth = false,
  ...props 
}: ButtonProps) {
  const variants = {
    primary: "bg-gold text-midnight hover:bg-gold-light",
    outline: "border border-white text-white hover:bg-white/10",
    ghost: "text-slate hover:text-midnight hover:bg-bone/50"
  }

  return (
    <button
      className={cn(
        "font-sans font-bold py-3 px-6 rounded-pill transition-colors flex items-center justify-center",
        fullWidth ? "w-full" : "md:min-w-[160px]",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
