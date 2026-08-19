import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./style.css";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [articles, setArticles] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  async function loadDashboard() {
    const { data: a } = await supabase
      .from("articles")
      .select("id,title,status,created_at")
      .order("created_at", { ascending: false });

    const { data: n } = await supabase
      .from("announcements")
      .select("id,title,is_active,created_at")
      .order("created_at", { ascending: false });

    setArticles(a || []);
    setAnnouncements(n || []);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadDashboard();
  }, [session]);

  async function login(event) {
    event.preventDefault();
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) setMessage(error.message);
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  if (!session) {
    return (
      <main className="login">
        <section className="card">
          <h1>Admin Yayasan</h1>
          <p>Yayasan Bina Tandang Nurul Falah</p>

          <form onSubmit={login}>
            <input
              type="email"
              placeholder="Email admin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit">Masuk</button>
          </form>

          {message && <p className="error">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main>
      <header>
        <div>
          <h1>Dashboard CMS</h1>
          <p>Yayasan Bina Tandang Nurul Falah</p>
        </div>
        <button onClick={logout}>Keluar</button>
      </header>

      <section className="stats">
        <div className="card">
          <strong>{articles.length}</strong>
          <span>Artikel</span>
        </div>

        <div className="card">
          <strong>{announcements.length}</strong>
          <span>Pengumuman</span>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <h2>Artikel terbaru</h2>

          {articles.length === 0 ? (
            <p>Belum ada artikel.</p>
          ) : (
            <ul>
              {articles.map((item) => (
                <li key={item.id}>
                  <b>{item.title}</b>
                  <small>{item.status}</small>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2>Pengumuman</h2>

          {announcements.length === 0 ? (
            <p>Belum ada pengumuman.</p>
          ) : (
            <ul>
              {announcements.map((item) => (
                <li key={item.id}>
                  <b>{item.title}</b>
                  <small>{item.is_active ? "Aktif" : "Nonaktif"}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
