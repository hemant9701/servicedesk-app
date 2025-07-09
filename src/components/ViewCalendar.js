import React, { useMemo, useState, useEffect } from 'react';
import { useTable, useSortBy } from 'react-table';
import { fetchData } from '../services/apiService.js';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { BadgeInfo, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ArrowLeftToLine, ArrowRightToLine, ListFilterIcon } from 'lucide-react';
import { useTranslation } from "react-i18next";

const ViewCalendars = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(new Date());
  const { t } = useTranslation('calender');

  // Search Filter states
  const [location, setLocation] = useState('');
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [equipmentNames, setEquipmentNames] = useState([]);
  const [selectedEquipmentType, setSelectedEquipmentType] = useState('All');
  const [selectedEquipmentName, setSelectedEquipmentName] = useState('All');
  const [includeArchived, setIncludeArchived] = useState(false);

  const onDateChange = (newDate) => {
    setDate(newDate);
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetchData('https://v1servicedeskapi.wello.solutions/api/JobPlanningView', 'GET', auth.authKey);
        setContents(response.value);

        const restype = await fetchData('https://v1servicedeskapi.wello.solutions/api/EquipmentFamily', 'GET', auth.authKey);
        setEquipmentTypes(restype.value);

        const resname = await fetchData('https://v1servicedeskapi.wello.solutions/api/ProjectView?$filter=root_parent_id+ne+00000000-0000-0000-0000-000000000000', 'GET', auth.authKey);
        setEquipmentNames(resname.value);

        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchJobs();
  }, [auth]);

  const columns = useMemo(
    () => [
      {
        Header: t('Ref'),
        accessor: 'jobs_id2',
        Cell: ({ row }) => (
          <span
            className="text-gray-800 font-medium" >
            {row.original.jobs_id2}
          </span>
        )
      },
      {
        Header: t('Hour'),
        accessor: 'date_from',
        Cell: ({ value }) => new Date(value).toLocaleString('nl-BE', { hour: 'numeric', minute: 'numeric', hour12: false })
      },
      {
        Header: t('Name'),
        accessor: 'jobs_name',
      },
      {
        Header: t('Address'),
        accessor: ({ db_address_street, db_address_city, db_address_zip }) => `${db_address_street} ${db_address_city} ${db_address_zip}`
      },
      {
        Header: t('Technician'),
        accessor: ({ user_firstname, user_lastname }) => `${user_firstname} ${user_lastname}`
      }
    ],
    [t]
  );

  const { filteredContents, datesWithData } = useMemo(() => {
    const selectedDateStr = date.toDateString();

    // Filter for the selected date and other criteria
    const filtered = contents.filter(content => {
      const contentDateStr = new Date(content.date_from).toDateString();
      const matchesDate = contentDateStr === selectedDateStr;
      const matchesLocation = location ? content.db_address_street.toLowerCase().includes(location.toLowerCase()) : true;
      const matchesEquipmentType = selectedEquipmentType !== 'All' ? content.project_equipment_family_id === selectedEquipmentType : true;
      const matchesEquipmentName = selectedEquipmentName !== 'All' ? content.project_equipment_family_id === selectedEquipmentName : true;
      const matchesArchived = includeArchived ? true : content.project_status_name !== 'Archived';

      return matchesDate && matchesLocation && matchesEquipmentType && matchesEquipmentName && matchesArchived;
    });

    // Calculate unique dates with data points, ignoring selectedDateStr filtering
    const uniqueDatesWithData = [...new Set(
      contents
        .filter(content => {
          const matchesLocation = location ? content.db_address_street.toLowerCase().includes(location.toLowerCase()) : true;
          const matchesEquipmentType = selectedEquipmentType !== 'All' ? content.project_equipment_family_id === selectedEquipmentType : true;
          const matchesEquipmentName = selectedEquipmentName !== 'All' ? content.project_equipment_family_id === selectedEquipmentName : true;
          const matchesArchived = includeArchived ? true : content.project_status_name !== 'Archived';

          return matchesLocation && matchesEquipmentType && matchesEquipmentName && matchesArchived;
        })
        .map(content => new Date(content.date_from).toDateString())
    )];

    return { filteredContents: filtered, datesWithData: uniqueDatesWithData };
  }, [contents, location, date, selectedEquipmentType, selectedEquipmentName, includeArchived]);


  const tableInstance = useTable({ columns, data: filteredContents, initialState: { pageIndex: 0, pageSize: 10 }, }, useSortBy);
  const { 
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows, // Use page instead of rows for pagination
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = tableInstance;

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
    setDate(new Date());
    setSelectedEquipmentType('All');
    setSelectedEquipmentName('All');
    setIncludeArchived(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">{t('Calendar')}</h1>

      {/* Back Button */}
      <button
        onClick={() => navigate('/')} // Navigate back one step in history
        className="flex items-center mb-4 font-semibold text-gray-800"
      >
        <ArrowLeft className="mr-2 w-5 h-5" /> {t("Go Back")}
      </button>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Filters Section */}
        <div className="bg-white p-6 rounded-lg shadow-[0_0_10px_2px_rgba(0,0,0,0.1)] w-full lg:w-1/3">
          <h2 className="flex items-center text-xl font-semibold text-gray-700 mb-4">{t('Filters')} <ListFilterIcon className="w-4 h-4 ml-4" /></h2>
          <div className="mb-4">
            <label htmlFor="location" className="block font-semibold text-gray-700 mb-2">
              {t('Location')}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('Enter three letters to initiate search')}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="equipment-type" className="block font-semibold text-gray-700 mb-2">{t('Equipment Type')}</label>
            <select
              id="equipment-type"
              value={selectedEquipmentType}
              onChange={(e) => setSelectedEquipmentType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
            >
              <option value="All">{t('All equipment types')}</option>
              {Array.isArray(equipmentTypes) && equipmentTypes
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="equipment" className="block font-semibold text-gray-700 mb-2">{t('Equipment')}</label>
            <select
              id="equipment"
              value={selectedEquipmentName}
              onChange={(e) => setSelectedEquipmentName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All equipments</option>
              {Array.isArray(equipmentNames) && equipmentNames
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((type) => (
                  <option key={type.equipment_family_id} value={type.equipment_family_id}>{type.equipment_family_name} - {type.name} - {type.db_address_street}</option>
                ))}
            </select>
          </div>
          <button onClick={handleReset} className="w-full border border-gray-900 text-gray-900 px-4 py-2 rounded-md hover:bg-gray-200">
            {t('Reset Filters')}
          </button>
        </div>

        {/* Calendar Section */}
        <div>
          <div className="flex items-center mb-2 text-gray-900">
              <BadgeInfo className='mr-2 w-5 h-5 text-gray-400' /> {t("Rounded outline represents WO.")}
          </div>
          <div className="bg-white rounded-lg shadow-[0_0_10px_2px_rgba(0,0,0,0.1)]">
            <Calendar
              onChange={onDateChange}
              value={date}
              tileClassName={({ date, view }) => {
                if (view === 'month' && datesWithData.includes(date.toDateString())) {
                  return 'rounded-date';
                }
                return null;
              }}
              calendarType="gregory" // Week starts on Sunday
              formatShortWeekday={(locale, date) => date.toLocaleDateString(locale, { weekday: 'short' }).slice(0, 1)}
              prev2Label={null}  // Remove double prev
              next2Label={null}  // Remove double next
              className="calendar-component"
            />
          </div>
        </div>
      </div>

      <div className='shadow-[0_0_10px_2px_rgba(0,0,0,0.1)] rounded-lg p-4 mt-4'>
        <h2 className="text-xl font-semibold text-gray-700">{date.toLocaleDateString('en-US', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</h2>
        {rows?.length > 0 ? (
          <>
            <div className="flex items-center mt-4 mb-2 text-gray-900">
            <BadgeInfo className='mr-2 w-5 h-5 text-gray-400' /> {t("Click the row to view ticket details.")}
            </div>
            <div className="overflow-x-visible">
              <table {...getTableProps()} className="min-w-full bg-white divide-y divide-gray-300 border border-gray-300 shadow-lg">
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
                <tbody {...getTableBodyProps()} className="bg-white">
                  {rows.map(row => {
                    prepareRow(row);
                    return (
                      <tr {...row.getRowProps()} className="cursor-pointer hover:bg-gray-200" onClick={() => navigate(`/workorder/${row.original.jobs_id}`)}>
                        {row.cells.map(cell => (
                          <td {...cell.getCellProps()} className="px-2 py-2 text-sm text-gray-800">
                            {cell.render('Cell')}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div>{t("No records!!!")}</div>
        )}
        {/* Pagination Controls - Only show if filteredTickets exceed pageSize (10) */}
        {filteredContents.length > 10 && (
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

export default ViewCalendars;