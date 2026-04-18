'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface StudentExportButtonProps {
  studentId: string
  studentName: string
}

export function StudentExportButton({ studentId, studentName }: StudentExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const res = await fetch(`/api/students/${studentId}/export`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safeName = studentName.replace(/\s+/g, '-')
      a.download = `Scholars-OS_${safeName}_History.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`History exported for ${studentName}`)
    } catch {
      toast.error('Export failed — please try again')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-md px-3',
        'border border-olive-600 text-olive-600',
        'font-sans text-xs font-medium',
        'transition-all duration-150',
        'hover:bg-olive-600 hover:text-white',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-600 focus-visible:ring-offset-2',
        'active:scale-[0.98]',
        isExporting && 'cursor-not-allowed opacity-60 hover:bg-transparent hover:text-olive-600'
      )}
    >
      {isExporting ? (
        <>
          <Loader2 size={12} className="animate-spin" aria-hidden="true" />
          <span>Generating…</span>
        </>
      ) : (
        <>
          <FileDown size={12} aria-hidden="true" />
          <span>Export History</span>
        </>
      )}
    </button>
  )
}
