import React from "react";
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from "react-i18next";

const About = () => {
  const { t } = useTranslation('support');
  const navigate = useNavigate();
  return (
    <div className="w-full mx-auto p-1 md:p-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">{t("support_page_title")}</h1>
      <div className='flex'>
        {/* Back Button */}
        <button
          onClick={() => navigate('/')} // Navigate back one step in history
          className="flex items-center mb-4 font-semibold text-gray-800"
        >
          <ArrowLeft className="mr-2 w-5 h-5" /> {t("support_page_go_back")}
        </button>
      </div>
      <p className="text-lg text-gray-600 mb-6">
        {t("support_page_content")}
      </p>

    </div>
  );
};

export default About;