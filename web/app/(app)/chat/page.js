import config from "@/config"
import PageHeader from "@/components/ui/PageHeader"
import LangGraphChat from "@/components/ai/LangGraphChat"

export const metadata = { title: "Chat · SmartPOS" }

export default function ChatPage() {
  const agentsOn = config.features.agents && config.features.toolUse

  return (
    <div className="chat-page mx-auto flex max-w-3xl flex-col md:block md:space-y-6">
      <div className="shrink-0 space-y-3 pb-3 md:space-y-6 md:pb-0">
        <PageHeader
          title="Pregúntale al chat"
          lead="Busca en tu inventario, agrega productos y registra ventas cuando le pides."
          tip="Escribe abajo o toca un ejemplo. Enter envía el mensaje."
        />

        {!agentsOn && (
          <div role="alert" className="alert alert-warning">
            <span>
              El chat con herramientas está desactivado. Activa{" "}
              <code className="text-xs">features.agents</code> y{" "}
              <code className="text-xs">features.toolUse</code> en config.js y
              configura <code className="text-xs">OPENAI_API_KEY</code>.
            </span>
          </div>
        )}
      </div>

      {agentsOn ? <LangGraphChat /> : null}
    </div>
  )
}
