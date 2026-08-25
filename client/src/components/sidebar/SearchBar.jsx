import React from 'react'
import { Search, X } from 'lucide-react'

export const SearchBar = ({ searchVal, onSearchChange, placeholder = 'Search or start new chat' }) => {
  return (
    <div
      style={{
        padding: '8px 12px',
        backgroundColor: 'var(--bg-sidebar)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-app)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 12px',
          gap: '10px',
        }}
      >
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          value={searchVal}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-primary)',
          }}
        />
        {searchVal && (
          <button
            onClick={() => onSearchChange('')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 0,
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
