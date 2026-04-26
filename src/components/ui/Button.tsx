import React from "react";
import { motion } from "motion/react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
}

export const Button = ({ 
  children, 
  onClick, 
  variant = "primary", 
  className = "", 
  disabled = false, 
  loading = false, 
  type = "button" 
}: ButtonProps) => {
  const variants = {
    primary: "bg-gradient-to-tr from-operarank-accent to-operarank-secondary text-white shadow-[0_10px_30px_rgba(99,102,241,0.3)]",
    secondary: "bg-white/5 border border-white/10 text-white hover:bg-white/10",
    danger: "bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30",
    success: "bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30",
    ghost: "text-white/40 hover:text-white"
  };

  return (
    <motion.button 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`px-6 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale ${variants[variant]} ${className}`}
    >
      {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : children}
    </motion.button>
  );
};
