import PageHeader from "@/components/ui/PageHeader"
import AgentRun from "@/components/ai/AgentRun"

export const metadata = { title: "Asistente · SmartPOS" }

export default function AgentPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <PageHeader
        title="Asistente"
        lead="Te ayuda a hacer tareas paso a paso: buscar productos, registrar ventas o revisar inventario."
        tip="Describe lo que quieres lograr. El asistente te dirá qué va haciendo en cada paso."
      />

      <AgentRun />
    </div>
  )
}
