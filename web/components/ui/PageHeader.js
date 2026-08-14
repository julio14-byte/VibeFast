import HelpTip from "./HelpTip"

export default function PageHeader({
  title,
  lead,
  tip,
  actions,
}) {
  return (
    <header className="page-header space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <h1 className="page-title">{title}</h1>
          {lead ? <p className="page-lead">{lead}</p> : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
        ) : null}
      </div>
      {tip ? <HelpTip>{tip}</HelpTip> : null}
    </header>
  )
}
