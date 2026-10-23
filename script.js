// عناصر الصفحة التي نحتاج إلى تحديثها أو التفاعل معها
const taskForm = document.querySelector('#taskForm');
const taskInput = document.querySelector('#taskInput');
const taskList = document.querySelector('#taskList');
const emptyState = document.querySelector('#emptyState');
const totalCount = document.querySelector('#totalCount');
const doneCount = document.querySelector('#doneCount');
const remainingCount = document.querySelector('#remainingCount');
const listCount = document.querySelector('#listCount');
const allFilterCount = document.querySelector('#allFilterCount');
const progressPercent = document.querySelector('#progressPercent');
const progressBar = document.querySelector('#progressBar');
const progressTrack = document.querySelector('.progress-track');
const progressMessage = document.querySelector('#progressMessage');
const clearCompletedButton = document.querySelector('#clearCompleted');
const footerCount = document.querySelector('#footerCount');
const toast = document.querySelector('#toast');
const filterButtons = document.querySelectorAll('.filter-btn');

// نقرأ المهام المحفوظة عند فتح الصفحة. إذا لم توجد بيانات نبدأ بقائمة فارغة.
const STORAGE_KEY = 'munjaz-todo-tasks';
let tasks = loadTasks();
let currentFilter = 'all';
let toastTimer;

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));
    // نتحقق من شكل البيانات قبل استخدامها لتفادي أخطاء التخزين غير المتوقع.
    if (Array.isArray(savedTasks)) {
      return savedTasks.filter(task => task && typeof task.id === 'string' &&
        typeof task.text === 'string' && typeof task.completed === 'boolean');
    }
  } catch (error) {
    console.warn('تعذرت قراءة المهام المحفوظة:', error);
  }
  return [];
}

// نحفظ القائمة كاملة في المتصفح، دون الحاجة إلى خادم أو حساب.
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    showToast('تعذر الحفظ في هذا المتصفح.');
    console.error('تعذر حفظ المهام:', error);
  }
}

// نستخدم عناصر نصية آمنة حتى لا يتحول ما يكتبه المستخدم إلى HTML.
function createTaskElement(task) {
  const item = document.createElement('li');
  item.className = `task-item${task.completed ? ' is-complete' : ''}`;

  const checkButton = document.createElement('button');
  checkButton.className = 'check-button';
  checkButton.type = 'button';
  checkButton.setAttribute('aria-label', task.completed ? 'إعادة المهمة إلى قيد التنفيذ' : 'إكمال المهمة');
  checkButton.setAttribute('aria-pressed', String(task.completed));
  const checkMark = document.createElement('span');
  checkMark.textContent = task.completed ? '✓' : '';
  checkButton.append(checkMark);
  checkButton.addEventListener('click', () => toggleTask(task.id));

  const text = document.createElement('span');
  text.className = 'task-text';
  text.textContent = task.text;

  const date = document.createElement('time');
  date.className = 'task-date';
  date.textContent = task.createdAt ? formatDate(task.createdAt) : '';

  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-button';
  deleteButton.type = 'button';
  deleteButton.textContent = '×';
  deleteButton.setAttribute('aria-label', `حذف المهمة: ${task.text}`);
  deleteButton.addEventListener('click', () => deleteTask(task.id));

  item.append(checkButton, text, date, deleteButton);
  return item;
}

function formatDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'short' }).format(date);
}

// نعرض فقط المهام الموافقة للتصفية، ثم نحدّث الأرقام وشريط التقدم.
function render() {
  const completed = tasks.filter(task => task.completed).length;
  const remaining = tasks.length - completed;
  const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const visibleTasks = tasks.filter(task => {
    if (currentFilter === 'active') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true;
  });

  taskList.replaceChildren(...visibleTasks.map(createTaskElement));
  emptyState.hidden = visibleTasks.length > 0;
  totalCount.textContent = tasks.length;
  doneCount.textContent = completed;
  remainingCount.textContent = remaining;
  allFilterCount.textContent = tasks.length;
  listCount.textContent = `${tasks.length} ${tasks.length === 1 ? 'مهمة' : 'مهام'}`;
  footerCount.textContent = `${tasks.length} ${tasks.length === 1 ? 'مهمة' : 'مهمة'}`;
  progressPercent.textContent = `${percent}%`;
  progressBar.style.width = `${percent}%`;
  progressTrack.setAttribute('aria-valuenow', String(percent));

  if (!tasks.length) progressMessage.textContent = 'أضف أول مهمة وابدأ إنجازك اليوم ✨';
  else if (!remaining) progressMessage.textContent = 'رائع! أنجزت كل مهامك اليوم 🎉';
  else if (percent >= 60) progressMessage.textContent = 'إنجاز رائع! بقي القليل وتصل للهدف 💪';
  else progressMessage.textContent = `أنجزت ${completed} من ${tasks.length} مهام. استمر!`;
}

function addTask(text) {
  tasks.unshift({ id: createId(), text, completed: false, createdAt: new Date().toISOString() });
  saveTasks();
  currentFilter = 'all';
  updateFilterButtons();
  render();
  showToast('أُضيفت المهمة إلى قائمتك ✨');
}

function toggleTask(taskId) {
  tasks = tasks.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task);
  saveTasks();
  render();
}

function deleteTask(taskId) {
  tasks = tasks.filter(task => task.id !== taskId);
  saveTasks();
  render();
  showToast('حُذفت المهمة.');
}

function updateFilterButtons() {
  filterButtons.forEach(button => {
    const selected = button.dataset.filter === currentFilter;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2200);
}

// استقبال نموذج الإضافة يمنع إعادة تحميل الصفحة عند الضغط على الزر أو Enter.
taskForm.addEventListener('submit', event => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) {
    showToast('اكتب اسم المهمة أولاً.');
    taskInput.focus();
    return;
  }
  addTask(text);
  taskInput.value = '';
  taskInput.focus();
});

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    updateFilterButtons();
    render();
  });
});

clearCompletedButton.addEventListener('click', () => {
  const completedCount = tasks.filter(task => task.completed).length;
  if (!completedCount) {
    showToast('لا توجد مهام مكتملة لمسحها.');
    return;
  }
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  render();
  showToast(`تم مسح ${completedCount} مهام مكتملة.`);
});

// نضع تاريخ اليوم باللغة العربية في رأس الصفحة.
document.querySelector('#todayLabel').textContent = new Intl.DateTimeFormat('ar-SA', {
  weekday: 'long', day: 'numeric', month: 'long'
}).format(new Date());

updateFilterButtons();
render();
