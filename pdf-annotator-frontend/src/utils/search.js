export const highlightSearchTerm = (text, searchTerm) => {
  if (!searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

export const filterPDFs = (pdfs, filters) => {
  let filtered = [...pdfs];

  if (filters.search) {
    filtered = filtered.filter(pdf =>
      pdf.displayName.toLowerCase().includes(filters.search.toLowerCase())
    );
  }

  if (filters.isFavorite) {
    filtered = filtered.filter(pdf => pdf.isFavorite);
  }

  if (filters.isArchived) {
    filtered = filtered.filter(pdf => pdf.isArchived);
  }

  return filtered;
};

export const sortPDFs = (pdfs, sortBy) => {
  const sorted = [...pdfs];

  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
    case 'date':
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    case 'size':
      return sorted.sort((a, b) => b.fileSize - a.fileSize);
    default:
      return sorted;
  }
};