import { redirect } from "next/navigation"

export default function ConsultarCitaRedirect() {
  redirect("/citas?tab=consultar")
}
