export default function Card({ media, title, subtitle, actions, footer, children, variant }) {
  return (
    <div className={`card card--${variant || 'default'}`}>
      {media && <div className="card__media">{media}</div>}
      <div className="card__body">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
        {children && <div className="card__content">{children}</div>}
      </div>
      {actions && <div className="card__actions">{actions}</div>}
      {footer && <div className="card__footer">{footer}</div>}
    </div>
  )
}
