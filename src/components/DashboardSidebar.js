import React, { useEffect, useState } from 'react';
import { Search, Languages, ChevronRight, ChevronLeft, House, Wrench, Ticket, Calendar, Users, Drill, MessageCircleQuestion, Folder, Settings, LogOut } from "lucide-react";
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTranslation } from "react-i18next";

export default function DashboardSidebar() {
    const { auth, logout } = useAuth();
    const [query, setQuery] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [logo, setLogo] = useState('https://fsm.wello.net/wp-content/uploads/2024/01/WELLO_LOGO_Purple.png');
    const [logo_2, setLogo_2] = useState('https://fsm.wello.net/wp-content/uploads/2023/12/cropped-WN54.png');
    const { i18n } = useTranslation();
    const userLangShort = auth?.userLang?.split('-')[0] || 'en';
    const { t } = useTranslation('dashboard');

    useEffect(() => {
        if (window.welloServiceDesk) {
            const { logo_primary, logo_secondary } = window.welloServiceDesk;
            setLogo(logo_primary);
            setLogo_2(logo_secondary);
        }
    }, []);

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const handleToggle = () => {
        if (isCollapsed) {
            setIsCollapsed(false);
        }
    };

    const languageOptions = {
        en: t('navbar_lang_en'),
        fr: t('navbar_lang_fr'),
        nl: t('navbar_lang_nl')
        // de: 'Deutsch',
        // es: 'Español',
        // pt: 'Português',
        // it: 'Italiano',
        // pl: 'Polski',
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    useEffect(() => {
        const savedLang = localStorage.getItem('i18nextLng');
        const preferredLang = userLangShort || 'en';

        if (!savedLang || savedLang !== preferredLang) {
            i18n.changeLanguage(preferredLang);
            localStorage.setItem('i18nextLng', preferredLang);
        }
    }, [i18n, userLangShort]); // Triggered once when component mounts


    const getFirstLetters = (str) => {
        let words = str.split(" ");
        return words[0][0] + words[1][0];
    };


    return (
        <div className={`flex flex-col border-r-2 border-b-2 rounded-br-2xl border-gray-200 text-[#687287] bg-white p-4 ${isCollapsed ? 'w-[5rem]' : 'w-1/4'} transition-width duration-5000`}>
            <div className="">
                <div className="flex items-center justify-center h-16 gap-2 mb-2 w-full">
                    <a href="/">
                        {!isCollapsed ? <img src={logo} alt="Logo" className="w-32" /> : <img src={logo_2} alt="Logo" className="w-12" />}
                    </a>
                </div>

                {/* Collapse Button */}
                <div className="flex justify-start items-center mb-4">
                    <button onClick={toggleCollapse} className="px-2 py-2">
                        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>
                    <p className={`text-lg ${isCollapsed ? 'hidden' : ''}`}>{t("navbar_collapse_arrow")}</p>
                </div>

                <div
                    className={`relative w-full mb-4 transition-all duration-300 ${isCollapsed ? 'px-2 py-2 border-2 rounded-lg cursor-pointer' : ''
                        }`}
                    onClick={handleToggle}
                >
                    {!isCollapsed && (
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t('navbar_search_box')}
                            className="w-full px-3 py-2 pl-10 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                    )}

                    <Search
                        className={`w-5 h-5 transition-all duration-200 ${isCollapsed ? '' : 'absolute left-3 top-2.5'}`}
                    />
                </div>

                {/* Navigation Links */}
                <Link to="/" className="flex items-center gap-2 leading-none cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg hover:bg-gray-100 focus:border-r-4 focus:border-gray-600 focus:bg-gray-200 active:text-[#1F272D] active:border-r-4 active:border-gray-600 active:bg-gray-200">
                    <House className="w-5 h-5" /> {!isCollapsed && t('navbar_home_page_link')}
                </Link>
                <Link to="/createticket" className="flex items-center gap-2 leading-none cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg hover:bg-gray-100 focus:border-r-4 focus:border-gray-600 focus:bg-gray-200 active:text-[#1F272D] active:border-r-4 active:border-gray-600 active:bg-gray-200">
                    <Wrench className="w-5 h-5" /> {!isCollapsed && t('navbar_create_ticket_link')}
                </Link>
                <Link to="/tickets" className="flex items-center gap-2 leading-none cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg hover:bg-gray-100 focus:border-r-4 focus:border-gray-600 focus:bg-gray-200 active:text-[#1F272D] active:border-r-4 active:border-gray-600 active:bg-gray-200">
                    <Ticket className="w-5 h-5" /> {!isCollapsed && t('navbar_tickets_list_link')}
                </Link>
                <Link to="/calendar" className="flex items-center gap-2 leading-none cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg hover:bg-gray-100 focus:border-r-4 focus:border-gray-600 focus:bg-gray-200 active:text-[#1F272D] active:border-r-4 active:border-gray-600 active:bg-gray-200">
                    <Calendar className="w-5 h-5" /> {!isCollapsed && t('navbar_calendar_page_link')}
                </Link>
                <Link to="/workorders" className="flex items-center gap-2 leading-none cursor-pointer w-full px-2 py-2 rounded-lg hover:bg-gray-100 focus:border-r-4 focus:border-gray-600 focus:bg-gray-200 active:text-[#1F272D] active:border-r-4 active:border-gray-600 active:bg-gray-200">
                    <Settings className="w-5 h-5" /> {!isCollapsed && t('navbar_work_order_list_link')}
                </Link>
                <div className="border-t-2 border-gray-100 my-4"></div>
                <Link to="/users" className="flex items-center gap-2 leading-none cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg hover:bg-gray-100 focus:border-r-4 focus:border-gray-600 focus:bg-gray-200 active:text-[#1F272D] active:border-r-4 active:border-gray-600 active:bg-gray-200">
                    <Users className="w-5 h-5" /> {!isCollapsed && t('navbar_users_list_link')}
                </Link>
                <Link to="/equipments" className="flex items-center gap-2 leading-none cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg hover:bg-gray-100 focus:border-r-4 focus:border-gray-600 focus:bg-gray-200 active:text-[#1F272D] active:border-r-4 active:border-gray-600 active:bg-gray-200">
                    <Drill className="w-5 h-5" /> {!isCollapsed && t('navbar_equipments_list_link')}
                </Link>
                <Link to="/documents" className="flex items-center gap-2 leading-none cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg hover:bg-gray-100 focus:border-r-4 focus:border-gray-600 focus:bg-gray-200 active:text-[#1F272D] active:border-r-4 active:border-gray-600 active:bg-gray-200">
                    <Folder className="w-5 h-5" /> {!isCollapsed && t('navbar_documents_list_link')}
                </Link>
            </div>

            <div className="mt-20 relative ">

                {/* Language Switcher */}
                {!isCollapsed ? (
                    <div className="px-2 py-2 flex items-center gap-2">

                        <Languages className="w-5 h-5" />
                        <select
                            id="language-select"
                            className="w-full focus:outline-none"
                            onChange={(e) => changeLanguage(e.target.value)}
                            value={i18n.language.split('-')[0]}
                        >
                            {Object.entries(languageOptions).map(([code, label]) => (
                                <option key={code} value={code}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div
                        className={`relative w-full mb-4 leading-none rounded-lg transition-all duration-300 hover:bg-gray-100 ${isCollapsed ? 'px-2 py-2 cursor-pointer' : ''}`}
                        onClick={handleToggle}
                    >
                        <Languages className={`w-5 h-5 transition-all duration-200 ${isCollapsed ? '' : 'absolute left-3 top-2.5'}`} />
                    </div>
                )}

                <Link to="/about" className="flex items-center gap-2 leading-none cursor-pointer w-full px-2 py-2 rounded-lg hover:bg-gray-100 focus:border-r-4 focus:border-gray-600 focus:bg-gray-200 active:border-r-4 active:border-gray-600 active:bg-gray-200">
                    <MessageCircleQuestion className="w-5 h-5" /> {!isCollapsed && t('navbar_support_page_link')}
                </Link>
                {/* Profile and Logout */}
                <div className="border-t-2 border-gray-100 my-4"></div>
                {auth && (
                    <div className="flex justify-between items-center rounded-lg gap-2 px-2 py-2">
                        {!isCollapsed && (
                            <div className="flex items-center gap-2 font-bold">
                                <span className="px-2 py-2 w-10 h-10 rounded-full text-gray-900 bg-gray-200">{getFirstLetters(auth.userName)}</span>
                                {auth.userName}
                            </div>
                        )}
                        <div className="flex flex-col text-sm cursor-pointer">
                            <button onClick={logout}>
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
