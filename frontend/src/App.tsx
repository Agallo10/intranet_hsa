import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { Login } from './pages/Login'
import { CambiarContrasena } from './pages/CambiarContrasena'
import { Privacidad } from './pages/Privacidad'
import { Noticias } from './pages/Noticias'
import { NoticiaDetalle } from './pages/NoticiaDetalle'
import { NoticiaForm } from './pages/NoticiaForm'
import { Formatos } from './pages/Formatos'
import { Tutoriales } from './pages/Tutoriales'
import { Chat } from './pages/Chat'
import { CursoDetalle } from './pages/CursoDetalle'
import { CursoForm } from './pages/CursoForm'
import { Users } from './pages/admin/Users'
import { Categories } from './pages/admin/Categories'
import { Auditoria } from './pages/admin/Auditoria'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/privacidad" element={<Privacidad />} />
      <Route element={<RequireAuth />}>
        <Route path="cambiar-contrasena" element={<CambiarContrasena />} />
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/noticias" replace />} />

          <Route path="noticias" element={<Noticias />} />
          <Route path="noticias/:id" element={<NoticiaDetalle />} />
          <Route element={<RequireAuth roles={['admin', 'comunicador']} />}>
            <Route path="noticias/nueva" element={<NoticiaForm />} />
            <Route path="noticias/:id/editar" element={<NoticiaForm />} />
          </Route>

          <Route path="formatos" element={<Formatos />} />
          <Route path="chat" element={<Chat />} />

          <Route path="tutoriales" element={<Tutoriales />} />
          <Route path="tutoriales/:id" element={<CursoDetalle />} />
          <Route element={<RequireAuth roles={['admin', 'editor']} />}>
            <Route path="tutoriales/nuevo" element={<CursoForm />} />
            <Route path="tutoriales/:id/editar" element={<CursoForm />} />
          </Route>

          <Route element={<RequireAuth roles={['admin']} />}>
            <Route path="admin/usuarios" element={<Users />} />
            <Route path="admin/categorias" element={<Categories />} />
            <Route path="admin/auditoria" element={<Auditoria />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/noticias" replace />} />
    </Routes>
  )
}
