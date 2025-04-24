"use client"

import { useState, useEffect } from "react"

interface GoogleMapProps {
  address: string
  zoom?: number
  height?: string
}

export function GoogleMap({ address, zoom = 16, height = "400px" }: GoogleMapProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  // Codificar la dirección para la URL
  const encodedAddress = encodeURIComponent(address)

  // URL del mapa de Google
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedAddress}&zoom=${zoom}`

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className="w-full rounded-lg overflow-hidden" style={{ height }}>
      {isLoaded ? (
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Ubicación del Centro Médico Familiar"
          className="rounded-lg"
        ></iframe>
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <p className="text-gray-500">Cargando mapa...</p>
        </div>
      )}
    </div>
  )
}
