let currentDate = new Date();
let dashboardCurrentDate = new Date();
let historicoDate = new Date();
let habits = [];

// Índice do hábito sendo editado/apagado
let currentHabitIndex = -1;

// Página atual
let currentPage = 'registros';

// Chart instances
let chartWeek, chartMonth, chartYear, chartHistoricoWeek, chartHistoricoYear;

// Carregar hábitos do servidor
function loadHabits() {
    fetch('/api/habits')
        .then(response => response.json())
        .then(data => {
            habits = data.habits;
            renderHabits();
            updateDashboard();
        })
        .catch(error => console.error('Erro ao carregar hábitos:', error));
}

// Salvar hábitos no servidor
function saveHabits() {
    fetch('/api/habits', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ habits })
    })
    .catch(error => console.error('Erro ao salvar hábitos:', error));
}

// Renderizar a vista de calendário de hábitos
function renderHabits() {
    const view = document.getElementById('calendar-view');
    view.innerHTML = '';

    const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    habits.forEach((habit, index) => {
        const habitDiv = document.createElement('div');
        habitDiv.classList.add('habit-calendar');

        const headerDiv = document.createElement('div');
        headerDiv.classList.add('habit-header');
        const nameSpan = document.createElement('h4');
        nameSpan.textContent = habit.name;
        const actionsDiv = document.createElement('div');
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Editar';
        editBtn.classList.add('edit-btn');
        editBtn.addEventListener('click', () => openEditModal(index));
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Apagar';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.addEventListener('click', () => openDeleteModal(index));
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        headerDiv.appendChild(nameSpan);
        headerDiv.appendChild(actionsDiv);
        habitDiv.appendChild(headerDiv);

        const table = document.createElement('table');
        table.classList.add('calendar-table');

        // Header for days
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        for (let day = 1; day <= daysInMonth; day++) {
            const th = document.createElement('th');
            th.textContent = day;
            headerRow.appendChild(th);
        }
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Body
        const tbody = document.createElement('tbody');
        const row = document.createElement('tr');

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('checkbox');
            if (!habit.days[currentMonthKey]) habit.days[currentMonthKey] = [];
            checkbox.checked = habit.days[currentMonthKey].includes(day);
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    if (!habit.days[currentMonthKey].includes(day)) habit.days[currentMonthKey].push(day);
                } else {
                    habit.days[currentMonthKey] = habit.days[currentMonthKey].filter(d => d !== day);
                }
                saveHabits();
                renderHabits();
                updateDashboard();
            });
            cell.appendChild(checkbox);
            row.appendChild(cell);
        }

        tbody.appendChild(row);
        table.appendChild(tbody);
        habitDiv.appendChild(table);
        view.appendChild(habitDiv);
    });
}

// Função auxiliar para obter o índice do dia (considerando o mês atual)
function getDayIndex(day) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();  // Domingo = 0
    const startDate = new Date(year, month, 1 - firstDayOfWeek);
    const actualDay = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
    return actualDay.getDate();
}

// Navegação entre meses
document.getElementById('prev-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    dashboardCurrentDate = new Date(currentDate);
    updateMonthDisplay();
    renderHabits();  // Re-renderizar para o novo mês
    if (currentPage === 'dashboard') updateDashboard();
});

document.getElementById('next-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    dashboardCurrentDate = new Date(currentDate);
    updateMonthDisplay();
    renderHabits();  // Re-renderizar para o novo mês
    if (currentPage === 'dashboard') updateDashboard();
});

function updateMonthDisplay() {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const year = currentDate.getFullYear();
    const month = months[currentDate.getMonth()];
    document.getElementById('current-month').textContent = `${month} ${year}`;
    if (currentPage === 'dashboard') {
        document.getElementById('dashboard-month-display').textContent = `${month} ${year}`;
    }
}

function updateDashboardMonthDisplay() {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const year = dashboardCurrentDate.getFullYear();
    const month = months[dashboardCurrentDate.getMonth()];
    document.getElementById('dashboard-month-display').textContent = `${month} ${year}`;
    document.getElementById('dashboard-month').textContent = `${month} ${year}`;
}

// Modal para adicionar hábito
document.getElementById('add-habit-btn').addEventListener('click', () => {
    document.getElementById('add-habit-modal').style.display = 'flex';
});

document.getElementById('save-habit-btn').addEventListener('click', () => {
    const habitName = document.getElementById('habit-name-input').value.trim();
    if (habitName) {
        // Envia apenas o novo hábito para o backend
        const newHabit = { name: habitName, days: {} };
        fetch('/api/habits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ habits: [newHabit] }) // Envia como uma lista
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                loadHabits(); // Recarrega todos os hábitos para garantir a sincronização
            }
        })
        .catch(error => console.error('Erro ao salvar novo hábito:', error));
    }
    closeModal();
});

document.getElementById('close-modal').addEventListener('click', closeModal);
document.getElementById('close-edit-modal').addEventListener('click', closeEditModal);
document.getElementById('confirm-edit-btn').addEventListener('click', confirmEdit);
document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);
document.getElementById('cancel-delete-btn').addEventListener('click', closeDeleteModal);

// Fechar modais ao pressionar ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeEditModal();
        closeDeleteModal();
    }
});

function closeModal() {
    document.getElementById('add-habit-modal').style.display = 'none';
    document.getElementById('habit-name-input').value = '';
}

function closeEditModal() {
    document.getElementById('edit-habit-modal').style.display = 'none';
    document.getElementById('edit-habit-name-input').value = '';
}

function closeDeleteModal() {
    document.getElementById('delete-habit-modal').style.display = 'none';
}

function openEditModal(index) {
    currentHabitIndex = index;
    const habitName = habits[index].name;
    document.getElementById('edit-habit-name-input').value = habitName;
    document.getElementById('edit-habit-modal').style.display = 'flex';
}

function confirmEdit() {
    const newName = document.getElementById('edit-habit-name-input').value.trim();
    if (newName && newName !== habits[currentHabitIndex].name) {
        habits[currentHabitIndex].name = newName;
        saveHabits();
        renderHabits();
        updateDashboard();
    }
    closeEditModal();
}

function openDeleteModal(index) {
    currentHabitIndex = index;
    document.getElementById('delete-habit-modal').style.display = 'flex';
}

function confirmDelete() {
    if (currentHabitIndex !== -1) {
        habits.splice(currentHabitIndex, 1);
        saveHabits();
        renderHabits();
        updateDashboard();
    }
    closeDeleteModal();
}

// Navegação de páginas
document.getElementById('dashboard-link').addEventListener('click', () => {
    dashboardCurrentDate = new Date();
    showPage('dashboard');
});

document.getElementById('registros-link').addEventListener('click', () => {
    showPage('registros');
});

document.getElementById('historico-link').addEventListener('click', () => {
    showPage('historico');
});

// Navegação historico
document.getElementById('historico-prev-month').addEventListener('click', () => {
    historicoDate.setMonth(historicoDate.getMonth() - 1);
    updateHistoricoMonthDisplay();
    renderHistoricoMonth();
});

document.getElementById('historico-next-month').addEventListener('click', () => {
    historicoDate.setMonth(historicoDate.getMonth() + 1);
    updateHistoricoMonthDisplay();
    renderHistoricoMonth();
});

// Navegação dashboard removida

function showPage(page) {
    document.getElementById('dashboard').style.display = page === 'dashboard' ? 'block' : 'none';
    document.getElementById('registros').style.display = page === 'registros' ? 'block' : 'none';
    document.getElementById('historico').style.display = page === 'historico' ? 'block' : 'none';
    document.getElementById('dashboard-link').classList.toggle('active', page === 'dashboard');
    document.getElementById('registros-link').classList.toggle('active', page === 'registros');
    document.getElementById('historico-link').classList.toggle('active', page === 'historico');
    currentPage = page;
    if (page === 'historico') {
        historicoDate.setMonth(new Date().getMonth() - 1);
        updateHistoricoMonthDisplay();
        renderHistoricoMonth();
    }
}

// Atualizar dashboard
function updateDashboard() {
    const currentMonthKey = `${dashboardCurrentDate.getFullYear()}-${String(dashboardCurrentDate.getMonth() + 1).padStart(2, '0')}`;
    const thisWeek = getDashboardWeek();  // semana do mês dashboard viewed
    let habitsThisWeek = 0;
    let habitsThisMonth = 0;
    let longestStreak = 0;
    let habitWithStreak = '';
    const daysInMonth = new Date(dashboardCurrentDate.getFullYear(), dashboardCurrentDate.getMonth() + 1, 0).getDate();
    const expectedMonth = habits.length * daysInMonth;
    const realToday = new Date();
    const realMonthKey = `${realToday.getFullYear()}-${String(realToday.getMonth() + 1).padStart(2, '0')}`;
    let habitsToday = 0;

    habits.forEach(habit => {
        const monthDays = (habit.days && habit.days[currentMonthKey]) || [];
        habitsThisWeek += monthDays.filter(day => thisWeek.includes(day)).length;
        habitsThisMonth += monthDays.length;
        // For today
        const todayDays = (habit.days && habit.days[realMonthKey]) || [];
        if (todayDays.includes(realToday.getDate())) habitsToday++;
        // Calcular streak: maior sequência consecutiva
        const sortedDays = monthDays.sort((a, b) => a - b);
        let streak = 0;
        let maxStreak = 0;
        for (let i = 0; i < sortedDays.length; i++) {
            if (i === 0 || sortedDays[i] !== sortedDays[i-1] + 1) {
                streak = 1;
            } else {
                streak++;
            }
            maxStreak = Math.max(maxStreak, streak);
        }
        if (maxStreak > longestStreak) {
            longestStreak = maxStreak;
            habitWithStreak = habit.name;
        }
    });

    document.getElementById('habits-today').textContent = `${habitsToday} / ${habits.length}`;
    document.getElementById('habits-month').textContent = `${habitsThisMonth} / ${expectedMonth}`;
    document.getElementById('longest-streak').textContent = longestStreak > 0 ? `${habitWithStreak}: ${longestStreak} dias` : '0 dias';

    // Gráfico 1: Esta semana
    if (chartWeek) chartWeek.destroy();
    chartWeek = new Chart(document.getElementById('chart-week'), {
        type: 'bar',
        data: {
            labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Hábitos Completados',
                data: thisWeek.map(day => {
                    let count = 0;
                    habits.forEach(habit => {
                        const monthDays = (habit.days && habit.days[currentMonthKey]) || [];
                        if (monthDays.includes(day)) count++;
                    });
                    return count;
                }),
                backgroundColor: 'rgba(255, 159, 64, 0.5)',
            }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });

    // Gráfico 2: Este mês (por semana)
    if (chartMonth) chartMonth.destroy();
    chartMonth = new Chart(document.getElementById('chart-month'), {
        type: 'bar',
        data: {
            labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5'],
            datasets: [{
                label: 'Hábitos Completados',
                data: Array.from({length: 5}, (_, i) => {
                    const start = i * 7 + 1;
                    const end = Math.min(start + 6, daysInMonth);
                    let count = 0;
                    habits.forEach(habit => {
                        if (habit.days && typeof habit.days === 'object') {
                            const monthDays = (habit.days[currentMonthKey]) || [];
                            monthDays.forEach(d => {
                                if (d >= start && d <= end) count++;
                            });
                        }
                    });
                    return count;
                }),
                backgroundColor: 'rgba(153, 102, 255, 0.5)',
            }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });

    // Gráfico 3: Crescimento anual
    if (chartYear) chartYear.destroy();
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const data = months.map((_, i) => {
        const monthKey = `${dashboardCurrentDate.getFullYear()}-${String(i + 1).padStart(2, '0')}`;
        let total = 0;
        habits.forEach(h => {
            total += ((h.days && h.days[monthKey]) || []).length;
        });
        return total;
    });
    chartYear = new Chart(document.getElementById('chart-year'), {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Totais Mensais',
                data: data,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                fill: true
            }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });

}



function getThisWeek() {
    const today = new Date().getDate();
    const monday = today - new Date().getDay() + 1;
    return Array.from({length: 7}, (_, i) => monday + i);
}

function getDashboardWeek() {
    // Return days of week in the dashboard viewed month
    const start = Math.max(1, new Date().getDate() - new Date().getDay() + 1);
    const daysInMonth = new Date(dashboardCurrentDate.getFullYear(), dashboardCurrentDate.getMonth() + 1, 0).getDate();
    return Array.from({length: 7}, (_, i) => start + i).filter(d => d <= daysInMonth);
}

function getViewWeek() {
    // Return days of week in the viewed month, ideally 1-7, but to match, use actual week's days in the month
    const start = Math.max(1, new Date().getDate() - new Date().getDay() + 1);
    return Array.from({length: 7}, (_, i) => start + i).filter(d => d <= new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate());
}

function updateHistoricoMonthDisplay() {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const year = historicoDate.getFullYear();
    const month = months[historicoDate.getMonth()];
    document.getElementById('historico-month-display').textContent = `${month} ${year}`;
}

function renderHistoricoMonth() {
    const currentMonthKey = `${historicoDate.getFullYear()}-${String(historicoDate.getMonth() + 1).padStart(2, '0')}`;
    const thisWeek = getThisWeek();
    let habitsThisWeek = 0;
    let habitsThisMonth = 0;
    let longestStreak = 0;
    let habitWithStreak = '';
    const daysInMonth = new Date(historicoDate.getFullYear(), historicoDate.getMonth() + 1, 0).getDate();

    habits.forEach(habit => {
        const monthDays = (habit.days && habit.days[currentMonthKey]) || [];
        habitsThisWeek += monthDays.filter(day => thisWeek.includes(day)).length;
        habitsThisMonth += monthDays.length;
        const sortedDays = monthDays.sort((a, b) => a - b);
        let streak = 0;
        let maxStreak = 0;
        for (let i = 0; i < sortedDays.length; i++) {
            if (i === 0 || sortedDays[i] !== sortedDays[i-1] + 1) {
                streak = 1;
            } else {
                streak++;
            }
            maxStreak = Math.max(maxStreak, streak);
        }
        if (maxStreak > longestStreak) {
            longestStreak = maxStreak;
            habitWithStreak = habit.name;
        }
    });

    document.getElementById('historico-habits').textContent = habitsThisMonth;
    document.getElementById('historico-streak').textContent = longestStreak > 0 ? `${habitWithStreak}: ${longestStreak} dias` : '0 dias';

    // Gráfico Semanas
    if (chartHistoricoWeek) chartHistoricoWeek.destroy();
    chartHistoricoWeek = new Chart(document.getElementById('chart-historico-week'), {
        type: 'bar',
        data: {
            labels: ['Sem', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Hábitos Esta Semana',
                data: thisWeek.map(day => {
                    let count = 0;
                    habits.forEach(habit => {
                        const monthDays = (habit.days && habit.days[currentMonthKey]) || [];
                        if (monthDays.includes(day)) count++;
                    });
                    return count;
                }),
                backgroundColor: 'rgba(255, 159, 64, 0.5)',
            }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });

    // Gráfico Ano
    if (chartHistoricoYear) chartHistoricoYear.destroy();
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const data = months.map((_, i) => {
        const monthKey = `${historicoDate.getFullYear()}-${String(i + 1).padStart(2, '0')}`;
        let total = 0;
        habits.forEach(h => {
            total += ((h.days && h.days[monthKey]) || []).length;
        });
        return total;
    });
    chartHistoricoYear = new Chart(document.getElementById('chart-historico-year'), {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Totais Mensais',
                data: data,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                fill: true
            }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}

// Inicialização
updateMonthDisplay();
showPage(currentPage);
loadHabits();
