import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, User } from 'lucide-react';
import { getPatients } from '@/lib/api';
import { getInitials, formatDate } from '@/lib/utils';
import type { Patient } from '@/types';

interface PatientSearchBarProps {
  onSelect: (patient: Patient) => void;
  placeholder?: string;
  className?: string;
}

export default function PatientSearchBar({
  onSelect,
  placeholder = 'Search patients by name...',
  className = '',
}: PatientSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [focused, setFocused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!value.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await getPatients({ search: value });
        setResults(res.patients);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  function handleSelect(patient: Patient) {
    setQuery('');
    setResults([]);
    setFocused(false);
    onSelect(patient);
  }

  const showDropdown = focused && query.trim().length > 0;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 transition-colors"
      />

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-xl z-50 max-h-72 overflow-y-auto">
          {searching ? (
            <div className="px-4 py-3 flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={14} className="animate-spin" />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-4 text-center">
              <User size={18} className="mx-auto text-gray-300 mb-1" />
              <p className="text-sm text-gray-400">No patients found</p>
            </div>
          ) : (
            results.map((patient) => (
              <button
                key={patient.id}
                onClick={() => handleSelect(patient)}
                className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-b-0"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold">
                    {getInitials(patient.firstName, patient.lastName)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    DOB: {formatDate(patient.dateOfBirth)}
                    {patient.phone ? ` · ${patient.phone}` : ''}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
