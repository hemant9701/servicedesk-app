import axios from 'axios';
const auth = JSON.parse(sessionStorage.getItem('auth'));

export const fetchData = async (endpoint, method = 'GET', data = null) => {
  const authKey = auth.authKey;
  try {
    const config = {
      url: endpoint,
      method,
      headers: {
        'Authorization': `Basic ${authKey}`,
        'Accept': 'application/json',
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