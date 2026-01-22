import { getAttendance, setAttendance } from "./storage";
import { getCurrentPosition, reverseGeocode, deviceInfo } from "./geo";
import { recordAttendance, getUserAttendanceRecords } from "./supabaseService";

export function latestStatusFor(userId) {
  const rows = getAttendance()
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.time) - new Date(a.time));

  const latest = rows[0];
  if (!latest) return { status: "Not working", latest: null };

  return { status: latest.type === "checkin" ? "Working" : "Not working", latest };
}

export function getUserLogs(userId) {
  return getAttendance()
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.time) - new Date(a.time));
}

export async function createAttendance({ userId, type, userName }) {
  const pos = await getCurrentPosition();
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;
  const address = await reverseGeocode(lat, lng);

  const record = {
    id: "a_" + Math.random().toString(16).slice(2) + Date.now().toString(16),
    userId,
    userName: userName || "Unknown",
    type, // checkin / checkout
    time: new Date().toISOString(),
    lat,
    lng,
    address,
    device: deviceInfo(),
  };

  // Save to localStorage
  const rows = getAttendance();
  rows.push(record);
  setAttendance(rows);

  // Also save to Supabase (if available)
  try {
    await recordAttendance(record);
  } catch (error) {
    console.warn("Could not save to Supabase:", error);
    // Still saved to localStorage, so continue
  }
}
