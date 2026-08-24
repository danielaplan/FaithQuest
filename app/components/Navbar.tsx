import Link from "next/link";
import type { ReactNode } from "react";

interface NavbarProps {
  title?: string;
  subtitle?: string;
  links?: Array<{ label: string; href: string }>;
  actions?: ReactNode;
}

export default function Navbar({ title = "FaithQuest", subtitle, links = [], actions }: NavbarProps) {
  return (
    <header className="fq-navbar">
      <div className="fq-navbar-inner">
        <Link href="/" className="fq-navbar-brand">
          <span className="fq-navbar-mark" aria-hidden="true">FQ</span>
          <span><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}</span>
        </Link>
        {links.length > 0 && <nav className="fq-navbar-links" aria-label="Primary navigation">
          {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>}
        {actions && <div className="fq-navbar-actions">{actions}</div>}
      </div>
    </header>
  );
}
