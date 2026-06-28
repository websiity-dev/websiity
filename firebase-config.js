// ─────────────────────────────────────────────────────────────────────────────
// Websiity Firebase Configuration
// Firebase Firestore (database) + Firebase Storage (resume files)
// ─────────────────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            "AIzaSyDOpp1-pEVS2rP7cJMtdMnDFsgtLLx7sTE",
  authDomain:        "websiity-70822.firebaseapp.com",
  projectId:         "websiity-70822",
  storageBucket:     "websiity-70822.firebasestorage.app",
  messagingSenderId: "682315512028",
  appId:             "1:682315512028:web:5977c2879c2842323b9c19",
  measurementId:     "G-HX2H10KM8T"
};

// ── Default values ────────────────────────────────────────────────────────────
const DEFAULT_MOCK_COURSE = {
  show:        true,
  link:        "https://docs.google.com/forms/d/e/1FAIpQLSdnS8b-cQk5a5d8jN_qWkZixmYm0jQz-3D4mG5_P4H9A4J1AQ/viewform",
  courseText:  "Courses",
  hiringText:  "Hiring"
};

const DEFAULT_ADMIN_PASSWORD = "admin@websiity";

// ── JWT helper (Web Crypto API – HMAC-SHA256) ─────────────────────────────────
const JWT_SECRET = "07e0a6139b8a5f94a58993962bfe703f38643db9581e6aa407707361cb4d3e93b8d0a66f819daa1193c5bef6a12a6d42a29b4ac2bd9bbf69c58cffb69982f552";

const WebsiityAuth = {
  async generateJWT(payload, secret = JWT_SECRET) {
    try {
      const header = { alg: "HS256", typ: "JWT" };
      const b64Header  = btoa(JSON.stringify(header)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
      const b64Payload = btoa(JSON.stringify(payload)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
      const tokenInput = `${b64Header}.${b64Payload}`;
      const enc  = new TextEncoder();
      const key  = await crypto.subtle.importKey("raw", enc.encode(secret), { name:"HMAC", hash:{name:"SHA-256"} }, false, ["sign"]);
      const sig  = await crypto.subtle.sign("HMAC", key, enc.encode(tokenInput));
      const b64Sig = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
      return `${tokenInput}.${b64Sig}`;
    } catch(e) {
      // Fallback for restrictive environments
      return `mock.${btoa(JSON.stringify(payload))}.sig`;
    }
  },

  async verifyJWT(token, secret = JWT_SECRET) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [h, p, s] = parts;
      // Mock fallback
      if (h === "mock" && s === "sig") return JSON.parse(atob(p));
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name:"HMAC", hash:{name:"SHA-256"} }, false, ["verify"]);
      const sigRaw = atob(s.replace(/-/g,"+").replace(/_/g,"/"));
      const sigBuf = new Uint8Array([...sigRaw].map(c => c.charCodeAt(0)));
      const valid  = await crypto.subtle.verify("HMAC", key, sigBuf, enc.encode(`${h}.${p}`));
      if (!valid) return null;
      return JSON.parse(atob(p.replace(/-/g,"+").replace(/_/g,"/")));
    } catch(e) {
      try { return JSON.parse(atob(token.split('.')[1])); } catch(_) { return null; }
    }
  }
};

// ── Initialise Firebase ───────────────────────────────────────────────────────
let db      = null;   // Firestore
let storage = null;   // Firebase Storage
let dbMode  = "mock"; // "firebase" | "mock"

(function initFirebase() {
  try {
    if (typeof firebase === "undefined") throw new Error("Firebase SDK not loaded yet.");
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    db      = firebase.firestore();
    storage = firebase.storage();
    dbMode  = "firebase";
    console.log("✅ Websiity: Firebase Firestore + Storage initialised.");
  } catch(e) {
    console.warn("⚠️ Firebase init failed – running in LocalStorage mock mode.", e.message);
    dbMode = "mock";
  }
})();

// ─────────────────────────────────────────────────────────────────────────────
// WebsiityDB – unified database interface
// ─────────────────────────────────────────────────────────────────────────────
const WebsiityDB = {

  getMode() { return dbMode; },

  // ── Course / Button Config ──────────────────────────────────────────────────
  async getCourseConfig() {
    if (dbMode === "firebase") {
      try {
        const snap = await db.collection("settings").doc("course").get();
        if (snap.exists) return { ...DEFAULT_MOCK_COURSE, ...snap.data() };
        await db.collection("settings").doc("course").set(DEFAULT_MOCK_COURSE);
        return DEFAULT_MOCK_COURSE;
      } catch(e) { console.error("getCourseConfig:", e); return DEFAULT_MOCK_COURSE; }
    }
    try {
      const local = localStorage.getItem("websiity_mock_course");
      return local ? JSON.parse(local) : DEFAULT_MOCK_COURSE;
    } catch(_) { return DEFAULT_MOCK_COURSE; }
  },

  async updateCourseConfig(cfg) {
    const merged = { ...DEFAULT_MOCK_COURSE, ...cfg };
    if (dbMode === "firebase") {
      await db.collection("settings").doc("course").set(merged, { merge: true });
    } else {
      localStorage.setItem("websiity_mock_course", JSON.stringify(merged));
    }
    return merged;
  },

  // ── Auth ───────────────────────────────────────────────────────────────────
  async registerUser(name, email, phone, password) {
    const em = email.trim().toLowerCase();
    const jwt = await WebsiityAuth.generateJWT({ email: em, password });
    const userData = { name: name.trim(), email: em, phone: phone.trim(), passwordJWT: jwt, createdAt: new Date().toISOString() };

    if (dbMode === "firebase") {
      const doc = await db.collection("users").doc(em).get();
      if (doc.exists) throw new Error("An account with this email already exists.");
      await db.collection("users").doc(em).set(userData);
    } else {
      let users = {};
      try { const l = localStorage.getItem("websiity_users"); if(l) users = JSON.parse(l); } catch(_){}
      if (users[em]) throw new Error("An account with this email already exists.");
      users[em] = userData;
      localStorage.setItem("websiity_users", JSON.stringify(users));
    }
    return { name: userData.name, email: em, phone: userData.phone };
  },

  async loginUser(email, password) {
    const em = email.trim().toLowerCase();
    let userData = null;

    if (dbMode === "firebase") {
      const doc = await db.collection("users").doc(em).get();
      if (doc.exists) userData = doc.data();
    } else {
      let users = {};
      try { const l = localStorage.getItem("websiity_users"); if(l) users = JSON.parse(l); } catch(_){}
      userData = users[em] || null;
    }

    if (!userData) throw new Error("No account found with this email.");
    const decoded = await WebsiityAuth.verifyJWT(userData.passwordJWT);
    if (decoded && decoded.password === password) {
      return { name: userData.name, email: em, phone: userData.phone, isAdmin: false };
    }
    throw new Error("Incorrect password.");
  },

  async verifyAdmin(email, password) {
    const em = email.trim().toLowerCase();
    if (!em.startsWith("websiity@gmail.com")) throw new Error("Invalid admin email.");

    if (dbMode === "firebase") {
      try {
        const snap = await db.collection("settings").doc("admin").get();
        if (!snap.exists) {
          await db.collection("settings").doc("admin").set({ password: DEFAULT_ADMIN_PASSWORD });
        }
        const stored = snap.exists ? snap.data().password : DEFAULT_ADMIN_PASSWORD;
        if (password === stored) return { email: em, isAdmin: true };
        throw new Error("Incorrect admin password.");
      } catch(e) {
        if (e.message === "Incorrect admin password.") throw e;
        // Firestore read failed — fall through to local check
      }
    }
    if (password === DEFAULT_ADMIN_PASSWORD) return { email: em, isAdmin: true };
    throw new Error("Incorrect admin password.");
  },

  // ── Resume Upload (Convert to Base64) ────────────────────────────────────
  // Converts file to Base64 to store directly in Firestore
  async uploadResume(file, applicationId) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = e => resolve({ url: e.target.result, name: file.name, path: null });
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsDataURL(file);
    });
  },

  // ── Applications ───────────────────────────────────────────────────────────
  async submitApplication(appData, resumeFile) {
    const tempId = 'app_' + Date.now() + '_' + Math.floor(Math.random() * 1e4);

    // Convert resume to Base64 (if provided)
    let resumeData = null;
    let resumeName = null;
    if (resumeFile) {
      const result = await this.uploadResume(resumeFile, tempId);
      resumeData = result.url;
      resumeName = result.name;
    }

    const application = {
      rolename:    appData.rolename,
      name:        appData.name,
      email:       appData.email.trim().toLowerCase(),
      phone:       appData.phone,
      collegeName: appData.collegeName,
      year:        appData.year,
      degree:      appData.degree,
      resumeData,       // Stored directly as Base64 in Firestore
      resumeName,
      status:      "under review",
      createdAt:   new Date().toISOString()
    };

    if (dbMode === "firebase") {
      const ref = await db.collection("applications").add(application);
      return { id: ref.id, ...application };
    }

    // Mock mode
    application.id = tempId;
    let apps = [];
    try { const l = localStorage.getItem("websiity_applications"); if(l) apps = JSON.parse(l); } catch(_){}
    apps.push(application);
    localStorage.setItem("websiity_applications", JSON.stringify(apps));
    return application;
  },

  async getApplications(userEmail = null) {
    if (dbMode === "firebase") {
      let q = db.collection("applications");
      if (userEmail) q = q.where("email", "==", userEmail.trim().toLowerCase());
      const snap = await q.get();
      const apps = [];
      snap.forEach(d => apps.push({ id: d.id, ...d.data() }));
      return apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    let apps = [];
    try { const l = localStorage.getItem("websiity_applications"); if(l) apps = JSON.parse(l); } catch(_){}
    if (userEmail) {
      const em = userEmail.trim().toLowerCase();
      apps = apps.filter(a => a.email === em);
    }
    return apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async updateApplicationStatus(appId, newStatus) {
    if (dbMode === "firebase") {
      await db.collection("applications").doc(appId).update({ status: newStatus });
      return true;
    }
    let apps = [];
    try { const l = localStorage.getItem("websiity_applications"); if(l) apps = JSON.parse(l); } catch(_){}
    let found = false;
    apps = apps.map(a => { if (a.id === appId) { a.status = newStatus; found = true; } return a; });
    if (!found) throw new Error("Application not found.");
    localStorage.setItem("websiity_applications", JSON.stringify(apps));
    return true;
  }
};

// Expose globally
window.WebsiityAuth = WebsiityAuth;
window.WebsiityDB   = WebsiityDB;
