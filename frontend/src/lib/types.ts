export type Role = 'admin' | 'editor' | 'comunicador' | 'lector'
export type ContentType = 'video' | 'document'

export type UserDto = {
  id: string
  username: string
  fullName: string
  role: Role
  isActive: boolean
  mustChangePassword: boolean
  createdAt?: string
}

export type CategoryDto = {
  id: string
  name: string
  slug: string
  description: string | null
  order: number
  isActive: boolean
}

export type ContentDto = {
  id: string
  title: string
  description: string | null
  type: ContentType
  originalName: string | null
  mimeType: string | null
  sizeBytes: number | null
  embedUrl: string | null
  isPublished: boolean
  cursoId: string | null
  position: number
  createdAt: string
  updatedAt: string
  category: { id: string; name: string; slug: string } | null
  uploadedBy: { id: string; fullName: string } | null
}

export type NewsCategoryDto = {
  id: string
  name: string
  slug: string
  isActive: boolean
}

export type NoticiaMediaDto = {
  id: string
  type: 'video' | 'audio'
  originalName: string
  mimeType: string
  sizeBytes: number
}

export type NoticiaDto = {
  id: string
  title: string
  summary: string | null
  body: string
  isPublished: boolean
  hasCover: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  category: { id: string; name: string; slug: string } | null
  media?: NoticiaMediaDto[]
  author: { id: string; fullName: string } | null
}

export type CursoDto = {
  id: string
  title: string
  description: string | null
  isPublished: boolean
  videoCount?: number
  createdAt: string
  updatedAt: string
  createdBy: { id: string; fullName: string } | null
}

export type CursoDetalleDto = CursoDto & {
  videos: ContentDto[]
}

export type LoginResponse = {
  accessToken: string
  refreshToken: string
  user: UserDto
}

export type ListResponse<T> = {
  items: T[]
  total: number
  page: number
  limit: number
}

export type AuditLogDto = {
  id: string
  action: string
  userId: string | null
  username: string | null
  details: string | null
  ip: string | null
  userAgent: string | null
  createdAt: string
}

export type ChatUserDto = {
  id: string
  fullName: string
  username: string
  role: Role
}

export type MessageDto = {
  id: string
  senderId: string
  receiverId: string
  content: string | null
  attachmentName: string | null
  attachmentMime: string | null
  attachmentSize: number | null
  isRead: boolean
  createdAt: string
}

export type ConversationDto = {
  user: ChatUserDto
  lastMessage: MessageDto | null
  unreadCount: number
}
