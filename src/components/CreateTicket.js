import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useTable, useSortBy, useExpanded, usePagination } from 'react-table';
import { fetchData } from '../services/apiService.js';
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  XCircle, X, CornerDownRight, CircleCheckBig, ArrowLeft, Filter, ArrowRight, ArrowLeftToLine, FileText, Clock, File, Circle, Wrench,
  MapPin, Text, BadgeDollarSign, BarChart, Hash, ArrowRightToLine, UploadCloud, ChevronDown, ChevronUp, Check, BadgeInfo
} from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import { useTranslation } from "react-i18next";

const CreateTicket = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subRowsMap, setSubRowsMap] = useState({});
  const [error, setError] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [step, setStep] = useState(1);
  const [ticketDetails, setTicketDetails] = useState({
    ticketType: '',
    severity: '',
    problemDescription: '',
    file: null
  });

  const [ticketTypes, setTicketTypes] = useState([]);
  const [severities, setSeverities] = useState([]);
  const [expanded, setExpanded] = useState({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [keyword, setKeyword] = useState('');
  const [brand, setBrand] = useState('All');
  const [model, setModel] = useState('All');
  const [status, setStatus] = useState('All');
  const [includeArchived, setIncludeArchived] = useState(false);

  const [ticketName, setTicketName] = useState('');
  const [textarea, setTextarea] = useState('');

  const [userID, setUserID] = useState();

  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const maxFileSize = 5 * 1024 * 1024;

  const [date, setDate] = React.useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { t } = useTranslation('equipmentList');

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30',
    '18:00'
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const uniqueBrands = [...new Set(contacts.map(contact => contact.equipment_brand_name))];
  const uniqueModels = [...new Set(contacts.map(contact => contact.equipment_model_name))];
  const uniqueStatuses = [...new Set(contacts.map(contact => contact.project_status_name))];

  const steps = [
    { id: 1, label: "Select the Equipment" },
    { id: 2, label: "Ticket Description" },
    { id: 3, label: "Schedule Repair" },
    { id: 4, label: "Send details" },
  ];

  const statusColors = useMemo(() => ({
    "In progress": "bg-yellow-200 text-yellow-800",
    "Planned": "bg-blue-200 text-blue-800",
    "To be Planned": "bg-purple-200 text-purple-800",
    "Out of production": "bg-orange-200 text-orange-800",
    "Active": "bg-green-200 text-green-800",
    "Ready for Review": "bg-indigo-200 text-indigo-800",
    "Proactive": "bg-indigo-200 text-indigo-800",
    "Cancelled": "bg-red-200 text-red-800",
    "Completed": "bg-pink-200 text-pink-800",
  }), []);

  const severityType = useMemo(() => ({
    "Not critical": "text-blue-800 ",
    "Medium high": "text-orange-800 ",
    "Critical": "text-red-800 ",
    "Low": "text-green-800 ",
  }), []);

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);

    const validFiles = newFiles.filter((file) => {
      if (file.size > maxFileSize) {
        toast.warn(`${file.name} is larger than 5MB and will not be added.`);
        return false;
      }
      return true;
    });

    setFiles((prevFiles) => [...prevFiles, ...validFiles]); // Append only valid files

    setTicketDetails((prevDetails) => ({
      ...prevDetails,
      file: prevDetails.file ? [...prevDetails.file, ...validFiles] : validFiles, // Store files in ticketDetails
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const fetchInstallations = async () => {
      const url = `https://V1servicedeskapi.wello.solutions/api/ProjectView/Search?keyword=&projectReference=&projectReferenceBackOffice=&companyID=00000000-0000-0000-0000-000000000000&equipmentModelID=00000000-0000-0000-0000-000000000000&equipmentBrandID=00000000-0000-0000-0000-000000000000&equipmentFamilyID=00000000-0000-0000-0000-000000000000&projectStatusID=00000000-0000-0000-0000-000000000000&createdFrom=1980-01-01T00:00:00.000&createdTo=1980-01-01T00:00:00.000&includesClosed=false&parentOnly=true&contactId=${auth.userId}&rootParentId=00000000-0000-0000-0000-000000000000&includeLocation=true`;
      const payload = {
        startRow: 0,
        endRow: 500,
        rowGroupCols: [],
        valueCols: [],
        pivotCols: [],
        pivotMode: false,
        groupKeys: [],
        filterModel: {},
        sortModel: []
      };

      try {
        const response = await fetchData(url, 'POST', auth.authKey, payload);
        const initialData = response.map(item => ({
          ...item,
          subRows: item.has_child ? [] : []
        }));
        setContacts(initialData);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };
    fetchInstallations();
  }, [auth]);

  const handleFetchChildren = useCallback(async (parentId) => {
    if (subRowsMap[parentId]) return;

    const url = `https://V1servicedeskapi.wello.solutions/api/ProjectView/Search?keyword=&projectReference=&projectReferenceBackOffice=&companyID=00000000-0000-0000-0000-000000000000&equipmentModelID=00000000-0000-0000-0000-000000000000&equipmentBrandID=00000000-0000-0000-0000-000000000000&equipmentFamilyID=00000000-0000-0000-0000-000000000000&projectStatusID=00000000-0000-0000-0000-000000000000&createdFrom=1980-01-01T00:00:00.000&createdTo=1980-01-01T00:00:00.000&includesClosed=false&parentOnly=false&contactId=${auth.userId}&rootParentId=00000000-0000-0000-0000-000000000000&includeLocation=true`;
    const payload = {
      startRow: 0,
      endRow: 500,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [parentId],
      filterModel: {},
      sortModel: []
    };

    try {
      const response = await fetchData(url, 'POST', auth.authKey, payload);
      const children = response.map(item => ({
        ...item,
        subRows: item.has_child ? [] : []
      }));

      setSubRowsMap(prev => ({ ...prev, [parentId]: children }));
    } catch (err) {
      console.error(err);
    }
  }, [auth, subRowsMap]);

  const toggleExpand = useCallback(async (id) => {
    if (!expanded[id]) {
      await handleFetchChildren(id);
    }
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }, [expanded, handleFetchChildren]);


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
    if (key === 'problemDescription') {
      setTextarea(value);
    }
    setTicketDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };


  useEffect(() => {
    const taskType = async () => {
      try {
        const data = await fetchData('https://V1servicedeskapi.wello.solutions/api/TaskType?$orderby=is_default,sequence', 'GET', auth.authKey);
        setTicketTypes(data.value);
      } catch (err) {
        setError(err);
      }
    }

    const taskSeverity = async () => {
      try {
        const data = await fetchData('https://V1servicedeskapi.wello.solutions/api/TaskPriority?$orderby=is_default,sequence', 'GET', auth.authKey);
        setSeverities(data.value);
      } catch (err) {
        setError(err);
      }
    }

    const fetchUserID = async () => {
      try {
        const responseUser = await fetchData(`https://V1servicedeskapi.wello.solutions/api/Contact?$filter=e_login+eq+'${encodeURIComponent(auth.authEmail)}'`, 'GET', auth.authKey);
        setUserID(responseUser.value[0]);
      } catch (err) {
        setError(err);
      }
    }
    taskType();
    taskSeverity();
    fetchUserID();
  }, [auth, selectedRow]);

  const handleNameChange = (e) => {
    setTicketName(e.target.value);
  };

  const handleRowClick = (rowData) => {
    setSelectedRow(rowData);
    setStep(2);
  };

  const columns = useMemo(() => [
    {
      Header: t('equipments_list_table_heading_name_text'),
      accessor: 'name'
    },
    {
      id: 'expander',
      Header: '',
      Cell: ({ row }) => (
        row.original.has_child ? (
          <button
            onClick={() => toggleExpand(row.original.id)}
            className="pr-1"
          >
            {expanded[row.original.id] ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        ) : null
      )
    },
    { Header: t('equipments_list_table_heading_address_text'), accessor: 'db_address_street' },
    { Header: t('equipments_list_table_heading_type_text'), accessor: 'equipment_family_name' },
    { Header: t('equipments_list_table_heading_reference_text'), accessor: 'customer_reference' },
    { Header: t('equipments_list_table_heading_brand_text'), accessor: 'equipment_brand_name' },
    { Header: t('equipments_list_table_heading_modal_text'), accessor: 'equipment_model_name' },
    { Header: t('equipments_list_table_heading_serial_number_text'), accessor: 'serial_number' },
    { Header: t('equipments_list_table_heading_bar_code_text'), accessor: 'barcode' },
    {
      Header: t('equipments_list_table_heading_status_text'),
      accessor: 'project_status_name',
      Cell: ({ row }) => (
        <span className={`text-xs flex items-center font-medium pe-2 px-1 pb-0.5 rounded-full ${statusColors[row.original.project_status_name] || "bg-gray-200 text-gray-800"}`}>
          <Circle className='inline w-2 h-2 mr-1 rounded-full' /> {row.original.project_status_name}
        </span>
      ),
    },
  ], [statusColors, expanded, toggleExpand, t]);


  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesLocation = location ? contact.db_address_street.toLowerCase().includes(location.toLowerCase()) : true;
      const matchesKeyword = keyword ? contact.name.toLowerCase().includes(keyword.toLowerCase()) : true;
      const matchesBrand = brand !== 'All' ? contact.equipment_brand_name === brand : true;
      const matchesModel = model !== 'All' ? contact.equipment_model_name === model : true;
      const matchesStatus = status !== 'All' ? contact.project_status_name === status : true;
      const matchesArchived = includeArchived ? true : contact.project_status_is_closed !== true;

      return matchesLocation && matchesKeyword && matchesBrand && matchesModel && matchesStatus && matchesArchived;
    });
  }, [contacts, location, keyword, brand, model, status, includeArchived]);

  const {
    getTableProps,
    headerGroups,
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
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useSortBy,
    useExpanded,
    usePagination
  );

  const renderRows = (data, depth = 0) => {
    return data.map(row => (
      <React.Fragment key={row.id}>
        <tr
          className="hover:bg-gray-50 cursor-pointer"
          onClick={() => handleRowClick(row)}
        >
          {columns.map((column, index) => {
            const isSecondColumn = index === 1; // Skip click for second column
            const cellContent = column.Cell
              ? column.Cell({ row: { original: row } })
              : row[column.accessor];

            return (
              <td
                key={column.id || column.accessor}
                className={`p-2 text-sm text-gray-800 ${index === 0 ? 'flex' : ''}`}
                style={index === 0 ? { paddingLeft: `${depth * 5 + 10}px` } : {}}
                onClick={isSecondColumn ? (e) => e.stopPropagation() : undefined}
              >
                {index === 0 && depth > 0 && (
                  <CornerDownRight className="mr-1 text-gray-400" size={16} />
                )}
                {cellContent}
              </td>
            );
          })}
        </tr>
        {expanded[row.id] && subRowsMap[row.id] && renderRows(subRowsMap[row.id], depth + 1)}
      </React.Fragment>
    ));
  };

  if (loading) {
    return <div className="flex w-full items-center justify-center h-screen bg-gray-100">
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
      "date_suggested_by_company": `${date.toDateString()} ${selectedTime}`,
      "date_closed": "1980-01-01",
      "date_update": "1980-01-01",
      "date_start": new Date().toISOString(),  // Use ISO string if needed
      "date_create": new Date().toISOString() // Use ISO string if needed
    };

    try {
      // console.log('Payload Data:', payloadData);
      // Uncomment when ready to call the API
      const response = await fetchData('https://V1servicedeskapi.wello.solutions/api/Task', 'POST', auth.authKey, payloadData);

      setLoading(false);
      toast.success('Ticket created successfully!');

      if (response) {
        // Post an image using the response id from the ticket creation
        await postImage(response.id, response.id2);
        setIsSubmitModalOpen(true);
        //navigate(`/ticket/${response.id}`)
      }

      // Reset state after submission
      setStep(0); // Reset to the first step
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
      //imagePayload.append("file", selectedFile);
      selectedFile.forEach((file, index) => {
        imagePayload.append(`file${index + 1}`, file);
      });

      if (imagePayload) {
        await fetchData(
          `https://V1servicedeskapi.wello.solutions/api/dbfile/add?db_table_id=448260E5-7A17-4381-A254-0B1D8FE53947&id_in_table=${ticketId}&description=Uploaded by Service Desk - ${ticketId2}`,
          'POST', auth.authKey, imagePayload
        );
      }

      //console.log(imageResponse);
    } catch (err) {
      toast.error("Failed to upload image.");
      //alert("Failed to upload image.");
    }
  };




  return (
    <div className="w-full p-1 md:p-8 bg-gray-50 min-h-screen">
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      {/* <h1 className="text-2xl font-semibold text-gray-800 mb-6">{t("Create New Ticket")}</h1> */}

      {/* Step Indicator Bar */}
      <div className='flex justify-center w-full border-b-2 border-gray-200'>
        <div className="flex justify-start w-9/12 relative mb-8 mx-4">
          {/* Progress Line Background */}
          <div className="absolute w-full top-5 h-1 bg-gray-300 z-0" />

          {/* Progress Line Fill */}
          <div
            className="absolute top-5 w-full h-1 bg-[#90AC4F] z-10 transition-all duration-300"
            style={{
              width: `${Math.min(Math.max((step / (steps.length - 1)) * 100, 0), 100)}%`,
            }}
          />

          {/* Steps */}
          <div className="flex justify-between w-full gap-0 relative z-20">
            {steps.map((item, index) => (
              <div key={item.id} className="text-center">
                {/* Step Circle */}
                <div
                  className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center relative z-10 ${step > item.id
                    ? "bg-[#90AC4F] text-white"
                    : step === item.id
                      ? "bg-[#90AC4F] text-white shadow-lg"
                      : "bg-gray-200 text-gray-400"
                    }`}
                >
                  {step > item.id
                    ? <Check className='w-6 h-6' />
                    : <Circle className='w-4 h-4 bg-white rounded-full text-white' />
                  }

                </div>

                {/* Label */}
                <p className='text-sm font-medium mt-2 text-gray-800'>
                  {step.id}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={() => navigate('/')} // Navigate back one step in history
        className="flex items-center my-4 font-semibold text-gray-800"
      >
        <ArrowLeft className="mr-2 w-5 h-5" /> {t("Go Back")}
      </button>

      {step === 1 && (
        <>
          <div className="flex items-center my-2">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={() => setIncludeArchived(!includeArchived)}
              className="mr-2"
            />
            <label className="text-sm">{t('equipments_list_page_checkbox_label')}</label>
          </div>
          {/* Search Filter UI */}
          <div className="mb-6">
            <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-white font-semibold text-gray-800 border border-gray-800 px-4 py-1 rounded-md mb-4">
              Filter <Filter className="w-4 h-4 ml-4" />
            </button>

            {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="w-80 p-4 bg-white rounded-lg shadow-md border space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-gray-700">Filters</h2>
                      <Filter className="w-4 h-4 text-gray-700" />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Search by Location"
                      className="w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                  </div>

                  {/* Keyword */}
                  <div className="relative">
                    <Text className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="Search by Keyword"
                      className="w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                  </div>

                  {/* Brands */}
                  <div className="relative">
                    <BadgeDollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <select value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded-md text-sm text-gray-700">
                      <option>Select by Brands</option>
                      {uniqueBrands.map((brand, index) => (
                        brand && <option key={index} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="relative">
                    <BarChart className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded-md text-sm text-gray-700">
                      <option>Select by Status</option>
                      {uniqueStatuses.map((status, index) => (
                        status && <option key={index} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  {/* Models */}
                  <div className="relative">
                    <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded-md text-sm text-gray-700">
                      <option>Select by Models</option>
                      {uniqueModels.map((model, index) => (
                        model && <option key={index} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>

                  {/* Footer buttons */}
                  <div className="flex justify-between pt-2">
                    <button onClick={handleReset} className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-100">
                      Reset Filters
                    </button>
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800">
                      Close Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2 px-4 pt-4">{t("Equipments")}</h2>
            <div className="flex items-center mb-1 text-gray-900 px-4 pb-4">
              <BadgeInfo className='mr-2 w-5 h-5 text-gray-400' /> {t("Please click on an equipment or location to proceed with the ticket creation.")}
            </div>
            {/* Contacts Table */}
            <div className="overflow-x-auto">
              <table {...getTableProps()} className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-white">
                  {headerGroups.map((headerGroup, headerIndex) => (
                    <tr {...headerGroup.getHeaderGroupProps()} key={headerIndex} className="bg-white divide-x divide-gray-300">
                      {headerGroup.headers.map((column, columnIndex) => (
                        <th {...column.getHeaderProps()} key={columnIndex} className="px-2 py-2 text-left text-sm font-semibold text-gray-600">
                          {column.render('Header')}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {renderRows(filteredContacts)}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls - Only show if filteredTickets exceed pageSize (10) */}
            {filteredContacts.length > 10 && (
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
        </>
      )}

      {step === 2 && (
        <div className="mt-4 p-6 w-full max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">{t("Describe your issue.")}</h2>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='shadow-sm rounded-lg bg-white p-4 '>
              <h4 className="text-lg font-semibold">{t("Address")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-700">
                <li className='flex items-center'><MapPin className='w-4 h-4 mr-2' />{selectedRow.db_address_street}</li>
                <li className='ml-6 pb-1'>{selectedRow.db_address} {selectedRow.db_address_zip}</li>
              </ul>
            </div>

            <div className='shadow-sm rounded-lg bg-white p-4 '>
              <h4 className="text-lg font-semibold">{t("Equipment")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-700">
                <li className='flex items-center'><Wrench className='w-4 h-4 mr-2' />{selectedRow.name}</li>
                <li className='ml-6 pb-1'>{selectedRow.equipment_family_name}</li>
                <li className='ml-6 pb-1'>{selectedRow.equipment_brand_name}</li>
                <li className='ml-6 pb-1'>{selectedRow.equipment_model_name}</li>
              </ul>
            </div>

            <div className='shadow-sm rounded-lg bg-white p-4 '>
              <h4 className="text-lg font-semibold">{("Properties")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-700 ">
                <li className='grid grid-cols-2 gap-4'>{t("Barcode")}: <span className='font-semibold'>{selectedRow.barcode}</span></li>
                <li className='grid grid-cols-2 gap-4'>{t("Serial Number")}: <span className='font-semibold'>{selectedRow.serial_number}</span></li>
                <li className='grid grid-cols-2 gap-4'>{t("Our Ref")}: <span className='font-semibold'>{selectedRow.customer_reference}</span></li>
                <li className='grid grid-cols-2 gap-4'>{t("Supplier Ref")}: <span className='font-semibold'>{selectedRow.id2}</span></li>
              </ul>
            </div>
          </div>
          <div className='w-full max-w-md mx-auto'>
            <hr className=' my-8 border-b-2 border-gray-200' />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
            <div className="mb-8">
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
              <label className="block text-sm font-medium text-gray-700">{t("⁕ Description about the issue.")}</label>
              <input
                type="text"
                maxLength={50}
                value={ticketName}
                onChange={handleNameChange}
                className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-sm text-gray-600 mt-1 text-end">
                {50 - ticketName.length} characters remaining.
              </p>
            </div>

            <div className="mb-4">
              <textarea
                maxLength={255}
                value={textarea}
                onChange={(e) => handleInputChange('problemDescription', e.target.value)}
                className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-sm text-gray-600 text-end">
                {255 - textarea.length} characters remaining.
              </p>
            </div>

            {/* File Upload Field */}
            <div className="w-full mx-auto">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-40 px-4 transition bg-white border-1 border rounded-md cursor-pointer border-gray-300"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, or PDF (max. 5MB)</p>
                </div>
                <input id="file-upload"
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            <div className="mb-4">
              {/* File Thumbnails Grid */}
              {files.length > 0 && (
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {files.map((file, index) => {
                    const fileURL = URL.createObjectURL(file);
                    const isImage = file.type.startsWith("image/");
                    const isPDF = file.type === "application/pdf";

                    return (
                      <div key={index} className="relative group w-32 h-auto">
                        {/* Thumbnail */}
                        {isImage ? (
                          <div>
                            <img src={fileURL} alt="Preview" className="w-32 h-32 object-cover rounded-md overflow-hidden" />
                            <p className="mt-2 text-sm text-gray-800">{file.name}</p>
                          </div>
                        ) : (
                          <div className="">
                            {isPDF ? <FileText className="w-32 h-32 text-gray-600 object-cover rounded-md overflow-hidden" /> : <File className="w-32 h-32 text-gray-600 object-cover rounded-md overflow-hidden" />}
                            <p className="mt-2 text-sm text-gray-800">{file.name}</p>
                          </div>
                        )}

                        {/* Remove Icon */}
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 bg-white p-1 rounded-full opacity-80 hover:opacity-100 transition-opacity shadow-md"
                        >
                          <XCircle className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            <div className="mt-4 flex justify-end">
              <button onClick={() => setStep(1)} className="bg-white text-gray-800 font-semibold border border-gray-800 py-2 px-8 rounded-md">
                Back
              </button>
              <button type="submit" className="bg-gray-900 text-white font-semibold py-2 px-8 rounded-md ml-2">
                Next
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 3 && (
        <div className="mt-4 p-6 w-full max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">{t("Please select your preferred date for the intervention.")}</h2>
          <form onSubmit={(e) => { e.preventDefault(); setStep(4); }}>
            {/* Yes/No Toggle for Preferred Date & Time */}
            <div className="mb-8 flex items-center">
              <span className="text-sm text-gray-600 mr-2">{t("We'll check our technicians availability and confirm or suggest the closest alternative.")}</span>

              {/* <div className="flex gap-2">
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
              </div> */}
            </div>

            {/* Calendar Picker */}
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="react-calendar-wrapper border border-gray-300 rounded-lg">
                <Calendar
                  onChange={setDate}
                  value={date}
                  minDate={new Date()}
                  calendarType="gregory" // Week starts on Sunday
                  formatShortWeekday={(locale, date) => date.toLocaleDateString(locale, { weekday: 'short' }).slice(0, 1)}
                  prev2Label={null}  // Remove double prev
                  next2Label={null}  // Remove double next
                  className="calendar-component"
                />
              </div>

              <div className="relative inline-block text-left" ref={dropdownRef}>
                {/* Trigger Button */}
                <div
                  onClick={() => setIsOpen(!isOpen)}
                  className="inline-flex items-center justify-between w-60 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                >
                  <span className="inline-flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    {selectedTime || 'Select Time'}
                  </span>
                  <ChevronDown className="w-4 h-4 ml-2 text-gray-500" />
                </div>

                {/* Dropdown Menu */}
                {isOpen && (
                  <div className="absolute z-10 mt-2 w-60 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                    <ul className="p-2 text-sm text-gray-700 max-h-72 justify-items-center overflow-y-auto grid grid-cols-3 gap-1">
                      {timeSlots.map((time) => (
                        <li key={time}>
                          <button
                            onClick={() => {
                              setSelectedTime(time);
                              setIsOpen(false);
                            }}
                            className={`text-left p-1 rounded-lg border ${selectedTime === time
                              ? 'bg-gray-800 text-white font-semibold'
                              : 'hover:bg-gray-800 hover:text-white'
                              }`}
                          >
                            {time}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>


              {/* <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center bg-indigo-500 text-white rounded-t-lg rounded-b-lg">
                  <div
                    onClick={incrementHours}
                    className="p-1"
                    aria-label="Increment hours"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </div>
                  <div className="font-bold h-12 w-12 flex items-center justify-center border rounded-md bg-white text-black">
                    {hours.toString().padStart(2, '0')}
                  </div>
                  <div
                    onClick={decrementHours}
                    className="p-1"
                    aria-label="Decrement hours"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div className="text-2xl">:</div>

                <div className="flex flex-col items-center bg-indigo-500 text-white rounded-t-lg rounded-b-lg">
                  <div
                    onClick={incrementMinutes}
                    className="p-1"
                    aria-label="Increment minutes"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </div>
                  <div className="font-bold h-12 w-12 flex items-center justify-center border rounded-md bg-white text-black">
                    {minutes.toString().padStart(2, '0')}
                  </div>
                  <div
                    onClick={decrementMinutes}
                    className="p-1"
                    aria-label="Decrement minutes"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div> */}

            </div>
            <div className='font-semibold mb-4 my-8'>
              {t("Your selected preferred time is ")}
              <span className='underline pl-2'>{date.toLocaleDateString('en-BE', { year: 'numeric', month: 'long', day: 'numeric' })} | {selectedTime}</span>
            </div>


            {/* Navigation Buttons */}
            <div className="mt-4 flex justify-end">
              <button onClick={() => setStep(2)} className="bg-white text-gray-800 font-semibold border border-gray-800 py-2 px-8 rounded-md">
                Back
              </button>
              <button type="submit" className="bg-gray-900 text-white font-semibold py-2 px-8 rounded-md ml-2">
                Next
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 4 && (
        <div className="mt-4 p-6 w-full max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">{t("Confirm and send ticket")}</h2>

          {isSubmitModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="w-96 p-8 bg-white rounded-lg shadow-md border space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <CircleCheckBig className="w-6 h-6 text-[#14BE6F]" />
                    <h2 className="text-lg font-semibold text-[#14BE6F]">{("Ticket Created")}</h2>
                  </div>
                  <X className="w-6 h-6 text-[#FF3363] cursur-pointer" onClick={() => setIsSubmitModalOpen(false)} />
                </div>
                <p className='px-2'>{("Sit back and relax. We will respond to you as soon as possible to help you out with the repair.")}</p>
                {/* Footer buttons */}
                <div className="flex justify-between pt-2">
                  <button onClick={() => navigate(`/create`)} className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-100">
                    Back Home
                  </button>
                  <button onClick={() => navigate(`/ticket/${selectedRow.id}`)} className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800">
                    View Ticket
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='shadow-sm rounded-lg bg-white p-4 '>
              <h4 className="text-lg font-semibold">{t("Address")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-700">
                <li className='flex items-center'><MapPin className='w-4 h-4 mr-2' />{selectedRow.db_address_street}</li>
                <li className='ml-6 pb-1'>{selectedRow.db_address} {selectedRow.db_address_zip}</li>
              </ul>
            </div>

            <div className='shadow-sm rounded-lg bg-white p-4 '>
              <h4 className="text-lg font-semibold">{t("Equipment")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-700">
                <li className='flex items-center'><Wrench className='w-4 h-4 mr-2' />{selectedRow.name}</li>
                <li className='ml-6 pb-1'>{selectedRow.equipment_family_name}</li>
                <li className='ml-6 pb-1'>{selectedRow.equipment_brand_name}</li>
                <li className='ml-6 pb-1'>{selectedRow.equipment_model_name}</li>
              </ul>
            </div>

            <div className='shadow-sm rounded-lg bg-white p-4 '>
              <h4 className="text-lg font-semibold">{("Properties")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-700 ">
                <li className='grid grid-cols-2 gap-4'>{t("Barcode")}: <span className='font-semibold'>{selectedRow.barcode}</span></li>
                <li className='grid grid-cols-2 gap-4'>{t("Serial Number")}: <span className='font-semibold'>{selectedRow.serial_number}</span></li>
                <li className='grid grid-cols-2 gap-4'>{t("Our Ref")}: <span className='font-semibold'>{selectedRow.customer_reference}</span></li>
                <li className='grid grid-cols-2 gap-4'>{t("Supplier Ref")}: <span className='font-semibold'>{selectedRow.id2}</span></li>
              </ul>
            </div>

            <div className='shadow-sm rounded-lg bg-white p-4 '>
              <h4 className='text-lg font-semibold'>{("Preferred date and time")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-700">
                <li>{date.toLocaleDateString('nl-BE')} {selectedTime}</li>
              </ul>
            </div>
            <div className='shadow-sm rounded-lg bg-white p-4 '>
              <h4 className='text-lg font-semibold'>{("Severity")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-700">
                {/* <li>
                  <span className={`font-medium me-2 px-1.5 py-0.5 rounded-sm ${ticketType[ticketDetails.ticketType] || "bg-gray-300"}`}>
                    {ticketDetails.ticketType}
                  </span>
                </li> */}
                <li>
                  <span className={`font-medium me-2 ${severityType[ticketDetails.severity] || "text-gray-300"}`}>
                    {ticketDetails.severity}
                  </span>
                </li>
              </ul>
            </div>
            <div className='shadow-sm rounded-lg bg-white p-4 '>
              <h4 className='text-lg font-semibold'>{("Ticket Subject")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-700">
                <li>{ticketName}</li>
              </ul>
            </div>

            <div className='col-span-3 shadow-sm bg-white rounded-lg p-4 '>

              <h4 className='text-lg font-semibold'>{("Description about the issue.")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-700">
                <li>{ticketDetails.problemDescription}</li>
              </ul>

            </div>
            <div className='col-span-3 shadow-sm bg-white rounded-lg p-4 '>
              <h4 className="font-semibold my-2">{t("Files Uploaded")}</h4>

              {/* File Thumbnails Grid */}
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {ticketDetails?.file && ticketDetails.file.map((file, index) => {
                  const fileURL = URL.createObjectURL(file);
                  const isImage = file.type.startsWith("image/");
                  const isPDF = file.type === "application/pdf";

                  return (
                    <div key={index} className="relative group w-32 h-auto">
                      {/* Thumbnail */}
                      {isImage ? (
                        <div>
                          <img src={fileURL} alt="Preview" className="w-32 h-32 object-cover rounded-md overflow-hidden" />
                          <p className="mt-2 text-sm text-gray-800">{file.name}</p>
                        </div>
                      ) : (
                        <div className="">
                          {isPDF ? <FileText className="w-32 h-32 text-gray-600 object-cover rounded-md overflow-hidden" /> : <File className="w-32 h-32 text-gray-600 object-cover rounded-md overflow-hidden" />}
                          <p className="mt-2 text-sm text-gray-800">{file.name}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={() => setStep(3)} className="bg-white text-gray-800 font-semibold border border-gray-800 py-2 px-8 rounded-md">
              Back
            </button>
            <button onClick={handleSubmitTicket} className="bg-gray-900 text-white font-semibold py-2 px-8 rounded-md ml-2">
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTicket;