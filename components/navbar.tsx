import Link from "next/link"
import Image from "next/image"
import { MobileMenu } from "@/components/mobile-menu"

export function Navbar() {
  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto py-4 px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo-centro-medico.png"
              alt="Logo Centro Médico Familiar"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
            <span className="text-xl font-bold text-primary">Centro Médico Familiar</span>
          </Link>

          <div className="hidden md:flex space-x-6">
            <Link href="/servicios" className="text-gray-700 hover:text-primary">
              Servicios
            </Link>
            <Link href="/especialistas" className="text-gray-700 hover:text-primary">
              Especialistas
            </Link>
            <Link href="/precios" className="text-gray-700 hover:text-primary">
              Precios
            </Link>
            <Link href="/citas" className="text-gray-700 hover:text-primary">
              Citas
            </Link>
            <Link href="/contacto" className="text-gray-700 hover:text-primary">
              Contacto
            </Link>
            <Link href="/doctor/login" className="text-gray-700 hover:text-primary">
              Acceso Médicos
            </Link>
          </div>

          {/* Menú móvil */}
          <MobileMenu />
        </div>
      </div>
    </nav>
  )
}
