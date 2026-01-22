import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabaseConfig";

const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;

function supabaseHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_REST_URL}${path}`, {
    ...options,
    headers: {
      ...supabaseHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Supabase request failed");
  }

  return response.status === 204 ? null : response.json();
}

/**
 * Get all users from Supabase
 */
export async function getAllUsers() {
  return supabaseRequest("/users?select=*");
}

/**
 * Add new user to Supabase
 */
export async function addUser(user) {
  const payload = {
    id: user.id,
    email: user.email,
    password: user.pass,
    name: user.name,
    phone: user.phone,
    role: user.role,
    created_at: user.createdAt,
  };

  const created = await supabaseRequest("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return Boolean(created?.length);
}

/**
 * Check if user with email exists
 */
export async function userExists(email) {
  const users = await supabaseRequest(
    `/users?select=email&email=eq.${encodeURIComponent(email)}`
  );
  return users.length > 0;
}

/**
 * Get user by email and password
 */
export async function getUserByEmailAndPassword(email, password) {
  const users = await supabaseRequest(
    `/users?select=*&email=eq.${encodeURIComponent(email)}&password=eq.${encodeURIComponent(
      password
    )}`
  );
  return users[0] || null;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email) {
  const users = await supabaseRequest(
    `/users?select=*&email=eq.${encodeURIComponent(email)}`
  );
  return users[0] || null;
}

// ============ ATTENDANCE TRACKING ============

/**
 * Record attendance (check-in or check-out) to Supabase
 */
export async function recordAttendance(attendanceRecord) {
  const payload = {
    id: attendanceRecord.id,
    user_name: attendanceRecord.userName,
    type: attendanceRecord.type,
    time: attendanceRecord.time,
    address: attendanceRecord.address,
    lat: attendanceRecord.lat,
    lng: attendanceRecord.lng,
    device: attendanceRecord.device,
  };

  const created = await supabaseRequest("/attendance", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return Boolean(created?.length);
}

/**
 * Get all attendance records for a user from Supabase
 */
export async function getUserAttendanceRecords(userName) {
  return supabaseRequest(
    `/attendance?select=*&user_name=eq.${encodeURIComponent(
      userName
    )}&order=time.desc`
  );
}
