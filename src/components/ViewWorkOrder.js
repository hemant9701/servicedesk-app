import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { fetchData } from '../services/apiService';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { File, Eye, Phone, ArrowLeft, Circle, Wrench, User, MapPin } from "lucide-react";
import { useAuth } from '../AuthContext';
import { useTranslation } from "react-i18next";

const SingleWordOrder = () => {
  const navigate = useNavigate();
  const { workOrderId } = useParams();
  const [workOrder, setWorkOrder] = useState(null);
  const [doc, setDoc] = useState([]);
  const [sub, setSub] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // State to manage active tab
  const [fileThumbnails, setFileThumbnails] = useState({});
  const { auth } = useAuth();
  const { t } = useTranslation('ticketList');

  const statusColors = useMemo(() => ({
    "In Progress": "bg-yellow-200 text-yellow-800",
    "Planned": "bg-blue-200 text-blue-800",
    "To be Planned": "bg-purple-200 text-purple-800",
    "In progress (W)": "bg-orange-200 text-orange-800",
    "Open": "bg-green-200 text-green-800",
    "Ready for Review": "bg-indigo-200 text-indigo-800",
    "Cancelled": "bg-red-200 text-red-800",
    "Completed": "bg-pink-200 text-pink-800",
  }), []);

  useEffect(() => {
    const getworkOrderDetails = async () => {
      try {
        if (!workOrderId) {
          setError('Work Order ID is not provided.');
          setLoading(false);
          return;
        }

        const endpoint = `https://v1servicedeskapi.wello.solutions/api/JobsView(${workOrderId})`;
        const data = await fetchData(endpoint, 'GET', auth.authKey);
        setWorkOrder(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching workOrder details:", err);
        setError('Failed to fetch workOrder details.');
        setLoading(false);
      }
    };

    const getworkOrderDoc = async () => {
      try {
        const endpoint_1 = `https://v1servicedeskapi.wello.solutions/api/DbFileView?$filter=db_table_name+eq+%27jobs%27+and+id_in_table+eq+${workOrderId}`;
        const data_1 = await fetchData(endpoint_1, 'GET', auth.authKey);
        setDoc(data_1.value);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError('Failed to fetch documents.');
      }
    };

    const getworkOrderSub = async () => {
      try {
        const endpoint_2 = `https://v1servicedeskapi.wello.solutions/api/JobsView?$filter=root_parent_id+eq+${workOrderId}+and+has_child+eq+false&$orderby=id2%20desc`;
        const data_2 = await fetchData(endpoint_2, 'GET', auth.authKey);
        setSub(data_2.value);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError('Failed to fetch documents.');
      }
    };

    getworkOrderDetails();
    getworkOrderDoc();
    getworkOrderSub();
  }, [workOrderId, auth]);

  useEffect(() => {
    const GetFileThumbnails = async () => {
      try {
        if (doc.length === 0) return; // Ensure there is data before fetching

        const authKey = auth.authKey;
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
  }, [doc, auth]); // Run when `doc` changes

  // useEffect(() => {
  //   const GetFileThumbnail = async () => {
  //     try {
  //       if (doc.length === 0) return; // Ensure there is data before fetching

  //       const docId = doc[0]?.id; // Use the first document ID (or adjust as needed)
  //       if (!docId) return;

  //       const auth = JSON.parse(sessionStorage.getItem('auth'));

  //       const authKey = auth.authKey;

  //       const config = {
  //         url: `https://V1servicedeskapi.wello.solutions/api/DbFileView/GetFileThumbnail/?id=${docId}&maxWidth=256&maxHeight=256`,
  //         method: 'GET',
  //         headers: {
  //           'Authorization': `Basic ${authKey}`,
  //           'Accept': 'image/png',
  //         },
  //         responseType: 'blob',
  //       };

  //       const response = await axios(config);
  //       //const imageObjectURL = URL.createObjectURL(response.data);
  //       setFile(response.data);
  //     } catch (err) {
  //       console.error("Error fetching thumbnail:", err);
  //       setError('Failed to fetch thumbnail.');
  //     } finally {
  //       setLoading(false); // Set loading to false once done
  //     }
  //   };

  //   GetFileThumbnail();
  // }, [doc]); // Run when `doc` changes

  if (loading) {
    return <div className="flex w-full items-center justify-center h-screen bg-gray-100">
      <div className="relative">
        <div className="w-20 h-20 border-purple-200 border-2 rounded-full"></div>
        <div className="w-20 h-20 border-purple-700 border-t-2 animate-spin rounded-full absolute left-0 top-0"></div>
      </div>
    </div>;
  }
  if (error) return <div className="text-center text-red-600">{error}</div>;

  return (
    <div className="mx-auto w-full p-6 mt-8 bg-white">
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
        <h2 className="capitalize text-xl font-bold mb-4">{t("Reference")}: {workOrder?.id2} | {workOrder?.name}</h2>
        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-4">
          <button
            className={`py-2 px-4 font-semibold ${activeTab === 'details' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600 hover:text-blue-500'}`}
            onClick={() => setActiveTab('details')}
          >
            {t("Work Order Details")}
          </button>

          <button
            className={`py-2 px-4 font-semibold ${activeTab === 'documents' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600 hover:text-blue-500'}`}
            onClick={() => setActiveTab('documents')}
          >
            {t("Documents")}
          </button>
        </div>

        {activeTab === 'details' ? (
          <>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='shadow-md rounded-lg p-4 '>
                <h4 className="text-lg font-semibold pb-2">{t("Equipment")}</h4>
                <ul className="list-none list-inside text-gray-700">
                  <li className='flex items-center'><MapPin className='w-4 h-4 mr-2' />{workOrder?.db_address_street}</li>
                  <li className='ml-6 pb-1'>{workOrder?.db_address_zip} {workOrder?.db_address_city}</li>
                  {workOrder?.contact_mobile && (
                    <li className='flex items-center'>
                      <Phone className="w-4 h-4 mr-1" /> <a href={`tel:${workOrder.contact_mobile}`}>{workOrder.contact_mobile}</a>
                    </li>
                  )}
                  {workOrder?.name && (
                    <li className='flex items-center' >
                      <Wrench className='w-4 h-4 mr-2' />
                      {workOrder?.name}
                    </li>
                  )}
                </ul>
              </div>

              <div className='shadow-md rounded-lg p-4 '>
                <h4 className="text-lg font-semibold pb-2">{t("Point of Contact")}</h4>
                <ul className="list-none list-inside text-gray-700">
                  {workOrder?.contact_fullname && (
                    <li className='flex items-center'><User className='w-4 h-4 mr-2' />{workOrder?.contact_fullname}</li>
                  )}
                  {workOrder?.contact_phone && (
                    <li className='flex items-center'>
                      <Phone className="w-4 h-4 mr-1" /> <a href={`tel:${workOrder.contact_phone}`}>{workOrder.contact_phone}</a>
                    </li>
                  )}
                </ul>
              </div>

              <div className='shadow-md rounded-lg p-4 '>
                <h4 className="text-lg font-semibold pb-2">{t("SLA Information")}</h4>
                <ul className="list-none list-inside text-gray-700">
                  <li className='grid grid-cols-2 gap-4'>{t("Response Time")} {new Date(workOrder?.dateutc_max_sla_resolution).getFullYear() !== 1980 ?? new Date(workOrder?.dateutc_max_sla_resolution).toLocaleString()}</li>
                  <li className='grid grid-cols-2 gap-4'>{t("Resolution Time")} {new Date(workOrder?.dateutc_max_sla_resolution).getFullYear() !== 1980 ?? new Date(workOrder?.dateutc_max_sla_resolution).toLocaleString()}</li>
                  <li className='grid grid-cols-2 gap-4'>{t("Arrival Time")} {new Date(workOrder?.dateutc_max_sla_hands_on_machine).getFullYear() !== 1980 ?? new Date(workOrder?.dateutc_max_sla_hands_on_machine).toLocaleString()}</li>
                </ul>
              </div>

              <div className='shadow-md rounded-lg p-4 '>
                <h4 className="text-lg font-semibold pb-2">{t("Priority")}</h4>
                <ul className="list-none list-inside text-gray-700">
                  <li>{workOrder?.job_priority_name}</li>
                </ul>
              </div>

              <div className='shadow-md rounded-lg p-4 '>
                <h4 className="text-lg font-semibold pb-2">{t("Type and Status")}</h4>
                <ul className="list-none list-inside text-gray-700">
                  <li>
                    {workOrder?.job_type_name}
                  </li>
                  <li>
                    <span className={`text-xs font-medium pe-2 px-1 pb-0.5 rounded-full ${statusColors[workOrder?.job_status_name] || "bg-gray-200 text-gray-800"}`}>
                      <Circle className='inline w-2 h-2 mr-1 rounded-full' />
                      {workOrder?.job_status_name}
                    </span>
                  </li>
                </ul>
              </div>

              <div className='shadow-md rounded-lg p-4 '>
                <h4 className="text-lg font-semibold pb-2">{t("Total planned time")}</h4>
                <ul className="list-none list-inside text-gray-700">
                  <li>{Math.floor(workOrder?.total_time_planned / 60).toString().padStart(2, '0')}Hr {(workOrder?.total_time_planned % 60).toString().padStart(2, '0')}Min</li>
                </ul>
              </div>
            </div>
            <div className='shadow-md rounded-lg p-4 mt-4'>
              {sub.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="border-b-2">
                      <tr>
                        <th className="px-4 py-2 text-left text-md font-semibold text-gray-800">
                          {t("Planned Date")}
                        </th>
                        <th className="px-4 py-2 text-left text-md font-semibold text-gray-800">

                        </th>
                        <th className="px-4 py-2 text-left text-md font-semibold text-gray-800">
                          {t("Planned Duration")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sub.map(item => (
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-800">
                            {(() => {
                              const date = new Date(item.date_create);
                              return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
                            })()}
                          </td>

                          <td className="px-4 py-2 text-sm text-gray-800">
                            {new Date(item.date_create).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            })} {item.created_by_user_firstname || 'John'} {item.created_by_user_lastname || 'Doe'}
                          </td>

                          <td className="px-4 py-2 text-sm text-gray-800">
                            {(() => {
                              const closed = new Date(item.date_update);
                              const created = new Date(item.date_create);
                              const diffMs = closed - created;

                              const totalMinutes = Math.floor(diffMs / (1000 * 60));
                              const hours = Math.floor(totalMinutes / 60);
                              const minutes = totalMinutes % 60;

                              return `${hours}h ${minutes}m`;
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">{t("No record available.")}</p>
              )}
            </div>
            <div className='shadow-md rounded-lg p-4 mt-4'>
              <h4 className="text-lg font-semibold pb-2">{t("Description")}</h4>
              {workOrder?.remark ? (<p className="mb-4">{workOrder?.remark}</p>) : (<p className="mb-4">{("No description has been provided.")}</p>)}
            </div>
          </>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            {doc?.length > 0 ? (
              doc.map(item => (
                <div key={item.id} className="p-4 flex flex-col items-center border rounded-lg shadow-md">
                  {/* Show image thumbnail if it's an image, otherwise show file icon */}
                  {item.mime_type?.startsWith("image/") ? (
                    <img src={fileThumbnails[item.id] || ""} alt={item.name} className="w-32 h-32 object-cover rounded-md" />
                  ) : (
                    <File className="w-32 h-32 text-gray-600" />
                  )}
                  <h6 className="font-bold">{item.name}</h6>

                  <p className="text-gray-500">{new Date(item.date_add).toLocaleString()}</p>

                  {/* Show "View Document" only if it's an image */}
                  {item.mime_type?.startsWith("image/") && (
                    <a href={fileThumbnails[item.id] || ""} target="_blank" rel="noopener noreferrer" className="flex items-center mt-2 text-blue-600 hover:underline">
                      <Eye className="w-6 h-6 mr-2 text-gray-600" /> {t("View Document")}
                    </a>
                  )
                  }
                </div>
              ))
            ) : (<p className="text-gray-600 p-4 text-center">{t("No document available.")}</p>)}

            {!fileThumbnails && (!doc || doc.length === 0) && (
              <p className="text-gray-600 p-4 text-center">{t("No document available.")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleWordOrder;