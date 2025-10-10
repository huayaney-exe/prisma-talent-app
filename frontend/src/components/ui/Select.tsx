import { forwardRef } from 'react'
import clsx from 'clsx'
import type { SelectOption } from '@/types'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: SelectOption[]
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label} {props.required && <span className="text-pink">*</span>}
        </label>
        <select
          ref={ref}
          className={clsx(
            'w-full px-4 py-2.5 border rounded-lg',
            'focus:ring-2 focus:ring-purple focus:border-purple',
            'transition-colors duration-200',
            'bg-white',
            error ? 'border-pink bg-pink/5' : 'border-gray-300',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-pink mt-1">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
