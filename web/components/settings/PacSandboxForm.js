import { PAC_PROVIDERS } from "@/lib/pac/sandbox"
import { guardarPacConfig } from "@/app/(app)/settings/actions"

export default function PacSandboxForm({ empresa }) {
  return (
    <section className="rounded-box border border-base-200 bg-base-100 p-4">
      <h2 className="font-semibold mb-1">PAC sandbox (timbrado CFDI)</h2>
      <p className="text-xs text-base-content/60 mb-3">
        Configura el proveedor PAC para timbrar en pruebas. En sandbox se
        simula el timbrado; con credenciales Facturama puedes usar su sandbox
        real.
      </p>
      <form action={guardarPacConfig} className="grid gap-2 sm:grid-cols-2">
        <div className="form-control sm:col-span-2 sm:grid-cols-2 sm:grid gap-2">
          <label className="label py-0" htmlFor="pac-provider">
            <span className="label-text text-xs font-medium">Proveedor PAC</span>
          </label>
          <select
            id="pac-provider"
            name="pac_provider"
            defaultValue={empresa?.pac_provider ?? "sandbox"}
            className="select select-bordered select-sm w-full"
          >
            {PAC_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div className="form-control">
          <label className="label py-0" htmlFor="pac-mode">
            <span className="label-text text-xs font-medium">Modo</span>
          </label>
          <select
            id="pac-mode"
            name="pac_mode"
            defaultValue={empresa?.pac_mode ?? "sandbox"}
            className="select select-bordered select-sm w-full"
          >
            <option value="sandbox">Sandbox (pruebas)</option>
            <option value="production">Producción</option>
          </select>
        </div>
        <div className="form-control sm:col-span-2">
          <label className="label py-0" htmlFor="pac-url">
            <span className="label-text text-xs font-medium">URL sandbox PAC</span>
          </label>
          <input
            id="pac-url"
            name="pac_sandbox_url"
            placeholder="https://sandbox.facturama.mx"
            defaultValue={
              empresa?.pac_sandbox_url ?? "https://sandbox.facturama.mx"
            }
            className="input input-bordered input-sm w-full"
          />
        </div>
        <div className="form-control">
          <label className="label py-0" htmlFor="pac-key">
            <span className="label-text text-xs font-medium">API Key (usuario)</span>
          </label>
          <input
            id="pac-key"
            name="pac_api_key"
            placeholder="API Key"
            defaultValue={empresa?.pac_api_key ?? ""}
            className="input input-bordered input-sm w-full"
          />
        </div>
        <div className="form-control">
          <label className="label py-0" htmlFor="pac-secret">
            <span className="label-text text-xs font-medium">API Secret</span>
          </label>
          <input
            id="pac-secret"
            name="pac_api_secret"
            type="password"
            placeholder="API Secret"
            defaultValue={empresa?.pac_api_secret ?? ""}
            className="input input-bordered input-sm w-full"
          />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="btn btn-primary btn-sm touch-manipulation">
            Guardar PAC
          </button>
        </div>
      </form>
    </section>
  )
}
