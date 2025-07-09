import React, { useState, useEffect } from 'react';
import { BadgePlus, Ticket, CalendarDays, Workflow } from "lucide-react";
import { Link } from 'react-router-dom';
import { fetchData } from '../services/apiService.js';
import { useAuth } from '../AuthContext';
import { useTranslation } from "react-i18next";

const Home = () => {
  const [contactCount, setContactCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [banner_img, setBanner_img] = useState('https://fsm.wello.net/wp-content/uploads/2025/05/image-scaled.png');
  const { auth } = useAuth();
  const { t } = useTranslation('home');

  useEffect(() => {
          if (window.welloServiceDesk) {
              const { background_image } = window.welloServiceDesk;
              setBanner_img(background_image);
          }
  }, []);

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
    return <div className="flex items-center justify-center w-full h-screen bg-gray-100">
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
    <div className="min-h-screen w-full">
      <div className="relative w-full">
        <img src={banner_img} alt="Banner" className="w-full" />
      </div>
      <main className="relative mx-32 mt-8 p-8">
        <div className="grid md:grid-cols-2 gap-6">
          <Link to="/create" className="block">
            <div className="bg-transparent border border-gray-800 text-gray-800 p-6 rounded-2xl shadow transition-colors relative">
              <div className="flex items-center space-x-2">
                <BadgePlus className="w-12 h-12" />
                <span className="text-3xl font-bold ps-6">{t("home_page_create_ticket_button")}</span>
              </div>
            </div>
          </Link>
          <Link to="/tickets" className="block">
            <div className="bg-transparent border border-gray-800 text-gray-800 p-6 rounded-2xl shadow transition-colors relative">
              <div className="flex items-center space-x-2">
                <Ticket className="w-12 h-12" />
                <span className="text-3xl font-bold ps-6">{t("home_page_view_ticket_button")}</span>
              </div>
              <span className="absolute top-2 right-2 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                {contactCount}
              </span>
            </div>
          </Link>
          <Link to="/calendar" className="block">
            <div className="bg-transparent border border-gray-800 text-gray-800 p-6 rounded-2xl shadow transition-colors relative">
              <div className="flex items-center space-x-2">
                <CalendarDays className="w-12 h-12" />
                <span className="text-3xl font-bold ps-6">{t("home_page_calendar_button")}</span>
              </div>
            </div>
          </Link>
          <Link to="/workorders" className="block">
            <div className="bg-transparent border border-gray-800 text-gray-800 p-6 rounded-2xl shadow transition-colors relative">
              <div className="flex items-center space-x-2">
                <Workflow className="w-12 h-12" />
                <span className="text-3xl font-bold ps-6">{t("home_page_work_order_button")}</span>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
};

export default Home;