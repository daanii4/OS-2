'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

export type StudentFilterKey = 'all' | 'regression' | 'escalated'

type StudentsHeaderProps = {
  totalCount: number
  filteredCount: number
  activeFilter: StudentFilterKey
  onFilterChange: (filter: StudentFilterKey) => void
  onSearchChange: (query: string) => void
}

const FILTERS: {
  key: StudentFilterKey
  label: string
  dot?: string
}[] = [
  { key: 'all', label: 'All' },
  { key: 'regression', label: 'Regression', dot: '#b45309' },
  { key: 'escalated', label: 'Escalated', dot: '#dc2626' },
]

export function StudentsHeader({
  totalCount,
  filteredCount,
  activeFilter,
  onFilterChange,
  onSearchChange,
}: StudentsHeaderProps) {
  const [searchValue, setSearchValue] = useState('')

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchValue(e.target.value)
    onSearchChange(e.target.value)
  }

  function handleClearSearch() {
    setSearchValue('')
    onSearchChange('')
  }

  const countLabel =
    searchValue || activeFilter !== 'all'
      ? `Showing ${filteredCount} of ${totalCount} students`
      : `${totalCount} students`

  return (
    <div
      className="
      mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3
      border-b border-[rgba(92,107,70,0.12)] pb-5
    "
    >
      <div className="flex flex-col gap-0.5">
        <h1
          className="
          text-[22px] font-normal leading-tight tracking-[-0.01em] text-[#1e2517]
          font-[family-name:var(--font-dm-serif)]
        "
        >
          Students
        </h1>
        <p
          className="
          font-sans text-[12px] font-normal text-[#6e8050]
          transition-all duration-[150ms]
        "
        >
          {countLabel}
        </p>
      </div>

      <div className="flex w-full items-center gap-2 md:w-auto">
        <div className="relative flex flex-1 items-center md:flex-none">
          <Search
            size={14}
            className="
              pointer-events-none absolute left-3 top-1/2 -translate-y-1/2
              flex-shrink-0 text-[#8a9e69]
            "
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search students…"
            aria-label="Search students by name or school"
            className="
              h-[36px] w-full pl-8 pr-8
              rounded-full border border-[rgba(92,107,70,0.18)] bg-[#eef0e8]
              font-sans text-[16px] text-[#1e2517] placeholder:text-[#8a9e69] outline-none
              transition-[width,border-color,box-shadow,background-color]
              duration-[var(--duration-normal,220ms)]
              ease-[cubic-bezier(0.4,0,0.2,1)]
              hover:border-[rgba(92,107,70,0.35)]
              focus:w-full focus:border-[#5C6B46] focus:bg-white
              focus:shadow-[0_0_0_3px_rgba(92,107,70,0.12)]
              md:w-[200px] md:text-[13px] md:focus:w-[240px]
            "
          />
          {searchValue ? (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search"
              className="
                absolute right-3 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center
                text-[#8a9e69] transition-colors duration-[var(--duration-fast,150ms)]
                hover:text-[#5C6B46] focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-[#5C6B46] focus-visible:ring-offset-1
                rounded-full
              "
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                <path
                  d="M1 1l8 8M9 1L1 9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ) : null}
        </div>

        <div
          className="hidden h-5 w-px flex-shrink-0 bg-[rgba(92,107,70,0.15)] md:block"
          aria-hidden="true"
        />

        <div
          className="flex flex-shrink-0 flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Filter students"
        >
          {FILTERS.map(filter => {
            const isActive = activeFilter === filter.key
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => onFilterChange(filter.key)}
                aria-pressed={isActive}
                aria-label={`Filter: ${filter.label}`}
                className={`
                  inline-flex h-[36px] items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5
                  font-sans text-[13px] font-medium outline-none transition-all
                  duration-[var(--duration-fast,150ms)] ease-[cubic-bezier(0.4,0,0.2,1)]
                  focus-visible:ring-2 focus-visible:ring-[#5C6B46] focus-visible:ring-offset-2
                  active:scale-[0.97]
                  ${
                    isActive
                      ? 'border-[#5C6B46] bg-[#5C6B46] text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                      : 'border-[rgba(92,107,70,0.22)] bg-white text-[#3d4c2c] hover:border-[#5C6B46] hover:bg-[#f3f7e8] hover:text-[#5C6B46]'
                  }
                `}
              >
                {filter.dot ? (
                  <span
                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.75)' : filter.dot,
                    }}
                    aria-hidden="true"
                  />
                ) : null}
                {filter.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
