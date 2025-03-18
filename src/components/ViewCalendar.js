import React, { useMemo, useState, useEffect } from 'react';
import { useTable } from 'react-table';
import { fetchData } from '../services/apiService.js';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from "lucide-react";

const ViewCalendars = () => {
  const navigate = useNavigate(); 
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(new Date());

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
        const response = await fetchData('https://v1servicedeskapi.wello.solutions/api/JobPlanningView', 'GET');
        setContents(response.value);

        const restype = await fetchData('https://v1servicedeskapi.wello.solutions/api/EquipmentFamily', 'GET');
        setEquipmentTypes(restype.value);

        const resname = await fetchData('https://v1servicedeskapi.wello.solutions/api/ProjectView?$filter=root_parent_id+ne+00000000-0000-0000-0000-000000000000', 'GET');
        setEquipmentNames(resname.value);

        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: 'Hour',
        accessor: 'date_from',
        // Cell: ({ value }) => {
        //   const date = new Date(value);
        //   return `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
        // }
        Cell: ({ value }) => new Date(value).toLocaleString('nl-BE', { hour: 'numeric', minute: 'numeric', hour12: false })
      },
      {
        Header: 'Ref',
        accessor: 'jobs_id2',
        Cell: ({ row }) => (
          <button
          onClick={() =>  navigate(`/workorder/${row.original.jobs_id}`)} 
          className="bg-blue-100 text-blue-800 font-medium me-2 px-2.5 py-0.5 rounded-sm border border-blue-400" >
            {row.original.jobs_id2}
          </button>
        )
      },
      {
        Header: 'Name',
        accessor: 'jobs_name',
        Cell: ({ row }) => (
          <button
          onClick={() =>  navigate(`/workorder/${row.original.jobs_id}`)} 
          className="text-blue-800 font-medium me-2 text-left" >
            {row.original.jobs_name}
          </button>
        )
      },
      { Header: 'Address', 
        accessor: ({ db_address_street, db_address_city, db_address_zip }) => `${db_address_street} ${db_address_city} ${db_address_zip}`
      },
      {
        Header: 'Technician',
        accessor: ({ user_firstname, user_lastname }) => `${user_firstname} ${user_lastname}`
      }
    ],
    [navigate]
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
  

  const tableInstance = useTable({ columns, data: filteredContents });
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;

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
    setDate(new Date());
    setSelectedEquipmentType('All');
    setSelectedEquipmentName('All');
    setIncludeArchived(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className='flex'>
        {/* Back Button */}
        <button
          onClick={() => navigate('/')} // Navigate back one step in history
          className="mb-6 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-800 mb-6 ml-4">Calendar</h1>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg w-full lg:w-1/3">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Filters</h2>
          <div className="mb-4">
            <label htmlFor="location" className="block text-gray-700 mb-2">
              Location <small className="text-gray-500">(Enter three letters to initiate search)</small>
            </label>
            <input 
              type="text" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)} 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="equipment-type" className="block text-gray-700 mb-2">Equipment Type</label>
            <select 
              id="equipment-type" 
              value={selectedEquipmentType} 
              onChange={(e) => setSelectedEquipmentType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All equipment types</option>
              {Array.isArray(equipmentTypes) && equipmentTypes
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="equipment" className="block text-gray-700 mb-2">Equipment</label>
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
          <button onClick={handleReset} className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
            Reset Filters
          </button>
        </div>

        {/* Calendar Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg w-full lg:w-2/3">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Select a Date</h2>
          <Calendar 
            onChange={onDateChange}
            value={date}
            tileContent={({ date }) => 
              datesWithData.includes(date.toDateString()) 
                ? <span className="bg-indigo-600 block w-4 h-2 mx-auto mt-1 rounded-full"></span> 
                : null
            }
            className="calendar-component"
          />
        </div>
      </div>

      <h2 className="text-xl font-semibold text-gray-700 my-4">{date.toDateString()}</h2>
      {/* Table Section */}
      <div className="overflow-x-auto mt-6">
        <table {...getTableProps()} className="min-w-full bg-white divide-y divide-gray-200 border border-gray-300 shadow-lg">
          <thead className="bg-gray-100">
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps()} className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    {column.render('Header')}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
            {rows.map(row => {
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
    </div>
  );
};

export default ViewCalendars;