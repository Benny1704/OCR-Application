import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Undo, Redo, Columns, Rows, Info, Save, Search } from 'lucide-react';
import type { DataItem, CellIdentifier, CopiedCell, DataTableProps as OriginalDataTableProps } from '../../interfaces/Types';
import { Popup, JsonPreviewModal, InfoPill, HowToUse } from './Helper';

export interface DataTableProps extends OriginalDataTableProps {
  renderActionCell?: (row: DataItem, rowIndex: number) => React.ReactNode;
  actionColumnHeader?: string;
}

const DataTable = ({
  tableData,
  isEditable = false,
  isSearchable = false,
  renderActionCell,
  actionColumnHeader = 'Action'
}: DataTableProps) => {
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

  useEffect(() => {
    setData(tableData);
    setHistory([tableData]);
    setHistoryIndex(0);
  }, [tableData]);

  const { fixedHeaderKey, movableHeaders } = useMemo(() => {
    if (!data || data.length === 0) return { fixedHeaderKey: null, movableHeaders: [] };
    const allHeaders = Object.keys(data[0]);
    const fixed = allHeaders[0];
    const movable = allHeaders.filter(h => h !== fixed && h !== 'id');
    return { fixedHeaderKey: fixed, movableHeaders: movable };
  }, [data]);

  const filteredData = useMemo<(DataItem & { originalIndex: number })[]>(() => {
    if (!isSearchable || !searchQuery) {
      return data.map((row, index) => ({ ...row, originalIndex: index }));
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return data
      .map((row, index) => ({ ...row, originalIndex: index }))
      .filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(lowerCaseQuery)
        )
      );
  }, [data, searchQuery, isSearchable]);

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
    const newData: DataItem[] = structuredClone(data);
    if (newData[rowIndex]) {
      newData[rowIndex][colKey] = value;
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
            const value = data[rowIndex]?.[colKey];
            setCopiedCell({ rowIndex, colKey, value });
          }
        } else if (e.ctrlKey && e.key.toLowerCase() === 'v') {
          if (copiedCell && selectedCells.length === 1) {
            e.preventDefault();
            const targetCell = selectedCells[0];
            if (targetCell.colKey === fixedHeaderKey) return;
            const newData: DataItem[] = structuredClone(data);
            if (newData[targetCell.rowIndex] && newData[copiedCell.rowIndex]) {
              const targetValue = newData[targetCell.rowIndex][targetCell.colKey];
              newData[targetCell.rowIndex][targetCell.colKey] = copiedCell.value;
              newData[copiedCell.rowIndex][copiedCell.colKey] = targetValue;
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
        if (e.key === 'ArrowDown' && rowIndex < data.length - 1) rowIndex++;
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
  }, [undo, redo, selectedCells, copiedCell, data, updateData, shiftCells, shiftColumnOrRow, lastSelected, movableHeaders, fixedHeaderKey, editingCell, isEditable]);

  const handleDragStart = (rowIndex: number, colKey: string) => {
    if (!isEditable || colKey === fixedHeaderKey) return;
    setDraggedCell({ rowIndex, colKey });
  };

  const handleDrop = (targetRowIndex: number, targetColKey: string) => {
    if (!isEditable || !draggedCell || targetColKey === fixedHeaderKey) return;
    if (draggedCell.rowIndex === targetRowIndex && draggedCell.colKey === targetColKey) return;
    const newData: DataItem[] = structuredClone(data);
    if (newData[draggedCell.rowIndex] && newData[targetRowIndex]) {
        [newData[draggedCell.rowIndex][draggedCell.colKey], newData[targetRowIndex][targetColKey]] =
        [newData[targetRowIndex][targetColKey], newData[draggedCell.rowIndex][draggedCell.colKey]];
    }
    updateData(newData);
    setDraggedCell(null);
  };

  // Note: This function is now only reachable if you re-implement the old logic
  // via the renderActionCell prop. It is no longer called by default.
  const openActionPopup = (itemIndex: number) => {
    const itemForPopup = data[itemIndex];
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
      const rowData = data[firstCell.rowIndex];
      if (rowData && fixedHeaderKey) {
        const rowName = rowData[fixedHeaderKey];
        pills.push(<InfoPill key="row">Row: {rowName}</InfoPill>);
      }
    }
    if (selectedCells.every(c => c.colKey === firstCell.colKey)) {
      const colName = firstCell.colKey;
      pills.push(<InfoPill key="col">Column: {colName}</InfoPill>);
    }
    return pills;
  }, [selectedCells, data, fixedHeaderKey]);

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colKey: string) => {
    const { key, shiftKey } = e;
    const value = e.currentTarget.value;
    const maxRow = data.length - 1;
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
    const cellValue = data[rowIndex]?.[colKey];

    if (isEditing) {
      return (
        <input
          type="text"
          defaultValue={cellValue}
          autoFocus
          onKeyDown={(e) => handleEditKeyDown(e, rowIndex, colKey)}
          onBlur={(e) => handleEditBlur(e, rowIndex, colKey)}
          className="absolute inset-0 w-full h-full p-3 text-sm bg-indigo-50 border-2 border-indigo-500 rounded-md outline-none z-10"
        />
      );
    }
    return cellValue;
  };

  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse select-none">
        <thead>
          <tr className="bg-gray-100">
            {fixedHeaderKey && <th className="p-3 font-bold text-left border-b-2 border-gray-300 bg-gray-200 capitalize sticky left-0 z-10">{fixedHeaderKey.replace(/_/g, ' ')}</th>}
            {movableHeaders.map(header => (<th key={header} className="p-3 font-semibold text-left border-b-2 border-gray-200 capitalize">{header}</th>))}
            {/* --- CHANGE 1: Conditionally render the action header --- */}
            {renderActionCell && (
              <th className="p-3 font-semibold text-left border-b-2 border-gray-200">{actionColumnHeader}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row) => {
            const rowIndex = row.originalIndex;
            return (
              <tr key={row.id || rowIndex} className="hover:bg-gray-50">
                {fixedHeaderKey && <td className="p-3 border-b border-gray-200 bg-gray-50 font-medium text-gray-600 sticky left-0">{row[fixedHeaderKey]}</td>}
                {movableHeaders.map(header => (
                  <td key={header}
                    onDoubleClick={() => isEditable && setEditingCell({ rowIndex, colKey: header })}
                    onClick={(e) => handleCellClick(rowIndex, header, e)}
                    draggable={isEditable}
                    onDragStart={() => handleDragStart(rowIndex, header)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(rowIndex, header)}
                    className={`relative p-3 border-b border-gray-200 transition-all duration-150 ${!isEditable ? 'cursor-default' : 'cursor-pointer'} ${isSelected(rowIndex, header) ? 'bg-indigo-100 ring-2 ring-indigo-400' : ''}`}>
                    {renderCellContent(rowIndex, header)}
                  </td>
                ))}
                {/* --- CHANGE 2: Conditionally render the action cell --- */}
                {renderActionCell && (
                  <td className="p-3 border-b border-gray-200 text-center">
                    {renderActionCell(row, rowIndex)}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className=" bg-white rounded-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="w-full flex justify-between items-center gap-2 flex-wrap">
          {isSearchable && (
            <div className="relative mr-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}
          {isEditable && (
            <div className="flex items-center gap-[1vw] ml-auto">
              <button onClick={handleSaveChanges} className="p-2 rounded-md bg-green-500 text-white hover:bg-green-600 flex items-center gap-2" title="Save Changes">
                <Save size={20} /> Save
              </button>
              <button onClick={undo} disabled={historyIndex === 0} className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" title="Undo (Ctrl+Z)"><Undo size={20} /></button>
              <button onClick={redo} disabled={historyIndex === history.length - 1} className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" title="Redo (Ctrl+Y)"><Redo size={20} /></button>
              <div className="flex items-center border border-gray-300 rounded-md ml-4" title="Shift Selected Cells (Shift + Arrow)">
                <button onClick={() => shiftCells('left')} className="p-2 border-r hover:bg-gray-100"><ArrowLeft size={20} /></button>
                <button onClick={() => shiftCells('up')} className="p-2 border-r hover:bg-gray-100"><ArrowUp size={20} /></button>
                <button onClick={() => shiftCells('down')} className="p-2 border-r hover:bg-gray-100"><ArrowDown size={20} /></button>
                <button onClick={() => shiftCells('right')} className="p-2 hover:bg-gray-100"><ArrowRight size={20} /></button>
              </div>
              <div className="flex items-center border border-gray-300 rounded-md ml-2" title="Shift Entire Column/Row (Alt + Arrow)">
                <button onClick={() => shiftColumnOrRow('left')} className="p-2 border-r hover:bg-gray-100"><Columns size={20} /></button>
                <button onClick={() => shiftColumnOrRow('up')} className="p-2 border-r hover:bg-gray-100"><Rows size={20} /></button>
                <button onClick={() => shiftColumnOrRow('down')} className="p-2 border-r hover:bg-gray-100"><Rows size={20} /></button>
                <button onClick={() => shiftColumnOrRow('right')} className="p-2 hover:bg-gray-100"><Columns size={20} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {renderTable()}

      <Popup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} data={popupData} />
      <JsonPreviewModal isOpen={isJsonPreviewOpen} onClose={() => setIsJsonPreviewOpen(false)} data={data} />
      {isEditable &&
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
          <div>
            {selectionInfo || <p className="text-sm text-gray-500">Click a cell to begin selection.</p>}
          </div>
          <div className="relative">
            <button onMouseEnter={() => setShowHelp(true)} onMouseLeave={() => setShowHelp(false)} className="p-2 rounded-full hover:bg-gray-200">
              <Info size={20} className="text-gray-600" />
            </button>
            {showHelp && <HowToUse />}
          </div>
        </div>
      }
    </div>
  );
};

export default DataTable;