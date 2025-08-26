import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SidebarState {
  collapsedGroups: Record<string, boolean>;
  lastActiveTab: Record<string, string>;
}

const STORAGE_KEY = 'sidebar-state';

export function useSidebarState() {
  const location = useLocation();
  
  const [state, setState] = useState<SidebarState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {
        collapsedGroups: {},
        lastActiveTab: {}
      };
    } catch {
      return {
        collapsedGroups: {},
        lastActiveTab: {}
      };
    }
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Auto-expand groups when a child route is active
  useEffect(() => {
    const path = location.pathname;
    const updates: Record<string, boolean> = {};
    
    // Check if we need to expand any groups based on current route
    if (path.startsWith('/admin/')) {
      updates.admin = false; // expand admin group
    }
    if (path.startsWith('/data/')) {
      updates.data = false; // expand data group
    }
    if (path.startsWith('/reports/')) {
      updates.reports = false; // expand reports group
    }
    if (path.startsWith('/account/')) {
      updates.account = false; // expand account group
    }

    // Only update if there are changes
    const hasChanges = Object.entries(updates).some(
      ([key, value]) => state.collapsedGroups[key] !== value
    );

    if (hasChanges) {
      setState(prev => ({
        ...prev,
        collapsedGroups: {
          ...prev.collapsedGroups,
          ...updates
        }
      }));
    }
  }, [location.pathname, state.collapsedGroups]);

  const toggleGroup = (groupId: string) => {
    setState(prev => ({
      ...prev,
      collapsedGroups: {
        ...prev.collapsedGroups,
        [groupId]: !prev.collapsedGroups[groupId]
      }
    }));
  };

  const isGroupCollapsed = (groupId: string) => {
    return state.collapsedGroups[groupId] ?? false;
  };

  const setLastActiveTab = (section: string, tab: string) => {
    setState(prev => ({
      ...prev,
      lastActiveTab: {
        ...prev.lastActiveTab,
        [section]: tab
      }
    }));
  };

  const getLastActiveTab = (section: string) => {
    return state.lastActiveTab[section];
  };

  return {
    toggleGroup,
    isGroupCollapsed,
    setLastActiveTab,
    getLastActiveTab
  };
}