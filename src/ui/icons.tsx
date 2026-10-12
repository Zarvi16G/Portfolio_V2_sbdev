// The original icon set (no brand logos): 24x24 grid, round caps and joins.
// Class "f" = soft wine fill, class "dot" = solid fill.
export const ICONS: Record<string, string> = {
  Skills: '<rect class="f" x="3.5" y="3.5" width="17" height="17" rx="4"/><circle class="dot" cx="8.3" cy="8.3" r="1.35"/><circle class="dot" cx="12" cy="12" r="1.35"/><circle class="dot" cx="15.7" cy="15.7" r="1.35"/>',
  Projects: '<path class="f" d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2h8.5A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/><path d="M3 10.5h18"/>',
  Experience: '<rect class="f" x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18"/><path d="M11 12.5v1.5h2v-1.5"/>',
  About: '<circle class="f" cx="12" cy="8.5" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
  Contact: '<rect class="f" x="3" y="5" width="18" height="14" rx="2"/><path d="M3.6 6.6 12 13l8.4-6.4"/>',
  Frontend: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 8.5h18"/><circle class="dot" cx="6" cy="6.3" r=".75"/><circle class="dot" cx="8.4" cy="6.3" r=".75"/><rect class="f" x="6" y="11.2" width="5" height="5.8" rx="1"/><path d="M14 12h4M14 15h4"/>',
  '3D': '<path class="f" d="M12 12 20 7.5v9L12 21z"/><path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
  Backend: '<rect class="f" x="4" y="4" width="16" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="16" height="6.5" rx="1.6"/><circle class="dot" cx="7.5" cy="7.25" r="1"/><circle class="dot" cx="7.5" cy="16.75" r="1"/><path d="M11 7.25h5.5M11 16.75h5.5"/>',
  Data: '<ellipse class="f" cx="12" cy="6" rx="7" ry="2.8"/><path d="M5 6v12c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8V6"/><path d="M5 12c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8"/>',
  AI: '<path class="f" d="M11 3.5c.6 4.1 2.7 6.2 6.8 6.8-4.1.6-6.2 2.7-6.8 6.8-.6-4.1-2.7-6.2-6.8-6.8 4.1-.6 6.2-2.7 6.8-6.8z"/><path d="M18 14.8c.25 1.5 1 2.25 2.5 2.5-1.5.25-2.25 1-2.5 2.5-.25-1.5-1-2.25-2.5-2.5 1.5-.25 2.25-1 2.5-2.5z"/>',
  Tools: '<path class="f" d="M14.6 3.6a4.6 4.6 0 0 0-4.3 6.2L3.9 16.2a2 2 0 0 0 2.8 2.8l6.4-6.4a4.6 4.6 0 0 0 6.2-4.3l-2.7 2.7-2.6-.4-.4-2.6z"/>',
  Code: '<path d="m8.5 7.5-5 4.5 5 4.5M15.5 7.5l5 4.5-5 4.5"/><path class="f" d="m13.4 5-2.8 14"/>',
}

export function Icon({ name, className }: { name: string; className?: string }) {
  return <svg className={`ico${className ? ` ${className}` : ''}`} viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] }} />
}
