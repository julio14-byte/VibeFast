import config from "@/config"
import Chat from "@/components/ai/Chat"
import PageHeader from "@/components/ui/PageHeader"

export const metadata = { title: "Chat · SmartPOS" }

export default function ChatPage() {
  const langGraph = config.features.agents && config.features.toolUse

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <PageHeader
        title="Pregúntale al chat"
        lead="Escribe con palabras normales, como si le hablaras a un empleado. Ejemplo: «¿Cuánto stock hay del código 1001?»"
        tip="No hace falta saber de computadoras: solo escribe lo que necesitas y espera la respuesta."
      />

      <Chat langGraph={langGraph} />
    </div>
  )
}
