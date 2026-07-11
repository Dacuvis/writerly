import { useEffect, type ReactNode } from "react";

type Props = { title: string; description?: string; children: ReactNode; onClose: () => void };

export default function DialogShell({ title, description, children, onClose }: Props) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return <div className="dialog-backdrop" onMouseDown={onClose}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onMouseDown={(event) => event.stopPropagation()}><header><div><h2 id="dialog-title">{title}</h2>{description && <p>{description}</p>}</div><button className="dialog-close" onClick={onClose} aria-label="Close dialog">×</button></header>{children}</section></div>;
}
