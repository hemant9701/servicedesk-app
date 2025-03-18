import React, { useMemo, useState, useEffect } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import { fetchData } from '../services/apiService.js';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown, ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ToastContainer, toast } from 'react-toastify';
import { useAuth } from '../AuthContext';

import Select from 'react-select';
import makeAnimated from 'react-select/animated';
const animatedComponents = makeAnimated();

const ViewDocuments = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [downloadMsg, setDownloadMsg] = useState('');

  const fileTypesOptions = [
    { value: "documents", label: "Documents", extentions: ["DOC", "DOCX"] },
    { value: "pdf", label: "PDF", extentions: ["PDF"] },
    { value: "formpdf", label: "Form PDF", extentions: ["FORM_PDF"] },
    { value: "approvalpdf", label: "Approval PDF", extentions: ["APPROVAL_PDF"] },
    { value: "sheet", label: "Sheet XLS", extentions: ["XLS", "XLSX", "CSV"] },
    { value: "text", label: "Text", extentions: ["TXT", "CSV"] },
    { value: "image", label: "Images", extentions: ["JPG", "PNG", "JPEG", "BMP", "TIFF", "GIF", "TGA"] },
    { value: "presentation", label: "Presentation", extentions: ["PPT", "PPTX"] },
    { value: "other", label: "Other", extentions: [] }
  ];

  const uniqueDates = [
    { value: '2025', label: "2025" },
    { value: '2024', label: "2024" },
    { value: '2023', label: "2023" },
    { value: '2022', label: "2022" },
    { value: '2021', label: "2021" },
    { value: '2020', label: "2020" },
    { value: '2019', label: "2019" }
  ];

  const uniqueObjects = [
    { value: "you", label: "Uploaded By You" },
    { value: "company", label: "Company" },
    { value: "task", label: "Task" },
    { value: "jobs", label: "Work Orders" },
    { value: "project", label: "Equipment" }
  ];

  // Search Filter states
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [date, setDate] = useState([uniqueDates[0]]);
  const [fileType, setFileType] = useState([]);
  const [object, setObject] = useState([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Debounced states
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);
  const [debouncedLocation, setDebouncedLocation] = useState(location);
  const [debouncedStreet, setDebouncedStreet] = useState(street);
  const [debouncedCity, setDebouncedCity] = useState(city);

  const fileExtn = useMemo(() => ({
    "PDF": "bg-yellow-500 text-white",
    "PNG": "bg-blue-500 text-white",
    "ZIP": "bg-purple-500 text-white",
    "TXT": "bg-orange-500 text-white",
    "DOCX": "bg-green-500 text-white",
    "DOC": "bg-green-500 text-white",
    "XLSX": "bg-indigo-500 text-white",
    "XLS": "bg-indigo-500 text-white",
    "JPG": "bg-red-500 text-white",
    "JPEG": "bg-pink-500 text-white",
  }), []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [keyword]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedLocation(location);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [location]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedStreet(street);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [street]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedCity(city);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [city]);

  useEffect(() => {
    if (downloadMsg) {
      toast.success("Downloading!");
    }
  }, [downloadMsg]);

  useEffect(() => {
    const fetchInstallations = async () => {
      try {
        const payload = {
          keyword: debouncedKeyword,
          file_types: fileType.map((type) => type.value),
          project_id: "00000000-0000-0000-0000-000000000000",
          db_report_type_ids: [],
          street: debouncedStreet,
          city: debouncedCity,
          added_date: date.length ? date.map((d) => d.value) : date.value,
          object_list: [
            "company",
            "task",
            "jobs",
            "project",
            "you"
          ],
          file_extentions: fileType.reduce((acc, type) => acc.concat(type.extentions), []),
          file_extentions_not_in: [],
          date_add_min: `${date.length ? date.map((d) => d.value) : date.value}-01-01T00:00:00.000`,
          date_add_max: `${date.length ? date.map((d) => d.value) : date.value}-12-31T23:59:59.000`,
          query_object: {
            startRow: 0,
            endRow: 500,
            rowGroupCols: [
              {
                id: "object_type",
                displayName: "Object",
                field: "object_type"
              }
            ],
            valueCols: [],
            pivotCols: [],
            pivotMode: false,
            groupKeys: object.map((obj) => obj.label) || [
              "company",
              "task",
              "jobs",
              "project",
              "you"
            ],
            filterModel: {},
            sortModel: []
          }
        };
        const response = await fetchData('https://V1servicedeskapi.wello.solutions/api/DbFileView/Search', 'POST', auth.authKey, payload);
        setContacts(response || []);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchInstallations();
  }, [auth, debouncedKeyword, debouncedLocation, debouncedStreet, debouncedCity, date, fileType, object, includeArchived]);

  const columns = useMemo(() => [
    {
      Header: '',
      id: '1', // Unique ID for this column
      Cell: ({ row }) => (
        row.original.file_name ? (
        <input
          type="checkbox"
          onChange={() => toggleFileSelection(row.original)}
          checked={selectedFiles.some((file) => file.id === row.original.id)}
        /> ) : null
      ),
      disableSortBy: true,
    },
    { Header: 'Object', accessor: 'object_type' },
    {
      Header: 'Object Name', accessor: 'object_name',
      Cell: ({ row }) => (
        <button
          onClick={() => {
            let path;
            switch (row.original.object_type) {
              case 'Work Orders':
                path = `/workorder/${row.original.object_id}`;
                break;
              case 'Task':
                path = `/ticket/${row.original.object_id}`;
                break;
              case 'Uploaded By You':
                path = `/ticket//${row.original.object_id}`;
                break;
              case 'Equipment':
                path = `/installation/${row.original.object_id}`;
                break;
              default:
                path = ' ';
            }
            navigate(`${path}`)
          }}
          className="text-blue-800 font-medium me-2 text-left"
        >
          {row.original.object_name}
        </button>
      ),
    },
    {
      Header: 'File Type',
      accessor: 'file_extention',
      Cell: ({ row }) =>
        row.original.file_name ? (
          <span className={`text-xs font-medium me-2 px-2.5 py-0.5 rounded-sm ${fileExtn[row.original.file_extention] || "bg-gray-300"}`}>
            {row.original.file_extention}
          </span>
        ) : null
    },
    {
      Header: 'File Name', accessor: 'file_name',
      Cell: ({ row }) => (
        <a
          href={`https://V1servicedeskapi.wello.solutions/api/DbFileView/View/${row.original.file_name.replace(
            /[^a-zA-Z ]/g,
            ''
          )}?id=${row.original.id}&token=${auth.authKey}`}
          className="text-blue-800 font-medium me-2 text-left"
          target="_blank"
          rel="noreferrer"
        >
          {row.original.file_name}
        </a>
      ),
    },
    {
      Header: 'Upload When', accessor: 'date_add',
      Cell: ({ row, value }) =>
        row.original.file_name ? (
          new Date(value).getFullYear() !== 1980 ?? new Date(value).toLocaleString('nl-BE', {
            hour: '2-digit',
            minute: '2-digit',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          })
        ) : null
    },
  ], [auth, selectedFiles, fileExtn, navigate]);

  const toggleFileSelection = (file) => {
    setSelectedFiles((prev) =>
      prev.some((f) => f.id === file.id)
        ? prev.filter((f) => f.id !== file.id)
        : [...prev, file]
    );
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip(); // Create a new ZIP instance

    for (const file of contacts) {
      try {
        const url = `https://V1servicedeskapi.wello.solutions/api/DbFileView/View/${file.file_name.replace(
          /[^a-zA-Z ]/g,
          ''
        )}?id=${file.id}&token=${auth.authKey}`;

        // Fetch the file content
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${file.file_name}`);
        } else {
          setDownloadMsg('All Documents');
        }

        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();

        // Add the file to the ZIP archive
        zip.file(file.file_name || 'file', arrayBuffer);
      } catch (error) {
        console.error(`Error fetching file ${file.file_name}:`, error.message);
      }
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

  const handleDownloadSelected = async () => {
    if (selectedFiles.length === 0) {
      return;
    }

    const zip = new JSZip();

    try {
      await Promise.all(
        selectedFiles.map(async (file) => {
          const response = await fetch(
            `https://V1servicedeskapi.wello.solutions/api/DbFileView/View/${file.file_name.replace(
              /[^a-zA-Z ]/g,)}?id=${file.id}&token=${auth.authKey}`
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


  const handleReset = () => {
    setKeyword('');
    setLocation('');
    setStreet('');
    setCity('');
    setDate([uniqueDates[0]]);
    setFileType([]);
    setObject([]);
    toggleFileSelection([]);
    setIncludeArchived(false);
  };

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
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
      data: contacts,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useSortBy,
    usePagination
  );

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="relative">
        <div className="w-20 h-20 border-purple-200 border-2 rounded-full"></div>
        <div className="w-20 h-20 border-purple-700 border-t-2 animate-spin rounded-full absolute left-0 top-0"></div>
      </div>
    </div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return ( 
    <div className="max-w-7xl mx-auto p-1 md:p-8">
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
      <div className='flex'>
        <button
          onClick={() => navigate('/')}
          className="mb-6 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-800 mb-6 ml-4">Documents</h1>
      </div>

      {/* Search Filter UI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label>Keyword</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
          />
        </div>
        <div>
          <label>Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
          />
        </div>
        <div>
          <label>Street</label>
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
          />
        </div>
        <div>
          <label>City</label>
          <input
            type="text"
            value={city}
            onInput={(e) => setCity(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
          />
        </div>
        <div>
          <label>Created Date</label>
          <Select
            components={animatedComponents}
            defaultValue={uniqueDates[0]}
            options={uniqueDates}
            value={date}
            onChange={setDate}
            className="w-full"
          />
        </div>
        <div>
          <label>File Type</label>
          <Select
            closeMenuOnSelect={false}
            components={animatedComponents}
            isMulti
            defaultValue={fileTypesOptions}
            options={fileTypesOptions}
            value={fileType}
            onChange={setFileType}
            placeholder="Select file type"
            className="w-full border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label>Object</label>
          <Select
            closeMenuOnSelect={false}
            components={animatedComponents}
            isMulti
            defaultValue={uniqueObjects}
            options={uniqueObjects}
            value={object}
            onChange={setObject}
            placeholder="Select objects"
            className="w-full border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex items-end gap-x-2">
          <button onClick={handleReset} className="bg-gray-300 text-black rounded-md px-4 py-2 ml-2">Reset</button>
          {contacts.length !== 0 && (
            selectedFiles.length !== 0 && (
              <button
                onClick={handleDownloadSelected}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Download
              </button>
            )
          )}
          {contacts.length !== 0 && (
            <button
              onClick={handleDownloadAll}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Download All
            </button>
          )}
        </div>
      </div>

      {/* Table displaying data */}
      <div className="overflow-x-auto mb-4">
        <table {...getTableProps()} className="min-w-full divide-y divide-gray-200 border border-gray-300">
          <thead className="bg-gray-100">
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps(column.getSortByToggleProps())}
                    className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                    {column.render('Header')}
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
            {page.map(row => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map(cell => (
                    <td {...cell.getCellProps()} className="px-4 py-2 text-sm text-gray-800">
                      {cell.render('Cell')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {contacts.length > 10 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-700">
            Page {pageIndex + 1} of {pageOptions.length}
          </span>
          <div>
            <button onClick={() => gotoPage(0)} disabled={!canPreviousPage} className="py-1 px-2 md:py-2 md:px-4 mr-1 bg-indigo-600 text-white rounded-md disabled:bg-gray-300">
              <ChevronsLeft className="w-4" />
            </button>
            <button onClick={() => previousPage()} disabled={!canPreviousPage} className="py-1 px-2 md:py-2 md:px-4 mr-1 bg-indigo-600 text-white rounded-md disabled:bg-gray-300">
              <ChevronLeft className="w-4" />
            </button>
            <button onClick={() => nextPage()} disabled={!canNextPage} className="py-1 px-2 md:py-2 md:px-4 mr-1 bg-indigo-600 text-white rounded-md disabled:bg-gray-300">
              <ChevronRight className="w-4" />
            </button>
            <button onClick={() => gotoPage(pageOptions.length - 1)} disabled={!canNextPage} className="py-1 px-2 md:py-2 md:px-4 bg-indigo-600 text-white rounded-md disabled:bg-gray-300">
              <ChevronsRight className="w-4" />
            </button>
          </div>
          <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="ml-1 p-1 md:p-2 border border-gray-300 rounded-md max-w-32">
            {[10, 20, 30, 50].map(size => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default ViewDocuments;
