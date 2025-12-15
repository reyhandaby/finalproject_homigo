import { cva } from 'class-variance-authority';
import React from 'react';

const button = cva('inline-flex items-center justify-center rounded px-4 py-2 transition-colors', {
  variants: {
    variant: {
      default: 'bg-blue-600 text-white hover:bg-blue-700',
      outline: 'border border-neutral-300 text-neutral-800 hover:bg-neutral-100',
    },
  },
  defaultVariants: { variant: 'default' },
});

export function Button({ children, className, variant = 'default', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' }) {
  return (
    <button className={button({ variant }) + (className ? ' ' + className : '')} {...props}>{children}</button>
  );
}
