import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useTable, useSortBy, useExpanded } from 'react-table';
import { fetchData } from '../services/apiService.js';
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  XCircle, X, CornerDownRight, CircleCheckBig, Filter, FileText, Clock, File, Circle, Wrench, ArrowUp, ArrowDown,
  MapPin, Text, Bold, BarChart, Hash, Loader, UploadCloud, ChevronDown, ChevronUp, Check, BadgeInfo, TicketX, Thermometer
} from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import { useTranslation } from "react-i18next";

import Select from 'react-select';
import makeAnimated from 'react-select/animated';
const animatedComponents = makeAnimated();

const CreateTicket = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [subRowsMap, setSubRowsMap] = useState({});
  const [error, setError] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [step, setStep] = useState(0);
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

  const [allLocations, setAllLocations] = useState([]);
  const [locationHints, setLocationHints] = useState([]);

  const EmptyGuid = "00000000-0000-0000-0000-000000000000";

  const [filters, setFilters] = useState({
    location: "",
    locationLabel: "",
    keyword: "",
    brand: EmptyGuid,
    model: EmptyGuid,
    status: EmptyGuid,
    includeArchived: false
  });

  const [tempFilters, setTempFilters] = useState(filters);

  const [fetchBrands, setFetchBrands] = useState();
  const [fetchModels, setFetchModels] = useState();
  const [fetchStatuses, setFetchStatuses] = useState();

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
  const [responseId, setResponseId] = useState();
  const dropdownRef = useRef(null);
  const { t } = useTranslation('createTicket');

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30',
    '18:00'
  ];

  const fetchProjects = useCallback(
    async ({ parentOnly, groupKeys = [], parentId = null }) => {
      const url = `api/ProjectView/Search?keyword=${filters.keyword}&projectReference=&projectReferenceBackOffice=&companyID=${EmptyGuid}&equipmentModelID=${filters.model}&equipmentBrandID=${filters.brand}&equipmentFamilyID=${EmptyGuid}&projectStatusID=${filters.status}&createdFrom=1980-01-01T00:00:00.000&createdTo=1980-01-01T00:00:00.000&includesClosed=false&parentOnly=${parentOnly}&contactId=${auth.userId}&rootParentId=${EmptyGuid}&includeLocation=true`;

      const payload = {
        startRow: 0,
        endRow: 500,
        rowGroupCols: [],
        valueCols: [],
        pivotCols: [],
        pivotMode: false,
        groupKeys,
        filterModel: {},
        sortModel: []
      };

      try {
        const response = await fetchData(url, 'POST', auth.authKey, payload);
        const mapped = response.map(item => ({
          ...item,
          subRows: item.has_child ? [] : []
        }));

        if (parentOnly || (!parentOnly && !parentId)) {
          setContacts(mapped);
        }
        if (!parentOnly && parentId) {
          setSubRowsMap(prev => ({ ...prev, [parentId]: mapped }));
        }
        return await mapped;
      } catch (err) {
        console.error(err);
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [auth, filters]
  );

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const projects = await fetchProjects({ parentOnly: true });

        const locations = Array.isArray(projects)
          ? [
            ...new Map(
              projects.map(p => {
                const name = p.name ? `${p.name} -` : '';
                const street = p.db_address_street || '';
                const streetNumber = p.db_address_street_number || '';
                const zip = p.db_address_zip || '';
                const city = p.db_address_city || '';

                const label = [name, street, streetNumber, city, zip]
                  .filter(Boolean)
                  .join(' ');

                return [p.id, { id: p.id, label }];
              })
            ).values(),
          ]
          : [];

        setAllLocations(locations); // locations: Array<{ id, label }>
      } catch (err) {
        console.error('Failed to fetch locations', err);
      }
    };

    loadLocations();
  }, [fetchProjects]);

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setTempFilters(prev => ({ ...prev, locationLabel: value }));

    if (value.length >= 3) {
      const filtered = allLocations.filter(loc =>
        loc.label.toLowerCase().includes(value.toLowerCase())
      );
      setLocationHints(filtered);
    } else {
      setLocationHints([]);
    }
  };

  const handleHintClick = (hint) => {
    setTempFilters(prev => ({
      ...prev,
      location: hint.id,         // ✅ store ID
      locationLabel: hint.label  // show label in input
    }));
    setLocationHints([]);
  };

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

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const resbrands = await fetchData('api/EquipmentBrand', 'GET', auth.authKey);
        setFetchBrands(resbrands.value);
      } catch (err) {
        setError(err);
      }
    };

    const fetchModels = async () => {
      try {
        const resmodels = await fetchData('api/EquipmentModel', 'GET', auth.authKey);
        setFetchModels(resmodels.value);
      } catch (err) {
        setError(err);
      }
    };

    const fetchStatuses = async () => {
      try {
        const restatuses = await fetchData('api/ProjectStatus', 'GET', auth.authKey);
        setFetchStatuses(restatuses.value);
      } catch (err) {
        setError(err);
      }
    };
    fetchBrands();
    fetchStatuses();
    fetchModels();
  }, [auth]);

  const brandOptions = Array.isArray(fetchBrands)
    ? fetchBrands
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(brand => ({
        value: brand.id,
        label: brand.name,
      }))
    : [];

  const modelOptions = Array.isArray(fetchModels)
    ? fetchModels
      .filter(model => model.equipment_brand_id === tempFilters.brand) // ✅ filter by brand
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(model => ({
        value: model.id,
        label: model.name,
      }))
    : [];

  const statusOptions = [
    ...(Array.isArray(fetchStatuses)
      ? fetchStatuses
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((status) => ({
          value: status.id,
          label: status.name,
        }))
      : []),
  ];

  const steps = [
    { id: 0, label: t("create_ticket_page_step_1") },
    { id: 1, label: t("create_ticket_page_step_2") },
    { id: 2, label: t("create_ticket_page_step_3") },
    { id: 3, label: t("create_ticket_page_step_4") },
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

  const statusDotColors = useMemo(() => ({
    "In progress": "bg-yellow-800 text-yellow-800",
    "Planned": "bg-blue-800 text-blue-800",
    "To be Planned": "bg-purple-800 text-purple-800",
    "Out of production": "bg-orange-800 text-orange-800",
    "Active": "bg-green-800 text-green-800",
    "Ready for Review": "bg-indigo-800 text-indigo-800",
    "Proactive": "bg-indigo-800 text-indigo-800",
    "Cancelled": "bg-red-800 text-red-800",
    "Completed": "bg-pink-800 text-pink-800",
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
    fetchProjects({ parentOnly: true });
  }, [fetchProjects]);

  const handleFetchChildren = useCallback(
    async (parentId) => {
      if (subRowsMap[parentId]) return;
      fetchProjects({ parentOnly: false, groupKeys: [parentId], parentId });
    },
    [fetchProjects, subRowsMap]
  );


  const toggleExpand = useCallback(async (id) => {
    if (!expanded[id]) {
      await handleFetchChildren(id);
    }
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }, [expanded, handleFetchChildren]);

  const flattenData = (contacts, subRowsMap) => {
    const flat = [];
    const addRows = rows => {
      rows.forEach(row => {
        flat.push(row);
        if (subRowsMap[row.id] && subRowsMap[row.id].length > 0) {
          addRows(subRowsMap[row.id]);
        }
      });
    };
    addRows(contacts);
    return flat;
  };

  const clearedFilters = {
    location: "",
    keyword: "",
    brand: EmptyGuid,
    model: EmptyGuid,
    status: EmptyGuid,
    includeArchived: false,
  };

  // Apply filters when Confirm is clicked
  const applyFilters = async () => {
    const { brand, status, model, location, keyword } = tempFilters;

    const isValid =
      brand !== clearedFilters.brand ||
      status !== clearedFilters.status ||
      model !== clearedFilters.model ||
      location.trim() !== "" ||
      keyword.trim() !== "";

    if (!isValid) return;

    setIsLoading(true);

    try {
      flattenData(contacts, subRowsMap); // Ensure it's awaited if async
      setFilters(tempFilters); // Sync UI state

      await fetchProjects({
        parentOnly: false,
        brand,
        status,
        model,
      });
    } catch (error) {
      console.error("Failed to apply filters:", error);
      // Optionally show a toast
    } finally {
      setIsModalOpen(false);
      setIsLoading(false);
    }
  };

  // Reset filters and reload default data
  const handleReset = async () => {
    setIsLoading(true);

    try {
      setTempFilters(clearedFilters);
      setFilters(clearedFilters);

      await fetchProjects({ parentOnly: true }); // Reload default view
    } catch (error) {
      console.error("Reset failed:", error);
    } finally {
      setIsModalOpen(false);
      setIsLoading(false);
    }
  };


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
        const data = await fetchData('api/TaskType?$orderby=is_default,sequence', 'GET', auth.authKey);
        setTicketTypes(data.value);
      } catch (err) {
        setError(err);
      }
    }

    const taskSeverity = async () => {
      try {
        const data = await fetchData('api/TaskPriority?$orderby=is_default,sequence', 'GET', auth.authKey);
        setSeverities(data.value);
      } catch (err) {
        setError(err);
      }
    }

    const fetchUserID = async () => {
      try {
        const responseUser = await fetchData(`api/Contact?$filter=e_login+eq+'${encodeURIComponent(auth.authEmail)}'`, 'GET', auth.authKey);
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
    setStep(1);
  };

  const columns = useMemo(() => [
    {
      Header: t('create_ticket_table_heading_name_text'),
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
    {
      Header: t('create_ticket_table_heading_address_text'),
      accessor: 'db_address_street',
      Cell: ({ row }) =>
        row.original.db_address_street + ' - ' + row.original.db_address_street_number
    },
    { Header: t('create_ticket_table_heading_type_text'), accessor: 'equipment_family_name' },
    { Header: t('create_ticket_table_heading_reference_text'), accessor: 'customer_reference' },
    { Header: t('create_ticket_table_heading_brand_text'), accessor: 'equipment_brand_name' },
    { Header: t('create_ticket_table_heading_modal_text'), accessor: 'equipment_model_name' },
    { Header: t('create_ticket_table_heading_serial_number_text'), accessor: 'serial_number' },
    { Header: t('create_ticket_table_heading_bar_code_text'), accessor: 'barcode' },
    {
      Header: t('create_ticket_table_heading_status_text'),
      accessor: 'project_status_name',
      Cell: ({ row }) => (
        <span className={`text-xs min-w-max inline-flex items-center font-medium pe-3 px-2 pb-1 pt-0.5 rounded-full ${statusColors[row.original.project_status_name] || "bg-gray-200 text-gray-800"}`}>
          <Circle className={`inline w-2 h-2 mr-1 rounded-full ${statusDotColors[row.original.project_status_name] || "bg-gray-800 text-gray-800"}`} />
          {row.original.project_status_name}
        </span>
      ),
    },
  ], [statusColors, statusDotColors, expanded, toggleExpand, t]);


  // Filtered data based on search criteria
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesLocation = filters.location
        ? contact?.id === filters.location
        : true;

      const matchesKeyword = filters.keyword
        ? Object.values(contact || {})
          .filter(val => typeof val === 'string') // only check string fields
          .some(val => val.toLowerCase().includes(filters.keyword.toLowerCase()))
        : true;

      const matchesBrand =
        filters.brand !== EmptyGuid
          ? contact.equipment_brand_id === filters.brand
          : true;

      const matchesModel =
        filters.model !== EmptyGuid
          ? contact.equipment_model_id === filters.model
          : true;

      const matchesStatus =
        filters.status !== EmptyGuid
          ? contact.project_status_id === filters.status
          : true;

      const matchesArchived = filters.includeArchived
        ? true
        : contact.project_status_is_closed !== true;

      return (
        matchesLocation &&
        matchesKeyword &&
        matchesBrand &&
        matchesModel &&
        matchesStatus &&
        matchesArchived
      );
    });
  }, [contacts, filters]);

  // Create table instance with pagination
  const {
    getTableProps,
    headerGroups,
  } = useTable(
    {
      columns,
      data: filteredContacts
    },
    useSortBy,
    useExpanded
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
                className={`px-2 py-4 whitespace-nowrap text-zinc-900 text-xs font-normal ${index === 0 ? 'flex' : ''}`}
                style={index === 0 ? { paddingLeft: `${depth * 2 + 1}em` } : {}}
                onClick={isSecondColumn ? (e) => e.stopPropagation() : undefined}
              >
                {index === 0 && depth > 0 && (
                  <CornerDownRight className="mr-1 text-gray-300" size={20} />
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
    return <div className="flex w-full items-center justify-center h-screen">
      <div className="relative">
        <div className="w-20 h-20 border-purple-200 border-2 rounded-full"></div>
        <div className="w-20 h-20 border-purple-700 border-t-2 animate-spin rounded-full absolute left-0 top-0"></div>
      </div>
    </div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Error fetching data: {error.message}</div>;
  }


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
      const response = await fetchData('api/Task', 'POST', auth.authKey, payloadData);

      if (response) {
        await postImage(response.id, response.id2);
        setLoading(false);
        toast.success('Ticket created successfully!');
        setIsSubmitModalOpen(true);
        setResponseId(response.id);
        //navigate(`/ticket/${response.id}`)
      }

      // Reset state after submission
      setStep(3);
      //setSelectedRow(null);
      //setTicketDetails({});
      //setTicketName(''); // Make sure ticketName is cleared
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
          `api/dbfile/add?db_table_id=448260E5-7A17-4381-A254-0B1D8FE53947&id_in_table=${ticketId}&description=Uploaded by Service Desk - ${ticketId2}`,
          'POST', auth.authKey, imagePayload
        );
      }

      //console.log(imageResponse);
    } catch (err) {
      // toast.error("Failed to upload image.");
      // alert("Failed to upload image.");
    }
  };

  return (
    <div className="min-w-[78%] p-1 md:p-8">
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
      <h1 className="justify-start text-zinc-900 text-3xl font-semibold mb-6">{t("Ticket creation")}</h1>

      {/* Step Indicator Bar */}
      <div className='w-full border-b-2 mb-4 border-gray-200'>
        <div className="mx-auto w-9/12 relative mb-16 mx-4">
          {/* Progress Line Background */}
          <div className="absolute w-full top-5 h-1 bg-gray-300 z-0" />

          {/* Progress Line Fill */}
          <div
            className="absolute top-5 w-full h-1 bg-lime-400 z-10 transition-all duration-300"
            style={{
              width: `${((step / 3) * 100).toFixed(2)}%`,
            }}
          ></div>

          {/* Steps */}
          <div className="flex justify-between w-full gap-0 relative z-20">
            {steps.map((item) => (
              <div key={item.id} className="text-center">
                {/* Step Circle */}
                <div
                  className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center relative z-10 ${step > item.id
                    ? "bg-lime-400 text-white"
                    : step === item.id
                      ? "bg-lime-400 text-white shadow-lg"
                      : "bg-gray-200 text-gray-300"
                    }`}
                >
                  {step > item.id
                    ? <Check className='w-6 h-6' />
                    : <Circle className='w-4 h-4 bg-white rounded-full text-white' />
                  }
                  <p className='mt-2 text-slate-700 text-base font-medium absolute top-12 w-max'>
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* <button
        onClick={() => navigate('/')} // Navigate back one step in history
        className="flex items-center mb-6 font-semibold text-zinc-900 text-base"
      >
        <ArrowLeft className="mr-2 w-5 h-5" /> {t("create_ticket_page_go_back")}
      </button> */}

      {step === 0 && (
        <>
          <div className="flex items-center my-2">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={() => setIncludeArchived(!includeArchived)}
              className="w-5 h-5 mr-2 outline outline-1 outline-offset-[-1px] outline-slate-300"
            />
            <label className="text-zinc-800 text-sm font-medium">{t('create_ticket_page_checkbox_label')}</label>
          </div>
          {/* Search Filter UI */}
          <div className="mb-6">
            <button onClick={() => setIsModalOpen(true)} className="flex justify-center items-center bg-white text-zinc-800 text-base font-medium leading-normal border border-zinc-800 w-48 px-5 py-3 rounded-md my-8">
              {t('create_ticket_page_filter_button')} <Filter size={24} className="ml-4" />
            </button>

            {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="relative w-80 p-4 bg-white rounded-lg shadow-md border space-y-4">
                  <button onClick={() => setIsModalOpen(false)} className="absolute -top-1 -right-1 bg-white text-zinc-800 text-base font-medium leading-normal border border-zinc-800 px-2 rounded-full">
                    x
                  </button>
                  {/* Header */}
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex justify-center items-center bg-white text-zinc-800 text-base font-medium leading-normal border border-zinc-800 w-48 px-4 py-2 rounded-md mb-2">
                      {t('create_ticket_page_filter_label')}
                      <Filter size={24} className="ml-4" />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-5 text-zinc-800" />
                    <input
                      name="location"
                      id="location"
                      type="text"
                      value={tempFilters.locationLabel}
                      onChange={handleLocationChange}
                      placeholder={t("create_ticket_page_filter_location")}
                      className="w-full pl-10 pr-3 py-2 border rounded-md text-gray-500 text-base font-normal focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                  </div>
                  {locationHints.length > 0 && (
                    <ul className="absolute z-10 bg-white border mt-1 rounded-md w-full shadow-md">
                      {locationHints.map(hint => (
                        <li
                          key={hint.id}
                          onClick={() => handleHintClick(hint)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
                        >
                          {hint.label}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Sub-Location */}
                  {/* <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Search by Sub-Location"
                          className="w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                        />
                      </div> */}

                  {/* Keyword */}
                  <div className="relative">
                    <Text className="absolute left-3 top-2.5 w-4 h-5 text-zinc-800" />
                    <input
                      name='keyword'
                      id='keyword'
                      type="text"
                      value={tempFilters.keyword}
                      onChange={(e) => setTempFilters(prev => ({ ...prev, keyword: e.target.value }))}
                      placeholder={t("create_ticket_page_filter_keyword")}
                      className="w-full pl-10 pr-3 py-2 border rounded-md text-gray-500 text-base font-normal focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                  </div>

                  {/* Brands */}
                  <div className="relative">
                    <Bold className="absolute left-3 top-2.5 w-4 h-5 text-zinc-800" />
                    <Select
                      components={animatedComponents}
                      options={brandOptions}
                      value={brandOptions.find(option => option.value === tempFilters.brand) || null} // match by ID
                      onChange={(selected) => setTempFilters((prev) => ({ ...prev, brand: selected.value, }))}
                      placeholder={t("create_ticket_page_filter_brands")}
                      className="w-full pl-10 border rounded-md text-gray-500 text-base font-normal"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          border: 'none',
                          boxShadow: 'none',
                        }),
                        placeholder: (base) => ({
                          ...base,
                          color: '#6b7280',
                        }),
                      }}
                    />
                  </div>

                  {/* Models */}
                  <div className="relative">
                    <Hash className="absolute left-3 top-2.5 w-4 h-5 text-zinc-800" />
                    <Select
                      components={animatedComponents}
                      options={modelOptions}
                      value={modelOptions.find(option => option.value === tempFilters.model) || null} // match by ID
                      onChange={(selected) => setTempFilters((prev) => ({ ...prev, model: selected.value, }))}
                      placeholder={t("create_ticket_page_filter_models")}
                      className="w-full pl-10 border rounded-md text-gray-500 text-base font-normal"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          border: 'none',
                          boxShadow: 'none',
                        }),
                        placeholder: (base) => ({
                          ...base,
                          color: '#6b7280',
                        }),
                      }}
                    />
                  </div>

                  {/* Status */}
                  <div className="relative">
                    <BarChart className="absolute left-3 top-2.5 w-4 h-5 text-zinc-800" />
                    <Select
                      components={animatedComponents}
                      options={statusOptions}
                      value={statusOptions.find(option => option.value === tempFilters.status) || null} // match by ID
                      onChange={(selected) => setTempFilters((prev) => ({ ...prev, status: selected.value, }))}
                      placeholder={t("create_ticket_page_filter_status")}
                      className="w-full pl-10 border rounded-md text-gray-500 text-base font-normal"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          border: 'none',
                          boxShadow: 'none',
                        }),
                        placeholder: (base) => ({
                          ...base,
                          color: '#6b7280',
                        }),
                      }}
                    />
                  </div>

                  {/* Footer buttons */}
                  <div className="grid grid-cols-2 gap-4 justify-between pt-2">
                    <button onClick={handleReset} disabled={isLoading} className="px-5 py-3 border rounded-md text-sm text-zinc-800 hover:bg-zinc-100">
                      {t('create_ticket_page_filter_reset')}
                    </button>
                    <button onClick={applyFilters} disabled={isLoading} className="px-5 py-3 bg-zinc-800 text-white rounded-md text-sm hover:bg-zinc-800">
                      {t('create_ticket_page_filter_confirm')}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2 px-4 pt-4">{t("create_ticket_step-1_title")}</h2>

            <div className="flex items-center mb-1 text-zinc-800 text-sm font-normal px-4 py-2">
              <BadgeInfo className='mr-2 w-5 h-5 text-slate-300' /> {t("create_ticket_step-1_helping_text")}
            </div>
            {/* Contacts Table */}
            <div className="overflow-x-auto">
              <table {...getTableProps()} className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-white">
                  {headerGroups.map((headerGroup, headerIndex) => (
                    <tr {...headerGroup.getHeaderGroupProps()} key={headerIndex} className="bg-white">
                      {headerGroup.headers.map((column, index) => (
                        <th {...column.getHeaderProps(column.getSortByToggleProps())}
                          className={`px-2 py-3 text-left whitespace-nowrap text-slate-500 text-xs font-medium leading-none ${index !== 0 ? 'border-r border-gray-300' : ''}`}>
                          {column.render('Header')}
                          {column.isSorted ? (
                            column.isSortedDesc ? (
                              <ArrowUp className="inline w-4 h-4 ml-1" />
                            ) : (
                              <ArrowDown className="inline w-4 h-4 ml-1" />
                            )
                          ) : null}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {!isLoading && renderRows(filteredContacts)}
                </tbody>
              </table>
            </div>
            {isLoading && <Loader className="ml-2 text-blue-600 animate-spin" />}
          </div>
        </>
      )}

      {step === 1 && (
        <div className="w-full max-w-3xl mx-auto">
          <h2 className="text-zinc-900 text-xl font-semibold mb-6">{t("create_ticket_step-2_title")}</h2>
          <p className='mb-2 text-gray-400 text-sm font-medium leading-tight'>{t("create_ticket_step-2_subtitle")}</p>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='shadow-sm border rounded-lg bg-white p-4 '>
              <h4 className="text-zinc-900 text-xs font-semibold leading-normal">{t("create_ticket_step-2_address")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="text-sm list-none list-inside text-slate-500 text-xs font-medium">
                <li className='flex items-center'><MapPin className='w-4 h-4 mr-2' />{selectedRow.db_address_street}</li>
                <li className='ml-6 pb-1'>{selectedRow.db_address} {selectedRow.db_address_zip}</li>
              </ul>
            </div>

            <div className='shadow-sm border rounded-lg bg-white p-4 '>
              <h4 className="text-zinc-900 text-xs font-semibold leading-normal">{t("create_ticket_step-2_equipment")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="text-sm list-none list-inside text-slate-500 text-xs font-medium">
                <li className='flex items-center'><Wrench className='w-4 h-4 mr-2' />{selectedRow.name}</li>
                <li className='ml-6 pb-1'>{selectedRow.equipment_family_name}</li>
                <li className='ml-6 pb-1'>{selectedRow.equipment_brand_name}</li>
                <li className='ml-6 pb-1'>{selectedRow.equipment_model_name}</li>
              </ul>
            </div>

            <div className='shadow-sm border rounded-lg bg-white p-4 '>
              <h4 className="text-zinc-900 text-xs font-semibold leading-normal">{t("create_ticket_step-2_properties")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="text-sm list-none list-inside text-slate-500 text-xs font-medium">
                <li className='grid grid-cols-2 gap-2 items-end'>{t("create_ticket_step-2_barcode")}: <span className='font-semibold'>{selectedRow.barcode || 'NA'}</span></li>
                <li className='grid grid-cols-2 gap-2 items-end'>{t("create_ticket_step-2_serial_number")}: <span className='font-semibold'>{selectedRow.serial_number || 'NA'}</span></li>
                <li className='grid grid-cols-2 gap-2 items-end'>{t("create_ticket_step-2_our_ref")}: <span className='font-semibold'>{selectedRow.customer_reference || 'NA'}</span></li>
                <li className='grid grid-cols-2 gap-2 items-end'>{t("create_ticket_step-2_supplier_ref")}: <span className='font-semibold'>{selectedRow.id2 || 'NA'}</span></li>
              </ul>
            </div>
          </div>
          <div className='w-full w-full mx-auto'>
            <hr className=' my-12 border-b-1 border-gray-200' />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
            <div className="mb-8">
              <div className="flex flex-row gap-8">
                <div className="relative basis-1/2">
                  <TicketX className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
                  <select
                    value={ticketDetails.ticketType}
                    onChange={(e) => handleInputChange('ticketType', e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md text-gray-500 text-base font-normal leading-normal"
                    required
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        border: 'none',
                        boxShadow: 'none',
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: '#6b7280',
                      }),
                    }}
                  >
                    <option>{t("create_ticket_step-2_select_ticket_type")}</option>
                    {ticketTypes.map((ticketType, index) => (
                      <option key={index} value={ticketType.name}> {ticketType.name} </option>
                    ))}
                  </select>
                </div>

                <div className="relative basis-1/2">
                  <Thermometer className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
                  <select
                    value={ticketDetails.severity}
                    onChange={(e) => handleInputChange('severity', e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md text-gray-500 text-base font-normal leading-normal"
                    required
                    styles={{
                      control: (base) => ({
                        ...base,
                        border: 'none',
                        boxShadow: 'none',
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: '#6b7280',
                      }),
                    }}
                  >
                    <option>{t("create_ticket_step-2_select_severity")}</option>
                    {severities.map((severity, index) => (
                      <option key={index} value={severity.name}> {severity.name} </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-slate-700 text-sm font-medium leading-tight">{t("create_ticket_step-2_issue_inputbox_label")}</label>
              <input
                type="text"
                maxLength={50}
                value={ticketName}
                onChange={handleNameChange}
                placeholder={t('create_ticket_step-2_issue_inputbox_placeholder')}
                className="mt-1 p-2 text-gray-400 font-normal leading-normal text-base w-full border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-red-500 text-xs font-normal leading-normal mt-1 text-end">
                {50 - ticketName.length} {t("create_ticket_step-2_characters_remaining_text")}
              </p>
            </div>

            <div className="mb-4">
              <textarea
                maxLength={255}
                value={textarea}
                onChange={(e) => handleInputChange('problemDescription', e.target.value)}
                placeholder={t('create_ticket_step-2_description_textbox_placeholder')}
                className="mt-1 p-2 text-gray-400 font-normal leading-normal text-base w-full border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-red-500 text-xs font-normal leading-normal mt-1 text-end">
                {255 - textarea.length} {t("create_ticket_step-2_characters_remaining_text")}
              </p>
            </div>

            {/* File Upload Field */}
            <div className="w-full mx-auto">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-40 px-4 transition bg-white border-1 border rounded-md cursor-pointer border-gray-300"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 mb-3 p-1.5 rounded-3xl text-zinc-800 bg-gray-200" />
                  <p className="mb-2 text-zinc-800 text-sm leading-tight">
                    <span className="font-medium">{t("create_ticket_step-2_upload_inputfile_label")}</span>
                  </p>
                  <p className="text-gray-500 text-xs font-normal leading-none">{t("create_ticket_step-2_upload_inputfile_name")}</p>
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
              <button onClick={() => setStep(0)} className="w-48 px-5 py-3 border border-2 bg-white rounded-lg flex items-center justify-center text-zinc-800 text-base font-medium leading-normal hover:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
                {t('create_ticket_popup_button_back')}
              </button>
              <button type="submit" className="w-48 px-5 py-3 ml-2 bg-zinc-800 rounded-lg flex items-center justify-center text-pink-50 text-base font-medium leading-normal hover:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
                {t('create_ticket_popup_button_next')}
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 2 && (
        <div className="mt-4 p-6 w-full max-w-2xl mx-auto">
          <h2 className="text-zinc-900 text-xl font-semibold mb-4">{t("create_ticket_page_step-3_title")}</h2>
          <div className="text-zinc-900 text-sm text-base font-normal mb-8">{t("create_ticket_page_step-3_subtitle")}</div>

          <form onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
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
                    {selectedTime || t('create_ticket_page_step-3_time_select')}
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

            </div>
            <div className='text-zinc-900 text-base font-medium my-8'>
              {t("create_ticket_page_step-3_selected_date_time")}
              <span className='underline ml-4'>{date.toLocaleDateString('en-BE', { year: 'numeric', month: 'long', day: 'numeric' })} | {selectedTime || '08:00'}</span>
            </div>


            {/* Navigation Buttons */}
            <div className="mt-4 flex justify-end">
              <button onClick={() => setStep(1)} className="w-48 px-5 py-3 border border-2 bg-white rounded-lg flex items-center justify-center text-zinc-800 text-base font-medium leading-normal hover:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
                {t('create_ticket_popup_button_back')}
              </button>
              <button type="submit" className="w-48 px-5 py-3 ml-2 bg-zinc-800 rounded-lg flex items-center justify-center text-pink-50 text-base font-medium leading-normal hover:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
                {t('create_ticket_popup_button_next')}
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 3 && (
        <div className="w-full max-w-3xl mx-auto">
          <h2 className="text-zinc-900 text-xl font-semibold mb-4">{t("create_ticket_step-4_title")}</h2>

          {isSubmitModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-60">
              <div className="w-96 p-8 bg-white rounded-lg shadow-md border space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <CircleCheckBig className="w-6 h-6 text-emerald-500" />
                    <h2 className="text-lg font-semibold text-emerald-500">{t("create_ticket_popup_title")}</h2>
                  </div>
                  <X className="w-6 h-6 text-rose-500 cursur-pointer" onClick={() => setIsSubmitModalOpen(false)} />
                </div>
                <p className='px-2'>{t("create_ticket_popup_text")}</p>
                {/* Footer buttons */}
                <div className="flex justify-between pt-2">
                  <button onClick={() => navigate(`/`)} className="px-4 py-2 border border-2 bg-white rounded-lg flex items-center justify-center text-zinc-800 text-base font-medium leading-normal hover:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
                    {t('create_ticket_popup_button_back_home')}
                  </button>
                  <button onClick={() => navigate(`/ticket/${responseId}`)} className="px-4 py-2 ml-2 bg-zinc-800 rounded-lg flex items-center justify-center text-pink-50 text-base font-medium leading-normal hover:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
                    {t('create_ticket_popup_button_view_ticket')}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='shadow-sm rounded-lg bg-white p-4 '>
              <h4 className="text-zinc-900 text-xs font-semibold leading-normal">{t("create_ticket_step-4_address")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="text-sm list-none list-inside text-slate-500 text-xs font-medium">
                <li className='flex items-center'><MapPin className='w-4 h-4 mr-2' />{selectedRow?.db_address_street}</li>
                <li className='ml-6 pb-1'>{selectedRow?.db_address} {selectedRow?.db_address_zip}</li>
              </ul>
            </div>

            <div className='shadow-sm border rounded-lg bg-white p-4 '>
              <h4 className="text-zinc-900 text-xs font-semibold leading-normal">{t("create_ticket_step-4_equipment")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="text-sm list-none list-inside text-slate-500 text-xs font-medium">
                <li className='flex items-center'><Wrench className='w-4 h-4 mr-2' />{selectedRow?.name}</li>
                <li className='ml-6 pb-1'>{selectedRow?.equipment_family_name}</li>
                <li className='ml-6 pb-1'>{selectedRow?.equipment_brand_name}</li>
                <li className='ml-6 pb-1'>{selectedRow?.equipment_model_name}</li>
              </ul>
            </div>

            <div className='shadow-sm border rounded-lg bg-white p-4 '>
              <h4 className="text-zinc-900 text-xs font-semibold leading-normal">{t("create_ticket_step-4_properties")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="text-sm list-none list-inside text-slate-500 text-xs font-medium">
                <li className='grid grid-cols-2 gap-4 items-end'>{t("create_ticket_step-4_barcode")}: <span className='font-semibold'>{selectedRow?.barcode || 'NA'}</span></li>
                <li className='grid grid-cols-2 gap-4 items-end'>{t("create_ticket_step-4_serial_number")}: <span className='font-semibold'>{selectedRow?.serial_number || 'NA'}</span></li>
                <li className='grid grid-cols-2 gap-4 items-end'>{t("create_ticket_step-4_our_ref")}: <span className='font-semibold'>{selectedRow?.customer_reference || 'NA'}</span></li>
                <li className='grid grid-cols-2 gap-4 items-end'>{t("create_ticket_step-4_supplier_ref")}: <span className='font-semibold'>{selectedRow?.id2 || 'NA'}</span></li>
              </ul>
            </div>

            <div className='shadow-sm border rounded-lg bg-white p-4 '>
              <h4 className='text-zinc-900 text-xs font-semibold leading-normal'>{t("create_ticket_step-4_preferred_date_time")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="text-sm list-none list-inside text-slate-500 text-xs font-medium">
                <li>{date.toLocaleDateString('nl-BE')} {selectedTime}</li>
              </ul>
            </div>
            <div className='shadow-sm border rounded-lg bg-white p-4 '>
              <h4 className='text-zinc-900 text-xs font-semibold leading-normal'>{t("create_ticket_step-4_severity")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="text-sm list-none list-inside text-slate-500 text-xs font-medium">
                <li>
                  <span className={`font-medium me-2 ${severityType[ticketDetails.severity] || "text-gray-300"}`}>
                    {ticketDetails.severity}
                  </span>
                </li>
              </ul>
            </div>
            <div className='shadow-sm border rounded-lg bg-white p-4 '>
              <h4 className='text-zinc-900 text-xs font-semibold leading-normal'>{t("create_ticket_step-4_ticket_subject")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="text-sm list-none list-inside text-slate-500 text-xs font-medium">
                <li>{ticketName}</li>
              </ul>
            </div>

            <div className='col-span-3 shadow-sm border bg-white rounded-lg p-4 '>
              <h4 className='text-zinc-900 text-xs font-semibold leading-normal'>{t("create_ticket_step-4_description")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="text-sm list-none list-inside text-slate-500 text-xs font-medium min-h-24">
                <li>{ticketDetails.problemDescription}</li>
              </ul>

            </div>
            <div className='col-span-3 shadow-sm border bg-white rounded-lg p-4 '>
              <h4 className="text-zinc-900 text-xs font-semibold leading-normal my-2">{t("create_ticket_step-4_files_uploaded")}</h4>

              {/* File Thumbnails Grid */}
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 min-h-8">
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
            <button onClick={() => setStep(2)} className="w-48 px-5 py-3 border border-2 bg-white rounded-lg flex items-center justify-center text-zinc-800 text-base font-medium leading-normal hover:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
              {t('create_ticket_popup_button_back')}
            </button>
            <button onClick={handleSubmitTicket} className="w-48 px-5 py-3 ml-2 bg-zinc-800 rounded-lg flex items-center justify-center text-pink-50 text-base font-medium leading-normal hover:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
              {t('create_ticket_popup_button_confirm')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTicket;