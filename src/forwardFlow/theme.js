// Forward Flow — shared theme constants + slot color map.

export const T = {
  page: '#ffffff', card: '#e8e8ea', border: '#c4c4c6',
  text: '#1a1a1a', textDim: '#777', textSub: '#444', label: '#666',
  green: '#1a5a1a', greenBg: '#d8eed8', greenBord: '#90c090',
  red: '#7a1a1a', redBg: '#f0d8d8', redBord: '#d09090',
  amber: '#7a4000', amberBg: '#fde8c8', amberBord: '#d8a050',
  blue: '#004a7a', blueBg: '#d8eef8', blueBord: '#7ab0d0',
  violet: '#5a1a7a', violetBg: '#e8d8f0', violetBord: '#a878c0',
}

export const SLOT_COLORS = {
  S: { bg: T.blueBg,    border: T.blueBord,    fg: T.blue   },
  V: { bg: T.amberBg,   border: T.amberBord,   fg: T.amber  },
  O: { bg: T.greenBg,   border: T.greenBord,   fg: T.green  },
  C: { bg: T.violetBg,  border: T.violetBord,  fg: T.violet },
  A: { bg: T.redBg,     border: T.redBord,     fg: T.red    },
}

export function matchesSearch(item, query, fields) {
  const q = (query ?? '').toLowerCase().trim()
  if (!q) return true
  for (const f of fields) {
    const v = item[f]
    if (typeof v === 'string' && v.toLowerCase().includes(q)) return true
  }
  return false
}
