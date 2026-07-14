import React, { useState, useEffect, useRef, useMemo } from 'react';

const SearchableSelect = ({
  label,
  name,
  value,
  onChange,
  options = [], // Array of { value, label } if client-side
  required = false,
  error,
  helpText,
  disabled = false,
  className = '',
  placeholder = 'Type to search...',
  async = false,
  onSearch = null, // async callback: (query) => Promise<Array<{value, label}>>
  selectedLabel = '', // Fallback label for display
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [asyncOptions, setAsyncOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // If async and dropdown is closed, fallback to options prop for label resolution
  const activeOptions = (async && isOpen) ? asyncOptions : (options.length > 0 ? options : asyncOptions);

  const selectedOption = useMemo(() => {
    return activeOptions.find((o) => String(o.value) === String(value));
  }, [value, activeOptions]);

  // Sync search text with value prop
  useEffect(() => {
    if (selectedOption) {
      setSearch(selectedOption.label);
    } else if (selectedLabel) {
      setSearch(selectedLabel);
    } else {
      if (!isOpen) {
        setSearch('');
      }
    }
  }, [value, selectedOption, isOpen, selectedLabel]);

  // Load initial async options
  useEffect(() => {
    if (async && onSearch && isOpen && activeOptions.length === 0) {
      loadAsyncOptions('');
    }
  }, [async, onSearch, isOpen]);

  const loadAsyncOptions = async (query) => {
    setLoading(true);
    try {
      const res = await onSearch(query);
      setAsyncOptions(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Reset highlight index when options change
  const filteredOptions = useMemo(() => {
    if (async) return asyncOptions;

    const isSearching = isOpen && search !== (selectedOption?.label || '');
    const query = isSearching ? search.toLowerCase().trim() : '';
    if (!query) return options.slice(0, 30);

    return options
      .filter((opt) => opt.label.toLowerCase().includes(query))
      .slice(0, 30);
  }, [search, options, async, asyncOptions, isOpen, selectedOption]);

  useEffect(() => {
    setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1);
  }, [filteredOptions]);

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        // Reset search to selected label if closed without selecting
        setSearch(selectedOption ? selectedOption.label : '');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedOption]);

  const handleSelect = (option) => {
    onChange({ target: { name, value: option.value } });
    setSearch(option.label);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        setHighlightedIndex((prev) => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        e.preventDefault();
        break;
      case 'ArrowUp':
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        e.preventDefault();
        break;
      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        e.preventDefault();
        break;
      case 'Escape':
        setIsOpen(false);
        setSearch(selectedOption ? selectedOption.label : '');
        inputRef.current?.blur();
        e.preventDefault();
        break;
      default:
        break;
    }
  };

  const hasValue = String(value ?? '').length > 0;

  return (
    <div ref={containerRef} className={`flex flex-col gap-1.5 w-full relative ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-black dark:text-slate-400 uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          disabled={disabled}
          placeholder={placeholder}
          value={search}
          onFocus={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.select(), 50);
          }}
          onChange={(e) => {
            const val = e.target.value;
            setSearch(val);
            if (!isOpen) setIsOpen(true);
            if (val === '') {
              onChange({ target: { name, value: '' } });
            }

            if (async && onSearch) {
              if (debounceRef.current) clearTimeout(debounceRef.current);
              debounceRef.current = setTimeout(() => {
                loadAsyncOptions(val);
              }, 300);
            }
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className={`w-full text-sm outline-none px-4 py-2.5 rounded-lg border-2 text-black dark:text-slate-100 transition-all focus:ring-2 focus:ring-brand-500/30 ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : hasValue
                ? 'border-brand-500/70 bg-brand-50/60 dark:border-brand-500/60 dark:bg-brand-950/25 focus:border-brand-500'
                : 'border-slate-400 bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900/60 focus:border-brand-500'
          }`}
        />
        
        {/* Toggle arrow icon / Spinner */}
        <div 
          onClick={() => {
            if (!disabled) {
              setIsOpen((prev) => !prev);
              inputRef.current?.focus();
            }
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          {loading ? (
            <svg className="animate-spin h-4.5 w-4.5 text-brand-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-60 overflow-y-auto rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl py-1">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-2.5 text-xs text-slate-400">
              {loading ? 'Searching catalog...' : 'No results found'}
            </div>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              const isHighlighted = idx === highlightedIndex;
              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt)}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-brand-500/20 text-brand-700 dark:text-brand-300 font-medium'
                      : isHighlighted
                        ? 'bg-slate-100 dark:bg-zinc-900 text-black dark:text-slate-100'
                        : 'text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  {opt.label}
                </div>
              );
            })
          )}
        </div>
      )}

      {error && <span className="text-xs font-medium text-red-500 mt-0.5">{error}</span>}
      {helpText && !error && (
        <span className="text-[11px] text-black dark:text-slate-400 mt-0.5">{helpText}</span>
      )}
    </div>
  );
};

export default SearchableSelect;
