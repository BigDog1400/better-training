"use client";
import { ModeToggle } from "./mode-toggle"
import Link from "next/link"

export default function Header() {
  return (
    <header className="border-b p-4">
      <div className="container mx-auto max-w-3xl flex justify-between items-center">
        <Link href="/" className="font-bold text-xl">
          better-training
        </Link>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
