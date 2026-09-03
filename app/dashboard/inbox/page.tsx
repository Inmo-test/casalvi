'use client'

import { useState } from 'react'
import { fetchInbox, type EmailMessage } from '@/app/actions/inbox'
import { generateSmartReply } from '@/app/actions/generate-reply'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from '@/hooks/use-toast'
import { Loader2, Sparkles, Reply, RefreshCw, ArrowLeft, Mail } from 'lucide-react'
import { sendReply } from '@/app/actions/bulk-email'
import { cn } from '@/lib/cn'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useI18n } from '@/lib/i18n/I18nContext'

// Production-grade email decoding utilities

function decodeQuotedPrintable(str: string): string {
    if (!str) return '';
    try {
        // Remove soft line breaks (= followed by newline)
        const cleanStr = str.replace(/=\r?\n/g, '');
        // Decode =XX hex sequences
        return cleanStr.replace(/=([0-9A-F]{2})/gi, (_, hex) =>
            String.fromCharCode(parseInt(hex, 16))
        );
    } catch (e) {
        return str;
    }
}

function decodeBase64(str: string): string {
    if (!str) return '';
    try {
        // Fix standard URL safe base64 if needed
        const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        // Decode basic base64 (atob is available in browser)
        return decodeURIComponent(escape(window.atob(base64)));
    } catch (e) {
        return str;
    }
}

function parseMimeParts(raw: string): { type: 'html' | 'text', content: string } {
    // 1. Check if it's a simple message (no boundaries)
    if (!raw.includes('Content-Type:')) {
        return { type: 'text', content: raw };
    }

    // 2. Try to find HTML part
    // Look for Content-Type: text/html and extract until next boundary or end
    const htmlMatch = raw.match(/Content-Type:\s*text\/html(?:[^]*?Content-Transfer-Encoding:\s*([\w-]+))?\s*\n\s*([^]*?)(?=------=_Part_|$)/i);

    if (htmlMatch) {
        const encoding = htmlMatch[1] || '7bit';
        let content = htmlMatch[2];

        if (encoding.toLowerCase().includes('quoted-printable')) {
            content = decodeQuotedPrintable(content);
        } else if (encoding.toLowerCase().includes('base64')) {
            content = decodeBase64(content.replace(/\s/g, ''));
        }
        return { type: 'html', content };
    }

    // 3. Fallback to text/plain
    const textMatch = raw.match(/Content-Type:\s*text\/plain(?:[^]*?Content-Transfer-Encoding:\s*([\w-]+))?\s*\n\s*([^]*?)(?=------=_Part_|$)/i);
    if (textMatch) {
        const encoding = textMatch[1] || '7bit';
        let content = textMatch[2];

        if (encoding.toLowerCase().includes('quoted-printable')) {
            content = decodeQuotedPrintable(content);
        } else if (encoding.toLowerCase().includes('base64')) {
            content = decodeBase64(content.replace(/\s/g, ''));
        }
        return { type: 'text', content };
    }

    // 4. Fallback: Return raw but try to strip headers manually if present
    const cleanRaw = raw.replace(/Content-Type:.*\n|Content-Transfer-Encoding:.*\n|------=_Part_.*\n/g, '');
    return { type: 'text', content: decodeQuotedPrintable(cleanRaw) };
}

function decodeEmailBody(body: string): string {
    if (!body) return 'Sin contenido';

    // Safety check for server-side rendering
    if (typeof window === 'undefined') return body;

    try {
        const parsed = parseMimeParts(body);
        let content = parsed.content;

        // If it was HTML (or looks like HTML), use DOMParser to strip tags cleanly
        // This handles <style>, <script>, entities, and structure better than regex
        if (parsed.type === 'html' || content.includes('<html') || content.includes('<div')) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');

            // Remove style and script elements completely
            const toRemove = doc.querySelectorAll('style, script, link, meta, title, head');
            toRemove.forEach(el => el.remove());

            // Get text content (this automatically decodes &entities;)
            // innerText preserves some formatting like newlines better than textContent in some browsers, 
            // but textContent is standard. We'll use a specific strategy for newlines.

            // Replace <br> and <p> with newlines before extracting text
            doc.body.innerHTML = doc.body.innerHTML
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<\/p>/gi, '\n\n')
                .replace(/<\/div>/gi, '\n');

            content = doc.body.textContent || "";
        }

        // Final cleanup of excessive whitespace
        return content
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n') // Max 2 empty lines
            .replace(/[ \t]+/g, ' ') // Normalize spaces
            .trim();

    } catch (error) {
        console.error('Email decode error:', error);
        return decodeQuotedPrintable(body); // Fallback to basic decoding
    }
}

export default function InboxPage() {
    const { t } = useI18n()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null)
    const [replying, setReplying] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [replyText, setReplyText] = useState('')
    const [currentFolder, setCurrentFolder] = useState('INBOX')

    // React Query Hook for Caching
    const { data: emails = [], isLoading: loading, isFetching, error, refetch } = useQuery({
        queryKey: ['inbox', currentFolder], // Re-fetch when folder changes
        queryFn: async () => {
            const res = await fetchInbox(currentFolder)
            if (!res.success) throw new Error(res.error || 'Error fetching inbox')
            return res.data || []
        },
        staleTime: 5 * 60 * 1000, // 5 minutes fresh
        refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes (Polling)
    })

    if (error) {
        // Show toast only once on error
        // toast({ title: "Error", description: (error as Error).message, variant: 'destructive' })
    }

    const handleGenerateAI = async () => {
        if (!selectedEmail) return
        setAiLoading(true)
        const res = await generateSmartReply(selectedEmail.body, selectedEmail.contact?.id)
        setAiLoading(false)

        if (res.success && res.reply) {
            setReplyText(res.reply)
            toast({ title: t.dashboard.inbox.generated, description: t.dashboard.inbox.check })
        } else {
            toast({ title: "Error", description: "No se pudo generar la respuesta.", variant: 'destructive' })
        }
    }

    const handleSendReply = async () => {
        if (!selectedEmail || !replyText) return
        setReplying(true)

        // Extract clean email from "Name <email@domain.com>" or "email@domain.com"
        const emailMatch = selectedEmail.from.match(/<(.+)>/)
        const toEmail = emailMatch ? emailMatch[1] : selectedEmail.from

        const res = await sendReply(
            toEmail,
            `Re: ${selectedEmail.subject.replace(/^Re:\s*/i, '')}`, // Avoid Re: Re:
            replyText,
            selectedEmail.messageId,
            selectedEmail.references
        )

        setReplying(false)
        if (res.success) {
            toast({ title: t.dashboard.inbox.sent_success, description: t.dashboard.inbox.sent_desc })
            setReplyText('')
        } else {
            toast({ title: "Error", description: res.error || "Fallo al enviar", variant: 'destructive' })
        }
    }

    return (
        <div className="container h-[calc(100vh-80px)] md:h-[calc(100vh-80px)] py-4 md:py-6 flex gap-6">
            {/* LEFT: Email List */}
            <div className={cn(
                "w-full md:w-1/3 flex flex-col gap-4",
                selectedEmail ? "hidden md:flex" : "flex"
            )}>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-medium tracking-tight flex items-center gap-2">
                        <Mail className="h-6 w-6 text-primary" />
                        {t.dashboard.inbox.title}
                    </h1>
                    <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={loading || isFetching}>
                        <RefreshCw className={cn("h-4 w-4", (loading || isFetching) && "animate-spin")} />
                    </Button>
                </div>

                <Tabs defaultValue="INBOX" onValueChange={(val) => {
                    setCurrentFolder(val)
                    setSelectedEmail(null) // Clear selection on folder switch
                }} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="INBOX">{t.dashboard.inbox.tabs.inbox}</TabsTrigger>
                        <TabsTrigger value="SENT">{t.dashboard.inbox.tabs.sent}</TabsTrigger>
                    </TabsList>
                </Tabs>

                <Card className="flex-1 overflow-hidden">
                    <div className="h-full overflow-y-auto">
                        <div className="flex flex-col">
                            {emails.length === 0 && !loading && (
                                <div className="p-8 text-center text-muted-foreground">{t.dashboard.inbox.empty}</div>
                            )}
                            {emails.map(email => (
                                <div
                                    key={email.id}
                                    onClick={() => setSelectedEmail(email)}
                                    className={cn(
                                        "p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors flex flex-col gap-1",
                                        selectedEmail?.id === email.id && "bg-muted"
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="font-semibold truncate w-2/3">
                                            {currentFolder === 'SENT' ? `${t.dashboard.inbox.to} ${email.subject}` : email.from}
                                        </span>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(email.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="font-medium truncate text-sm">{email.subject}</div>
                                    <div className="text-xs text-muted-foreground truncate">{email.snippet}</div>

                                    {email.contact && (
                                        <div className="mt-2 flex gap-2">
                                            <Badge variant="outline" className="text-[10px] bg-blue-50 text-[#0062CC] border-blue-200">
                                                {email.contact.score}% CRM
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            {/* RIGHT: Detail View */}
            <div className={cn(
                "w-full md:flex-1 flex flex-col h-full",
                !selectedEmail ? "hidden md:flex" : "flex"
            )}>
                {selectedEmail ? (
                    <Card className="flex-1 flex flex-col overflow-hidden">
                        <CardHeader className="pb-4 border-b">
                            <div className="flex justify-between">
                                <div>
                                    {/* Mobile Back Button */}
                                    <div className="md:hidden mb-2">
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)} className="-ml-3 h-8 text-muted-foreground">
                                            <ArrowLeft className="h-4 w-4 mr-1" /> {t.dashboard.inbox.back}
                                        </Button>
                                    </div>
                                    <CardTitle>{selectedEmail.subject}</CardTitle>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        {currentFolder === 'SENT' ? t.dashboard.inbox.to : t.dashboard.inbox.from} <span className="text-foreground">{selectedEmail.from}</span>
                                    </div>
                                </div>
                                {selectedEmail.contact && (
                                    <Badge className="h-fit bg-[#007AFF] hover:bg-[#0062CC]">
                                        {t.dashboard.inbox.crm_detected}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                            <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap break-words">
                                {decodeEmailBody(selectedEmail.body || selectedEmail.snippet)}
                            </div>
                        </CardContent>

                        {currentFolder === 'INBOX' && (
                            <CardFooter className="flex-col gap-4 p-4 border-t bg-background">
                                <div className="w-full relative">
                                    <Textarea
                                        placeholder={t.dashboard.inbox.placeholder}
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        rows={5}
                                        className="resize-none pr-12"
                                    />
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="absolute top-2 right-2 text-[#007AFF] hover:bg-blue-50"
                                        onClick={handleGenerateAI}
                                        disabled={aiLoading}
                                        title={t.dashboard.inbox.generate_ai}
                                    >
                                        {aiLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                                    </Button>
                                </div>
                                <div className="flex justify-between w-full">
                                    <span className="text-xs text-muted-foreground self-center">
                                        {selectedEmail.contact
                                            ? `${t.dashboard.inbox.context_active} ${selectedEmail.contact.name}`
                                            : t.dashboard.inbox.context_external
                                        }
                                    </span>
                                    <Button onClick={handleSendReply} disabled={replying || !replyText}>
                                        {replying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Reply className="mr-2 h-4 w-4" />
                                        {t.dashboard.inbox.send}
                                    </Button>
                                </div>
                            </CardFooter>
                        )}
                    </Card>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                        {t.dashboard.inbox.select}
                    </div>
                )}
            </div>
        </div>
    )
}
