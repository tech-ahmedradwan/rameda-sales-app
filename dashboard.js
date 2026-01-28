/* -----------------------------------------
   RAMEDA AI | DASHBOARD CONTROLLER (UNIFIED)
   -----------------------------------------
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= CONFIG ================= */
const firebaseConfig = {
  apiKey: "AIzaSyAxlWe8HftfYeQvmE2W8TyXJapp5qERa4E",
  authDomain: "rameda-sales.firebaseapp.com",
  projectId: "rameda-sales",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🟢 EXPERT: Defined Map Sources Logic (Moved from HTML to here)
const MAP_SOURCES = {
    "Speciality care 1": {
        sales: "sales_maps/SC1SalesAnalysisMap/index.html",
        ims: "IMS/index.html",
        roi: "ROI/SC1ROIMap/index.html"
    },
    "Speciality Care 2": {
        sales: "sales_maps/SC2SalesAnalysisMap/index.html",
        ims: "IMS/index.html",
        roi: null 
    },
    "Primary care 1": {
        sales: "sales_maps/PCSalesAnalysisMap/index.html",
        ims: "IMS/index.html",
        roi: "ROI/PCROIMap/index.html"
    },
    "Other sales": {
        sales: "sales_maps/OtherSalesAnalysisMap/index.html",
        ims: "IMS/index.html",
        roi: null
    }
};

/* ================= STATE ================= */
// We use 'expenses' internally for logic, but it maps to the IMS button
let activeMapPermissions = { sales: false, expenses: false, roi: false };

/* ================= PAGE REVEAL & VISUALS ================= */
window.addEventListener('load', () => {
    const loader = document.getElementById("app-loader");
    if(loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
    }
});

// 🟢 ROBOT EYE TRACKING
document.addEventListener('mousemove', (e) => {
    const robot = document.getElementById('robot');
    if (!robot) return;
    const eyes = robot.querySelectorAll('.robot-eye');
    const rect = robot.getBoundingClientRect();
    const robotX = rect.left + rect.width / 2;
    const robotY = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - robotY, e.clientX - robotX);
    const distance = Math.min(5, Math.hypot(e.clientX - robotX, e.clientY - robotY) / 20);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    eyes.forEach(eye => { eye.style.transform = `translate(${x}px, ${y}px)`; });
});

// Star Animation
(function initStars() {
    const starCanvas = document.getElementById('canvas-stars');
    if (!starCanvas) return;
    const starCtx = starCanvas.getContext('2d');
    const createStars = () => {
        starCanvas.width = window.innerWidth;
        starCanvas.height = window.innerHeight;
    };
    createStars();
    window.addEventListener('resize', createStars);
})();

/* ================= ELEMENTS ================= */
const logoutBtn = document.getElementById("logoutBtn");
const dropdownTrigger = document.getElementById("dropdownTrigger");
const dropdownOptionsContainer = document.getElementById("dropdownOptions");
const dropdownText = document.getElementById("dropdownText");
const dropdownContainer = document.querySelector('.custom-select');
const mapActions = document.getElementById("mapActions");
const dataStatus = document.getElementById("dataStatus");
const warningModal = document.getElementById("warningModal");
const modalCloseBtn = document.getElementById("modalCloseBtn");

// Dates
const salesDateEl = document.getElementById("salesDate");
const expenseDateEl = document.getElementById("expenseDate");
const roiDateEl = document.getElementById("roiDate");

// Map Overlay & Loaders
const mapOverlay = document.getElementById('mapOverlay');
const mapFrame = document.getElementById('mapFrame');
const mapLoader = document.getElementById('mapLoader');
const closeMapBtn = document.getElementById('closeMapBtn');
const mapTitleDisplay = document.getElementById('mapTitleDisplay');

/* ================= 🟢 AUTH & DYNAMIC DROPDOWN ================= */
if(logoutBtn) {
    logoutBtn.onclick = async () => { await signOut(auth); location.href = "index.html"; };
}

onAuthStateChanged(auth, async user => {
    if (!user) {
        location.href = "index.html";
        return;
    }

    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const userAccess = userData.Access || []; 
            populateDropdown(userAccess);
        } else {
            alert("User profile not found. Contact Admin.");
        }
    } catch (e) {
        console.error("Auth Error:", e);
    }
});

function populateDropdown(accessList) {
    dropdownOptionsContainer.innerHTML = ""; 

    if (accessList.length === 0) {
        dropdownText.innerText = "No Access Assigned";
        return;
    }

    accessList.forEach(workspaceName => {
        const div = document.createElement("div");
        div.className = "custom-option";
        div.textContent = workspaceName;
        div.setAttribute("data-val", workspaceName);
        div.addEventListener("click", (e) => handleOptionClick(e, workspaceName));
        dropdownOptionsContainer.appendChild(div);
    });
}

/* ================= LOGIC HANDLERS ================= */

if(dropdownTrigger) {
    dropdownTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownContainer.classList.toggle('open');
    });
}
window.addEventListener('click', () => dropdownContainer?.classList.remove('open'));

function formatPeriod(dataObj) {
    if (!dataObj) return null; 
    try {
        let fromDate, toDate;
        if(dataObj.from && dataObj.from.seconds) fromDate = new Date(dataObj.from.seconds * 1000);
        else if(typeof dataObj.from === 'string') fromDate = new Date(dataObj.from);
        
        if(dataObj.to && dataObj.to.seconds) toDate = new Date(dataObj.to.seconds * 1000);
        else if(typeof dataObj.to === 'string') toDate = new Date(dataObj.to);

        if (fromDate && toDate) {
            const fStr = `${String(fromDate.getMonth()+1).padStart(2,'0')}-${fromDate.getFullYear()}`;
            const tStr = `${String(toDate.getMonth()+1).padStart(2,'0')}-${toDate.getFullYear()}`;
            return `${fStr} To ${tStr}`;
        }
        return null;
    } catch (e) { return null; }
}

function findData(dataObj, searchTerms) {
    if(!dataObj) return null;
    const keys = Object.keys(dataObj);
    for (let term of searchTerms) {
        const foundKey = keys.find(k => k.toLowerCase().trim() === term.toLowerCase().trim());
        if (foundKey) return dataObj[foundKey];
    }
    return null;
}

// 🟢 LOAD DATA WHEN WORKSPACE SELECTED
async function handleOptionClick(e, role) {
    e.stopPropagation();
    
    dropdownText.innerText = role;
    dropdownText.style.color = "#38bdf8";
    dropdownContainer.classList.remove('open');
    
    mapActions.classList.remove('hidden');
    dataStatus.classList.remove('hidden');
    
    // Reset Labels
    salesDateEl.innerText = "Scanning...";
    expenseDateEl.innerText = "Scanning...";
    roiDateEl.innerText = "Scanning...";

    // Reset Permissions
    activeMapPermissions = { sales: false, expenses: false, roi: false };

    try {
        const docRef = doc(db, "maps", role);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // 1. Check Sales
            const salesStr = formatPeriod(findData(data, ["available sales", "sales", "sales_dates"]));
            if(salesStr) { salesDateEl.innerText = salesStr; activeMapPermissions.sales = true; } 
            else { salesDateEl.innerText = "--"; }

            // 2. Check Expenses (Links to IMS/index.html)
            const expStr = formatPeriod(findData(data, ["available expenses", "expenses", "available ims", "ims"]));
            if(expStr) { expenseDateEl.innerText = expStr; activeMapPermissions.expenses = true; } 
            else { expenseDateEl.innerText = "--"; }

            // 3. Check ROI
            const roiStr = formatPeriod(findData(data, ["available roi", "roi"]));
            if(roiStr) { roiDateEl.innerText = roiStr; activeMapPermissions.roi = true; } 
            else { roiDateEl.innerText = "--"; }

        } else {
            salesDateEl.innerText = "No Data";
            expenseDateEl.innerText = "No Data";
            roiDateEl.innerText = "No Data";
        }
    } catch (err) {
        console.error(err);
        salesDateEl.innerText = "Error";
    }
    
    updateButtonVisuals();
}

function updateButtonVisuals() {
    const setVisual = (id, active) => {
        const btn = document.getElementById(id);
        if(btn) {
            btn.style.opacity = active ? "1" : "0.5";
            btn.style.cursor = active ? "pointer" : "not-allowed";
        }
    };
    
    setVisual('btn-sales', activeMapPermissions.sales);
    setVisual('btn-IMS', activeMapPermissions.expenses); 
    setVisual('btn-roi', activeMapPermissions.roi);
}

/* ================= 🟢 UNIFIED MAP LAUNCHER ================= */

function triggerWarning() {
    if(warningModal) warningModal.classList.add('open');
}

// 🟢 NEW: Main Launch Function (Replaces fuzzy logic)
function launchMap(mapType, titleLabel) {
    
    // 1. Get Selected Workspace Name
    const currentSelection = dropdownText.innerText.trim();
    if(currentSelection === "Select Workspace" || currentSelection === "No Access Assigned") {
        alert("Please select a workspace first.");
        return;
    }

    // 2. Check Database Permissions First
    // mapType is 'sales', 'expenses', or 'roi'
    if (!activeMapPermissions[mapType]) {
        console.warn(`Access denied or data missing for: ${mapType}`);
        triggerWarning();
        return;
    }

    // 3. Lookup Source URL (Using the Safe Config Object)
    // Note: expenses in DB logic maps to 'ims' in MAP_SOURCES config
    const configKey = mapType === 'expenses' ? 'ims' : mapType;
    
    const selectionData = MAP_SOURCES[currentSelection];

    if (!selectionData || !selectionData[configKey]) {
        console.warn(`No URL configured for ${currentSelection} -> ${configKey}`);
        triggerWarning();
        return;
    }

    const url = selectionData[configKey];
    const fullTitle = `${titleLabel} (${currentSelection})`;

    openMapInApp(url, fullTitle);
}


async function openMapInApp(mapUrl, mapName) {
    if (!mapOverlay || !mapFrame) return;

    // Reset iframe state
    mapFrame.style.opacity = '0';
    mapLoader.style.display = 'flex'; // Show spinner
    
    // Open Overlay
    mapOverlay.classList.add('active');
    if(mapTitleDisplay) mapTitleDisplay.textContent = mapName;

    // Load URL
    mapFrame.src = mapUrl + "?source=dashboard"; 
    
    // Handle Load Event (Hide Spinner)
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


/* ================= 🟢 SAFE EVENT LISTENERS ================= */

const btnSales = document.getElementById('btn-sales');
if (btnSales) {
    btnSales.addEventListener('click', () => launchMap('sales', 'Sales Analysis'));
}

const btnIMS = document.getElementById('btn-IMS'); 
if (btnIMS) {
    // Maps to 'expenses' logic/permission
    btnIMS.addEventListener('click', () => launchMap('expenses', 'IMS Data'));
}

const btnRoi = document.getElementById('btn-roi');
if (btnRoi) {
    btnRoi.addEventListener('click', () => launchMap('roi', 'ROI Metrics'));
}

if(modalCloseBtn) modalCloseBtn.onclick = () => warningModal.classList.remove('open');

if (closeMapBtn) {
    closeMapBtn.addEventListener('click', () => {
        closeMapInApp();
        if (window.location.hash === '#map') {
            history.replaceState(null, null, window.location.pathname);
        }
    });
}

window.addEventListener('popstate', (event) => {
    if (!document.location.hash.includes('map')) closeMapInApp();
});

