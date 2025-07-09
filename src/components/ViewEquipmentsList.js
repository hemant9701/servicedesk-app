import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useTable, useSortBy, useExpanded, usePagination } from 'react-table';
import { fetchData } from '../services/apiService.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.js';
import {
  CornerDownRight, ChevronDown, ChevronUp, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ArrowLeftToLine, ArrowRightToLine, BadgeInfo, Circle, Filter,
  MapPin, Text, BadgeDollarSign, BarChart, Hash,
} from 'lucide-react';
import { useTranslation } from "react-i18next";

const ViewInstallations = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [subRowsMap, setSubRowsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTranslation('equipmentList');
  const [expanded, setExpanded] = useState({});

  // Search Filter states
  const [location, setLocation] = useState('');
  const [keyword, setKeyword] = useState('');
  const [brand, setBrand] = useState('All');
  const [model, setModel] = useState('All');
  const [status, setStatus] = useState('All');
  const [includeArchived, setIncludeArchived] = useState(false);

  const statusColors = useMemo(() => ({
    "In progress": "bg-yellow-200 text-yellow-800",
    "Planned": "bg-blue-200 text-blue-800",
    "To be Planned": "bg-purple-200 text-purple-800",
    "Out of production": "bg-orange-200 text-orange-800",
    "Active": "bg-green-200 text-green-800",
    "Ready for Review": "bg-indigo-200 text-indigo-800",
    "Proactive": "bg-indigo-200 text-indigo-800",
    "Cancelled": "bg-red-200 text-red-800",
    "Completed": "bg-pink-200 text-pink-800",
  }), []);

  useEffect(() => {
    const fetchRoot = async () => {
      const url = `https://V1servicedeskapi.wello.solutions/api/ProjectView/Search?keyword=&projectReference=&projectReferenceBackOffice=&companyID=00000000-0000-0000-0000-000000000000&equipmentModelID=00000000-0000-0000-0000-000000000000&equipmentBrandID=00000000-0000-0000-0000-000000000000&equipmentFamilyID=00000000-0000-0000-0000-000000000000&projectStatusID=00000000-0000-0000-0000-000000000000&createdFrom=1980-01-01T00:00:00.000&createdTo=1980-01-01T00:00:00.000&includesClosed=false&parentOnly=true&contactId=${auth.userId}&rootParentId=00000000-0000-0000-0000-000000000000&includeLocation=true`;
      const payload = {
        startRow: 0,
        endRow: 500,
        rowGroupCols: [],
        valueCols: [],
        pivotCols: [],
        pivotMode: false,
        groupKeys: [],
        filterModel: {},
        sortModel: []
      };

      try {
        const response = await fetchData(url, 'POST', auth.authKey, payload);
        const initialData = response.map(item => ({
          ...item,
          subRows: item.has_child ? [] : []
        }));
        setContacts(initialData);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchRoot();
  }, [auth]);


  const handleFetchChildren = useCallback(async (parentId) => {
    if (subRowsMap[parentId]) return;

    const url = `https://V1servicedeskapi.wello.solutions/api/ProjectView/Search?keyword=&projectReference=&projectReferenceBackOffice=&companyID=00000000-0000-0000-0000-000000000000&equipmentModelID=00000000-0000-0000-0000-000000000000&equipmentBrandID=00000000-0000-0000-0000-000000000000&equipmentFamilyID=00000000-0000-0000-0000-000000000000&projectStatusID=00000000-0000-0000-0000-000000000000&createdFrom=1980-01-01T00:00:00.000&createdTo=1980-01-01T00:00:00.000&includesClosed=false&parentOnly=false&contactId=${auth.userId}&rootParentId=00000000-0000-0000-0000-000000000000&includeLocation=true`;
    const payload = {
      startRow: 0,
      endRow: 500,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [parentId],
      filterModel: {},
      sortModel: []
    };

    try {
      const response = await fetchData(url, 'POST', auth.authKey, payload);
      const children = response.map(item => ({
        ...item,
        subRows: item.has_child ? [] : []
      }));

      setSubRowsMap(prev => ({ ...prev, [parentId]: children }));
    } catch (err) {
      console.error(err);
    }
  }, [auth, subRowsMap]);

  const toggleExpand = useCallback(async (id) => {
    if (!expanded[id]) {
      await handleFetchChildren(id);
    }
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }, [expanded, handleFetchChildren]);


  const columns = useMemo(() => [
    {
      Header: t('equipments_list_table_heading_name_text'),
      accessor: 'name',
      Cell: ({ row }) => (
        <button
          onClick={() => navigate(`/equipment/${row.original.id}`)}
          className="text-gray-800 font-medium me-2 text-left"
        >
          {row.original.name}
        </button>
      ),
    },
    {
      id: 'expander',
      Header: '',
      Cell: ({ row }) => (
        row.original.has_child ? (
          <button
            onClick={() => toggleExpand(row.original.id)}
            className="pr-1"
          >
            {expanded[row.original.id] ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        ) : null
      )
    },
    { Header: t('equipments_list_table_heading_address_text'), accessor: 'db_address_street' },
    { Header: t('equipments_list_table_heading_type_text'), accessor: 'equipment_family_name' },
    { Header: t('equipments_list_table_heading_reference_text'), accessor: 'customer_reference' },
    { Header: t('equipments_list_table_heading_brand_text'), accessor: 'equipment_brand_name' },
    { Header: t('equipments_list_table_heading_modal_text'), accessor: 'equipment_model_name' },
    { Header: t('equipments_list_table_heading_serial_number_text'), accessor: 'serial_number' },
    { Header: t('equipments_list_table_heading_bar_code_text'), accessor: 'barcode' },
    {
      Header: t('equipments_list_table_heading_status_text'),
      accessor: 'project_status_name',
      Cell: ({ row }) => (
        <span className={`text-xs flex items-center font-medium pe-2 px-1 pb-0.5 rounded-full ${statusColors[row.original.project_status_name] || "bg-gray-200 text-gray-800"}`}>
          <Circle className='inline w-2 h-2 mr-1 rounded-full' /> {row.original.project_status_name}
        </span>
      ),
    },
  ], [statusColors, navigate, expanded, toggleExpand, t]);

  // Filtered data based on search criteria
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesLocation = location ? contact.db_address_street.toLowerCase().includes(location.toLowerCase()) : true;
      const matchesKeyword = keyword ? contact.name.toLowerCase().includes(keyword.toLowerCase()) : true;
      const matchesBrand = brand !== 'All' ? contact.equipment_brand_name === brand : true;
      const matchesModel = model !== 'All' ? contact.equipment_model_name === model : true;
      const matchesStatus = status !== 'All' ? contact.project_status_name === status : true;
      const matchesArchived = includeArchived ? true : contact.project_status_is_closed !== true;

      return matchesLocation && matchesKeyword && matchesBrand && matchesModel && matchesStatus && matchesArchived;
    });
  }, [contacts, location, keyword, brand, model, status, includeArchived]);

  // Create table instance with pagination
  const {
    getTableProps,
    headerGroups,
    canPreviousPage,
    canNextPage,
    pageOptions,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data: filteredContacts,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useSortBy,
    useExpanded,
    usePagination
  );

  const renderRows = (data, depth = 0) => {
    return data.map(row => (
      <React.Fragment key={row.id}>
        <tr
          className="hover:bg-gray-50 cursor-pointer"
          onClick={() => navigate(`/equipment/${row.id}`)}
        >
          {columns.map((column, index) => {
            const isSecondColumn = index === 1; // Skip click for second column
            const cellContent = column.Cell
              ? column.Cell({ row: { original: row } })
              : row[column.accessor];

            return (
              <td
                key={column.id || column.accessor}
                className={`p-2 text-sm text-gray-800 ${index === 0 ? 'flex' : ''}`}
                style={index === 0 ? { paddingLeft: `${depth * 5 + 10}px` } : {}}
                onClick={isSecondColumn ? (e) => e.stopPropagation() : undefined}
              >
                {index === 0 && depth > 0 && (
                  <CornerDownRight className="mr-1 text-gray-400" size={16} />
                )}
                {cellContent}
              </td>
            );
          })}
        </tr>
        {expanded[row.id] && subRowsMap[row.id] && renderRows(subRowsMap[row.id], depth + 1)}
      </React.Fragment>
    ));
  };

  if (loading) {
    return <div className="flex w-full items-center justify-center h-screen bg-gray-100">
      <div className="relative">
        <div className="w-20 h-20 border-purple-200 border-2 rounded-full"></div>
        <div className="w-20 h-20 border-purple-700 border-t-2 animate-spin rounded-full absolute left-0 top-0"></div>
      </div>
    </div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-600">Error fetching data: {error.message}</div>;
  }

  const handleReset = () => {
    setLocation('');
    setKeyword('');
    setBrand('All');
    setModel('All');
    setStatus('All');
    setIncludeArchived(false);
  };

  const uniqueBrands = [...new Set(contacts.map(contact => contact.equipment_brand_name))];
  const uniqueModels = [...new Set(contacts.map(contact => contact.equipment_model_name))];
  const uniqueStatuses = [...new Set(contacts.map(contact => contact.project_status_name))];

  return (
    <div className="w-full mx-auto p-1 md:p-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">{t("equipments_list_page_title")}</h1>
      {/* Back Button */}
      <button
        onClick={() => navigate('/')} // Navigate back one step in history
        className="flex items-center mb-4 font-semibold text-gray-800"
      >
        <ArrowLeft className="mr-2 w-5 h-5" /> {t("Go Back")}
      </button>

      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          checked={includeArchived}
          onChange={() => setIncludeArchived(!includeArchived)}
          className="mr-2"
        />
        <label className="text-sm">{t('equipments_list_page_checkbox_label')}</label>
      </div>

      <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-white font-semibold text-gray-800 border border-gray-800 px-4 py-1 rounded-md mb-4">
        Filter <Filter className="w-4 h-4 ml-4" />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-80 p-4 bg-white rounded-lg shadow-md border space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-700">Filters</h2>
                <Filter className="w-4 h-4 text-gray-700" />
              </div>
            </div>

            {/* Location */}
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Search by Location"
                className="w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>

            {/* Sub-Location */}
            {/* <div className="relative">
              <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by Sub-Location"
                className="w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div> */}

            {/* Keyword */}
            <div className="relative">
              <Text className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search by Keyword"
                className="w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>

            {/* Brands */}
            <div className="relative">
              <BadgeDollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <select value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded-md text-sm text-gray-700">
                <option>Select by Brands</option>
                {uniqueBrands.map((brand, index) => (
                  brand && <option key={index} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="relative">
              <BarChart className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded-md text-sm text-gray-700">
                <option>Select by Status</option>
                {uniqueStatuses.map((status, index) => (
                  status && <option key={index} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Models */}
            <div className="relative">
              <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded-md text-sm text-gray-700">
                <option>Select by Models</option>
                {uniqueModels.map((model, index) => (
                  model && <option key={index} value={model}>{model}</option>
                ))}
              </select>
            </div>

            {/* Footer buttons */}
            <div className="flex justify-between pt-2">
              <button onClick={handleReset} className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-100">
                Reset Filters
              </button>
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800">
                Close Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <div className='shadow-md rounded-lg'>
        <div className="flex items-center mb-1 text-gray-900 px-4 py-2">
          <BadgeInfo className='mr-2 w-5 h-5 text-gray-400' /> {t("Click the row to view ticket details.")}
        </div>

        {/* Table displaying filtered data */}
        <div className="w-full overflow-x-auto">
          <table {...getTableProps()} className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-white">
              {headerGroups.map(headerGroup => (
                <tr {...headerGroup.getHeaderGroupProps()} className="bg-white divide-x divide-gray-300">
                  {headerGroup.headers.map(column => (
                    <th {...column.getHeaderProps(column.getSortByToggleProps())}
                      className="px-2 py-2 text-left text-sm font-semibold text-gray-600">
                      {column.render('Header')}
                      {column.isSorted ? (
                        column.isSortedDesc ? (
                          <ArrowDown className="inline w-4 h-4 ml-1" />
                        ) : (
                          <ArrowUp className="inline w-4 h-4 ml-1" />
                        )
                      ) : null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {renderRows(filteredContacts)}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls - Only show if filteredTickets exceed pageSize (10) */}
        {filteredContacts.length > 10 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-700">
              {t("Page")} {pageIndex + 1} {t("of")} {pageOptions.length}
            </span>
            <div>
              <button onClick={() => gotoPage(0)} disabled={!canPreviousPage} className="py-1 px-2 md:py-1 md:px-3 mr-1 text-gray-900 rounded-md border border-gray-900 disabled:border-gray-700">
                <ArrowLeftToLine className="w-4" />
              </button>
              <button onClick={() => previousPage()} disabled={!canPreviousPage} className="py-1 px-2 md:py-1 md:px-3 mr-1 text-gray-900 rounded-md border border-gray-900 disabled:border-gray-700">
                <ArrowLeft className="w-4" />
              </button>
              <button onClick={() => nextPage()} disabled={!canNextPage} className="py-1 px-2 md:py-1 md:px-3 mr-1 text-gray-900 rounded-md border border-gray-900 disabled:border-gray-700">
                <ArrowRight className="w-4" />
              </button>
              <button onClick={() => gotoPage(pageOptions.length - 1)} disabled={!canNextPage} className="py-1 px-2 md:py-1 md:px-3 mr-1 text-gray-900 rounded-md border border-gray-900 disabled:border-gray-700">
                <ArrowRightToLine className="w-4" />
              </button>
            </div>
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="ml-1 p-1 md:p-1 border border-gray-300 rounded-md max-w-32">
              {[10, 20, 30, 50].map(size => (
                <option key={size} value={size}>
                  {t("Show")} {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewInstallations;