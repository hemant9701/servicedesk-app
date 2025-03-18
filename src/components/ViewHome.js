import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchData } from '../services/apiService.js';
import { useAuth } from '../AuthContext';

const Home = () => {
  const [contactCount, setContactCount] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { auth } = useAuth();

  useEffect(() => {
    const fetchContactCount = async () => {
      try {
        const response = await fetchData('https://v1servicedeskapi.wello.solutions/api/TaskView/CountOpen', 'GET', auth.authKey);
        setContactCount(response); // Sets the count from the API response
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchContactCount();
  }, [auth]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gray-100">
    <div className="relative">
      <div className="w-20 h-20 border-purple-200 border-2 rounded-full"></div>
      <div className="w-20 h-20 border-purple-700 border-t-2 animate-spin rounded-full absolute left-0 top-0"></div>
    </div>
  </div>;
  }

  if (error) {
    return <div>Error fetching contact count: {error.message}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="relative w-full">
        <img src="https://servicedesk.wello.solutions/images/sd_default_banner.png" alt="Banner" className="w-full" /> 
      </div>
      <main className="container relative mx-auto px-8 py-8 bg-gray-100">
        <div className="grid md:grid-cols-4 gap-6">
          <div className="md:col-span-3 grid sm:grid-cols-2 gap-6">
            <Link to="/create" className="block">
              <div className="bg-teal-800 text-white p-6 rounded-lg shadow hover:bg-teal-700 transition-colors relative">
                <div className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xl">Create</span>
                </div>
              </div>
            </Link>
            <Link to="/tickets" className="block">
              <div className="bg-green-700 text-white p-6 rounded-lg shadow hover:bg-green-600 transition-colors relative">
                <div className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  <span className="text-xl">Tickets</span>
                </div>
                <span className="absolute top-2 right-2 bg-white text-green-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  {contactCount}
                </span>
              </div>
            </Link>
            <Link to="/calendar" className="block">
              <div className="bg-orange-600 text-white p-6 rounded-lg shadow hover:bg-orange-500 transition-colors relative">
                <div className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xl">Calendar</span>
                </div>
              </div>
            </Link>
            <Link to="/workorders" className="block">
              <div className="bg-orange-500 text-white p-6 rounded-lg shadow hover:bg-orange-400 transition-colors relative">
                <div className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xl">Work Order</span>
                </div>
              </div>
            </Link>
          </div>

          <div className="space-y-6">
            <section>
              <h2 className="text-gray-600 mb-2 uppercase text-sm font-semibold">USERS</h2>
              <Link to="/users" className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>List of users</span>
              </Link>
            </section>

            <section>
              <h2 className="text-gray-600 mb-2 uppercase text-sm font-semibold">INSTALLATIONS</h2>
              <Link to="/installations" className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>List of equipments</span>
              </Link>
            </section>

            <section>
              <h2 className="text-gray-600 mb-2 uppercase text-sm font-semibold">DOCUMENTS</h2>
              <Link to="/documents" className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>All files related to you</span>
              </Link>
            </section>

            <section>
              <h2 className="text-gray-600 mb-2 uppercase text-sm font-semibold">ABOUT</h2>
              <Link to="/about" className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Support info</span>
              </Link>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
};

export default Home;