import React, { useMemo, useState, useEffect } from 'react';
import { useTable, usePagination } from 'react-table';
import { fetchData } from '../services/apiService.js';
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { useNavigate } from 'react-router-dom';

const CreateTicket = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [step, setStep] = useState(1);
  const [ticketDetails, setTicketDetails] = useState({
    ticketType: '',
    severity: '',
    problemDescription: '',
    file: null
  });
  const isImageFile = ticketDetails?.file?.type?.startsWith("image/");

  const [ticketTypes, setTicketTypes] = useState([]); 
  const [severities, setSeverities] = useState([]); 

  const [location, setLocation] = useState('');
  const [keyword, setKeyword] = useState('');
  const [brand, setBrand] = useState('All');
  const [model, setModel] = useState('All');
  const [status, setStatus] = useState('All');
  const [includeArchived, setIncludeArchived] = useState(false);

  const [ticketName, setTicketName] = useState('');

  const [userID, setUserID] = useState();

  // Missing state variables
  const [date, setDate] = React.useState(new Date())
  const [hours, setHours] = React.useState(0)
  const [minutes, setMinutes] = React.useState(0)
  const [prefersDate, setPrefersDate] = useState(false); // Toggle for showing the date picker

  useEffect(() => { 
    const currentDate = new Date(); 
    setHours(currentDate.getHours()); 
    setMinutes(currentDate.getMinutes()); 
  }, []);

  const incrementHours = () => setHours(h => h === 23 ? 0 : h + 1)
  const decrementHours = () => setHours(h => h === 0 ? 23 : h - 1)
  const incrementMinutes = () => setMinutes(m => m === 59 ? 0 : m + 1)
  const decrementMinutes = () => setMinutes(m => m === 0 ? 59 : m - 1)

  const uniqueBrands = [...new Set(contacts.map(contact => contact.equipment_brand_name))];
  const uniqueModels = [...new Set(contacts.map(contact => contact.equipment_model_name))];
  const uniqueStatuses = [...new Set(contacts.map(contact => contact.project_status_name))];

  const steps = [
    { id: 1, label: "Installation" },
    { id: 2, label: "Ticket Description" },
    { id: 3, label: "Date & Time" },
    { id: 4, label: "Review & Submit" },
  ];

  useEffect(() => {
    const fetchInstallations = async () => {
      try {
        const response = await fetchData('https://v1servicedeskapi.wello.solutions/api/ProjectView', 'GET');
        setContacts(response.value || []); // Adjusted for your API's response structure
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };
    fetchInstallations();
  }, []);

  const taskType = async () => {
    try {
      const data = await fetchData('https://servicedeskapi.wello.solutions/api/TaskType?$orderby=is_default,sequence', 'GET');
      setTicketTypes(data.value);
    } catch (err) {
      setError(err);
    }
  }

  const taskSeverity = async () => {
    try {
      const data = await fetchData('https://V1servicedeskapi.wello.solutions/api/TaskPriority?$orderby=is_default,sequence', 'GET');
      setSeverities(data.value);
    } catch (err) {
      setError(err);
    }
  }

 
    const fetchUserID = async () => {
      try {
        const auth = JSON.parse(sessionStorage.getItem('auth'));
        const responseUser = await fetchData(`https://V1servicedeskapi.wello.solutions/api/Contact?$filter=e_login+eq+'${encodeURIComponent(auth.email)}'`, 'GET');
        setUserID(responseUser.value[0]);
      } catch (err) {
        setError(err);
      }
    }
    
  

  // Set the first ticketType when ticketTypes array changes
  useEffect(() => {
    if (ticketTypes.length > 0 && !ticketDetails.ticketType) {
      setTicketDetails((prev) => ({
        ...prev,
        ticketType: ticketTypes[0].name,
      }));
    }
  }, [ticketTypes, ticketDetails]);

  // Set the first severity when severities array changes
  useEffect(() => {
    if (severities.length > 0 && !ticketDetails.severity) {
      setTicketDetails((prev) => ({
        ...prev,
        severity: severities[0].name,
      }));
    }
  }, [severities, ticketDetails]);

  const handleInputChange = (key, value) => {
    setTicketDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  useEffect(() => {
    if (selectedRow && selectedRow.name && selectedRow.db_address_street) {
      setTicketName(`${selectedRow.name} - ${selectedRow.db_address_street}`);
      taskType();
      taskSeverity();
      fetchUserID();
    }
  }, [selectedRow]);

  const handleNameChange = (e) => {
    setTicketName(e.target.value);
  };

  const columns = useMemo(
    () => [
      { Header: 'Name', accessor: 'name' },
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

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
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
      initialState: { pageIndex: 0 },
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
    return <div className="text-center text-red-600">Error fetching data: {error.message}</div>;
  }

  const handleReset = () => {
    setLocation('');
    setKeyword('');
    setBrand('All');
    setModel('All');
    setStatus('All');
    setIncludeArchived(false);
  };

  const handleRowClick = (row) => {
    setSelectedRow(row.original);
    setStep(2);
  };




  const handleSubmitTicket = async () => {
    const selectedTaskType = ticketTypes.find(type => type.name === ticketDetails.ticketType); // Assuming you're choosing from a list
    const selectedSeverity = severities.find(severity => severity.name === ticketDetails.severity); // Assuming you're choosing from a list
  
    const payloadData = {
      "contact_id": userID.id, 
      "company_id": selectedRow.company_id, 
      "db_address_id": selectedRow.db_address_id,
      "to_db_table_id": "78154eca-ded3-490f-a47d-543e38c0e63d",
      "to_id_in_table": selectedRow.id, 
      "task_type_id": selectedTaskType.id, 
      "task_priority_id": selectedSeverity.id, 
      "subject": ticketName, 
      "remark": ticketDetails.problemDescription, 
      "date_suggested_by_company": `${date.toDateString()} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`, 
      "date_closed": "1980-01-01", 
      "date_update": "1980-01-01", 
      "date_start": new Date().toISOString(),  // Use ISO string if needed
      "date_create": new Date().toISOString() // Use ISO string if needed
    };
  
    try {
      console.log('Payload Data:', payloadData);
      // Uncomment when ready to call the API
      const response = await fetchData('https://V1servicedeskapi.wello.solutions/api/Task', 'POST', payloadData);
      
      setLoading(false);
      alert('Ticket created successfully!');

      if (response) {
        // Post an image using the response id from the ticket creation
        await postImage(response.id, response.id2);
      }
      
      // Reset state after submission
      setStep(1); // Reset to the first step
      setSelectedRow(null);
      setTicketDetails({});
      setTicketName(''); // Make sure ticketName is cleared
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError(err);
      setLoading(false);
    }
  };

  const postImage = async (ticketId, ticketId2) => {
    try {
      const imagePayload = new FormData();
      const selectedFile = ticketDetails.file;
      imagePayload.append("file", selectedFile);
  
      const imageResponse = await fetchData(
        `https://V1servicedeskapi.wello.solutions/api/dbfile/add?db_table_id=448260E5-7A17-4381-A254-0B1D8FE53947&id_in_table=${ticketId}&description=Uploaded%20by%20Service%20Desk%20-%20${ticketId2}`,
         'POST', imagePayload
      );
  
      console.log(imageResponse);
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Failed to upload image.");
    }
  };
  


  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className='flex'>
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)} // Navigate back one step in history
          className="mb-6 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
        >
          {'<'}
        </button>
        <h1 className="text-2xl font-semibold text-gray-800 mb-6 ml-4">Create New Ticket</h1>
      </div>

      {/* Step Indicator Bar */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((item) => (
          <div key={item.id} className="flex-1 text-center">
            <div className={`flex items-center justify-center w-10 h-10 mx-auto rounded-full ${step >= item.id ? "bg-indigo-500 text-white" : "bg-gray-300 text-gray-600"
              }`}>
              {item.id}
            </div>
            <p
              className={`text-sm font-medium mt-2 ${step >= item.id ? "text-indigo-600" : "text-gray-500"
                }`}
            >
              {item.label}
            </p>
            {item.id <= steps.length && (
              <div className={`h-1 mx-auto w-full ${step >= item.id ? "bg-indigo-500" : "bg-gray-300"
                }`}></div>
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <>
          {/* Search Filter UI */}
          <div className="mb-6 p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">1. Installation</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter location"
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Keyword</label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Type a text"
                  className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Brand</label>
                <select value={brand} onChange={(e) => setBrand(e.target.value)} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="All">All</option>
                  {uniqueBrands.map((brand) => (
                    brand && <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Model</label>
                <select value={model} onChange={(e) => setModel(e.target.value)} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="All">All</option>
                  {uniqueModels.map((model) => (
                    model && <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="All">All</option>
                  {uniqueStatuses.map((status) => (
                    status && <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeArchived}
                  onChange={() => setIncludeArchived(!includeArchived)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Include archived equipment</label>
              </div>
              <button onClick={handleReset} className="bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-400">
                Reset
              </button>
            </div>
          </div>

          {/* Contacts Table */}
          <div className="overflow-x-auto mt-6">
            <table {...getTableProps()} className="min-w-full bg-white border border-gray-300 rounded-lg shadow-lg">
              <thead>
                {headerGroups.map((headerGroup, headerIndex) => (
                  <tr {...headerGroup.getHeaderGroupProps()} key={headerIndex} className="bg-gray-200">
                    {headerGroup.headers.map((column, columnIndex) => (
                      <th {...column.getHeaderProps()} key={columnIndex} className="border px-4 py-2 text-left text-sm font-medium text-gray-700">
                        {column.render('Header')}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody {...getTableBodyProps()}>
                {page.map((row, i) => {
                  prepareRow(row);
                  return (
                    <tr {...row.getRowProps()} onClick={() => handleRowClick(row)} key={i} className="hover:bg-gray-100 cursor-pointer">
                      {row.cells.map((cell, cellIndex) => (
                        <td {...cell.getCellProps()} key={cellIndex} className="border px-4 py-2 text-sm text-gray-600">
                          {cell.render('Cell')}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls - Only show if filteredTickets exceed pageSize (10) */}
            {filteredContacts.length > 10 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-700">
                  Page {pageIndex + 1} of {pageOptions.length}
                </span>
                <div>
                  <button onClick={() => gotoPage(0)} disabled={!canPreviousPage} className="py-2 px-4 mr-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-300">
                    {'<<'}
                  </button>
                  <button onClick={() => previousPage()} disabled={!canPreviousPage} className="py-2 px-4 mr-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-300">
                    {'<'}
                  </button>
                  <button onClick={() => nextPage()} disabled={!canNextPage} className="py-2 px-4 mr-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-300">
                    {'>'}
                  </button>
                  <button onClick={() => gotoPage(pageOptions.length - 1)} disabled={!canNextPage} className="py-2 px-4 bg-indigo-600 text-white rounded-md disabled:bg-gray-300">
                    {'>>'}
                  </button>
                </div>
                <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="ml-2 p-2 border border-gray-300 rounded-md max-w-32">
                  {[10, 20, 30, 50].map(size => (
                    <option key={size} value={size}>
                      Show {size}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </>
      )}

      {step === 2 && selectedRow && (
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">2. Ticket Description</h2>

          <form onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Ticket Type and Severity</label>
              <div className="flex gap-4">
                <select
                  value={ticketDetails.ticketType}
                  onChange={(e) => handleInputChange('ticketType', e.target.value)}
                  className="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                >
                  {ticketTypes.map((ticketType, index) => ( 
                    <option key={index} value={ticketType.name}> {ticketType.name} </option>
                  ))}
                </select>

                <select
                  value={ticketDetails.severity}
                  onChange={(e) => handleInputChange('severity', e.target.value)}
                  className="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                >
                  {severities.map((severity, index) => ( 
                    <option key={index} value={severity.name}> {severity.name} </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <textarea
                value={ticketName}
                onChange={handleNameChange}
                className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Describe the Problem</label>
              <textarea
                onChange={(e) => handleInputChange('problemDescription', e.target.value)}
                className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* File Upload Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Add Pictures and Documents (max 5MB)</label>
              <input
                type="file"
                onChange={(e) =>
                  handleInputChange('file', e.target.files ? e.target.files[0] : null)
                }
                className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button type="submit" className="bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-600 mr-2">
                Confirm & Proceed
              </button>
              <button onClick={() => setStep(1)} className="bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-400">
                Back
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 3 && (
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">3. Select Preferred Intervention Date & Time</h2>
          <span className="text-sm font-medium text-gray-700 mr-4">Date and Time</span>
          <form onSubmit={(e) => { e.preventDefault(); setStep(4); }}>
            {/* Yes/No Toggle for Preferred Date & Time */}
            <div className="mb-4 flex items-center">
              <span className="text-sm text-gray-600 mr-2">Do you have a preferred date and time for the intervention?</span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPrefersDate(true)}
                  className={`py-1 px-3 rounded-md font-semibold ${prefersDate ? "bg-indigo-600 text-white" : "bg-gray-300 text-gray-800"}`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setPrefersDate(false)}
                  className={`py-1 px-3 rounded-md font-semibold ${!prefersDate ? "bg-indigo-600 text-white" : "bg-gray-300 text-gray-800"}`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Calendar Picker */}
            {prefersDate && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="react-calendar-wrapper">
                  <h4 className='font-semibold mb-4'>{date.toDateString()} {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}</h4>
                  <Calendar
                    onChange={setDate}
                    value={date}
                    className="rounded-lg border border-gray-200 shadow-sm"
                  />
                </div>

                <div className="flex items-center justify-center gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      onClick={incrementHours}
                      className="p-1 hover:bg-gray-100 rounded"
                      aria-label="Increment hours"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </div>
                    <div className="h-12 w-12 flex items-center justify-center border rounded-md">
                      {hours.toString().padStart(2, '0')}
                    </div>
                    <div
                      onClick={decrementHours}
                      className="p-1 hover:bg-gray-100 rounded"
                      aria-label="Decrement hours"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <div className="text-2xl">:</div>

                  <div className="flex flex-col items-center">
                    <div
                      onClick={incrementMinutes}
                      className="p-1 hover:bg-gray-100 rounded"
                      aria-label="Increment minutes"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </div>
                    <div className="h-12 w-12 flex items-center justify-center border rounded-md">
                      {minutes.toString().padStart(2, '0')}
                    </div>
                    <div
                      onClick={decrementMinutes}
                      className="p-1 hover:bg-gray-100 rounded"
                      aria-label="Decrement minutes"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-4 flex justify-end">
              <button type="submit" className="bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-600 mr-2">
                Confirm & Proceed
              </button>
              <button onClick={() => setStep(2)} className="bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-400">
                Back
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 4 && (
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">4. Confirm and send ticket</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <h4 className='font-semibold my-2'>Location</h4>
              <ul className="list-none list-inside text-gray-700">
                <li>{selectedRow?.db_address_street} {selectedRow?.db_address_city}</li>
              </ul>
            </div>
            <div>
              <h4 className='font-semibold my-2'>Ticket description</h4>
              <ul className="list-none list-inside text-gray-700">
                <li>{ticketDetails.ticketType}</li>
                <li>{ticketDetails.severity}</li>
                <li>{ticketDetails.problemDescription}</li>  
              </ul>
            </div>
            <div>
              <h4 className='font-semibold my-2'>Equipment</h4>
              <ul className="list-none list-inside text-gray-700">
                <li>{selectedRow?.equipment_family_name} - {ticketName}</li>
              </ul>
            </div>
            <div>
              <h4 className='font-semibold my-2'>Select preferred intervention data & time</h4>
                {prefersDate && (
                  <>
                    <ul className="list-none list-inside text-gray-700">
                      <li>{date.toDateString()} {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}</li>
                    </ul>
                  </>
                )}
            </div>
          
          <div>
            <h4 className="font-semibold my-2">File</h4>
            {ticketDetails?.file ? (
              isImageFile ? (
                <img
                  alt={ticketDetails.file.name || "Uploaded file"}
                  src={URL.createObjectURL(ticketDetails.file)}
                  style={{ maxWidth: "150px", maxHeight: "150px" }}
                />
              ) : (
                <div>
                  <p>{ticketDetails.file.name}</p>
                  <a
                    href={URL.createObjectURL(ticketDetails.file)}
                    download={ticketDetails.file.name}
                    className="text-blue-500 underline"
                  >
                    Download File
                  </a>
                </div>
              )
            ) : (
              <p>No file uploaded</p>
            )}
          </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={handleSubmitTicket} className="bg-green-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-600 mr-2">
              Create
            </button>
            <button onClick={() => setStep(3)} className="bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-400">
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTicket;