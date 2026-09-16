import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { GraduationCap, PlayCircle, Plus, Search } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../features/auth/AuthContext'
import type { CursoDto } from '../lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export function Tutoriales() {
  const { user } = useAuth()
  const canManage = user?.role === 'admin' || user?.role === 'editor'

  const [q, setQ] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const query = useQuery({
    queryKey: ['courses', { q: searchTerm }],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (searchTerm) params.q = searchTerm
      const res = await api.get<CursoDto[]>('/courses', { params })
      return res.data
    },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tutoriales</h1>
          <p className="text-sm text-muted-foreground">
            Cursos con videos organizados por tema
          </p>
        </div>
        {canManage && (
          <Button asChild>
            <Link to="/tutoriales/nuevo">
              <Plus className="size-4" />
              Crear curso
            </Link>
          </Button>
        )}
      </div>

      <div className="mb-6 flex gap-2">
        <Input
          placeholder="Buscar curso..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setSearchTerm(q)}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setSearchTerm(q)}
        >
          <Search className="size-4" />
        </Button>
      </div>

      {query.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : query.data && query.data.length === 0 ? (
        <Card className="py-16 text-center text-muted-foreground">
          <GraduationCap className="mx-auto size-10 opacity-40" />
          <p className="mt-2 font-medium">No hay cursos</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {query.data?.map((curso) => (
            <Link key={curso.id} to={`/tutoriales/${curso.id}`} className="group">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col gap-2 p-5">
                  <div className="flex items-start justify-between">
                    <GraduationCap className="size-8 text-brand-green" />
                    {!curso.isPublished && (
                      <Badge variant="outline">Borrador</Badge>
                    )}
                  </div>
                  <h2 className="font-semibold">{curso.title}</h2>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {curso.description ?? 'Sin descripción'}
                  </p>
                  <div className="mt-auto flex items-center gap-1.5 text-sm text-muted-foreground">
                    <PlayCircle className="size-4" />
                    {curso.videoCount ?? 0} video{(curso.videoCount ?? 0) === 1 ? '' : 's'}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
