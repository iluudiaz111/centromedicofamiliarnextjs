import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-sky-500">Centro Médico Familiar</h3>
            <p className="text-sm text-gray-600">Brindando atención médica de calidad para toda la familia.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-sky-500">Contacto</h3>
            <address className="not-italic text-sm text-gray-600">
              <p>2 av. 5-08 zona 3</p>
              <p>San Juan Sacatepéquez</p>
              <p className="mt-2">Teléfono: 4644-9158</p>
            </address>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-sky-500">Enlaces</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-600 hover:text-sky-500">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/servicios" className="text-gray-600 hover:text-sky-500">
                  Servicios
                </Link>
              </li>
              <li>
                <Link href="/citas" className="text-gray-600 hover:text-sky-500">
                  Citas
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-gray-600 hover:text-sky-500">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} Centro Médico Familiar. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
