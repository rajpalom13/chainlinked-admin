"use client"

import { useState } from "react"
import { ZapIcon, MessageSquareIcon, FileTextIcon, BotIcon, UserIcon } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"

interface Conversation {
  id: string
  user_id: string | null
  title: string | null
  mode: string | null
  tone: string | null
  messages: Array<{
    id: string
    role: string
    parts: Array<{ text: string; type: string }>
  }>
  is_active: boolean
  created_at: string
  userName: string
  linkedPost: { id: string; content: string | null } | null
}

interface ActivityTabsProps {
  counts: { requests: number; conversations: number; output: number }
  requestsContent: React.ReactNode
  conversationsContent: React.ReactNode
  outputContent: React.ReactNode
  conversations?: Conversation[]
}

export function ActivityTabs({ counts, requestsContent, conversationsContent, outputContent, conversations }: ActivityTabsProps) {
  const [active, setActive] = useState("requests")
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)

  const tabs = [
    { id: "requests", label: "Requests", count: counts.requests, icon: ZapIcon },
    { id: "conversations", label: "Conversations", count: counts.conversations, icon: MessageSquareIcon },
    { id: "output", label: "Output", count: counts.output, icon: FileTextIcon },
  ]

  return (
    <div>
      {/* Segmented control */}
      <div className="flex rounded-lg border bg-muted/30 p-1 gap-1">
        {tabs.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200
                ${isActive
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              <tab.icon className="size-3.5" />
              <span>{tab.label}</span>
              <span className={`
                text-[10px] tabular-nums px-1.5 py-0 rounded-full font-semibold
                ${isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}
              `}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content — show/hide */}
      <div className="mt-4">
        <div className={active === "requests" ? "" : "hidden"}>{requestsContent}</div>
        <div className={active === "conversations" ? "" : "hidden"}>
          {conversations ? (
            <div>
              {/* Wrap conversation list items with click handler */}
              <div onClick={(e) => {
                const target = (e.target as HTMLElement).closest("[data-conv-id]")
                if (target) {
                  const convId = target.getAttribute("data-conv-id")
                  const conv = conversations.find(c => c.id === convId)
                  if (conv) setSelectedConv(conv)
                }
              }}>
                {conversationsContent}
              </div>

              {/* Conversation Detail Sheet */}
              <Sheet open={!!selectedConv} onOpenChange={(open) => !open && setSelectedConv(null)}>
                <SheetContent className="!w-full sm:!w-[45vw] sm:!max-w-[45vw] overflow-y-auto p-0">
                  {selectedConv && (
                    <>
                      <SheetHeader className="px-5 pt-5 pb-3 border-b">
                        <SheetTitle className="text-sm font-semibold">
                          {selectedConv.title || "Untitled Conversation"}
                        </SheetTitle>
                        <SheetDescription className="flex items-center gap-2 text-xs flex-wrap">
                          <span>{selectedConv.userName}</span>
                          <span>·</span>
                          <span>{new Date(selectedConv.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                          {selectedConv.mode && (
                            <>
                              <span>·</span>
                              <Badge variant="secondary" className="text-[9px] h-4 px-1">{selectedConv.mode}</Badge>
                            </>
                          )}
                          {selectedConv.tone && (
                            <>
                              <span>·</span>
                              <Badge variant="outline" className="text-[9px] h-4 px-1">{selectedConv.tone}</Badge>
                            </>
                          )}
                          <span>·</span>
                          <span>{selectedConv.messages.length} messages</span>
                        </SheetDescription>
                      </SheetHeader>

                      <div className="space-y-3 px-5 py-4">
                        {/* Message thread */}
                        {selectedConv.messages.map((msg, i) => {
                          const text = msg.parts?.map(p => p.text).filter(Boolean).join("\n") || ""
                          const isUser = msg.role === "user"
                          const isSystem = msg.role === "system"

                          if (isSystem) {
                            return (
                              <div key={i} className="rounded-lg bg-muted/50 border border-muted p-3">
                                <p className="mb-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">System</p>
                                <p className="whitespace-pre-wrap text-xs text-muted-foreground leading-relaxed">{text}</p>
                              </div>
                            )
                          }

                          return (
                            <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[85%] rounded-lg p-3 ${
                                isUser
                                  ? "bg-primary/10 border border-primary/20"
                                  : "bg-secondary/30 border border-secondary/20"
                              }`}>
                                <p className={`mb-1 text-[10px] font-medium uppercase tracking-wider flex items-center gap-1 ${
                                  isUser ? "text-primary/70" : "text-secondary-foreground/70"
                                }`}>
                                  {isUser ? <UserIcon className="size-3" /> : <BotIcon className="size-3" />}
                                  {isUser ? "User" : "Assistant"}
                                </p>
                                <p className="whitespace-pre-wrap text-xs leading-relaxed">{text}</p>
                              </div>
                            </div>
                          )
                        })}

                        {/* Linked post */}
                        {selectedConv.linkedPost && (
                          <div className="border-t pt-3 mt-3">
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Generated Post</p>
                            <a
                              href={`/dashboard/content/generated?post=${selectedConv.linkedPost.id}`}
                              className="block rounded-lg border bg-card p-3 hover:border-primary/30 transition-colors"
                            >
                              <p className="text-xs leading-relaxed line-clamp-4">
                                {selectedConv.linkedPost.content?.slice(0, 200) || "No content"}
                              </p>
                              <p className="text-[10px] text-primary mt-2 font-medium">View full post →</p>
                            </a>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          ) : (
            conversationsContent
          )}
        </div>
        <div className={active === "output" ? "" : "hidden"}>{outputContent}</div>
      </div>
    </div>
  )
}
