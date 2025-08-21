import React, { useMemo, useState, useEffect } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import { fetchData } from '../services/apiService.js';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  File, Eye, Download, BadgeInfo, ArrowUp, ArrowDown, ArrowLeft, ArrowLeftToLine, ArrowRight, ArrowRightToLine,
  LayoutGrid, Table, Type, MapPin, Milestone, Building, Calendar, FileText, Wrench, Image
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ToastContainer, toast } from 'react-toastify';
import { useAuth } from '../AuthContext.js';
import { useTranslation } from "react-i18next";

import Select from 'react-select';
import makeAnimated from 'react-select/animated';
const animatedComponents = makeAnimated();

const ViewDocuments = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  const [fileThumbnails, setFileThumbnails] = useState({});

  const [downloadMsg, setDownloadMsg] = useState('');
  const { t } = useTranslation('documents');

  const url = `https://testservicedeskapi.odysseemobile.com/`;

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

  // const fileExtn = useMemo(() => ({
  //   "PDF": "bg-yellow-500 text-white",
  //   "PNG": "bg-blue-500 text-white",
  //   "ZIP": "bg-purple-500 text-white",
  //   "TXT": "bg-orange-500 text-white",
  //   "DOCX": "bg-green-500 text-white",
  //   "DOC": "bg-green-500 text-white",
  //   "XLSX": "bg-indigo-500 text-white",
  //   "XLS": "bg-indigo-500 text-white",
  //   "JPG": "bg-red-500 text-white",
  //   "JPEG": "bg-pink-500 text-white",
  // }), []);

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
          object_list: object.map((obj) => obj.value) || [
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
            groupKeys: object.map((obj) => obj.label) || [],
            filterModel: {},
            sortModel: []
          }
        };
        const response = await fetchData(`api/DbFileView/Search`, 'POST', auth.authKey, payload);
        setContacts(response || []);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchInstallations();
  }, [auth, url, debouncedKeyword, debouncedLocation, debouncedStreet, debouncedCity, date, fileType, object, includeArchived]);

  useEffect(() => {
    const GetFileThumbnails = async () => {
      try {
        if (viewMode !== 'grid') return; // Only run in grid view
        if (contacts.length === 0) return;

        const authKey = auth.authKey;
        if (!authKey) return;

        const updatedThumbnails = {};

        await Promise.all(
          contacts.map(async (item) => {
            if (!item.id || (item.mime_type !== 'image/jpeg' && item.mime_type !== 'image/png')) return;
            //if (item.id === '0c72ecbc-489a-4995-92ff-e84ee1448474' || item.id === '970ad1e0-e616-4c22-a2a0-38b71ee9a87b') return;

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
            updatedThumbnails[item.id] = URL.createObjectURL(response.data);
          })
        );

        setFileThumbnails(updatedThumbnails);
      } catch (err) {
        setError("Failed to fetch thumbnails.");
      } finally {
        setLoading(false);
      }
    };

    GetFileThumbnails();
  }, [contacts, auth, url, viewMode]); // 👈 Add viewMode to dependencies


  const columns = useMemo(() => [
    {
      id: '1', // Unique ID for this column
      Header: ({ rows }) => {
        const allVisibleSelected = rows.every(row =>
          selectedFiles.some(file => file.id === row.original.id)
        );

        const someVisibleSelected = rows.some(row =>
          selectedFiles.some(file => file.id === row.original.id)
        );

        const handleSelectAll = () => {
          if (allVisibleSelected) {
            // Deselect all visible
            const visibleIds = rows.map(row => row.original.id);
            setSelectedFiles(prev =>
              prev.filter(file => !visibleIds.includes(file.id))
            );
          } else {
            // Select all visible that aren't already selected
            const newSelections = rows
              .map(row => row.original)
              .filter(file => !selectedFiles.some(f => f.id === file.id));
            setSelectedFiles(prev => [...prev, ...newSelections]);
          }
        };

        return (
          <input
            type="checkbox"
            onChange={handleSelectAll}
            checked={allVisibleSelected}
            ref={el => {
              if (el) el.indeterminate = !allVisibleSelected && someVisibleSelected;
            }}
          />
        );
      },
      Cell: ({ row }) =>
        row.original.file_name ? (
          <input
            type="checkbox"
            onChange={() => toggleFileSelection(row.original)}
            checked={selectedFiles.some(file => file.id === row.original.id)}
          />
        ) : null,
      disableSortBy: true,
    },
    { Header: t('documents_table_heading_object_text'), accessor: 'object_type' },
    {
      Header: t('documents_table_heading_object_name_text'), accessor: 'object_name',
      Cell: ({ row }) =>
        row.original.object_name ? (
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
            className="text-left"
          >
            {row.original.object_name}
          </button>
        ) : null
    },
    {
      Header: t('documents_table_heading_file_type_text'),
      accessor: 'file_extention',
      Cell: ({ row }) =>
        row.original.file_name ? (
          <span className='text-xs'>
            {row.original.file_extention}
          </span>
        ) : null
    },
    {
      Header: t('documents_table_heading_file_name_text'), accessor: 'file_name',
      Cell: ({ row }) =>
        row.original.file_name ? (
          <a
            href={`${url}api/DbFileView/View/${row.original.file_name.replace(
              /[^a-zA-Z ]/g,
              ''
            )}?id=${row.original.id}&token=${encodeURIComponent(auth.authKey)}`}
            className="text-left"
            target="_blank"
            rel="noreferrer"
          >
            {row.original.file_name}
          </a>
        ) : null
    },
    {
      Header: t('documents_table_heading_upload_when_text'), accessor: 'date_add',
      Cell: ({ row }) =>
        row.original.file_name && new Date(row.original.date_add).getFullYear() !== 1980
          ? new Date(row.original.date_add).toLocaleString('nl-BE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
          : null
    },
  ], [auth, selectedFiles, navigate, url, t]);

  const toggleFileSelection = (file) => {
    setSelectedFiles((prev) =>
      prev.some((f) => f.id === file.id)
        ? prev.filter((f) => f.id !== file.id)
        : [...prev, file]
    );
  };

  // const handleDownloadAll = async () => {
  //   const zip = new JSZip(); // Create a new ZIP instance

  //   for (const file of contacts) {
  //     try {
  //       const url = `api/DbFileView/View/${file.file_name.replace(
  //         /[^a-zA-Z ]/g,
  //         ''
  //       )}?id=${file.id}&token=${auth.authKey}`;

  //       // Fetch the file content
  //       const response = await fetch(url, { method: 'GET' });
  //       if (!response.ok) {
  //         throw new Error(`Failed to fetch file: ${file.file_name}`);
  //       } else {
  //         setDownloadMsg('All Documents');
  //       }

  //       const blob = await response.blob();
  //       const arrayBuffer = await blob.arrayBuffer();

  //       // Add the file to the ZIP archive
  //       zip.file(file.file_name || 'file', arrayBuffer);
  //     } catch (error) {
  //       console.error(`Error fetching file ${file.file_name}:`, error.message);
  //     }
  //   }

  //   // Generate the ZIP archive and trigger the download
  //   zip.generateAsync({ type: 'blob' }).then((content) => {
  //     const blobUrl = window.URL.createObjectURL(content);

  //     // Create a temporary link element
  //     const link = document.createElement('a');
  //     link.href = blobUrl;
  //     link.download = 'files.zip'; // Name of the ZIP file
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);

  //     // Revoke the object URL to free up memory
  //     window.URL.revokeObjectURL(blobUrl);
  //   });
  // };

  const handleDownloadSelected = async () => {
    if (selectedFiles.length === 0) {
      return;
    }

    const zip = new JSZip();

    try {
      await Promise.all(
        selectedFiles.map(async (file) => {
          const response = await fetch(
            `${url}api/DbFileView/View/${file.file_name.replace(
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
    return <div className="flex w-full items-center justify-center h-screen">
      <div className="relative">
        <div className="w-20 h-20 border-purple-200 border-2 rounded-full"></div>
        <div className="w-20 h-20 border-purple-700 border-t-2 animate-spin rounded-full absolute left-0 top-0"></div>
      </div>
    </div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-600">Error fetching data: {error.message}</div>;
  }

  return (
    <div className="w-full mx-auto p-1 md:p-8">
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

      <h1 className="text-2xl font-semibold text-gray-800 mb-6">{t("documents_page_title")}</h1>
      {/* Back Button */}
      <button
        onClick={() => navigate('/')} // Navigate back one step in history
        className="flex items-center mb-4 font-semibold text-gray-800"
      >
        <ArrowLeft className="mr-2 w-5 h-5" /> {t("documents_page_go_back")}
      </button>

      {/* Search Filter UI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shadow-sm border rounded-lg p-4">
        <div className="relative">
          <Type className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t('documents_table_filter_keyword')}
            className="w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t('documents_table_filter_location')}
            className="w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
        <div className="relative">
          <Milestone className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder={t('documents_table_filter_street')}
            className="w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
        <div className="relative">
          <Building className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={city}
            onInput={(e) => setCity(e.target.value)}
            placeholder={t('documents_table_filter_city')}
            className="w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <Select
            components={animatedComponents}
            defaultValue={uniqueDates[0]}
            options={uniqueDates}
            value={date}
            onChange={setDate}
            className="w-full pl-10 border rounded-md text-sm text-gray-700"
            styles={{
              control: (base) => ({
                ...base,
                border: 'none',
                boxShadow: 'none', // also remove focus ring
              }),
              option: (base, state) => ({
                ...base,
                color: state.isSelected
                  ? '#ffffff' // white text when selected
                  : state.isFocused
                    ? '#fff' // Tailwind blue-700 on hover
                    : '#374151', // Tailwind gray-700 default
                backgroundColor: state.isSelected
                  ? '#374151' // Tailwind blue-500
                  : state.isFocused
                    ? '#9CA3AF' // Tailwind blue-100
                    : 'transparent',
                cursor: 'pointer',
              }),
            }}
          />
        </div>
        <div className="relative">
          <FileText className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <Select
            closeMenuOnSelect={false}
            components={animatedComponents}
            isMulti
            defaultValue={fileTypesOptions}
            options={fileTypesOptions}
            value={fileType}
            onChange={setFileType}
            placeholder={t("documents_table_filter_file_type")}
            className="w-full pl-10 border rounded-md text-sm text-gray-700"
            styles={{
              control: (base) => ({
                ...base,
                border: 'none',
                boxShadow: 'none', // also remove focus ring
              }),
              placeholder: (base) => ({
                ...base,
                color: '#9CA3AF', // Tailwind gray-400
              }),
            }}
          />
        </div>
        <div className="relative">
          <div className="relative w-full">
            <Wrench className="absolute left-3 top-2.5 w-4 h-4 text-gray-500 pointer-events-none" />
            <Select
              closeMenuOnSelect={false}
              components={animatedComponents}
              isMulti
              defaultValue={uniqueObjects}
              options={uniqueObjects}
              value={object}
              onChange={setObject}
              placeholder={t("documents_table_filter_objects")}
              className="w-full pl-10 border rounded-md text-sm text-gray-700"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  border: 'none',
                  boxShadow: 'none', // also remove focus ring
                }),
                placeholder: (base) => ({
                  ...base,
                  color: '#9CA3AF', // Tailwind gray-400
                }),
              }}
            />
          </div>
        </div>
        <div className="flex items-end gap-x-2">
          <button onClick={handleReset} className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-100">
            {t("documents_table_filter_reset_button")}
          </button>
        </div>
      </div>

      <div className="shadow-md rounded-lg mb-4">
        <div className="flex items-end justify-end gap-x-2 py-2 pr-2">
          {contacts.length !== 0 && (<button
            className="text-gray-900 px-2 py-1"
            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
          >
            {viewMode === 'table' ? <LayoutGrid className="w-8 h-8" /> : <Table className="w-8 h-8" />}
          </button>)}
          {contacts.length !== 0 && (
            selectedFiles.length !== 0 && (
              <button
                onClick={handleDownloadSelected}
                className="bg-gray-800 text-white px-4 py-2 rounded-md flex items-center font-semibold"
              >
                {t("documents_table_download_button")} <Download className="ml-2 w-5 h-5" />
              </button>
            )
          )}
        </div>

        {/* Table displaying data */}
        {viewMode === 'table' && (
          <>
            <div className="flex items-center mb-1 ml-2 text-gray-900">
              <BadgeInfo className='mr-2 w-5 h-5 text-gray-400' /> {t("documents_page_helping_text")}
            </div>
            <div className="overflow-x-auto">
              <table {...getTableProps()} className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-white">
                  {headerGroups.map(headerGroup => (
                    <tr {...headerGroup.getHeaderGroupProps()} className="divide-x divide-gray-300">
                      {headerGroup.headers.map(column => (
                        <th
                          {...column.getHeaderProps(column.getSortByToggleProps())}
                          className="px-2 py-2 text-left text-sm font-semibold text-gray-600"
                        >
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
                      <tr {...row.getRowProps()} className='cursor-pointer hover:bg-gray-200'>
                        {row.cells.map(cell => (
                          <td {...cell.getCellProps()} className="px-2 py-4 text-sm text-gray-800">
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
              <div className="flex items-center justify-between p-2">
                <span className="text-sm text-gray-700">
                  {t("documents_table_pagination_page")} {pageIndex + 1} {t("documents_table_pagination_of")} {pageOptions.length}
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
                      {t("documents_table_pagination_show")} {size}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {viewMode === 'grid' && (
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 p-8'>
            {contacts?.length > 0 ? (
              contacts.map(item => (
                <div key={item.id} className="p-2 flex flex-col border rounded-lg shadow-md">
                  {/* Show image thumbnail if it's an image, otherwise show file icon */}
                  {item.mime_type?.startsWith("image/") ? (
                    fileThumbnails[item.id] ? (
                      <img
                        src={fileThumbnails[item.id]}
                        alt={item.name}
                        className="w-48 h-40 object-cover rounded-md mx-auto"
                      />
                    ) : (
                      <Image className="w-48 h-40 text-gray-200 mx-auto" /> // 👈 fallback image icon
                    )
                  ) : (
                    <File className="w-48 h-40 text-gray-600 mx-auto" />
                  )}

                  <h4 className="text-gray-500 text-sm py-1 break-words">{item.name}</h4>
                  <p className="text-gray-500 text-sm">{new Date(item.date_add).toLocaleString()}</p>

                  {item.file_name && (
                    <label className="mt-2 flex space-x-2 items-start text-sm">
                      <input
                        type="checkbox"
                        onChange={() => toggleFileSelection(item)}
                        checked={selectedFiles.some((file) => file.id === item.id)}
                        className='mt-1'
                      />
                      <span className='text-sm'>{t("documents_table_download_checkbox")}</span>
                    </label>
                  )}

                  {item.mime_type?.startsWith("image/") ? (
                    <a
                      href={fileThumbnails[item.id] || ""}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center mt-2 text-sm hover:underline"
                    >
                      <Eye className="w-4 h-4 mr-2 text-gray-600" />
                      {t("documents_table_view_document_text")}
                    </a>
                  ) : (
                    <a
                      href={`${url}api/DbFileView/View/${item.file_name.replace(
                        /[^a-zA-Z ]/g,
                        ''
                      )}?id=${item.id}&token=${encodeURIComponent(auth.authKey)}`}
                      className="flex items-center mt-2 text-sm hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Eye className="w-4 h-4 mr-2 text-gray-600" />
                      {t("documents_table_view_document_text")}
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-600 p-4 text-center">
                {t("documents_table_no_document_available")}
              </p>
            )}

            {!fileThumbnails && (!contacts || contacts.length === 0) && (
              <p className="text-gray-600 p-4 text-center">
                {t("documents_table_no_document_available")}
              </p>
            )}
          </div>
        )}
      </div>
    </div >
  );
};

export default ViewDocuments;
