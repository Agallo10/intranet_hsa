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
  originalName: string
  mimeType: string
  sizeBytes: number
  isPublished: boolean
  cursoId: string | null
  position: number
  createdAt: string
  updatedAt: string
  category: { id: string; name: string; slug: string } | null
  uploadedBy: { id: string; fullName: string } | null
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
