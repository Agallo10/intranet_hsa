import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, Lock } from 'lucide-react'
import { useAuth } from '../features/auth/AuthContext'
import { getErrorMessage } from '../lib/api'
import { tokenStore } from '../lib/token'
import { loginSchema, type LoginValues } from '../lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sessionExpired] = useState(() => tokenStore.consumeSessionExpired())

  // Si ya había una sesión guardada al entrar al login, ir al inicio.
  const initiallyAuthenticated = useRef(isAuthenticated).current

  const from = (location.state as { from?: { pathname?: string } } | null)?.from
    ?.pathname ?? '/'

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  // Si ya había sesión guardada, no mostrar el login: ir al inicio.
  if (initiallyAuthenticated) {
    return <Navigate to={from} replace />
  }

  async function onSubmit(values: LoginValues) {
    try {
      const user = await login(values.username, values.password)
      navigate(user.mustChangePassword ? '/cambiar-contrasena' : from, {
        replace: true,
      })
    } catch (err) {
      setError('root', { message: getErrorMessage(err) })
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-green via-brand-green-dark to-[#0a5f2c] p-4">
      <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-brand-lime/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 size-[26rem] rounded-full bg-brand-yellow/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 left-1/4 size-64 rounded-full bg-white/10 blur-2xl" />

      <Card className="relative z-10 w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="items-center justify-items-center text-center">
          <img
            src="/logo_hs.png"
            alt="Hospital San Andrés E.S.E"
            className="h-20 w-auto object-contain"
          />
          <CardTitle className="text-2xl">Intranet Hospitalaria</CardTitle>
          <CardDescription>Hospital San Andrés E.S.E</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                autoComplete="username"
                aria-invalid={!!errors.username}
                {...register('username')}
              />
              {errors.username && (
                <p className="text-xs text-destructive">
                  {errors.username.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {sessionExpired && (
              <Alert>
                <AlertCircle className="size-4" />
                <AlertDescription>
                  Tu sesión expiró. Vuelve a iniciar sesión para continuar.
                </AlertDescription>
              </Alert>
            )}

            {errors.root && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{errors.root.message}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              <Lock className="size-4" />
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              <Link to="/privacidad" className="hover:underline">
                Aviso de privacidad y política de tratamiento de datos
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
