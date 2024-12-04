import React, { useMemo, useState, useEffect } from 'react';
import { useTable, usePagination } from 'react-table';
import { fetchData } from '../services/apiService.js';
import { useNavigate } from 'react-router-dom';

const ViewInstallations = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search Filter states
  const [location, setLocation] = useState('');
  const [keyword, setKeyword] = useState('');
  const [brand, setBrand] = useState('All');
  const [model, setModel] = useState('All');
  const [status, setStatus] = useState('All');
  const [includeArchived, setIncludeArchived] = useState(false);

  useEffect(() => {
    const fetchInstallations = async () => {
      try {
        const response = await fetchData('https://v1servicedeskapi.wello.solutions/api/ProjectView', 'GET');
        setContacts(response.value); // Adjusted for your API's response structure
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchInstallations();
  }, []);

  const columns = useMemo(
    () => [
      { Header: 'Name', 
        Cell: ({ row }) => (
          <a href={`./installation/${row.original.id}`} className="text-indigo-600 hover:underline">
            {row.original.name}
          </a>
        )
       },
      { Header: 'Address', accessor: 'db_address_street' },
      { Header: 'Type', accessor: 'equipment_family_name' },
      { Header: 'Customer Reference', accessor: 'customer_reference' },
      { Header: 'Brand', accessor: 'equipment_brand_name' },
      { Header: 'Model', accessor: 'equipment_model_name' },
      { Header: 'Serial Number', accessor: 'serial_number' },
      { Header: 'Barcode', accessor: 'barcode' },
      { Header: 'Status', accessor: 'project_status_name' },
    ],
    []
  );

  // Filtered data based on search criteria
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesLocation = location ? contact.db_address_street.toLowerCase().includes(location.toLowerCase()) : true;
      const matchesKeyword = keyword ? contact.name.toLowerCase().includes(keyword.toLowerCase()) : true;
      const matchesBrand = brand !== 'All' ? contact.equipment_brand_name === brand : true;
      const matchesModel = model !== 'All' ? contact.equipment_model_name === model : true;
      const matchesStatus = status !== 'All' ? contact.project_status_name === status : true;
      const matchesArchived = includeArchived ? true : contact.project_status_name !== 'Archived';

      return matchesLocation && matchesKeyword && matchesBrand && matchesModel && matchesStatus && matchesArchived;
    });
  }, [contacts, location, keyword, brand, model, status, includeArchived]);

  // Create table instance with pagination
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page, // Use page instead of rows for pagination
    prepareRow,
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
      initialState: { pageIndex: 0, pageSize: 10 }, // Set initial page size to 10
    },
    usePagination
  );

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gray-100">
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
    <div className="max-w-7xl mx-auto p-6">
      <div className='flex'>
        {/* Back Button */}
        <button
          onClick={() => navigate('/')} // Navigate back one step in history
          className="mb-6 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
        >
          {'<'}
        </button>
        <h1 className="text-2xl font-semibold text-gray-800 mb-6 ml-4">Installations</h1>
      </div>

      {/* Search Filter UI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block mb-1">Location <small>(Enter three letters to initiate search)</small></label>
          <input 
            type="text" 
            value={location} 
            onChange={(e) => setLocation(e.target.value)} 
            placeholder="Enter location" 
            className="border border-gray-300 rounded-md p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-1">Keyword</label>
          <input 
            type="text" 
            value={keyword} 
            onChange={(e) => setKeyword(e.target.value)} 
            placeholder="Type a text" 
            className="border border-gray-300 rounded-md p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-1">Brand</label>
          <select value={brand} onChange={(e) => setBrand(e.target.value)} className="border border-gray-300 rounded-md p-2 w-full">
            <option value="All">All</option>
            {uniqueBrands.map((brand, index) => (
              brand && <option key={index} value={brand}>{brand}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Model</label>
          <select value={model} onChange={(e) => setModel(e.target.value)} className="border border-gray-300 rounded-md p-2 w-full">
            <option value="All">All</option>
            {uniqueModels.map((model, index) => (
              model && <option key={index} value={model}>{model}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-300 rounded-md p-2 w-full">
            <option value="All">All</option>
            {uniqueStatuses.map((status, index) => (
              status && <option key={index} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={handleReset} className="bg-indigo-600 text-white rounded-md px-4 py-2">Reset</button>
        </div>
      </div>

      <div className="flex items-center mb-4">
        <input 
          type="checkbox" 
          checked={includeArchived} 
          onChange={() => setIncludeArchived(!includeArchived)} 
          className="mr-2"
        />
        <label className="text-sm">Don't see your equipment? Check to include archived equipment in your search.</label>
      </div>

      {/* Table displaying filtered data */}
      <div className="overflow-x-auto">
        <table {...getTableProps()} className="min-w-full divide-y divide-gray-200 border border-gray-300">
          <thead className="bg-gray-100">
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps()} className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                    {column.render('Header')}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
            {page.map(row => { // Use page instead of rows for pagination
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} className="hover:bg-gray-50">
                  {row.cells.map(cell => (
                    <td {...cell.getCellProps()} className="px-4 py-2 text-sm text-gray-800">
                      {cell.render('Cell')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-700">
          Page {pageIndex + 1} of {pageOptions.length}
        </span>
        <div>
          <button onClick={() => gotoPage(0)} disabled={!canPreviousPage} className="py-2 px-4 mr-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-300">
            {'<<'}
          </button>
          <button onClick={previousPage} disabled={!canPreviousPage} className="py-2 px-4 mr-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-300">
            {'<'}
          </button>
          <button onClick={nextPage} disabled={!canNextPage} className="py-2 px-4 mr-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-300">
            {'>'}
          </button>
          <button onClick={() => gotoPage(pageOptions.length - 1)} disabled={!canNextPage} className="py-2 px-4 bg-indigo-600 text-white rounded-md disabled:bg-gray-300">
            {'>>'}
          </button>
        </div>
        <select 
          value={pageSize} 
          onChange={e => {
            setPageSize(Number(e.target.value));
          }} 
          className="border border-gray-300 rounded-md p-2 max-w-32"
        >
          {[10, 20, 30, 50].map(pageSizeOption => (
            <option key={pageSizeOption} value={pageSizeOption}>
              Show {pageSizeOption}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ViewInstallations;