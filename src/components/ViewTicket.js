import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { fetchData } from '../services/apiService';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { File, Eye, ArrowLeft, Circle, MapPin, Phone, Wrench, User, Calendar, ExternalLink, Image } from "lucide-react";
import { useTranslation } from "react-i18next";

const SingleTicket = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [ticketWorkOrder, setTicketWorkOrder] = useState();
  const [doc, setDoc] = useState([]);
  //const [file, setFile] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // State to manage active tab
  const [fileThumbnails, setFileThumbnails] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [downloadMsg, setDownloadMsg] = useState('');
  const { t } = useTranslation('singleTicket');

  const url = `https://testservicedeskapi.odysseemobile.com/`;

  const statusColors = useMemo(() => ({
    "In progress": "bg-yellow-100 text-yellow-600",
    "Planned": "bg-blue-100 text-blue-600",
    "To be Planned": "bg-purple-100 text-purple-600",
    "Escalated to WO": "bg-orange-100 text-orange-600",
    "Open": "bg-green-100 text-green-600",
    "Ready for Review": "bg-indigo-100 text-indigo-600",
    "Waiting for Parts": "bg-indigo-100 text-indigo-600",
    "Cancelled": "bg-red-100 text-red-600",
    "Completed": "bg-pink-100 text-pink-600",
  }), []);

  const statusDotColors = useMemo(() => ({
    "In progress": "bg-yellow-600 text-yellow-600",
    "Planned": "bg-blue-600 text-blue-600",
    "To be Planned": "bg-purple-600 text-purple-600",
    "Escalated to WO": "bg-orange-600 text-orange-600",
    "Open": "bg-green-600 text-green-600",
    "Ready for Review": "bg-indigo-600 text-indigo-600",
    "Waiting for Parts": "bg-indigo-600 text-indigo-600",
    "Cancelled": "bg-red-600 text-red-600",
    "Completed": "bg-pink-600 text-pink-600",
  }), []);

  const getTimestamp = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}_${hh}${min}`;
  };

  useEffect(() => {
    if (downloadMsg) {
      toast.success("Downloading!");
    }
  }, [downloadMsg]);

  useEffect(() => {
    const getTicketAndWorkOrderDetails = async () => {
      if (!ticketId || !auth?.authKey) {
        setError(t('single_ticket_page_err_no_ticket_id_auth'));
        setLoading(false);
        return;
      }

      try {
        // Fetch Ticket
        const ticketEndpoint = `api/TaskView(${ticketId})`;
        const ticketData = await fetchData(ticketEndpoint, 'GET', auth.authKey);
        setTicket(ticketData);

        // Fetch Work Order if available
        if (ticketData?.to_id_in_table) {
          const workOrderId = ticketData.to_id_in_table;
          const workOrderEndpoint = `api/JobsView(${workOrderId})`;
          const workOrderData = await fetchData(workOrderEndpoint, 'GET', auth.authKey);
          setTicketWorkOrder(workOrderData);
        }

        // Fetch Ticket Documents
        const docEndpoint = `api/DbFileView?$filter=db_table_name+eq+%27task%27+and+id_in_table+eq+${ticketId}`;
        const docData = await fetchData(docEndpoint, 'GET', auth.authKey);
        setDoc(docData.value || []);
      } catch (err) {
        console.error("Error fetching ticket/work order/docs:", err);
        setError(t('single_ticket_page_err_failed_to_fetch_all'));
      } finally {
        setLoading(false);
      }
    };

    getTicketAndWorkOrderDetails();
  }, [auth?.authKey, ticketId, t]);


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
              url: `${url}api/DbFileView/GetFileThumbnail/?id=${item.id}&maxWidth=${item.image_width || '500'}&maxHeight=${item.image_heigth || '500'}`,
              method: "GET",
              headers: {
                Authorization: `Basic ${authKey}`,
                Accept: "image/png",
              },
              responseType: "blob",
            };

            const response = await axios(config);
            //setFile(response);
            updatedThumbnails[item.id] = URL.createObjectURL(response.data); // Store URL in object
          })
        );

        setFileThumbnails(updatedThumbnails); // Update state with all fetched thumbnails
      } catch (err) {
        console.error("Error fetching thumbnails:", err);
        setError(t("single_ticket_page_err_failed_to_fetch_thumbnail"));
      } finally {
        setLoading(false);
      }
    };

    GetFileThumbnails();
  }, [auth, doc, url, t]); // Run when `doc` changes


  const handleDownloadAll = async () => {
    const endpoint = `${url}api/DbFileView/download/?token=${encodeURIComponent(auth.authKey)}`;
    const selectedIds = doc.map(doc => doc.id);

    const formData = new URLSearchParams();
    formData.append('paraString', JSON.stringify(selectedIds));

    try {
      const response = await axios.post(endpoint, formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        responseType: 'blob', // Important for binary file download
      });

      if (response.data.size === 0) {
        console.warn('Empty ZIP received — skipping download.');
        return;
      }

      // Extract filename if available
      const timestamp = getTimestamp();
      let filename;
      if (selectedIds.length === 1) {
        const originalFileName = doc[0]?.name;

        if (originalFileName) {
          const nameParts = originalFileName.split('.');
          const ext = nameParts.length > 1 ? nameParts.pop() : '';
          const baseName = nameParts.join('.') || 'file';

          filename = `${baseName}_${timestamp}${ext ? `.${ext}` : ''}`;
        } else {
          filename = `file_${timestamp}`;
        }

      } else {
        filename = `files_${timestamp}.zip`;
      }

      const blob = new Blob([response.data], { type: 'application/zip' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setDownloadMsg('Downloading...');
    } catch (error) {
      console.error('Download failed:', error);
      // Optional: show toast or fallback UI
    }
  };

  const toggleFileSelection = (file) => {
    setSelectedFiles((prev) =>
      prev.some((f) => f.id === file.id)
        ? prev.filter((f) => f.id !== file.id)
        : [...prev, file]
    );
  };


  const handleDownloadSelected = async () => {
    const endpoint = `${url}api/DbFileView/download/?token=${encodeURIComponent(auth.authKey)}`;
    const selectedIds = selectedFiles.map(file => file.id);

    const formData = new URLSearchParams();
    formData.append('paraString', JSON.stringify(selectedIds));

    try {
      const response = await axios.post(endpoint, formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        responseType: 'blob', // Important for binary file download
      });

      if (response.data.size === 0) {
        console.warn('Empty ZIP received — skipping download.');
        return;
      }


      // Extract filename if available
      const timestamp = getTimestamp();
      let filename;
      if (selectedIds.length === 1) {
        // Use original file name if available
        const originalFile = selectedFiles.find(f => f.id === selectedIds[0]);
        const baseName = originalFile?.name?.split('.').slice(0, -1).join('.') || 'file';
        const ext = originalFile?.name?.split('.').pop() || 'zip';
        filename = `${baseName}_${timestamp}.${ext}`;
      } else {
        filename = `download_${timestamp}.zip`;
      }

      const blob = new Blob([response.data], { type: 'application/zip' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setDownloadMsg('Downloading...');
    } catch (error) {
      console.error('Download failed:', error);
      // Optional: show toast or fallback UI
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

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white">
      <div className='flex'>
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)} // Navigate back one step in history
          className="flex items-center mb-6 font-semibold text-zinc-900 text-base"
        >
          <ArrowLeft className="mr-2 w-5 h-5" /> {t("single_ticket_page_go_back")}
        </button>
      </div>

      <div className='shadow-md rounded-lg p-8'>
        <h2 className="capitalize text-zinc-900 text-2xl font-semibold mb-4">{t("single_ticket_page_reference")}: {ticket?.id2} | {ticket?.subject}</h2>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-4">
          <button
            className={`px-4 py-2 mr-2 text-lg font-medium leading-7 ${activeTab === 'details' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-slate-500'}`}
            onClick={() => setActiveTab('details')}
          >
            {t("single_ticket_page_ticket_details")}
          </button>
          <button
            className={`px-4 py-2 mr-2 text-lg font-medium leading-7 ${activeTab === 'documents' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-slate-500'}`}
            onClick={() => setActiveTab('documents')}
          >
            {t("single_ticket_page_documents")}
          </button>
        </div>

        {activeTab === 'details' ? (
          <div className='grid grid-cols-1 md:grid-rows-3 gap-8'>
            <div className="grid grid-cols-3 gap-8 row-start-1">
              <div className='shadow-sm border rounded-lg p-4 '>
                <h4 className="block text-zinc-900 text-xs font-semibold leading-normal">{t("single_ticket_page_location_equipment")}</h4>
                <hr className='my-2 w-32 border-gray-300' />
                <ul className="list-none list-inside text-slate-500 text-xs font-medium">
                  {ticket?.project_db_address_street ? (<li className='flex items-center'><MapPin className='w-4 h-4 mr-2' />{ticket?.project_db_address_street}</li>) : ''}
                  {ticket?.project_db_address_zip || ticket?.project_db_address_city ? (<li className='ml-6 pb-1'>{ticket?.project_db_address_zip} {ticket?.project_db_address_city}</li>) : ''}
                  {ticket?.project_db_address_phone ? (<li className='flex items-center pb-1'><Phone className='w-4 h-4 mr-2' />{ticket?.project_db_address_phone}</li>) : ''}
                  {ticket?.project_name && (
                    <li
                      className={`flex items-center ${ticketWorkOrder?.project_id !== '00000000-0000-0000-0000-000000000000' ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (ticketWorkOrder?.project_id !== '00000000-0000-0000-0000-000000000000') {
                          navigate(`/enqipment/${ticketWorkOrder?.project_id}`);
                        }
                      }}
                    >
                      <Wrench className='w-4 h-4 mr-2' />
                      {ticket.project_name}
                      {ticketWorkOrder?.project_id !== '00000000-0000-0000-0000-000000000000' && (
                        <ExternalLink className="ml-2 w-5 h-5" />
                      )}
                    </li>
                  )}
                </ul>
              </div>

              <div className='shadow-sm border rounded-lg p-4 '>
                <h4 className="text-zinc-900 text-xs font-semibold leading-normal">{t("single_ticket_page_created_by")}</h4>
                <hr className='my-2 w-32 border-gray-300' />
                <ul className="list-none list-inside text-slate-500 text-xs font-medium">
                  <li className='flex items-center pb-1'><User className='w-4 h-4 mr-2' />{ticket?.contact_fullname}</li>
                  <li className='flex items-center'><Calendar className='w-4 h-4 mr-2' />{(new Date(ticket?.date_create).getFullYear() !== 1980) ? new Date(ticket?.date_create).toLocaleString('nl-BE', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : ''}</li>
                </ul>
              </div>

              <div className='shadow-sm border rounded-lg p-4 '>
                <h4 className="text-zinc-900 text-xs font-semibold leading-normal">{t('single_ticket_page_assigned_to')}</h4>
                <hr className='my-2 w-32 border-gray-300' />
                <ul className="list-none list-inside text-slate-500 text-xs font-medium">
                  <li className='flex items-center pb-1'><User className='w-4 h-4 mr-2' />{ticket?.assigned_to_user_fullname?.trim() ? ticket.assigned_to_user_fullname : 'Not Assigned'}</li>
                  {ticket?.date_assigned && new Date(ticket.date_assigned).getFullYear() !== 1980 && (
                    <li className='flex items-center'>
                      <Calendar className='w-4 h-4 mr-2' />
                      {new Date(ticket.date_assigned).toLocaleString('nl-BE', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className={`grid ${ticketWorkOrder?.name ? 'grid-cols-3' : 'grid-cols-2'} gap-8 row-start-2`}>
              {/* <div className={`grid grid-cols-3 gap-8 row-start-2`}> */}
              <div className='shadow-sm border rounded-lg p-4 '>
                <h4 className="text-zinc-900 text-xs font-semibold leading-normal">{t('single_ticket_page_severity')}</h4>
                <hr className='my-2 w-32 border-gray-300' />
                <span className="text-slate-500 text-xs font-medium">
                  {ticket?.task_priority_name}
                </span>
              </div>

              <div className='shadow-sm border rounded-lg p-4 '>
                <h4 className="text-zinc-900 text-xs font-semibold leading-normal">{t('single_ticket_page_type_status')}</h4>
                <hr className='my-2 w-32 border-gray-300' />
                <ul className="list-none list-inside text-slate-500 text-xs font-medium">
                  <li className='pb-1'>
                    {ticket?.task_type_name}
                  </li>
                  <li className='mt-2.5'><span className={`pe-3 px-2 pb-1 pt-0.5 rounded-full ${statusColors[ticket?.task_status_name] || "bg-gray-200 text-gray-800"}`}>
                    <Circle className={`inline w-2 h-2 mr-1 rounded-full ${statusDotColors[ticket?.task_status_name] || "bg-gray-800 text-gray-800"}`} />
                    {ticket?.task_status_name}
                  </span></li>
                </ul>
              </div>

              {ticketWorkOrder?.name && (
                <div className='shadow-sm border rounded-lg p-4 '>
                  <h4 className="text-zinc-900 text-xs font-semibold leading-normal">{t('single_ticket_page_linked_wo')}</h4>
                  <hr className='my-2 w-32 border-gray-300' />
                  <ul className="list-none list-inside text-slate-500 text-xs font-medium">
                    <li className='flex items-center pb-1 cursor-pointer' onClick={() => navigate(`/workorder/${ticketWorkOrder?.id}`)}>{ticketWorkOrder?.id2} <ExternalLink className="ml-2 w-5 h-5" /></li>
                    <li className='flex items-center pb-1'>{ticketWorkOrder?.job_type_name}</li>
                    <li className='flex items-center pb-1'>{ticketWorkOrder?.name}</li>
                  </ul>
                </div>)}
            </div>

            <div className="row-start-3">
              <div className='shadow-sm border rounded-lg p-4 '>
                <h4 className="block text-zinc-900 text-xs font-semibold leading-normal">{t('single_ticket_page_description')}</h4>
                <hr className='my-2 w-32 border-gray-300' />
                {ticket?.remark ? (
                  <p className="mb-4 text-slate-500 text-xs font-medium">{ticket?.remark}</p>
                ) : (
                  <p className="mb-4 text-slate-500 text-xs font-medium">{t('single_ticket_page_no_description')}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className=''>
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
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
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
                          <Image className="w-40 h-40 text-gray-200 mx-auto" /> // 👈 fallback image icon
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
                          /><span>{t("single_ticket_page_select_to_download")}</span>
                        </label>) : null}

                      {/* Show "View Document" only if it's an image */}

                      <a href={fileThumbnails[item.id] || ""} target="_blank" rel="noopener noreferrer" className="flex items-center mt-2 text-sm hover:underline">
                        <Eye className="w-6 h-6 mr-2 text-gray-600" /> {t("single_ticket_page_view_document")}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (<p className="text-gray-800 p-4 font-semibold">{t("single_ticket_page_no_document")}</p>)
            }
            {!fileThumbnails && (!doc || doc.length === 0) && (
              <p className="text-gray-400 p-4 text-center">{t("single_ticket_page_no_document")}</p>
            )}
            {doc.length > 0 && (
              <div className='flex justify-end mt-4'>
                {selectedFiles.length !== 0 && (
                  <button
                    onClick={handleDownloadSelected}
                    className="w-48 px-5 py-3 bg-zinc-800 rounded-lg flex items-center justify-center text-pink-50 text-base font-medium leading-normal hover:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
                    {t("single_ticket_page_download_button")}
                  </button>)}
                <button
                  onClick={handleDownloadAll}
                  className="w-48 px-5 py-3 ml-2 bg-zinc-800 rounded-lg flex items-center justify-center text-pink-50 text-base font-medium leading-normal hover:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
                  {t("single_ticket_page_download_all_button")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleTicket;