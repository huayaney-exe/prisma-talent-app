import { forwardRef } from 'react'
import clsx from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label} {props.required && <span className="text-pink">*</span>}
        </label>
        <input
          ref={ref}
          className={clsx(
            'w-full px-4 py-2.5 border rounded-lg',
            'focus:ring-2 focus:ring-purple focus:border-purple',
            'transition-colors duration-200',
            'placeholder:text-gray-400',
            error ? 'border-pink bg-pink/5' : 'border-gray-300',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-pink mt-1">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
