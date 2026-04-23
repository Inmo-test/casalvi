'use client'

import * as React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@casalvi/ui'
import { cn } from '@/lib/cn'
import { searchResources, type SearchResult } from '@/app/actions/search'
import { Loader2, User, Home, Check } from 'lucide-react'

interface MentionTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    mode: 'contact' | 'property'
    onMentionSelect: (id: string, label: string) => void
}

/**
 * Utility: Get caret coordinates to position the popover
 * Simplified version of textarea-caret package logic
 */
const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
    const div = document.createElement('div')
    const style = window.getComputedStyle(element)

    Array.from(style).forEach((prop) => {
        div.style.setProperty(prop, style.getPropertyValue(prop), style.getPropertyPriority(prop))
    })

    div.style.position = 'absolute'
    div.style.visibility = 'hidden'
    div.style.whiteSpace = 'pre-wrap'
    div.style.top = '0'
    div.style.left = '0'
    div.style.overflow = 'hidden' // Important for scroll

    div.textContent = element.value.substring(0, position)

    const span = document.createElement('span')
    span.textContent = element.value.substring(position) || '.'
    div.appendChild(span)

    document.body.appendChild(div)

    const coordinates = {
        top: div.scrollHeight + element.scrollTop, // Approximation
        left: span.offsetLeft + element.scrollLeft
    }

    // Refined calculation
    const spanRect = span.getBoundingClientRect()
    // This is actually tricky to get perfect 1:1 with pure DOM without the library
    // stick to "Popoever at current cursor" strategy via Virtual Element from Radix

    document.body.removeChild(div)
    return coordinates
}

export function MentionTextarea({ className, mode, onMentionSelect, onChange, ...props }: MentionTextareaProps) {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState('')
    const [results, setResults] = React.useState<SearchResult[]>([])
    const [loading, setLoading] = React.useState(false)
    const [anchorRect, setAnchorRect] = React.useState<{ x: number, y: number } | null>(null)
    const timerRef = React.useRef<NodeJS.Timeout>()

    // Virtual Element for Popover Positioning
    const virtualAnchor = React.useMemo(() => {
        if (!anchorRect) return null
        return {
            getBoundingClientRect: () => ({
                width: 0,
                height: 0,
                top: anchorRect.y,
                left: anchorRect.x,
                right: anchorRect.x,
                bottom: anchorRect.y,
                x: anchorRect.x,
                y: anchorRect.y,
                toJSON: () => { }
            })
        }
    }, [anchorRect])

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (onChange) onChange(e)

        const val = e.target.value
        const selectionEnd = e.target.selectionEnd

        // Check if we are typing a mention: look for @ backwards from cursor
        // Pattern: @text (no spaces allowed since @)
        const textBeforeCursor = val.slice(0, selectionEnd)
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

        if (mentionMatch) {
            const matchText = mentionMatch[1] // Text after @
            const matchIndex = mentionMatch.index!

            setQuery(matchText)

            // Calculate coordinates to show popover near cursor
            if (textareaRef.current) {
                // We use a simple approximation: cursor position relative to viewport
                // A robust solution needs 'textarea-caret' lib, but we'll try a simpler UX:
                // Show popover at the cursor position if possible, or center if not.
                // Radix Popover needs an Anchor.

                // Hack: Use getBoundingClientRect of textarea + some offset? 
                // No, let's try to simulate a click rect?
                // Actually, let's just use the textarea as anchor but offset it? No.

                // Let's rely on standard "At pointer" logic if typing? No.

                // Correct approach without lib:
                // Position it at the bottom left of the textarea for now to be safe and simple.
                // UX: "Mentioning..." banner
            }

            setOpen(true)

            // Debounce Search
            if (timerRef.current) clearTimeout(timerRef.current)
            timerRef.current = setTimeout(() => {
                setLoading(true)
                searchResources(matchText, mode)
                    .then(data => setResults(data))
                    .catch(() => setResults([]))
                    .finally(() => setLoading(false))
            }, 300)
        } else {
            setOpen(false)
            setResults([])
        }
    }

    const handleSelect = (item: SearchResult) => {
        if (!textareaRef.current) return

        const val = textareaRef.current.value
        const selectionEnd = textareaRef.current.selectionEnd
        const textBeforeCursor = val.slice(0, selectionEnd)
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

        if (mentionMatch) {
            const start = mentionMatch.index!
            const end = selectionEnd

            // Replace @query with Name
            const prefix = val.slice(0, start)
            const suffix = val.slice(end)
            const newText = `${prefix}${item.label} ${suffix}`

            // Call parent change handler to update state
            // We need to simulate an event or set it manually
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set
            if (nativeSetter && textareaRef.current) {
                nativeSetter.call(textareaRef.current, newText)
                textareaRef.current.dispatchEvent(new Event('input', { bubbles: true }))
            }

            onMentionSelect(item.id, item.label)
            setOpen(false)

            // Restore focus
            textareaRef.current.focus()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Navigate results? (Simplified: no arrow navigation for now to keep code small)
        if (open && e.key === 'Escape') {
            setOpen(false)
        }
    }

    return (
        <Popover open={open && (results.length > 0 || loading)}>
            <PopoverTrigger asChild>
                <div className="relative w-full">
                    <textarea
                        ref={textareaRef}
                        className={cn(
                            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                            className
                        )}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        {...props}
                    />
                    {/* Invisible anchor for Popover - positioned at bottom left of textarea for stability */}
                    <div className="absolute bottom-0 left-0 w-full h-0" />
                </div>
            </PopoverTrigger>

            <PopoverContent
                className="p-0 w-[300px]"
                align="start"
                side="bottom"
                onOpenAutoFocus={(e) => e.preventDefault()} // Prevent stealing focus from textarea
            >
                <div className="bg-white rounded-md border shadow-md overflow-hidden">
                    <div className="bg-slate-50 px-3 py-2 border-b text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>Mencionar {mode === 'contact' ? 'Contacto' : 'Propiedad'}</span>
                        {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                    </div>

                    <div className="max-h-[200px] overflow-y-auto p-1">
                        {!loading && results.length === 0 && (
                            <div className="p-3 text-xs text-center text-slate-400">
                                Sigue escribiendo para buscar...
                            </div>
                        )}

                        {results.map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleSelect(item)}
                                className="w-full flex items-start gap-3 p-2 hover:bg-blue-50 rounded-sm transition-colors text-left group"
                            >
                                <div className="mt-0.5 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-[#007AFF] group-hover:bg-blue-200 overflow-hidden relative">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt=""
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        mode === 'contact' ? <User className="h-4 w-4" /> : <Home className="h-4 w-4" />
                                    )}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium text-slate-900 truncate">{item.label}</p>
                                    <p className="text-xs text-slate-500 truncate">{item.subLabel}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
