export const getTokens = () => {
  return {
    token: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refreshToken'),
  };
};

export const setTokens = (token, refreshToken) => {
  localStorage.setItem('token', token);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

export const clearTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

export const getUserFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (error) {
    return null;
  }
};