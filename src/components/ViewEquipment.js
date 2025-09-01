import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { fetchData } from '../services/apiService';
import { useTable, useSortBy, usePagination } from 'react-table';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { CalendarClock, File, Eye, ArrowLeft, ArrowUpRight, Circle, MapPin, Phone, Wrench, ArrowDown, ArrowUp, ArrowLeftToLine, ArrowRightToLine, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const SingleInstallation = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { InstallationId } = useParams();
  const [Installation, setInstallation] = useState(null);
  const [doc, setDoc] = useState([]);
  const [wordOrder, setWordOrder] = useState([]);
  const [file, setFile] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // State to manage active tab
  const [fileThumbnails, setFileThumbnails] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [downloadMsg, setDownloadMsg] = useState('');
  const { t } = useTranslation('singleEquipment');

  const url = `https://testservicedeskapi.odysseemobile.com/`;

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
    const getInstallationDetails = async () => {
      try {
        if (!InstallationId) {
          setError('single_equipment_page_err_no_ticket_id');
          setLoading(false);
          return;
        }

        const endpoint = `api/ProjectView(${InstallationId})`;
        const data = await fetchData(endpoint, 'GET', auth.authKey);
        setInstallation(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching Installation details:", err);
        setError('single_equipment_page_err_failed_to_fetch_installation_details');
        setLoading(false);
      }
    };

    const getInstallationDoc = async () => {
      try {
        const endpoint_1 = `api/DbFileView?$filter=db_table_name+eq+%27project%27+and+id_in_table+eq+${InstallationId}`;
        const data_1 = await fetchData(endpoint_1, 'GET', auth.authKey);
        setDoc(data_1.value);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError('single_equipment_page_err_failed_to_fetch_document');
      }
    };

    const getInstallationSub = async () => {
      try {
        const endpoint_2 = `api/JobsView/SearchAllJobsLinkToProject`;
        const payload = { "project_id": `${InstallationId}`, "year": null, "query_object": { "startRow": 0, "endRow": 500, "rowGroupCols": [], "valueCols": [], "pivotCols": [], "pivotMode": false, "groupKeys": [], "filterModel": {}, "sortModel": [] } }
        const data_2 = await fetchData(endpoint_2, 'POST', auth.authKey, payload);
        setWordOrder(data_2);
        //console.log(data_2);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError('single_equipment_page_err_failed_to_fetch_document');
      }
    };

    getInstallationDetails();
    getInstallationDoc();
    getInstallationSub();
  }, [auth, InstallationId]);

  const columns = useMemo(
    () => [
      {
        Header: t('single_equipment_page_work_order_table_planned_date_text'), accessor: 'date_create',
        Cell: ({ row, value }) => (
          <span className="flex justify-between items-center">
            {new Date(value).toLocaleDateString('nl-BE')}
            {row.original.job_planning_count > 1 && (
              <CalendarClock className="w-5 h-5 cursor-pointer" />
            )}
          </span>
        )
      },
      {
        Header: t('single_equipment_page_work_order_table_reference_text'), accessor: 'id2',
        Cell: ({ row }) => (
          <div className="text-center">
            <span className="text-gray-800 font-medium">
              {row.original.id2}
            </span>
          </div>
        ),
      },
      {
        Header: t('single_equipment_page_work_order_table_name_text'), accessor: 'name',
        Cell: ({ value }) => value.length > 40 ? value.slice(0, 40) + '...' : value
      },
      {
        Header: t('single_equipment_page_work_order_table_address_text'), accessor: 'db_address_street',
        Cell: ({ row }) => (
          <span>
            {row.original.db_address_street} {row.original.db_address_city} {row.original.db_address_zip}
          </span>
        ),
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
    [statusColors, statusDotColors, t]
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
      initialState: { pageIndex: 0, pageSize: 10 }, // Set initial page size to 10
    },
    useSortBy,
    usePagination,
  );

  useEffect(() => {
    const GetFileThumbnails = async () => {
      try {
        if (doc.length === 0) return; // Ensure there is data before fetching

        const authKey = auth?.authKey;
        if (!authKey) return;

        // Create a copy of the thumbnails object
        const updatedThumbnails = {};

        // Fetch thumbnails for all documents in the array
        await Promise.all(
          doc.map(async (item) => {
            if (!item.id) return;

            const config = {
              url: `${url}api/DbFileView/GetFileThumbnail/?id=${item.id}&maxWidth=${item.image_width || '256'}&maxHeight=${item.image_height || '256'}`,
              method: "GET",
              headers: {
                Authorization: `Basic ${authKey}`,
                Accept: "image/png",
              },
              responseType: "blob",
            };

            const response = await axios(config);
            setFile(response);
            updatedThumbnails[item.id] = URL.createObjectURL(response.data); // Store URL in object
          })
        );

        setFileThumbnails(updatedThumbnails); // Update state with all fetched thumbnails
      } catch (err) {
        console.error("Error fetching thumbnails:", err);
        setError("Failed to fetch thumbnail");
      } finally {
        setLoading(false);
      }
    };

    GetFileThumbnails();
  }, [auth, doc, url]); // Run when `doc` changes

  const handleDownloadAll = async () => {
    const zip = new JSZip(); // Create a new ZIP instance
    if (doc.length === 0) return; // Ensure there is data before fetching

    const docId = doc[0]?.id; // Use the first document ID (or adjust as needed)
    if (!docId) return;

    const authKey = auth?.authKey;
    if (!authKey) return;

    try {
      const url = {
        url: `api/DbFileView/GetFileThumbnail/?id=${docId}&maxWidth=256&maxHeight=256`,
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authKey}`,
          'Accept': 'image/png',
        },
        responseType: 'blob',
      };

      // Fetch the file content
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${file.file_name}`);
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      // Add the file to the ZIP archive
      zip.file(file.file_name || 'file', arrayBuffer);
    } catch (error) {
      console.error(`Error fetching file ${file.file_name}:`, error.message);
    }

    // Generate the ZIP archive and trigger the download
    zip.generateAsync({ type: 'blob' }).then((content) => {
      const blobUrl = window.URL.createObjectURL(content);

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'files.zip'; // Name of the ZIP file
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke the object URL to free up memory
      window.URL.revokeObjectURL(blobUrl);
    });
  };

  const toggleFileSelection = (file) => {
    setSelectedFiles((prev) =>
      prev.some((f) => f.id === file.id)
        ? prev.filter((f) => f.id !== file.id)
        : [...prev, file]
    );
  };

  const handleDownloadSelected = async () => {
    const zip = new JSZip();
    if (doc.length === 0) return; // Ensure there is data before fetching

    const docId = doc[0]?.id; // Use the first document ID (or adjust as needed)
    if (!docId) return;

    try {
      await Promise.all(
        selectedFiles.map(async (file) => {
          const response = await fetch(
            `api/DbFileView/GetFileThumbnail/?id=${docId}&maxWidth=256&maxHeight=256`
          );

          if (!response.ok) {
            throw new Error(`Failed to download ${file.file_name}`);
          } else {
            setDownloadMsg(t('single_equipment_page_selected_documents'));
          }

          const blob = await response.blob();
          zip.file(file.file_name, blob);
        })
      );

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'SelectedFiles.zip');
    } catch (error) {
      console.error('Error downloading files:', error);
      //alert('Failed to download selected files.');
    }
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
          onClick={() => navigate(-1)} // Navigate back one step in history
          className="flex items-center mb-4 font-semibold text-gray-800"
        >
          <ArrowLeft className="mr-2 w-5 h-5" /> {t("single_equipment_page_go_back")}
        </button>
      </div>

      <div className='shadow-md rounded-lg'>
        <h2 className="capitalize text-xl font-bold mb-4 pt-12 px-12">{t("single_equipment_page_reference")}: {Installation?.id2} | {Installation?.name}</h2>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8 px-12">
          <button
            className={`text-lg py-2 px-4 font-semibold ${activeTab === 'details' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
            onClick={() => setActiveTab('details')}
          >
            {t("single_equipment_page_ticket_details")}
          </button>
          <button
            className={`text-lg py-2 px-4 font-semibold ${activeTab === 'documents' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
            onClick={() => setActiveTab('documents')}
          >
            {t("single_equipment_page_documents")}
          </button>
          <button
            className={`text-lg py-2 px-4 font-semibold ${activeTab === 'wordOrder' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
            onClick={() => setActiveTab('wordOrder')}
          >
            {t("single_equipment_page_work_orders")}
          </button>
          <button
            className={`text-lg py-2 px-4 font-semibold ${activeTab === 'contractEntitlements' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
            onClick={() => setActiveTab('contractEntitlements')}
          >
            {t("single_equipment_page_contract_entitlements")}
          </button>
        </div>

        {activeTab === 'details' ? (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 px-12 pb-12'>
            <div className='shadow-sm border rounded-lg p-4 '>
              <h4 className="text-lg font-semibold">{t("single_equipment_page_equipment")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-400">
                <li className='flex items-center'><Wrench className='w-4 h-4 mr-2' />{Installation?.name}</li>
                <li className='ml-6 pb-1'>{Installation?.equipment_family_name}</li>
                <li className='ml-6 pb-1'>{Installation?.equipment_brand_name}</li>
                <li className='ml-6 pb-1'>{Installation?.equipment_model_name}</li>
              </ul>
            </div>

            <div className='shadow-sm border rounded-lg p-4 '>
              <h4 className="text-lg font-semibold">{t("single_equipment_page_type_status")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-400">
                <li>{Installation?.equipment_family_name}</li>
                <li className='mt-2.5'>
                  <span className={`pe-3 px-2 pb-1 pt-0.5 rounded-full ${statusColors[Installation?.project_status_name] || "bg-gray-200 text-gray-800"}`}>
                    <Circle className={`inline w-2 h-2 mr-1 rounded-full ${statusDotColors[Installation?.project_status_name] || "bg-gray-800 text-gray-800"}`} />
                    {Installation?.project_status_name}
                  </span>
                </li>
              </ul>
            </div>

            <div className='shadow-sm border rounded-lg p-4 '>
              <h4 className="text-lg font-semibold">{t("single_equipment_page_properties")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-400 ">
                <li className='grid grid-cols-2 gap-4'>{t("single_equipment_page_barcode")}: <span className='font-semibold text-gray-700'>{Installation?.barcode}</span></li>
                <li className='grid grid-cols-2 gap-4'>{t("single_equipment_page_serial_number")}: <span className='font-semibold text-gray-700'>{Installation?.serial_number}</span></li>
                <li className='grid grid-cols-2 gap-4'>{t("single_equipment_page_our_ref")}: <span className='font-semibold text-gray-700'>{Installation?.customer_reference}</span></li>
                <li className='grid grid-cols-2 gap-4'>{t("single_equipment_page_supplier_ref")}: <span className='font-semibold text-gray-700'>{Installation?.id2}</span></li>
              </ul>
            </div>

            <div className='md:col-span-3 shadow-sm border rounded-lg p-4 '>
              <h4 className="text-lg font-semibold">{t("single_equipment_page_shutdown_consequence")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-400">
                <li>{Installation?.shutdown_consequence}</li>
              </ul>
            </div>

            <div className='shadow-sm border rounded-lg p-4 '>
              <h4 className="text-lg font-semibold">{t("single_equipment_page_location")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-400">
                <li className='flex items-center'><MapPin className='w-4 h-4 mr-2' />{Installation?.company_name}</li>
                <li className='ml-6 pb-1'>{Installation?.db_address_street}</li>
                <li className='ml-6 pb-1'>{Installation?.db_address_zip} {Installation?.db_address_city}</li>
                {Installation?.contact_mobile &&
                  <li className='flex items-center'><Phone className="w-4 h-4 mr-1" />{Installation?.contact_mobile}</li>}
              </ul>
            </div>

            <div className='shadow-sm border rounded-lg p-4 '>
              <h4 className="text-lg font-semibold">{t("single_equipment_page_extra_location_info")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-400">
                <li>{Installation?.total_time_planned}</li>
              </ul>
            </div>

            <div className='shadow-sm border rounded-lg p-4 '>
              <h4 className="text-lg font-semibold">{t("single_equipment_page_company_address")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-400">
                <li className='flex items-center'><MapPin className='w-4 h-4 mr-2' />{Installation?.db_address_street}</li>
                <li className='ml-6 pb-1'>{Installation?.db_address_zip} {Installation?.db_address_city}</li>
                {Installation?.contact_mobile &&
                  <li className='flex items-center'><Phone className="w-4 h-4 mr-1" />{Installation?.contact_mobile}</li>}
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
                        <img src={fileThumbnails[item.id] || ""} alt={item.name} className="w-48 h-40 object-cover rounded-md mx-auto" />
                      ) : (
                        <File className="w-32 h-32 text-gray-600" />
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
                      {item.mime_type?.startsWith("image/") && (
                        <a href={fileThumbnails[item.id] || ""} target="_blank" rel="noopener noreferrer" className="flex items-center mt-2 text-sm hover:underline">
                          <Eye className="w-6 h-6 mr-2 text-gray-600" /> {t("single_equipment_page_view_document")}
                        </a>
                      )}
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
                    className="bg-gray-900 text-white px-2 py-1 mr-2 rounded-md hover:bg-gray-800">
                    {t("single_equipment_page_download_button")}
                  </button>)}
                <button
                  onClick={handleDownloadAll}
                  className="bg-gray-900 text-white px-2 py-1 rounded-md hover:bg-gray-800">
                  {t("single_equipment_page_download_all_button")}
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'wordOrder' ? (
          <>
            <div className="overflow-x-auto">
              <table {...getTableProps()} className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-gray-100">
                  {headerGroups.map(headerGroup => (
                    <tr {...headerGroup.getHeaderGroupProps()} className="bg-white divide-x divide-gray-300">
                      {headerGroup.headers.map(column => (
                        <th {...column.getHeaderProps(column.getSortByToggleProps())}
                          className="p-2 text-left text-sm font-semibold text-gray-400">
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
                  {!loading && page.map(row => { // Change from rows to page
                    prepareRow(row);
                    return (
                      <tr {...row.getRowProps()} className="hover:bg-gray-200">
                        {row.cells.map((cell, index) => (
                          <td
                            {...cell.getCellProps()}
                            className={`px-2 py-2 text-sm text-gray-800 ${index !== 0 ? 'cursor-pointer' : ''}`}
                            onClick={index !== 0 ? () => navigate(`/workorder/${row.original.id}`) : undefined}
                          >
                            {cell.render('Cell')}
                          </td>
                        ))}

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls - Only show if filteredWorkOrder exceed pageSize (10) */}
            {wordOrder.length > 10 && (
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-gray-700">
                  {t("single_equipment_page_work_order_list_table_pagination_page")} {pageIndex + 1} {t("single_equipment_page_work_order_list_table_pagination_of")} {pageOptions.length}
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
                      {t("single_equipment_page_work_order_list_table_pagination_show")} {size}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )
          : (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 px-12 pb-12'>
              <div className='md:col-span-3 shadow-sm border rounded-lg p-4 '>
                <h4 className="text-lg font-semibold">{t("single_equipment_page_contract_warranty_information")}</h4>
                <hr className='my-2 w-32 border-gray-300' />
                <ul className="list-none list-inside text-gray-400 flex flex-col gap-y-2">
                  <li className='grid grid-cols-3 gap-1'>{t("single_equipment_page_contract_build_date")} <span className='font-semibold'>26/04/2021</span></li>
                  <li className='grid grid-cols-3 gap-1'>{t("single_equipment_page_contract_commissioning_date")} <span className='font-semibold'>26/04/2021</span></li>
                  <li className='grid grid-cols-3 gap-1'>{t("single_equipment_page_contract_warranty_date")} <span className='font-semibold'>26/04/2029</span></li>
                  <li className='grid grid-cols-3 gap-1'>{t("single_equipment_page_contract_parts_warranty_date")} <span className='font-semibold'>26/04/2021</span></li>
                </ul>
              </div>

              <div className='md:col-span-3 shadow-sm border rounded-lg p-4 '>
                <h4 className="text-lg font-semibold">{t("single_equipment_page_contract_corrective_contract_info")}</h4>
                <hr className='mt-2 mb-4 w-32 border-gray-300' />
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='shadow-sm border rounded-lg p-4 '>
                    <h4 className="text-lg font-semibold">25CTROCOR100 - ABC Limited - Corrective+ (May 25- May 26)</h4>
                    <hr className='my-2 w-32 border-gray-300' />
                    <ul className="list-none list-inside text-gray-400 flex flex-col gap-y-2">
                      <li className='grid grid-cols-3 gap-1'>{t("single_equipment_page_contract_start_date")}: <span className='font-semibold'>24/05/2025</span></li>
                      <li className='grid grid-cols-3 gap-1'>{t("single_equipment_page_contract_end_date")}: <span className='font-semibold'>23/05/2026</span></li>
                      <li className='grid grid-cols-3 gap-1'>{t("single_equipment_page_contract_status")}: <span className='font-semibold'>Signed</span></li>
                    </ul>
                  </div>

                  <div className='shadow-sm border rounded-lg p-4 '>
                    <h4 className="text-lg font-semibold">{t("single_equipment_page_contract_SLA_info")}</h4>
                    <hr className='my-2 w-32 border-gray-300' />
                    <ul className="list-none list-inside text-gray-400 flex flex-col gap-y-2">
                      <li>FAST +</li>
                      <li>During 9 to 5 working hours only.</li>
                    </ul>
                  </div>

                  <div className='shadow-sm border rounded-lg p-4 '>
                    <h4 className="text-lg font-semibold">{t("single_equipment_page_contract_SLA_deadlines")}</h4>
                    <hr className='my-2 w-32 border-gray-300' />
                    <ul className="list-none list-inside text-gray-400 flex flex-col gap-y-2">
                      <li className='grid grid-cols-2 gap-4'>{t("single_equipment_page_contract_response_time")}: <span className='font-semibold'>within 20 minutes</span></li>
                      <li className='grid grid-cols-2 gap-4'>{t("single_equipment_page_contract_arrival_time")}: <span className='font-semibold'>within 12 hours</span></li>
                      <li className='grid grid-cols-2 gap-4'>{t("single_equipment_page_contract_resolution_time")}: <span className='font-semibold'>{("/")}</span></li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className='md:col-span-3 shadow-sm border rounded-lg p-4 '>
                <h4 className="text-lg font-semibold">{t("single_equipment_page_contract_preventive_contract_info")}</h4>
                <hr className='mt-2 mb-4 w-32 border-gray-300' />
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='shadow-sm border rounded-lg p-4 '>
                    <h4 className="text-lg font-semibold">28CTRPREV100 - ABC Limited - CTR11 (May 25- May 26)</h4>
                    <hr className='my-2 w-32 border-gray-300' />
                    <ul className="list-none list-inside text-gray-400 flex flex-col gap-y-2">
                      <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_start_date")} <span className='font-semibold'>24/05/2025</span></li>
                      <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_end_date")} <span className='font-semibold'>23/05/2026</span></li>
                      <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_status")} <span className='font-semibold'>Signed</span></li>
                    </ul>
                    <hr className='my-2 border-gray-300' />
                    <ul className="list-none list-inside text-gray-400 flex flex-col gap-y-2">
                      <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_contract_ref")} <span className='font-semibold'>46</span></li>
                      <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_contract_type")} <span className='font-semibold'>Maintenance</span></li>
                    </ul>
                  </div>

                  <div className='shadow-sm border rounded-lg p-4 '>
                    <h4 className="text-lg font-semibold">{t("Service Model - 176")}</h4>
                    <hr className='my-2 w-32 border-gray-300' />
                    <ul className="list-none list-inside text-gray-400 flex flex-col gap-y-2">
                      <li>{t("Monthly Inspection")}</li>
                      <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_start_date")} <span className='font-semibold'>24/05/2025</span></li>
                      <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_end_date")} <span className='font-semibold'>23/05/2026</span></li>
                      <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_WO_type")} <span className='font-semibold'>Preventive inspection</span></li>
                      <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_next_expected_intervention")} <span className='font-semibold'>24/02/2026</span></li>
                    </ul>
                  </div>

                  <div className='shadow-sm border rounded-lg p-4 '>
                    <h4 className="text-lg font-semibold">{("Service Model - 166")}</h4>
                    <hr className='my-2 w-32 border-gray-300' />
                    <ul className="list-none list-inside text-gray-400 flex flex-col gap-y-2">
                      <li>{t("Monthly Inspection")}</li>
                      <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_start_date")} <span className='font-semibold'>24/05/2025</span></li>
                      <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_end_date")} <span className='font-semibold'>23/05/2026</span></li>
                      <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_WO_type")} <span className='font-semibold'>Maintenance</span></li>
                      <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_next_expected_intervention")} <span className='font-semibold'>24/02/2026</span></li>
                    </ul>
                  </div>
                </div>

                <div className='my-4 font-semibold text-gray-800 '>
                  <span className='flex items-center justify-end underline'>{t("single_equipment_page_contract_view_more_button")}<ArrowUpRight className="ml-1 w-5 h-5" /></span>
                </div>

                <hr className='my-8 border-gray-300' />
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='shadow-sm border rounded-lg p-4 '>
                    <h4 className="text-lg font-semibold">28CTRPREV100 - ABC Limited - CTR11 (May 25- May 26)</h4>
                    <hr className='my-2 w-32 border-gray-300' />
                    <ul className="list-none list-inside text-gray-400 flex flex-col gap-y-2">
                      <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_start_date")} <span className='font-semibold'>24/05/2025</span></li>
                      <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_end_date")} <span className='font-semibold'>23/05/2026</span></li>
                      <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_status")} <span className='font-semibold'>Signed</span></li>
                    </ul>
                    <hr className='my-2 border-gray-300' />
                    <ul className="list-none list-inside text-gray-400 flex flex-col gap-y-2">
                      <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_contract_ref")} <span className='font-semibold'>46</span></li>
                      <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_contract_type")} <span className='font-semibold'>Maintenance</span></li>
                    </ul>
                  </div>

                  <div className='shadow-sm border rounded-lg p-4 '>
                    <h4 className="text-lg font-semibold">Service Model - 176</h4>
                    <hr className='my-2 w-32 border-gray-300' />
                    <ul className="list-none list-inside text-gray-400 flex flex-col gap-y-2">
                      <li>{t("Monthly Inspection")}</li>
                      <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_start_date")} <span className='font-semibold'>24/05/2025</span></li>
                      <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_end_date")} <span className='font-semibold'>23/05/2026</span></li>
                      <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_WO_type")} <span className='font-semibold'>Preventive inspection</span></li>
                      <li className='grid grid-cols-2 gap-1'>{t("single_equipment_page_contract_next_expected_intervention")} <span className='font-semibold'>24/02/2026</span></li>
                    </ul>
                  </div>

                </div>
              </div>

            </div>
          )}
      </div>
    </div>
  );
};

export default SingleInstallation;