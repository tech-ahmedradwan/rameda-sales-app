/* =======================================================
   RAMEDA AI | IRONCLAD MAP GUARD v2.1 (GitHub Compatible)
   - Blocks view immediately (Zero-Flash).
   - Enforces Domain Integrity (Supports GitHub Pages).
   - Enforces Navigation Flow (Anti-Deep-Link).
   - Checks Firebase Auth & Firestore Permissions.
   ======================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CONFIGURATION ---
const ALLOWED_HOSTS = [
    "rameda-sales.firebaseapp.com", 
    "localhost", 
    "127.0.0.1",
    "tech-ahmedradwan.github.io"        // ✅ ADDED: Your GitHub Domain
];

const LOGIN_URL = "../../index.html";
const DASHBOARD_URL = "../../dashboard.html";

// 1. INJECT SECURITY OVERLAY (IMMEDIATE LOCK)
const overlay = document.createElement('div');
overlay.id = "security-overlay";
overlay.innerHTML = `
    <div style="text-align:center; color:#38bdf8; font-family:'Segoe UI', sans-serif;">
        <div class="sec-spinner"></div>
        <h3 id="sec-status" style="margin-top:20px; font-weight:400; letter-spacing:3px; font-size:14px;">VERIFYING SECURITY PROTOCOLS...</h3>
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
        }
        @keyframes secSpin { to { transform: rotate(360deg); } }
    </style>
`;
document.body.appendChild(overlay);

// 2. ENVIRONMENT INTEGRITY CHECKS (PRE-FIREBASE)
(function runIntegrityCheck() {
    const currentHost = window.location.hostname;
    const referrer = document.referrer;
    
    // A. Domain Lock: يسمح الآن بأي نطاق موجود في قائمة ALLOWED_HOSTS
    if (!ALLOWED_HOSTS.includes(currentHost)) {
        console.error(`Blocked Host: ${currentHost}`); // للمساعدة في الـ Debugging
        denyAccess("INVALID DOMAIN ORIGIN", LOGIN_URL);
        throw new Error("Security Violation: Invalid Host");
    }

    // B. Anti-Deep Link (Strict Flow Enforcement)
    // ملاحظة: هذا الشرط يمنع فتح الرابط مباشرة. يجب أن يأتي المستخدم من صفحة أخرى في نفس الموقع.
    const isInternalNavigation = referrer && referrer.includes(currentHost);
    
    // استثناء الـ localhost لتسهيل التطوير
    if (!isInternalNavigation && currentHost !== "localhost" && currentHost !== "127.0.0.1") {
         denyAccess("DIRECT ACCESS PROHIBITED", DASHBOARD_URL);
         throw new Error("Security Violation: Direct URL Entry blocked");
    }
})();

// 3. FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyAxlWe8HftfYeQvmE2W8TyXJapp5qERa4E",
  authDomain: "rameda-sales.firebaseapp.com",
  projectId: "rameda-sales",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 4. DEFINE PERMISSIONS
const ZONE_PERMISSIONS = {
    "SC1SalesAnalysisMap": "Speciality care 1",
    "SC2SalesAnalysisMap": "Speciality Care 2",
    "PCSalesAnalysisMap":  "Primary care 1",
    "OtherSalesAnalysisMap": "Other sales"
};

// 5. SECURITY LOGIC
onAuthStateChanged(auth, async (user) => {
    const statusText = document.getElementById("sec-status");
    if(statusText) statusText.innerText = "CHECKING CLEARANCE...";

    // --- CASE A: NOT LOGGED IN ---
    if (!user) {
        denyAccess("AUTHENTICATION REQUIRED", LOGIN_URL);
        return;
    }

    // --- CASE B: CHECK PERMISSIONS ---
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (!userDoc.exists()) {
            await signOut(auth); 
            denyAccess("INVALID USER RECORD", LOGIN_URL);
            return;
        }

        const userData = userDoc.data();
        const userRole = userData.role || "user";
        const userAccessList = (userData.Access || []).map(a => a.toLowerCase().trim());

        // 1. Admin Override
        if (userRole === 'admin') {
            grantAccess();
            return;
        }

        // 2. Map-Specific Validation
        const currentPath = window.location.pathname; 
        let requiredPermission = null;
        let isRestrictedZone = false;

        for (const [folder, accessName] of Object.entries(ZONE_PERMISSIONS)) {
            if (currentPath.includes(folder)) {
                requiredPermission = accessName.toLowerCase().trim();
                isRestrictedZone = true;
                break;
            }
        }

        // 3. Final Decision
        if (isRestrictedZone && requiredPermission) {
            if (userAccessList.includes(requiredPermission)) {
                grantAccess();
            } else {
                denyAccess("UNAUTHORIZED ZONE", DASHBOARD_URL);
            }
        } else {
            grantAccess();
        }

    } catch (error) {
        console.error("Security Error:", error);
        denyAccess("SYSTEM ERROR", LOGIN_URL);
    }
});

// --- HELPER FUNCTIONS ---

function grantAccess() {
    const overlay = document.getElementById("security-overlay");
    const statusText = document.getElementById("sec-status");
    const detailText = document.getElementById("sec-detail");
    
    if (statusText) {
        statusText.innerText = "ACCESS GRANTED";
        statusText.style.color = "#22c55e"; 
        if(detailText) detailText.innerText = "Redirecting to interface...";
    }

    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 600);
    }, 500);
}

function denyAccess(reason, redirectUrl) {
    const statusText = document.getElementById("sec-status");
    const detailText = document.getElementById("sec-detail");
    const spinner = document.querySelector(".sec-spinner");
    
    if (spinner) spinner.style.borderTopColor = "#ef4444"; 
    if (spinner) spinner.style.animation = "none";
    
    if (statusText) {
        statusText.innerHTML = "⛔ ACCESS DENIED";
        statusText.style.color = "#ef4444"; 
    }
    
    if (detailText) {
        detailText.innerText = reason;
        detailText.style.color = "#94a3b8";
    }

    setTimeout(() => {
        window.location.replace(redirectUrl);
    }, 2000);
}