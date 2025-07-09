import React, { useMemo, useState, useEffect } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import { fetchData } from '../services/apiService.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { BadgeInfo, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ArrowLeftToLine, ArrowRightToLine, Circle } from 'lucide-react';
import { useTranslation } from "react-i18next";

const ViewTicketList = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('open');
  const { t } = useTranslation('ticketList');

  const statusColors = useMemo(() => ({
    "In progress": "bg-yellow-200 text-yellow-800",
    "Planned": "bg-blue-200 text-blue-800",
    "To be Planned": "bg-purple-200 text-purple-800",
    "Escalated to WO": "bg-orange-200 text-orange-800",
    "Open": "bg-green-200 text-green-800",
    "Ready for Review": "bg-indigo-200 text-indigo-800",
    "Waiting for Parts": "bg-indigo-200 text-indigo-800",
    "Cancelled": "bg-red-200 text-red-800",
    "Completed": "bg-pink-200 text-pink-800",
  }), []);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetchData('https://v1servicedeskapi.wello.solutions/api/TaskView/', 'GET', auth.authKey);
        setTickets(response.value); // Adjusted for your API's response structure
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchTickets();
  }, [auth]);

  const columns = useMemo(
    () => [
      {
        Header: t('tickets_list_table_heading_reference_text'),
        accessor: 'id2',
        Cell: ({ row }) => (
          <span
            className="text-gray-800 font-medium">
            {row.original.id2}
          </span>
        ),
      },
      {
        Header: t('tickets_list_table_heading_created_date_text'), accessor: 'date_create',
        Cell: ({ value }) => new Date(value).toLocaleDateString('nl-BE')
      },
      {
        Header: t('tickets_list_table_heading_name_text'), accessor: 'subject',
        Cell: ({ value }) => value.length > 150 ? value.slice(0, 150) + '...' : value
      },
      {
        Header: t('tickets_list_table_heading_assigned_name_text'), accessor: 'assigned_to_user_fullname',
        Cell: ({ row }) => (
          row.original.assigned_to_user_fullname?.trim() ? row.original.assigned_to_user_fullname : 'Not Assigned'
        ),
      },
      {
        Header: t('tickets_list_table_heading_type_text'), accessor: 'task_type_name',
        Cell: ({ row }) => (
          <span className={`text-xs font-medium`}>
            {row.original.task_type_name}
          </span>
        ),
      },
      {
        Header: t('tickets_list_table_heading_status_text'), accessor: 'task_status_name',
        Cell: ({ row }) => (
          <span className={`text-xs font-medium pe-2 px-1 pb-0.5 rounded-full ${statusColors[row.original.task_status_name] || "bg-gray-200 text-gray-800"}`}>
            <Circle className='inline w-2 h-2 mr-1 rounded-full' />
            {row.original.task_status_name}
          </span>
        ),
      },
    ],
    [statusColors, t]
  );

  const filteredTickets = useMemo(() => {
    return tickets
      .filter(ticket => {
        if (selectedTab === 'open') {
          return (
            ticket.task_status_name === 'Open' ||
            ticket.task_status_name === 'In progress' ||
            ticket.task_status_name === 'Waiting for Parts'
          );
        } else {
          return (
            ticket.task_status_name !== 'Open' &&
            ticket.task_status_name !== 'In progress' &&
            ticket.task_status_name !== 'Waiting for Parts'
          );
        }
      })
      .sort((a, b) => b.id2 - a.id2);
  }, [tickets, selectedTab]);


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
      data: filteredTickets,
      initialState: { pageIndex: 0, pageSize: 10 }, // Set initial page size to 10
    },
    useSortBy,
    usePagination
  );

  if (loading) {
    return <div className="flex w-full items-center w-full justify-center h-screen bg-gray-100">
      <div className="relative">
        <div className="w-20 h-20 border-purple-200 border-2 rounded-full"></div>
        <div className="w-20 h-20 border-purple-700 border-t-2 animate-spin rounded-full absolute left-0 top-0"></div>
      </div>
    </div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-600">Error fetching tickets: {error.message}</div>;
  }

  return (
    <div className="w-full mx-auto p-1 md:p-4">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">{t("tickets_list_page_title")}</h1>

      {/* Back Button */}
      <button
        onClick={() => navigate('/')} // Navigate back one step in history
        className="flex items-center mb-4 font-semibold text-gray-800"
      >
        <ArrowLeft className="mr-2 w-5 h-5" /> {t("Go Back")}
      </button>

      <div className='shadow-md rounded-lg p-4'>
        <div className="flex text-sm mb-4">
          <button
            className={`px-4 py-2 mr-2 rounded-md font-semibold ${selectedTab === 'open' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400'}`}
            onClick={() => setSelectedTab('open')}
          >
            {t("tickets_list_toggle_open_tickets_text")}
          </button>
          <button
            className={`px-4 py-2 rounded-md font-semibold ${selectedTab === 'completed' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400'}`}
            onClick={() => setSelectedTab('completed')}
          >
            {t("tickets_list_toggle_completed_tickets_text")}
          </button>
        </div>

        <div className="flex items-center mb-1 text-gray-900">
          <BadgeInfo className='mr-2 w-5 h-5 text-gray-400' /> {t("Click the row to view ticket details.")}
        </div>
        <div className="overflow-x-auto">
          <table {...getTableProps()} className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-white">
              {headerGroups.map(headerGroup => (
                <tr {...headerGroup.getHeaderGroupProps()} className="bg-white divide-x divide-gray-300">
                  {headerGroup.headers.map(column => (
                    <th {...column.getHeaderProps(column.getSortByToggleProps())}
                      className="p-2 text-left text-sm font-semibold text-gray-400">
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
            <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
              {page.map(row => { // Change from rows to page
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()} className="cursor-pointer hover:bg-gray-200" onClick={() => navigate(`/ticket/${row.original.id}`)}>
                    {row.cells.map(cell => (
                      <td {...cell.getCellProps()} className="p-2 text-xs text-gray-800">
                        {cell.render('Cell')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls - Only show if filteredTickets exceed pageSize (10) */}
        {filteredTickets.length > 10 && (
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

export default ViewTicketList;