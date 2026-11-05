import { useState, type FormEvent } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { errorMessage } from '../../../shared/lib/format'
import { useAuth } from '../AuthProvider'
import { AuthSplit } from '../components/AuthSplit'

const benefits = [
  'Catálogo de donaciones disponibles',
  'Asignación de repartidores',
  'Historial y evidencia de cada entrega',
]

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (!accepted) {
      setError('Debes aceptar los términos y la política de privacidad.')
      return
    }

    setSubmitting(true)
    try {
      await register({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
      })
      navigate('/onboarding', { replace: true })
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthSplit
      image="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80"
      imageAlt="Comida preparada"
      side={
        <>
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-[#f2c879] uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f2c879]" />
            Lo que podrás hacer
          </span>
          <p className="mt-3 font-serif text-[26px] leading-[1.25] tracking-[-0.01em]">
            Publicar excedentes, reservar donaciones y coordinar entregas con trazabilidad.
          </p>
          <ul className="mt-5 grid gap-2.5 text-[12.5px] text-[#ede7d9]">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7fd3a0]" />
                {benefit}
              </li>
            ))}
          </ul>
        </>
      }
    >
      <h1 className="font-serif text-[32px] leading-[1.12] font-medium tracking-[-0.02em] sm:text-[34px]">
        Crea tu cuenta.
      </h1>
      <p className="mt-2 mb-6 text-[13px] text-muted">
        El primer paso para rescatar comida. Luego registrarás tu organización.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-3.5">
        <div className="field">
          <label className="field-label" htmlFor="register-name">
            Nombre completo
          </label>
          <input
            id="register-name"
            className="input"
            required
            maxLength={120}
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Ana Cruz"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="register-email">
            Correo electrónico
          </label>
          <input
            id="register-email"
            className="input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ana@organizacion.org"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="register-phone">
            Teléfono <span className="font-normal text-muted">(opcional)</span>
          </label>
          <input
            id="register-phone"
            className="input"
            type="tel"
            autoComplete="tel"
            maxLength={30}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+51 987 654 321"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="register-password">
            Contraseña
          </label>
          <input
            id="register-password"
            className="input"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 8 caracteres"
          />
          <span className="text-[11.5px] text-muted">Mínimo 8 caracteres.</span>
        </div>

        <label className="check">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
          />
          Acepto los términos y la política de privacidad.
        </label>

        {error ? (
          <div className="rounded-xl border border-red/20 bg-red-100 px-3.5 py-2.5 text-[12px] text-red">
            {error}
          </div>
        ) : null}

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
          {submitting ? null : <ArrowRight className="h-4 w-4" />}
        </button>

        <p className="text-center text-[12.5px] text-muted">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-green hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </AuthSplit>
  )
}
