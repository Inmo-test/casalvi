"use client"

import * as React from "react"
import { cn } from "@/lib/cn"

const Slider = React.forwardRef<
    HTMLInputElement,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
        onValueChange?: (value: number[]) => void
        max?: number
        min?: number
        step?: number
        value?: number[]
    }
>(({ className, value, onValueChange, max = 100, min = 0, step = 1, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value)
        if (onValueChange) {
            onValueChange([val])
        }
    }

    const currentValue = value ? value[0] : min

    // Calculate percentage for background gradient
    const percentage = ((currentValue - min) / (max - min)) * 100

    return (
        <div className="relative w-full flex items-center">
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={currentValue}
                onChange={handleChange}
                className={cn(
                    "w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
                    className
                )}
                style={{
                    background: `linear-gradient(to right, hsl(var(--primary)) ${percentage}%, hsl(var(--secondary)) ${percentage}%)`
                }}
                ref={ref}
                {...props}
            />
            <style jsx>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: white;
          border: 2px solid hsl(var(--primary));
          cursor: pointer;
          margin-top: -2px; /* You need to specify a margin in Chrome, but in Firefox and IE it is automatic */
          box-shadow: 0px 2px 6px rgba(0,0,0,0.1);
          transition: transform 0.1s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
            transform: scale(1.1);
        }
      `}</style>
        </div>
    )
})
Slider.displayName = "Slider"

export { Slider }
