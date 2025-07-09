import React, { useMemo, useState, useEffect } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import { fetchData } from '../services/apiService.js';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ArrowLeftToLine, ArrowRightToLine, BadgeInfo, Circle, CalendarClock } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useTranslation } from "react-i18next";

const ViewWorkOrderList = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('open');
  const { t } = useTranslation('workOrderList');

  const statusColors = useMemo(() => ({
    "In Progress": "bg-yellow-200 text-yellow-800",
    "Planned": "bg-blue-200 text-blue-800",
    "To be Planned": "bg-purple-200 text-purple-800",
    "In progress (W)": "bg-orange-200 text-orange-800",
    "Open": "bg-green-200 text-green-800",
    "Ready for Review": "bg-indigo-200 text-indigo-800",
    "Cancelled": "bg-red-200 text-red-800",
    "Completed": "bg-pink-200 text-pink-800",
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
            "endRow": 1500,
            "rowGroupCols": [],
            "valueCols": [],
            "pivotCols": [],
            "pivotMode": false,
            "groupKeys": [],
            "filterModel": {},
            "sortModel": []
          }
        };
        const response = await fetchData(endpoint, 'POST', auth.authKey, payload);
        setJobs(response); // Adjusted for your API's response structure
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchWorkOrder(isCompleted);
  }, [isCompleted, auth]);


  const columns = useMemo(
    () => [
      {
        Header: t('work_order_list_table_heading_planned_date_text'), accessor: 'date_create',
        Cell: ({ row, value }) => (
          <span className="flex justify-between items-center">
            {new Date(value).toLocaleDateString('nl-BE')}
            {row.original.job_planning_count > 1 && (
              <CalendarClock className="w-5 h-5 cursor-pointer" />
            )}
          </span>
        )
      },
      {
        Header: t('work_order_list_table_heading_reference_text'), accessor: 'id2',
        Cell: ({ row }) => (
          <div className="text-center">
            <span className="text-gray-800 font-medium">
              {row.original.id2}
            </span>
          </div>
        ),
      },
      {
        Header: t('work_order_list_table_heading_name_text'), accessor: 'name',
        Cell: ({ value }) => value.length > 40 ? value.slice(0, 40) + '...' : value
      },
      {
        Header: t('work_order_list_table_heading_address_text'), accessor: 'db_address_street',
        Cell: ({ row }) => (
          <span>
            {row.original.db_address_street} {row.original.db_address_city} {row.original.db_address_zip}
          </span>
        ),
      },
      {
        Header: t('work_order_list_table_heading_type_text'), accessor: 'job_type_name',
        Cell: ({ row }) => (
          <span className={`text-xs font-medium`}>
            {row.original.job_type_name}
          </span>
        ),
      },
      {
        Header: t('work_order_list_table_heading_status_text'), accessor: 'job_status_name',
        Cell: ({ row }) => (
          <span className={`text-xs font-medium pe-2 px-1 pb-0.5 rounded-full ${statusColors[row.original.job_status_name] || "bg-gray-200 text-gray-800"}`}>
            <Circle className='inline w-2 h-2 mr-1 rounded-full' />
            {row.original.job_status_name}
          </span>
        ),
      },
    ],
    [statusColors, t]
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
    return <div className="flex w-full items-center justify-center h-screen bg-gray-100">
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
    <div className="w-full mx-auto p-1 md:p-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">{t("work_order_list_page_title")}</h1>

      {/* Back Button */}
      <button
        onClick={() => navigate('/')} // Navigate back one step in history
        className="flex items-center mb-4 font-semibold text-gray-800"
      >
        <ArrowLeft className="mr-2 w-5 h-5" /> {t("Go Back")}
      </button>

      <div className='shadow-md rounded-lg p-4'>
        {/* Tabs for Open and Completed Jobs */}
        <div className="mb-4">
          <button
            className={`px-4 py-2 mr-2 rounded-md font-semibold ${selectedTab === 'open' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400'}`}
            onClick={() => {
              setSelectedTab('open');
              setIsCompleted(false);
            }}
          >
            {t("work_order_list_toggle_pending_text")}
          </button>

          <button
            className={`px-4 py-2 rounded-md font-semibold ${selectedTab === 'completed' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400'}`}
            onClick={() => {
              setSelectedTab('completed');
              setIsCompleted(true);
            }}
          >
            {t("work_order_list_toggle_completed_text")}
          </button>

        </div>

        <div className="flex items-center mb-1 text-gray-900">
          <BadgeInfo className='mr-2 w-5 h-5 text-gray-400' /> {t("Click the row to view ticket details.")}
        </div>

        {/* Table displaying filtered jobs */}
        <div className="overflow-x-auto">
          <table {...getTableProps()} className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-100">
              {headerGroups.map(headerGroup => (
                <tr {...headerGroup.getHeaderGroupProps()} className="bg-white divide-x divide-gray-300">
                  {headerGroup.headers.map(column => (
                    <th {...column.getHeaderProps(column.getSortByToggleProps())}
                      className="p-2 text-left text-sm font-semibold text-gray-400">
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
                  <tr {...row.getRowProps()} className="hover:bg-gray-200">
                    {row.cells.map((cell, index) => (
                      <td
                        {...cell.getCellProps()}
                        className={`px-2 py-2 text-sm text-gray-800 ${index !== 0 ? 'cursor-pointer' : ''}`}
                        onClick={index !== 0 ? () => navigate(`/workorder/${row.original.id}`) : undefined}
                      >
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

export default ViewWorkOrderList;