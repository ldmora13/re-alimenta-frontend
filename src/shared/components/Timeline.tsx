export interface TimelineItem {
  title: string
  subtitle?: string
  time?: string
  body?: string
  state?: 'done' | 'active' | 'todo'
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="timeline">
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} className={`tl ${item.state ?? 'todo'}`}>
          <span className="tl-dot" />
          <div className="tl-t">{item.title}</div>
          {item.subtitle ? <div className="tl-s">{item.subtitle}</div> : null}
          {item.time ? <div className="tl-time">{item.time}</div> : null}
          {item.body ? <div className="tl-body">{item.body}</div> : null}
        </div>
      ))}
    </div>
  )
}
