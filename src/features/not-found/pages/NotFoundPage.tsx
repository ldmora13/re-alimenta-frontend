import { Link } from 'react-router-dom'
import { Logo } from '../../../shared/components/ui'

export function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-cream px-6">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="font-serif text-[72px] leading-none text-green">404</div>
        <h1 className="mt-2 font-serif text-[26px] font-medium tracking-[-0.02em]">
          Esta página no existe.
        </h1>
        <p className="mt-2 text-[13px] text-muted">
          Puede que el enlace esté roto o que la donación ya no esté disponible.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/panel" className="btn btn-primary btn-sm">
            Ir a mi panel
          </Link>
          <Link to="/donaciones" className="btn btn-secondary btn-sm">
            Ver donaciones
          </Link>
        </div>
      </div>
    </div>
  )
}
