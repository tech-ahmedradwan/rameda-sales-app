// --- 1. STARFIELD ENGINE (SAFE MODE) ---
const starCanvas = document.getElementById('canvas-stars');
if (starCanvas) {
    const starCtx = starCanvas.getContext('2d');
    let stars = [];

    const createStars = () => {
        stars = [];
        starCanvas.width = window.innerWidth;
        starCanvas.height = window.innerHeight;
        for(let i=0; i<150; i++) {
            stars.push({
                x: Math.random() * starCanvas.width,
                y: Math.random() * starCanvas.height,
                size: Math.random() * 1.5,
                speed: Math.random() * 0.5 + 0.2
            });
        }
    };

    const drawStars = () => {
        starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
        starCtx.fillStyle = "rgba(56, 189, 248, 0.5)";
        stars.forEach(s => {
            starCtx.beginPath();
            starCtx.arc(s.x, s.y, s.size, 0, Math.PI*2);
            starCtx.fill();
            s.y -= s.speed;
            if(s.y < 0) s.y = starCanvas.height;
        });
        requestAnimationFrame(drawStars);
    };

    // Init
    createStars();
    drawStars();

    // Resize
    window.addEventListener('resize', () => {
        starCanvas.width = window.innerWidth;
        starCanvas.height = window.innerHeight;
        createStars(); 
    });
}

// --- 2. EGYPT ZONE NODES (LOGIN PAGE ONLY) ---
const zoneCanvas = document.getElementById('canvas-zones');
if (zoneCanvas) {
    const zoneCtx = zoneCanvas.getContext('2d');

    const zones = [
        {x: 300, y: 120, label: 'Cairo'},
        {x: 250, y: 100, label: 'Alexandria'},
        {x: 310, y: 150, label: 'Giza'},
        {x: 350, y: 350, label: 'Luxor'},
        {x: 380, y: 450, label: 'Aswan'}
    ];

    const drawZones = () => {
        zoneCtx.clearRect(0, 0, zoneCanvas.width, zoneCanvas.height);
        const time = Date.now() * 0.002;

        zones.forEach(z => {
            const pulse = Math.abs(Math.sin(time)) * 10;
            
            zoneCtx.beginPath();
            zoneCtx.arc(z.x, z.y, 5 + pulse, 0, Math.PI*2);
            zoneCtx.strokeStyle = "rgba(56, 189, 248, 0.2)";
            zoneCtx.stroke();

            zoneCtx.beginPath();
            zoneCtx.arc(z.x, z.y, 3, 0, Math.PI*2);
            zoneCtx.fillStyle = "#38bdf8";
            zoneCtx.fill();
        });
        requestAnimationFrame(drawZones);
    };
    
    drawZones();

    window.addEventListener('resize', () => {
        if (window.innerWidth < 768) {
            zoneCanvas.width = window.innerWidth;
        } else {
            zoneCanvas.width = 600;
        }
    });
}

// --- 3. ROBOT LOOK-AT BEHAVIOR (UNIVERSAL) ---
document.addEventListener('mousemove', (e) => {
    const robotMove = document.getElementById('robot-move');
    if (!robotMove) return;

    const rect = robotMove.getBoundingClientRect();
    const robotCenterX = rect.left + rect.width / 2;
    const robotCenterY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - robotCenterX) / 25;
    const deltaY = (e.clientY - robotCenterY) / 25;

    const maxX = 15; 
    const constrainedX = Math.max(-maxX, Math.min(maxX, deltaX));
    const constrainedY = Math.max(-maxX, Math.min(maxX, deltaY));

    requestAnimationFrame(() => {
        robotMove.style.transform = `
            rotateX(${-constrainedY}deg) 
            rotateY(${constrainedX}deg) 
            translate(${constrainedX * 0.5}px, ${constrainedY * 0.5}px)
        `;
    });
});

// --- 4. PASSWORD TOGGLE (UPDATED) ---
// const togglePassword = document.querySelector('#togglePassword');
// const passwordInput = document.querySelector('#password');

// if (togglePassword && passwordInput) {
//     togglePassword.addEventListener('click', function () {
//         // Toggle the Type
//         const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
//         passwordInput.setAttribute('type', type);
        
//         // Toggle the Icon Visuals
//         if (type === 'text') {
//             this.style.color = '#38bdf8'; // Active Blue
//             // Change to "Eye Off" Icon
//             this.innerHTML = `
//                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
//                 </svg>
//             `;
//         } else {
//             this.style.color = 'rgba(255, 255, 255, 0.4)'; // Inactive Grey
//             // Change back to "Eye On" Icon
//             this.innerHTML = `
//                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                 </svg>
//             `;
//         }
//     });

// }

const togglePassword = document.querySelector('#togglePassword');
const passwordInput = document.querySelector('#password');

togglePassword.addEventListener('click', function () {
    // Toggle the type attribute
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Optional: Toggle icon opacity or color when active
    this.style.opacity = type === 'text' ? '1' : '0.6';
    this.style.color = type === 'text' ? '#38bdf8' : '#fbbf24'; // Switch to blue when visible
});
