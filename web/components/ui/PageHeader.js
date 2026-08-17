import HelpTip from "./HelpTip"

export default function PageHeader({
  title,
  lead,
  tip,
  actions,
}) {
  return (
    <header className="page-header space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="page-title">{title}</h1>
          {lead ? <p className="page-lead">{lead}</p> : null}
        </div>
        {actions ? (
          <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
      {tip ? <HelpTip>{tip}</HelpTip> : null}
    </header>
  )
}
