// pages/About.js
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
  <div className="max-w-lg w-full space-y-8 text-center">
    <div>
      <h1 className="text-9xl font-extrabold text-gray-800">404</h1>
      <p className="text-4xl font-bold text-gray-700 mt-4">Page Not Found</p>
      <p className="text-lg text-gray-600 mt-6">Sorry, we couldn't find the page you're looking for.</p>
    </div>
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
      <Link to="/"
        className="mb-6 bg-white text-gray-700 border border-gray-700 px-4 py-1 rounded-md"
      >
        Go Home
      </Link>
    </div>
  </div>
</div>
};

export default NotFound;
