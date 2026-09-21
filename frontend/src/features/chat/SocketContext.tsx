import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { io, type Socket } from 'socket.io-client'
import { api } from '../../lib/api'
import { tokenStore } from '../../lib/token'
import { useAuth } from '../auth/AuthContext'

interface SocketContextValue {
  socket: Socket | null
  onlineUserIds: Set<string>
  totalUnread: number
  typingUserIds: Set<string>
  sendTyping: (receiverId: string) => void
  refreshUnread: () => Promise<void>
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined)

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())
  const [totalUnread, setTotalUnread] = useState(0)
  const [typingUserIds, setTypingUserIds] = useState<Set<string>>(new Set())
  const typingTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  )

  useEffect(() => {
    if (!isAuthenticated) return

    const token = tokenStore.getAccessToken()
    const sock = io({ auth: { token } })
    setSocket(sock)

    sock.on('online:init', (data: { userIds: string[] }) => {
      setOnlineUserIds(new Set(data.userIds))
    })
    sock.on('presence', (data: { userId: string; online: boolean }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev)
        if (data.online) next.add(data.userId)
        else next.delete(data.userId)
        return next
      })
    })
    sock.on('unread', (data: { total: number }) => {
      setTotalUnread(data.total)
    })
    sock.on('typing', (data: { senderId: string }) => {
      setTypingUserIds((prev) => new Set(prev).add(data.senderId))
      const prevTimeout = typingTimeouts.current.get(data.senderId)
      if (prevTimeout) clearTimeout(prevTimeout)
      typingTimeouts.current.set(
        data.senderId,
        setTimeout(() => {
          setTypingUserIds((prev) => {
            const next = new Set(prev)
            next.delete(data.senderId)
            return next
          })
        }, 3000),
      )
    })

    api
      .get<{ total: number }>('/chat/unread')
      .then((res) => setTotalUnread(res.data.total))
      .catch(() => undefined)

    return () => {
      sock.disconnect()
      setSocket(null)
      typingTimeouts.current.forEach((t) => clearTimeout(t))
      typingTimeouts.current.clear()
    }
  }, [isAuthenticated])

  const sendTyping = useCallback(
    (receiverId: string) => {
      socket?.emit('typing', { receiverId })
    },
    [socket],
  )

  const refreshUnread = useCallback(async () => {
    try {
      const res = await api.get<{ total: number }>('/chat/unread')
      setTotalUnread(res.data.total)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({
      socket,
      onlineUserIds,
      totalUnread,
      typingUserIds,
      sendTyping,
      refreshUnread,
    }),
    [socket, onlineUserIds, totalUnread, typingUserIds, sendTyping, refreshUnread],
  )

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext)
  if (!ctx) {
    throw new Error('useSocket debe usarse dentro de SocketProvider')
  }
  return ctx
}
