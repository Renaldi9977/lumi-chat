import { create } from 'zustand';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Right panel
  rightPanelOpen: boolean;
  
  // Modals
  createGroupModalOpen: boolean;
  settingsModalOpen: boolean;
  
  // Sticker picker
  stickerPickerOpen: boolean;
  
  // Search
  searchQuery: string;
  searchResultsOpen: boolean;
  
  // Mobile
  isMobile: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;
  setCreateGroupModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setStickerPickerOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchResultsOpen: (open: boolean) => void;
  setIsMobile: (mobile: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  rightPanelOpen: false,
  createGroupModalOpen: false,
  settingsModalOpen: false,
  stickerPickerOpen: false,
  searchQuery: '',
  searchResultsOpen: false,
  isMobile: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  setRightPanelOpen: (rightPanelOpen) => set({ rightPanelOpen }),

  setCreateGroupModalOpen: (createGroupModalOpen) => set({ createGroupModalOpen }),
  setSettingsModalOpen: (settingsModalOpen) => set({ settingsModalOpen }),

  setStickerPickerOpen: (stickerPickerOpen) => set({ stickerPickerOpen }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchResultsOpen: (searchResultsOpen) => set({ searchResultsOpen }),

  setIsMobile: (isMobile) => set({ isMobile, sidebarOpen: !isMobile })
}));
