import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export const Card = ({ children, className = "", ...props }: CardProps) => (
  <div {...props} className={`glass p-6 rounded-2xl bg-white/[0.02] border border-white/10 ${className}`}>
    {children}
  </div>
);
