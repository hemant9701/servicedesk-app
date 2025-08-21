import axios from 'axios';
const auth = JSON.parse(sessionStorage.getItem('auth'))?.authKey;


export const fetchData = async (endpoint, method = 'GET', authKey = auth, data = null, accept= 'application/json') => {
  //const authKey = auth.authKey;
  try {
    const config = {
      url: `https://testservicedeskapi.odysseemobile.com/${endpoint}`,
      method,
      headers: {
        'Authorization': `Basic ${authKey}`,
        'Accept': accept,
      },
      data,
    };

    const response = await axios(config);
    return response.data;

  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};