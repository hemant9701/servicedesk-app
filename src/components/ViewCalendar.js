import React, { useMemo, useState, useEffect } from 'react';
import { useTable, useSortBy } from 'react-table';
import { fetchData } from '../services/apiService.js';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { BadgeInfo, Loader, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ArrowLeftToLine, ArrowRightToLine, Filter } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { startOfMonth, endOfMonth, format } from 'date-fns';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
const animatedComponents = makeAnimated();

const ViewCalendars = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(new Date());
  const { t } = useTranslation('calendar');

  // Search Filter states
  const [location, setLocation] = useState('');
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [equipmentNames, setEquipmentNames] = useState([]);
  const [selectedEquipmentType, setSelectedEquipmentType] = useState('All');
  const [selectedEquipmentName, setSelectedEquipmentName] = useState('All');
  const [includeArchived, setIncludeArchived] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const onDateChange = async (newDate) => {
    setIsLoading(true);
    setDate(newDate);
    setIsLoading(false);
  };

  useEffect(() => {
    const fetchJobs = async () => {
      const formatDate = (date) => format(date, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
      const dateFrom = formatDate(startOfMonth(currentMonth));
      const dateTo = formatDate(endOfMonth(currentMonth));

      const query = `date_from gt '${dateFrom}' and date_to le '${dateTo}'`;
      const encodedQuery = encodeURIComponent(query);
      const url = `api/JobPlanningView?$filter=${encodedQuery}`;

      try {
        const response = await fetchData(url, 'GET', auth.authKey);
        setContents(response.value);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };
    fetchJobs();
  }, [auth, currentMonth]);

  const handleMonthChange = ({ activeStartDate }) => {
    setCurrentMonth(activeStartDate);
  };

  useEffect(() => {
    const fetchEquiName = async () => {
      try {
        const resname = await fetchData('api/ProjectView?$filter=root_parent_id+ne+00000000-0000-0000-0000-000000000000', 'GET', auth.authKey);
        setEquipmentNames(resname.value);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    const fetchJobsType = async () => {
      try {
        const restype = await fetchData('api/EquipmentFamily', 'GET', auth.authKey);
        setEquipmentTypes(restype.value);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchEquiName();
    fetchJobsType();
  }, [auth]);

  const equipmentNamesOptions = Array.isArray(equipmentNames)
    ? equipmentNames
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((model) => ({
        value: model.id,
        label: model.name,
      }))
    : [];

  const equipmentTypesOptions = Array.isArray(equipmentTypes)
    ? equipmentTypes
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((model) => ({
        value: model.id,
        label: model.name,
      }))
    : [];

  const columns = useMemo(
    () => [
      {
        Header: t('calender_table_heading_reference_text'),
        accessor: 'jobs_id2',
        Cell: ({ row }) => (
          <span
            className="text-zinc-900 text-xs font-semibold" >
            {row.original.jobs_id2}
          </span>
        )
      },
      {
        Header: t('calender_table_heading_hour_text'),
        accessor: 'date_from',
        Cell: ({ value }) => new Date(value).toLocaleString('nl-BE', { hour: 'numeric', minute: 'numeric', hour12: false })
      },
      {
        Header: t('calender_table_heading_name_text'),
        accessor: 'jobs_name',
      },
      {
        Header: t('calender_table_heading_address_text'),
        accessor: ({ db_address_street, db_address_city, db_address_zip }) => `${db_address_street} ${db_address_city} ${db_address_zip}`
      },
      {
        Header: t('calender_table_heading_technician_text'),
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


  const tableInstance = useTable({ columns, data: filteredContents, initialState: { pageIndex: 0, pageSize: 12 }, }, useSortBy);
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
    return <div className="flex w-full items-center justify-center h-screen">
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
    <div className="w-full mx-auto p-6">
      <h1 className="text-zinc-900 text-3xl font-semibold mb-6">{t('calender_page_title')}</h1>

      {/* Back Button */}
      <button
        onClick={() => navigate('/')} // Navigate back one step in history
        className="flex items-center mb-6 font-semibold text-zinc-900 text-base"
      >
        <ArrowLeft className="mr-2 w-5 h-5" /> {t("calender_page_go_back")}
      </button>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Filters Section */}
        <div className="bg-white p-4 rounded-lg shadow-[0_0_10px_2px_rgba(0,0,0,0.1)] w-full lg:w-1/3">
          <h2 className="flex items-center text-zinc-900 text-base font-medium leading-normal pb-6">
            {t('calendar_page_filter_label')} <Filter className="w-5 h-4 ml-4" />
          </h2>
          <div className="mb-4">
            <label htmlFor="location" className="block text-zinc-900 text-base font-normal leading-normal mb-2">
              {t('calendar_page_filter_location_label')}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('calendar_page_filter_location_placeholder')}
              className="w-full px-2 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="equipment-type" className="block text-zinc-900 text-base font-normal leading-normal mb-2">
              {t('calendar_page_filter_equipment_type_label')}
            </label>
            <Select
              components={animatedComponents}
              defaultValue={equipmentTypes[0]}
              options={equipmentTypesOptions}
              value={equipmentTypesOptions.find(option => option.value === equipmentTypes) || null} // match by ID
              onChange={(selected) => setSelectedEquipmentType(selected)}
              placeholder={t("calendar_page_filter_equipment_type_select")}
              className="w-full py-1 text-gray-500 text-base font-normal leading-normal border rounded-md"
              styles={{
                control: (base) => ({
                  ...base,
                  border: 'none',
                  boxShadow: 'none', // also remove focus ring
                }),
                option: (base, state) => ({
                  ...base,
                  color: state.isSelected
                    ? '#ffffff' // white text when selected
                    : state.isFocused
                      ? '#fff' // Tailwind blue-700 on hover
                      : '#374151', // Tailwind gray-700 default
                  backgroundColor: state.isSelected
                    ? '#374151' // Tailwind blue-500
                    : state.isFocused
                      ? '#9CA3AF' // Tailwind blue-100
                      : 'transparent',
                  cursor: 'pointer',
                }),
              }}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="equipment" className="block text-zinc-900 text-base font-normal leading-normal mb-2">
              {t('calendar_page_filter_equipment_label')}
            </label>
            <Select
              components={animatedComponents}
              defaultValue={equipmentNames[0]}
              options={equipmentNamesOptions}
              value={equipmentNamesOptions.find(option => option.value === equipmentNames) || null} // match by ID
              onChange={(selected) => setSelectedEquipmentName(selected)}
              placeholder={t("calendar_page_filter_equipment_select")}
              className="w-full py-1 text-gray-500 text-base font-normal leading-normal border rounded-md"
              styles={{
                control: (base) => ({
                  ...base,
                  border: 'none',
                  boxShadow: 'none', // also remove focus ring
                }),
                option: (base, state) => ({
                  ...base,
                  color: state.isSelected
                    ? '#ffffff' // white text when selected
                    : state.isFocused
                      ? '#fff' // Tailwind blue-700 on hover
                      : '#374151', // Tailwind gray-700 default
                  backgroundColor: state.isSelected
                    ? '#374151' // Tailwind blue-500
                    : state.isFocused
                      ? '#9CA3AF' // Tailwind blue-100
                      : 'transparent',
                  cursor: 'pointer',
                }),
              }}
            />
          </div>
          <button onClick={handleReset} className="w-full border border-gray-900 text-gray-900 px-4 py-2 rounded-md hover:bg-gray-200">
            {t('calendar_page_filter_reset')}
          </button>
        </div>

        {/* Calendar Section */}
        <div>
          <div className="flex items-center mb-1 text-zinc-800 text-sm font-normal px-4 py-2">
            <BadgeInfo className='mr-2 w-5 h-5 text-slate-300' /> {t("calendar_page_calendar_helping_text")}
          </div>
          <div className="bg-white rounded-lg shadow-[0_0_10px_2px_rgba(0,0,0,0.1)]">
            <Calendar
              onChange={onDateChange}
              value={date}
              onActiveStartDateChange={handleMonthChange}
              tileClassName={({ date, view }) => {
                if (view === 'month' && datesWithData.includes(date.toDateString())) {
                  return 'rounded-date';
                }
                return null;
              }}
              calendarType="gregory"
              formatShortWeekday={(locale, date) =>
                date.toLocaleDateString(locale, { weekday: 'short' }).slice(0, 1)
              }
              prev2Label={null}
              next2Label={null}
              className="calendar-component"
            />
          </div>
        </div>
      </div>

      <div className='shadow-[0_0_10px_2px_rgba(0,0,0,0.1)] rounded-lg mt-4'>
        <h2 className="text-gray-900 text-lg font-medium leading-7 px-4 py-2">{date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
        {rows?.length > 0 ? (
          <>
            <div className="flex items-center mb-1 text-zinc-800 text-sm font-normal px-4 py-2">
              <BadgeInfo className='mr-2 w-5 h-5 text-slate-300' /> {t("calendar_page_table_helping_text")}
            </div>
            <div className="overflow-x-visible">
              <table {...getTableProps()} className="min-w-full bg-white divide-y divide-gray-200 border border-gray-300 shadow-lg">
                <thead className="bg-white">
                  {headerGroups.map(headerGroup => (
                    <tr {...headerGroup.getHeaderGroupProps()} className="divide-x divide-gray-300">
                      {headerGroup.headers.map(column => (
                        <th {...column.getHeaderProps(column.getSortByToggleProps())}
                          className="p-2 whitespace-nowrap text-left text-slate-500 text-xs font-medium leading-none">
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
                      !isLoading && (
                        <tr {...row.getRowProps()} className="cursor-pointer hover:bg-gray-200" onClick={() => navigate(`/workorder/${row.original.jobs_id}`)}>
                          {row.cells.map((cell, index) => (
                            <td {...cell.getCellProps()} className={`self-stretch px-1 py-2 text-xs font-normal text-zinc-900 ${index === 0 ? 'text-center' : ''}`}>
                              {cell.render('Cell')}
                            </td>
                          ))}
                        </tr>
                      )
                    );
                  })}
                </tbody>
              </table>
            </div>
            {isLoading && <Loader className="ml-2 text-blue-600 animate-spin" />}
          </>
        ) : (
          <div className='px-4 py-2'>{t("calender_table_no_records_text")}</div>
        )}
        {/* Pagination Controls - Only show if filteredTickets exceed pageSize (10) */}
        {filteredContents.length > 12 && (
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-gray-700">
              {t("calender_table_pagination_page")} {pageIndex + 1} {t("calender_table_pagination_of")} {pageOptions.length}
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
              {[12, 24, 36, 48].map(size => (
                <option key={size} value={size}>
                  {t("calender_table_pagination_show")} {size}
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