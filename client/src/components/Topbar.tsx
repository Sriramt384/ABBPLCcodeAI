"use client";
import React from "react";
import { motion } from "framer-motion";
import { Terminal } from "lucide-react";

const Button = ({
  children,
  onClick,
  disabled,
  size = "default",
  variant = "default",
  className = "",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

  const sizeClasses = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3 text-sm",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  };

  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    ghost: "text-gray-300 hover:bg-gray-800",
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default function TopBar() {
  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 15 }}
      className="flex items-center justify-between h-16 px-6 bg-neutral-950 border-b border-neutral-800 text-neutral-300 shadow-lg"
    >
      {/* Left Side */}
      <motion.div
        className="flex items-center space-x-3"
        layout
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Logo */}
        <motion.div
          whileHover={{
            rotate: [0, -8, 6, 0],
            scale: 1.1,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 10 }}
          className="flex items-center justify-center"
        >
          <Terminal className="w-7 h-7 text-abb-blue" />
        </motion.div>

        {/* Title */}
        <motion.h1
          layout
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 18 }}
          className="text-xl font-bold tracking-tight "
        >
          ABB – PLC Programming Suite
        </motion.h1>
      </motion.div>

      {/* Right Side */}
      <motion.div
        className="flex items-center space-x-3"
        layout
        transition={{ type: "spring", stiffness: 250, damping: 20 }}
      >
        <motion.div
          whileHover={{ scale: 1.1, backgroundColor: "rgba(59,130,246,0.2)" }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer text-neutral-200"
        >
          Docs
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.1, backgroundColor: "rgba(59,130,246,0.4)" }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer bg-blue-600 text-white shadow-md"
        >
          Launch
        </motion.div>
      </motion.div>
    </motion.header>
  );
}
