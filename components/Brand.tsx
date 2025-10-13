// components/Brand.tsx  (copy into BOTH web + admin repos)
import Image from "next/image";
import Link from "next/link";

export default function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} aria-label="RentBack home" className="inline-flex items-center gap-2">
      {/* Shown in light theme */}
      <Image
        src="/logo-wordmark-dark.svg"
        alt="RentBack"
        width={132}
        height={28}
        priority
        className="block dark:hidden h-7 w-auto"
      />
      {/* Shown in dark theme */}
      <Image
        src="/logo-wordmark-light.svg"
        alt="RentBack"
        width={132}
        height={28}
        priority
        className="hidden dark:block h-7 w-auto"
      />
    </Link>
  );
}
