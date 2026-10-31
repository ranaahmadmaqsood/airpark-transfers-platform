const { AIRPORTS } = require('../server/data/airports');
const { supabase } = require('../server/supabase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { data, error } = await supabase.from('airports').select('*');
    if (!error && data && data.length > 0) {
      return res.status(200).json({ airports: data });
    }
  } catch (e) {
    console.error('Supabase fetch failed, falling back to static data', e);
  }

  return res.status(200).json({ airports: AIRPORTS });
};
