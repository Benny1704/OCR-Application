import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to restore Queue state from navigation
 */
export const useRestoreQueueState = (
  setActiveTab: (tab: "Queued" | "Yet to Review" | "Failed") => void,
  setCurrentPage: (page: number) => void,
  setPageSizes: (pageSizes: Record<string, number>) => void
) => {
  const location = useLocation();

  useEffect(() => {
    const queueState = location.state?.queueState;
    if (queueState) {
      console.log('Restoring queue state:', queueState);
      if (queueState.activeTab) {
        setActiveTab(queueState.activeTab);
      }
      if (queueState.currentPage) {
        setCurrentPage(queueState.currentPage);
      }
      if (queueState.pageSizes) {
        setPageSizes(queueState.pageSizes);
      }
    }
  }, [location.state]);
};

/**
 * Hook to restore Documents state from navigation
 */
export const useRestoreDocumentsState = (
  setCurrentPage: (page: number) => void,
  setPageSize: (size: number) => void
) => {
  const location = useLocation();

  useEffect(() => {
    const documentsState = location.state?.documentsState;
    if (documentsState) {
      console.log('Restoring documents state:', documentsState);
      if (documentsState.currentPage) {
        setCurrentPage(documentsState.currentPage);
      }
      if (documentsState.pageSize) {
        setPageSize(documentsState.pageSize);
      }
    }
  }, [location.state]);
};