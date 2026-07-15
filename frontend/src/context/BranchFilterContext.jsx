import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getBranches } from '../services/branchService';
import { clearAllServiceCaches } from '../services/api';

const BranchFilterContext = createContext(null);

/**
 * BranchFilterProvider — Global state for cross-branch data viewing.
 *
 * Main branch users can select which branch's data to view (or "All Branches").
 * Sub-branch users are locked to their own branch and the selector is hidden.
 */
export const BranchFilterProvider = ({ children }) => {
  const { user, branch } = useAuth();
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchIdState] = useState(() => {
    const stored = localStorage.getItem('primepharm_branch_filter');
    if (stored === 'all') return null; // 'all' means explicitly selected all branches
    return stored ? Number(stored) : null;
  });
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Sync selectedBranchId to localStorage for the API interceptor
  const setSelectedBranchId = (branchId) => {
    setSelectedBranchIdState(branchId);
    if (branchId !== null && branchId !== undefined) {
      localStorage.setItem('primepharm_branch_filter', String(branchId));
    } else {
      localStorage.setItem('primepharm_branch_filter', 'all');
    }
    // Clear all service caches so fresh data is fetched for the new branch
    clearAllServiceCaches();
  };

  // Default to user's main branch if no filter has been stored yet
  useEffect(() => {
    const stored = localStorage.getItem('primepharm_branch_filter');
    if (stored === null && branch) {
      if (branch.is_main && branch.id) {
        setSelectedBranchId(branch.id);
      }
    }
  }, [branch]);

  // Determine if current user is on the main branch
  const isMainBranch = branch?.is_main === true;
  const isPharmacyUser = user?.pharmacy_id !== null && user?.pharmacy_id !== undefined;

  // Load all branches for main branch users
  useEffect(() => {
    if (!isPharmacyUser || !isMainBranch) {
      setBranches([]);
      return;
    }

    let cancelled = false;
    const loadBranches = async () => {
      setLoadingBranches(true);
      try {
        const data = await getBranches();
        if (!cancelled) {
          setBranches(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load branches for selector:', err);
      } finally {
        if (!cancelled) setLoadingBranches(false);
      }
    };

    loadBranches();
    return () => { cancelled = true; };
  }, [isPharmacyUser, isMainBranch, user?.pharmacy_id]);

  /**
   * Get the branch_id query parameter value for API calls.
   * Returns null when "All Branches" is selected (no filter).
   */
  const getBranchFilterParam = useCallback(() => {
    if (!isMainBranch) return null; // Sub-branch users are filtered server-side
    return selectedBranchId; // null = all, number = specific branch
  }, [isMainBranch, selectedBranchId]);

  /**
   * Get display name for the currently selected branch filter.
   */
  const selectedBranchName = selectedBranchId
    ? branches.find(b => b.id === selectedBranchId)?.name || 'Branch'
    : 'All Branches';

  const hasMultipleBranches = branches.length > 1;

  return (
    <BranchFilterContext.Provider value={{
      branches,
      selectedBranchId,
      setSelectedBranchId,
      selectedBranchName,
      isMainBranch,
      isPharmacyUser,
      loadingBranches,
      getBranchFilterParam,
      hasMultipleBranches,
    }}>
      {children}
    </BranchFilterContext.Provider>
  );
};

export const useBranchFilter = () => {
  const context = useContext(BranchFilterContext);
  if (!context) {
    throw new Error('useBranchFilter must be used within a BranchFilterProvider');
  }
  return context;
};
