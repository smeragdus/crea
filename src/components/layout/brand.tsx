import { Utensils } from "lucide-react";
import Link from "next/link";

export function Brand() {
  return <Link href="/" aria-label="CREA, inicio" className="brand"><span className="brand-mark"><Utensils size={19} strokeWidth={1.8} aria-hidden="true" /></span><span>crea<span className="brand-period">.</span></span></Link>;
}
