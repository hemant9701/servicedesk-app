import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Navigation Bar
import dashboard_en from './locales/en/dashboard.json';
import dashboard_fr from './locales/fr/dashboard.json';
import dashboard_nl from './locales/nl/dashboard.json';

// Home Page JSON
import home_en from './locales/en/home.json';
import home_fr from './locales/fr/home.json';
import home_nl from './locales/nl/home.json';

// Ticket List Page JSON
import ticketList_en from './locales/en/ticketList.json';
import ticketList_fr from './locales/fr/ticketList.json';
import ticketList_nl from './locales/nl/ticketList.json';

// Work Order List Page JSON
import workOrderList_en from './locales/en/workOrderList.json';
import workOrderList_fr from './locales/fr/workOrderList.json';
import workOrderList_nl from './locales/nl/workOrderList.json';

// Work Order List Page JSON
import equipmentList_en from './locales/en/equipmentList.json';
import equipmentList_fr from './locales/fr/equipmentList.json';
import equipmentList_nl from './locales/nl/equipmentList.json';

// Users JSON
import users_en from './locales/en/users.json';
import users_fr from './locales/fr/users.json';
import users_nl from './locales/nl/users.json';

const dynamicLang = (window?.welloServiceDesk?.language);

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        home: home_en,
        dashboard: dashboard_en,
        ticketList: ticketList_en,
        workOrderList: workOrderList_en,
        equipmentList: equipmentList_en,
        users: users_en
      },
      fr: {
        home: home_fr,
        dashboard: dashboard_fr,
        ticketList: ticketList_fr,
        workOrderList: workOrderList_fr,
        equipmentList: equipmentList_fr,
        users: users_fr
      },
      nl: {
        home: home_nl,
        dashboard: dashboard_nl,
        ticketList: ticketList_nl,
        workOrderList: workOrderList_nl,
        equipmentList: equipmentList_nl,
        users: users_nl
      },
    },
    lng: dynamicLang,
    fallbackLng: 'en',
    ns: ['home', 'dashboard', 'users', 'ticketList', 'workOrderList', 'equipmentList'],
    defaultNS: 'home',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;