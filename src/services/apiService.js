import axios from 'axios';
const auth = JSON.parse(sessionStorage.getItem('auth'))?.authKey;
const WELLO_API_URL = 'https://testservicedeskapi.odysseemobile.com';


export const fetchData = async (endpoint, method = 'GET', authKey = auth, data = null, accept= 'application/json') => {
  //const authKey = auth.authKey;
  try {
    if (!WELLO_API_URL) {
      throw new Error("WELLO_API_URL is not defined in environment variables.");
    }
    if (!authKey) {
      throw new Error("Authorization key is missing.");
    }
    const config = {
      url: `${WELLO_API_URL}/${endpoint}`,
      method,
      headers: {
        'Authorization': `Basic ${authKey}`,
        'Accept': accept,
      },
      ...(method !== 'GET' && { data }),
    };

    const response = await axios(config);
    return response.data;

  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};