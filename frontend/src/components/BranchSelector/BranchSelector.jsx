import { useState, useRef, useEffect } from 'react';
import { useBranchFilter } from '../../context/BranchFilterContext';

/**
 * BranchSelector — Premium dropdown for cross-branch data viewing.
 * Only visible to main branch users. Hidden for sub-branch staff.
 */
const BranchSelector = () => {
  const {
    branches,
    selectedBranchId,
    setSelectedBranchId,
    selectedBranchName,
    isMainBranch,
    isPharmacyUser,
    loadingBranches,
    hasMultipleBranches,
  } = useBranchFilter();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (branchId) => {
    setSelectedBranchId(branchId);
    setIsOpen(false);
  };

  // Don't render for non-pharmacy users, sub-branch users, or if there's only 1 branch
  if (!isPharmacyUser || !isMainBranch || !hasMultipleBranches) return null;

  return (
    <div ref={dropdownRef} style={{ position: 'relative', zIndex: 50 }}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loadingBranches}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '0px',
          border: '1px solid var(--color-border-primary)',
          backgroundColor: selectedBranchId 
            ? 'rgba(var(--brand-rgb, 99, 102, 241), 0.08)' 
            : 'var(--color-surface-secondary)',
          color: selectedBranchId 
            ? 'var(--color-text-brand)' 
            : 'var(--color-text-secondary)',
          fontSize: '12px',
          fontWeight: 600,
          cursor: loadingBranches ? 'wait' : 'pointer',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
          minWidth: '140px',
          justifyContent: 'space-between',
        }}
        onMouseEnter={(e) => {
          if (!loadingBranches) {
            e.currentTarget.style.borderColor = 'var(--color-text-brand)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(var(--brand-rgb, 99, 102, 241), 0.1)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-primary)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '14px' }}>🏢</span>
          {loadingBranches ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '12px', height: '12px', borderRadius: '50%',
                border: '2px solid var(--color-text-tertiary)',
                borderTopColor: 'transparent',
                animation: 'spin 0.6s linear infinite',
              }} />
              Loading...
            </span>
          ) : (
            selectedBranchName
          )}
        </span>
        <span style={{
          fontSize: '8px',
          opacity: 0.6,
          transition: 'transform 0.2s ease',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          ▼
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && !loadingBranches && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: '220px',
            backgroundColor: 'var(--color-surface-primary)',
            border: '1px solid var(--color-border-primary)',
            borderRadius: '0px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            animation: 'branchDropdownIn 0.2s ease',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '10px 14px 8px',
            borderBottom: '1px solid var(--color-border-primary)',
          }}>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-text-tertiary)',
            }}>
              View Branch Data
            </span>
          </div>

          {/* All Branches Option */}
          <button
            onClick={() => handleSelect(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              backgroundColor: selectedBranchId === null
                ? 'var(--color-surface-active)'
                : 'transparent',
              color: selectedBranchId === null
                ? 'var(--color-text-brand)'
                : 'var(--color-text-primary)',
              fontSize: '13px',
              fontWeight: selectedBranchId === null ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              if (selectedBranchId !== null) {
                e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedBranchId !== null) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '16px' }}>🌐</span>
            <span>All Branches</span>
            {selectedBranchId === null && (
              <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--color-text-brand)' }}>✓</span>
            )}
          </button>

          {/* Divider */}
          <div style={{
            height: '1px',
            backgroundColor: 'var(--color-border-primary)',
            margin: '0 10px',
          }} />

          {/* Branch List */}
          <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '4px 0' }}>
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => handleSelect(b.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '9px 14px',
                  border: 'none',
                  backgroundColor: selectedBranchId === b.id
                    ? 'var(--color-surface-active)'
                    : 'transparent',
                  color: selectedBranchId === b.id
                    ? 'var(--color-text-brand)'
                    : 'var(--color-text-primary)',
                  fontSize: '13px',
                  fontWeight: selectedBranchId === b.id ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (selectedBranchId !== b.id) {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedBranchId !== b.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '14px' }}>{b.is_main ? '🏠' : '🏢'}</span>
                <span style={{ flex: 1 }}>{b.name}</span>
                {b.is_main && (
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    Main
                  </span>
                )}
                {selectedBranchId === b.id && (
                  <span style={{ fontSize: '13px', color: 'var(--color-text-brand)' }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dropdown Animation Keyframes */}
      <style>{`
        @keyframes branchDropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default BranchSelector;
