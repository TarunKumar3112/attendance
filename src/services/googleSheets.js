import axios from "axios";

/**
 * Google Sheets API Integration
 * Uses Google Apps Script to read/write user data
 * Falls back to localStorage if Google Sheets is unavailable
 */

// Get from environment variables
const GOOGLE_SHEETS_API_URL = import.meta.env.VITE_GOOGLE_SHEETS_API_URL;
const USE_LOCAL_STORAGE = !GOOGLE_SHEETS_API_URL;

// Local storage key for users
const LOCAL_USERS_KEY = "tronxlabs_users_local";

if (!GOOGLE_SHEETS_API_URL) {
  console.warn(
    "⚠️ VITE_GOOGLE_SHEETS_API_URL not configured. Using localStorage for demo."
  );
}

/**
 * Get all users (from Google Sheets or localStorage)
 */
export async function getAllUsers() {
  try {
    if (USE_LOCAL_STORAGE) {
      return getLocalUsers();
    }
    
    const response = await axios.post(GOOGLE_SHEETS_API_URL, {
      action: "getUsers",
    });
    return response.data.users || [];
  } catch (error) {
    console.warn(
      "Google Sheets unavailable, falling back to localStorage:",
      error.message
    );
    return getLocalUsers();
  }
}

/**
 * Add new user (to Google Sheets or localStorage)
 */
export async function addUser(user) {
  try {
    if (USE_LOCAL_STORAGE) {
      return addLocalUser(user);
    }
    
    const response = await axios.post(GOOGLE_SHEETS_API_URL, {
      action: "addUser",
      user: {
        email: user.email,
        password: user.pass,
        name: user.name,
        phone: user.phone,
        role: user.role,
        createdAt: new Date().toISOString(),
      },
    });
    return response.data.success;
  } catch (error) {
    console.warn("Google Sheets unavailable, saving to localStorage");
    return addLocalUser(user);
  }
}

/**
 * Check if user with email exists
 */
export async function userExists(email) {
  try {
    const users = await getAllUsers();
    return users.some((u) => u.email?.toLowerCase() === email.toLowerCase());
  } catch (error) {
    console.error("Error checking if user exists:", error);
    throw error;
  }
}

/**
 * Get user by email and password
 */
export async function getUserByEmailAndPassword(email, password) {
  try {
    const users = await getAllUsers();
    return users.find(
      (u) =>
        u.email?.toLowerCase() === email.toLowerCase() && u.password === password
    );
  } catch (error) {
    console.error("Error finding user:", error);
    throw error;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email) {
  try {
    const users = await getAllUsers();
    return users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  } catch (error) {
    console.error("Error finding user:", error);
    throw error;
  }
}

// ============ LOCAL STORAGE FUNCTIONS ============

function getLocalUsers() {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addLocalUser(user) {
  try {
    const users = getLocalUsers();
    
    // Check if email exists
    if (users.some((u) => u.email?.toLowerCase() === user.email.toLowerCase())) {
      throw new Error("Email already exists");
    }

    users.push({
      email: user.email,
      password: user.pass,
      name: user.name,
      phone: user.phone,
      role: user.role,
      createdAt: new Date().toISOString(),
    });

    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    return true;
  } catch (error) {
    throw new Error(error.message || "Failed to create user");
  }
}

// ============ ATTENDANCE TRACKING ============

const LOCAL_ATTENDANCE_KEY = "tronxlabs_attendance_local";

/**
 * Record attendance (check-in or check-out)
 */
export async function recordAttendance(attendanceRecord) {
  try {
    if (USE_LOCAL_STORAGE) {
      return recordLocalAttendance(attendanceRecord);
    }

    const response = await axios.post(GOOGLE_SHEETS_API_URL, {
      action: "addAttendance",
      attendance: attendanceRecord,
    });
    return response.data.success;
  } catch (error) {
    console.warn("Google Sheets unavailable, saving to localStorage");
    return recordLocalAttendance(attendanceRecord);
  }
}

/**
 * Get all attendance records for a user
 */
export async function getUserAttendanceRecords(userName) {
  try {
    if (USE_LOCAL_STORAGE) {
      return getLocalAttendanceRecords(userName);
    }

    const response = await axios.post(GOOGLE_SHEETS_API_URL, {
      action: "getUserAttendance",
      userName,
    });
    return response.data.records || [];
  } catch (error) {
    console.warn("Google Sheets unavailable, reading from localStorage");
    return getLocalAttendanceRecords(userName);
  }
}

function recordLocalAttendance(record) {
  try {
    const records = getLocalAttendanceRecords(record.userName);
    
    records.push({
      id: "att_" + Math.random().toString(16).slice(2) + Date.now().toString(16),
      ...record,
    });

    const allRecords = JSON.parse(localStorage.getItem(LOCAL_ATTENDANCE_KEY) || "[]");
    allRecords.push({
      id: "att_" + Math.random().toString(16).slice(2) + Date.now().toString(16),
      ...record,
    });
    
    localStorage.setItem(LOCAL_ATTENDANCE_KEY, JSON.stringify(allRecords));
    return true;
  } catch (error) {
    throw new Error(error.message || "Failed to record attendance");
  }
}

function getLocalAttendanceRecords(userName) {
  try {
    const raw = localStorage.getItem(LOCAL_ATTENDANCE_KEY);
    const allRecords = raw ? JSON.parse(raw) : [];
    return allRecords.filter((r) => r.userName?.toLowerCase() === userName?.toLowerCase());
  } catch {
    return [];
  }
}
