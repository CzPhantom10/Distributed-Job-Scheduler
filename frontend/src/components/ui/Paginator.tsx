import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginatorProps {
  offset: number
  limit: number
  total: number
  onChange: (newOffset: number) => void
}

export default function Paginator({ offset, limit, total, onChange }: PaginatorProps) {
  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(total / limit) || 1

  const handlePrev = () => {
    if (currentPage > 1) {
      onChange((currentPage - 2) * limit)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onChange(currentPage * limit)
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#111827]/40 border-t border-[#1f2937]">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-[#374151] text-xs font-semibold rounded-md text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="relative inline-flex items-center px-4 py-2 border border-[#374151] text-xs font-semibold rounded-md text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-slate-400">
            Showing <span className="font-semibold text-slate-200">{Math.min(offset + 1, total)}</span> to{' '}
            <span className="font-semibold text-slate-200">{Math.min(offset + limit, total)}</span> of{' '}
            <span className="font-semibold text-slate-200">{total}</span> results
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-[#374151] bg-[#1f2937]/50 text-xs font-medium text-slate-400 hover:bg-[#374151]/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="relative inline-flex items-center px-4 py-2 border border-[#374151] bg-[#111827]/40 text-xs font-semibold text-slate-200">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-[#374151] bg-[#1f2937]/50 text-xs font-medium text-slate-400 hover:bg-[#374151]/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
