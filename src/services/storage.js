const DB_KEYS = {
  ATT: "tronxlabs_attendance_v5",
  SESS: "tronxlabs_session_v5",
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`loadJSON failed for key="${key}"`, e);
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`saveJSON failed for key="${key}"`, e);
  }
}

/**
 * User management is handled by Supabase via supabaseService.js (or supabase.js).
 * These local helpers are deprecated and kept only to avoid breaking old imports.
 */
export function getUsers() {
  console.warn("getUsers() is deprecated. Use supabaseService.getAllUsers().");
  return [];
}

export function setUsers(_users) {
  console.warn("setUsers() is deprecated. Use supabaseService.addUser().");
  // intentionally no-op
}

// Local attendance storage (for offline capability)
export function getAttendance() {
  return loadJSON(DB_KEYS.ATT, []);
}

export function setAttendance(rows) {
  if (!Array.isArray(rows)) {
    console.warn("setAttendance(rows) expects an array. Got:", rows);
    return;
  }
  saveJSON(DB_KEYS.ATT, rows);
}

// Session management
export function getSession() {
  return loadJSON(DB_KEYS.SESS, { type: null, userId: null });
}

export function setSession(sess) {
  if (!sess || typeof sess !== "object") {
    console.warn("setSession(sess) expects an object. Got:", sess);
    return;
  }
  saveJSON(DB_KEYS.SESS, sess);
}

export function resetDemo() {
  localStorage.removeItem(DB_KEYS.ATT);
  localStorage.removeItem(DB_KEYS.SESS);
}
