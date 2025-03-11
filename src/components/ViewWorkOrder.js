import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { fetchData } from '../services/apiService';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { File, FileText, Eye, Phone, ArrowLeft } from "lucide-react";

const SingleWordOrder = () => {
  const navigate = useNavigate();
  const { workOrderId } = useParams();
  const [workOrder, setWorkOrder] = useState(null);
  const [doc, setDoc] = useState([]);
  const [sub, setSub] = useState([]);
  const [file, setFile] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // State to manage active tab

  const statusColors = useMemo(() => ({
    "In Progress": "bg-yellow-500 text-white",
    "Planned": "bg-blue-500 text-white",
    "To be Planned": "bg-purple-500 text-white",
    "In progress (W)": "bg-orange-500 text-white",
    "Open": "bg-green-500 text-white",
    "Ready for Review": "bg-indigo-500 text-white",
    "Cancelled": "bg-red-500 text-white",
    "Completed": "bg-pink-500 text-white",
  }), []);

  const jobType = useMemo(() => ({
    "Repair": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    "Maintenance": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    "Installation": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
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
        const data = await fetchData(endpoint, 'GET');
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
        const data_1 = await fetchData(endpoint_1, 'GET');
        setDoc(data_1.value);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError('Failed to fetch documents.');
      }
    };

    const getworkOrderSub = async () => {
      try {
        const endpoint_2 = `https://v1servicedeskapi.wello.solutions/api/JobsView?$filter=root_parent_id+eq+${workOrderId}+and+has_child+eq+false&$orderby=id2%20desc`;
        const data_2 = await fetchData(endpoint_2, 'GET');
        setSub(data_2.value);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError('Failed to fetch documents.');
      }
    };

    getworkOrderDetails();
    getworkOrderDoc();
    getworkOrderSub();
  }, [workOrderId]);

  useEffect(() => {
    const GetFileThumbnail = async () => {
      try {
        if (doc.length === 0) return; // Ensure there is data before fetching

        const docId = doc[0]?.id; // Use the first document ID (or adjust as needed)
        if (!docId) return;

        const auth = JSON.parse(sessionStorage.getItem('auth'));

        const authKey = auth.authKey;

        const config = {
          url: `https://V1servicedeskapi.wello.solutions/api/DbFileView/GetFileThumbnail/?id=${docId}&maxWidth=256&maxHeight=256`,
          method: 'GET',
          headers: {
            'Authorization': `Basic ${authKey}`,
            'Accept': 'image/png',
          },
          responseType: 'blob',
        };

        const response = await axios(config);
        //const imageObjectURL = URL.createObjectURL(response.data);
        setFile(response.data);
      } catch (err) {
        console.error("Error fetching thumbnail:", err);
        setError('Failed to fetch thumbnail.');
      } finally {
        setLoading(false); // Set loading to false once done
      }
    };

    GetFileThumbnail();
  }, [doc]); // Run when `doc` changes

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
    <div className="mx-auto p-6 mt-8 bg-white">
      <div className='flex'>
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)} // Navigate back one step in history
          className="mb-6 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="capitalize text-xl font-bold mb-2 ml-4">{workOrder?.name} | Reference: {workOrder?.id2}</h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b border-gray-300 mb-4">
        <button
          className={`py-2 px-4 font-semibold ${activeTab === 'details' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600 hover:text-blue-500'}`}
          onClick={() => setActiveTab('details')}
        >
          Overview
        </button>

        <button
          className={`py-2 px-4 font-semibold ${activeTab === 'documents' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600 hover:text-blue-500'}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
        {sub.length > 0 && (
          <button
            className={`py-2 px-4 font-semibold ${activeTab === 'sub' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600 hover:text-blue-500'}`}
            onClick={() => setActiveTab('sub')}
          >
            Sub-WO's
          </button>)}
      </div>

      {activeTab === 'details' ? (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='shadow-md rounded-lg p-4 '>
            <h4 className="text-lg font-semibold pb-2">Equipment</h4>
            <ul className="list-none list-inside text-gray-700">
              <li>{workOrder?.project_name}</li>
              <li>{workOrder?.db_address_street}</li>
              <li>{workOrder?.db_address_zip} {workOrder?.db_address_city}</li>
              {workOrder?.contact_mobile && (
                <li><Phone className="w-4 h-4" /> <a href={`tel:${workOrder.contact_mobile}`}>{workOrder.contact_mobile}</a></li>
              )}
            </ul>
          </div>

          <div className='shadow-md rounded-lg p-4 '>
            <h4 className="text-lg font-semibold pb-2">Point of Contact</h4>
            <ul className="list-none list-inside text-gray-700">
              <li>{workOrder?.contact_fullname}</li>
              {workOrder?.contact_phone && (
                <li><Phone className="w-4 h-4" /> <a href={`tel:${workOrder.contact_phone}`}>{workOrder.contact_phone}</a></li>
              )}
            </ul>
          </div>

          <div className='shadow-md rounded-lg p-4 '>
            <h4 className="text-lg font-semibold pb-2">Type and Status</h4>
            <ul className="list-none list-inside text-gray-700">
              <li>
                <span className={`text-xs font-medium me-2 px-2.5 py-0.5 rounded-sm ${jobType[workOrder?.job_type_name] || "bg-gray-300"}`}>
                  {workOrder?.job_type_name}
                </span>
                - {workOrder?.job_priority_name}
              </li>
              <li>
                <span className={`text-xs font-medium me-2 px-2.5 py-0.5 rounded-sm ${statusColors[workOrder?.job_status_name] || "bg-gray-300"}`}>
                  {workOrder?.job_status_name}
                </span>
              </li>
            </ul>
          </div>

          <div className='shadow-md rounded-lg p-4 '>
            <h4 className="text-lg font-semibold pb-2">SLA information</h4>
            <ul className="list-none list-inside text-gray-700">
              <li>Resolution Time {new Date(workOrder?.dateutc_max_sla_resolution).getFullYear() !== 1980 ?? new Date(workOrder?.dateutc_max_sla_resolution).toLocaleString()}</li>
              <li>Arrival Time {new Date(workOrder?.dateutc_max_sla_hands_on_machine).getFullYear() !== 1980 ?? new Date(workOrder?.dateutc_max_sla_hands_on_machine).toLocaleString()}</li>
              <li>Response Time {new Date(workOrder?.dateutc_max_sla_resolution).getFullYear() !== 1980 ?? new Date(workOrder?.dateutc_max_sla_resolution).toLocaleString()}</li>
            </ul>
          </div>

          <div className='shadow-md rounded-lg p-4 '>
            <h4 className="text-lg font-semibold pb-2">Description</h4>
            <p className="mb-4">{workOrder?.remark}</p>
          </div>

          <div className='shadow-md rounded-lg p-4 '>
            <h4 className="text-lg font-semibold pb-2">Planned date</h4>
            <ul className="list-none list-inside text-gray-700">
              <li><em>{(new Date(workOrder?.first_planning_date).getFullYear() !== 1980) ? new Date(workOrder?.first_planning_date).toLocaleString('nl-BE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }) : ''}</em></li>
              <li><em>{(new Date(workOrder?.date_create).getFullYear() !== 1980) ? new Date(workOrder?.date_create).toLocaleString('nl-BE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }) : ''}</em></li>
              <li><em>{(new Date(workOrder?.date_update).getFullYear() !== 1980) ? new Date(workOrder?.date_update).toLocaleString('nl-BE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }) : ''}</em></li>
              <li><em>{(new Date(workOrder?.first_planning_date).getFullYear() !== 1980) ? new Date(workOrder?.first_planning_date).toLocaleString('nl-BE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }) : ''}</em></li>
            </ul>
          </div>

          <div className='shadow-md rounded-lg p-4 '>
            <h4 className="text-lg font-semibold pb-2">Total planned time</h4>
            <ul className="list-none list-inside text-gray-700">
              <li>{Math.floor(workOrder?.total_time_planned / 60).toString().padStart(2, '0')}h{(workOrder?.total_time_planned % 60).toString().padStart(2, '0')}</li>
            </ul>
          </div>
        </div>
      ) : activeTab === 'documents' ? (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div className="border border-gray-300 rounded-md bg-gray-50">
            {file ? (
              file && file.type && file.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(file)} alt="Thumbnail" className="w-full h-auto" />
              ) : file && file.type && file.type === 'application/pdf' ? (
                <div className="flex items-center justify-center h-40 bg-gray-100 text-gray-600 p-4">
                  <FileText className="w-32 h-32 text-gray-600" />
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 bg-gray-100 text-gray-600 p-4">
                  <File className="w-32 h-32 text-gray-600" />
                </div>
              )
            ) : (
              <p className="text-gray-600 p-4">No document available.</p>
            )}
            {doc.length > 0 && (
              doc.map(item => (
                <div key={item.id} className="p-4">
                  <a href={file} target="_blank" rel="noopener noreferrer"><h3 className="font-bold">{item.name}</h3></a>
                  <p className="text-gray-500">{new Date(item.date_add).toLocaleString()}</p>
                  <a href={file} target="_blank" rel="noopener noreferrer" className='flex items-center'>
                    <Eye className="w-8 h-8 text-gray-600" /> View Document
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className=''>
          <div className=''>
            {sub.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                        Reference
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                        type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sub.map(item => (
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {item.job_status_name}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {item.name}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          <span
                            className="bg-blue-100 text-blue-800 font-medium me-2 px-2.5 py-0.5 rounded-sm border border-blue-400">
                            {item.id2}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {item.job_type_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No record available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleWordOrder;