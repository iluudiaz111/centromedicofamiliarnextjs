import { redirect } from "next/navigation"

export default function AgendarCitaRedirect() {
  redirect("/citas?tab=agendar")
}
