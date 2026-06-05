'use client'

import { ReactNode } from 'react'

interface AuthButtonProps {
  type?: 'button' | 'submit'
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  loadingText?: string
  children: ReactNode
  variant?: 'primary' | 'secondary'
  icon?: ReactNode
  loadingIcon?: ReactNode
}

const defaultLoadingIcon = (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
)

export default function AuthButton({
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  loadingText,
  children,
  variant = 'primary',
  icon,
  loadingIcon = defaultLoadingIcon
}: AuthButtonProps) {
  const baseClasses = "group relative w-full flex justify-center items-center px-6 py-4 text-base font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] min-h-[52px]"

  const variantClasses = {
    primary: "border border-transparent text-white shadow-lg hover:shadow-xl disabled:hover:scale-100 disabled:hover:shadow-lg",
    secondary: "border-2 border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md disabled:hover:scale-100 disabled:hover:shadow-sm"
  }

  const primaryStyle = {
    background: 'linear-gradient(to right, #176daf, #5c9ad2)',
    boxShadow: '0 0 0 3px rgba(23, 109, 175, 0.1)'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${loading ? 'cursor-wait' : ''}`}
      style={variant === 'primary' ? primaryStyle : undefined}
    >
      {/* Background Animation for Primary Button */}
      {variant === 'primary' && !disabled && (
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{background: 'linear-gradient(to right, rgba(254, 152, 19, 0.2), rgba(254, 191, 18, 0.2))'}} />
      )}

      {/* Content */}
      <div className="relative flex items-center justify-center">
        {loading ? (
          <>
            {loadingIcon}
            <span className="truncate ml-1">{loadingText || children}</span>
          </>
        ) : (
          <>
            {icon && (
              <span className="mr-3 flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                {icon}
              </span>
            )}
            <span className="truncate">{children}</span>
          </>
        )}
      </div>

      {/* Subtle shine effect for primary button */}
      {variant === 'primary' && !disabled && !loading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 rounded-xl" />
      )}
    </button>
  )
}