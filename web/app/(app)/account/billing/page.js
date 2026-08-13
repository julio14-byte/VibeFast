import Link from "next/link"
import config from "@/config"
import { getUser } from "@/lib/supabase/server"
import { getOrganizationForUser } from "@/lib/billing/organization"
import {
  getPlanConfig,
  isSubscriptionActive,
  subscriptionStatusLabel,
} from "@/lib/billing/plans"
import CheckoutButton from "@/components/billing/CheckoutButton"
import BillingPortalButton from "@/components/billing/BillingPortalButton"

export const metadata = { title: "Facturación · SmartPOS" }
export const dynamic = "force-dynamic"

export default async function BillingPage({ searchParams }) {
  const user = await getUser()
  if (!user) {
    return (
      <div className="alert alert-warning">
        <span>
          <Link href="/login" className="link">Inicia sesión</Link> para ver tu plan.
        </span>
      </div>
    )
  }

  const organization = await getOrganizationForUser(user.id)
  const params = await searchParams
  const reason = params?.reason?.toString()
  const checkout = params?.checkout?.toString()
  const upgrade = params?.upgrade?.toString()

  const plan = getPlanConfig(organization?.plan_id ?? "starter")
  const active = organization ? isSubscriptionActive(organization) : false
  const paymentsEnabled = config.features.payments

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">Facturación y plan</h1>
        <p className="page-lead">
          Administra tu suscripción mensual de {config.app.name}.
        </p>
      </div>

      {reason === "subscription" && !active && (
        <div role="alert" className="alert alert-warning">
          <span>
            Tu periodo de prueba terminó o la suscripción no está activa. Elige un
            plan para seguir usando el sistema.
          </span>
        </div>
      )}

      {checkout === "success" && (
        <div role="alert" className="alert alert-success">
          <span>Pago recibido. Tu plan se actualizará en unos segundos.</span>
        </div>
      )}

      {checkout === "cancel" && (
        <div role="alert" className="alert alert-info">
          <span>Checkout cancelado. Puedes intentar de nuevo cuando quieras.</span>
        </div>
      )}

      <section className="rounded-2xl border border-base-200 bg-base-100 p-6 shadow-sm">
        <h2 className="text-lg font-bold">Tu negocio</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-base-content/60">Nombre</dt>
            <dd className="font-medium text-right">{organization?.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-base-content/60">Plan</dt>
            <dd className="font-medium">{plan?.name ?? organization?.plan_id}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-base-content/60">Estado</dt>
            <dd>
              <span
                className={`badge ${
                  active ? "badge-success" : "badge-warning"
                }`}
              >
                {subscriptionStatusLabel(organization?.subscription_status)}
              </span>
            </dd>
          </div>
          {organization?.trial_ends_at && organization.subscription_status === "trialing" && (
            <div className="flex justify-between gap-4">
              <dt className="text-base-content/60">Prueba hasta</dt>
              <dd className="tabular-nums">
                {new Date(organization.trial_ends_at).toLocaleDateString("es-MX")}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-base-content/60">Límite productos</dt>
            <dd className="tabular-nums">{organization?.product_limit ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-base-content/60">Usuarios</dt>
            <dd className="tabular-nums">{organization?.user_limit ?? "—"}</dd>
          </div>
        </dl>

        {paymentsEnabled && (
          <div className="mt-6 flex flex-wrap gap-3">
            {(organization?.plan_id !== "pro" || upgrade === "pro") && (
              <CheckoutButton planId="pro" label="Suscribirse a Pro" />
            )}
            {organization?.stripe_customer_id && <BillingPortalButton />}
          </div>
        )}

        {!paymentsEnabled && (
          <p className="mt-4 text-sm text-base-content/60">
            Activa <code>features.payments</code> y configura Stripe en{" "}
            <code>.env.local</code>.
          </p>
        )}
      </section>

      {active && (
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard" className="btn btn-primary touch-manipulation">
            Ir al dashboard
          </Link>
          <Link href="/productos" className="btn btn-ghost touch-manipulation">
            Productos
          </Link>
        </div>
      )}

      <section className="rounded-xl border border-base-200 bg-base-200/40 p-4 text-sm text-base-content/70">
        <p className="font-medium text-base-content">Fase 1 SaaS</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>14 días de prueba en plan Starter (200 productos).</li>
          <li>Plan Pro: hasta 5.000 productos y facturación completa.</li>
          <li>El cobro es mensual vía Stripe; puedes cancelar desde el portal.</li>
        </ul>
      </section>
    </div>
  )
}
