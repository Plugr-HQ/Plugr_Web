import * as React from "react"
import Link from "next/link"
import { cn } from "@/src/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost'
  fullWidth?: boolean
  href?: string
}

export function Button({ 
  className, 
  variant = 'primary', 
  fullWidth = false,
  href,
  ...props 
}: ButtonProps) {
  const variants = {
    primary: "bg-gold text-midnight hover:bg-gold-light",
    outline: "border border-white text-white hover:bg-white/10",
    ghost: "text-slate hover:text-midnight hover:bg-bone/50"
  }

  const classes = cn(
    "font-sans font-bold py-3 px-6 rounded-pill transition-colors flex items-center justify-center",
    fullWidth ? "w-full" : "md:min-w-[160px]",
    variants[variant],
    className
  )

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
      >
        {props.children}
      </Link>
    )
  }

  return (
    <button
      className={classes}
      {...props}
    />
  )
}
