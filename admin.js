/* -----------------------------------------
   RAMEDA AI | ADMIN CONTROLLER (TURBO)
   -----------------------------------------
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= 1. FAST PAGE REVEAL ================= */
window.addEventListener('load', () => {
    const loader = document.getElementById("app-loader");
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
    }
    document.body.style.visibility = 'visible';
    document.body.style.opacity = '1';
});

/* ================= 2. THROTTLED ROBOT EYE ================= */
let isRobotPending = false;
document.addEventListener('mousemove', (e) => {
    if(isRobotPending) return;
    isRobotPending = true;

    requestAnimationFrame(() => {
        const robot = document.getElementById('robot');
        if (robot) {
            const eyes = robot.querySelectorAll('.robot-eye');
            const rect = robot.getBoundingClientRect();
            const robotX = rect.left + rect.width / 2;
            const robotY = rect.top + rect.height / 2;
            const angle = Math.atan2(e.clientY - robotY, e.clientX - robotX);
            const distance = Math.min(5, Math.hypot(e.clientX - robotX, e.clientY - robotY) / 20);
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            eyes.forEach(eye => { eye.style.transform = `translate(${x}px, ${y}px)`; });
        }
        isRobotPending = false;
    });
});

/* ================= 3. OPTIMIZED STAR ANIMATION ================= */
(function initStars() {
    const starCanvas = document.getElementById('canvas-stars');
    if (!starCanvas) return;
    const starCtx = starCanvas.getContext('2d');
    let resizeTimer;
    
    const createStars = () => {
        starCanvas.width = window.innerWidth;
        starCanvas.height = window.innerHeight;
    };
    createStars(); // Init
    
    // Debounced Resize
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(createStars, 200);
    });
})();

/* ================= 4. FIREBASE INIT ================= */
const firebaseConfig = {
  apiKey: "AIzaSyAxlWe8HftfYeQvmE2W8TyXJapp5qERa4E",
  authDomain: "rameda-sales.firebaseapp.com",
  projectId: "rameda-sales",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

/* ================= 5. DOM ELEMENTS ================= */
const logoutBtn = document.getElementById("logoutBtn");
const createForm = document.getElementById("createUserForm");
const adminMsg = document.getElementById("adminMsg");
const createBtn = document.getElementById("createBtn");
const loadUsersBtn = document.getElementById("loadUsersBtn");
const usersList = document.getElementById("usersList");

// Access Dropdown
const accessTrigger = document.getElementById("accessTrigger");
const accessDropdown = document.getElementById("accessDropdown");
const accessLabel = document.getElementById("accessLabel");
const accessOptions = document.querySelectorAll(".access-opt");
let selectedAccess = [];

// Role Dropdown
const roleTrigger = document.getElementById("roleTrigger");
const roleDropdown = document.getElementById("roleDropdown");
const roleLabel = document.getElementById("roleLabel");
const roleOptions = document.querySelectorAll(".role-opt");
let selectedRole = "user";

// Map Selector
const mapTrigger = document.getElementById("mapSelectorTrigger");
const mapDropdown = document.getElementById("mapSelectorDropdown");
const mapLabel = document.getElementById("mapSelectorLabel");
const mapOptions = document.querySelectorAll(".map-opt");
const mapSelectorInput = document.getElementById("mapSelector");

// Map Config
const mapConfigForm = document.getElementById("mapConfigForm");
const mapMsg = document.getElementById("mapMsg");
const saveMapBtn = document.getElementById("saveMapBtn");

// Modals
const editModal = document.getElementById("editModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const saveEditBtn = document.getElementById("saveEditBtn");
const deleteModal = document.getElementById("deleteModal");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const deleteTargetId = document.getElementById("deleteTargetId");

// Edit Vars
const editUid = document.getElementById("editUid");
const editName = document.getElementById("editName");
const editPhone = document.getElementById("editPhone");
const editRole = document.getElementById("editRole");
const editAccessCbs = document.querySelectorAll(".edit-access-cb");

/* ================= 6. AUTH GUARD ================= */
onAuthStateChanged(auth, user => { 
    if (!user) window.location.replace("index.html"); 
    else { document.body.style.opacity = '1'; document.body.style.visibility = 'visible'; }
});
if(logoutBtn) logoutBtn.onclick = async () => { await signOut(auth); window.location.replace("index.html"); };


/* ================= 🟢 FAST UI TABS & DECKS ================= */
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        document.getElementById('tab-' + targetId).classList.add('active');
        btn.classList.add('active');
    });
});

document.querySelectorAll('.deck-btn[data-deck]').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetDeck = btn.getAttribute('data-deck');
        document.querySelectorAll('.deck-btn[data-deck]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.deck-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('deck-' + targetDeck).classList.add('active');
    });
});


/* ================= 7. DROPDOWN UI LOGIC ================= */
function closeAllDropdowns() {
    if(accessDropdown) accessDropdown.classList.remove("show");
    if(roleDropdown) roleDropdown.classList.remove("show");
    if(mapDropdown) mapDropdown.classList.remove("show");
}
window.addEventListener("click", closeAllDropdowns);

// Access
if(accessTrigger) {
    accessTrigger.addEventListener("click", (e) => { e.stopPropagation(); closeAllDropdowns(); accessDropdown.classList.toggle("show"); });
    accessOptions.forEach(opt => {
        opt.addEventListener("click", (e) => {
            e.stopPropagation();
            const val = opt.dataset.value;
            if (selectedAccess.includes(val)) {
                selectedAccess = selectedAccess.filter(i => i !== val);
                opt.classList.remove("selected");
            } else {
                selectedAccess.push(val);
                opt.classList.add("selected");
            }
            accessLabel.textContent = selectedAccess.length === 0 ? "Select Workspaces..." : `${selectedAccess.length} Selected`;
        });
    });
}

// Role
if(roleTrigger) {
    roleTrigger.addEventListener("click", (e) => { e.stopPropagation(); closeAllDropdowns(); roleDropdown.classList.toggle("show"); });
    roleOptions.forEach(opt => {
        opt.addEventListener("click", (e) => {
            e.stopPropagation();
            selectedRole = opt.dataset.value;
            roleLabel.textContent = opt.textContent.replace("✓", "").trim();
            roleDropdown.classList.remove("show");
            roleOptions.forEach(o => o.classList.remove("selected"));
            opt.classList.add("selected");
        });
    });
}

// Map Selector
if(mapTrigger) {
    mapTrigger.addEventListener("click", (e) => { e.stopPropagation(); closeAllDropdowns(); mapDropdown.classList.toggle("show"); });
    mapOptions.forEach(opt => {
        opt.addEventListener("click", async (e) => {
            e.stopPropagation();
            const val = opt.dataset.value;
            if(mapSelectorInput) mapSelectorInput.value = val;
            if(mapLabel) mapLabel.textContent = val;
            mapDropdown.classList.remove("show");
            mapOptions.forEach(o => o.classList.remove("selected"));
            opt.classList.add("selected");
            loadMapData(val);
        });
    });
}

/* ================= 8. INTELLIGENCE DATA LOAD ================= */
function setInputDate(elementId, value) {
    if (!value) return;
    const targetElement = document.getElementById(elementId);
    if (!targetElement) return;

    let dateObj = null;
    if (value && typeof value.toDate === 'function') dateObj = value.toDate();
    else if (value instanceof Date) dateObj = value;
    else if (typeof value === 'string') dateObj = new Date(value);

    if (dateObj && !isNaN(dateObj.getTime())) {
        targetElement.value = dateObj.toISOString().split('T')[0];
    }
}

function findData(dataObj, searchTerms) {
    if (!dataObj) return null;
    const keys = Object.keys(dataObj);
    for (let term of searchTerms) {
        const foundKey = keys.find(k => k.toLowerCase().trim() === term.toLowerCase().trim());
        if (foundKey) return dataObj[foundKey];
    }
    return null;
}

async function loadMapData(mapId) {
    console.log("Loading data for:", mapId);
    ["salesFrom", "salesTo", "expensesFrom", "expensesTo", "roiFrom", "roiTo"].forEach(id => {
        const el = document.getElementById(id); if(el) el.value = '';
    });
    
    try {
        const docRef = doc(db, "maps", mapId); 
        const snap = await getDoc(docRef);

        if (snap.exists()) {
            const d = snap.data();
            const sales = findData(d, ["available sales", "sales"]);
            if (sales) { setInputDate("salesFrom", sales.from); setInputDate("salesTo", sales.to); }

            const exp = findData(d, ["available expenses", "expenses", "ims"]);
            if (exp) { setInputDate("expensesFrom", exp.from); setInputDate("expensesTo", exp.to); }

            const roi = findData(d, ["available roi", "roi"]);
            if (roi) { setInputDate("roiFrom", roi.from); setInputDate("roiTo", roi.to); }
            
            if(mapMsg) { mapMsg.textContent = "Data loaded successfully"; mapMsg.style.color = "#22c55e"; setTimeout(() => mapMsg.textContent = "", 2000); }
        } else {
            if(mapMsg) { mapMsg.textContent = "No data found for this workspace."; mapMsg.style.color = "#fbbf24"; }
        }
    } catch (e) { console.error(e); if(mapMsg) { mapMsg.textContent = "Database Error: " + e.message; mapMsg.style.color = "#ef4444"; } }
}

if(mapConfigForm) {
    mapConfigForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const mapId = mapSelectorInput ? mapSelectorInput.value : null;
        if(!mapId) { if(mapMsg) mapMsg.textContent = "Select workspace first."; return; }
        
        if(mapMsg) { mapMsg.textContent = "Saving..."; mapMsg.style.color = "#38bdf8"; }
        if(saveMapBtn) saveMapBtn.innerHTML = "SAVING...";

        try {
            const getTS = (id) => {
                const el = document.getElementById(id);
                return (el && el.value) ? Timestamp.fromDate(new Date(el.value + "T00:00:00")) : null;
            };

            const updateData = {};
            const sF = getTS("salesFrom"), sT = getTS("salesTo");
            if(sF && sT) updateData["available sales"] = { from: sF, to: sT };

            const eF = getTS("expensesFrom"), eT = getTS("expensesTo");
            if(eF && eT) updateData["available expenses"] = { from: eF, to: eT };

            const rF = getTS("roiFrom"), rT = getTS("roiTo");
            if(rF && rT) updateData["available roi"] = { from: rF, to: rT };

            await setDoc(doc(db, "maps", mapId), updateData, { merge: true });
            if(mapMsg) { mapMsg.textContent = "Saved Successfully!"; mapMsg.style.color = "#22c55e"; setTimeout(() => mapMsg.textContent = "", 3000); }
        } catch(err) { if(mapMsg) { mapMsg.textContent = "Error: " + err.message; mapMsg.style.color = "#ef4444"; } } 
        finally { if(saveMapBtn) saveMapBtn.innerHTML = "UPDATE DATES"; }
    });
}

/* ================= 9. CREATE USER ================= */
if(createForm) {
    createForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        adminMsg.textContent = "Processing..."; adminMsg.style.color = "#38bdf8"; createBtn.classList.add("loading");
        try {
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            
            await setDoc(doc(db, "users", userCred.user.uid), {
                username: document.getElementById("username").value,
                email: email,
                phone: document.getElementById("phone").value,
                role: selectedRole,
                Access: selectedAccess,
                createdAt: new Date().toISOString()
            });

            adminMsg.textContent = "Success! User Created."; adminMsg.style.color = "#22c55e"; createForm.reset();
            selectedAccess = []; accessLabel.textContent = "Select Workspaces...";
            accessOptions.forEach(o=>o.classList.remove("selected"));
            selectedRole = "user"; roleLabel.textContent = "Select Role...";
            roleOptions.forEach(o=>o.classList.remove("selected"));
            await signOut(secondaryAuth);
            setTimeout(() => { adminMsg.textContent = ""; }, 3000);
        } catch (err) { adminMsg.textContent = "Error: " + err.message; adminMsg.style.color = "#ef4444"; }
        finally { createBtn.classList.remove("loading"); }
    });
}

/* ================= 10. LOAD USERS ================= */
if(loadUsersBtn) {
    loadUsersBtn.addEventListener("click", async () => {
        loadUsersBtn.innerHTML = "LOADING..."; 
        usersList.innerHTML = "";
        try {
            const snap = await getDocs(collection(db, "users"));
            loadUsersBtn.innerHTML = "<span>↻</span> REFRESH LIST";
            if(snap.empty) { usersList.innerHTML = "<div style='text-align:center;color:gray;padding:20px'>No users found.</div>"; return; }

            let htmlContent = "";
            snap.forEach(d => {
                const data = d.data();
                const safeData = JSON.stringify({ id: d.id, username: data.username, phone: data.phone, role: data.role, Access: data.Access || [] });
                const tags = (data.Access || []).map(t => `<span style="display: inline-block; background: rgba(255, 255, 255, 0.05); color: #94a3b8; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; margin-right: 6px; margin-bottom: 6px; border: 1px solid rgba(255, 255, 255, 0.1);">${t}</span>`).join("");

                htmlContent += `
                    <div class="user-card-item">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                            <span style="font-weight:700; color:white; font-size:1.1rem; letter-spacing:0.5px;">${data.username || "Unknown Agent"}</span>
                            <span class="role-badge ${data.role==='admin'?'role-admin':'role-user'}">${data.role || 'USER'}</span>
                        </div>
                        <div class="info-row"><span style="opacity:0.5">📧</span> ${data.email}</div>
                        <div class="info-row" style="margin-bottom:15px;"><span style="opacity:0.5">📱</span> ${data.phone || "No Phone"}</div>
                        <div style="margin-bottom:5px;">${tags || '<span style="color:rgba(255,255,255,0.3); font-size:0.8rem; font-style:italic;">No active workspaces</span>'}</div>
                        <div class="card-actions">
                            <button class="edit-btn" data-user='${safeData}'>EDIT PROFILE</button>
                            <button class="delete-btn" data-uid="${d.id}">DELETE</button>
                        </div>
                    </div>`;
            });
            usersList.innerHTML = htmlContent;
        } catch (e) { console.error(e); }
    });
}

/* ================= 11. EDIT & DELETE ACTIONS ================= */
usersList.addEventListener("click", (e) => {
    if (e.target.classList.contains("edit-btn")) {
        const d = JSON.parse(e.target.dataset.user);
        if(editUid) editUid.value = d.id; 
        if(editName) editName.value = d.username; 
        if(editPhone) editPhone.value = d.phone; 
        if(editRole) editRole.value = d.role;
        editAccessCbs.forEach(cb => cb.checked = (d.Access).includes(cb.value));
        if(editModal) editModal.classList.add("open");
    }
    if (e.target.classList.contains("delete-btn")) {
        if(deleteTargetId) deleteTargetId.value = e.target.dataset.uid;
        if(deleteModal) deleteModal.classList.add("open");
    }
});
if(closeModalBtn) closeModalBtn.onclick = () => editModal.classList.remove("open");
if(saveEditBtn) saveEditBtn.onclick = async () => {
    const acc = []; editAccessCbs.forEach(cb => { if(cb.checked) acc.push(cb.value); });
    if(editUid && editUid.value) {
        await updateDoc(doc(db, "users", editUid.value), { username: editName.value, phone: editPhone.value, role: editRole.value, Access: acc });
        editModal.classList.remove("open"); 
        if(loadUsersBtn) loadUsersBtn.click();
    }
};
if(cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", () => deleteModal.classList.remove("open"));
if(confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async () => {
        const uid = deleteTargetId ? deleteTargetId.value : null;
        if(uid) {
            confirmDeleteBtn.innerHTML = "DELETING...";
            try {
                await deleteDoc(doc(db, "users", uid));
                deleteModal.classList.remove("open");
                if(loadUsersBtn) loadUsersBtn.click(); 
            } catch(err) { alert("Error: " + err.message); } 
            finally { confirmDeleteBtn.innerHTML = "YES, DELETE"; }
        }
    });
}

/* ================= 12. FAST MAP ENGINE (NO FETCH CHECK) ================= */

const mapOverlay = document.getElementById('mapOverlay');
const mapFrame = document.getElementById('mapFrame');
const mapLoader = document.getElementById('mapLoader'); 
const closeMapBtn = document.getElementById('closeMapBtn');
const mapTitleDisplay = document.getElementById('mapTitleDisplay');
const warningModal = document.getElementById('warningModal');
const warningModalCloseBtn = document.getElementById('warningModalCloseBtn');

function openWarning() { if(warningModal) warningModal.classList.add('open'); }
if(warningModalCloseBtn) warningModalCloseBtn.addEventListener('click', () => { if(warningModal) warningModal.classList.remove('open'); });

// 🟢 TURBO LAUNCHER: Removed the "fetch(HEAD)" block entirely
function openMapInApp(mapUrl, mapName) {
    if (!mapOverlay || !mapFrame) return;

    mapFrame.style.opacity = '0';
    mapLoader.style.display = 'flex';
    if(mapTitleDisplay) mapTitleDisplay.textContent = mapName || "Map View";
    mapOverlay.classList.add('active');

    // ⚡ INSTANT LOAD
    mapFrame.src = mapUrl; 
    
    mapFrame.onload = () => {
        mapLoader.style.display = 'none';
        mapFrame.style.opacity = '1';
    };

    history.pushState({ view: 'map' }, null, '#map');
}

function closeMapInApp() {
    if (!mapOverlay) return;
    mapOverlay.classList.remove('active');
    setTimeout(() => { mapFrame.src = ''; }, 300);
}

if (closeMapBtn) {
    closeMapBtn.addEventListener('click', () => {
        closeMapInApp();
        if (window.location.hash === '#map') history.replaceState(null, null, window.location.pathname);
    });
}
window.addEventListener('popstate', (event) => {
    if (!document.location.hash.includes('map')) closeMapInApp();
});

document.addEventListener('click', (e) => {
    const btn = e.target.closest('.launch-map-btn');
    if (btn) {
        e.preventDefault();
        const url = btn.dataset.url; 
        const titleSpan = btn.querySelector('.title') || btn.getAttribute('data-title');
        const name = titleSpan.textContent || titleSpan || "Analysis Map";
        
        if(url) openMapInApp(url, name);
        else openWarning();
    }
});