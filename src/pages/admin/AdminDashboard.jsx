import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../ui/Card";
import { getUsers } from "../../services/storage";
import { getUserLogs, latestStatusFor } from "../../services/attendance";
import { logoutAdmin } from "../../services/auth";

function fmt(iso) {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

export default function AdminDashboard() {
  const nav = useNavigate();
  const [selectedId, setSelectedId] = useState(null);

  const employees = useMemo(() => {
    return getUsers()
      .filter((u) => u.role === "employee")
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const workingCount = useMemo(() => {
    let w = 0;
    for (const u of employees) if (latestStatusFor(u.id).status === "Working") w++;
    return w;
  }, [employees]);

  const selected = employees.find((e) => e.id === selectedId) || null;
  const selectedLogs = selected ? getUserLogs(selected.id) : [];

  const toggleSelect = (id) => {
    setSelectedId((prev) => (prev === id ? null : id)); // click again -> minimize
  };

  const onLogout = () => {
    logoutAdmin();
    nav("/admin/login");
  };

  return (
    <main className="page">
      <section className="single">
        <Card
          title="Admin Dashboard"
          subtitle="Click an employee to view details. Click again to minimize."
          right={
            <div className="row">
              <span className="pill"><span className="dot" style={{ background: "var(--ok)" }} /> {workingCount} Working</span>
              <span className="pill"><span className="dot" style={{ background: "#cbd5e1" }} /> {employees.length} Total</span>
              <button className="btn btnGhost" onClick={onLogout}>Logout</button>
            </div>
          }
        >
          <div className="adminGrid">
            <div>
              <h3 className="title" style={{ fontSize: 15, margin: "0 0 10px 0" }}>Employees</h3>

              <div className="list">
                {employees.length === 0 ? (
                  <div className="muted small">No employees yet.</div>
                ) : employees.map((u) => {
                  const st = latestStatusFor(u.id);
                  const latestTime = st.latest ? fmt(st.latest.time) : "—";
                  const dotColor = st.status === "Working" ? "var(--ok)" : "#cbd5e1";

                  return (
                    <div
                      key={u.id}
                      className={"item " + (selectedId === u.id ? "selected" : "")}
                      onClick={() => toggleSelect(u.id)}
                    >
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontWeight: 900 }}>
                            {u.name} <span className="muted2" style={{ fontWeight: 700 }}>({u.email})</span>
                          </div>
                          <div className="muted small">Last: {latestTime}</div>
                        </div>
                        <span className="pill">
                          <span className="dot" style={{ background: dotColor }} />
                          <span>{st.status}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="title" style={{ fontSize: 15, margin: "0 0 10px 0" }}>Details</h3>

              {!selected ? (
                <div className="muted small">Select an employee to view latest location and logs.</div>
              ) : (
                <>
                  {(() => {
                    const st = latestStatusFor(selected.id);
                    const latest = st.latest;
                    return (
                      <div className="item" style={{ cursor: "default" }}>
                        <div style={{ fontWeight: 950, fontSize: 16 }}>{selected.name}</div>
                        <div className="muted small">
                          {selected.email}{selected.phone ? " • " + selected.phone : ""}
                        </div>

                        <div className="hr" />

                        <div className="row" style={{ justifyContent: "space-between" }}>
                          <span className="pill">
                            <span className="dot" style={{ background: st.status === "Working" ? "var(--ok)" : "#cbd5e1" }} />
                            <span>{st.status}</span>
                          </span>
                          <span className="pill">
                            <span className="muted2">Last:</span> <span>{latest ? fmt(latest.time) : "—"}</span>
                          </span>
                        </div>

                        {latest ? (
                          <>
                            <div className="hr" />
                            <div className="muted small"><b>Latest {latest.type}</b></div>
                            <div className="muted mono">
                              lat:{Number(latest.lat).toFixed(6)} lng:{Number(latest.lng).toFixed(6)}
                            </div>
                            <div className="muted small">{latest.address || "(address unavailable)"}</div>
                            <div className="muted2 small" style={{ marginTop: 6 }}>
                              <b>Device:</b> {latest.device?.platform || ""}
                            </div>
                          </>
                        ) : (
                          <div className="muted small">No logs yet.</div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="hr" />

                  <div className="list">
                    {selectedLogs.slice(0, 25).map((r) => (
                      <div key={r.id} className="item" style={{ cursor: "default" }}>
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
                </>
              )}
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
