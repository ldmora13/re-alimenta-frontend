import { useState, type FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { errorMessage } from '../../../shared/lib/format'
import { useToast } from '../../../shared/components/ToastProvider'
import { useAuth } from '../AuthProvider'
import { AuthSplit } from '../components/AuthSplit'

export function LoginPage() {
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: string } | null)?.from ?? '/panel'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login({ email: email.trim(), password })
      navigate(from, { replace: true })
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthSplit
      image="https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?auto=format&fit=crop&w=1200&q=80"
      imageAlt="Voluntarios preparando alimentos"
      side={
        <>
          <div className="absolute top-9 right-9 grid h-[104px] w-[104px] -rotate-8 place-items-center rounded-full border-[1.5px] border-dashed border-[#f2c879] bg-[rgba(20,28,23,.55)] text-center font-serif text-[26px] leading-none text-[#f2c879]">
            96%
            <small className="mt-1 block font-sans text-[8.5px] leading-tight tracking-[0.08em] uppercase">
              entregas
              <br />
              confirmadas
            </small>
          </div>
          <p className="font-serif text-[26px] leading-[1.25] tracking-[-0.01em]">
            “Antes coordinábamos todo por WhatsApp. Ahora sabemos qué llega, cuándo y a quién.”
          </p>
          <div className="mt-4.5 flex items-center gap-2.5 text-xs text-[#e8e0cf]">
            <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-white/35 bg-amber-100 text-[11px] font-bold text-amber-700">
              AC
            </span>
            <span>
              <b className="text-white">Ana Cruz</b>
              <br />
              Fundación Semillas
            </span>
          </div>
        </>
      }
    >
      <h1 className="font-serif text-[32px] leading-[1.12] font-medium tracking-[-0.02em] sm:text-[34px]">
        Bienvenido de vuelta.
      </h1>
      <p className="mt-2 mb-6 text-[13px] text-muted">
        Ingresa para coordinar tus donaciones y entregas.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-3.5">
        <div className="field">
          <label className="field-label" htmlFor="login-email">
            Correo electrónico
          </label>
          <input
            id="login-email"
            className="input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@organizacion.org"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="login-password">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="login-password"
              className="input pr-11"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted transition hover:text-ink"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-xs">
          <label className="check">
            <input type="checkbox" defaultChecked />
            Recordarme
          </label>
          <button
            type="button"
            className="link"
            onClick={() => showToast('La recuperación de contraseña aún no está disponible.', 'error')}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-red/20 bg-red-100 px-3.5 py-2.5 text-[12px] text-red">
            {error}
          </div>
        ) : null}

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Ingresando…' : 'Iniciar sesión'}
          {submitting ? null : <ArrowRight className="h-4 w-4" />}
        </button>

        <p className="mt-2 text-center text-[12.5px] text-muted">
          ¿Aún no tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-green hover:underline">
            Registra tu organización
          </Link>
        </p>
      </form>
    </AuthSplit>
  )
}
