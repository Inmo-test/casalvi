/**
 * Voice Conversation Manager
 * Handles multi-turn dialogue and confirmation flows
 * Used by Siri de Casalvi for conversational AI
 */

export type ConversationState = {
  id: string
  userId: string
  intent: string
  pendingAction: any
  step: 'awaiting_confirmation' | 'awaiting_clarification' | 'completed' | 'cancelled'
  createdAt: Date
  expiresAt: Date
  metadata?: {
    entityCount?: number
    summary?: string
    [key: string]: any
  }
}

class VoiceConversationManager {
  private conversations: Map<string, ConversationState> = new Map()
  private readonly CONVERSATION_TIMEOUT = 5 * 60 * 1000 // 5 minutes

  constructor() {
    // Load from localStorage if available (client-side only)
    if (typeof window !== 'undefined') {
      this.loadFromStorage()
      // Auto-cleanup expired conversations every minute
      setInterval(() => this.cleanupExpired(), 60 * 1000)
    }
  }

  /**
   * Start a new conversation awaiting confirmation
   */
  startConversation(
    userId: string, 
    intent: string, 
    pendingAction: any,
    metadata?: any
  ): ConversationState {
    const now = new Date()
    const state: ConversationState = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      intent,
      pendingAction,
      step: 'awaiting_confirmation',
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.CONVERSATION_TIMEOUT),
      metadata
    }

    this.conversations.set(userId, state)
    this.saveToStorage()
    
    console.log('[Conversation] Started:', state.id)
    return state
  }

  /**
   * Get active conversation for user
   */
  getConversation(userId: string): ConversationState | null {
    const state = this.conversations.get(userId)
    
    if (!state) return null

    // Check if expired
    if (new Date() > state.expiresAt) {
      console.log('[Conversation] Expired:', state.id)
      this.conversations.delete(userId)
      this.saveToStorage()
      return null
    }

    return state
  }

  /**
   * Handle follow-up message in conversation
   */
  async handleFollowUp(
    userId: string, 
    followUpText: string
  ): Promise<{ 
    action: 'confirm' | 'cancel' | 'clarify' | 'expired',
    state?: ConversationState,
    message?: string
  }> {
    const state = this.getConversation(userId)

    if (!state) {
      return { 
        action: 'expired', 
        message: 'No hay conversación activa. El tiempo de espera expiró.' 
      }
    }

    // Detect confirmation
    const normalized = followUpText.toLowerCase().trim()
    const isConfirmation = this.detectConfirmation(normalized)
    const isRejection = this.detectRejection(normalized)

    if (isConfirmation) {
      console.log('[Conversation] User confirmed:', state.id)
      state.step = 'completed'
      this.conversations.delete(userId) // Remove after confirmation
      this.saveToStorage()
      return { action: 'confirm', state }
    }

    if (isRejection) {
      console.log('[Conversation] User cancelled:', state.id)
      state.step = 'cancelled'
      this.conversations.delete(userId)
      this.saveToStorage()
      return { action: 'cancel', state, message: 'Acción cancelada' }
    }

    // Ambiguous response, ask for clarification
    console.log('[Conversation] Ambiguous response:', followUpText)
    state.step = 'awaiting_clarification'
    return { 
      action: 'clarify', 
      state,
      message: 'No entendí. Di "sí" para confirmar o "no" para cancelar.' 
    }
  }

  /**
   * Cancel active conversation
   */
  cancelConversation(userId: string): boolean {
    const deleted = this.conversations.delete(userId)
    if (deleted) {
      this.saveToStorage()
      console.log('[Conversation] Manually cancelled for user:', userId)
    }
    return deleted
  }

  /**
   * Detect confirmation in text
   */
  private detectConfirmation(text: string): boolean {
    const confirmationPatterns = [
      /^s[ií]$/,           // sí, si
      /^(ok|okay|vale)$/,  // ok, vale
      /^(claro|perfecto|exacto)$/, // claro, perfecto
      /^(adelante|hazlo|confirmo)$/, // adelante, hazlo
      /^(yes|yep|yeah)$/,  // English
      /^(afirmativo|correcto)$/ // More formal
    ]

    return confirmationPatterns.some(pattern => pattern.test(text))
  }

  /**
   * Detect rejection in text
   */
  private detectRejection(text: string): boolean {
    const rejectionPatterns = [
      /^no$/,
      /^(nop|nope)$/,
      /^(cancela|cancelar|para)$/,
      /^(stop|detente)$/,
      /^(negativo|incorrecto)$/
    ]

    return rejectionPatterns.some(pattern => pattern.test(text))
  }

  /**
   * Cleanup expired conversations
   */
  private cleanupExpired(): void {
    const now = new Date()
    let cleanedCount = 0

    for (const [userId, state] of this.conversations.entries()) {
      if (now > state.expiresAt) {
        this.conversations.delete(userId)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log(`[Conversation] Cleaned up ${cleanedCount} expired conversations`)
      this.saveToStorage()
    }
  }

  /**
   * Save to localStorage (client-side only)
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const data = Array.from(this.conversations.entries()).map(([userId, state]) => ({
        userId,
        state: {
          ...state,
          createdAt: state.createdAt.toISOString(),
          expiresAt: state.expiresAt.toISOString()
        }
      }))
      
      localStorage.setItem('voice_conversations', JSON.stringify(data))
    } catch (error) {
      console.error('[Conversation] Failed to save to storage:', error)
    }
  }

  /**
   * Load from localStorage (client-side only)
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('voice_conversations')
      if (!stored) return

      const data = JSON.parse(stored)
      const now = new Date()

      for (const { userId, state } of data) {
        const parsedState: ConversationState = {
          ...state,
          createdAt: new Date(state.createdAt),
          expiresAt: new Date(state.expiresAt)
        }

        // Only load if not expired
        if (parsedState.expiresAt > now) {
          this.conversations.set(userId, parsedState)
        }
      }

      console.log(`[Conversation] Loaded ${this.conversations.size} active conversations from storage`)
    } catch (error) {
      console.error('[Conversation] Failed to load from storage:', error)
    }
  }

  /**
   * Get all active conversations (for debugging)
   */
  getAllConversations(): ConversationState[] {
    return Array.from(this.conversations.values())
  }
}

// Singleton instance
export const conversationManager = new VoiceConversationManager()

/**
 * React hook for conversation state
 */
export function useVoiceConversation(userId?: string) {
  if (!userId) return null
  return conversationManager.getConversation(userId)
}
