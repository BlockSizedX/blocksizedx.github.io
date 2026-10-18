/*
 * Site configuration. Loaded before every other script.
 *
 * Everything here is PUBLIC (it ships to the browser). Never put a Supabase
 * secret key or service_role key in this file.
 *
 * supabaseUrl : Supabase dashboard > Project Settings > API > Project URL
 *               (looks like https://abcdefghijkl.supabase.co)
 * supabaseKey : Supabase dashboard > Project Settings > API Keys > Publishable key
 *               (starts with sb_publishable_). It is designed for browsers.
 *               The legacy "anon" key also works here.
 * whatsappNumber : international format, digits only. Used by the footer,
 *               the Get a Website flow and account-deletion requests.
 */
window.BSX_CONFIG = {
  supabaseUrl: 'https://ydiulkcltulfnivtqyoj.supabase.co',
  supabaseKey: 'sb_publishable_Kb_aXZXjJfAja17TOc8tUA_5tgCBlcb',
  whatsappNumber: '916238402221'
};
