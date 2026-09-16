import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

export type LoginValues = z.infer<typeof loginSchema>

export const contentSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
  type: z.enum(['video', 'document'], {
    message: 'Seleccione un tipo válido',
  }),
  categoryId: z.string().min(1, 'Seleccione una categoría'),
  isPublished: z.boolean(),
})

export type ContentValues = z.infer<typeof contentSchema>

export const userSchema = z.object({
  username: z
    .string()
    .min(3, 'El usuario debe tener al menos 3 caracteres'),
  fullName: z.string().min(1, 'El nombre es obligatorio'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['admin', 'editor', 'comunicador', 'lector'], {
    message: 'Seleccione un rol válido',
  }),
})

export type UserValues = z.infer<typeof userSchema>

export const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
})

export type CategoryValues = z.infer<typeof categorySchema>

export const noticiaSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  summary: z.string().optional(),
  body: z.string().min(1, 'El contenido es obligatorio'),
})

export type NoticiaValues = z.infer<typeof noticiaSchema>

export const cursoSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
})

export type CursoValues = z.infer<typeof cursoSchema>

export const documentSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
})

export type DocumentValues = z.infer<typeof documentSchema>

export const videoSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
})

export type VideoValues = z.infer<typeof videoSchema>
