import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../../../shared/components/ui'

export function AuthSplit({
  children,
  image,
  imageAlt,
  side,
}: {
  children: ReactNode
  image: string
  imageAlt: string
  side: ReactNode
}) {
  return (
    <div className="grid min-h-screen bg-cream lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
        <Link to="/" className="mb-10 inline-flex w-fit">
          <Logo />
        </Link>
        <div className="w-full max-w-[380px] self-start">{children}</div>
        
      </div>

      <div className="relative hidden overflow-hidden bg-[linear-gradient(150deg,#244B39,#79876A)] lg:flex lg:items-end lg:p-11">
        <img
          src={image}
          alt={imageAlt}
          className="absolute inset-0 h-full w-full object-cover opacity-80"
          loading="lazy"
          onError={(event) => event.currentTarget.remove()}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,28,23,.05),rgba(20,28,23,.72))]" />
        <div className="relative z-10 max-w-[420px] text-[#fff9ec]">{side}</div>
      </div>
    </div>
  )
}
