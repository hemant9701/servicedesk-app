import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchData } from '../services/apiService';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
        const endpoint_1 = `https://servicedeskapi.wello.solutions/api/DbFileView?$filter=db_table_name+eq+%27task%27+and+id_in_table+eq+${workOrderId}`;
        const data_1 = await fetchData(endpoint_1, 'GET');
        setDoc(data_1.value);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError('Failed to fetch documents.');
      }
    };

    const getworkOrderSub = async () => {
      try {
        const endpoint_2 = `https://servicedeskapi.wello.solutions/api/JobsView?$filter=root_parent_id+eq+${workOrderId}+and+has_child+eq+false&$orderby=id2%20desc`;
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
    
        if (!auth || !auth.email || !auth.password || !auth.domain) {
          throw new Error('Invalid or missing authentication data');
        }
    
        const authString = `${auth.email.trim()}:${auth.password.trim()}@${auth.domain.trim()}`;
        const authKey = btoa(authString);
    
        const config = {
          url: `https://servicedeskapi.wello.solutions/api/DbFileView/GetFileThumbnail/?id=${docId}&maxWidth=256&maxHeight=256`,
          method: 'GET',
          headers: {
            'Authorization': `Basic ${authKey}`,
            'Accept': 'image/png',
          },
          responseType: 'blob',
        };
    
        const response = await axios(config);
        const imageObjectURL = URL.createObjectURL(response.data); 
        setFile(imageObjectURL);
        console.log(imageObjectURL);
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
          {'<'}
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
        <button
          className={`py-2 px-4 font-semibold ${activeTab === 'sub' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600 hover:text-blue-500'}`}
          onClick={() => setActiveTab('sub')}
        >
          Sub-WO's
        </button>
      </div>

      {activeTab === 'details' ? (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='shadow-md rounded-lg p-4 bg-amber-50'>
              <h4 className="text-lg font-semibold">Equipment</h4>
              <ul className="list-none list-inside text-gray-700">
                <li>{workOrder?.project_name}</li>
                <li>{workOrder?.db_address_street}</li>
                <li>{workOrder?.db_address_zip} {workOrder?.db_address_city}</li>
                {workOrder?.contact_mobile && 
                  <li>{workOrder?.contact_mobile}</li>}
              </ul>
          </div>

          <div className='shadow-md rounded-lg p-4 bg-amber-50'>
            <h4 className="text-lg font-semibold">Point of Contact</h4>
            <ul className="list-none list-inside text-gray-700">
              <li>{workOrder?.contact_fullname}</li>
              {workOrder?.contact_phone &&
                <li>{workOrder?.contact_phone}</li>}
            </ul>
          </div>

          <div className='shadow-md rounded-lg p-4 bg-amber-50'>
            <h4 className="text-lg font-semibold">Type and Status</h4>
            <ul className="list-none list-inside text-gray-700">
              <li>{workOrder?.job_type_name} - {workOrder?.job_priority_name}</li>
              <li>{workOrder?.job_status_name}</li>
            </ul>
          </div>

          <div className='shadow-md rounded-lg p-4 bg-amber-50'>
            <h4 className="text-lg font-semibold">SLA information</h4>
            <ul className="list-none list-inside text-gray-700">
              <li>Resolution Time {new Date(workOrder?.dateutc_max_sla_resolution).getFullYear() !== 1980 ?? new Date(workOrder?.dateutc_max_sla_resolution).toLocaleString()}</li>
              <li>Arrival Time {new Date(workOrder?.dateutc_max_sla_hands_on_machine).getFullYear() !== 1980 ?? new Date(workOrder?.dateutc_max_sla_hands_on_machine).toLocaleString()}</li>
              <li>Response Time {new Date(workOrder?.dateutc_max_sla_resolution).getFullYear() !== 1980 ?? new Date(workOrder?.dateutc_max_sla_resolution).toLocaleString()}</li>
            </ul>
          </div>

          <div className='shadow-md rounded-lg p-4 bg-amber-50'>
            <h4 className="text-lg font-semibold">Description</h4>
            <p className="mb-4">{workOrder?.remark}</p>
          </div>

          <div className='shadow-md rounded-lg p-4 bg-amber-50'>
            <h4 className="text-lg font-semibold">Planned date</h4>
            <ul className="list-none list-inside text-gray-700">
              <li>{new Date(workOrder?.date_update).toLocaleString()}</li>
            </ul>
          </div>

          <div className='shadow-md rounded-lg p-4 bg-amber-50'>
            <h4 className="text-lg font-semibold">Total planned time</h4>
            <ul className="list-none list-inside text-gray-700">
              <li>{Math.floor(workOrder?.total_time_planned / 60).toString().padStart(2, '0')}:{(workOrder?.total_time_planned % 60).toString().padStart(2, '0')}</li>
            </ul>
          </div>
        </div> 
      ) : activeTab === 'documents' ? (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div className="border border-gray-300 rounded-md bg-gray-50">
            {file ? (
              <img src={file} alt="Thumbnail" className="w-full h-auto" />
            ) : (
              <p className="text-gray-600 p-4">No document preview available or image could not be loaded.</p>
            )}
            {doc.length > 0 && (
              doc.map(item => (
                <div key={item.id} className="p-4">
                  <h3 className="font-bold">{item.name}</h3>
                  <p className="text-gray-500">{new Date(item.date_add).toLocaleString()}</p>
                  <a href={file} target="_blank" rel="noopener noreferrer" className='flex items-center'> 
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye" viewBox="0 0 16 16" style={{ marginRight: '5px' }}>
                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zm-8 4.5A4.5 4.5 0 1 1 8 3.5a4.5 4.5 0 0 1 0 9zm0-1A3.5 3.5 0 1 0 8 4.5a3.5 3.5 0 0 0 0 7z"/>
                    <path d="M8 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>
                  </svg> View Document
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
                            {item.id2}
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