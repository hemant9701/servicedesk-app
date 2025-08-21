import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
//import { Link } from 'react-router-dom';
import { LogIn, Eye, EyeOff, Languages } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import en from '../locales/en/login.json';
import fr from '../locales/fr/login.json';
import nl from '../locales/nl/login.json';

const Login = () => {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('Ez5IDzie+E+CLFBR3A40g2ktg97czumlArA+gnrQJKyP4JYfct6q3oBltWdW4YFP8lePTkPURYdSmioIShjEuwWcEcCWkh7UDHf+2F9J6LWkGbgbrJbFJGQRoFqJCwhX+UYAh7D0ukj6FAqWn9AX/uXoiRwQmI8XQKUiUfjJvkuCbKSMLUydLtdQPimZdwSdPmqwd/oJTlPMAcb3ndTW5g==')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en'); // Selected in <select>
  const navigate = useNavigate();
  const { login } = useAuth();
  const [logo, setLogo] = useState('https://fsm.wello.net/wp-content/uploads/2024/01/WELLO_LOGO_Purple.png');

  useEffect(() => {
    if (window.welloServiceDesk) {
      const { logo_primary, token } = window.welloServiceDesk;
      setLogo(logo_primary);
      //setDomain(token);
      setToken(token)
    }
  }, []);

  // Available languages
  const languages = useMemo(() => ({
    en,
    fr,
    nl,
  }), []);

  // State setup
  const [language, setLanguage] = useState('en');
  const [translations, setTranslations] = useState(en);

  // On first load, load language from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('lang') || 'en';
    setLanguage(savedLang);
    setSelectedLang(savedLang);
    setTranslations(languages[savedLang]);
  }, [languages]);

  // When language changes, update localStorage and translations
  useEffect(() => {
    localStorage.setItem('lang', language);
    setTranslations(languages[language]);
  }, [languages, language]);

  // Translation function
  const t = (key) => translations?.[key] || en[key] || key;

  // Language label map (static)
  const languageOptions = {
    en: t('login_lang_en') || 'English',
    fr: t('login_lang_fr') || 'Français',
    nl: t('login_lang_nl') || 'Nederlands'
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    try {
      const userData = await login(token, email, password);
      //console.log("Login successful:", userData);
      if (userData) {
        navigate("/");
      }
    } catch (err) {
      toast.error(err.message || "Login failed!");
      setEmail('');
      setPassword('');
    }
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col justify-center px-4 sm:px-6 lg:px-8">
      <ToastContainer
        position="bottom-center"
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
      <div className="w-full max-w-sm mx-auto">
        <div className="bg-white p-4 shadow sm:rounded-lg">
          <div className="flex justify-center mb-4 border border-1 border-gray-300 rounded-lg">
            <img src={logo} alt="Logo" className="w-40" />
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login_form_email')}
              />
            </div>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                required
                className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login_form_password')}
              />
              <button
                type="button"
                onClick={() => setVisible(!visible)}
                className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 focus:outline-none"
              >
                {visible ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  {t("login_remenber_me")}
                </label>
              </div>

              {/* <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot your password?
                </Link>
              </div> */}
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {t("login_form_button")} <LogIn className='w-4 h-4 ms-1' />
              </button>
            </div>
          </form>
        </div>

        <div className="flex justify-center items-center space-x-3 mt-8">
          <div className="flex space-x-2 text-gray-600">
            <Languages size={20} />
          </div>

          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
          >
            {Object.entries(languageOptions).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>

          <button onClick={() => setLanguage(selectedLang)}>
            {t("login_lang_change") || "Change"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login;