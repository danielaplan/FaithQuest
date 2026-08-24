import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hoverable?: boolean;
}

export default function Card({ children, hoverable = false, className = "", ...props }: CardProps) {
  return (
    <div className={`clay-card${hoverable ? " clay-card-interactive" : ""} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
