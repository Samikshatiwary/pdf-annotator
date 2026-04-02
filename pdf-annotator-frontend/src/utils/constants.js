export const APP_NAME = 'PDF Annotator';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  LIBRARY: '/library',
  PDF_VIEWER: '/pdf/:uuid',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  ACTIVITY: '/activity',
  SHARED: '/shared',
  PUBLIC: '/public',
};

export const HIGHLIGHT_COLORS = [
  '#ffff00', // Yellow
  '#dbeafe', // Blue
  '#d1fae5', // Green
  '#fee2e2', // Red
  '#e9d5ff', // Purple
];

export const FILE_SIZE_LIMIT = 50000000; // 50MB

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
};

export const SORT_OPTIONS = [
  { value: 'date', label: 'Date Created' },
  { value: 'name', label: 'Name' },
  { value: 'size', label: 'File Size' },
];

export const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
};