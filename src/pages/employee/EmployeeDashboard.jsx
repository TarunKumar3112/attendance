import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../ui/Card";
import Toast from "../../ui/Toast";
import { getSession, getUsers } from "../../services/storage";
import { createAttendance, getUserLogs, latestStatusFor } from "../../services/attendance";
import { logoutEmployee } from "../../services/auth";

function fmt(iso) {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

export default function EmployeeDashboard() {
  const nav = useNavigate();
  const session = getSession();
  const me = useMemo(() => getUsers().find((u) => u.id === session.userId), [session.userId]);

  const [toast, setToast] = useState("");
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState({ status: "Not working", latest: null });
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    if (!me) return;
    setLogs(getUserLogs(me.id).slice(0, 10));
    setStatus(latestStatusFor(me.id));
  };

  useEffect(() => { refresh(); }, [me?.id]);

  const doAction = async (type) => {
    if (!me) return;
    setBusy(true);
    try {
      await createAttendance({ userId: me.id, type, userName: me.name });
      setToast(type === "checkin" ? "Checked in." : "Checked out.");
      refresh();
    } catch {
      setToast("Location permission needed (use HTTPS or localhost).");
    } finally {
      setBusy(false);
      setTimeout(() => setToast(""), 2200);
    }
  };

  const onLogout = () => {
    logoutEmployee();
    nav("/employee/login");
  };

  return (
    <main className="page">
      <section className="grid">
        <Card
          title={`Hello, ${me?.name || "Employee"}`}
          subtitle={me ? `${me.email}${me.phone ? " • " + me.phone : ""}` : ""}
          right={
            <span className="pill">
              <span className="dot" style={{ background: status.status === "Working" ? "var(--ok)" : "#cbd5e1" }} />
              <span>{status.status}</span>
            </span>
          }
        >
          <div className="row">
            <button className="btn btnOk" disabled={busy} onClick={() => doAction("checkin")}>Check-in</button>
            <button className="btn btnDanger" disabled={busy} onClick={() => doAction("checkout")}>Check-out</button>
            <button className="btn btnGhost" style={{ marginLeft: "auto" }} onClick={onLogout}>Logout</button>
          </div>

          <div className="hr" />

          <h3 className="title" style={{ fontSize: 15, margin: "0 0 10px 0" }}>Recent Logs</h3>

          <div className="list">
            {logs.length === 0 ? (
              <div className="muted small">No logs yet. Press Check-in.</div>
            ) : logs.map((r) => (
              <div className="item" key={r.id} style={{ cursor: "default" }}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 900 }}>
                      {r.type === "checkin" ? "Check-in" : "Check-out"}{" "}
                      <span className="muted2" style={{ fontWeight: 700 }}>• {fmt(r.time)}</span>
                    </div>
                    <div className="muted mono">lat:{Number(r.lat).toFixed(6)} lng:{Number(r.lng).toFixed(6)}</div>
                    <div className="muted small">{r.address || "(address unavailable)"}</div>
                  </div>
                  <div className="muted2 small" style={{ textAlign: "right" }}>
                    <div className="mono">{r.device?.platform || ""}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Tip" subtitle="Use mobile GPS for best location accuracy.">
          <div className="muted small">If permission is blocked, check-in/out will fail.</div>
        </Card>
      </section>

      <Toast message={toast} />
    </main>
  );
}
