import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    writeBatch,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// ─ State
let tasks = [];
let currentFilter = 'all';
let currentUser = null;
let unsubscribeTasks = null;

// ─ DOM
const taskInput = document.getElementById('new-task-input');
const addBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const taskCountEl = document.getElementById('task-count');
const filterTabs = document.getElementById('filter-tabs');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const badgeActive = document.getElementById('badge-active');
const badgeCompleted = document.getElementById('badge-completed');
const authLoading = document.getElementById('auth-loading');
const appMain = document.getElementById('app-main');
const userArea = document.getElementById('user-area');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const btnSignout = document.getElementById('btn-signout');
const btnNewTask = document.getElementById('btn-new-task');

// ─ Auth guard
onAuthStateChanged(auth, (user) => {
    if (!user) { window.location.href = 'auth.html'; return; }
    currentUser = user;
    showApp(user);
    subscribeToTasks(user.uid);
});

function showApp(user) {
    authLoading.style.display = 'none';
    appMain.style.display = 'block';
    const displayName = user.displayName || user.email.split('@')[0];
    userName.textContent = displayName;
    if (user.photoURL) {
        userAvatar.innerHTML = `<img src="${user.photoURL}" alt="${displayName}" referrerpolicy="no-referrer">`;
    } else {
        userAvatar.textContent = displayName.substring(0, 2).toUpperCase();
        userAvatar.style.fontSize = '0.75rem';
    }
    userArea.style.display = 'flex';
    setupEventListeners();
}

function subscribeToTasks(uid) {
    if (unsubscribeTasks) unsubscribeTasks();
    const q = query(collection(db, 'users', uid, 'tasks'), orderBy('createdAt', 'desc'));
    unsubscribeTasks = onSnapshot(q, (snapshot) => {
        tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderTasks();
    });
}

function setupEventListeners() {
    taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
    addBtn.addEventListener('click', addTask);
    btnNewTask.addEventListener('click', () => taskInput.focus());
    filterTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
    clearCompletedBtn.addEventListener('click', clearCompleted);
    btnSignout.addEventListener('click', async () => {
        if (unsubscribeTasks) unsubscribeTasks();
        await signOut(auth);
        window.location.href = 'auth.html';
    });
}

async function addTask() {
    const text = taskInput.value.trim();
    if (!text || !currentUser) return;
    taskInput.value = '';
    await addDoc(collection(db, 'users', currentUser.uid, 'tasks'), {
        text, completed: false, priority: false, createdAt: serverTimestamp()
    });
}

async function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    await updateDoc(doc(db, 'users', currentUser.uid, 'tasks', id), { completed: !task.completed });
}

async function deleteTask(id) {
    await deleteDoc(doc(db, 'users', currentUser.uid, 'tasks', id));
}

async function clearCompleted() {
    const completed = tasks.filter(t => t.completed);
    if (!completed.length) return;
    const batch = writeBatch(db);
    completed.forEach(t => batch.delete(doc(db, 'users', currentUser.uid, 'tasks', t.id)));
    await batch.commit();
}

async function togglePriority(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    await updateDoc(doc(db, 'users', currentUser.uid, 'tasks', id), { priority: !task.priority });
}

function initEditTask(id, currentText) {
    const targetLi = taskList.querySelector(`[data-task-id="${id}"]`);
    if (!targetLi) return;
    const textSpan = targetLi.querySelector('.task-text');
    textSpan.innerHTML = `<input type="text" class="edit-input" id="edit-${id}" value="${escapeHTML(currentText)}" onblur="finishEditTask('${id}')" onkeydown="handleEditKey(event,'${id}')">`;
    const input = document.getElementById(`edit-${id}`);
    input.focus();
    input.selectionStart = input.selectionEnd = input.value.length;
}

function handleEditKey(event, id) {
    if (event.key === 'Enter') finishEditTask(id);
    else if (event.key === 'Escape') renderTasks();
}

window.finishEditTask = async function(id) {
    const input = document.getElementById(`edit-${id}`);
    if (!input) return;
    const newText = input.value.trim();
    if (newText) await updateDoc(doc(db, 'users', currentUser.uid, 'tasks', id), { text: newText });
    renderTasks();
};

window.initEditTask = initEditTask;
window.handleEditKey = handleEditKey;
window.togglePriority = togglePriority;
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;

function renderTasks() {
    const sorted = [...tasks].sort((a, b) => {
        if (a.priority !== b.priority) return a.priority ? -1 : 1;
        return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
    });
    let filtered = sorted;
    if (currentFilter === 'active') filtered = sorted.filter(t => !t.completed);
    else if (currentFilter === 'completed') filtered = sorted.filter(t => t.completed);

    taskList.innerHTML = '';
    if (!filtered.length) {
        taskList.innerHTML = '<li class="empty-state">No tasks to show in this view.</li>';
    } else {
        filtered.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.dataset.taskId = task.id;
            li.innerHTML = `
                <label class="checkbox-container" aria-label="Toggle task">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')">
                    <span class="checkmark"><i class='bx bx-check'></i></span>
                </label>
                <span class="task-text" ondblclick="initEditTask('${task.id}','${escapeHTML(task.text).replace(/'/g, "\\'")}')">
                    ${escapeHTML(task.text)}
                    ${task.priority ? '<i class=\'bx bxs-star priority-indicator\'></i>' : ''}
                </span>
                <div class="task-actions">
                    <button class="action-btn priority-btn ${task.priority ? 'active-priority' : ''}" onclick="togglePriority('${task.id}')">
                        <i class='bx ${task.priority ? 'bxs-star' : 'bx-star'}'></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteTask('${task.id}')">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>`;
            taskList.appendChild(li);
        });
    }
    updateMetadata();
}

function updateMetadata() {
    const active = tasks.filter(t => !t.completed).length;
    const completed = tasks.filter(t => t.completed).length;
    taskCountEl.textContent = `${active} task${active !== 1 ? 's' : ''} remaining`;
    badgeActive.textContent = active;
    badgeCompleted.textContent = completed;
    badgeActive.style.display = active > 0 ? 'inline-block' : 'none';
    badgeCompleted.style.display = completed > 0 ? 'inline-block' : 'none';
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
