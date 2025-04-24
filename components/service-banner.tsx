import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface ServiceBannerProps {
  imageSrc: string
  imageAlt: string
  title: string
  description: string
  linkHref: string
  linkText: string
}

export function ServiceBanner({ imageSrc, imageAlt, title, description, linkHref, linkText }: ServiceBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-sky-100">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
          <h3 className="text-xl md:text-2xl font-bold text-sky-700 mb-2">{title}</h3>
          <p className="text-gray-600 mb-4">{description}</p>
          <div>
            <Link href={linkHref}>
              <Button className="bg-sky-500 hover:bg-sky-600">{linkText}</Button>
            </Link>
          </div>
        </div>
        <div className="md:w-1/2 h-48 md:h-auto relative">
          <Image src={imageSrc || "/placeholder.svg"} alt={imageAlt} fill className="object-cover" />
        </div>
      </div>
    </div>
  )
}
