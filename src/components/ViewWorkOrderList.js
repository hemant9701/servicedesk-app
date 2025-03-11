import React, { useMemo, useState, useEffect } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import { fetchData } from '../services/apiService.js';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown, ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const ViewWorkOrderList = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('open'); // State to track selected tab

  const statusColors = useMemo(() => ({
    "In Progress": "bg-yellow-500 text-white",
    "Planned": "bg-blue-500 text-white",
    "To be Planned": "bg-purple-500 text-white",
    "In progress (W)": "bg-orange-500 text-white",
    "Open": "bg-green-500 text-white",
    "Ready for Review": "bg-indigo-500 text-white",
    "Cancelled": "bg-red-500 text-white",
    "Completed": "bg-pink-500 text-white",
  }), []);

  const jobType = useMemo(() => ({
    "Repair": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    "Maintenance": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    "Installation": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  }), []);

  useEffect(() => {
    const fetchWorkOrder = async (completedStatus) => {
      try {
        //const response = await fetchData('https://v1servicedeskapi.wello.solutions/api/JobsView/', 'GET');
        const endpoint = `https://v1servicedeskapi.wello.solutions/api/JobsView/Search`;
        const payload = {
          "is_get_completed": completedStatus,
          "query_object": {
            "startRow": 0,
            "endRow": 500,
            "rowGroupCols": [],
            "valueCols": [],
            "pivotCols": [],
            "pivotMode": false,
            "groupKeys": [],
            "filterModel": {},
            "sortModel": []
          }
        };
        const response = await fetchData(endpoint, 'POST', payload);
        setJobs(response); // Adjusted for your API's response structure
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchWorkOrder(isCompleted);
  }, [isCompleted]);


  const columns = useMemo(
    () => [
      {
        Header: 'Planned date', accessor: 'date_create',
        Cell: ({ value }) => new Date(value).toLocaleDateString('nl-BE')
      },
      {
        Header: 'Status', accessor: 'job_status_name',
        Cell: ({ row }) => (
          <span className={`text-xs font-medium me-2 px-2.5 py-0.5 rounded-sm block text-center ${statusColors[row.original.job_status_name] || "bg-gray-300"}`}>
            {row.original.job_status_name}
          </span>
        ),
      },
      {
        Header: 'Name', accessor: 'name',
        Cell: ({ value }) => value.length > 40 ? value.slice(0, 40) + '...' : value
      },
      {
        Header: 'Address', accessor: 'db_address_street',
        Cell: ({ row }) => (
          <span>
            {row.original.db_address_street} {row.original.db_address_city} {row.original.db_address_zip}
          </span>
        ),
      },
      {
        Header: 'Reference', accessor: 'id2',
        Cell: ({ row }) => (
          <button
            onClick={() => navigate(`/workorder/${row.original.id}`)}
            className="bg-blue-100 text-blue-800 font-medium me-2 px-2.5 py-0.5 rounded-sm border border-blue-400">
            {row.original.id2}
          </button>
        ),
      },
      {
        Header: 'Type', accessor: 'job_type_name',
        Cell: ({ row }) => (
          <span className={`text-xs font-medium me-2 px-2.5 py-0.5 rounded-sm block text-center ${jobType[row.original.job_type_name] || "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"}`}>
            {row.original.job_type_name}
          </span>
        ),
      },
    ],
    [jobType, statusColors, navigate]
  );


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
      data: jobs,
      initialState: { pageIndex: 0, pageSize: 10 }, // Set initial page size to 10
    },
    useSortBy,
    usePagination,
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
    return <div className="text-center mt-10 text-red-600">Error fetching jobs: {error.message}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-1 md:p-8">
      <div className='flex'>
        {/* Back Button */}
        <button
          onClick={() => navigate('/')} // Navigate back one step in history
          className="mb-6 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-800 mb-6 ml-4">Work Order List</h1>
      </div>

      {/* Tabs for Open and Completed Jobs */}
      <div className="mb-4">
        <button
          className={`px-4 py-2 mr-2 rounded-md font-semibold ${selectedTab === 'open' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          onClick={() => {
            setSelectedTab('open');
            setIsCompleted(false);
          }}
        >
          Pending
        </button>

        <button
          className={`px-4 py-2 rounded-md font-semibold ${selectedTab === 'completed' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          onClick={() => {
            setSelectedTab('completed');
            setIsCompleted(true);
          }}
        >
          Completed
        </button>

      </div>

      {/* Table displaying filtered jobs */}
      <div className="overflow-x-auto">
        <table {...getTableProps()} className="min-w-full divide-y divide-gray-200 border border-gray-300">
          <thead className="bg-gray-100">
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps(column.getSortByToggleProps())}
                    className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                    {column.render("Header")}
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
          <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
            {!loading && page.map(row => { // Change from rows to page
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

      {/* Pagination Controls - Only show if filteredWorkOrder exceed pageSize (10) */}
      {jobs.length > 10 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-700">
            Page {pageIndex + 1} of {pageOptions.length}
          </span>
          <div>
            <button onClick={() => gotoPage(0)} disabled={!canPreviousPage} className="py-1 px-2 md:py-2 md:px-4 mr-1 bg-indigo-600 text-white rounded-md disabled:bg-gray-300">
              <ChevronsLeft className="w-4" />
            </button>
            <button onClick={() => previousPage()} disabled={!canPreviousPage} className="py-1 px-2 md:py-2 md:px-4 mr-1 bg-indigo-600 text-white rounded-md disabled:bg-gray-300">
              <ChevronLeft className="w-4" />
            </button>
            <button onClick={() => nextPage()} disabled={!canNextPage} className="py-1 px-2 md:py-2 md:px-4 mr-1 bg-indigo-600 text-white rounded-md disabled:bg-gray-300">
              <ChevronRight className="w-4" />
            </button>
            <button onClick={() => gotoPage(pageOptions.length - 1)} disabled={!canNextPage} className="py-1 px-2 md:py-2 md:px-4 bg-indigo-600 text-white rounded-md disabled:bg-gray-300">
              <ChevronsRight className="w-4" />
            </button>
          </div>
          <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="ml-1 p-1 md:p-2 border border-gray-300 rounded-md max-w-32">
            {[10, 20, 30, 50].map(size => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default ViewWorkOrderList;