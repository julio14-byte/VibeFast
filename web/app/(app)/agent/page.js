import config from "@/config"
import AgentRun from "@/components/ai/AgentRun"

export const metadata = { title: "Agente" }

export default function AgentPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <div>
        <h1 className="page-title">Agente de {config.app.name}</h1>
        <p className="page-lead">
          LangGraph decide qué herramientas usar y muestra su razonamiento.
        </p>
      </div>

      <AgentRun />
    </div>
  )
}
