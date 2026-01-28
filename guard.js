/* =======================================================
   RAMEDA AI | GENERAL SECURITY GATEKEEPER (v2.1)
   - Supports Multiple Authorized Domains (GitHub + Firebase).
   - Enforces Domain Integrity (Prevents external/local use).
   - Dynamic Redirects (Works in root & subfolders).
   - 5-Second Watchdog Timeout.
   - Strict Role-Based Access (Admin vs User).
   ======================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- 1. SECURITY CONFIGURATION ---
// ⚠️ ACTION REQUIRED: Add your GitHub domain to this list below
// --- 1. SECURITY CONFIGURATION ---
const ALLOWED_HOSTS = [
    "rameda-sales.firebaseapp.com",     // Firebase Hosting
    "rameda-sales.web.app",             // Alternate Firebase URL
    "localhost",                        // Local Development
    "127.0.0.1",                        // Local Development
    "tech-ahmedradwan.github.io"        // ✅ ADDED: Your GitHub Domain
];

const LOGIN_PAGE_NAME = "index.html";
const DASHBOARD_PAGE_NAME = "dashboard.html";
const ADMIN_PAGE_NAME = "admin.html";

// --- 2. INJECT SECURITY OVERLAY (IMMEDIATE VISUAL BLOCK) ---
const overlay = document.createElement('div');
overlay.id = "security-overlay";
overlay.innerHTML = `
    <div style="text-align:center; color:#38bdf8; font-family:'Segoe UI', sans-serif;">
        <div class="sec-spinner"></div>
        <h3 id="sec-status" style="margin-top:20px; font-weight:400; letter-spacing:3px; font-size:14px;">INITIALIZING SECURITY...</h3>
        <p id="sec-detail" style="color: #64748b; font-size: 11px; margin-top: 5px;"></p>
    </div>
    <style>
        #security-overlay {
            position: fixed; inset: 0; background: #020617; z-index: 99999999;
            display: flex; align-items: center; justify-content: center;
            transition: opacity 0.6s ease-out;
        }
        .sec-spinner {
            width: 40px; height: 40px; 
            border: 2px solid rgba(56,189,248,0.2);
            border-top-color: #38bdf8; 
            border-radius: 50%;
            animation: secSpin 0.8s linear infinite; 
            margin: 0 auto;
            transition: border-color 0.3s;
        }
        @keyframes secSpin { to { transform: rotate(360deg); } }
    </style>
`;
document.body.appendChild(overlay);

// --- 3. DOMAIN INTEGRITY CHECK (UPDATED) ---
// Stops execution immediately if not on an allowed server.
(function runIntegrityCheck() {
    const currentHost = window.location.hostname;
    console.log("🔒 Security Check | Current Host:", currentHost);

    // Check if the current host is in our allowed list
    // We use .some() to check if the current host matches OR ends with an allowed host (good for subdomains)
    const isAllowed = ALLOWED_HOSTS.some(host => currentHost === host || currentHost.endsWith(host));

    if (!isAllowed) {
        // Nuke the body content to prevent HTML scraping
        document.body.innerHTML = ""; 
        document.body.appendChild(overlay);
        
        // Show error and kill script
        const status = document.getElementById("sec-status");
        if(status) {
            status.innerText = "⛔ SECURITY VIOLATION";
            status.style.color = "#ef4444";
        }
        const detail = document.getElementById("sec-detail");
        if(detail) detail.innerText = `Unauthorized Origin: ${currentHost}`;
        
        // Throw fatal error to stop all JS execution
        throw new Error(`Security Violation: Host "${currentHost}" is not authorized.`);
    }
})();

// --- 4. FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyAxlWe8HftfYeQvmE2W8TyXJapp5qERa4E",
  authDomain: "rameda-sales.firebaseapp.com",
  projectId: "rameda-sales",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 5. NAVIGATION CONTEXT ---
const pathSegments = window.location.pathname.split('/');
const currentPage = pathSegments[pathSegments.length - 1] || LOGIN_PAGE_NAME; 
// Check against known filenames
const isLoginPage = currentPage === LOGIN_PAGE_NAME || currentPage === "";
const isAdminPage = currentPage === ADMIN_PAGE_NAME;

/* ================= ⏱️ 5-SECOND WATCHDOG TIMER ================= */
// If Firebase is blocked or internet fails, this ejects the user to prevent stuck screens.
const verificationTimer = setTimeout(() => {
    console.warn("⚠️ Verification Timed Out. Network sluggish or blocked.");
    if (!isLoginPage) {
        signOut(auth); 
        updateStatus("CONNECTION TIMEOUT", "#ef4444");
        setTimeout(() => performRedirect(LOGIN_PAGE_NAME), 1500);
    }
}, 5000); 

/* ================= 🛡️ MAIN AUTHENTICATION LOGIC ================= */
onAuthStateChanged(auth, async (user) => {
    clearTimeout(verificationTimer); // Stop the watchdog

    // --- CASE A: USER IS NOT LOGGED IN ---
    if (!user) {
        if (!isLoginPage) {
            // Illegal access attempt
            denyAccess("AUTHENTICATION REQUIRED", LOGIN_PAGE_NAME);
        } else {
            // Allow them to see the login page
            grantAccess(); 
        }
        return;
    }

    // --- CASE B: USER IS LOGGED IN ---
    if (user) {
        updateStatus("VERIFYING PROFILE...", "#38bdf8");

        // 1. If currently on Login Page -> Move them to Dashboard/Admin
        if (isLoginPage) {
             try {
                const userSnap = await getDoc(doc(db, "users", user.uid));
                if (userSnap.exists()) {
                    const role = userSnap.data().role;
                    window.location.replace(role === "admin" ? ADMIN_PAGE_NAME : DASHBOARD_PAGE_NAME);
                } else {
                    // Valid auth but no DB record? Send to Dashboard or handle error
                    window.location.replace(DASHBOARD_PAGE_NAME);
                }
            } catch (e) {
                 window.location.replace(DASHBOARD_PAGE_NAME);
            }
            return;
        }

        // 2. Fetch Profile for Permission Checks
        try {
            const userSnap = await getDoc(doc(db, "users", user.uid));
            
            // Security: If user deleted from DB but still has session, force logout
            if (!userSnap.exists()) {
                await signOut(auth);
                denyAccess("INVALID ACCOUNT", LOGIN_PAGE_NAME);
                return;
            }

            const userData = userSnap.data();
            const userRole = userData.role || "user";

            // 3. Admin Page Protection
            if (isAdminPage) {
                if (userRole !== 'admin') {
                    denyAccess("RESTRICTED AREA", DASHBOARD_PAGE_NAME);
                    return;
                }
            }

            // 4. Success
            grantAccess();

        } catch (error) {
            console.error("Auth Check Error:", error);
            // Don't lock them out for simple network errors, but warn them
            denyAccess("VERIFICATION FAILED", LOGIN_PAGE_NAME);
        }
    }
});

/* ================= 🛠️ VISUAL & NAV HELPERS ================= */

function grantAccess() {
    // Show the actual page content
    document.body.style.visibility = 'visible';
    document.body.style.opacity = '1';

    // Remove any leftover loaders from previous scripts
    const oldLoader = document.getElementById("app-loader");
    if(oldLoader) oldLoader.remove();

    // Success Animation
    updateStatus("ACCESS GRANTED", "#22c55e"); // Green
    
    const overlay = document.getElementById("security-overlay");
    if(overlay) {
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 600);
        }, 500);
    }
}

function denyAccess(reason, targetPage) {
    updateStatus("⛔ " + reason, "#ef4444"); // Red
    const detail = document.getElementById("sec-detail");
    if(detail) detail.innerText = "Redirecting...";

    setTimeout(() => {
        performRedirect(targetPage);
    }, 2000);
}

function updateStatus(text, color) {
    const status = document.getElementById("sec-status");
    const spinner = document.querySelector(".sec-spinner");
    if(status) {
        status.innerText = text;
        status.style.color = color;
    }
    if(spinner) {
        spinner.style.borderTopColor = color;
        // If error, stop spinning to indicate halt
        if (color === "#ef4444") spinner.style.animation = "none";
    }
}

/**
 * INTELLIGENT REDIRECTOR
 * Handles deeply nested folders (e.g. sales_maps/SC1) automatically.
 */
function performRedirect(targetPage) {
    const currentPath = window.location.pathname;
    const currentFolder = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);

    // 1. Deep Folder Escape (Specific to your project structure)
    // If we are inside 'sales_maps', we likely need to go up two levels
    if (currentPath.includes("sales_maps")) {
        window.location.replace("../../" + targetPage);
        return;
    }

    // 2. Standard Redirect (Same folder)
    // e.g. /dashboard.html -> /index.html
    window.location.replace(currentFolder + targetPage);
}