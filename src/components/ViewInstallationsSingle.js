import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { fetchData } from '../services/apiService';
import axios from 'axios';
import JSZip from 'jszip';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { File, Eye, ArrowLeft } from "lucide-react";

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

  const statusColors = useMemo(() => ({
    "In Progress": "bg-yellow-500 text-white",
    "Planned": "bg-blue-500 text-white",
    "To be Planned": "bg-purple-500 text-white",
    "Out of production": "bg-orange-500 text-white",
    "Active": "bg-green-500 text-white",
    "Ready for Review": "bg-indigo-500 text-white",
    "Proactive": "bg-red-500 text-white",
    "Completed": "bg-pink-500 text-white",
  }), []);

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

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gray-100">
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
    <div className="mx-auto p-6 bg-white">
      <div className='flex'>
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)} // Navigate back one step in history
          className="mb-6 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="capitalize text-xl font-bold mb-2 ml-4">{Installation?.name} | Reference: {Installation?.id2}</h2>
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
          className={`py-2 px-4 font-semibold ${activeTab === 'wordOrder' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600 hover:text-blue-500'}`}
          onClick={() => setActiveTab('wordOrder')}
        >
          Work Orders
        </button>
      </div>

      {activeTab === 'details' ? (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='shadow-md rounded-lg p-4 '>
            <h4 className="text-lg font-semibold">Equipment</h4>
            <ul className="list-none list-inside text-gray-700">
              <li>{Installation?.name}</li>
              <li>{Installation?.equipment_model_name}</li>
              <li>{Installation?.equipment_brand_name}</li>
            </ul>
          </div>

          <div className='shadow-md rounded-lg p-4 '>
            <h4 className="text-lg font-semibold">Type and Status</h4>
            <ul className="list-none list-inside text-gray-700">
              <li>{Installation?.equipment_family_name}</li>
              <li>
                <span className={`text-xs font-medium me-2 px-2.5 py-0.5 rounded-sm ${statusColors[Installation?.project_status_name] || "bg-gray-300"}`}>
                  {Installation?.project_status_name}
                </span>
              </li>
            </ul>
          </div>

          <div className='shadow-md rounded-lg p-4 '>
            <h4 className="text-lg font-semibold">Warranty Info</h4>
            <ul className="list-none list-inside text-gray-700">
              <li>Build date: <em>{(new Date(Installation?.date_built).getFullYear() !== 1980) ? new Date(Installation?.date_built).toLocaleString('nl-BE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }) : ''}</em></li>
              <li>Commissioning date: <em>{(new Date(Installation?.date_start_production).getFullYear() !== 1980) ? new Date(Installation?.date_start_production).toLocaleString('nl-BE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }) : ''}</em></li>
              <li>End of warranty date: <em>{(new Date(Installation?.warranty_date_until).getFullYear() !== 1980) ? new Date(Installation?.warranty_date_until).toLocaleString('nl-BE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }) : ''}</em></li>
              <li>End of parts warranty date: <em>{(new Date(Installation?.replacement_date).getFullYear() !== 1980) ? new Date(Installation?.replacement_date).toLocaleString('nl-BE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }) : ''}</em></li>
            </ul>
          </div>

          <div className='shadow-md rounded-lg p-4 '>
            <h4 className="text-lg font-semibold">Supplier reference</h4>
            <ul className="list-none list-inside text-gray-700">
              <li>{Installation?.id2}</li>
            </ul>
          </div>

          <div className='shadow-md rounded-lg p-4 '>
            <h4 className="text-lg font-semibold">Our reference</h4>
            <p className="mb-4">{Installation?.customer_reference}</p>
          </div>

          <div className='shadow-md rounded-lg p-4 '>
            <h4 className="text-lg font-semibold">Serial number and barcode</h4>
            <ul className="list-none list-inside text-gray-700">
              <li>{Installation?.serial_number}</li>
              <li>{Installation?.barcode}</li>
            </ul>
          </div>

          <div className='md:col-span-3 shadow-md rounded-lg p-4 '>
            <h4 className="text-lg font-semibold">Shutdown consequence</h4>
            <ul className="list-none list-inside text-gray-700">
              <li>{Installation?.shutdown_consequence}</li>
            </ul>
          </div>

          <div className='shadow-md rounded-lg p-4 '>
            <h4 className="text-lg font-semibold">Location</h4>
            <ul className="list-none list-inside text-gray-700">
              <li>{Installation?.company_name}</li>
              <li>{Installation?.db_address_street}</li>
              <li>{Installation?.db_address_zip} {Installation?.db_address_city}</li>
              {Installation?.contact_mobile &&
                <li>{Installation?.contact_mobile}</li>}
            </ul>
          </div>

          <div className='shadow-md rounded-lg p-4 '>
            <h4 className="text-lg font-semibold">Company address</h4>
            <ul className="list-none list-inside text-gray-700">
              <li>{Installation?.db_address_street}</li>
              <li>{Installation?.db_address_zip} {Installation?.db_address_city}</li>
              {Installation?.contact_mobile &&
                <li>{Installation?.contact_mobile}</li>}
            </ul>
          </div>

          <div className='shadow-md rounded-lg p-4 '>
            <h4 className="text-lg font-semibold">Extra location info</h4>
            <ul className="list-none list-inside text-gray-700">
              <li>{Installation?.total_time_planned}</li>
            </ul>
          </div>
        </div>
      ) : activeTab === 'documents' ? (
        <div>
          {doc.length > 0 &&
            <button
              onClick={handleDownloadAll}
              className="bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-600 mb-4"
            >
              Download All
            </button>}
          <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
            <div className="border border-gray-300 rounded-md bg-gray-50">
              {doc?.length > 0 ? (
                doc.map(item => (
                  <div key={item.id} className="p-4 flex flex-col items-center border rounded-lg shadow-md">
                    {/* Show image thumbnail if it's an image, otherwise show file icon */}
                    {item.mime_type?.startsWith("image/") ? (
                      <img src={fileThumbnails[item.id] || ""} alt={item.name} className="w-32 h-32 object-cover rounded-md" />
                    ) : (
                      <File className="w-32 h-32 text-gray-600" />
                    )}
                    <h3 className="font-bold">{item.name}</h3>

                    <p className="text-gray-500">{new Date(item.date_add).toLocaleString()}</p>

                    {/* Show "View Document" only if it's an image */}
                    {item.mime_type?.startsWith("image/") && (
                      <a href={fileThumbnails[item.id] || ""} target="_blank" rel="noopener noreferrer" className="flex items-center mt-2 text-blue-600 hover:underline">
                        <Eye className="w-6 h-6 mr-2 text-gray-600" /> View Document
                      </a>
                    )
                    }
                  </div>
                ))
              ) : <p className="text-gray-600 p-4 text-center">No document available.</p>}
            </div>
          </div>
        </div>
      ) : (
        <div>
          {wordOrder ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">

                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                      Reference
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                      First-scheduled technician
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                      Creation Date
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                      Complition Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {wordOrder.map(item => (
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-800">
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        <button
                          onClick={() => navigate(`/workorder/${item.id}`)}
                          className="text-blue-800 font-medium me-2 text-left">
                          {item.id2}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {item.project_name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {item.first_planning_userfullname}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        <span className={`text-xs font-medium me-2 px-2.5 py-0.5 rounded-sm ${statusColors[item.job_status_name] || "bg-gray-300"}`}>
                          {item.job_status_name}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {new Date(item.dateutc_create).toLocaleString('nl-BE', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {(new Date(item.dateutc_closed).getFullYear() !== 1980) ? new Date(item.dateutc_closed).toLocaleString('nl-BE', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : ''}
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

      )}
    </div>
  );
};

export default SingleInstallation;