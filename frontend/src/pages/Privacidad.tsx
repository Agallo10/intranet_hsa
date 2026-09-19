import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export function Privacidad() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/login">
          <ArrowLeft className="size-4" />
          Volver al inicio de sesión
        </Link>
      </Button>

      <div className="mb-6 flex items-center gap-3">
        <ShieldCheck className="size-10 text-brand-green" />
        <div>
          <h1 className="text-2xl font-semibold">
            Aviso de privacidad y política de tratamiento de datos
          </h1>
          <p className="text-sm text-muted-foreground">
            [Nombre de la ESE] — Ley 1581 de 2012
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Responsable del tratamiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-foreground/90">
          <p>
            [Nombre de la ESE], identificada con NIT [__________], con domicilio en
            [__________]. Responsable del tratamiento de los datos personales tratados
            en esta intranet.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">2. Datos tratados y finalidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-foreground/90">
          <p>
            La intranet trata los datos de los funcionarios y colaboradores
            (nombre de usuario, nombre completo, rol y registros de acceso) con la
            finalidad de:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Gestionar cuentas de acceso y controlar los permisos según rol.</li>
            <li>Garantizar la seguridad de la información (registro de accesos).</li>
            <li>Facilitar la comunicación institucional y la gestión documental.</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">3. Derechos del titular</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-foreground/90">
          <p>
            Como titular de los datos, puede conocer, actualizar, rectificar y
            solicitar la supresión de sus datos, así como revocar la autorización
            otorgada, a través del canal de contacto:
          </p>
          <p className="font-medium">
            [Correo/canal de contacto del responsable de datos]
          </p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">4. Seguridad y confidencialidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-foreground/90">
          <p>
            Las contraseñas se almacenan cifradas, el acceso se controla por roles y
            se mantiene un registro de accesos. Los datos no se ceden a terceros sin
            autorización previa del titular.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">5. Vigencia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-foreground/90">
          <p>
            Los datos se conservarán durante el tiempo necesario para las finalidades
            descritas y conforme a las Tablas de Retención Documental de la entidad.
          </p>
        </CardContent>
      </Card>

      <Separator className="my-6" />
      <p className="text-xs text-muted-foreground">
        Este documento es una plantilla base. La ESE debe completar los campos entre
        corchetes y validar el texto con su oficina jurídica y el responsable de datos.
      </p>
    </div>
  )
}
