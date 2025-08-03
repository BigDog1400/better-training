'use client';
import Link from 'next/link';
import { ModeToggle } from './mode-toggle';

export default function Header() {
  return (
    <header className="border-b p-4">
      <div className="container mx-auto flex max-w-3xl items-center justify-between">
        <Link className="font-bold text-xl" href="/">
          better-training
        </Link>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
