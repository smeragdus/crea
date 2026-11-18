import Link from "next/link";
import { Brand } from "./brand";

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="container-site footer-inner">
      <div className="grid gap-3"><Brand /><p className="text-sm text-muted-foreground">Orientación tributaria para restaurantes de Cajamarca.</p></div>
      <nav aria-label="Enlaces institucionales" className="footer-links">
        <Link href="/comparar">Regímenes</Link>
        <Link href="/negocios?seccion=orientacion">Guías</Link>
        <Link href="/investigacion">Investigación UPN</Link>
        <Link href="/admin">Administración</Link>
      </nav>
    </div>
  </footer>;
}
