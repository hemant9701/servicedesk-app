import React, { useEffect, useState } from 'react';
import { Menu, X, Search, Languages, ChevronRight, ChevronLeft, House, Wrench, Ticket, Calendar, Users, Drill, MessageCircleQuestion, Folder, Settings, LogOut } from "lucide-react";
import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTranslation } from "react-i18next";

export default function DashboardSidebar() {
    const { auth, logout } = useAuth();
    const [query, setQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isMobile = window.innerWidth < 768;
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
        <>
            <button
                className="md:hidden fixed top-2 right-2 z-10 p-2 bg-white shadow rounded-lg"
                onClick={() => setIsMobileMenuOpen(true)}
            >
                <Menu size={24} />
            </button>
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-30 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}
            <div
                className={`
                    fixed md:static top-0 left-0 h-full z-40
                    transform transition-transform duration-300
                    ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                    
                    md:sticky md:top-0 min-h-screen flex flex-col justify-between 
                    outline outline-1 outline-offset-[-1px] outline-gray-300 overflow-y-auto
                    rounded-br-2xl rounded-tr-2xl text-slate-500 bg-white p-4
                    ${isCollapsed ? "w-[5rem]" : "w-[80%] md:w-1/4"}
                `}
            >
                {isMobile && (
                    <button
                        className="md:hidden absolute right-1 top-1 p-1 bg-gray-100 rounded-full"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <X size={20} />
                    </button>
                )}

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
                        <p className={`text-base ${isCollapsed ? 'hidden' : ''}`}>{t("navbar_collapse_arrow")}</p>
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
                                className="w-full px-3 py-2 pl-10 text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:text-slate-500"
                            />
                        )}

                        <Search
                            className={`w-5 h-5 transition-all duration-200 ${isCollapsed ? '' : 'absolute left-3 top-2.5'}`}
                        />
                    </div>

                    {/* Navigation Links */}
                    <NavLink
                        to="/"
                        end // ensures exact match for root path
                        className={({ isActive }) =>
                            [
                                'flex items-center gap-2 leading-none cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg',
                                'hover:bg-gray-200 focus:border-r-4 focus:border-gray-600 focus:bg-gray-200',
                                isActive
                                    ? 'text-zinc-800 border-r-4 border-gray-600 bg-gray-200'
                                    : 'text-zinc-500'
                            ].join(' ')
                        }
                    >
                        <House className="w-5 h-5" />
                        {!isCollapsed && t('navbar_home_page_link')}
                    </NavLink>

                    <NavLink to="/createticket"
                        end // ensures exact match for root path
                        className={({ isActive }) =>
                            [
                                'flex items-center gap-2 leading-none cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg',
                                'hover:bg-gray-200 focus:border-r-4 focus:border-zinc-800 focus:bg-gray-200',
                                isActive
                                    ? 'text-zinc-800 border-r-4 border-gray-600 bg-gray-200'
                                    : 'text-zinc-500'
                            ].join(' ')
                        }
                    >
                        <Wrench className="w-5 h-5" /> {!isCollapsed && t('navbar_create_ticket_link')}
                    </NavLink>
                    <NavLink to="/tickets"
                        end // ensures exact match for root path
                        className={({ isActive }) =>
                            [
                                'flex items-center gap-2 leading-none cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg',
                                'hover:bg-gray-200 focus:border-r-4 focus:border-zinc-800 focus:bg-gray-200',
                                isActive
                                    ? 'text-zinc-800 border-r-4 border-gray-600 bg-gray-200'
                                    : 'text-zinc-500'
                            ].join(' ')
                        }
                    >
                        <Ticket className="w-5 h-5" /> {!isCollapsed && t('navbar_tickets_list_link')}
                    </NavLink>
                    <NavLink to="/calendar"
                        end // ensures exact match for root path
                        className={({ isActive }) =>
                            [
                                'flex items-center gap-2 leading-none cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg',
                                'hover:bg-gray-200 focus:border-r-4 focus:border-zinc-800 focus:bg-gray-200',
                                isActive
                                    ? 'text-zinc-800 border-r-4 border-gray-600 bg-gray-200'
                                    : 'text-zinc-500'
                            ].join(' ')
                        }
                    >
                        <Calendar className="w-5 h-5" /> {!isCollapsed && t('navbar_calendar_page_link')}
                    </NavLink>
                    <NavLink to="/workorders"
                        end // ensures exact match for root path
                        className={({ isActive }) =>
                            [
                                'flex items-center gap-2 leading-none cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg',
                                'hover:bg-gray-200 focus:border-r-4 focus:border-zinc-800 focus:bg-gray-200',
                                isActive
                                    ? 'text-zinc-800 border-r-4 border-gray-600 bg-gray-200'
                                    : 'text-zinc-500'
                            ].join(' ')
                        }
                    >
                        <Settings className="w-5 h-5" /> {!isCollapsed && t('navbar_work_order_list_link')}
                    </NavLink>
                    <div className="border-t-2 border-gray-100 my-4"></div>
                    <NavLink to="/users"
                        end // ensures exact match for root path
                        className={({ isActive }) =>
                            [
                                'flex items-center gap-2 leading-none cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg',
                                'hover:bg-gray-200 focus:border-r-4 focus:border-zinc-800 focus:bg-gray-200',
                                isActive
                                    ? 'text-zinc-800 border-r-4 border-gray-600 bg-gray-200'
                                    : 'text-zinc-500'
                            ].join(' ')
                        }
                    >
                        <Users className="w-5 h-5" /> {!isCollapsed && t('navbar_users_list_link')}
                    </NavLink>
                    <NavLink to="/equipments"
                        end // ensures exact match for root path
                        className={({ isActive }) =>
                            [
                                'flex items-center gap-2 leading-none cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg',
                                'hover:bg-gray-200 focus:border-r-4 focus:border-zinc-800 focus:bg-gray-200',
                                isActive
                                    ? 'text-zinc-800 border-r-4 border-gray-600 bg-gray-200'
                                    : 'text-zinc-500'
                            ].join(' ')
                        }
                    >
                        <Drill className="w-5 h-5" /> {!isCollapsed && t('navbar_equipments_list_link')}
                    </NavLink>
                    <NavLink to="/documents"
                        end // ensures exact match for root path
                        className={({ isActive }) =>
                            [
                                'flex items-center gap-2 leading-none cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg',
                                'hover:bg-gray-200 focus:border-r-4 focus:border-zinc-800 focus:bg-gray-200',
                                isActive
                                    ? 'text-zinc-800 border-r-4 border-gray-600 bg-gray-200'
                                    : 'text-zinc-500'
                            ].join(' ')
                        }
                    >
                        <Folder className="w-5 h-5" /> {!isCollapsed && t('navbar_documents_list_link')}
                    </NavLink>
                </div>

                <div className="mt-5 relative ">

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
                            className={`relative w-full mb-4 leading-none rounded-lg transition-all duration-300 hover:bg-gray-200 ${isCollapsed ? 'px-2 py-2 cursor-pointer' : ''}`}
                            onClick={handleToggle}
                        >
                            <Languages className={`w-5 h-5 transition-all duration-200 ${isCollapsed ? '' : 'absolute left-3 top-2.5'}`} />
                        </div>
                    )}

                    <NavLink to="/about"
                        end // ensures exact match for root path
                        className={({ isActive }) =>
                            [
                                'flex items-center gap-2 leading-none cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg',
                                'hover:bg-gray-200 focus:border-r-4 focus:border-zinc-800 focus:bg-gray-200',
                                isActive
                                    ? 'text-zinc-800 border-r-4 border-gray-600 bg-gray-200'
                                    : 'text-zinc-500'
                            ].join(' ')
                        }
                    >
                        <MessageCircleQuestion className="w-5 h-5" /> {!isCollapsed && t('navbar_support_page_link')}
                    </NavLink>
                    {/* Profile and Logout */}
                    <div className="border-t-2 border-gray-100 my-4"></div>
                    {auth && (
                        <div className="flex justify-between items-center rounded-lg gap-2 px-2 py-2">
                            {!isCollapsed && (
                                <div className="flex items-center gap-2 font-semibold">
                                    <span className="px-2 py-2 w-10 h-10 rounded-full text-zinc-800 bg-gray-200">{getFirstLetters(auth.userName)}</span>
                                    <span className="text-zinc-800">{auth.userName}</span>
                                </div>
                            )}
                            <div className="flex flex-col text-base cursor-pointer">
                                <button onClick={logout}>
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}
