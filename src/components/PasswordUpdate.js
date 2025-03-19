// src/pages/PasswordUpdate.js
import React, { useState } from 'react';
import { fetchData } from '../services/apiService';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const PasswordUpdate = () => {
  const navigate = useNavigate();
  const { auth } = useAuth(); // Access the user's current auth info
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: Ensure new passwords match
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    // Ensure that required fields are filled
    if (!auth || !auth.email) {
      setError('Authentication details missing. Please log in again.');
      return;
    }

    try {
      // Build the endpoint dynamically
      const endpoint = `https://v1servicedeskapi.wello.solutions/api/Contact/UpdateAccount?e_login=${auth.authEmail}&new_e_password=${newPassword}`;

      // Call fetchData with the endpoint, using 'PUT' as the method
      await fetchData(endpoint, 'PUT', auth.authKey, { currentPassword, newPassword });

      // On success, display a success message and clear the form
      setSuccessMessage('Password updated successfully!');
      setError(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setError('Failed to update password. Please try again.');
      setSuccessMessage(null);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Update Password</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
          <input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
            className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-indigo-700 transition duration-200"
        >
          Update Password
        </button>
        <button
            onClick={() => navigate(-1)} // Navigate back one step in history
            className="w-full bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600"
          >
          Back
        </button>
      </form>

      {successMessage && <p className="mt-4 text-green-600 text-sm text-center">{successMessage}</p>}
      {error && <p className="mt-4 text-red-600 text-sm text-center">{error}</p>}
    </div>
  );
};

export default PasswordUpdate;