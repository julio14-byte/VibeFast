"use client"

import Link from "next/link"
import config from "@/config"
import Logo from "@/components/Logo"
import { useAppNavClick } from "./useAppNavClick"

export default function AppHeaderBrand() {
  const onClick = useAppNavClick("/dashboard")

  return (
    <Link
      href="/dashboard"
      onClick={onClick}
      className="flex min-w-0 flex-1 items-center gap-2 font-bold touch-manipulation"
    >
      <Logo className="size-7 shrink-0" />
      <span className="truncate text-sm sm:text-base">
        {config.brand.logoText}
      </span>
    </Link>
  )
}
