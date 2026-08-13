import config from "@/config"
import Chat from "@/components/ai/Chat"

export const metadata = { title: "Chat" }

export default function ChatPage() {
  const langGraph = config.features.agents && config.features.toolUse

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <div>
        <h1 className="page-title">Chat con {config.app.name}</h1>
        <p className="page-lead">
          Busca productos, inventario y ventas por chat
          {langGraph ? " con el agente LangGraph." : "."}
        </p>
      </div>

      <Chat langGraph={langGraph} />
    </div>
  )
}
