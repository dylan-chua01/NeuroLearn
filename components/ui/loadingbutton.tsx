"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void | Promise<void>;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
};

export function LoadButton({
  children,
  onClick,
  href,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  disabled = false,
  loading = false,
}: ButtonProps) {
  const router = useRouter();
  const isDisabled = disabled || loading;

  const baseStyles = "rounded-xl font-semibold transition-all flex items-center justify-center";
  const sizeStyles = {
    sm: "px-3 py-1 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  const variantStyles = {
    primary: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow hover:shadow-lg",
    secondary: "bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50",
    ghost: "text-emerald-600 hover:bg-emerald-50",
  };
  const disabledStyles = "opacity-70 cursor-not-allowed";
  const loadingStyles = "cursor-wait";

  const handleClick = async () => {
    if (isDisabled) return;
    
    try {
      if (onClick) await onClick();
      if (href) router.push(href);
    } catch (error) {
      console.error("Button action failed:", error);
    }
  };

  const buttonContent = (
    <>
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </>
  );

  const classNames = [
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    isDisabled ? disabledStyles : "",
    loading ? loadingStyles : "",
    className,
  ].join(" ");

  if (href) {
    return (
      <button
        onClick={handleClick}
        className={classNames}
        type={type}
        disabled={isDisabled}
        aria-disabled={isDisabled}
      >
        {buttonContent}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={classNames}
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled}
    >
      {buttonContent}
    </button>
  );
}