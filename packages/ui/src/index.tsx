'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Dialog, Popover, Tabs, Tooltip } from 'radix-ui'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

const buttonVariants = cva('button', {
  variants: {
    variant: {
      primary: 'button-primary',
      secondary: 'button-secondary',
      ghost: 'button-ghost',
      danger: 'button-danger',
    },
    size: {
      default: 'button-default',
      small: 'button-small',
      icon: 'button-icon',
    },
  },
  defaultVariants: { variant: 'primary', size: 'default' },
})

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
)
Button.displayName = 'Button'

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>): React.JSX.Element {
  return <section className={cn('card', className)} {...props} />
}

export function Badge({
  tone = 'violet',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'violet' | 'green' | 'amber' | 'red' | 'neutral'
}): React.JSX.Element {
  return <span className={cn('badge', `badge-${tone}`, className)} {...props} />
}

export const Sheet = Dialog.Root
export const SheetTrigger = Dialog.Trigger
export const SheetClose = Dialog.Close

export function SheetContent({
  children,
  title,
  description,
  className,
}: {
  children: React.ReactNode
  title: string
  description: string
  className?: string
}): React.JSX.Element {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="sheet-overlay" />
      <Dialog.Content className={cn('sheet-content', className)}>
        <Dialog.Title className="sheet-title">{title}</Dialog.Title>
        <Dialog.Description className="sheet-description">
          {description}
        </Dialog.Description>
        {children}
        <Dialog.Close className="sheet-close" aria-label="Close panel">
          ×
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  )
}

export const TabsRoot = Tabs.Root
export const TabsList = Tabs.List
export const TabsTrigger = Tabs.Trigger
export const TabsContent = Tabs.Content

export const PopoverRoot = Popover.Root
export const PopoverTrigger = Popover.Trigger

export function PopoverContent({
  children,
  title,
  className,
}: {
  children: React.ReactNode
  title: string
  className?: string
}): React.JSX.Element {
  return (
    <Popover.Portal>
      <Popover.Content
        aria-label={title}
        className={cn('popover-content', className)}
        side="right"
        align="start"
        sideOffset={10}
        collisionPadding={16}
      >
        <div className="popover-heading">
          <h2>{title}</h2>
          <Popover.Close aria-label="Close concept card">×</Popover.Close>
        </div>
        {children}
        <Popover.Arrow className="popover-arrow" />
      </Popover.Content>
    </Popover.Portal>
  )
}

export function Hint({
  label,
  children,
}: {
  label: string
  children: React.ReactElement
}): React.JSX.Element {
  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="tooltip-content" sideOffset={6}>
            {label}
            <Tooltip.Arrow className="tooltip-arrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
