const KASHRUT = ['בד"ץ', 'רובין', 'שארית ישראל', 'מחפוד', 'בית יוסף'];

function createSeed() {
  const inventory = {};
  KASHRUT.forEach(k => { inventory[k] = 0; });
  return {
    version: 1,
    kashrut: [...KASHRUT],
    types: [
      { id: 'cook', name: 'בישול ארוחות', active: true, system: false, byHours: false, note: 'דורש כמות נפשות ותדירות' },
      { id: 'babysit', name: 'שמירה על ילדים', active: true, system: false, byHours: true, note: 'דורש שעות וימים' },
      { id: 'deliver', name: 'שינוע ארוחות', active: true, system: false, byHours: false, note: 'הסעת ארוחות מוכנות' },
      { id: 'other', name: 'אחר', active: true, system: true, note: 'טקסט חופשי — גמישות' },
    ],
    tzaharon: { inventory, lastUpdated: null, log: [] },
    volunteers: [],
    requests: [],
    reqSeq: 200,
    volSeq: 100,
  };
}

module.exports = { createSeed };
