import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { fetchDocuments } from '../services/apiServiceDocuments';
import { downloadFiles } from "../services/apiServiceDownloads";
import { useTable, useSortBy, usePagination } from 'react-table';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { CalendarClock, File, FileText, Loader, Eye, ArrowLeft, ArrowUpRight, ArrowDownLeft, Circle, MapPin, Phone, Image, Wrench, ArrowDown, ArrowUp, ArrowLeftToLine, ArrowRightToLine, ArrowRight, BadgeInfo } from "lucide-react";
import { useTranslation } from "react-i18next";

const SingleInstallation = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { InstallationId } = useParams();
  const [installation, setInstallation] = useState(null);
  const [rootParentDetails, setRootParentDetails] = useState(null);
  const [contractDetails, setContractDetails] = useState(null);
  const [doc, setDoc] = useState([]);
  const [wordOrder, setWordOrder] = useState([]);
  //const [file, setFile] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // State to manage active tab
  const [fileThumbnails, setFileThumbnails] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [downloadMsg, setDownloadMsg] = useState('');

  const [expandedRowId, setExpandedRowId] = useState(null);
  const [activeSection, setActiveSection] = useState(null); // 'popup' | 'remarks'
  const [popupDataMap, setPopupDataMap] = useState({});
  const [remarksDataMap, setRemarksDataMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});

  const [isCorrectiveExpanded, setCorrectiveExpanded] = useState(false);
  const [expandedPreventives, setExpandedPreventives] = useState({});

  const STORAGE_KEY = `SingleInstallationState_${InstallationId || 'global'}`;

  const { t } = useTranslation('singleEquipment');

  const url = `https://servicedeskapi.wello.solutions/`;

  const statusColors = useMemo(() => ({
    "In progress": "bg-yellow-100 text-yellow-600",
    "Planned": "bg-blue-100 text-blue-600",
    "To be Planned": "bg-purple-100 text-purple-600",
    "Out of production": "bg-orange-100 text-orange-600",
    "Active": "bg-green-100 text-green-600",
    "Ready for Review": "bg-indigo-100 text-indigo-600",
    "Proactive": "bg-indigo-100 text-indigo-600",
    "Cancelled": "bg-red-100 text-red-600",
    "Completed": "bg-pink-100 text-pink-600",
  }), []);

  const statusDotColors = useMemo(() => ({
    "In progress": "bg-yellow-600 text-yellow-600",
    "Planned": "bg-blue-600 text-blue-600",
    "To be Planned": "bg-purple-600 text-purple-600",
    "Out of production": "bg-orange-600 text-orange-600",
    "Active": "bg-green-600 text-green-600",
    "Ready for Review": "bg-indigo-600 text-indigo-600",
    "Proactive": "bg-indigo-600 text-indigo-600",
    "Cancelled": "bg-red-600 text-red-600",
    "Completed": "bg-pink-600 text-pink-600",
  }), []);

  useEffect(() => {
    if (downloadMsg) {
      toast.success("Downloading!");
    }
  }, [downloadMsg]);


  useEffect(() => {
    const getInstallationAndRootParentDetails = async () => {
      try {
        if (!InstallationId) {
          setError("single_equipment_page_err_no_ticket_id");
          setLoading(false);
          return;
        }

        setLoading(true);

        // 1️⃣ Fetch Installation Details
        const installationEndpoint = `api/ProjectView(${InstallationId})`;
        const installationData = await fetchDocuments(installationEndpoint, "GET", auth.authKey);
        setInstallation(installationData);

        // 2️⃣ Fetch Root Parent Details (only if available)
        if (installationData?.root_parent_id) {
          const rootParentEndpoint = `api/ProjectView(${installationData.root_parent_id})`;
          const rootParentData = await fetchDocuments(rootParentEndpoint, "GET", auth.authKey);
          setRootParentDetails(rootParentData);
        }
      } catch (err) {
        console.error("Error fetching installation or root parent details:", err);
        setError("single_equipment_page_err_failed_to_fetch_installation_details");
      } finally {
        setLoading(false);
      }
    };

    getInstallationAndRootParentDetails();
  }, [auth.authKey, InstallationId]);

  useEffect(() => {
    const getInstallationDoc = async () => {
      try {
        const endpoint_1 = `api/DbFileView?$filter=db_table_name+eq+%27project%27+and+id_in_table+eq+${InstallationId}`;
        const data_1 = await fetchDocuments(endpoint_1, 'GET', auth.authKey);
        setDoc(data_1.value);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError('single_equipment_page_err_failed_to_fetch_document');
      }
    };
    if (InstallationId) {
      getInstallationDoc();
    }
  }, [auth, InstallationId]);

  useEffect(() => {
    const getInstallationSub = async () => {
      try {
        const endpoint_2 = `api/JobsView/SearchAllJobsOfLocation`;
        //const endpoint_2 = `api/JobsView/SearchAllJobsLinkToProject`;
        const payload = { "project_id": `${InstallationId}`, "year": null, "query_object": { "startRow": 0, "endRow": 500, "rowGroupCols": [], "valueCols": [], "pivotCols": [], "pivotMode": false, "groupKeys": [], "filterModel": {}, "sortModel": [] } }
        const data_2 = await fetchDocuments(endpoint_2, 'POST', auth.authKey, payload);
        setWordOrder(data_2);
        //console.log(data_2);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError('single_equipment_page_err_failed_to_fetch_document');
      }
    };
    if (InstallationId) {
      getInstallationSub();
    }
  }, [auth, InstallationId]);

  useEffect(() => {
    const getContractDetails = async () => {
      try {
        const endpoint = `api/ContractView/ContractEntitlementsByProject?projectId=${installation.id}`;
        const data = await fetchDocuments(endpoint, 'GET', auth.authKey);
        setContractDetails(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching Installation details:", err);
        setError('single_equipment_page_err_failed_to_fetch_contract_details');
        setLoading(false);
      }
    };
    if (installation?.id) {
      getContractDetails();
    }
  }, [auth, installation?.id]);


  // Funtions for fetching data on icon click
  const handleCalendarClick = useCallback(async (rowId) => {
    // if same row clicked again, toggle collapse
    if (expandedRowId === rowId && activeSection === "popup") {
      setExpandedRowId(null);
      setActiveSection(null);
      return;
    }

    setExpandedRowId(rowId);
    setActiveSection("popup");

    // if cached, don’t refetch
    if (popupDataMap[rowId]) return;

    setLoadingMap(prev => ({ ...prev, [rowId]: true }));
    try {
      const response = await fetchDocuments(`api/JobPlanningView?$filter=jobs_id eq ${rowId}&$orderby=date_from`);
      const res = response.value;
      setPopupDataMap(prev => ({ ...prev, [rowId]: res }));
    } finally {
      setLoadingMap(prev => ({ ...prev, [rowId]: false }));
    }
  }, [expandedRowId, activeSection, popupDataMap]);

  const handleRemarksClick = useCallback(async (rowId) => {
    if (expandedRowId === rowId && activeSection === "remarks") {
      setExpandedRowId(null);
      setActiveSection(null);
      return;
    }

    setExpandedRowId(rowId);
    setActiveSection("remarks");

    if (remarksDataMap[rowId]) return;

    setLoadingMap(prev => ({ ...prev, [rowId]: true }));
    try {
      const response = await fetchDocuments(`api/JobsView/GetAllTechnicianRemarksOfJob?jobs_id=${rowId}`);
      const res = response;
      setRemarksDataMap(prev => ({ ...prev, [rowId]: res }));
    } finally {
      setLoadingMap(prev => ({ ...prev, [rowId]: false }));
    }
  }, [expandedRowId, activeSection, remarksDataMap]);

  const columns = useMemo(
    () => [
      {
        Header: t('single_equipment_page_work_order_table_reference_text'), accessor: 'id2',
        Cell: ({ row }) => (
          <div className="text-center">
            <span className="font-semibold">
              {row.original.id2}
            </span>
          </div>
        ),
      },
      {
        Header: t('single_equipment_page_work_order_table_planned_date_text'),
        accessor: 'date_create',
        Cell: ({ row, value }) => {
          const displayDate =
            new Date(value).getFullYear() !== 1980
              ? new Date(value).toLocaleDateString(undefined)
              : ' ';

          const showCalendarIcon = row.original.job_planning_count > 1;
          const showFileIcon = row.original.nb_notes > 0;

          return (
            <span className="flex justify-between items-center gap-2" >
              <span>{displayDate}</span>
              < span className="flex gap-2 justify-end">
                {showCalendarIcon && (
                  <CalendarClock
                    className="w-5 h-5 cursor-pointer"
                    onClick={() => handleCalendarClick(row.original.id)
                    }
                  />
                )
                }
                {
                  showFileIcon && (
                    <FileText
                      className="w-5 h-5 cursor-pointer"
                      onClick={() => handleRemarksClick(row.original.id)
                      }
                    />
                  )}
              </span>
            </span>
          );
        },
      },
      {
        Header: t('single_equipment_page_work_order_table_scheduled_technician_text'), accessor: 'first_planning_userfullname',
        Cell: ({ value }) => value ? '' + value : t('NA')
      },
      {
        Header: t('single_equipment_page_work_order_table_close_date_text'), accessor: 'date_closed',
        Cell: ({ value }) => {
          const dateStr = value;
          const date =
            dateStr && new Date(dateStr).getFullYear() !== 1980
              ? new Date(dateStr)
              : null;

          return (
            <span className="flex justify-between items-center">
              {date
                ? date.toLocaleString(undefined, {
                  year: '2-digit',
                  month: '2-digit',
                  day: '2-digit',
                })
                : t('NA')}
            </span>
          );
        },
      },
      {
        Header: t('single_equipment_page_work_order_table_type_text'), accessor: 'job_type_name',
        Cell: ({ row }) => (
          <span className={`text-xs font-medium`}>
            {row.original.job_type_name}
          </span>
        ),
      },
      {
        Header: t('single_equipment_page_work_order_table_status_text'), accessor: 'job_status_name',
        Cell: ({ row }) => (
          <span className={`text-xs min-w-max inline-flex items-center font-medium pe-3 px-2 pb-1 pt-0.5 rounded-full ${statusColors[row.original.job_status_name] || "bg-gray-200 text-gray-800"}`}>
            <Circle className={`inline w-2 h-2 mr-1 rounded-full ${statusDotColors[row.original.job_status_name] || "bg-gray-800 text-gray-800"}`} />
            {row.original.job_status_name}
          </span>
        ),
      },
    ],
    [statusColors, statusDotColors, handleCalendarClick, handleRemarksClick, t]
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
      data: wordOrder,
      initialState: { pageIndex: 0, pageSize: 12 }, // Set initial page size to 10
    },
    useSortBy,
    usePagination,
  );

  // Restore small UI state on mount (tab, selected files, expanded rows)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.activeTab) setActiveTab(saved.activeTab);
      if (Array.isArray(saved.selectedFiles)) setSelectedFiles(saved.selectedFiles);
      if (saved.expandedRowId) setExpandedRowId(saved.expandedRowId);
      if (saved.isCorrectiveExpanded) setCorrectiveExpanded(saved.isCorrectiveExpanded);
      if (saved.expandedPreventives) setExpandedPreventives(saved.expandedPreventives);
    } catch (e) {
      // ignore parse/storage errors
    }
  }, [STORAGE_KEY]);

  // Restore pagination (when table hooks available)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved.pageIndex !== 'undefined' && typeof gotoPage === 'function') {
        gotoPage(Number(saved.pageIndex) || 0);
      }
      if (typeof saved.pageSize !== 'undefined' && typeof setPageSize === 'function') {
        setPageSize(Number(saved.pageSize) || 12);
      }
    } catch (e) {
      // ignore
    }
  }, [gotoPage, setPageSize, STORAGE_KEY]);

  // Persist UI + pagination state
  useEffect(() => {
    try {
      const toSave = {
        activeTab,
        selectedFiles,
        expandedRowId,
        expandedPreventives,
        pageIndex,
        pageSize,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      // ignore storage errors
    }
  }, [activeTab, selectedFiles, expandedRowId, expandedPreventives, pageIndex, pageSize, STORAGE_KEY]);

  useEffect(() => {
    const GetFileThumbnails = async () => {
      try {
        if (!doc || doc.length === 0) return;

        const authKey = auth?.authKey;
        if (!authKey) return;

        const updatedThumbnails = {};

        await Promise.all(
          doc.map(async (item) => {
            if (!item.id) return;

            try {
              const endpoint = `api/DbFileView/GetFileThumbnail/?id=${item.id}&maxWidth=500&maxHeight=500`;

              // fetchDocuments returns blob when accept = "image/png"
              const blob = await fetchDocuments(endpoint, "GET", authKey, null, "image/png");

              updatedThumbnails[item.id] = URL.createObjectURL(blob);
            } catch (err) {
              console.warn(`Failed to fetch thumbnail for ${item.id}:`, err);
              // Skip just this item; do not throw to keep Promise.all alive
            }
          })
        );

        setFileThumbnails(updatedThumbnails);
      } catch (err) {
        console.error("Error fetching thumbnails:", err);
        setError("single_work_order_page_err_failed_to_fetch_thumbnail");
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === "documents") {
      GetFileThumbnails();
    }
  }, [doc, auth, activeTab]);


  const handleDownloadAll = async () => {
    await downloadFiles(url, auth.authKey, doc.map(d => d.id));
    setDownloadMsg("Downloading all files...");
  };

  const handleDownloadSelected = async () => {
    const ids = selectedFiles.map(f => f.id);

    let fallbackName = "download.zip";
    if (ids.length === 1) {
      const file = selectedFiles.find(f => f.id === ids[0]);
      if (file?.name) {
        fallbackName = file.name; // keep original filename if possible
      }
    }

    await downloadFiles(url, auth.authKey, ids, fallbackName);
    setDownloadMsg("Downloading selected files...");
  };

  const toggleFileSelection = (file) => {
    setSelectedFiles((prev) =>
      prev.some((f) => f.id === file.id)
        ? prev.filter((f) => f.id !== file.id)
        : [...prev, file]
    );
  };

  const toggleCorrectiveExpand = () => {
    setCorrectiveExpanded(prev => !prev);
  };



  const toggleExpand = (index) => {
    setExpandedPreventives((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };


  if (loading) {
    return <div className="flex w-full items-center justify-center h-screen">
      <div className="relative">
        <div className="w-20 h-20 border-purple-200 border-2 rounded-full"></div>
        <div className="w-20 h-20 border-purple-700 border-t-2 animate-spin rounded-full absolute left-0 top-0"></div>
      </div>
    </div>;
  }
  if (error) return <div className="text-center text-red-600">{error}</div>;


  // const fileIcons = {
  //   pdf: <FileText className="w-32 h-32 text-red-500" />,
  //   doc: <FileText className="w-32 h-32 text-blue-500" />,
  //   docx: <FileText className="w-32 h-32 text-blue-500" />,
  //   xls: <FileSpreadsheet className="w-32 h-32 text-green-500" />,
  //   xlsx: <FileSpreadsheet className="w-32 h-32 text-green-500" />,
  //   txt: <FileSignature className="w-32 h-32 text-gray-500" />,
  //   ppt: <FileText className="w-32 h-32 text-orange-500" />,
  //   pptx: <FileText className="w-32 h-32 text-orange-500" />,
  //   zip: <FileArchive className="w-32 h-32 text-yellow-500" />,
  //   rar: <FileArchive className="w-32 h-32 text-yellow-500" />,
  // };

  return (
    <div className="mx-auto w-full p-6 bg-white">
      <div className='flex'>
        {/* Back Button */}
        <button
          onClick={() => {
            if (activeTab !== 'details') {
              setActiveTab('details');
            } else {
              navigate(-1);
            }
          }}
          className="flex items-center mb-6 font-semibold text-zinc-900 text-base"
        >
          <ArrowLeft className="mr-2 w-5 h-5" />
          {t("single_equipment_page_go_back")}
        </button>
      </div>

      <div className='shadow-md rounded-lg'>
        <h2 className="px-8 pt-8 capitalize text-zinc-900 text-2xl font-semibold mb-4">{t("single_equipment_page_reference")}: {installation?.id2} | {installation?.name}</h2>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8 px-8">
          <button
            className={`px-4 py-2 mr-2 text-lg font-medium leading-7 ${activeTab === 'details' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-slate-500'}`}
            onClick={() => setActiveTab('details')}
          >
            {t("single_equipment_page_ticket_details")}
          </button>
          <button
            className={`px-4 py-2 mr-2 text-lg font-medium leading-7 ${activeTab === 'documents' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-slate-500'}`}
            onClick={() => setActiveTab('documents')}
          >
            {t("single_equipment_page_documents")}
          </button>
          <button
            className={`px-4 py-2 mr-2 text-lg font-medium leading-7 ${activeTab === 'wordOrder' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-slate-500'}`}
            onClick={() => setActiveTab('wordOrder')}
          >
            {t("single_equipment_page_work_orders")}
          </button>
          <button
            className={`px-4 py-2 mr-2 text-lg font-medium leading-7 ${activeTab === 'contractEntitlements' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-slate-500'}`}
            onClick={() => setActiveTab('contractEntitlements')}
          >
            {t("single_equipment_page_contract_entitlements")}
          </button>
        </div>

        {activeTab === 'details' ? (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 px-12 pb-12'>
            <div className='shadow-sm border rounded-lg p-4 '>
              <h4 className="block text-zinc-900 text-xs font-semibold leading-normal">{t("single_equipment_page_equipment")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-slate-500 text-xs font-medium">
                <li className='flex items-center'><Wrench className='w-4 h-4 mr-2' />{installation?.name}</li>
                <li className='ml-6 pb-1'>{installation?.equipment_family_name}</li>
                <li className='ml-6 pb-1'>{installation?.equipment_brand_name}</li>
                <li className='ml-6 pb-1'>{installation?.equipment_model_name}</li>
              </ul>
            </div>

            <div className='shadow-sm border rounded-lg p-4 '>
              <h4 className="block text-zinc-900 text-xs font-semibold leading-normal">{t("single_equipment_page_type_status")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-slate-500 text-xs font-medium">
                <li>{installation?.equipment_family_name}</li>
                <li className='mt-2.5'>
                  <span className={`pe-3 px-2 pb-1 pt-0.5 rounded-full ${statusColors[installation?.project_status_name] || "bg-gray-200 text-gray-800"}`}>
                    <Circle className={`inline w-2 h-2 mr-1 rounded-full ${statusDotColors[installation?.project_status_name] || "bg-gray-800 text-gray-800"}`} />
                    {installation?.project_status_name}
                  </span>
                </li>
              </ul>
            </div>

            <div className='shadow-sm border rounded-lg p-4 '>
              <h4 className="block text-zinc-900 text-xs font-semibold leading-normal">{t("single_equipment_page_properties")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-slate-500 text-xs font-medium">
                <li className='grid grid-cols-2 gap-4'>{t("single_equipment_page_barcode")}: <span className='font-semibold text-gray-700'>{installation?.barcode}</span></li>
                <li className='grid grid-cols-2 gap-4'>{t("single_equipment_page_serial_number")}: <span className='font-semibold text-gray-700'>{installation?.serial_number}</span></li>
                <li className='grid grid-cols-2 gap-4'>{t("single_equipment_page_our_ref")}: <span className='font-semibold text-gray-700'>{installation?.customer_reference}</span></li>
                <li className='grid grid-cols-2 gap-4'>{t("single_equipment_page_supplier_ref")}: <span className='font-semibold text-gray-700'>{installation?.id2}</span></li>
              </ul>
            </div>

            <div className='md:col-span-3 shadow-sm border rounded-lg p-4 '>
              <h4 className="block text-zinc-900 text-xs font-semibold leading-normal">{t("single_equipment_page_shutdown_consequence")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-slate-500 text-xs font-medium">
                <li>{installation?.shutdown_consequence}</li>
              </ul>
            </div>

            {(rootParentDetails?.name || installation?.company_name) && (
              <div className='shadow-sm border rounded-lg p-4'>
                <h4 className="block text-zinc-900 text-xs font-semibold leading-normal">
                  {rootParentDetails?.name ? t("Location") : t("single_equipment_page_location")}
                </h4>
                <hr className='my-2 w-32 border-gray-300' />
                <ul className="list-none list-inside text-slate-500 text-xs font-medium">
                  <li className='flex items-center'>
                    <MapPin className='w-4 h-4 mr-2' />
                    {rootParentDetails?.name || installation?.name}
                  </li>
                  <li className='ml-6 pb-1'>
                    {rootParentDetails?.db_address_street || installation?.db_address_street}
                    {' '}
                    {rootParentDetails?.db_address_street_number || ''}
                  </li>
                  <li className='ml-6 pb-1'>
                    {rootParentDetails?.db_address_zip || installation?.db_address_zip}
                    {' '}
                    {rootParentDetails?.db_address_city || installation?.db_address_city}
                  </li>
                  {(rootParentDetails?.contact_mobile || installation?.contact_mobile) && (
                    <li className='flex items-center'>
                      <Phone className="w-4 h-4 mr-1" />
                      {rootParentDetails?.contact_mobile || installation?.contact_mobile}
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className='shadow-sm border rounded-lg p-4 '>
              <h4 className="block text-zinc-900 text-xs font-semibold leading-normal">{t("single_equipment_page_extra_location_info")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-slate-500 text-xs font-medium">
                <li>{installation?.total_time_planned}</li>
              </ul>
            </div>

            <div className='shadow-sm border rounded-lg p-4 '>
              <h4 className="block text-zinc-900 text-xs font-semibold leading-normal">{t("single_equipment_page_company_address")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-slate-500 text-xs font-medium">
                <li className='flex items-center'><MapPin className='w-4 h-4 mr-2' />{installation?.db_address_street}</li>
                <li className='ml-6 pb-1'>{installation?.db_address_zip} {installation?.db_address_city}</li>
                {installation?.contact_mobile &&
                  <li className='flex items-center'><Phone className="w-4 h-4 mr-1" />{installation?.contact_mobile}</li>}
              </ul>
            </div>

          </div>
        ) : activeTab === 'documents' ? (
          <div>
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

            {doc?.length > 0 ? (
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4 px-12 pb-12'>
                {doc.map(item => (
                  <div key={item.id} className="p-2 flex flex-col border rounded-lg shadow-md">
                    <div className='flex flex-col items-center'>
                      {/* Show image thumbnail if it's an image, otherwise show file icon */}
                      {item.mime_type?.startsWith("image/") ? (
                        fileThumbnails[item.id] ? (
                          <img
                            src={fileThumbnails[item.id]}
                            alt={item.name}
                            className="w-48 h-40 object-cover rounded-md mx-auto"
                          />
                        ) : (
                          <div className="relative w-40 h-40 flex items-center justify-center mx-auto bg-gray-100 rounded-md">
                            {/* Loading overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-gray-500"></div>
                            </div>

                            {/* Fallback icon */}
                            <Image className="w-20 h-20 text-gray-300" />
                          </div>
                        )
                      ) : (
                        <File className="w-40 h-40 text-gray-600 mx-auto" />
                      )}
                    </div>
                    <div className='flex flex-col'>
                      <h4 className="text-gray-500 text-sm py-1 break-words">{item.name}</h4>

                      <p className="text-gray-500 text-sm">{new Date(item.date_add).toLocaleString()}</p>

                      {item.file_name ? (
                        <label className="mt-2 flex space-x-2 items-start text-sm">
                          <input
                            type="checkbox"
                            onChange={() => toggleFileSelection(item)}
                            checked={selectedFiles.some((file) => file.id === item.id)}
                            className='mt-1'
                          /><span>{t("single_equipment_page_select_to_download")}</span>
                        </label>) : null}

                      {/* Show "View Document" only if it's an image */}

                      <a href={fileThumbnails[item.id] || ""} target="_blank" rel="noopener noreferrer" className="flex items-center mt-2 text-sm hover:underline">
                        <Eye className="w-6 h-6 mr-2 text-gray-600" /> {t("single_equipment_page_view_document")}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (<p className="text-gray-800 p-4 font-semibold px-12 pb-12">{t("single_equipment_page_no_document")}</p>)
            }
            {!fileThumbnails && (!doc || doc.length === 0) && (
              <p className="text-gray-400 p-4 text-center px-12 pb-12">{t("single_equipment_page_no_document")}</p>
            )}
            {doc.length > 0 && (
              <div className='flex justify-end mt-4 px-12 pb-12'>
                {selectedFiles.length !== 0 && (
                  <button
                    onClick={handleDownloadSelected}
                    className="w-48 px-5 py-3 bg-zinc-800 rounded-lg flex items-center justify-center text-pink-50 text-base font-medium leading-normal hover:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
                    {t("single_equipment_page_download_button")}
                  </button>)}
                <button
                  onClick={handleDownloadAll}
                  className="w-48 px-5 py-3 ml-2 bg-zinc-800 rounded-lg flex items-center justify-center text-pink-50 text-base font-medium leading-normal hover:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
                  {t("single_equipment_page_download_all_button")}
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'wordOrder' ? (
          <>
            <div className="overflow-x-auto">
              <div className="flex items-center mb-1 text-zinc-800 text-sm font-normal px-4 py-2">
                <BadgeInfo className='mr-2 w-5 h-5 text-slate-300' /> {t("single_equipment_page_helping_text")}
              </div>
              <table {...getTableProps()} className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-gray-100">
                  {headerGroups.map(headerGroup => (
                    <tr {...headerGroup.getHeaderGroupProps()} className="bg-white divide-x divide-gray-300">
                      {headerGroup.headers.map(column => (
                        <th {...column.getHeaderProps(column.getSortByToggleProps())}
                          className="p-2 whitespace-nowrap text-left text-slate-500 text-xs font-medium leading-none">
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
                  {!loading &&
                    page.map(row => {
                      prepareRow(row);
                      return (
                        <React.Fragment key={row.id}>
                          <tr {...row.getRowProps()} className="hover:bg-gray-200">
                            {row.cells.map((cell, index) => (
                              <td
                                {...cell.getCellProps()}
                                className={`self-stretch p-2 text-xs font-normal text-zinc-900 ${index !== 1 ? 'cursor-pointer' : ''
                                  }`}
                                onClick={
                                  index !== 1 ? () => navigate(`/workorder/${row.original.id}`) : undefined
                                }
                              >
                                {cell.render('Cell')}
                              </td>
                            ))}
                          </tr>

                          {expandedRowId === row.original.id && (
                            <>
                              {/* --- Planned Dates and Technicians --- */}
                              {activeSection === 'popup' && (
                                <>
                                  {loadingMap[row.original.id] ? (
                                    <tr>
                                      <td colSpan={row.cells.length} className="bg-gray-50 p-4 text-center">
                                        <Loader size="36" className="m-2 text-blue-600 animate-spin inline-block" />
                                      </td>
                                    </tr>
                                  ) : popupDataMap[row.original.id]?.length > 0 && (
                                    <tr>
                                      <td colSpan={row.cells.length} className="bg-gray-50 p-4">
                                        <div className="p-1">
                                          <h4 className="text-sm font-semibold border-b-2 border-gray-200 pb-2 mb-2">
                                            {t('single_equipment_page_work_order_list_planned_date_technician')}
                                          </h4>
                                          <div className="flex gap-16 text-xs font-normal">
                                            <div>
                                              {Array.from(
                                                new Set(
                                                  popupDataMap[row.original.id].map(item =>
                                                    new Date(item.date_from).toLocaleDateString('en-GB', {
                                                      year: '2-digit',
                                                      month: '2-digit',
                                                      day: '2-digit',
                                                    })
                                                  )
                                                )
                                              ).map((date, index) => (
                                                <div key={index} className="text-gray-500 py-2">
                                                  {date}
                                                </div>
                                              ))}
                                            </div>
                                            <div>
                                              {popupDataMap[row.original.id].map(item => (
                                                <div key={item.id} className="flex gap-8 text-gray-500">
                                                  <span className="py-2">
                                                    {new Date(item.date_from).toLocaleTimeString('en-GB', {
                                                      timeZone: 'UTC',
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                    })}
                                                  </span>
                                                  <span className="py-2">
                                                    {item.user_firstname} {item.user_lastname}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </>
                              )}

                              {/* --- Technician Remarks --- */}
                              {activeSection === 'remarks' && (
                                <>
                                  {loadingMap[row.original.id] ? (
                                    <tr>
                                      <td colSpan={row.cells.length} className="bg-gray-50 p-4 text-center">
                                        <Loader size="36" className="m-2 text-blue-600 animate-spin inline-block" />
                                      </td>
                                    </tr>
                                  ) : remarksDataMap[row.original.id]?.length > 0 && (
                                    <tr>
                                      <td colSpan={row.cells.length} className="bg-gray-50 p-4">
                                        <div className="p-1">
                                          <table className="table-auto w-full text-xs font-normal text-left border-collapse">
                                            <thead>
                                              <tr className="text-gray-700 border-b">
                                                <th className="pb-2">{t("single_equipment_page_work_order_list_remarks_ref")}</th>
                                                <th className="pb-2">{t("single_equipment_page_work_order_list_remarks_technician")}</th>
                                                <th className="pb-2">{t("single_equipment_page_work_order_list_remarks_date")}</th>
                                                <th className="pb-2">{t("single_equipment_page_work_order_list_remarks_technicians_remarks")}</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {remarksDataMap[row.original.id].map(item => (
                                                <tr key={item.id} className="text-gray-500 border-b last:border-none">
                                                  <td className="py-2 font-medium">{item.object_id2}</td>
                                                  <td className="py-2">{item.user_fullname}</td>
                                                  <td className="py-2 font-medium text-gray-700">
                                                    {new Date(item.date_add).toLocaleDateString('en-GB', {
                                                      timeZone: 'UTC',
                                                      year: '2-digit',
                                                      month: '2-digit',
                                                      day: '2-digit',
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                    })}
                                                  </td>
                                                  <td className="py-2 w-1/2">{item.notes}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </React.Fragment>
                      );
                    })}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls - Only show if filteredWorkOrder exceed pageSize (10) */}
            {wordOrder.length > 12 && (
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs text-slate-700">
                  {t("single_equipment_page_work_order_list_table_pagination_page")} {pageIndex + 1} {t("single_equipment_page_work_order_list_table_pagination_of")} {pageOptions.length}
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
                      {t("single_equipment_page_work_order_list_table_pagination_show")} {size}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 px-12 pb-12'>
            <div className='md:col-span-3 shadow-sm border rounded-lg p-4 '>
              <h4 className="block text-zinc-900 text-sm font-semibold leading-normal">{t("single_equipment_page_contract_warranty_information")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-slate-500 text-xs font-medium">
                <li className='grid grid-cols-3 gap-1'>{t("single_equipment_page_contract_build_date")}
                  <span className='font-semibold'>
                    {installation?.date_built &&
                      new Date(installation?.date_built).getFullYear() !== 1980
                      ? new Date(installation?.date_built).toLocaleString(undefined, {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                      : "N/A"}
                  </span>
                </li>
                <li className='grid grid-cols-3 gap-1'>{t("single_equipment_page_contract_commissioning_date")}
                  <span className='font-semibold'>
                    {installation?.date_start_production &&
                      new Date(installation?.date_start_production).getFullYear() !== 1980
                      ? new Date(installation?.date_start_production).toLocaleString(undefined, {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                      : "N/A"}
                  </span>
                </li>
                <li className='grid grid-cols-3 gap-1'>{t("single_equipment_page_contract_warranty_date")}
                  <span className='font-semibold'>
                    {installation?.warranty_date_until &&
                      new Date(installation?.warranty_date_until).getFullYear() !== 1980
                      ? new Date(installation?.warranty_date_until).toLocaleString(undefined, {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                      : "N/A"}
                  </span>
                </li>
                <li className='grid grid-cols-3 gap-1'>{t("single_equipment_page_contract_parts_warranty_date")}
                  <span className='font-semibold'>
                    {installation?.replacement_date &&
                      new Date(installation?.replacement_date).getFullYear() !== 1980
                      ? new Date(installation?.replacement_date).toLocaleString(undefined, {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                      : "N/A"}
                  </span>
                </li>
              </ul>
            </div>

            {Array.isArray(contractDetails.Corrective) && contractDetails.Corrective.length > 0 && (
              <div className='md:col-span-3 shadow-sm border rounded-lg p-4'>
                <h4 className="block text-zinc-900 text-sm font-semibold leading-normal">
                  {t("single_equipment_page_contract_corrective_contract_info")}
                </h4>
                <hr className='mt-2 mb-4 w-32 border-gray-300' />
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  {(isCorrectiveExpanded
                    ? contractDetails.Corrective
                    : contractDetails.Corrective.slice(0, 2)
                  ).map((contract, index) => (
                    <React.Fragment key={index}>
                      <div className='shadow-sm border rounded-lg p-4'>
                        <h4 className="block text-zinc-900 text-xs font-semibold leading-normal">
                          {contract.contract_name}
                        </h4>
                        <hr className='my-2 w-32 border-gray-300' />
                        <ul className="list-none list-inside text-slate-500 text-xs font-medium">
                          <li className='grid grid-cols-3 gap-1'>
                            {t("single_equipment_page_contract_start_date")}: <span className='font-semibold'>
                              {contract.date_start && new Date(contract.date_start).getFullYear() !== 1980
                                ? new Date(contract.date_start).toLocaleDateString(undefined, {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })
                                : "N/A"}
                            </span>
                          </li>
                          <li className='grid grid-cols-3 gap-1'>
                            {t("single_equipment_page_contract_end_date")}: <span className='font-semibold'>
                              {contract.date_end && new Date(contract.date_end).getFullYear() !== 1980
                                ? new Date(contract.date_end).toLocaleDateString(undefined, {

                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })
                                : "N/A"}
                            </span>
                          </li>
                          <li className='grid grid-cols-3 gap-1'>
                            {t("single_equipment_page_contract_status")}: <span className='font-semibold'>
                              {contract.contract_status_name}
                            </span>
                          </li>
                        </ul>
                      </div>

                      <div className='shadow-sm border rounded-lg p-4'>
                        <h4 className="block text-zinc-900 text-xs font-semibold leading-normal">
                          {t("single_equipment_page_contract_SLA_info")}
                        </h4>
                        <hr className='my-2 w-32 border-gray-300' />
                        <ul className="list-none list-inside text-slate-500 text-xs font-medium">
                          <li>{contract.sla_name}</li>
                          <li>{contract.sla_coverage_type}</li>
                        </ul>
                      </div>

                      <div className='shadow-sm border rounded-lg p-4'>
                        <h4 className="block text-zinc-900 text-xs font-semibold leading-normal">
                          {t("single_equipment_page_contract_SLA_deadlines")}
                        </h4>
                        <hr className='my-2 w-32 border-gray-300' />
                        <ul className="list-none list-inside text-slate-500 text-xs font-medium">
                          <li className='grid grid-cols-2 gap-4'>
                            {t("single_equipment_page_contract_response_time")}: <span className='font-semibold'>{contract.sla_respone_time}</span>
                          </li>
                          <li className='grid grid-cols-2 gap-4'>
                            {t("single_equipment_page_contract_arrival_time")}: <span className='font-semibold'>{contract.sla_arrival_time}</span>
                          </li>
                          <li className='grid grid-cols-2 gap-4'>
                            {t("single_equipment_page_contract_resolution_time")}: <span className='font-semibold'>{contract.sla_resolution_time}</span>
                          </li>
                        </ul>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
                {contractDetails.Corrective.length > 2 && (
                  <div className='flex items-center justify-end mt-4 font-semibold text-gray-800'>
                    <button
                      onClick={toggleCorrectiveExpand}
                      className='flex items-center justify-end underline'
                    >
                      {isCorrectiveExpanded
                        ? t("single_equipment_page_contract_view_less_button")
                        : t("single_equipment_page_contract_view_more_button")}
                      {isCorrectiveExpanded ? (
                        <ArrowDownLeft className="ml-1 w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="ml-1 w-5 h-5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}


            {Array.isArray(contractDetails?.Preventive) && contractDetails.Preventive.length > 0 && (
              <div className='md:col-span-3 shadow-sm border rounded-lg p-4 '>
                <h4 className="block text-zinc-900 text-sm font-semibold leading-normal">{t("single_equipment_page_contract_preventive_contract_info")}</h4>
                <hr className='mt-2 mb-4 w-32 border-gray-300' />

                {contractDetails.Preventive.map((preventive, index) => {
                  const isExpanded = expandedPreventives[index] || false;
                  const serviceModelsToShow = isExpanded
                    ? preventive.service_models
                    : preventive.service_models?.slice(0, 2);

                  return (
                    <div key={index}>
                      {index !== 0 && <hr className='my-8 border-gray-300' />}

                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div className='shadow-sm border rounded-lg p-4 '>
                          <h4 className="block text-zinc-900 text-xs font-semibold leading-normal">{preventive.contract_type_name}</h4>
                          <hr className='my-2 w-32 border-gray-300' />
                          <ul className="list-none list-inside text-slate-500 text-xs font-medium">
                            <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_start_date")} <span className='font-semibold'>
                              {preventive.date_start &&
                                new Date(preventive.date_start).getFullYear() !== 1980
                                ? new Date(preventive.date_start).toLocaleString(undefined, {

                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })
                                : "N/A"}
                            </span></li>
                            <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_end_date")} <span className='font-semibold'>
                              {preventive.date_end &&
                                new Date(preventive.date_end).getFullYear() !== 1980
                                ? new Date(preventive.date_end).toLocaleString(undefined, {

                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })
                                : "N/A"}
                            </span></li>
                            <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_status")} <span className='font-semibold'>{preventive.contract_status_name}</span></li>
                          </ul>
                          <hr className='my-2 border-gray-300' />
                          <ul className="list-none list-inside text-slate-500 text-xs font-medium">
                            <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_contract_ref")} <span className='font-semibold'>{preventive.id2}</span></li>
                            <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_contract_type")} <span className='font-semibold'>{preventive.contract_type_name}</span></li>
                          </ul>
                        </div>

                        {/* Service Models */}
                        {Array.isArray(serviceModelsToShow) &&
                          serviceModelsToShow.map((model, modelIndex) => (
                            <div key={modelIndex} className='shadow-sm border rounded-lg p-4 '>
                              <h4 className="block text-zinc-900 text-xs font-semibold leading-normal">Service Model - {model?.id2}</h4>
                              <hr className='my-2 w-32 border-gray-300' />
                              <ul className="list-none list-inside text-slate-500 text-xs font-medium">
                                <li>{model?.service_model_name}</li>
                                <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_start_date")} <span className='font-semibold'>
                                  {model?.date_start &&
                                    new Date(model?.date_start).getFullYear() !== 1980
                                    ? new Date(model?.date_start).toLocaleString(undefined, {

                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })
                                    : "N/A"}
                                </span></li>
                                <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_end_date")} <span className='font-semibold'>
                                  {model?.date_end &&
                                    new Date(model?.date_end).getFullYear() !== 1980
                                    ? new Date(model?.date_end).toLocaleString(undefined, {

                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })
                                    : "N/A"}
                                </span></li>
                                <li className='grid grid-cols-2 gap-1'>
                                  <span>{t("single_equipment_page_contract_WO_type")}</span>
                                  <span>
                                    {model?.job_type_name && (
                                      <>
                                        <Circle
                                          className={`inline-block w-2 h-2 mr-1 rounded-full border`}
                                          style={
                                            model?.job_type_color
                                              ? {
                                                backgroundColor: `#${model.job_type_color}`,
                                                borderColor: `#${model.job_type_color}`,
                                              }
                                              : {
                                                backgroundColor: `#999999`,
                                                borderColor: `#999999`,
                                              }
                                          }
                                        />
                                        <span className="font-semibold">{model?.job_type_name}</span>
                                      </>
                                    )}
                                  </span>
                                </li>
                                <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_next_expected_intervention")} <span className='font-semibold'>
                                  {model?.next_expected_job_date &&
                                    new Date(model?.next_expected_job_date).getFullYear() !== 1980
                                    ? new Date(model?.next_expected_job_date).toLocaleString(undefined, {

                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })
                                    : "N/A"}
                                </span></li>
                              </ul>
                            </div>
                          ))}
                      </div>

                      {/* View More / View Less Link */}
                      {Array.isArray(preventive.service_models) && preventive.service_models.length > 2 && (
                        <div className='flex items-center justify-end my-4 font-semibold text-gray-800'>
                          {!isExpanded ? (
                            <button
                              onClick={() => toggleExpand(index)}
                              className='flex items-center justify-end underline'
                            >
                              {t("single_equipment_page_contract_view_more_button")}
                              <ArrowUpRight className="ml-1 w-5 h-5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleExpand(index)}
                              className='flex items-center justify-end underline'
                            >
                              {t("single_equipment_page_contract_view_less_button")}
                              <ArrowDownLeft className="ml-1 w-5 h-5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleInstallation;