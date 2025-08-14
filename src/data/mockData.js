// src/data/mockData.js

export const gradesData = [
  { 
    id: '1', 
    name: 'أول متوسط', 
    sections: Array.from({ length: 10 }, (_, i) => i + 1),
    students: 150,
  },
  { 
    id: '2', 
    name: 'ثاني متوسط', 
    sections: Array.from({ length: 10 }, (_, i) => i + 1),
    students: 120,
  },
  { 
    id: '3', 
    name: 'ثالث متوسط', 
    sections: Array.from({ length: 10 }, (_, i) => i + 1),
    students: 100,
  },
];