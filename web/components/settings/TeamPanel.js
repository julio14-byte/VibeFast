"use client"

import { inviteTeamMember, removeTeamMember, cancelTeamInvite } from "@/app/(app)/settings/team-actions"

const ROLE_LABELS = {
  owner: "Dueño",
  admin: "Administrador",
  cajero: "Cajero",
}

export default function TeamPanel({
  members = [],
  invites = [],
  canManage = false,
  userLimit = 1,
  memberCount = 0,
}) {
  if (!canManage && members.length <= 1) return null

  return (
    <section className="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
      <h2 className="text-lg font-bold">Equipo</h2>
      <p className="mt-1 text-sm text-base-content/65">
        Usuarios de tu ferretería comparten catálogo, ventas y clientes.{" "}
        <span className="tabular-nums">
          {memberCount}/{userLimit} usuarios
        </span>
        .
      </p>

      <ul className="mt-4 divide-y divide-base-200 rounded-xl border border-base-200">
        {members.map((m) => (
          <li
            key={m.user_id}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">
                {m.profile?.full_name || m.profile?.email || "Usuario"}
              </p>
              <p className="text-base-content/55 truncate">{m.profile?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-ghost">
                {ROLE_LABELS[m.role] ?? m.role}
              </span>
              {canManage && m.role !== "owner" && (
                <form action={removeTeamMember}>
                  <input type="hidden" name="user_id" value={m.user_id} />
                  <button type="submit" className="btn btn-ghost btn-xs text-error">
                    Quitar
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>

      {invites.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-base-content/70">
            Invitaciones pendientes
          </p>
          <ul className="mt-2 space-y-2">
            {invites.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-base-200/50 px-3 py-2 text-sm"
              >
                <span>{inv.email}</span>
                <div className="flex items-center gap-2">
                  <span className="badge badge-outline badge-sm">
                    {ROLE_LABELS[inv.role] ?? inv.role}
                  </span>
                  {canManage && (
                    <form action={cancelTeamInvite}>
                      <input type="hidden" name="invite_id" value={inv.id} />
                      <button type="submit" className="btn btn-ghost btn-xs">
                        Cancelar
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {canManage && memberCount < userLimit && (
        <form action={inviteTeamMember} className="mt-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <label className="form-control">
              <span className="label-text text-xs">Correo del empleado</span>
              <input
                type="email"
                name="email"
                required
                placeholder="empleado@correo.com"
                className="input input-bordered input-sm w-full"
              />
            </label>
            <label className="form-control">
              <span className="label-text text-xs">Rol</span>
              <select name="role" className="select select-bordered select-sm" defaultValue="cajero">
                <option value="cajero">Cajero</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
            <div className="flex items-end">
              <button type="submit" className="btn btn-primary btn-sm w-full sm:w-auto">
                Invitar
              </button>
            </div>
          </div>
          <p className="text-xs text-base-content/50">
            Si ya tiene cuenta en SmartPOS se agrega al instante. Si no, se une al
            registrarse con ese correo.
          </p>
        </form>
      )}

      {canManage && memberCount >= userLimit && (
        <p className="mt-4 text-sm text-warning">
          Llegaste al límite de usuarios de tu plan. Sube de plan en Facturación para
          invitar más empleados.
        </p>
      )}
    </section>
  )
}
