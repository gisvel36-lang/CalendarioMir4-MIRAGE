// Boss Data
const bossData = [
    { world: 'W7', level: '141+', location: 'Desfiladero de la Lúnula de Sangre (3F)', boss: 'Mirage de Navio', time: '22:00' },
    { world: 'W8', level: '≤140', location: 'Mina Abandonada (3F)', boss: 'Mirage de Navio', time: '00:00' },
    { world: 'W2', level: '143+', location: 'Pico del Camino Celeste', boss: 'Mirage de Navio', time: '22:00' },
    { world: 'W5', level: '143+', location: 'Templo Ilusorio', boss: 'Mirage de Navio', time: '00:00' },
    { world: 'W3', level: '150+', location: 'Túmulo de Rockut', boss: 'Mirage de Navio', time: '22:00' },
    { world: 'W1', level: '≤140', location: 'Templo del Toro Demoniaco (3F)', boss: 'Mirage de Navio', time: '22:00' },
    { world: 'W4', level: '141+', location: 'Paraíso de las Espadas (2F)', boss: 'Mirage de Navio', time: '00:00' },
    { world: 'W6', level: '150+', location: 'Laberinto de Bicheon', boss: 'Mirage de Navio', time: '00:00' }
];

// State
let currentLanguage = 'es';
let currentTimezone = -3;
let showDefeated = false;
let defeatedBosses = new Set();
let alarms = new Map();

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    renderTable();
    setupEventListeners();
    updateTimes();
    setInterval(updateTimes, 1000);
});

// Event Listeners
function setupEventListeners() {
    document.getElementById('timezone').addEventListener('change', (e) => {
        currentTimezone = parseInt(e.target.value);
        localStorage.setItem('timezone', currentTimezone);
        renderTable();
        updateTimes();
    });

    document.getElementById('language').addEventListener('change', (e) => {
        currentLanguage = e.target.value;
        localStorage.setItem('language', currentLanguage);
        updateLanguage();
    });

    document.getElementById('toggleDefeated').addEventListener('click', (e) => {
        showDefeated = !showDefeated;
        e.target.classList.toggle('active', showDefeated);
        renderTable();
    });

    document.getElementById('exportPdf').addEventListener('click', exportToPDF);
    document.getElementById('exportImage').addEventListener('click', exportToImage);

    document.getElementById('selectAll').addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.checkbox-row');
        checkboxes.forEach(cb => {
            if (e.target.checked) {
                defeatedBosses.add(cb.dataset.world);
                cb.checked = true;
            } else {
                defeatedBosses.delete(cb.dataset.world);
                cb.checked = false;
            }
        });
        localStorage.setItem('defeatedBosses', JSON.stringify(Array.from(defeatedBosses)));
        renderTable();
    });

    // Modal close
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('alarmModal')) {
            closeModal();
        }
    });

    document.getElementById('setAlarmBtn').addEventListener('click', setAlarm);
}

// Render Table
function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    bossData.forEach((boss, index) => {
        const isDefeated = defeatedBosses.has(boss.world);
        if (!showDefeated && isDefeated) return;

        const row = document.createElement('tr');
        row.className = isDefeated ? 'defeated' : '';
        row.dataset.index = index;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'checkbox-select checkbox-row';
        checkbox.dataset.world = boss.world;
        checkbox.checked = isDefeated;
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                defeatedBosses.add(boss.world);
            } else {
                defeatedBosses.delete(boss.world);
            }
            localStorage.setItem('defeatedBosses', JSON.stringify(Array.from(defeatedBosses)));
            renderTable();
        });

        const timeWithTimezone = calculateTimezone(boss.time);
        const alarmKey = `${boss.world}-${boss.time}`;
        const hasAlarm = alarms.has(alarmKey);

        row.innerHTML = `
            <td>${checkbox.outerHTML}</td>
            <td><strong>${boss.world}</strong></td>
            <td>${boss.level}</td>
            <td>${boss.location}</td>
            <td>${boss.boss}</td>
            <td>
                <div class="time-info">
                    <span class="original-time">UTC: ${boss.time}</span><br>
                    <span class="local-time">Local: ${timeWithTimezone}</span>
                </div>
            </td>
            <td>
                <div class="row-actions">
                    <button class="btn-small btn-alarm ${hasAlarm ? 'set' : ''}" onclick="openAlarmModal('${boss.world}', '${boss.boss}')">
                        ${hasAlarm ? '<i class="fas fa-check"></i> Alarma' : '<i class="fas fa-bell"></i> Alarma'}
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Calculate Timezone
function calculateTimezone(time) {
    const [hours, minutes] = time.split(':').map(Number);
    let newHours = hours + currentTimezone;

    // Adjust for UTC
    newHours += 3; // Reference timezone

    if (newHours >= 24) {
        newHours -= 24;
    } else if (newHours < 0) {
        newHours += 24;
    }

    return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Update Times
function updateTimes() {
    // Real-time updates can be added here
}

// Alarm Functions
function openAlarmModal(world, boss) {
    const modal = document.getElementById('alarmModal');
    document.getElementById('alarmBossName').textContent = `${world} - ${boss}`;
    modal.classList.add('active');
    modal.dataset.currentBoss = world;
}

function closeModal() {
    document.getElementById('alarmModal').classList.remove('active');
}

function setAlarm() {
    const minutes = parseInt(document.querySelector('input[name="alarmType"]:checked').value);
    const world = document.getElementById('alarmModal').dataset.currentBoss;
    const boss = bossData.find(b => b.world === world);

    if (boss) {
        const alarmKey = `${world}-${boss.time}`;
        alarms.set(alarmKey, {
            world,
            boss: boss.boss,
            time: boss.time,
            minutes
        });
        localStorage.setItem('alarms', JSON.stringify(Array.from(alarms)));
        showNotification(`Alarma configurada para ${world} - ${minutes} minutos antes`);
        closeModal();
        renderTable();
        scheduleAlarm(alarmKey, boss, minutes);
    }
}

function scheduleAlarm(key, boss, minutesBefore) {
    // Schedule notification
    const interval = setInterval(() => {
        const now = new Date();
        const currentTime = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
        const bossTime = boss.time;
        
        const [bossH, bossM] = bossTime.split(':').map(Number);
        const [nowH, nowM] = currentTime.split(':').map(Number);
        
        const bossTotalMinutes = bossH * 60 + bossM;
        const nowTotalMinutes = nowH * 60 + nowM;
        const diffMinutes = bossTotalMinutes - nowTotalMinutes;
        
        if (diffMinutes === minutesBefore) {
            showNotification(`¡ALARMA! ${boss.world} - ${boss.boss} en ${minutesBefore} minutos`, 'alarm');
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('MIR4 Alarma', {
                    body: `${boss.world} - ${boss.boss} en ${minutesBefore} minutos`,
                    icon: 'https://vvrl.cc/es/i543v8/logo-mir4.png'
                });
            }
        }
    }, 1000);
}

// Notification
function showNotification(message, type = 'info') {
    const area = document.getElementById('notificationsArea');
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-${type === 'alarm' ? 'bell' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    area.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Export Functions
function exportToPDF() {
    const element = document.querySelector('.calendar-section');
    const opt = {
        margin: 10,
        filename: 'MIR4_Calendario_Navio.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
    };
    html2pdf().set(opt).from(element).save();
    showNotification('PDF exportado correctamente');
}

function exportToImage() {
    const element = document.querySelector('.calendar-section');
    html2canvas(element, {
        backgroundColor: '#050810',
        scale: 2
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'MIR4_Calendario_Navio.png';
        link.href = canvas.toDataURL();
        link.click();
        showNotification('Imagen exportada correctamente');
    });
}

// Language
function updateLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = getTranslation(key);
    });
    renderTable();
}

// Local Storage
function loadSettings() {
    const saved = {
        language: localStorage.getItem('language') || 'es',
        timezone: localStorage.getItem('timezone') || '-3',
        defeated: localStorage.getItem('defeatedBosses') || '[]',
        alarms: localStorage.getItem('alarms') || '[]'
    };

    currentLanguage = saved.language;
    currentTimezone = parseInt(saved.timezone);
    defeatedBosses = new Set(JSON.parse(saved.defeated));
    alarms = new Map(JSON.parse(saved.alarms));

    document.getElementById('language').value = currentLanguage;
    document.getElementById('timezone').value = currentTimezone;
    updateLanguage();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Translation Helper
function getTranslation(key) {
    const translations = window.translations || {};
    return translations[currentLanguage]?.[key] || key;
}