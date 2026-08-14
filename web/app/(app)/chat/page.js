import config from "@/config"
import PageHeader from "@/components/ui/PageHeader"
import LangGraphChat from "@/components/ai/LangGraphChat"

export const metadata = { title: "Chat · SmartPOS" }

export default function ChatPage() {
  const agentsOn = config.features.agents && config.features.toolUse

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <PageHeader
        title="Pregúntale al chat"
        lead="Busca en tu inventario, agrega productos y registra ventas cuando le pides."
        tip="Toca un ejemplo abajo o escribe con tus palabras. No necesitas saber de computadoras."
      />

      {!agentsOn ? (
        <div role="alert" className="alert alert-warning">
          <span>
            El chat con herramientas está desactivado. Activa{" "}
            <code className="text-xs">features.agents</code> y{" "}
            <code className="text-xs">features.toolUse</code> en config.js y
            configura <code className="text-xs">OPENAI_API_KEY</code>.
          </span>
        </div>
      ) : (
        <LangGraphChat />
      )}
    </div>
  )
}
