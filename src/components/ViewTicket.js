import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { fetchData } from '../services/apiService';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { File, Eye, ArrowLeft } from "lucide-react";

const SingleTicket = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [doc, setDoc] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // State to manage active tab
  const [fileThumbnails, setFileThumbnails] = useState({});

  const statusColors = useMemo(() => ({
    "In Progress": "bg-yellow-500 text-white",
    "Planned": "bg-blue-500 text-white",
    "To be Planned": "bg-purple-500 text-white",
    "Escalated to WO": "bg-orange-500 text-white",
    "Open": "bg-green-500 text-white",
    "Ready for Review": "bg-indigo-500 text-white",
    "Cancelled": "bg-red-500 text-white",
    "Completed": "bg-pink-500 text-white",
  }), []);

  const taskType = useMemo(() => ({
    "Repair request": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    "Maintenance": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    "Installation": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  }), []);

  const severityType = useMemo(() => ({
    "Not critical": "text-blue-800 ",
    "Medium high": "text-orange-800 ",
    "Critical": "text-red-800 ",
    "Low": "text-green-800 ",
  }), []);

  useEffect(() => {
    const getTicketDetails = async () => {
      try {
        if (!ticketId) {
          setError('Ticket ID is not provided.');
          setLoading(false);
          return;
        }

        const endpoint = `https://v1servicedeskapi.wello.solutions/api/TaskView(${ticketId})`;
        const data = await fetchData(endpoint, 'GET', auth.authKey);
        setTicket(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching ticket details:", err);
        setError('Failed to fetch ticket details.');
        setLoading(false);
      }
    };

    const getTicketDoc = async () => {
      try {
        const endpoint_1 = `https://V1servicedeskapi.wello.solutions/api/DbFileView?$filter=db_table_name+eq+%27task%27+and+id_in_table+eq+${ticketId}`;
        const data_1 = await fetchData(endpoint_1, 'GET', auth.authKey);
        setDoc(data_1.value);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError('Failed to fetch documents.');
      }
    };

    getTicketDetails();
    getTicketDoc();
  }, [auth, ticketId]);

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


  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="relative">
        <div className="w-20 h-20 border-purple-200 border-2 rounded-full"></div>
        <div className="w-20 h-20 border-purple-700 border-t-2 animate-spin rounded-full absolute left-0 top-0"></div>
      </div>
    </div>;
  }
  if (error) return <div className="text-center text-red-600">{error}</div>;

  return (
    <div className="mx-auto p-6 bg-white">
      <div className='flex'>
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)} // Navigate back one step in history
          className="mb-6 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="capitalize text-xl font-bold mb-2 ml-4">{ticket?.subject} | Reference: {ticket?.id2}</h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b border-gray-300 mb-4">
        <button
          className={`py-2 px-4 font-semibold ${activeTab === 'details' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600 hover:text-blue-500'}`}
          onClick={() => setActiveTab('details')}
        >
          Ticket Details
        </button>
        <button
          className={`py-2 px-4 font-semibold ${activeTab === 'documents' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600 hover:text-blue-500'}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
      </div>

      {activeTab === 'details' ? (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='shadow-md rounded-lg p-4 '>
            <h4 className="text-lg font-semibold pb-2">Location and Equipment</h4>
            <ul className="list-none list-inside text-gray-700">
              <li>{ticket?.project_name}</li>
              <li>{ticket?.project_db_address_street}</li>
              <li>{ticket?.project_db_address_zip} {ticket?.project_db_address_city}</li>
            </ul>
          </div>

          <div className='shadow-md rounded-lg p-4 '>
            <h4 className="text-lg font-semibold pb-2">Created By</h4>
            <ul className="list-none list-inside text-gray-700">
              <li>{ticket?.contact_fullname}</li>
              <li>{(new Date(ticket?.date_update).getFullYear() !== 1980) ? new Date(ticket?.date_update).toLocaleString('nl-BE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }) : ''}</li>
            </ul>
          </div>

          <div className='shadow-md rounded-lg p-4 '>
            <h4 className="text-lg font-semibold pb-2">Assigned To</h4>
            <ul className="list-none list-inside text-gray-700">
              <li>{ticket?.assigned_to_user_fullname?.trim() ? ticket.assigned_to_user_fullname : 'Not Assigned'}</li>
            </ul>
          </div>

          <div className='shadow-md rounded-lg p-4 '>
            <h4 className="text-lg font-semibold pb-2">Type and Status</h4>
            <ul className="list-none list-inside text-gray-700">
              <li className='pb-1'>
                <span className={`font-medium me-2 px-2.5 py-0.5 rounded-sm ${taskType[ticket?.task_type_name] || "bg-gray-300"}`}>
                  {ticket?.task_type_name}
                </span>{' - '}
                <span className={`font-medium me-2 ${severityType[ticket?.task_priority_name] || "text-gray-300"}`}>
                  {ticket?.task_priority_name}
                </span>
              </li>
              <li><span className={`font-medium me-2 px-2.5 py-0.5 rounded-sm ${statusColors[ticket?.task_status_name] || "bg-gray-300"}`}>
                {ticket?.task_status_name}
              </span></li>
            </ul>
          </div>
          <div className='shadow-md rounded-lg p-4 '>
            <h4 className="text-lg font-semibold pb-2">Description</h4>
            <p className="mb-4">{ticket?.remark}</p>
          </div>
        </div>
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
                
                <p className="text-gray-500">{(new Date(ticket?.date_update).getFullYear() !== 1980) ? new Date(ticket?.date_update).toLocaleString('nl-BE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }) : ''}</p>

                {/* Show "View Document" only if it's an image */}
                {item.mime_type?.startsWith("image/") && (
                  <a href={fileThumbnails[item.id] || ""} target="_blank" rel="noopener noreferrer" className="flex items-center mt-2 text-blue-600 hover:underline">
                    <Eye className="w-6 h-6 mr-2 text-gray-600" /> View Document
                  </a>
                )
                }
              </div>
            ))
          ) : (<p className="text-gray-600 p-4 text-center">No document available.</p>)}

          {!fileThumbnails && (!doc || doc.length === 0) && (
            <p className="text-gray-600 p-4 text-center">No document available.</p>
          )}

        </div>
      )}
    </div>
  );
};

export default SingleTicket;