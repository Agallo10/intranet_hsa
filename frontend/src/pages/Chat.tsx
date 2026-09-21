import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Paperclip, Send, MessageSquare } from 'lucide-react'
import { api } from '../lib/api'
import { authedUrl } from '../lib/token'
import { useAuth } from '../features/auth/AuthContext'
import { useSocket } from '../features/chat/SocketContext'
import type {
  ChatUserDto,
  ConversationDto,
  ListResponse,
  MessageDto,
} from '../lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from 'cn'

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function Chat() {
  const { user } = useAuth()
  const me = user?.id ?? ''
  const { socket, onlineUserIds, typingUserIds, sendTyping } = useSocket()
  const queryClient = useQueryClient()

  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [activeUser, setActiveUser] = useState<ChatUserDto | null>(null)
  const [searchQ, setSearchQ] = useState('')
  const [searching, setSearching] = useState(false)
  const [text, setText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingSentRef = useRef(0)

  const conversationsQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await api.get<ConversationDto[]>('/chat/conversations')
      return res.data
    },
  })

  const usersQuery = useQuery({
    queryKey: ['chat-users', searchQ],
    enabled: searching,
    queryFn: async () => {
      const res = await api.get<ChatUserDto[]>('/chat/users', {
        params: searchQ ? { q: searchQ } : {},
      })
      return res.data
    },
  })

  const messagesQuery = useQuery({
    queryKey: ['chat-messages', activeUserId],
    enabled: !!activeUserId,
    queryFn: async () => {
      const res = await api.get<ListResponse<MessageDto>>(
        `/chat/messages/${activeUserId}`,
        { params: { limit: 100 } },
      )
      return res.data.items
    },
  })

  const sendMutation = useMutation({
    mutationFn: async (form: FormData) => {
      await api.post('/chat/messages', form)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      if (activeUserId) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', activeUserId] })
      }
    },
  })

  async function markRead(otherId: string) {
    await api.post(`/chat/messages/${otherId}/read`).catch(() => undefined)
    queryClient.invalidateQueries({ queryKey: ['conversations'] })
  }

  useEffect(() => {
    if (!socket) return
    const handler = (data: { message: MessageDto }) => {
      const m = data.message
      const related =
        m.senderId === activeUserId || m.receiverId === activeUserId
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      if (related) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', activeUserId] })
        if (m.senderId === activeUserId) {
          markRead(activeUserId)
        }
      }
    }
    socket.on('message', handler)
    return () => {
      socket.off('message', handler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, activeUserId])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messagesQuery.data])

  function selectUser(person: ChatUserDto) {
    setActiveUserId(person.id)
    setActiveUser(person)
    setSearching(false)
    setSearchQ('')
    markRead(person.id)
  }

  function handleTextChange(value: string) {
    setText(value)
    if (activeUserId) {
      const now = Date.now()
      if (now - typingSentRef.current > 2000) {
        typingSentRef.current = now
        sendTyping(activeUserId)
      }
    }
  }

  async function handleSend() {
    const file = fileRef.current?.files?.[0]
    if ((!text.trim() && !file) || !activeUserId) return
    const form = new FormData()
    form.append('receiverId', activeUserId)
    if (text.trim()) form.append('content', text)
    if (file) form.append('file', file)
    setText('')
    if (fileRef.current) fileRef.current.value = ''
    sendMutation.mutate(form)
  }

  const displayedUsers = searching
    ? usersQuery.data ?? []
    : conversationsQuery.data ?? []

  return (
    <div className="flex h-[calc(100vh-7.5rem)] overflow-hidden rounded-lg border bg-card">
      {/* Lista */}
      <div className="flex w-72 shrink-0 flex-col border-r">
        <div className="border-b p-3">
          <Input
            placeholder="Buscar usuario..."
            value={searchQ}
            onChange={(e) => {
              setSearchQ(e.target.value)
              setSearching(true)
            }}
            onFocus={() => setSearching(true)}
          />
          {searching && (
            <button
              className="mt-1 text-xs text-muted-foreground hover:underline"
              onClick={() => {
                setSearching(false)
                setSearchQ('')
              }}
            >
              ← Volver a conversaciones
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {displayedUsers.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <MessageSquare className="mx-auto size-8 opacity-40" />
              <p className="mt-2">
                {searching
                  ? 'No se encontraron usuarios'
                  : 'Sin conversaciones'}
              </p>
            </div>
          )}
          {displayedUsers.map((entry) => {
            const isConversation = !searching
            const person = isConversation
              ? (entry as ConversationDto).user
              : (entry as ChatUserDto)
            const unread = isConversation
              ? (entry as ConversationDto).unreadCount
              : 0
            const online = onlineUserIds.has(person.id)
            return (
              <button
                key={person.id}
                onClick={() => selectUser(person)}
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-muted/50',
                  activeUserId === person.id && 'bg-muted',
                )}
              >
                <div className="relative">
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {person.fullName.charAt(0)}
                  </div>
                  {online && (
                    <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-green-500 ring-2 ring-card" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{person.fullName}</p>
                  {isConversation && (entry as ConversationDto).lastMessage && (
                    <p className="truncate text-xs text-muted-foreground">
                      {(entry as ConversationDto).lastMessage?.content ??
                        'Adjunto'}
                    </p>
                  )}
                </div>
                {unread > 0 && (
                  <Badge className="ml-auto">{unread}</Badge>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Conversación */}
      <div className="flex flex-1 flex-col">
        {!activeUser ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="mx-auto size-10 opacity-40" />
              <p className="mt-2 text-sm">Selecciona una conversación</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <div className="relative">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {activeUser.fullName.charAt(0)}
                </div>
                {onlineUserIds.has(activeUser.id) && (
                  <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-green-500 ring-2 ring-card" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{activeUser.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {typingUserIds.has(activeUser.id)
                    ? 'escribiendo...'
                    : onlineUserIds.has(activeUser.id)
                      ? 'En línea'
                      : 'Desconectado'}
                </p>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto p-4"
            >
              {messagesQuery.data?.map((m) => {
                const mine = m.senderId === me
                return (
                  <div
                    key={m.id}
                    className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[70%] rounded-lg px-3 py-2 text-sm',
                        mine
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground',
                      )}
                    >
                      {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}
                      {m.attachmentName && (
                        <a
                          href={authedUrl(`/api/chat/attachment/${m.id}`)}
                          className="mt-1 flex items-center gap-1.5 underline underline-offset-2"
                        >
                          <Paperclip className="size-3.5" />
                          {m.attachmentName}
                        </a>
                      )}
                      <p
                        className={cn(
                          'mt-1 text-right text-[10px]',
                          mine ? 'text-primary-foreground/70' : 'text-muted-foreground',
                        )}
                      >
                        {timeOf(m.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center gap-2 border-t p-3">
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={() => handleSend()}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileRef.current?.click()}
                aria-label="Adjuntar archivo"
              >
                <Paperclip className="size-4" />
              </Button>
              <Input
                value={text}
                placeholder="Escribe un mensaje..."
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={sendMutation.isPending}
                aria-label="Enviar"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
