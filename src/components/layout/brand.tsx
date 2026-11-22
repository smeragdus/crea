import Image from "next/image";
import Link from "next/link";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return <Link href="/" aria-label="CREA, inicio" className="brand" data-inverse={inverse}>
    <Image src="/crea-logo.png" alt="" width={2172} height={724} />
  </Link>;
}
