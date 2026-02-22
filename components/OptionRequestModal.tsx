'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface OptionRequestModalProps {
  isOpen: boolean
  eventTitle: string
  onSubmit: (suggestedOption: string) => void
  onClose: () => void
}

export default function OptionRequestModal({
  isOpen,
  eventTitle,
  onSubmit,
  onClose,
}: OptionRequestModalProps) {
  const [value, setValue] = useState('')

  // Reset input when the modal opens for a new event
  useEffect(() => {
    if (isOpen) setValue('')
  }, [isOpen, eventTitle])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Request a pick option</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Enter your preferred selection for{' '}
          <span className="font-semibold text-foreground">{eventTitle}</span>.
          Your pick will show as <span className="text-amber-400 font-semibold">Pending</span> until
          an admin reviews and approves it.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. Verry Elleegant"
            maxLength={200}
            autoFocus
            className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="flex-1 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
