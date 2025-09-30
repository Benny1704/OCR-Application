import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Undo, Redo, Info, Search, ChevronLeft, ChevronRight, SkipBack, SkipForward, Plus } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { DataItem, CellIdentifier, CopiedCell, DataTableProps as OriginalDataTableProps, Pagination as PaginationInfo, TableConfig, TableColumnConfig } from '../../interfaces/Types';
import { Popup, InfoPill, HowToUse, formatIndianCurrency } from './Helper';
import { tableBodyVariants, tableRowVariants } from './Animation';
import { NoDataDisplay } from './Helper';

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
    isLoading?: boolean;
    onDataChange?: (data: DataItem[]) => void;
    onValidationChange?: (hasErrors: boolean) => void;
    onUnsavedRowsChange?: (hasUnsavedRows: boolean) => void;
    paginationInfo?: PaginationInfo;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    onSearch?: (query: string) => void;
}

type ProcessedDataItem = DataItem & {
    sno: number;
    originalIndex: number;
};

type ValidationErrors = Record<number, Record<string, string | null>>;

// Type conversion utility functions
const canConvertValue = (value: any, targetType: string): boolean => {
    if (value === null || value === undefined || value === '') return true;

    const stringValue = String(value).trim();

    switch (targetType) {
        case 'number':
            return !isNaN(Number(stringValue)) && stringValue !== '';
        case 'boolean':
            const lowerValue = stringValue.toLowerCase();
            return ['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'].includes(lowerValue);
        case 'date':
            return !isNaN(Date.parse(stringValue)) || /^\d{4}-\d{2}-\d{2}$/.test(stringValue);
        case 'string':
            return true;
        default:
            return true;
    }
};

const convertValue = (value: any, targetType: string): any => {
    if (value === null || value === undefined || value === '') return '';

    const stringValue = String(value).trim();

    switch (targetType) {
        case 'number':
            if (isNaN(Number(stringValue)) || stringValue === '') {
                return value;
            }
            return Number(stringValue);
        case 'boolean':
            const lowerValue = stringValue.toLowerCase();
            return ['true', '1', 'yes', 'on'].includes(lowerValue);
        case 'date':
            if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) return stringValue;
            const date = new Date(stringValue);
            if (isNaN(date.getTime())) {
                return value;
            }
            return date.toISOString().split('T')[0];
        case 'string':
            return stringValue;
        default:
            return value;
    }
};

const DataTable = ({
    tableData,
    tableConfig,
    isEditable = false,
    isSearchable = false,
    renderActionCell,
    actionColumnHeader = 'Action',
    pagination = { enabled: true, pageSize: 5, pageSizeOptions: [5, 10, 25, 50, 100] },
    maxHeight = '100%',
    isLoading = false,
    onDataChange,
    onValidationChange,
    onUnsavedRowsChange,
    paginationInfo,
    onPageChange,
    onPageSizeChange,
}: DataTableProps) => {
    const { theme } = useTheme();
    const [history, setHistory] = useState<DataItem[][]>([tableData]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [currentView, setCurrentView] = useState<DataItem[]>(tableData);
    const [selectedCells, setSelectedCells] = useState<CellIdentifier[]>([]);
    const [copiedCell, setCopiedCell] = useState<CopiedCell | null>(null);
    const [draggedCell, setDraggedCell] = useState<CellIdentifier | null>(null);
    const [lastSelected, setLastSelected] = useState<CellIdentifier | null>(null);
    const [showHelp, setShowHelp] = useState(false);
    const [editingCell, setEditingCell] = useState<CellIdentifier | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(pagination.pageSize || 5);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [dragOverCell, setDragOverCell] = useState<CellIdentifier | null>(null);
    const helpRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setCurrentView(tableData);
    }, [tableData]);
    
    // Close help tooltip when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
                setShowHelp(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const { fixedHeaderKey, movableHeaders, columnConfig } = useMemo(() => {
        const snoColumn: TableColumnConfig = {
            key: 'sno',
            label: 'S.No.',
            type: 'number',
            isEditable: false,
            fixed: true,
        };

        let finalColumns: TableColumnConfig[];
        const data = tableData || currentView;

        if (tableConfig && tableConfig.columns.length > 0) {
            const userColumns = tableConfig.columns.filter(col => col.key !== 'sno');
            finalColumns = [snoColumn, ...userColumns];
        } else if (data.length > 0) {
            const allHeaders = Object.keys(data[0]).filter(h => h !== 'sno' && h !== 'id');
            const derivedColumns = allHeaders.map(label => ({
                key: label,
                label: label.replace(/_/g, ' '),
                type: 'string' as const,
                isEditable: true,
                fixed: false,
            }));
            finalColumns = [snoColumn, ...derivedColumns];
        } else {
            finalColumns = [snoColumn];
        }

        const fixedKey = 'sno';
        const movable = finalColumns.filter(col => col.key !== fixedKey).map(col => col.key);
        const configMap = finalColumns.reduce((acc, col) => {
            acc[col.key] = col;
            return acc;
        }, {} as Record<string, TableColumnConfig>);

        return {
            fixedHeaderKey: fixedKey,
            movableHeaders: movable,
            columnConfig: configMap
        };
    }, [currentView, tableConfig, tableData]);

    const finalCurrentPage = paginationInfo ? paginationInfo.page : currentPage;

    const processedData: ProcessedDataItem[] = useMemo(() => {
        const dataToProcess = tableData;

        let processed: ProcessedDataItem[] = dataToProcess.map((row, index) => {
            const processedRow: ProcessedDataItem = {
                ...row,
                sno: paginationInfo ? (finalCurrentPage - 1) * pageSize + index + 1 : index + 1,
                originalIndex: index
            };
            if (tableConfig) {
                tableConfig.columns.forEach(col => {
                    if (!(col.key in processedRow)) {
                        (processedRow as any)[col.key] = '';
                    }
                });
            }
            return processedRow;
        });

        if (isSearchable && searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            processed = processed.filter(row =>
                Object.values(row).some(value =>
                    String(value).toLowerCase().includes(lowerCaseQuery)
                )
            );
        }

        return processed;
    }, [tableData, searchQuery, isSearchable, tableConfig, finalCurrentPage, pageSize, paginationInfo]);

    const totalItems = paginationInfo ? paginationInfo.total_items : processedData.length;
    const totalPages = paginationInfo ? paginationInfo.total_pages : Math.ceil(totalItems / pageSize);

    const paginatedData = useMemo(() => {
        if (pagination.enabled && !paginationInfo) {
            const startIndex = (finalCurrentPage - 1) * pageSize;
            return processedData.slice(startIndex, startIndex + pageSize);
        }
        return processedData;
    }, [processedData, pagination.enabled, paginationInfo, finalCurrentPage, pageSize]);

    const startIndex = (finalCurrentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + paginatedData.length, totalItems);

    useEffect(() => {
        if (!paginationInfo) {
            setCurrentPage(1);
        }
    }, [searchQuery, pageSize, paginationInfo]);

    const validateCell = useCallback((value: any, colKey: string): string | null => {
        const config = columnConfig[colKey];
        if (!config) return null;

        if (config.isRequired && (value === null || value === undefined || String(value).trim() === '')) {
            return `${config.label} is required.`;
        }

        if (value !== null && value !== undefined && String(value).trim() !== '') {
            if (!canConvertValue(value, config.type || 'string')) {
                return `Invalid value. ${config.label} must be a ${config.type}.`;
            }
            if (config.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
                return `Invalid date format for ${config.label}. Use YYYY-MM-DD.`;
            }
        }

        return null;
    }, [columnConfig]);

    const hasBlockingErrors = useMemo(() => {
        return Object.values(validationErrors).some(rowErrors =>
            Object.values(rowErrors).some(error => error !== null)
        );
    }, [validationErrors]);

    // Check if a row has unsaved changes (new row not yet saved to backend)
    const hasUnsavedRows = useMemo(() => {
        return tableData.some(row => {
            // Check if row is new (has temporary ID or no item_id)
            const isNewRow = !row.item_id || (typeof row.id === 'string' && row.id.startsWith('new-'));
            return isNewRow;
        });
    }, [tableData]);

    // Check if a specific row has incomplete mandatory fields
    const hasIncompleteMandatoryFields = useCallback((row: DataItem): boolean => {
        const requiredColumns = Object.values(columnConfig).filter(col => col.isRequired && col.key !== 'sno');
        return requiredColumns.some(col => {
            const value = row[col.key];
            return value === null || value === undefined || String(value).trim() === '';
        });
    }, [columnConfig]);

    useEffect(() => {
        if (onValidationChange) {
            onValidationChange(hasBlockingErrors);
        }
    }, [hasBlockingErrors, onValidationChange]);

    // Notify parent component about unsaved rows
    useEffect(() => {
        if (onUnsavedRowsChange) {
            onUnsavedRowsChange(hasUnsavedRows);
        }
    }, [hasUnsavedRows, onUnsavedRowsChange]);

    const updateData = useCallback((newData: DataItem[], newSelectedCells?: CellIdentifier[]) => {
        if (!isEditable || !onDataChange) return;
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newData);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setCurrentView(newData);
        onDataChange(newData);
        if (newSelectedCells) {
            setSelectedCells(newSelectedCells);
            if (newSelectedCells.length > 0) {
                setLastSelected(newSelectedCells[newSelectedCells.length - 1]);
            } else {
                setLastSelected(null);
            }
        }
    }, [history, historyIndex, isEditable, onDataChange]);

    const undo = useCallback(() => {
        if (!isEditable || historyIndex === 0 || !onDataChange) return;
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentView(history[newIndex]);
        onDataChange(history[newIndex]);
        setSelectedCells([]);
        setEditingCell(null);
    }, [history, historyIndex, isEditable, onDataChange]);

    const redo = useCallback(() => {
        if (!isEditable || historyIndex >= history.length - 1 || !onDataChange) return;
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentView(history[newIndex]);
        onDataChange(history[newIndex]);
        setSelectedCells([]);
        setEditingCell(null);
    }, [history, historyIndex, isEditable, onDataChange]);

    const handleAddRow = useCallback(() => {
        if (!isEditable) return;

        const newRow: DataItem = {
            id: `new-${Date.now()}`
        };

        Object.values(columnConfig).forEach(col => {
            if (col.key !== 'sno') {
                switch (col.type) {
                    case 'number': newRow[col.key] = 0; break;
                    case 'boolean': newRow[col.key] = false; break;
                    case 'date': newRow[col.key] = new Date().toISOString().split('T')[0]; break;
                    default: newRow[col.key] = '';
                }
            }
        });

        const originalIndex = tableData.length;
        const newValidationErrors: ValidationErrors = { ...validationErrors };
        newValidationErrors[originalIndex] = {};
        Object.values(columnConfig).forEach(col => {
            if (col.key !== 'sno') {
                newValidationErrors[originalIndex][col.key] = validateCell(newRow[col.key], col.key);
            }
        });
        setValidationErrors(newValidationErrors);

        const newData = [...tableData, newRow];
        updateData(newData);

        if (pagination.enabled) {
            const newTotalPages = Math.ceil(newData.length / pageSize);
            if (paginationInfo && onPageChange) {
                onPageChange(newTotalPages);
            } else {
                setCurrentPage(newTotalPages);
            }
        }

        const firstEditableCol = movableHeaders.find(h => columnConfig[h]?.isEditable !== false);
        if (firstEditableCol) {
            const newRowIndexOnPage = (newData.length - 1) % pageSize;
            setEditingCell({
                rowIndex: newRowIndexOnPage,
                colKey: firstEditableCol,
            });
        }
    }, [isEditable, columnConfig, tableData, updateData, pagination.enabled, pageSize, movableHeaders, paginationInfo, onPageChange, validateCell, validationErrors]);

    const handleCellUpdate = (rowIndex: number, colKey: string, value: any) => {
        if (!isEditable) return;
        const originalRowIndex = paginatedData[rowIndex]?.originalIndex;
        if (originalRowIndex === undefined) return;

        const targetType = columnConfig[colKey]?.type || 'string';
        let finalValue = value;

        if (canConvertValue(value, targetType)) {
            finalValue = convertValue(value, targetType);
        }

        const error = validateCell(finalValue, colKey);

        setValidationErrors(prev => {
            const newErrors = { ...prev };
            if (!newErrors[originalRowIndex]) newErrors[originalRowIndex] = {};
            newErrors[originalRowIndex][colKey] = error;
            return newErrors;
        });

        const newData: DataItem[] = structuredClone(tableData);
        if (newData[originalRowIndex]) {
            newData[originalRowIndex][colKey] = finalValue;
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

    const shiftCells = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
        if (!isEditable || selectedCells.length === 0) return;
        const newData: DataItem[] = structuredClone(tableData);
        const newSelectedCells: CellIdentifier[] = [];
        const newValidationErrors = { ...validationErrors };

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

            const targetExists = targetRowIndex >= 0 && targetRowIndex < paginatedData.length && movableHeaders.includes(targetColKey);
            if (targetExists) {
                const sourceOriginalIndex = paginatedData[rowIndex].originalIndex;
                const targetOriginalIndex = paginatedData[targetRowIndex].originalIndex;

                if (newData[sourceOriginalIndex] && newData[targetOriginalIndex]) {
                    const sourceValue = newData[sourceOriginalIndex][colKey];
                    const targetValue = newData[targetOriginalIndex][targetColKey];
                    const sourceType = columnConfig[colKey]?.type || 'string';
                    const targetType = columnConfig[targetColKey]?.type || 'string';

                    let valueForTarget = sourceValue;
                    if (sourceType !== targetType) {
                        valueForTarget = convertValue(sourceValue, targetType);
                    }
                    let valueForSource = targetValue;
                    if (targetType !== sourceType) {
                        valueForSource = convertValue(targetValue, sourceType);
                    }

                    newData[sourceOriginalIndex][colKey] = valueForSource;
                    newData[targetOriginalIndex][targetColKey] = valueForTarget;

                    const sourceError = validateCell(valueForSource, colKey);
                    const targetError = validateCell(valueForTarget, targetColKey);

                    if (!newValidationErrors[sourceOriginalIndex]) newValidationErrors[sourceOriginalIndex] = {};
                    newValidationErrors[sourceOriginalIndex][colKey] = sourceError;

                    if (!newValidationErrors[targetOriginalIndex]) newValidationErrors[targetOriginalIndex] = {};
                    newValidationErrors[targetOriginalIndex][targetColKey] = targetError;
                }
            }
        });

        selectedCells.forEach(({ rowIndex, colKey }) => {
            let newRowIndex = rowIndex, newColKey = colKey;
            const colIndex = movableHeaders.indexOf(colKey);
            if (direction === 'up') newRowIndex--;
            if (direction === 'down') newRowIndex++;
            if (direction === 'left' && colIndex > 0) newColKey = movableHeaders[colIndex - 1];
            if (direction === 'right' && colIndex < movableHeaders.length - 1) newColKey = movableHeaders[colIndex + 1];

            const targetExists = newRowIndex >= 0 && newRowIndex < paginatedData.length && movableHeaders.includes(newColKey);
            if (targetExists) newSelectedCells.push({ rowIndex: newRowIndex, colKey: newColKey });
            else newSelectedCells.push({ rowIndex, colKey });
        });

        setValidationErrors(newValidationErrors);
        updateData(newData, newSelectedCells);
    }, [tableData, movableHeaders, selectedCells, updateData, isEditable, paginatedData, columnConfig, validationErrors, validateCell]);

    const shiftColumnOrRow = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
        if (!isEditable || selectedCells.length === 0) return;

        const { rowIndex, colKey } = selectedCells[0];
        const originalRowIndex = paginatedData[rowIndex]?.originalIndex;
        if (originalRowIndex === undefined) return;

        const newData: DataItem[] = structuredClone(tableData);
        let newSelectedCells = [...selectedCells];

        const colIndex = movableHeaders.indexOf(colKey);
        if (direction === 'left' && colIndex > 0) {
            const targetColKey = movableHeaders[colIndex - 1];
            if (columnConfig[colKey]?.type !== columnConfig[targetColKey]?.type) return;
            newData.forEach((row) => { [row[colKey], row[targetColKey]] = [row[targetColKey], row[colKey]]; });
            newSelectedCells = selectedCells.map(c => ({ ...c, colKey: targetColKey }));
        } else if (direction === 'right' && colIndex < movableHeaders.length - 1) {
            const targetColKey = movableHeaders[colIndex + 1];
            if (columnConfig[colKey]?.type !== columnConfig[targetColKey]?.type) return;
            newData.forEach((row) => { [row[colKey], row[targetColKey]] = [row[targetColKey], row[colKey]]; });
            newSelectedCells = selectedCells.map(c => ({ ...c, colKey: targetColKey }));
        } else if (direction === 'up' && originalRowIndex > 0) {
            [newData[originalRowIndex], newData[originalRowIndex - 1]] = [newData[originalRowIndex - 1], newData[originalRowIndex]];
            newSelectedCells = selectedCells.map(c => ({ ...c, rowIndex: rowIndex - 1 }));
        } else if (direction === 'down' && originalRowIndex < tableData.length - 1) {
            [newData[originalRowIndex], newData[originalRowIndex + 1]] = [newData[originalRowIndex + 1], newData[originalRowIndex]];
            newSelectedCells = selectedCells.map(c => ({ ...c, rowIndex: rowIndex + 1 }));
        }

        updateData(newData, newSelectedCells);
    }, [tableData, movableHeaders, selectedCells, updateData, isEditable, paginatedData, columnConfig]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (editingCell) return;

        if (isEditable) {
            if (e.ctrlKey && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
            else if (e.ctrlKey && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
            else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
                if (selectedCells.length === 1) {
                    const { rowIndex, colKey } = selectedCells[0];
                    const originalRowIndex = paginatedData[rowIndex]?.originalIndex;
                    if (originalRowIndex !== undefined) {
                        const value = tableData[originalRowIndex]?.[colKey];
                        setCopiedCell({ rowIndex, colKey, value });
                    }
                }
            }
            else if (e.ctrlKey && e.key.toLowerCase() === 'v') {
                if (copiedCell && selectedCells.length > 0) {
                    e.preventDefault();
                    const newData: DataItem[] = structuredClone(tableData);
                    const newValidationErrors = { ...validationErrors };

                    selectedCells.forEach(targetCell => {
                        if (targetCell.colKey === fixedHeaderKey || columnConfig[targetCell.colKey]?.isEditable === false) return;

                        const originalRowIndex = paginatedData[targetCell.rowIndex]?.originalIndex;
                        if (originalRowIndex !== undefined && newData[originalRowIndex]) {
                            const targetType = columnConfig[targetCell.colKey]?.type || 'string';
                            let finalValue = copiedCell.value;

                            if (canConvertValue(copiedCell.value, targetType)) {
                                finalValue = convertValue(copiedCell.value, targetType);
                            }

                            const error = validateCell(finalValue, targetCell.colKey);
                            if (!newValidationErrors[originalRowIndex]) newValidationErrors[originalRowIndex] = {};
                            newValidationErrors[originalRowIndex][targetCell.colKey] = error;

                            newData[originalRowIndex][targetCell.colKey] = finalValue;
                        }
                    });
                    setValidationErrors(newValidationErrors);
                    updateData(newData, selectedCells);
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
    }, [
        editingCell, isEditable, undo, redo, selectedCells, copiedCell, tableData,
        updateData, shiftCells, shiftColumnOrRow, lastSelected, movableHeaders,
        fixedHeaderKey, paginatedData, columnConfig, validationErrors, validateCell
    ]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const handleDragStart = (rowIndex: number, colKey: string) => {
        if (!isEditable || colKey === fixedHeaderKey) return;
        setDraggedCell({ rowIndex, colKey });
    };

    const handleDragEnd = () => {
        setDraggedCell(null);
        setDragOverCell(null);
    };

    const handleDrop = (targetRowIndex: number, targetColKey: string) => {
        if (!isEditable || !draggedCell || targetColKey === fixedHeaderKey) return;
        if (draggedCell.rowIndex === targetRowIndex && draggedCell.colKey === targetColKey) return;

        const newData: DataItem[] = structuredClone(tableData);
        const newValidationErrors = { ...validationErrors };

        const draggedOriginalIndex = paginatedData[draggedCell.rowIndex]?.originalIndex;
        const targetOriginalIndex = paginatedData[targetRowIndex]?.originalIndex;

        if (draggedOriginalIndex !== undefined && targetOriginalIndex !== undefined && newData[draggedOriginalIndex] && newData[targetOriginalIndex]) {
            const sourceValue = newData[draggedOriginalIndex][draggedCell.colKey];
            const targetValue = newData[targetOriginalIndex][targetColKey];
            const sourceType = columnConfig[draggedCell.colKey]?.type || 'string';
            const targetType = columnConfig[targetColKey]?.type || 'string';

            const valueForTarget = convertValue(sourceValue, targetType);
            const valueForSource = convertValue(targetValue, sourceType);

            newData[draggedOriginalIndex][draggedCell.colKey] = valueForSource;
            newData[targetOriginalIndex][targetColKey] = valueForTarget;

            const sourceError = validateCell(valueForSource, draggedCell.colKey);
            const targetError = validateCell(valueForTarget, targetColKey);

            if (!newValidationErrors[draggedOriginalIndex]) newValidationErrors[draggedOriginalIndex] = {};
            newValidationErrors[draggedOriginalIndex][draggedCell.colKey] = sourceError;

            if (!newValidationErrors[targetOriginalIndex]) newValidationErrors[targetOriginalIndex] = {};
            newValidationErrors[targetOriginalIndex][targetColKey] = targetError;

            setValidationErrors(newValidationErrors);
            updateData(newData);
        }

        handleDragEnd();
    };

    const selectionInfo = useMemo(() => {
        if (selectedCells.length === 0) return null;
        const pills = [<InfoPill key="count">{selectedCells.length} cell(s) selected</InfoPill>];
        const firstCell = selectedCells[0];
        if (selectedCells.every(c => c.rowIndex === firstCell.rowIndex)) {
            const rowData = paginatedData[firstCell.rowIndex];
            if (rowData && fixedHeaderKey) {
                const rowName = rowData[fixedHeaderKey];
                pills.push(<InfoPill key="row">Row S.No.: {rowName}</InfoPill>);
            }
        }
        if (selectedCells.every(c => c.colKey === firstCell.colKey)) {
            const colName = columnConfig[firstCell.colKey]?.label || firstCell.colKey;
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
        const colConfig = columnConfig[colKey];
        const inputType = colConfig?.type === 'string' ? 'text' : colConfig?.type || 'text';

        if (isEditing) {
            if (inputType === 'boolean') {
                return (
                    <input
                        type="checkbox"
                        checked={!!cellValue}
                        autoFocus
                        onChange={(e) => handleCellUpdate(rowIndex, colKey, e.target.checked)}
                        onBlur={() => setEditingCell(null)}
                        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 z-20 ${theme === 'dark' ? 'accent-violet-500' : 'accent-violet-600'}`}
                    />
                );
            }
            return (
                <input
                    type={inputType}
                    defaultValue={cellValue}
                    autoFocus
                    onKeyDown={(e) => handleEditKeyDown(e, rowIndex, colKey)}
                    onBlur={(e) => handleEditBlur(e, rowIndex, colKey)}
                    className={`absolute inset-0 w-full h-full p-2 text-xs md:text-sm border-2 border-violet-500 rounded-md outline-none z-10 ${theme === 'dark' ? 'bg-[#1C1C2E] text-gray-100' : 'bg-violet-50 text-gray-900'}`}
                />
            );
        }

        if (inputType === 'boolean') {
            return <input type="checkbox" checked={!!cellValue} readOnly className={`h-4 w-4 ${theme === 'dark' ? 'accent-violet-500' : 'accent-violet-600'}`} />;
        }
        
        if (colConfig?.isCurrency) {
            return formatIndianCurrency(cellValue);
        }

        return String(cellValue ?? '');
    };

    const getColumnHeader = (key: string) => {
        const config = columnConfig[key];
        const label = config?.label || key.replace(/_/g, ' ');
        const type = config?.type || 'string';

        let headerStyle = {};
        if (isEditable && draggedCell) {
            const draggedType = columnConfig[draggedCell.colKey]?.type || 'string';
            if (key !== fixedHeaderKey) {
                const canConvert = canConvertValue(
                    tableData[paginatedData[draggedCell.rowIndex]?.originalIndex]?.[draggedCell.colKey],
                    type
                );

                if (type === draggedType) {
                    headerStyle = { backgroundColor: 'rgba(34, 197, 94, 0.3)' };
                } else if (canConvert) {
                    headerStyle = { backgroundColor: 'rgba(245, 158, 11, 0.3)' };
                } else {
                    headerStyle = { backgroundColor: 'rgba(239, 68, 68, 0.3)' };
                }
            }
        }

        return (
            <div style={headerStyle} className="p-2 transition-colors duration-200">
                <span>{label}</span>
                {config?.isRequired && <span className="text-red-500 ml-1">*</span>}
                {isEditable && draggedCell && (
                    <span className={`ml-2 text-xs font-normal ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        ({type})
                    </span>
                )}
            </div>
        );
    };

    const renderPaginationControls = () => {
        if (!pagination.enabled || totalItems <= (pagination.pageSizeOptions?.[0] || 5)) return null;

        const handlePageChange = (page: number) => {
            if (paginationInfo && onPageChange) {
                onPageChange(page);
            } else {
                setCurrentPage(page);
            }
        };

        const handlePageSizeChange = (size: number) => {
            setPageSize(size);
            if (paginationInfo && onPageSizeChange) {
                onPageSizeChange(size);
            }
        };

        const getPageNumbers = () => {
            const pages = [];
            const showPages = 5;
            let start = Math.max(1, finalCurrentPage - Math.floor(showPages / 2));
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
            <div className={`flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 py-2 px-4 border-t text-xs ${theme === 'dark' ? 'border-gray-700 bg-[#1C1C2E]' : 'border-gray-200 bg-gray-50'}`}>
                <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Showing {totalItems > 0 ? startIndex + 1 : 0}-{endIndex} of {totalItems}
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        className={`px-2 py-1 rounded border text-xs ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                        {pagination.pageSizeOptions?.map(size => (
                            <option key={size} value={size}>Show {size}</option>
                        ))}
                    </select>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button onClick={() => handlePageChange(1)} disabled={finalCurrentPage === 1} className={`p-1 rounded ${finalCurrentPage === 1 ? 'opacity-50' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                <SkipBack size={14} />
                            </button>
                            <button onClick={() => handlePageChange(finalCurrentPage - 1)} disabled={finalCurrentPage === 1} className={`p-1 rounded ${finalCurrentPage === 1 ? 'opacity-50' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                <ChevronLeft size={14} />
                            </button>

                            {getPageNumbers().map(page => (
                                <button key={page} onClick={() => handlePageChange(page)} className={`px-2 py-0.5 text-xs rounded ${page === finalCurrentPage ? 'bg-violet-600 text-white' : theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}>
                                    {page}
                                </button>
                            ))}

                            <button onClick={() => handlePageChange(finalCurrentPage + 1)} disabled={finalCurrentPage === totalPages} className={`p-1 rounded ${finalCurrentPage === totalPages ? 'opacity-50' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                <ChevronRight size={14} />
                            </button>
                            <button onClick={() => handlePageChange(totalPages)} disabled={finalCurrentPage === totalPages} className={`p-1 rounded ${finalCurrentPage === totalPages ? 'opacity-50' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                <SkipForward size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderTableBody = () => {
        if (isLoading) {
            return (
                <tbody>
                    {Array.from({ length: pageSize }).map((_, rowIndex) => (
                        <tr key={`skeleton-${rowIndex}`}>
                            {fixedHeaderKey && <td className={`p-2 sticky left-0 border-b z-index ${theme === 'dark' ? 'border-gray-700 bg-[#1C1C2E]' : 'border-gray-200 bg-gray-50'}`}><div className={`h-4 w-8 rounded animate-pulse ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div></td>}
                            {movableHeaders.map(label => (
                                <td key={label} className={`p-2 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}><div className={`h-4 rounded animate-pulse ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div></td>
                            ))}
                            {renderActionCell && <td className={`p-2 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}><div className={`h-6 w-16 rounded animate-pulse ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div></td>}
                        </tr>
                    ))}
                </tbody>
            );
        }

        if (paginatedData.length === 0) {
            return (
                <tbody>
                    <tr>
                        <td colSpan={1 + movableHeaders.length + (renderActionCell ? 1 : 0)} className="text-center p-8">
                            <div className="flex flex-col items-center gap-4 text-gray-500">
                                <NoDataDisplay heading="No Data Found" message="There are no records to display for your current search." />
                                {isEditable && (
                                    <button
                                        onClick={handleAddRow}
                                        className={`w-1/2 p-2 rounded-md flex items-center justify-center gap-2 text-sm font-medium transition-colors duration-200 
                                        ${theme === 'dark'
                                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-gray-100'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`
                                        }
                                        title="Insert New Row"
                                    >
                                        <Plus size={16} /> Insert Row
                                    </button>
                                )}
                            </div>
                        </td>
                    </tr>
                </tbody>
            );
        }

        return (
            <motion.tbody variants={tableBodyVariants} initial="hidden" animate="visible">
                {paginatedData.map((row, rowIndex) => {
                    const originalRowIndex = row.originalIndex;
                    const isUnsavedRow = !row.item_id || (typeof row.id === 'string' && row.id.startsWith('new-'));
                    const hasIncompleteFields = hasIncompleteMandatoryFields(row);
                    
                    return (
                        <motion.tr key={row.sno} variants={tableRowVariants} className={`${theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50/50'} ${isUnsavedRow ? (theme === 'dark' ? 'bg-yellow-900/20' : 'bg-yellow-50/50') : ''}`}>
                            {fixedHeaderKey && (
                                <td
                                    className={`p-2 border-b font-medium sticky left-0 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-700'}`}
                                    style={{
                                        zIndex: 40,
                                        boxShadow: theme === 'dark' ? '1px 0 0 0 rgba(255,255,255,0.06)' : '1px 0 0 0 rgba(0,0,0,0.06)'
                                    }}
                                >
                                    {row[fixedHeaderKey]}
                                </td>
                            )}
                            {movableHeaders.map(label => {
                                const error = validationErrors[originalRowIndex]?.[label];
                                const isDragOver = dragOverCell?.rowIndex === rowIndex && dragOverCell?.colKey === label;

                                return (
                                    <td
                                        key={label}
                                        onDoubleClick={() => isEditable && columnConfig[label]?.isEditable !== false && setEditingCell({ rowIndex, colKey: label })}
                                        onClick={(e) => handleCellClick(rowIndex, label, e)}
                                        draggable={isEditable}
                                        onDragStart={() => handleDragStart(rowIndex, label)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setDragOverCell({ rowIndex, colKey: label });
                                        }}
                                        onDragLeave={() => setDragOverCell(null)}
                                        onDrop={() => handleDrop(rowIndex, label)}
                                        className={`relative p-2 border-b transition-all duration-150 group ${!isEditable || columnConfig[label]?.isEditable === false ? 'cursor-default' : 'cursor-pointer'
                                            } ${theme === 'dark' ? 'border-gray-700 text-gray-200' : 'border-gray-200 text-gray-800'
                                            } ${isSelected(rowIndex, label)
                                                ? (theme === 'dark' ? 'bg-violet-900/60' : 'bg-violet-100')
                                                : ''
                                            } ${error ? 'ring-2 ring-red-500 inset-0 bg-red-500/10' : ''
                                            } ${isDragOver && draggedCell && (draggedCell.colKey !== label || draggedCell.rowIndex !== rowIndex) ? (theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200') : ''
                                            }`}
                                        title={error || ''}
                                    >
                                        {renderCellContent(rowIndex, label)}
                                    </td>
                                );
                            })}
                            {renderActionCell && (
                                <td className={`p-2 border-b text-center ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                                    {renderActionCell(row, rowIndex)}
                                </td>
                            )}
                        </motion.tr>
                    )
                })
                }
                {isEditable && (
                    <tr>
                        <td
                            colSpan={1 + movableHeaders.length + (renderActionCell ? 1 : 0)}
                            className={`p-1 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                        >
                            <button
                                onClick={handleAddRow}
                                className={`w-full p-2 rounded-md flex items-center justify-center gap-2 text-sm font-medium transition-colors duration-200 
                                ${theme === 'dark'
                                        ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                                        : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-800'}`
                                }
                                title="Insert New Row"
                            >
                                <Plus size={16} /> Insert Row
                            </button>
                        </td>
                    </tr>
                )}
            </motion.tbody>
        );
    };

    return (
        <div
            className={`rounded-lg border flex flex-col overflow-hidden ${theme === 'dark' ? 'border-gray-700 bg-[#1C1C2E]' : 'border-gray-200 bg-white'}`}
            style={{ maxHeight: maxHeight }}
        >
            <div className={`flex-shrink-0 flex flex-col md:flex-row items-center justify-between gap-4 p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                {isSearchable && (
                    <div className="relative w-full md:w-auto">
                        <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full md:w-56 pl-8 pr-3 py-1.5 text-sm border rounded-md focus:ring-violet-500 focus:border-violet-500 ${theme === 'dark' ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-900'}`}
                        />
                    </div>
                )}
                {isEditable && (
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                        <button onClick={undo} disabled={historyIndex === 0} className={`p-1.5 rounded-md disabled:opacity-50 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`} title="Undo"><Undo size={14} /></button>
                        <button onClick={redo} disabled={historyIndex === history.length - 1} className={`p-1.5 rounded-md disabled:opacity-50 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`} title="Redo"><Redo size={14} /></button>
                    </div>
                )}
            </div>

            <div className="flex-grow overflow-auto">
                <table className="w-full border-collapse select-none text-xs md:text-sm">
                    <thead className={`sticky top-0 shadow-sm ${theme === 'dark' ? 'bg-gray-800/95 backdrop-blur supports-[backdrop-filter]:bg-gray-800/80' : 'bg-gray-100/95 backdrop-blur supports-[backdrop-filter]:bg-gray-100/80'}`}
                        style={{ zIndex: 50 }}
                    >
                        <tr>
                            {fixedHeaderKey && (
                                <th className={`p-0 font-semibold text-left capitalize sticky left-0 border-b-2 shadow-sm ${theme === 'dark' ? 'text-gray-200 border-gray-700 bg-gray-800/80' : 'text-gray-700 border-gray-300 bg-gray-50'}`}
                                    style={{ zIndex: 60, boxShadow: theme === 'dark' ? '1px 0 0 0 rgba(255,255,255,0.06)' : '1px 0 0 0 rgba(0,0,0,0.06)' }}
                                >
                                    {getColumnHeader(fixedHeaderKey)}
                                </th>
                            )}
                            {movableHeaders.map(label => (
                                <th key={label} className={`p-0 font-semibold text-left capitalize border-b-2 ${theme === 'dark' ? 'text-gray-200 border-gray-700 bg-gray-800' : 'text-gray-700 border-gray-200 bg-gray-100'}`}>
                                    {getColumnHeader(label)}
                                </th>
                            ))}
                            {renderActionCell && (
                                <th className={`p-2 font-semibold text-left border-b-2 ${theme === 'dark' ? 'text-gray-200 border-gray-700 bg-gray-800' : 'text-gray-700 border-gray-200 bg-gray-100'}`}>
                                    {actionColumnHeader}
                                </th>
                            )}
                        </tr>
                    </thead>
                    {renderTableBody()}
                </table>
            </div>

            {renderPaginationControls()}

            <Popup isOpen={false} onClose={() => { }} data={null} />

            {isEditable && (
                <div className={`flex-shrink-0 p-3 border-t flex justify-between items-center ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex flex-wrap gap-2">
                        {selectionInfo ? selectionInfo : (<p className="text-sm text-gray-500 font-extralight">Click on a cell to start selecting.</p>)}
                        {hasBlockingErrors && (
                            <InfoPill>
                                <span className="text-red-500">⚠ Please fix the validation errors before saving.</span>
                            </InfoPill>
                        )}
                        {hasUnsavedRows && (
                            <InfoPill>
                                <span className="text-yellow-600 dark:text-yellow-400">⚠ {tableData.filter(r => !r.item_id || (typeof r.id === 'string' && r.id.startsWith('new-'))).length} unsaved row(s)</span>
                            </InfoPill>
                        )}
                    </div>
                    <div>
                        <button onClick={() => setShowHelp(true)} className={`p-1.5 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
                            <Info size={16} className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} />
                        </button>
                        <HowToUse isOpen={showHelp} onClose={() => setShowHelp(false)} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataTable;