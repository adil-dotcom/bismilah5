import React, { useState } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { exportToExcel } from '../utils/excelExport';

interface Column {
  id: string;
  label: string;
}

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  totalPatients: number;
  patientsWithMutuelle: number;
  filteredData: any[];
}

const columns: Column[] = [
  { id: 'numeroPatient', label: 'N° Patient' },
  { id: 'patient', label: 'Patient' },
  { id: 'date', label: 'Date' },
  { id: 'montant', label: 'Montant' },
  { id: 'statut', label: 'Statut' },
  { id: 'typePaiement', label: 'Type de paiement' },
  { id: 'mutuelle', label: 'Mutuelle' },
  { id: 'derniereConsultation', label: 'Dernière consultation' }
];

export default function ExportOptionsModal({
  isOpen,
  onClose,
  onExport,
  totalPatients,
  patientsWithMutuelle,
  filteredData
}: ExportOptionsModalProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(columns.map(col => col.id));
  const [exportLimit, setExportLimit] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleExport = () => {
    const limit = parseInt(exportLimit);
    let dataToExport = filteredData.map(item => ({
      numeroPatient: item.patientDetails?.numeroPatient || '',
      patient: `${item.patientDetails?.nom} ${item.patientDetails?.prenom}`,
      date: format(new Date(item.time), 'dd/MM/yyyy', { locale: fr }),
      montant: item.amount || '0,00',
      statut: item.status || '-',
      typePaiement: item.paymentMethod || '-',
      mutuelle: item.patientDetails?.mutuelle?.active ? `Oui - ${item.patientDetails.mutuelle.nom}` : 'Non',
      derniereConsultation: item.lastConsultAmount || '-'
    }));

    if (dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      dataToExport = dataToExport.filter(item => {
        const itemDate = new Date(item.date.split('/').reverse().join('-'));
        return itemDate >= start && itemDate <= end;
      });
    }

    if (!isNaN(limit) && limit > 0) {
      dataToExport = dataToExport.slice(0, limit);
    }

    const selectedData = dataToExport.map(item => {
      const filteredItem: any = {};
      selectedColumns.forEach(colId => {
        filteredItem[colId] = item[colId];
      });
      return filteredItem;
    });

    exportToExcel(selectedData, 'paiements', columns.filter(col => selectedColumns.includes(col.id)));
    onExport();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Options d'exportation</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Sélectionnez les colonnes à exporter :
            </h4>
            <div className="space-y-2">
              {columns.map(column => (
                <label key={column.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(column.id)}
                    onChange={() => handleColumnToggle(column.id)}
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{column.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Limite d'exportation (optionnel)
            </label>
            <input
              type="number"
              value={exportLimit}
              onChange={(e) => setExportLimit(e.target.value)}
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Nombre maximum de lignes"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date début
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date fin
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">
              Total patients : {totalPatients} (dont {patientsWithMutuelle} avec mutuelle)
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Exporter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}