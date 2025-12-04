// Todo App - JavaScript with Firebase Realtime Database

// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
import { 
    getDatabase, 
    ref, 
    push, 
    set, 
    update, 
    remove, 
    onValue 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCzVP1ODiEdFQp04jlCQzfHC3eJJYOBWrs",
    authDomain: "kangil-todo-backend.firebaseapp.com",
    projectId: "kangil-todo-backend",
    storageBucket: "kangil-todo-backend.firebasestorage.app",
    messagingSenderId: "705056460208",
    appId: "1:705056460208:web:dc3c4adf7fcbf917d7da75",
    measurementId: "G-QY3LK652H5",
    databaseURL: "https://kangil-todo-backend-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

// Database reference
const todosRef = ref(db, 'todos');

// State
let todos = [];
let editingId = null;
let deletingId = null;
let currentFilter = 'all';

// DOM Elements
const todoList = document.getElementById('todoList');
const addTodoBtn = document.getElementById('addTodoBtn');
const modalOverlay = document.getElementById('modalOverlay');
const deleteModalOverlay = document.getElementById('deleteModalOverlay');
const todoForm = document.getElementById('todoForm');
const modalTitle = document.getElementById('modalTitle');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');
const todoText = document.getElementById('todoText');
const todoDate = document.getElementById('todoDate');
const todoTime = document.getElementById('todoTime');
const filterBtns = document.querySelectorAll('.filter-btn');

// Category names in Korean
const categoryNames = {
    self: '자기계발',
    home: '가정',
    work: '업무',
    other: '기타'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    subscribeToTodos();
});

// Subscribe to Realtime Database todos (real-time updates)
function subscribeToTodos() {
    onValue(todosRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            todos = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
        } else {
            todos = [];
        }
        renderTodos();
    }, (error) => {
        console.error("Error fetching todos:", error);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Add todo button
    addTodoBtn.addEventListener('click', openAddModal);
    
    // Close modal buttons
    closeModal.addEventListener('click', closeAddModal);
    cancelBtn.addEventListener('click', closeAddModal);
    
    // Close modal on overlay click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeAddModal();
    });
    
    // Delete modal events
    cancelDelete.addEventListener('click', closeDeleteModal);
    confirmDelete.addEventListener('click', confirmDeleteTodo);
    deleteModalOverlay.addEventListener('click', (e) => {
        if (e.target === deleteModalOverlay) closeDeleteModal();
    });
    
    // Form submit
    todoForm.addEventListener('submit', handleSubmit);
    
    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.category;
            renderTodos();
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAddModal();
            closeDeleteModal();
        }
    });
}

// Open add modal
function openAddModal() {
    editingId = null;
    modalTitle.textContent = '할 일 추가';
    todoForm.reset();
    
    // Set default date to today
    const now = new Date();
    todoDate.value = now.toISOString().split('T')[0];
    
    // Set default time to next hour
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    todoTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    modalOverlay.classList.add('active');
    todoText.focus();
}

// Open edit modal
function openEditModal(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    editingId = id;
    modalTitle.textContent = '할 일 수정';
    todoText.value = todo.text;
    todoDate.value = todo.date;
    todoTime.value = todo.time;
    
    // Set category
    const categoryRadio = document.querySelector(`input[name="category"][value="${todo.category}"]`);
    if (categoryRadio) categoryRadio.checked = true;
    
    modalOverlay.classList.add('active');
    todoText.focus();
}

// Close add/edit modal
function closeAddModal() {
    modalOverlay.classList.remove('active');
    editingId = null;
    todoForm.reset();
}

// Open delete modal
function openDeleteModal(id) {
    deletingId = id;
    deleteModalOverlay.classList.add('active');
}

// Close delete modal
function closeDeleteModal() {
    deleteModalOverlay.classList.remove('active');
    deletingId = null;
}

// Confirm delete
async function confirmDeleteTodo() {
    if (deletingId) {
        try {
            const todoRef = ref(db, `todos/${deletingId}`);
            await remove(todoRef);
            closeDeleteModal();
        } catch (error) {
            console.error("Error deleting todo:", error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    }
}

// Handle form submit
async function handleSubmit(e) {
    e.preventDefault();
    
    const text = todoText.value.trim();
    const date = todoDate.value;
    const time = todoTime.value;
    const category = document.querySelector('input[name="category"]:checked').value;
    
    if (!text || !date || !time) return;
    
    try {
        if (editingId) {
            // Update existing todo in Realtime Database
            const todoRef = ref(db, `todos/${editingId}`);
            await update(todoRef, {
                text,
                date,
                time,
                category,
                updatedAt: new Date().toISOString()
            });
        } else {
            // Add new todo to Realtime Database
            const newTodoRef = push(todosRef);
            await set(newTodoRef, {
                text,
                date,
                time,
                category,
                completed: false,
                createdAt: new Date().toISOString()
            });
        }
        closeAddModal();
    } catch (error) {
        console.error("Error saving todo:", error);
        alert("저장 중 오류가 발생했습니다.");
    }
}

// Toggle todo completion
async function toggleComplete(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    try {
        const todoRef = ref(db, `todos/${id}`);
        await update(todoRef, {
            completed: !todo.completed
        });
    } catch (error) {
        console.error("Error updating todo:", error);
    }
}

// Render todos
function renderTodos() {
    // Filter todos
    let filteredTodos = [...todos];
    if (currentFilter !== 'all') {
        filteredTodos = todos.filter(todo => todo.category === currentFilter);
    }
    
    // Sort by date and time
    filteredTodos.sort((a, b) => {
        const dateCompare = (a.date || '').localeCompare(b.date || '');
        if (dateCompare !== 0) return dateCompare;
        return (a.time || '').localeCompare(b.time || '');
    });
    
    if (filteredTodos.length === 0) {
        todoList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <p class="empty-state-text">할 일이 없습니다.<br>새로운 할 일을 추가해보세요!</p>
            </div>
        `;
        return;
    }
    
    todoList.innerHTML = filteredTodos.map(todo => `
        <li class="todo-item cat-${todo.category} ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <label class="checkbox-wrapper">
                <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="window.toggleComplete('${todo.id}')">
                <span class="checkmark"></span>
            </label>
            <div class="todo-content">
                <span class="todo-text">${escapeHtml(todo.text)}</span>
                <div class="todo-meta">
                    <span class="todo-category ${todo.category}">${categoryNames[todo.category]}</span>
                    <span class="todo-date">${formatDate(todo.date)}</span>
                </div>
            </div>
            <span class="todo-time">${formatTime(todo.time)}</span>
            <div class="todo-actions">
                <button class="action-btn edit" onclick="window.openEditModal('${todo.id}')" title="수정">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="action-btn delete" onclick="window.openDeleteModal('${todo.id}')" title="삭제">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        </li>
    `).join('');
}

// Format time for display (24h to display format)
function formatTime(time) {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
}

// Format date for display
function formatDate(date) {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${parseInt(month)}월 ${parseInt(day)}일`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions available globally for onclick handlers
window.toggleComplete = toggleComplete;
window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;
