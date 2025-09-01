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
    "In progress": "bg-yellow-100 text-yellow-600",
    "Planned": "bg-blue-100 text-blue-600",
    "To be Planned": "bg-purple-100 text-purple-600",
    "Escalated to WO": "bg-orange-100 text-orange-600",
    "Open": "bg-green-100 text-green-600",
    "Ready for Review": "bg-indigo-100 text-indigo-600",
    "Waiting for Parts": "bg-indigo-100 text-indigo-600",
    "Cancelled": "bg-red-100 text-red-600",
    "Completed": "bg-pink-100 text-pink-600",
  }), []);

  const statusDotColors = useMemo(() => ({
    "In progress": "bg-yellow-600 text-yellow-600",
    "Planned": "bg-blue-600 text-blue-600",
    "To be Planned": "bg-purple-600 text-purple-600",
    "Escalated to WO": "bg-orange-600 text-orange-600",
    "Open": "bg-green-600 text-green-600",
    "Ready for Review": "bg-indigo-600 text-indigo-600",
    "Waiting for Parts": "bg-indigo-600 text-indigo-600",
    "Cancelled": "bg-red-600 text-red-600",
    "Completed": "bg-pink-600 text-pink-600",
  }), []);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetchData('api/TaskView/', 'GET', auth.authKey);
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
          <div className="text-center">
            <span className="text-gray-800 font-medium">
              {row.original.id2}
            </span></div>
        ),
      },
      {
        Header: t('tickets_list_table_heading_created_date_text'), accessor: 'date_create',
        Cell: ({ value }) => new Date(value).toLocaleDateString('nl-BE')
      },
      {
        Header: t('tickets_list_table_heading_name_text'), accessor: 'subject',
        Cell: ({ value }) => value.length > 30 ? value.slice(0, 30) + '...' : value
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
          <span className={`text-xs min-w-max inline-flex items-center font-medium pe-3 px-2 pb-1 pt-0.5 rounded-full ${statusColors[row.original.task_status_name] || "bg-gray-200 text-gray-800"}`}>
            <Circle className={`inline w-2 h-2 mr-1 rounded-full ${statusDotColors[row.original.task_status_name] || "bg-gray-800 text-gray-800"}`} /> {row.original.project_status_name}
            {row.original.task_status_name}
          </span>
        ),
      },
    ],
    [statusColors, statusDotColors, t]
  );

  const filteredTickets = useMemo(() => {
    return tickets
      .filter(ticket => {
        if (selectedTab === 'open') {
          return (
            ticket.task_status_id === 'f3507920-d746-4d1c-b81b-c2bf291830c5' ||
            ticket.task_status_id === '4c1a28dc-e213-429d-bbd0-2595814ca9fc' ||
            ticket.task_status_id === 'Waiting for Parts'
          );
        } else {
          return (
            ticket.task_status_id !== 'f3507920-d746-4d1c-b81b-c2bf291830c5' &&
            ticket.task_status_id !== '4c1a28dc-e213-429d-bbd0-2595814ca9fc' &&
            ticket.task_status_id !== 'Waiting for Parts'
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
      initialState: { pageIndex: 0, pageSize: 12 }, // Set initial page size to 10
    },
    useSortBy,
    usePagination
  );

  if (loading) {
    return <div className="flex w-full items-center justify-center h-screen">
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
      <h1 className="text-zinc-900 text-3xl font-semibold mb-6">{t("tickets_list_page_title")}</h1>

      {/* Back Button */}
      <button
        onClick={() => navigate('/')} // Navigate back one step in history
        className="flex items-center mb-6 font-semibold text-zinc-900 text-base"
      >
        <ArrowLeft className="mr-2 w-5 h-5" /> {t("tickets_list_page_go_back")}
      </button>

      <div className='shadow-md rounded-lg'>
        <div className="flex text-lg mb-4">
          <button
            className={`px-4 py-2 mr-2 font-semibold leading-7 ${selectedTab === 'open' ? 'text-gray-900 border-b-2 border-zinc-800' : 'text-slate-500'}`}
            onClick={() => setSelectedTab('open')}
          >
            {t("tickets_list_toggle_open_tickets_text")}
          </button>
          <button
            className={`px-4 py-2 font-semibold leading-7 ${selectedTab === 'completed' ? 'text-gray-900 border-b-2 border-zinc-800' : 'text-slate-500'}`}
            onClick={() => setSelectedTab('completed')}
          >
            {t("tickets_list_toggle_completed_tickets_text")}
          </button>
        </div>

        <div className="flex items-center mb-1 text-zinc-800 text-sm font-normal px-4 py-2">
          <BadgeInfo className='mr-2 w-5 h-5 text-slate-300' /> {t("tickets_list_page_helping_text")}
        </div>
        <div className="overflow-x-auto">
          <table {...getTableProps()} className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-white">
              {headerGroups.map(headerGroup => (
                <tr {...headerGroup.getHeaderGroupProps()} className="bg-white divide-x divide-gray-300">
                  {headerGroup.headers.map(column => (
                    <th {...column.getHeaderProps(column.getSortByToggleProps())}
                      className="p-2 whitespace-nowrap text-slate-500 text-xs font-medium leading-none">
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
                    {row.cells.map((cell, index) => (
                      <td {...cell.getCellProps()} className="self-stretch px-1 py-2 text-xs font-normal text-zinc-900">
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
        {filteredTickets.length > 12 && (
          <div className="flex items-center justify-between p-4">
            <span className="text-xs text-slate-700">
              {t("ticket_list_table_pagination_page")} {pageIndex + 1} {t("ticket_list_table_pagination_of")} {pageOptions.length}
            </span>
            <div>
              <button onClick={() => gotoPage(0)} disabled={!canPreviousPage} className="py-0.5 px-1 md:px-2 mr-1 text-slate-700 rounded-md border border-slate-700 disabled:border-gray-700">
                <ArrowLeftToLine className="w-4" />
              </button>
              <button onClick={() => previousPage()} disabled={!canPreviousPage} className="py-0.5 px-1 md:px-2 mr-1 text-slate-700 rounded-md border border-slate-700 disabled:border-gray-700">
                <ArrowLeft className="w-4" />
              </button>
              <button onClick={() => nextPage()} disabled={!canNextPage} className="py-0.5 px-1 md:px-2 mr-1 text-slate-700 rounded-md border border-slate-700 disabled:border-gray-700">
                <ArrowRight className="w-4" />
              </button>
              <button onClick={() => gotoPage(pageOptions.length - 1)} disabled={!canNextPage} className="py-0.5 px-1 md:px-2 mr-1 text-slate-700 rounded-md border border-slate-700 disabled:border-gray-700">
                <ArrowRightToLine className="w-4" />
              </button>
            </div>
            <select name="table_pagination" id="table_pagination" value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="ml-1 p-1 md:p-1 text-xs text-slate-700 border border-slate-700 rounded-md max-w-32">
              {[12, 24, 36, 48].map(size => (
                <option key={size} value={size}>
                  {t("ticket_list_table_pagination_show")} {size}
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