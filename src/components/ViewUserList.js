import React, { useMemo, useState, useEffect } from 'react';
import { useTable, usePagination } from 'react-table';
import{ fetchDocuments } from '../services/apiServiceDocuments';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { ArrowLeft, ArrowRight, ArrowLeftToLine, ArrowRightToLine, Lock } from 'lucide-react';
import { useTranslation } from "react-i18next";

const ViewUserList = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation('users');

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const response = await fetchDocuments('api/Contact?$filter=e_login+ne+%27%27', 'GET', auth.authKey);
        setContacts(response.value); // Adjusted for your API's response structure
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchContact();
  }, [auth]);

  const columns = useMemo(
    () => [
      { Header: t('user_list_first_name_text'), accessor: 'firstname' },
      { Header: t('user_list_last_name_text'), accessor: 'lastname' },
      {
        Header: t('user_list_email_text'), accessor: 'email',
        Cell: ({ row }) => (
          <a
            href={`mailto:${row.original.email}`}
            className="me-2 text-left no-underline"
            rel="noreferrer"
          >
            {row.original.email}
          </a>
        ),
      },
      { Header: t('user_list_tel_text'), accessor: 'mobile' },
    ],
    [t]
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
      data: contacts,
      initialState: { pageIndex: 0, pageSize: 10 }, // Set initial page size to 10
    },
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
    return <div className="text-center mt-10 text-red-600">Error fetching users: {error.message}</div>;
  }

  return (
    <div className="w-full mx-auto p-6">
      <h1 className="text-zinc-900 text-3xl font-semibold mb-6">{t('user_list_page_title')}</h1>

      <button
        onClick={() => navigate('/')} // Navigate back one step in history
        className="flex items-center mb-6 font-semibold text-zinc-900 text-base"
      >
        <ArrowLeft className="mr-2 w-5 h-5" /> {t("user_list_page_go_back")}
      </button>


      <nav className="mb-6 text-right">
        <Link to="/update-password" className="text-base font-medium no-underline text-zinc-900 border border-zinc-900 px-6 py-3 rounded-lg hover:bg-zinc-900 hover:text-white">
          {t('user_list_password_update_text')} <Lock className="ml-2 w-6 h-6 inline" />
        </Link>
      </nav>

      <div className='shadow-md rounded-lg'>
        {/* Table displaying users */}
        <div className="overflow-x-auto">
          <table {...getTableProps()} className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-white">
              {headerGroups.map(headerGroup => (
                <tr {...headerGroup.getHeaderGroupProps()} className="bg-white divide-x divide-gray-300">
                  {headerGroup.headers.map(column => (
                    <th {...column.getHeaderProps()} className="px-2 py-3 text-left whitespace-nowrap text-slate-500 text-xs font-medium leading-none">
                      {column.render('Header')}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
              {page.map(row => { // Change from rows to page
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()} className="hover:bg-gray-200">
                    {row.cells.map(cell => (
                      <td {...cell.getCellProps()} className="self-stretch px-1 py-2.5 text-xs font-normal text-zinc-900">
                        {cell.render('Cell')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Show pagination controls only if there are more than 10 records */}
        {contacts.length > 12 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-slate-700">
              {t('user_list_table_pagination_page')} {pageIndex + 1} {t('user_list_table_pagination_of')} {pageOptions.length}
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
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="ml-1 p-1 md:p-1 text-xs text-slate-700 border border-slate-700 rounded-md max-w-32">
              {[12, 24, 36, 48].map(size => (
                <option key={size} value={size}>
                  {t('user_list_table_pagination_show')} {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewUserList;