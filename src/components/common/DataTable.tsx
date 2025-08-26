import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Undo, Redo, Columns, Rows, Info, Save, Search, ChevronLeft, ChevronRight, SkipBack, SkipForward } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme'; // Assuming path based on your example
import type { DataItem, CellIdentifier, CopiedCell, DataTableProps as OriginalDataTableProps } from '../../interfaces/Types';
import { Popup, JsonPreviewModal, InfoPill, HowToUse } from './Helper';

export interface TableColumnConfig {
  key: string;
  header: string;
  type?: 'string' | 'number' | 'boolean' | 'date';
  width?: string;
  sortable?: boolean;
  editable?: boolean;
  fixed?: boolean;
}

export interface TableConfig {
  columns: TableColumnConfig[];
  fixedColumn?: string; // Override for fixed column
}

export interface DataTableProps extends Omit<OriginalDataTableProps, 'tableData'> {
  tableData: DataItem[];
  tableConfig?: TableConfig;
  renderActionCell?: (row: DataItem, rowIndex: number) => React.ReactNode;
  actionColumnHeader?: string;
  pagination?: {
    enabled: boolean;
    pageSize?: number;
    pageSizeOptions?: number[];
  };
  maxHeight?: string;
}

const DataTable = ({
  tableData,
  tableConfig,
  isEditable = false,
  isSearchable = false,
  renderActionCell,
  actionColumnHeader = 'Action',
  pagination = { enabled: true, pageSize: 5, pageSizeOptions: [5, 10, 25, 50, 100] },
  maxHeight = '100%'
}: DataTableProps) => {
  const { theme } = useTheme();
  const [data, setData] = useState<DataItem[]>(tableData);
  const [history, setHistory] = useState<DataItem[][]>([tableData]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedCells, setSelectedCells] = useState<CellIdentifier[]>([]);
  const [copiedCell, setCopiedCell] = useState<CopiedCell | null>(null);
  const [draggedCell, setDraggedCell] = useState<CellIdentifier | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupData, setPopupData] = useState<DataItem | null>(null);
  const [lastSelected, setLastSelected] = useState<CellIdentifier | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [editingCell, setEditingCell] = useState<CellIdentifier | null>(null);
  const [isJsonPreviewOpen, setIsJsonPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pagination.pageSize || 5);

  useEffect(() => {
    setData(tableData);
    setHistory([tableData]);
    setHistoryIndex(0);
  }, [tableData]);

  // Compute table structure from config or data
  const { fixedHeaderKey, movableHeaders, columnConfig } = useMemo(() => {
    if (tableConfig && tableConfig.columns.length > 0) {
      // Use table configuration
      const fixedCol = tableConfig.fixedColumn || 
        tableConfig.columns.find(col => col.fixed)?.key || 
        tableConfig.columns[0]?.key;
      
      const movableCols = tableConfig.columns
        .filter(col => col.key !== fixedCol && col.key !== 'id')
        .map(col => col.key);
      
      const configMap = tableConfig.columns.reduce((acc, col) => {
        acc[col.key] = col;
        return acc;
      }, {} as Record<string, TableColumnConfig>);
      
      return { 
        fixedHeaderKey: fixedCol, 
        movableHeaders: movableCols, 
        columnConfig: configMap 
      };
    } else {
      // Fallback to dynamic structure from data
      if (!data || data.length === 0) return { fixedHeaderKey: null, movableHeaders: [], columnConfig: {} };
      const allHeaders = Object.keys(data[0]);
      const fixed = allHeaders[0];
      const movable = allHeaders.filter(h => h !== fixed && h !== 'id');
      
      // Create default config
      const configMap = allHeaders.reduce((acc, header) => {
        acc[header] = {
          key: header,
          header: header.replace(/_/g, ' '),
          type: 'string',
          editable: true,
          fixed: header === fixed
        };
        return acc;
      }, {} as Record<string, TableColumnConfig>);
      
      return { fixedHeaderKey: fixed, movableHeaders: movable, columnConfig: configMap };
    }
  }, [data, tableConfig]);

  // Filter data based on search and ensure all configured columns exist
  const processedData = useMemo(() => {
    let processed = data.map((row, index) => {
      // Ensure all configured columns exist in the row
      const processedRow = { ...row, originalIndex: index };
      if (tableConfig) {
        tableConfig.columns.forEach(col => {
          if (!(col.key in processedRow)) {
            processedRow[col.key] = '';
          }
        });
      }
      return processedRow;
    });

    // Apply search filter
    if (isSearchable && searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      processed = processed.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(lowerCaseQuery)
        )
      );
    }

    return processed;
  }, [data, searchQuery, isSearchable, tableConfig]);

  // Pagination calculations
  const totalItems = processedData.length;
  const totalPages = pagination.enabled ? Math.ceil(totalItems / pageSize) : 1;
  const startIndex = pagination.enabled ? (currentPage - 1) * pageSize : 0;
  const endIndex = pagination.enabled ? Math.min(startIndex + pageSize, totalItems) : totalItems;
  const paginatedData = pagination.enabled ? processedData.slice(startIndex, endIndex) : processedData;

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  const updateData = useCallback((newData: DataItem[], newSelectedCells?: CellIdentifier[]) => {
    if (!isEditable) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setData(newData);
    if (newSelectedCells) {
      setSelectedCells(newSelectedCells);
      if (newSelectedCells.length > 0) {
        setLastSelected(newSelectedCells[newSelectedCells.length - 1]);
      } else {
        setLastSelected(null);
      }
    }
  }, [history, historyIndex, isEditable]);

  const undo = useCallback(() => {
    if (!isEditable || historyIndex === 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setData(history[newIndex]);
    setSelectedCells([]);
    setEditingCell(null);
  }, [history, historyIndex, isEditable]);

  const redo = useCallback(() => {
    if (!isEditable || historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setData(history[newIndex]);
    setSelectedCells([]);
    setEditingCell(null);
  }, [history, historyIndex, isEditable]);
  
  const handleCellUpdate = (rowIndex: number, colKey: string, value: any) => {
    if (!isEditable) return;
    // Convert pagination index back to original data index
    const actualRowIndex = pagination.enabled ? startIndex + rowIndex : rowIndex;
    const originalRowIndex = paginatedData[rowIndex]?.originalIndex ?? actualRowIndex;
    
    const newData: DataItem[] = structuredClone(data);
    if (newData[originalRowIndex]) {
      newData[originalRowIndex][colKey] = value;
    }
    updateData(newData, selectedCells);
  };

  const handleCellClick = (rowIndex: number, colKey: string, e: React.MouseEvent) => {
    if (colKey === fixedHeaderKey || editingCell) return;
    const cellIdentifier = { rowIndex, colKey };
    if (e.ctrlKey) {
      setSelectedCells(prev =>
        prev.some(c => c.rowIndex === rowIndex && c.colKey === colKey)
          ? prev.filter(c => !(c.rowIndex === rowIndex && c.colKey === colKey))
          : [...prev, cellIdentifier]
      );
    } else {
      setSelectedCells([cellIdentifier]);
    }
    setLastSelected(cellIdentifier);
  };

  const isSelected = (rowIndex: number, colKey: string) => {
    return selectedCells.some(c => c.rowIndex === rowIndex && c.colKey === colKey);
  };

  const handleSaveChanges = () => {
    setIsJsonPreviewOpen(true);
  };

  const shiftCells = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!isEditable || selectedCells.length === 0) return;
    const newData: DataItem[] = structuredClone(data);
    const newSelectedCells: CellIdentifier[] = [];

    const sortedSelected = [...selectedCells].sort((a, b) => {
      if (direction === 'up') return a.rowIndex - b.rowIndex;
      if (direction === 'down') return b.rowIndex - a.rowIndex;
      const aColIndex = movableHeaders.indexOf(a.colKey);
      const bColIndex = movableHeaders.indexOf(b.colKey);
      if (direction === 'left') return aColIndex - bColIndex;
      if (direction === 'right') return bColIndex - aColIndex;
      return 0;
    });

    sortedSelected.forEach(({ rowIndex, colKey }) => {
      let targetRowIndex = rowIndex, targetColKey = colKey;
      const colIndex = movableHeaders.indexOf(colKey);

      if (direction === 'up') targetRowIndex--;
      if (direction === 'down') targetRowIndex++;
      if (direction === 'left' && colIndex > 0) targetColKey = movableHeaders[colIndex - 1];
      if (direction === 'right' && colIndex < movableHeaders.length - 1) targetColKey = movableHeaders[colIndex + 1];

      const targetExists = targetRowIndex >= 0 && targetRowIndex < data.length && movableHeaders.includes(targetColKey);

      if (targetExists && newData[rowIndex] && newData[targetRowIndex]) {
        [newData[rowIndex][colKey], newData[targetRowIndex][targetColKey]] = [newData[targetRowIndex][targetColKey], newData[rowIndex][colKey]];
      }
    });

    selectedCells.forEach(({ rowIndex, colKey }) => {
      let newRowIndex = rowIndex, newColKey = colKey;
      const colIndex = movableHeaders.indexOf(colKey);
      if (direction === 'up') newRowIndex--;
      if (direction === 'down') newRowIndex++;
      if (direction === 'left' && colIndex > 0) newColKey = movableHeaders[colIndex - 1];
      if (direction === 'right' && colIndex < movableHeaders.length - 1) newColKey = movableHeaders[colIndex + 1];

      const targetExists = newRowIndex >= 0 && newRowIndex < data.length && movableHeaders.includes(newColKey);
      if (targetExists) newSelectedCells.push({ rowIndex: newRowIndex, colKey: newColKey });
      else newSelectedCells.push({ rowIndex, colKey });
    });

    updateData(newData, newSelectedCells);
  }, [data, movableHeaders, selectedCells, updateData, isEditable]);

  const shiftColumnOrRow = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!isEditable || selectedCells.length === 0) return;
    const newData: DataItem[] = structuredClone(data);
    const { rowIndex, colKey } = selectedCells[0];
    let newSelectedCells = [...selectedCells];

    const colIndex = movableHeaders.indexOf(colKey);
    if (direction === 'left' && colIndex > 0) {
      const targetColKey = movableHeaders[colIndex - 1];
      newData.forEach((row) => { [row[colKey], row[targetColKey]] = [row[targetColKey], row[colKey]]; });
      newSelectedCells = selectedCells.map(c => ({ ...c, colKey: targetColKey }));
    } else if (direction === 'right' && colIndex < movableHeaders.length - 1) {
      const targetColKey = movableHeaders[colIndex + 1];
      newData.forEach((row) => { [row[colKey], row[targetColKey]] = [row[targetColKey], row[colKey]]; });
      newSelectedCells = selectedCells.map(c => ({ ...c, colKey: targetColKey }));
    } else if (direction === 'up' && rowIndex > 0) {
      [newData[rowIndex], newData[rowIndex - 1]] = [newData[rowIndex - 1], newData[rowIndex]];
      newSelectedCells = selectedCells.map(c => ({ ...c, rowIndex: rowIndex - 1 }));
    } else if (direction === 'down' && rowIndex < data.length - 1) {
      [newData[rowIndex], newData[rowIndex + 1]] = [newData[rowIndex + 1], newData[rowIndex]];
      newSelectedCells = selectedCells.map(c => ({ ...c, rowIndex: rowIndex + 1 }));
    }

    updateData(newData, newSelectedCells);
  }, [data, movableHeaders, selectedCells, updateData, isEditable]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingCell) return;

      if (isEditable) {
        if (e.ctrlKey && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
        else if (e.ctrlKey && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
        else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
          if (selectedCells.length === 1) {
            const { rowIndex, colKey } = selectedCells[0];
            const actualRowIndex = pagination.enabled ? startIndex + rowIndex : rowIndex;
            const value = data[paginatedData[rowIndex]?.originalIndex ?? actualRowIndex]?.[colKey];
            setCopiedCell({ rowIndex, colKey, value });
          }
        } else if (e.ctrlKey && e.key.toLowerCase() === 'v') {
          if (copiedCell && selectedCells.length === 1) {
            e.preventDefault();
            const targetCell = selectedCells[0];
            if (targetCell.colKey === fixedHeaderKey) return;
            const newData: DataItem[] = structuredClone(data);
            const actualRowIndex = pagination.enabled ? startIndex + targetCell.rowIndex : targetCell.rowIndex;
            const originalRowIndex = paginatedData[targetCell.rowIndex]?.originalIndex ?? actualRowIndex;
            const copiedOriginalIndex = paginatedData[copiedCell.rowIndex]?.originalIndex ?? copiedCell.rowIndex;
            
            if (newData[originalRowIndex] && newData[copiedOriginalIndex]) {
              const targetValue = newData[originalRowIndex][targetCell.colKey];
              newData[originalRowIndex][targetCell.colKey] = copiedCell.value;
              newData[copiedOriginalIndex][copiedCell.colKey] = targetValue;
              updateData(newData, [targetCell]);
              setCopiedCell(null);
            }
          }
        } else if (e.altKey && e.key.startsWith('Arrow')) {
          e.preventDefault();
          const direction = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
          shiftColumnOrRow(direction);
        } else if (e.shiftKey && e.key.startsWith('Arrow')) {
          e.preventDefault();
          const direction = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
          shiftCells(direction);
        }
      }

      if (e.ctrlKey && e.key.startsWith('Arrow')) {
        e.preventDefault();
        if (!lastSelected) return;
        let { rowIndex, colKey } = lastSelected;
        let colIndex = movableHeaders.indexOf(colKey);

        if (e.key === 'ArrowUp' && rowIndex > 0) rowIndex--;
        if (e.key === 'ArrowDown' && rowIndex < paginatedData.length - 1) rowIndex++;
        if (e.key === 'ArrowLeft' && colIndex > 0) colKey = movableHeaders[colIndex - 1];
        if (e.key === 'ArrowRight' && colIndex < movableHeaders.length - 1) colKey = movableHeaders[colIndex + 1];

        const newCell = { rowIndex, colKey };
        setLastSelected(newCell);
        setSelectedCells(prev => {
          const cellExists = prev.some(c => c.rowIndex === newCell.rowIndex && c.colKey === newCell.colKey);
          return cellExists ? prev : [...prev, newCell];
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedCells, copiedCell, data, updateData, shiftCells, shiftColumnOrRow, lastSelected, movableHeaders, fixedHeaderKey, editingCell, isEditable, pagination.enabled, startIndex, paginatedData]);

  const handleDragStart = (rowIndex: number, colKey: string) => {
    if (!isEditable || colKey === fixedHeaderKey) return;
    setDraggedCell({ rowIndex, colKey });
  };

  const handleDrop = (targetRowIndex: number, targetColKey: string) => {
    if (!isEditable || !draggedCell || targetColKey === fixedHeaderKey) return;
    if (draggedCell.rowIndex === targetRowIndex && draggedCell.colKey === targetColKey) return;
    
    const newData: DataItem[] = structuredClone(data);
    const draggedOriginalIndex = paginatedData[draggedCell.rowIndex]?.originalIndex ?? draggedCell.rowIndex;
    const targetOriginalIndex = paginatedData[targetRowIndex]?.originalIndex ?? targetRowIndex;
    
    if (newData[draggedOriginalIndex] && newData[targetOriginalIndex]) {
        [newData[draggedOriginalIndex][draggedCell.colKey], newData[targetOriginalIndex][targetColKey]] =
        [newData[targetOriginalIndex][targetColKey], newData[draggedOriginalIndex][draggedCell.colKey]];
    }
    updateData(newData);
    setDraggedCell(null);
  };

  const openActionPopup = (itemIndex: number) => {
    const originalIndex = paginatedData[itemIndex]?.originalIndex ?? itemIndex;
    const itemForPopup = data[originalIndex];
    if (itemForPopup) {
      setPopupData(itemForPopup);
      setIsPopupOpen(true);
    }
  };

  const selectionInfo = useMemo(() => {
    if (selectedCells.length === 0) return null;
    const pills = [<InfoPill key="count">{selectedCells.length} cell(s) selected</InfoPill>];
    const firstCell = selectedCells[0];
    if (selectedCells.every(c => c.rowIndex === firstCell.rowIndex)) {
      const rowData = paginatedData[firstCell.rowIndex];
      if (rowData && fixedHeaderKey) {
        const rowName = rowData[fixedHeaderKey];
        pills.push(<InfoPill key="row">Row: {rowName}</InfoPill>);
      }
    }
    if (selectedCells.every(c => c.colKey === firstCell.colKey)) {
      const colName = columnConfig[firstCell.colKey]?.header || firstCell.colKey;
      pills.push(<InfoPill key="col">Column: {colName}</InfoPill>);
    }
    return pills;
  }, [selectedCells, paginatedData, fixedHeaderKey, columnConfig]);

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colKey: string) => {
    const { key, shiftKey } = e;
    const value = e.currentTarget.value;
    const maxRow = paginatedData.length - 1;
    const maxCol = movableHeaders.length - 1;

    const move = (direction: 'next' | 'prev' | 'up' | 'down') => {
      let nextRow = rowIndex;
      let nextColIndex = movableHeaders.indexOf(colKey);

      switch (direction) {
        case 'next':
          nextColIndex++;
          if (nextColIndex > maxCol) { nextColIndex = 0; nextRow++; }
          break;
        case 'prev':
          nextColIndex--;
          if (nextColIndex < 0) { nextColIndex = maxCol; nextRow--; }
          break;
        case 'up': nextRow--; break;
        case 'down': nextRow++; break;
      }

      if (nextRow >= 0 && nextRow <= maxRow && nextColIndex >= 0 && nextColIndex <= maxCol) {
        handleCellUpdate(rowIndex, colKey, value);
        setEditingCell({ rowIndex: nextRow, colKey: movableHeaders[nextColIndex] });
      } else {
        handleCellUpdate(rowIndex, colKey, value);
        setEditingCell(null);
      }
    };

    switch (key) {
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        move(shiftKey ? 'prev' : 'next');
        break;
      case 'Escape':
        setEditingCell(null);
        break;
      case 'ArrowUp': e.preventDefault(); move('up'); break;
      case 'ArrowDown': e.preventDefault(); move('down'); break;
    }
  };

  const handleEditBlur = (e: React.FocusEvent<HTMLInputElement>, rowIndex: number, colKey: string) => {
    handleCellUpdate(rowIndex, colKey, e.currentTarget.value);
    setEditingCell(null);
  };

  const renderCellContent = (rowIndex: number, colKey: string) => {
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colKey === colKey;
    const cellValue = paginatedData[rowIndex]?.[colKey];

    if (isEditing) {
      return (
        <input
          type="text"
          defaultValue={cellValue}
          autoFocus
          onKeyDown={(e) => handleEditKeyDown(e, rowIndex, colKey)}
          onBlur={(e) => handleEditBlur(e, rowIndex, colKey)}
          className={`absolute inset-0 w-full h-full p-3 text-sm border-2 border-indigo-500 rounded-md outline-none z-10 ${theme === 'dark' ? 'bg-gray-700 text-gray-100' : 'bg-indigo-50 text-gray-900'}`}
        />
      );
    }
    return cellValue;
  };

  const getColumnHeader = (key: string) => {
    return columnConfig[key]?.header || key.replace(/_/g, ' ');
  };

  const renderPaginationControls = () => {
    if (!pagination.enabled) return null;

    const getPageNumbers = () => {
      const pages = [];
      const showPages = 5;
      let start = Math.max(1, currentPage - Math.floor(showPages / 2));
      let end = Math.min(totalPages, start + showPages - 1);
      
      if (end - start + 1 < showPages) {
        start = Math.max(1, end - showPages + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    };

    return (
      <div className={`flex items-center justify-between gap-4 py-4 px-2 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Showing {startIndex + 1} to {endIndex} of {totalItems} entries
          {searchQuery && ` (filtered from ${data.length} total entries)`}
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Show:
          </div>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className={`px-2 py-1 text-sm rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            {pagination.pageSizeOptions?.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={`p-1 rounded ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              <SkipBack size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`p-1 rounded ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              <ChevronLeft size={16} />
            </button>
            
            {getPageNumbers().map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 text-sm rounded ${
                  page === currentPage
                    ? 'bg-[#7F22FE] text-white'
                    : theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`p-1 rounded ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className={`p-1 rounded ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              <SkipForward size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTable = () => (
    <div className="flex flex-col" style={{ height: maxHeight }}>
      {/* A single scrolling container for the entire table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse select-none">
          <thead>
            <tr className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}>
              {fixedHeaderKey && (
                <th 
                  className={`p-3 font-bold text-left capitalize sticky top-0 left-0 z-30 border-b-2 ${
                    theme === 'dark' ? 'text-gray-200 border-gray-700 bg-gray-700' : 'text-gray-700 border-gray-300 bg-gray-200'
                  }`}
                >
                  {getColumnHeader(fixedHeaderKey)}
                </th>
              )}
              {movableHeaders.map(header => (
                <th 
                  key={header} 
                  className={`p-3 font-semibold text-left capitalize sticky top-0 z-20 border-b-2 ${
                    theme === 'dark' ? 'text-gray-200 border-gray-700 bg-gray-800' : 'text-gray-700 border-gray-200 bg-gray-100'
                  }`}
                >
                  {getColumnHeader(header)}
                </th>
              ))}
              {renderActionCell && (
                <th 
                  className={`p-3 font-semibold text-left sticky top-0 z-20 border-b-2 ${
                    theme === 'dark' ? 'text-gray-200 border-gray-700 bg-gray-800' : 'text-gray-700 border-gray-200 bg-gray-100'
                  }`}
                >
                  {actionColumnHeader}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr key={row.id || rowIndex} className={theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}>
                {fixedHeaderKey && (
                  <td 
                    className={`p-3 border-b font-medium sticky left-0 z-10 ${
                      theme === 'dark' ? 'border-gray-700 bg-gray-900 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-600'
                    }`}
                  >
                    {row[fixedHeaderKey]}
                  </td>
                )}
                {movableHeaders.map(header => (
                  <td 
                    key={header}
                    onDoubleClick={() => isEditable && columnConfig[header]?.editable !== false && setEditingCell({ rowIndex, colKey: header })}
                    onClick={(e) => handleCellClick(rowIndex, header, e)}
                    draggable={isEditable}
                    onDragStart={() => handleDragStart(rowIndex, header)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(rowIndex, header)}
                    className={`relative p-3 border-b transition-all duration-150 ${!isEditable ? 'cursor-default' : 'cursor-pointer'} ${
                      theme === 'dark' ? 'border-gray-700 text-gray-200' : 'border-gray-200 text-gray-800'
                    } ${
                      isSelected(rowIndex, header) ? (theme === 'dark' ? 'bg-indigo-900/60 ring-2 ring-indigo-600' : 'bg-indigo-100 ring-2 ring-indigo-400') : ''
                    }`}
                  >
                    {renderCellContent(rowIndex, header)}
                  </td>
                ))}
                {renderActionCell && (
                  <td className={`p-3 border-b text-center ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    {renderActionCell(row, rowIndex)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="rounded-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="w-full flex justify-between items-center gap-2 flex-wrap">
          {isSearchable && (
            <div className="relative mr-auto">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} size={20} />
              <input
                type="text"
                placeholder="Search table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 pr-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${theme === 'dark' ? 'border-gray-600 bg-gray-800 text-gray-200 placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'}`}
              />
            </div>
          )}
          {isEditable && (
            <div className="flex items-center gap-[1vw] ml-auto">
              <button onClick={handleSaveChanges} className="p-2 rounded-md bg-green-500 text-white hover:bg-green-600 flex items-center gap-2" title="Save Changes">
                <Save size={20} /> Save
              </button>
              <button onClick={undo} disabled={historyIndex === 0} className={`p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`} title="Undo (Ctrl+Z)"><Undo size={20} /></button>
              <button onClick={redo} disabled={historyIndex === history.length - 1} className={`p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`} title="Redo (Ctrl+Y)"><Redo size={20} /></button>
              <div className={`flex items-center border rounded-md ml-4 ${theme === 'dark' ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`} title="Shift Selected Cells (Shift + Arrow)">
                <button onClick={() => shiftCells('left')} className={`p-2 border-r ${theme === 'dark' ? 'border-r-gray-600 hover:bg-gray-700' : 'hover:bg-gray-100'}`}><ArrowLeft size={20} /></button>
                <button onClick={() => shiftCells('up')} className={`p-2 border-r ${theme === 'dark' ? 'border-r-gray-600 hover:bg-gray-700' : 'hover:bg-gray-100'}`}><ArrowUp size={20} /></button>
                <button onClick={() => shiftCells('down')} className={`p-2 border-r ${theme === 'dark' ? 'border-r-gray-600 hover:bg-gray-700' : 'hover:bg-gray-100'}`}><ArrowDown size={20} /></button>
                <button onClick={() => shiftCells('right')} className={`p-2 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}><ArrowRight size={20} /></button>
              </div>
              <div className={`flex items-center border rounded-md ml-2 ${theme === 'dark' ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`} title="Shift Entire Column/Row (Alt + Arrow)">
                <button onClick={() => shiftColumnOrRow('left')} className={`p-2 border-r ${theme === 'dark' ? 'border-r-gray-600 hover:bg-gray-700' : 'hover:bg-gray-100'}`}><Columns size={20} /></button>
                <button onClick={() => shiftColumnOrRow('up')} className={`p-2 border-r ${theme === 'dark' ? 'border-r-gray-600 hover:bg-gray-700' : 'hover:bg-gray-100'}`}><Rows size={20} /></button>
                <button onClick={() => shiftColumnOrRow('down')} className={`p-2 border-r ${theme === 'dark' ? 'border-r-gray-600 hover:bg-gray-700' : 'hover:bg-gray-100'}`}><Rows size={20} /></button>
                <button onClick={() => shiftColumnOrRow('right')} className={`p-2 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}><Columns size={20} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {renderTable()}

      {pagination.enabled && renderPaginationControls()}

      <Popup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} data={popupData} />
      <JsonPreviewModal isOpen={isJsonPreviewOpen} onClose={() => setIsJsonPreviewOpen(false)} data={data} />
      
      {isEditable && (
        <div className={`mt-6 pt-4 border-t flex justify-between items-center ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div>
            {selectionInfo || <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Click a cell to begin selection.</p>}
          </div>
          <div className="relative">
            <button onMouseEnter={() => setShowHelp(true)} onMouseLeave={() => setShowHelp(false)} className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
              <Info size={20} className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} />
            </button>
            {showHelp && <HowToUse />}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;