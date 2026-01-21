import axios from "axios";

/**
 * Google Sheets API Integration (via Backend Proxy)
 * All data syncs to Google Sheets - no localStorage fallback
 */

// Backend proxy URL for all requests
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
const SHEETS_PROXY_URL = `${BACKEND_URL}/api/sheets`;

console.log("📊 Google Sheets Backend URL:", SHEETS_PROXY_URL);

/**
 * Get all users from Google Sheets
 */
export async function getAllUsers() {
  try {
    const response = await axios.post(SHEETS_PROXY_URL, {
      action: "getUsers",
    });
    return response.data.users || [];
  } catch (error) {
    console.error("Error fetching users from Google Sheets:", error.message);
    throw new Error("Failed to fetch users. Make sure backend is running.");
  }
}

/**
 * Add new user to Google Sheets
 */
export async function addUser(user) {
  try {
    const response = await axios.post(SHEETS_PROXY_URL, {
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
    console.error("Error adding user to Google Sheets:", error.message);
    throw new Error(error.response?.data?.error || "Failed to create user");
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
    console.error("Error checking user existence:", error);
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
    console.error("Error finding user by email:", error);
    throw error;
  }
}

// ============ ATTENDANCE TRACKING ============

/**
 * Record attendance (check-in or check-out) to Google Sheets
 */
export async function recordAttendance(attendanceRecord) {
  try {
    const response = await axios.post(SHEETS_PROXY_URL, {
      action: "addAttendance",
      attendance: attendanceRecord,
    });
    return response.data.success;
  } catch (error) {
    console.error("Error recording attendance:", error.message);
    throw new Error("Failed to record attendance");
  }
}

/**
 * Get all attendance records for a user from Google Sheets
 */
export async function getUserAttendanceRecords(userName) {
  try {
    const response = await axios.post(SHEETS_PROXY_URL, {
      action: "getUserAttendance",
      userName,
    });
    return response.data.records || [];
  } catch (error) {
    console.error("Error fetching attendance records:", error.message);
    throw new Error("Failed to fetch attendance records");
  }
}
