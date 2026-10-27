
import { useEffect, useState } from "react";
import "./App.css";
import "./Assessment.css";

const API = `${import.meta.env.VITE_API_URL ?? ""}/api`;
const BRANCHES = ["CSE", "CSM", "CSD", "IT", "ECE", "EEE", "MECH", "CIVIL"];

const blankStudent = {
  name: "", rollNumber: "", email: "", password: "",
  branch: "CSM", cgpa: "", backlogs: "0", skills: ""
};

const blankCompany = {
  name: "", role: "", description: "",
  eligibleBranches: [], minCGPA: "", maxBacklogs: "0",
  deadline: "",
  applicationLink: "",
  technicalRequirements: []
};

async function api(path, method = "GET", body = null, token = "") {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body !== null ? { body: JSON.stringify(body) } : {})
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}
function formatJobDescription(description = "") {
  return description
    .replace(/\*\*/g, "")
    .replace(/\s+-\s+/g, "\n• ")
    .trim();
}
export default function App() {
  const [token, setToken] = useState(sessionStorage.getItem("token") || "");
  const [role, setRole] = useState(sessionStorage.getItem("role") || "student");
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("login");
  const [page, setPage] = useState("dashboard");
  const [form, setForm] = useState(blankStudent);
  const [companyForm, setCompanyForm] = useState(blankCompany);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [skillAnalysis, setSkillAnalysis] = useState(null);
  const [skillLoading, setSkillLoading] = useState(false);
  const [selectedRoadmapCompany, setSelectedRoadmapCompany] = useState("");
  const [roadmap, setRoadmap] = useState(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [roadmapSaving, setRoadmapSaving] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [analyticsHistory, setAnalyticsHistory] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [assessmentBusy, setAssessmentBusy] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState(null);

  const notify = (success = "", failure = "") => {
    setMessage(success);
    setError(failure);
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    setToken("");
    setRole("student");
    setUser(null);
    setCompanies([]);
    setQuestions([]);
    setAnswers({});
    setAssessmentHistory([]);
    setAssessmentResult(null);
    setForm(blankStudent);
    setCompanyForm(blankCompany);
    setPage("dashboard");
    setAuthView("login");
    notify();
  };

  useEffect(() => {
    if (!token) return;
    let active = true;

    api(role === "faculty" ? "/faculty/me" : "/me", "GET", null, token)
      .then(data => {
        if (active) setUser(data);
      })
      .catch(() => {
        if (!active) return;
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("role");
        setToken("");
        setUser(null);
        notify("", "Session expired. Please sign in again.");
      });

    return () => { active = false; };
  }, [token, role]);

  const loadCompanies = async (currentRole = role, currentToken = token) => {
    try {
      const path = currentRole === "faculty"
        ? "/faculty/companies"
        : "/me/drives";
      const data = await api(path, "GET", null, currentToken);
      setCompanies(data);
      return data;
    } catch (err) {
      notify("", err.message);
      return [];
    }
  };

  useEffect(() => {
    if (token && user) loadCompanies();
  }, [token, user?._id, user?.id, role]);

  const signIn = async e => {
    e.preventDefault();
    notify();
    setLoading(true);

    try {
      const path = role === "faculty"
        ? "/faculty/login"
        : authView === "register"
          ? "/auth/register" : "/auth/login";

      const payload = authView === "register" && role === "student"
        ? {
          ...form,
          cgpa: Number(form.cgpa),
          backlogs: Number(form.backlogs),
          skills: form.skills.split(",").map(s => s.trim()).filter(Boolean)
        }
        : { email: form.email, password: form.password };

      const data = await api(path, "POST", payload);

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("role", role);
      setUser(role === "faculty" ? data.faculty : data.student);
      setToken(data.token);
      setPage("dashboard");
      setForm(blankStudent);
      setCompanies([]);
    } catch (err) {
      notify("", err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async e => {
    e.preventDefault();
    setLoading(true);
    notify();

    try {
      const data = await api("/me", "PUT", {
        name: form.name,
        branch: form.branch,
        cgpa: Number(form.cgpa),
        backlogs: Number(form.backlogs),
        skills: form.skills.split(",").map(s => s.trim()).filter(Boolean)
      }, token);
      setUser(data);
      setPage("dashboard");
      notify("Profile updated successfully!");
      await loadCompanies();
    } catch (err) {
      notify("", err.message);
    } finally {
      setLoading(false);
    }
  };

  const editProfile = () => {
    setForm({
      name: user.name, branch: user.branch,
      cgpa: String(user.cgpa),
      backlogs: String(user.backlogs),
      skills: (user.skills || []).join(", "),
      rollNumber: user.rollNumber, email: user.email, password: ""
    });
    setPage("profile");
    notify();
  };

  const saveCompany = async e => {
    e.preventDefault();
    notify();

    if (companyForm.eligibleBranches.length === 0) {
      notify("", "Select at least one eligible branch.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...companyForm,
        minCGPA: Number(companyForm.minCGPA),
        maxBacklogs: Number(companyForm.maxBacklogs)
      };

      await api(
        editingId ? `/faculty/companies/${editingId}` : "/faculty/companies",
        editingId ? "PUT" : "POST",
        payload,
        token
      );

      setCompanyForm(blankCompany);
      setEditingId(null);
      setPage("companies");
      notify(editingId ? "Drive updated successfully!" : "Placement drive published!");
      await loadCompanies();
    } catch (err) {
      notify("", err.message);
    } finally {
      setLoading(false);
    }
  };

  const editCompany = company => {
    setCompanyForm({
      name: company.name,
      role: company.role,
      description: company.description || "",
      eligibleBranches: company.eligibleBranches,
      minCGPA: String(company.minCGPA),
      maxBacklogs: String(company.maxBacklogs),
      deadline: company.deadline,
      applicationLink: company.applicationLink || "",
      technicalRequirements: company.technicalRequirements || []
    });
    setEditingId(company._id);
    setPage("addCompany");
    notify();
  };

  const deleteCompany = async id => {
    if (!window.confirm("Delete this placement drive?")) return;
    try {
      await api(`/faculty/companies/${id}`, "DELETE", null, token);
      notify("Placement drive deleted.");
      await loadCompanies();
    } catch (err) {
      notify("", err.message);
    }
  };

  const changeRole = newRole => {
    setRole(newRole);
    setAuthView("login");
    setForm(blankStudent);
    notify();
  };

  const changeBranch = branch => {
    setCompanyForm(prev => ({
      ...prev,
      eligibleBranches: prev.eligibleBranches.includes(branch)
        ? prev.eligibleBranches.filter(b => b !== branch)
        : [...prev.eligibleBranches, branch]
    }));
  };

  const loadAssessmentHistory = async () => {
    try {
      setAssessmentBusy(true);
      const data = await api("/assessments/history", "GET", null, token);
      setAssessmentHistory(data);
    } catch (err) {
      notify("", err.message);
    } finally {
      setAssessmentBusy(false);
    }
  };

  const loadAssessmentQuestions = async () => {
    try {
      setAssessmentBusy(true);
      const data = await api("/assessments/questions", "GET", null, token);
      setQuestions(data);
      setAnswers({});
      setAssessmentResult(null);
    } catch (err) {
      notify("", err.message);
    } finally {
      setAssessmentBusy(false);
    }
  };

  const submitAssessment = async e => {
    e.preventDefault();
    if (questions.length === 0 ||
      questions.some(q => !Object.prototype.hasOwnProperty.call(answers, q.id))) {
      notify("", "Please answer all questions before submitting.");
      return;
    }
    try {
      setAssessmentBusy(true);
      notify();
      const result = await api("/assessments/submit", "POST", {
        answers: questions.map(q => ({ id: q.id, answer: answers[q.id] }))
      }, token);
      setAssessmentResult(result);
      notify("Assessment submitted and saved successfully!");
    } catch (err) {
      notify("", err.message);
    } finally {
      setAssessmentBusy(false);
    }
  };
  const loadSkillAnalysis = async () => {
    setSkillLoading(true);

    try {
      const data = await api(
        "/skill-analysis",
        "GET",
        null,
        token
      );

      setSkillAnalysis(data);
    } catch (err) {
      notify("", err.message);
    } finally {
      setSkillLoading(false);
    }
  };


  const loadRoadmap = async (companyId, silent = false) => {
    if (!companyId) {
      setRoadmap(null);
      return;
    }

    if (!silent) {
      setRoadmapLoading(true);
      setRoadmap(null);
    }

    try {
      const data = await api(
        `/roadmap/${companyId}`,
        "GET",
        null,
        token
      );

      setRoadmap(data);
    } catch (err) {
      notify("", err.message);
    } finally {
      if (!silent) {
        setRoadmapLoading(false);
      }
    }
  };



  const updateRoadmapTask = async (taskId, completed) => {
    if (!selectedRoadmapCompany || roadmapSaving) return;

    setRoadmapSaving(true);

    try {
      await api(
        `/roadmap/${selectedRoadmapCompany}/progress`,
        "PATCH",
        { taskId, completed },
        token
      );

      await loadRoadmap(selectedRoadmapCompany, true);
    } catch (err) {
      notify("", err.message);
    } finally {
      setRoadmapSaving(false);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);

    try {
      const data = await api(
        "/assessments/history",
        "GET",
        null,
        token
      );

      setAnalyticsHistory(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      notify("", err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  };


  const openPage = next => {
    setPage(next);
    notify();

    if (next === "companies" || next === "eligibility") {
      loadCompanies();
    }

    if (next === "skillAnalysis") {
      loadSkillAnalysis();

    }
    if (next === "analytics") {
      loadAnalytics();
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm("Permanently delete your student account?")) return;
    try {
      await api("/me", "DELETE", null, token);
      logout();
    } catch (err) {
      notify("", err.message);
    }
  };

  if (!token || !user) {
    return (
      <div className="auth-page">
        <div className="auth-intro">
          <div className="auth-logo">H</div>
          <h1>HirePath</h1>
          <p>Assess your skills. Prepare for placements. Grow your career.</p>
          <div className="auth-feature">✓ Secure role-based login</div>
          <div className="auth-feature">✓ Live placement drive updates</div>
          <div className="auth-feature">✓ Personalized eligibility checking</div>
        </div>

        <div className="auth-panel">
          <h2>{role === "faculty" ? "Faculty Sign In"
            : authView === "register" ? "Student Registration" : "Student Sign In"}</h2>
          <p>Select your role to continue.</p>

          <div className="role-tabs">
            <button type="button" className={role === "student" ? "selected" : ""}
              onClick={() => changeRole("student")}>🎓 Student</button>
            <button type="button" className={role === "faculty" ? "selected" : ""}
              onClick={() => changeRole("faculty")}>👨‍🏫 Faculty</button>
          </div>

          {error && <div className="alert error">{error}</div>}

          <form onSubmit={signIn} className="auth-form">
            {role === "student" && authView === "register" && (
              <>
                <label>Full Name
                  <input required name="name" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} />
                </label>
                <label>Roll Number
                  <input required name="rollNumber" value={form.rollNumber}
                    onChange={e => setForm({ ...form, rollNumber: e.target.value })} />
                </label>
              </>
            )}

            <label>Email Address
              <input required type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="Enter email" />
            </label>

            <label>Password
              <input required type="password" value={form.password}
                minLength={role === "student" && authView === "register" ? 8 : undefined}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Enter password" />
            </label>

            {role === "student" && authView === "register" && (
              <>
                <div className="form-grid">
                  <label>Branch
                    <select value={form.branch}
                      onChange={e => setForm({ ...form, branch: e.target.value })}>
                      {BRANCHES.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </label>
                  <label>CGPA
                    <input required type="number" min="0" max="10" step="0.01"
                      value={form.cgpa}
                      onChange={e => setForm({ ...form, cgpa: e.target.value })} />
                  </label>
                </div>
                <label>Active Backlogs
                  <input required type="number" min="0" step="1"
                    value={form.backlogs}
                    onChange={e => setForm({ ...form, backlogs: e.target.value })} />
                </label>
                <label>Technical Skills (comma separated)
                  <input value={form.skills}
                    onChange={e => setForm({ ...form, skills: e.target.value })}
                    placeholder="Java, React, Python" />
                </label>
              </>
            )}

            <button className="primary-btn" disabled={loading}>
              {loading ? "Please wait..." :
                role === "student" && authView === "register"
                  ? "Create Account" : "Sign In"}
            </button>
          </form>

          {role === "student" ? (
            <p className="switch-auth">
              {authView === "login" ? "New student?" : "Already registered?"}
              <button type="button" onClick={() => {
                setAuthView(authView === "login" ? "register" : "login");
                setForm(blankStudent);
                notify();
              }}>
                {authView === "login" ? "Register here" : "Sign in"}
              </button>
            </p>
          ) : (
            <p className="switch-auth">
              Faculty accounts are created locally by the administrator.
            </p>
          )}
        </div>
      </div>
    );
  }

  const faculty = role === "faculty";
  const title = {
    dashboard: faculty ? "Faculty Dashboard" : "My Dashboard",
    companies: "Manage Placement Drives",
    addCompany: editingId ? "Edit Placement Drive" : "Publish Placement Drive",
    eligibility: "Placement Opportunities",
    profile: "Edit My Profile",
    skillAnalysis: "Company-Specific Skill Gap Analysis",
    roadmap: "Personalized Preparation Roadmap",
    analytics: "Performance Analytics",
    assessment: "Technical Assessment",
    performance: "My Performance"
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">H</div>
          <div><h2>HirePath</h2><small>{faculty ? "Faculty Portal" : "Student Portal"}</small></div>
        </div>
        <div className="menu-label">WORKSPACE</div>
        <nav>
          <button className={page === "dashboard" ? "active" : ""}
            onClick={() => openPage("dashboard")}>◫ &nbsp; Dashboard</button>

          {faculty ? (
            <>
              <button className={page === "companies" ? "active" : ""}
                onClick={() => openPage("companies")}>☷ &nbsp; Placement Drives</button>
              <button className={page === "addCompany" ? "active" : ""}
                onClick={() => {
                  setEditingId(null);
                  setCompanyForm(blankCompany);
                  openPage("addCompany");
                }}>＋ &nbsp; Publish Company</button>
            </>
          ) : (
            <>
              <button className={page === "eligibility" ? "active" : ""}
                onClick={() => openPage("eligibility")}>✓ &nbsp; Placement Opportunities</button>
              <button
                className={page === "skillAnalysis" ? "active" : ""}
                onClick={() => openPage("skillAnalysis")}
              >
                ◈ &nbsp; Skill Gap Analysis
              </button>
              <button
                className={page === "roadmap" ? "active" : ""}
                onClick={() => openPage("roadmap")}
              >
                ◈ &nbsp; Preparation Roadmap
              </button>
              <button
                className={page === "analytics" ? "active" : ""}
                onClick={() => openPage("analytics")}
              >
                ◫ &nbsp; Performance Analytics
              </button>
              <button className={page === "assessment" ? "active" : ""}
                onClick={() => openPage("assessment")}>▤ &nbsp; Take Assessment</button>
              <button className={page === "performance" ? "active" : ""}
                onClick={() => openPage("performance")}>▥ &nbsp; My Performance</button>
              <button className={page === "profile" ? "active" : ""}
                onClick={editProfile}>✎ &nbsp; Edit Profile</button>
            </>
          )}

          <button onClick={logout}>↪ &nbsp; Logout</button>
        </nav>
        <div className="sidebar-bottom">
          <span className="online-dot"></span>
          {faculty ? "Faculty" : "Student"} Session
          <small>Placement Readiness Platform</small>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">HIREPATH · READINESS & RECRUITMENT</span>
            <h1>{title[page] || "Dashboard"}</h1>
            <p>Welcome, {user.name} · {faculty ? user.department : user.branch}</p>
          </div>
          <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
        </header>

        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        {page === "dashboard" && (
          <>
            <section className="stats">
              {faculty ? (
                <>
                  <div className="stat-card"><div className="stat-icon purple">🏢</div>
                    <div><span>Total Drives</span><strong>{companies.length}</strong></div></div>
                  <div className="stat-card"><div className="stat-icon green">📢</div>
                    <div><span>My Published Drives</span><strong>
                      {companies.filter(c => String(c.createdBy) === String(user.id)).length}
                    </strong></div></div>
                  <div className="stat-card"><div className="stat-icon orange">🎓</div>
                    <div><span>Department</span><strong>{user.department}</strong></div></div>
                </>
              ) : (
                <>
                  <div className="stat-card"><div className="stat-icon purple">🎓</div>
                    <div><span>My CGPA</span><strong>{Number(user.cgpa).toFixed(2)}</strong></div></div>
                  <div className="stat-card"><div className="stat-icon green">📚</div>
                    <div><span>Active Backlogs</span><strong>{user.backlogs}</strong></div></div>
                  <div className="stat-card"><div className="stat-icon orange">🏢</div>
                    <div><span>Available Drives</span><strong>{companies.length}</strong></div></div>
                </>
              )}
            </section>

            <div className="panel">
              <div className="panel-heading">
                <h2>{faculty ? "Faculty Workspace" : "My Student Profile"}</h2>
                <p>{faculty
                  ? "Publish and manage placement opportunities for students."
                  : "Your academic details and placement opportunities."}</p>
              </div>

              <div className="details-grid">
                <div><span>Name</span><strong>{user.name}</strong></div>
                <div><span>Email</span><strong>{user.email}</strong></div>
                <div><span>{faculty ? "Department" : "Roll Number"}</span>
                  <strong>{faculty ? user.department : user.rollNumber}</strong></div>
                {!faculty && <div><span>Branch</span><strong>{user.branch}</strong></div>}
              </div>

              {!faculty && (
                <>
                  <div className="section-label">MY TECHNICAL SKILLS</div>
                  <div className="skill-list">
                    {(user.skills || []).map((s, i) =>
                      <span className="skill" key={i}>{s}</span>)}
                  </div>
                </>
              )}

              <div className="form-actions">
                <button className="secondary-btn" onClick={() => loadCompanies()}>
                  Refresh Updates
                </button>
                <button className="primary-btn"
                  onClick={() => openPage(faculty ? "addCompany" : "eligibility")}>
                  {faculty ? "Publish New Drive" : "View Placement Drives"}
                </button>
              </div>
            </div>

            {!faculty && companies.length > 0 && (
              <div className="panel stacked-panel">
                <h2>Latest Placement Updates</h2>
                {companies.slice(0, 3).map(c => (
                  <div className="update-row" key={c._id}>
                    <div>
                      <strong>{c.name}</strong>
                      <p>{c.role} · Deadline: {c.deadline}</p>
                    </div>
                    <span className={c.eligible ? "status eligible" : "status ineligible"}>
                      {c.eligible ? "Eligible" : "Not Eligible"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {faculty && page === "addCompany" && (
          <div className="panel">
            <div className="panel-heading">
              <h2>{editingId ? "Update Company Details" : "New Placement Drive"}</h2>
              <p>Students will see published drives when they refresh their dashboard.</p>
            </div>

            <form onSubmit={saveCompany}>
              <div className="form-grid">
                <label>Company Name *
                  <input required value={companyForm.name}
                    onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                    placeholder="e.g. TechNova" />
                </label>
                <label>Job Role *
                  <input required value={companyForm.role}
                    onChange={e => setCompanyForm({ ...companyForm, role: e.target.value })}
                    placeholder="Software Developer Intern" />
                </label>
                <label>Minimum CGPA *
                  <input required type="number" min="0" max="10" step="0.01"
                    value={companyForm.minCGPA}
                    onChange={e => setCompanyForm({ ...companyForm, minCGPA: e.target.value })} />
                </label>
                <label>Maximum Active Backlogs *
                  <input required type="number" min="0" step="1"
                    value={companyForm.maxBacklogs}
                    onChange={e => setCompanyForm({ ...companyForm, maxBacklogs: e.target.value })} />
                </label>
                <label>Application Deadline *
                  <input required type="date" value={companyForm.deadline}
                    onChange={e => setCompanyForm({ ...companyForm, deadline: e.target.value })} />
                </label>
                <label>Application Link
                  <input type="url" value={companyForm.applicationLink}
                    onChange={e => setCompanyForm({ ...companyForm, applicationLink: e.target.value })}
                    placeholder="https://example.com/apply" />
                </label>
                <label className="full-width">Job Description
                  <textarea rows="3" value={companyForm.description}
                    onChange={e => setCompanyForm({ ...companyForm, description: e.target.value })}
                    placeholder="Job description and additional requirements" />
                </label>
              </div>

              <div className="section-label">
                TECHNICAL PROFICIENCY TARGETS
              </div>

              <p className="form-help">
                Set minimum assessment scores for each topic.
                Leave a topic unchecked if it is not required.
              </p>

              <div className="technical-requirements">
                {["DSA", "OOP", "DBMS", "OS", "CN"].map(topic => {
                  const requirement = companyForm.technicalRequirements
                    .find(r => r.topic === topic);

                  return (
                    <div className="requirement-row" key={topic}>
                      <label className="requirement-check">
                        <input
                          type="checkbox"
                          checked={!!requirement}
                          onChange={e => {
                            setCompanyForm(prev => ({
                              ...prev,
                              technicalRequirements: e.target.checked
                                ? [...prev.technicalRequirements,
                                { topic, minScore: 60 }]
                                : prev.technicalRequirements.filter(
                                  r => r.topic !== topic
                                )
                            }));
                          }}
                        />
                        <span>{topic}</span>
                      </label>

                      {requirement && (
                        <label className="requirement-score">
                          Target %
                          <input
                            type="number"
                            min="0"
                            max="100"
                            required
                            value={requirement.minScore}
                            onChange={e => {
                              setCompanyForm(prev => ({
                                ...prev,
                                technicalRequirements:
                                  prev.technicalRequirements.map(r =>
                                    r.topic === topic
                                      ? { ...r, minScore: e.target.value }
                                      : r
                                  )
                              }));
                            }}
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="section-label">ELIGIBLE BRANCHES *</div>
              <div className="branch-options">
                {BRANCHES.map(b => (
                  <label key={b}>
                    <input type="checkbox" checked={companyForm.eligibleBranches.includes(b)}
                      onChange={() => changeBranch(b)} />
                    {b}
                  </label>
                ))}
              </div>

              <div className="form-actions">
                <button type="button" className="secondary-btn"
                  onClick={() => openPage("companies")}>Cancel</button>
                <button className="primary-btn" disabled={loading}>
                  {loading ? "Saving..." : editingId ? "Update Drive" : "Publish Drive"}
                </button>
              </div>
            </form>
          </div>
        )}

        {faculty && page === "companies" && (
          <div className="panel">
            <div className="panel-heading records-heading">
              <div><h2>Published Placement Drives</h2>
                <p>Manage company information stored in MongoDB.</p></div>
              <button className="primary-btn" onClick={() => {
                setEditingId(null);
                setCompanyForm(blankCompany);
                openPage("addCompany");
              }}>+ Add Drive</button>
            </div>

            {companies.length === 0 && <div className="empty">No drives published yet.</div>}
            <div className="drive-list">
              {companies.map(c => (
                <div className="drive-card" key={c._id}>
                  <div className="company-logo">{c.name.charAt(0)}</div>
                  <div className="drive-info">
                    <h3>{c.name}</h3>
                    <p>{c.role} · CGPA ≥ {c.minCGPA} · Deadline: {c.deadline}</p>
                    <p>Branches: {c.eligibleBranches.join(", ")}</p>
                  </div>
                  {String(c.createdBy) === String(user.id) && (
                    <div className="actions">
                      <button onClick={() => editCompany(c)}>Edit</button>
                      <button className="delete" onClick={() => deleteCompany(c._id)}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!faculty && page === "eligibility" && (
          <div className="panel">
            <div className="panel-heading records-heading">
              <div>
                <h2>Latest Placement Opportunities</h2>
                <p>Eligibility is calculated using your saved academic profile.</p>
              </div>
              <button className="secondary-btn" onClick={() => loadCompanies()}>
                ↻ Refresh
              </button>
            </div>

            <div className="company-grid">
              {companies.map(c => (
                <div
                  className="company-card clickable-company"
                  key={c._id}
                  role="button"
                  tabIndex={0}
                  aria-label={`View details for ${c.name}`}
                  onClick={() => setSelectedCompany(c)}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedCompany(c);
                    }
                  }}
                >
                  <div className="company-logo">{c.name.charAt(0)}</div>
                  <h3>{c.name}</h3>
                  <p><strong>{c.role}</strong></p>
                  <p className="company-preview">
                    {c.description?.length > 125
                      ? `${c.description.slice(0, 125)}...`
                      : c.description}
                  </p>
                  <p>Branches: {c.eligibleBranches.join(", ")}</p>
                  <p>Min CGPA: {c.minCGPA} · Max Backlogs: {c.maxBacklogs}</p>
                  <p>Deadline: {c.deadline}</p>
                  <span className={c.eligible ? "status eligible" : "status ineligible"}>
                    {c.eligible ? "✓ You are Eligible" : "✕ Not Eligible"}
                  </span>
                  {!c.eligible && c.reasons?.length > 0 && (
                    <div className="reasons">
                      {c.reasons.map((reason, i) => <p key={i}>• {reason}</p>)}
                    </div>
                  )}

                  {c.applicationLink && c.eligible ? (
                    <a
                      className="apply-link"
                      href={c.applicationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Apply Now ↗
                    </a>
                  ) : (
                    <button className="apply-disabled" disabled>
                      {!c.eligible ? "Not Eligible to Apply" : "Application Link Unavailable"}
                    </button>
                  )}

                </div>
              ))}
            </div>

            {companies.length === 0 &&
              <div className="empty">No placement drives published yet.</div>}
          </div>
        )}
        {!faculty && page === "assessment" && (
          <div className="panel assessment-panel">
            <div className="panel-heading">
              <h2>Technical Readiness Assessment</h2>
              <p>Answer each question. The backend grades and saves your results.</p>
            </div>
            {assessmentBusy && <p>Loading or submitting assessment...</p>}
            {!assessmentBusy && assessmentResult ? (
              <div>
                <h2>Your result: {assessmentResult.overallScore}%</h2>
                <p>{assessmentResult.correctAnswers} / {assessmentResult.totalQuestions} correct</p>
                <div className="details-grid">
                  {(assessmentResult.topicScores || []).map(item => (
                    <div key={item.topic}>
                      <span>{item.topic}</span>
                      <strong>{item.percentage}% ({item.correct}/{item.total})</strong>
                    </div>
                  ))}
                </div>
                <div className="form-actions">
                  <button className="secondary-btn" onClick={() => openPage("performance")}>View History</button>
                  <button className="primary-btn" onClick={() => openPage("assessment")}>Retake Assessment</button>
                </div>
              </div>
            ) : !assessmentBusy && questions.length > 0 ? (
              <form onSubmit={submitAssessment} className="assessment-form">
                <div className="assessment-progress">
                  <div className="assessment-progress-heading">
                    <strong>Assessment progress</strong>
                    <span>{Object.keys(answers).length} / {questions.length} answered</span>
                  </div>
                  <div className="assessment-progress-track">
                    <div className="assessment-progress-fill" style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }} />
                  </div>
                </div>
                {questions.map((q, index) => (
                  <fieldset key={q.id} className="assessment-question">
                    <legend>
                      <span className="assessment-topic">{q.topic}</span> {index + 1}. {q.question}
                    </legend>
                    <div className="assessment-options">
                      {q.options.map((option, optionIndex) => (
                        <label key={optionIndex} className={`assessment-option ${answers[q.id] === optionIndex ? "is-selected" : ""}`}>
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            value={optionIndex}
                            checked={answers[q.id] === optionIndex}
                            onChange={() => setAnswers(prev => ({ ...prev, [q.id]: optionIndex }))}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <div className="form-actions">
                  <button className="primary-btn" type="submit"
                    disabled={assessmentBusy || Object.keys(answers).length !== questions.length}>
                    Submit Assessment
                  </button>
                </div>
              </form>
            ) : !assessmentBusy ? (
              <button className="secondary-btn" onClick={loadAssessmentQuestions}>Retry Loading Questions</button>
            ) : null}
          </div>
        )}

        {!faculty && page === "performance" && (
          <div className="panel">
            <div className="panel-heading records-heading">
              <div>
                <h2>Assessment History</h2>
                <p>Your saved test attempts and topic-wise scores.</p>
              </div>
              <button className="secondary-btn" onClick={loadAssessmentHistory} disabled={assessmentBusy}>
                Refresh
              </button>
            </div>
            {assessmentBusy && <p>Loading assessment history...</p>}
            {!assessmentBusy && assessmentHistory.length === 0 && (
              <div className="empty">No attempts yet. Take your first assessment to see results.</div>
            )}
            {!assessmentBusy && assessmentHistory.map((attempt, index) => (
              <div className="drive-card" key={attempt._id} style={{ marginBottom: 12 }}>
                <div className="drive-info" style={{ width: "100%" }}>
                  <h3>Attempt {assessmentHistory.length - index} — {attempt.overallScore}%</h3>
                  <p>{new Date(attempt.createdAt).toLocaleString()} · {attempt.correctAnswers}/{attempt.totalQuestions} correct</p>
                  <div className="skill-list">
                    {(attempt.topicScores || []).map(item => (
                      <span className="skill" key={item.topic}>{item.topic}: {item.percentage}%</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!faculty && page === "skillAnalysis" && (
          <div className="panel">
            <div className="panel-heading">
              <h2>Company-Specific Skill Gap Analysis</h2>
              <p>
                Compare your technical assessment performance
                with company-specific proficiency targets.
              </p>
            </div>

            <div className="form-actions">
              <button
                className="secondary-btn"
                onClick={loadSkillAnalysis}
                disabled={skillLoading}
              >
                {skillLoading ? "Analyzing..." : "Refresh Analysis"}
              </button>
            </div>

            {skillLoading && (
              <p>Calculating your skill gaps...</p>
            )}

            {!skillLoading && skillAnalysis?.hasAssessment === false && (
              <div className="empty">
                <h3>No assessment results found</h3>
                <p>
                  Complete a technical assessment to unlock
                  company-specific skill gap analysis.
                </p>

                <button
                  className="primary-btn"
                  onClick={() => openPage("assessment")}
                >
                  Take Assessment
                </button>
              </div>
            )}

            {!skillLoading && skillAnalysis?.hasAssessment && (
              <>
                <div className="analysis-summary">
                  <div className="stat-card">
                    <span>Latest Assessment Score</span>
                    <strong>{skillAnalysis.overallScore}%</strong>
                  </div>
                  <div className="stat-card">
                    <span>Companies Analyzed</span>
                    <strong>{skillAnalysis.companies.length}</strong>
                  </div>
                </div>

                <div className="skill-company-grid">
                  {skillAnalysis.companies.map(company => (
                    <div
                      className="skill-company-card"
                      key={company.companyId}
                    >
                      <h3>{company.companyName}</h3>
                      <p>{company.role}</p>

                      {!company.requirementsConfigured ? (
                        <div className="empty">
                          Technical requirements not configured.
                        </div>
                      ) : (
                        <>
                          <span className={
                            company.meetsAllTargets
                              ? "status eligible"
                              : "status ineligible"
                          }>
                            {company.meetsAllTargets
                              ? "All targets met"
                              : "Preparation needed"}
                          </span>

                          <div className="skill-gap-list">
                            {company.gaps.map(gap => (
                              <div
                                className="skill-gap-row"
                                key={gap.topic}
                              >
                                <div className="skill-gap-heading">
                                  <strong>{gap.topic}</strong>
                                  <span>
                                    {gap.studentScore === null
                                      ? "Not assessed"
                                      : `${gap.studentScore}% / ${gap.requiredScore}%`}
                                  </span>
                                </div>

                                <div className="skill-progress">
                                  <div
                                    className="skill-progress-fill"
                                    style={{
                                      width: `${gap.studentScore ?? 0}%`,
                                      background:
                                        gap.meetsTarget === true
                                          ? "#16a34a"
                                          : "#7c3aed"
                                    }}
                                  />
                                </div>

                                <small>
                                  {gap.gap === null
                                    ? "Assessment required"
                                    : gap.gap === 0
                                      ? "Target achieved"
                                      : `${gap.gap} percentage points below target`}
                                </small>
                              </div>
                            ))}
                          </div>

                          <div className="skill-analysis-footer">
                            Average measured gap:{" "}
                            <strong>
                              {company.averageGap === null
                                ? "Not available"
                                : `${company.averageGap} points`}
                            </strong>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {!faculty && page === "roadmap" && (
          <div className="panel">
            <div className="panel-heading">
              <h2>Personalized Preparation Roadmap</h2>
              <p>
                Select a company to generate a preparation plan
                based on your technical assessment results.
              </p>
            </div>

            <div className="roadmap-controls">
              <label>
                Select Target Company
                <select
                  value={selectedRoadmapCompany}
                  onChange={e => {
                    const id = e.target.value;
                    setSelectedRoadmapCompany(id);
                    loadRoadmap(id);
                  }}
                >
                  <option value="">Choose a company</option>
                  {companies.map(company => (
                    <option key={company._id} value={company._id}>
                      {company.name} — {company.role}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {roadmapLoading && (
              <div className="empty">Generating your preparation plan...</div>
            )}

            {!roadmapLoading && roadmap && !roadmap.hasAssessment && (
              <div className="empty">
                <h3>Assessment Required</h3>
                <p>Complete an assessment before generating your roadmap.</p>
                <button
                  className="primary-btn"
                  onClick={() => openPage("assessment")}
                >
                  Take Assessment
                </button>
              </div>
            )}

            {!roadmapLoading && roadmap?.hasAssessment && (
              <>
                <div className="roadmap-overview">
                  <div>
                    <h3>{roadmap.companyName}</h3>
                    <p>{roadmap.role}</p>
                  </div>
                  <span className="roadmap-score">
                    Latest Score: {roadmap.overallScore}%
                  </span>
                </div>

                {roadmap.topics.length === 0 ? (
                  <div className="empty">
                    No technical requirements have been configured
                    for this company yet.
                  </div>
                ) : (
                  <>
                    {(() => {
                      const allTasks = roadmap.topics.flatMap(t => t.tasks);
                      const done = allTasks.filter(t => t.completed).length;
                      const percent = allTasks.length
                        ? Math.round(done * 100 / allTasks.length)
                        : 0;

                      return (
                        <div className="roadmap-progress-card">
                          <div className="roadmap-progress-heading">
                            <strong>Preparation Progress</strong>
                            <span>{done}/{allTasks.length} tasks · {percent}%</span>
                          </div>
                          <div className="roadmap-progress-track">
                            <div
                              className="roadmap-progress-fill"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}

                    <div className="roadmap-topic-list">
                      {roadmap.topics.map(topic => (
                        <div className="roadmap-topic-card" key={topic.topic}>
                          <div className="roadmap-topic-heading">
                            <div>
                              <h3>{topic.topic}</h3>
                              <p>
                                Score: {topic.score === null
                                  ? "Not assessed" : `${topic.score}%`}
                                {" · "}
                                Target: {topic.target}%
                              </p>
                            </div>
                            <span className={
                              `roadmap-priority ${topic.priority === "High" ? "high" :
                                topic.priority === "Medium" ? "medium" :
                                  topic.priority === "Achieved" ? "achieved" : ""
                              }`
                            }>
                              {topic.priority}
                            </span>
                          </div>

                          <div className="roadmap-tasks">
                            {topic.tasks.map(task => (
                              <label className="roadmap-task" key={task.id}>
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  disabled={roadmapSaving}
                                  onChange={e =>
                                    updateRoadmapTask(task.id, e.target.checked)
                                  }
                                />
                                <span className={task.completed ? "task-done" : ""}>
                                  {task.description}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {!faculty && page === "analytics" && (
          <div className="panel">
            <div className="panel-heading">
              <h2>Performance Analytics</h2>
              <p>
                Track your technical assessment performance
                and identify areas for improvement.
              </p>
            </div>

            <div className="form-actions">
              <button
                className="secondary-btn"
                onClick={loadAnalytics}
                disabled={analyticsLoading}
              >
                {analyticsLoading ? "Loading..." : "Refresh Analytics"}
              </button>
            </div>

            {analyticsLoading ? (
              <div className="empty">Loading assessment history...</div>
            ) : analyticsHistory.length === 0 ? (
              <div className="empty">
                <h3>No Assessment History</h3>
                <p>Complete an assessment to unlock analytics.</p>
                <button
                  className="primary-btn"
                  onClick={() => openPage("assessment")}
                >
                  Take Assessment
                </button>
              </div>
            ) : (() => {
              const attempts = [...analyticsHistory].reverse();
              const latest = analyticsHistory[0];
              const earliest = attempts[0];

              const average = Math.round(
                attempts.reduce(
                  (sum, a) => sum + a.overallScore, 0
                ) / attempts.length
              );

              const improvement =
                latest.overallScore - earliest.overallScore;

              const topics = latest.topicScores || [];

              const best = [...topics].sort(
                (a, b) => b.percentage - a.percentage
              )[0];

              const weakest = [...topics].sort(
                (a, b) => a.percentage - b.percentage
              )[0];

              return (
                <>
                  <div className="analytics-stats">
                    <div className="analytics-stat">
                      <span>Latest Score</span>
                      <strong>{latest.overallScore}%</strong>
                    </div>

                    <div className="analytics-stat">
                      <span>Average Score</span>
                      <strong>{average}%</strong>
                    </div>

                    <div className="analytics-stat">
                      <span>Assessments Taken</span>
                      <strong>{attempts.length}</strong>
                    </div>

                    <div className="analytics-stat">
                      <span>Score Change</span>
                      <strong>
                        {attempts.length < 2
                          ? "—"
                          : `${improvement > 0 ? "+" : ""}${improvement} pts`}
                      </strong>
                    </div>
                  </div>

                  <div className="analytics-section">
                    <h3>Assessment Score Trend</h3>
                    <p>Chronological order, oldest to newest</p>

                    <div className="analytics-trend">
                      {attempts.map((a, index) => (
                        <div className="trend-row" key={a._id}>
                          <span>Attempt {index + 1}</span>

                          <div className="trend-track">
                            <div
                              className="trend-fill"
                              style={{
                                width: `${a.overallScore}%`
                              }}
                            />
                          </div>

                          <strong>{a.overallScore}%</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="analytics-section">
                    <h3>Latest Topic-Wise Performance</h3>
                    <p>Based on your most recent assessment</p>

                    <div className="analytics-topics">
                      {topics.map(topic => (
                        <div className="topic-analysis" key={topic.topic}>
                          <div className="topic-heading">
                            <strong>{topic.topic}</strong>
                            <span>
                              {topic.percentage}%
                              {" · "}
                              {topic.correct}/{topic.total} correct
                            </span>
                          </div>

                          <div className="trend-track">
                            <div
                              className="topic-fill"
                              style={{
                                width: `${topic.percentage}%`
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="analytics-insights">
                      <div>
                        <span>Strongest Topic</span>
                        <strong>
                          {best
                            ? `${best.topic} (${best.percentage}%)`
                            : "Unavailable"}
                        </strong>
                      </div>

                      <div>
                        <span>Lowest Scoring Topic</span>
                        <strong>
                          {weakest
                            ? `${weakest.topic} (${weakest.percentage}%)`
                            : "Unavailable"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="analytics-section">
                    <h3>Assessment History</h3>

                    <div className="analytics-table-wrap">
                      <table className="analytics-table">
                        <thead>
                          <tr>
                            <th>Attempt</th>
                            <th>Date</th>
                            <th>Correct</th>
                            <th>Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attempts.map((a, index) => (
                            <tr key={a._id}>
                              <td>{index + 1}</td>
                              <td>
                                {new Date(a.createdAt)
                                  .toLocaleDateString()}
                              </td>
                              <td>
                                {a.correctAnswers}/{a.totalQuestions}
                              </td>
                              <td>{a.overallScore}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {!faculty && selectedCompany && (
          <div
            className="company-modal-overlay"
            onClick={() => setSelectedCompany(null)}
          >
            <div
              className="company-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="company-modal-title"
              onClick={e => e.stopPropagation()}
            >
              <div className="company-modal-header">
                <div className="company-logo">
                  {selectedCompany.name.charAt(0)}
                </div>

                <button
                  type="button"
                  className="company-modal-close"
                  onClick={() => setSelectedCompany(null)}
                  aria-label="Close company details"
                >
                  ×
                </button>
              </div>

              <h2 id="company-modal-title">
                {selectedCompany.name}
              </h2>
              <p className="company-modal-role">
                {selectedCompany.role}
              </p>

              <span className={
                selectedCompany.eligible
                  ? "status eligible"
                  : "status ineligible"
              }>
                {selectedCompany.eligible
                  ? "✓ Academically Eligible"
                  : "✕ Not Eligible"}
              </span>

              <div className="company-modal-section">
                <h3>Job Description</h3>
                <p className="company-modal-description">
                  {formatJobDescription(
                    selectedCompany.description
                  ) || "No description provided."}
                </p>
              </div>

              <div className="company-modal-section">
                <h3>Eligibility Requirements</h3>

                <div className="company-modal-grid">
                  <div>
                    <span>Eligible Branches</span>
                    <strong>
                      {selectedCompany.eligibleBranches.join(", ")}
                    </strong>
                  </div>

                  <div>
                    <span>Minimum CGPA</span>
                    <strong>{selectedCompany.minCGPA}</strong>
                  </div>

                  <div>
                    <span>Maximum Backlogs</span>
                    <strong>{selectedCompany.maxBacklogs}</strong>
                  </div>

                  <div>
                    <span>Application Deadline</span>
                    <strong>{selectedCompany.deadline}</strong>
                  </div>
                </div>
              </div>

              {selectedCompany.technicalRequirements?.length > 0 && (
                <div className="company-modal-section">
                  <h3>Technical Proficiency Targets</h3>

                  <div className="company-modal-targets">
                    {selectedCompany.technicalRequirements.map(req => (
                      <span key={req.topic}>
                        {req.topic}: {req.minScore}%
                      </span>
                    ))}
                  </div>
                  <p className="company-modal-note">
                    Demo assessment targets, not official
                    employer eligibility criteria.
                  </p>
                </div>
              )}

              {!selectedCompany.eligible &&
                selectedCompany.reasons?.length > 0 && (
                  <div className="company-modal-reasons">
                    {selectedCompany.reasons.map((reason, i) => (
                      <p key={i}>• {reason}</p>
                    ))}
                  </div>
                )}

              <div className="company-modal-footer">
                {selectedCompany.eligible &&
                  /^https?:\/\//i.test(
                    selectedCompany.applicationLink || ""
                  ) ? (
                  <a
                    className="apply-link"
                    href={selectedCompany.applicationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Careers Website ↗
                  </a>
                ) : (
                  <button
                    className="apply-disabled"
                    disabled
                  >
                    {!selectedCompany.eligible
                      ? "Not Eligible"
                      : "Careers Website Unavailable"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {!faculty && page === "profile" && (
          <div className="panel">
            <div className="panel-heading">
              <h2>Update My Profile</h2>
              <p>Changes will be reflected in future eligibility checks.</p>
            </div>

            <form onSubmit={updateProfile}>
              <div className="form-grid">
                <label>Full Name
                  <input required value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} />
                </label>
                <label>Branch
                  <select value={form.branch}
                    onChange={e => setForm({ ...form, branch: e.target.value })}>
                    {BRANCHES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </label>
                <label>CGPA
                  <input required type="number" step="0.01" min="0" max="10"
                    value={form.cgpa}
                    onChange={e => setForm({ ...form, cgpa: e.target.value })} />
                </label>
                <label>Active Backlogs
                  <input required type="number" min="0" step="1"
                    value={form.backlogs}
                    onChange={e => setForm({ ...form, backlogs: e.target.value })} />
                </label>
                <label className="full-width">Technical Skills
                  <input value={form.skills}
                    onChange={e => setForm({ ...form, skills: e.target.value })} />
                </label>
              </div>
              <div className="form-actions">
                <button type="button" className="secondary-btn"
                  onClick={() => openPage("dashboard")}>Cancel</button>
                <button className="primary-btn" disabled={loading}>Save Changes</button>
              </div>
            </form>
            <div className="danger-zone">
              <button onClick={deleteAccount}>Delete My Account</button>
            </div>
          </div>
        )}

        <footer>HirePath © 2026 · Placement Readiness & Recruitment Platform</footer>
      </main>
    </div>
  );
}
