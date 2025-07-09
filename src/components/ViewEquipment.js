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
  const { t } = useTranslation('workOrderList');

  const statusColors = useMemo(() => ({
    "In Progress": "bg-yellow-200 text-yellow-800",
    "Planned": "bg-blue-200 text-blue-800",
    "To be Planned": "bg-purple-200 text-purple-800",
    "Out of production": "bg-orange-200 text-orange-800",
    "Active": "bg-green-200 text-green-800",
    "Ready for Review": "bg-indigo-200 text-indigo-800",
    "Proactive": "bg-red-200 text-red-800",
    "Completed": "bg-pink-200 text-pink-800",
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
          setError('Work Order ID is not provided.');
          setLoading(false);
          return;
        }

        const endpoint = `https://v1servicedeskapi.wello.solutions/api/ProjectView(${InstallationId})`;
        const data = await fetchData(endpoint, 'GET', auth.authKey);
        setInstallation(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching Installation details:", err);
        setError('Failed to fetch Installation details.');
        setLoading(false);
      }
    };

    const getInstallationDoc = async () => {
      try {
        const endpoint_1 = `https://v1servicedeskapi.wello.solutions/api/DbFileView?$filter=db_table_name+eq+%27project%27+and+id_in_table+eq+${InstallationId}`;
        const data_1 = await fetchData(endpoint_1, 'GET', auth.authKey);
        setDoc(data_1.value);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError('Failed to fetch documents.');
      }
    };

    const getInstallationSub = async () => {
      try {
        const endpoint_2 = `https://v1servicedeskapi.wello.solutions/api/JobsView/SearchAllJobsLinkToProject`;
        const payload = { "project_id": `${InstallationId}`, "year": null, "query_object": { "startRow": 0, "endRow": 500, "rowGroupCols": [], "valueCols": [], "pivotCols": [], "pivotMode": false, "groupKeys": [], "filterModel": {}, "sortModel": [] } }
        const data_2 = await fetchData(endpoint_2, 'POST', auth.authKey, payload);
        setWordOrder(data_2);
        //console.log(data_2);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError('Failed to fetch documents.');
      }
    };

    getInstallationDetails();
    getInstallationDoc();
    getInstallationSub();
  }, [auth, InstallationId]);

  const columns = useMemo(
    () => [
      {
        Header: t('work_order_list_table_heading_planned_date_text'), accessor: 'date_create',
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
        Header: t('work_order_list_table_heading_reference_text'), accessor: 'id2',
        Cell: ({ row }) => (
          <div className="text-center">
            <span className="text-gray-800 font-medium">
              {row.original.id2}
            </span>
          </div>
        ),
      },
      {
        Header: t('work_order_list_table_heading_name_text'), accessor: 'name',
        Cell: ({ value }) => value.length > 40 ? value.slice(0, 40) + '...' : value
      },
      {
        Header: t('work_order_list_table_heading_address_text'), accessor: 'db_address_street',
        Cell: ({ row }) => (
          <span>
            {row.original.db_address_street} {row.original.db_address_city} {row.original.db_address_zip}
          </span>
        ),
      },
      {
        Header: t('work_order_list_table_heading_type_text'), accessor: 'job_type_name',
        Cell: ({ row }) => (
          <span className={`text-xs font-medium`}>
            {row.original.job_type_name}
          </span>
        ),
      },
      {
        Header: t('work_order_list_table_heading_status_text'), accessor: 'job_status_name',
        Cell: ({ row }) => (
          <span className={`text-xs font-medium pe-2 px-1 pb-0.5 rounded-full ${statusColors[row.original.job_status_name] || "bg-gray-200 text-gray-800"}`}>
            <Circle className='inline w-2 h-2 mr-1 rounded-full' />
            {row.original.job_status_name}
          </span>
        ),
      },
    ],
    [statusColors, t]
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
              url: `https://V1servicedeskapi.wello.solutions/api/DbFileView/GetFileThumbnail/?id=${item.id}&maxWidth=500&maxHeight=500`,
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
        setError("Failed to fetch thumbnails.");
      } finally {
        setLoading(false);
      }
    };

    GetFileThumbnails();
  }, [auth, doc]); // Run when `doc` changes

  const handleDownloadAll = async () => {
    const zip = new JSZip(); // Create a new ZIP instance
    if (doc.length === 0) return; // Ensure there is data before fetching

    const docId = doc[0]?.id; // Use the first document ID (or adjust as needed)
    if (!docId) return;

    const authKey = auth?.authKey;
    if (!authKey) return;

    try {
      const url = {
        url: `https://V1servicedeskapi.wello.solutions/api/DbFileView/GetFileThumbnail/?id=${docId}&maxWidth=256&maxHeight=256`,
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
            `https://V1servicedeskapi.wello.solutions/api/DbFileView/GetFileThumbnail/?id=${docId}&maxWidth=256&maxHeight=256`
          );

          if (!response.ok) {
            throw new Error(`Failed to download ${file.file_name}`);
          } else {
            setDownloadMsg('Selected Documents');
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
    return <div className="flex w-full items-center justify-center h-screen bg-gray-100">
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
          <ArrowLeft className="mr-2 w-5 h-5" /> {t("Go Back")}
        </button>
      </div>

      <div className='shadow-md rounded-lg p-12'>
        <h2 className="capitalize text-xl font-bold mb-4">{t("Reference")}: {Installation?.id2} | {Installation?.name}</h2>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8">
          <button
            className={`text-lg py-2 px-4 font-semibold ${activeTab === 'details' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('details')}
          >
            {t("Overview")}
          </button>
          <button
            className={`text-lg py-2 px-4 font-semibold ${activeTab === 'documents' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('documents')}
          >
            {t("Documents")}
          </button>
          <button
            className={`text-lg py-2 px-4 font-semibold ${activeTab === 'wordOrder' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('wordOrder')}
          >
            {("Work Orders")}
          </button>
          <button
            className={`text-lg py-2 px-4 font-semibold ${activeTab === 'contractEntitlements' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('contractEntitlements')}
          >
            {("Contract Entitlements")}
          </button>
        </div>

        {activeTab === 'details' ? (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='shadow-md rounded-lg p-4 '>
              <h4 className="text-lg font-semibold">{t("Equipment")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-700">
                <li className='flex items-center'><Wrench className='w-4 h-4 mr-2' />{Installation?.name}</li>
                <li className='ml-6 pb-1'>{Installation?.equipment_family_name}</li>
                <li className='ml-6 pb-1'>{Installation?.equipment_brand_name}</li>
                <li className='ml-6 pb-1'>{Installation?.equipment_model_name}</li>
              </ul>
            </div>

            <div className='shadow-md rounded-lg p-4 '>
              <h4 className="text-lg font-semibold">{t("Type and Status")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-700">
                <li>{Installation?.equipment_family_name}</li>
                <li>
                  <span className={`text-xs font-medium pe-2 px-1 pb-0.5 rounded-full ${statusColors[Installation?.project_status_name] || "bg-gray-200 text-gray-800"}`}>
                    <Circle className='inline w-2 h-2 mr-1 rounded-full' />
                    {Installation?.project_status_name}
                  </span>
                </li>
              </ul>
            </div>

            <div className='shadow-md rounded-lg p-4 '>
              <h4 className="text-lg font-semibold">{("Properties")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-700 ">
                <li className='grid grid-cols-2 gap-4'>{t("Barcode")}: <span className='font-semibold'>{Installation?.barcode}</span></li>
                <li className='grid grid-cols-2 gap-4'>{t("Serial Number")}: <span className='font-semibold'>{Installation?.serial_number}</span></li>
                <li className='grid grid-cols-2 gap-4'>{t("Our Ref")}: <span className='font-semibold'>{Installation?.customer_reference}</span></li>
                <li className='grid grid-cols-2 gap-4'>{t("Supplier Ref")}: <span className='font-semibold'>{Installation?.id2}</span></li>
              </ul>
            </div>

            <div className='md:col-span-3 shadow-md rounded-lg p-4 '>
              <h4 className="text-lg font-semibold">{t("Shutdown consequence")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-700">
                <li>{Installation?.shutdown_consequence}</li>
              </ul>
            </div>

            <div className='shadow-md rounded-lg p-4 '>
              <h4 className="text-lg font-semibold">{t("Location")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-700">
                <li className='flex items-center'><MapPin className='w-4 h-4 mr-2' />{Installation?.company_name}</li>
                <li className='ml-6 pb-1'>{Installation?.db_address_street}</li>
                <li className='ml-6 pb-1'>{Installation?.db_address_zip} {Installation?.db_address_city}</li>
                {Installation?.contact_mobile &&
                  <li className='flex items-center'><Phone className="w-4 h-4 mr-1" />{Installation?.contact_mobile}</li>}
              </ul>
            </div>

            <div className='shadow-md rounded-lg p-4 '>
              <h4 className="text-lg font-semibold">{t("Extra location info")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-700">
                <li>{Installation?.total_time_planned}</li>
              </ul>
            </div>

            <div className='shadow-md rounded-lg p-4 '>
              <h4 className="text-lg font-semibold">{t("Company address")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-700">
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
              <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
                <div className="border border-gray-300 rounded-md bg-gray-50">
                  {doc.map(item => (
                    <div key={item.id} className="p-4 border rounded-lg shadow-md">
                      <div className='flex flex-col items-center'>
                        {/* Show image thumbnail if it's an image, otherwise show file icon */}
                        {item.mime_type?.startsWith("image/") ? (
                          <img src={fileThumbnails[item.id] || ""} alt={item.name} className="w-32 h-32 object-cover rounded-md" />
                        ) : (
                          <File className="w-32 h-32 text-gray-600" />
                        )}
                      </div>
                      <div className='flex flex-col'>
                        <h3 className="mt-2 font-bold">{item.name}</h3>

                        <p className="text-sm mt-2 text-gray-500">{new Date(item.date_add).toLocaleString()}</p>

                        {item.file_name ? (
                          <label className="mt-2 font-semibold items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              onChange={() => toggleFileSelection(item)}
                              checked={selectedFiles.some((file) => file.id === item.id)}
                            /><span>{t("Select to Download the Document.")}</span>
                          </label>) : null}

                        {/* Show "View Document" only if it's an image */}
                        {item.mime_type?.startsWith("image/") && (
                          <a href={fileThumbnails[item.id] || ""} target="_blank" rel="noopener noreferrer" className="flex items-center mt-2 text-blue-600 hover:underline">
                            <Eye className="w-6 h-6 mr-2 text-gray-600" /> {t("View Document")}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (<p className="text-gray-800 p-4 font-semibold">{t("No document available.")}</p>)
            }
            {!fileThumbnails && (!doc || doc.length === 0) && (
              <p className="text-gray-600 p-4 text-center">No document available.</p>
            )}
            {doc.length > 0 && (
              <div className='flex justify-end mt-4'>
                {selectedFiles.length !== 0 && (
                  <button
                    onClick={handleDownloadSelected}
                    className="bg-gray-900 text-white px-2 py-1 mr-2 rounded-md hover:bg-gray-800">
                    {t("Download")}
                  </button>)}
                <button
                  onClick={handleDownloadAll}
                  className="bg-gray-900 text-white px-2 py-1 rounded-md hover:bg-gray-800">
                  {t("Download All")}
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
          </>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='md:col-span-3 shadow-md rounded-lg p-4 '>
              <h4 className="text-lg font-semibold">{t("Warranty Information")}</h4>
              <hr className='my-2 w-32 border-gray-300' />
              <ul className="list-none list-inside text-gray-700 flex flex-col gap-y-2">
                <li className='grid grid-cols-3 gap-1'>{t("Build date")} <span className='font-semibold'>{("26/04/2021")}</span></li>
                <li className='grid grid-cols-3 gap-1'>{t("Commissioning date")} <span className='font-semibold'>{("26/04/2021")}</span></li>
                <li className='grid grid-cols-3 gap-1'>{t("End of warranty date")} <span className='font-semibold'>{("26/04/2029")}</span></li>
                <li className='grid grid-cols-3 gap-1'>{t("End of parts warranty date")} <span className='font-semibold'>{("26/04/2021")}</span></li>
              </ul>
            </div>

            <div className='md:col-span-3 shadow-md rounded-lg p-4 '>
              <h4 className="text-lg font-semibold">{t("Corrective Contract Info")}</h4>
              <hr className='mt-2 mb-4 w-32 border-gray-300' />
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='shadow-md rounded-lg p-4 '>
                  <h4 className="text-lg font-semibold">{t("25CTROCOR100 - ABC Limited - Corrective+ (May 25- May 26)")}</h4>
                  <hr className='my-2 w-32 border-gray-300' />
                  <ul className="list-none list-inside text-gray-700 flex flex-col gap-y-2">
                    <li className='grid grid-cols-3 gap-1'>{t("Start date")}: <span className='font-semibold'>{("24/05/2025")}</span></li>
                    <li className='grid grid-cols-3 gap-1'>{t("End date")}: <span className='font-semibold'>{("23/05/2026")}</span></li>
                    <li className='grid grid-cols-3 gap-1'>{t("Status")}: <span className='font-semibold'>{("Signed")}</span></li>
                  </ul>
                </div>

                <div className='shadow-md rounded-lg p-4 '>
                  <h4 className="text-lg font-semibold">{t("SLA Information")}</h4>
                  <hr className='my-2 w-32 border-gray-300' />
                  <ul className="list-none list-inside text-gray-700 flex flex-col gap-y-2">
                    <li>{("FAST +")}</li>
                    <li>{("During 9 to 5 working hours only.")}</li>
                  </ul>
                </div>

                <div className='shadow-md rounded-lg p-4 '>
                  <h4 className="text-lg font-semibold">{("SLA Deadlines")}</h4>
                  <hr className='my-2 w-32 border-gray-300' />
                  <ul className="list-none list-inside text-gray-700 flex flex-col gap-y-2">
                    <li className='grid grid-cols-2 gap-4'>{t("Response Time")}: <span className='font-semibold'>{("within 20 minutes")}</span></li>
                    <li className='grid grid-cols-2 gap-4'>{t("Arrival Time")}: <span className='font-semibold'>{("within 12 hours")}</span></li>
                    <li className='grid grid-cols-2 gap-4'>{t("Resolution Time")}: <span className='font-semibold'>{("/")}</span></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className='md:col-span-3 shadow-md rounded-lg p-4 '>
              <h4 className="text-lg font-semibold">{t("Preventive Contract Info")}</h4>
              <hr className='mt-2 mb-4 w-32 border-gray-300' />
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='shadow-md rounded-lg p-4 '>
                  <h4 className="text-lg font-semibold">{t("28CTRPREV100 - ABC Limited - CTR11 (May 25- May 26)")}</h4>
                  <hr className='my-2 w-32 border-gray-300' />
                  <ul className="list-none list-inside text-gray-700 flex flex-col gap-y-2">
                    <li className='grid grid-cols-2 gap-1'>{t("Start date")} <span className='font-semibold'>{("24/05/2025")}</span></li>
                    <li className='grid grid-cols-2 gap-1'>{t("End date")} <span className='font-semibold'>{("23/05/2026")}</span></li>
                    <li className='grid grid-cols-2 gap-1'>{t("Status")} <span className='font-semibold'>{("Signed")}</span></li>
                  </ul>
                  <hr className='my-2 border-gray-300' />
                  <ul className="list-none list-inside text-gray-700 flex flex-col gap-y-2">
                    <li className='grid grid-cols-2 gap-1'>{t("Contract Ref")} <span className='font-semibold'>{("46")}</span></li>
                    <li className='grid grid-cols-2 gap-1'>{t("Contract type")} <span className='font-semibold'>{("Maintenance")}</span></li>
                  </ul>
                </div>

                <div className='shadow-md rounded-lg p-4 '>
                  <h4 className="text-lg font-semibold">{t("Service Model - 176")}</h4>
                  <hr className='my-2 w-32 border-gray-300' />
                  <ul className="list-none list-inside text-gray-700 flex flex-col gap-y-2">
                    <li>{t("Monthly Inspection")}</li>
                    <li className='grid grid-cols-2 gap-1'>{t("Start date")} <span className='font-semibold'>{("24/05/2025")}</span></li>
                    <li className='grid grid-cols-2 gap-1'>{t("End date")} <span className='font-semibold'>{("23/05/2026")}</span></li>
                    <li className='grid grid-cols-2 gap-1'>{t("WO Type")} <span className='font-semibold'>{("Preventive inspection")}</span></li>
                    <li className='grid grid-cols-2 gap-1'>{t("Next Expected Intervention")} <span className='font-semibold'>{("24/02/2026")}</span></li>
                  </ul>
                </div>

                <div className='shadow-md rounded-lg p-4 '>
                  <h4 className="text-lg font-semibold">{("Service Model - 166")}</h4>
                  <hr className='my-2 w-32 border-gray-300' />
                  <ul className="list-none list-inside text-gray-700 flex flex-col gap-y-2">
                    <li>{t("Monthly Inspection")}</li>
                    <li className='grid grid-cols-2 gap-1'>{t("Start date")} <span className='font-semibold'>{("24/05/2025")}</span></li>
                    <li className='grid grid-cols-2 gap-1'>{t("End date")} <span className='font-semibold'>{("23/05/2026")}</span></li>
                    <li className='grid grid-cols-2 gap-1'>{t("WO Type")} <span className='font-semibold'>{("Maintenance")}</span></li>
                    <li className='grid grid-cols-2 gap-1'>{t("Next Expected Intervention")} <span className='font-semibold'>{("24/02/2026")}</span></li>
                  </ul>
                </div>
              </div>

              <div className='my-4 font-semibold text-gray-800 '>
                <span className='flex items-center justify-end underline'>{("View More")}<ArrowUpRight  className="ml-1 w-5 h-5" /></span>
              </div>

              <hr className='my-8 border-gray-300' />
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='shadow-md rounded-lg p-4 '>
                  <h4 className="text-lg font-semibold">{t("28CTRPREV100 - ABC Limited - CTR11 (May 25- May 26)")}</h4>
                  <hr className='my-2 w-32 border-gray-300' />
                  <ul className="list-none list-inside text-gray-700 flex flex-col gap-y-2">
                    <li className='grid grid-cols-2 gap-1'>{t("Start date")} <span className='font-semibold'>{("24/05/2025")}</span></li>
                    <li className='grid grid-cols-2 gap-1'>{t("End date")} <span className='font-semibold'>{("23/05/2026")}</span></li>
                    <li className='grid grid-cols-2 gap-1'>{t("Status")} <span className='font-semibold'>{("Signed")}</span></li>
                  </ul>
                  <hr className='my-2 border-gray-300' />
                  <ul className="list-none list-inside text-gray-700 flex flex-col gap-y-2">
                    <li className='grid grid-cols-2 gap-1'>{t("Contract Ref")} <span className='font-semibold'>{("46")}</span></li>
                    <li className='grid grid-cols-2 gap-1'>{t("Contract type")} <span className='font-semibold'>{("Maintenance")}</span></li>
                  </ul>
                </div>

                <div className='shadow-md rounded-lg p-4 '>
                  <h4 className="text-lg font-semibold">{t("Service Model - 176")}</h4>
                  <hr className='my-2 w-32 border-gray-300' />
                  <ul className="list-none list-inside text-gray-700 flex flex-col gap-y-2">
                    <li>{t("Monthly Inspection")}</li>
                    <li className='grid grid-cols-2 gap-1'>{t("Start date")} <span className='font-semibold'>{("24/05/2025")}</span></li>
                    <li className='grid grid-cols-2 gap-1'>{t("End date")} <span className='font-semibold'>{("23/05/2026")}</span></li>
                    <li className='grid grid-cols-2 gap-1'>{t("WO Type")} <span className='font-semibold'>{("Preventive inspection")}</span></li>
                    <li className='grid grid-cols-2 gap-1'>{t("Next Expected Intervention")} <span className='font-semibold'>{("24/02/2026")}</span></li>
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