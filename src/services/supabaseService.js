import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config/supabaseKeys";

/**
 * Supabase Integration
 * Tables expected:
 * - users: id, name, phone, email, password, role, created_at
 * - attendance: id, user_id, user_name, type, time, address, lat, lng, device
 */

const SUPABASE_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

async function supabaseRequest(table, { method = "GET", params, body } = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const headers = { ...SUPABASE_HEADERS };

  if (body) {
    headers["Content-Type"] = "application/json";
    headers.Prefer = "return=minimal";
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof data === "string" ? data : data?.message;
    throw new Error(message || "Supabase request failed");
  }

  return data;
}

export async function getAllUsers() {
  try {
    const data = await supabaseRequest("users", {
      params: { select: "*" },
    });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching users from Supabase:", error.message);
    throw new Error("Failed to fetch users. Check Supabase configuration.");
  }
}

export async function addUser(user) {
  const payload = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    password: user.pass || user.password,
    role: user.role,
    created_at: user.createdAt || new Date().toISOString(),
  };

  try {
    await supabaseRequest("users", {
      method: "POST",
      body: [payload],
    });
    return true;
  } catch (error) {
    console.error("Error adding user to Supabase:", error.message);
    throw new Error("Failed to create user");
  }
}

export async function userExists(email) {
  try {
    const data = await supabaseRequest("users", {
      params: {
        select: "email",
        email: `eq.${email}`,
        limit: "1",
      },
    });
    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    console.error("Error checking user existence in Supabase:", error.message);
    throw error;
  }
}

export async function getUserByEmailAndPassword(email, password) {
  try {
    const data = await supabaseRequest("users", {
      params: {
        select: "*",
        email: `eq.${email}`,
        password: `eq.${password}`,
        limit: "1",
      },
    });
    return Array.isArray(data) ? data[0] || null : null;
  } catch (error) {
    console.error("Error finding user in Supabase:", error.message);
    throw error;
  }
}

export async function getUserByEmail(email) {
  try {
    const data = await supabaseRequest("users", {
      params: {
        select: "*",
        email: `eq.${email}`,
        limit: "1",
      },
    });
    return Array.isArray(data) ? data[0] || null : null;
  } catch (error) {
    console.error("Error finding user by email in Supabase:", error.message);
    throw error;
  }
}

export async function recordAttendance(attendanceRecord) {
  const payload = {
    id: attendanceRecord.id,
    user_id: attendanceRecord.userId,
    user_name: attendanceRecord.userName,
    type: attendanceRecord.type,
    time: attendanceRecord.time,
    address: attendanceRecord.address,
    lat: attendanceRecord.lat,
    lng: attendanceRecord.lng,
    device: attendanceRecord.device,
  };

  try {
    await supabaseRequest("attendance", {
      method: "POST",
      body: [payload],
    });
    return true;
  } catch (error) {
    console.error("Error recording attendance in Supabase:", error.message);
    throw new Error("Failed to record attendance");
  }
}

export async function getUserAttendanceRecords(userId) {
  try {
    const data = await supabaseRequest("attendance", {
      params: {
        select: "*",
        user_id: `eq.${userId}`,
        order: "time.desc",
      },
    });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching attendance records from Supabase:", error.message);
    throw new Error("Failed to fetch attendance records");
  }
}
