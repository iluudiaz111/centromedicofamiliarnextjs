"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  const closeMenu = () => {
    setIsOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[250px] sm:w-[300px]">
        <div className="flex flex-col space-y-4 py-4">
          <Link href="/servicios" className="px-4 py-2 text-lg hover:bg-gray-100 rounded-md" onClick={closeMenu}>
            Servicios
          </Link>
          <Link href="/especialistas" className="px-4 py-2 text-lg hover:bg-gray-100 rounded-md" onClick={closeMenu}>
            Especialistas
          </Link>
          <Link href="/precios" className="px-4 py-2 text-lg hover:bg-gray-100 rounded-md" onClick={closeMenu}>
            Precios
          </Link>
          <Link href="/citas" className="px-4 py-2 text-lg hover:bg-gray-100 rounded-md" onClick={closeMenu}>
            Citas
          </Link>
          <Link href="/contacto" className="px-4 py-2 text-lg hover:bg-gray-100 rounded-md" onClick={closeMenu}>
            Contacto
          </Link>
          <Link href="/doctor/login" className="px-4 py-2 text-lg hover:bg-gray-100 rounded-md" onClick={closeMenu}>
            Acceso Médicos
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
