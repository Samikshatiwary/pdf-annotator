export const createHighlightData = (selection, pageNumber, color = '#ffff00') => {
  return {
    pageNumber,
    highlightedText: selection.text,
    position: {
      x: selection.x,
      y: selection.y,
      width: selection.width,
      height: selection.height,
    },
    boundingBox: {
      x1: selection.x1,
      y1: selection.y1,
      x2: selection.x2,
      y2: selection.y2,
    },
    color,
    opacity: 0.3,
    type: 'highlight',
  };
};

export const highlightColors = [
  { name: 'Yellow', value: '#ffff00', class: 'bg-annotation-yellow' },
  { name: 'Blue', value: '#dbeafe', class: 'bg-annotation-blue' },
  { name: 'Green', value: '#d1fae5', class: 'bg-annotation-green' },
  { name: 'Red', value: '#fee2e2', class: 'bg-annotation-red' },
  { name: 'Purple', value: '#e9d5ff', class: 'bg-annotation-purple' },
];

export const getColorClass = (color) => {
  const found = highlightColors.find(c => c.value === color);
  return found ? found.class : 'bg-annotation-yellow';
};