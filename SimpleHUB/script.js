// Массивы для хранения данных заметок и задач
const notesData = JSON.parse(localStorage.getItem('notesData')) || [];
const tasksData = JSON.parse(localStorage.getItem('tasksData')) || []; 
let activeNoteIndex = null;

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    updateNotesList();
});

document.getElementById('add-task').addEventListener('click', () => {
    const taskInput = document.getElementById('task-input');
    const taskValue = taskInput.value.trim();

    if (taskValue) {
        tasksData.push({ text: taskValue, completed: false });
        saveTasks();
        loadTasks();
        taskInput.value = '';
    }
});

document.getElementById('tasks').addEventListener('click', (e) => {
    const taskList = document.getElementById('tasks');
    const taskIndex = Array.from(taskList.children).indexOf(e.target.parentElement);

    if (e.target.classList.contains('delete-task')) {
        tasksData.splice(taskIndex, 1);
        saveTasks();
        loadTasks();
    } else if (e.target.type === 'checkbox') {
        tasksData[taskIndex].completed = e.target.checked;
        saveTasks();
    }
});

document.getElementById('add-note').addEventListener('click', () => {
    openNoteEditor();
    resetEditorFields();
});

document.getElementById('close-editor').addEventListener('click', () => {
    closeNoteEditor();
});

document.getElementById('save-note').addEventListener('click', async () => {
    const noteTitle = document.getElementById('note-title').value.trim();
    const noteContent = document.getElementById('note-content').value.trim();
    const noteFileInput = document.getElementById('note-file');
    const newFiles = await getFilesData(noteFileInput.files);

    if (noteTitle) {
        const existingNote = activeNoteIndex !== null ? notesData[activeNoteIndex] : { files: [] };
        const updatedFiles = [...existingNote.files, ...newFiles];

        const note = {
            title: noteTitle,
            content: noteContent,
            files: updatedFiles
        };

        if (activeNoteIndex !== null) {
            notesData[activeNoteIndex] = note;
        } else {
            notesData.push(note);
        }

        saveNotes();
        updateNotesList();
        closeNoteEditor();
    }
});

document.getElementById('delete-note').addEventListener('click', () => {
    if (activeNoteIndex !== null) {
        notesData.splice(activeNoteIndex, 1);
        saveNotes();
        updateNotesList();
        closeNoteEditor();
    }
});

document.getElementById('notes').addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
        const noteIndex = Array.from(e.target.parentNode.children).indexOf(e.target);
        openNoteEditor(notesData[noteIndex]);
        activeNoteIndex = noteIndex;
    }
});

function openNoteEditor(note = null) {
    const editor = document.getElementById('note-editor');
    editor.classList.add('visible');

    if (note) {
        document.getElementById('note-title').value = note.title;
        document.getElementById('note-content').value = note.content;
        document.getElementById('note-file').value = '';
        displayNoteFiles(note.files);
    } else {
        displayNoteFiles([]);
    }
}

function closeNoteEditor() {
    document.getElementById('note-editor').classList.remove('visible');
    resetEditorFields();
    activeNoteIndex = null;
}

function resetEditorFields() {
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
    document.getElementById('note-file').value = '';
    displayNoteFiles([]);
}

// Обновление списка заметок
function updateNotesList() {
    const notesList = document.getElementById('notes');
    notesList.innerHTML = '';

    notesData.forEach((note) => {
        const noteItem = document.createElement('li');
        noteItem.textContent = note.title;
        notesList.appendChild(noteItem);
    });
}

function loadTasks() {
    const taskList = document.getElementById('tasks');
    taskList.innerHTML = '';

    tasksData.forEach((task) => {
        const taskItem = document.createElement('li');

        taskItem.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
            <span>${task.text}</span>
            <button class="delete-task" style="font-size:25px;color:#7C7C7C;margin-left:20px">-</button>
        `;

        taskList.appendChild(taskItem);
    });
}

function saveTasks() {
    localStorage.setItem('tasksData', JSON.stringify(tasksData));
}

function saveNotes() {
    localStorage.setItem('notesData', JSON.stringify(notesData));
}

function displayNoteFiles(files) {
    const fileListContainer = document.getElementById('file-list');
    if (!fileListContainer) {
        const container = document.createElement('div');
        container.id = 'file-list';
        document.querySelector('.editor-content').appendChild(container);
    } else {
        fileListContainer.innerHTML = '';
    }

    files.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.classList.add('file-item');

        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = file.data;
            img.alt = file.name;
            img.style.maxWidth = '100%';
            fileItem.appendChild(img);
        } else {
            const fileText = document.createElement('span');
            fileText.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
            fileItem.appendChild(fileText);
        }

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Удалить';
        deleteButton.addEventListener('click', () => {
            files.splice(index, 1);
            displayNoteFiles(files); 
        });

        fileItem.appendChild(deleteButton);
        fileListContainer.appendChild(fileItem);
    });
}

async function getFilesData(fileList) {
    const filesData = [];
    for (const file of fileList) {
        const fileData = await readFileAsBase64(file);
        filesData.push({
            name: file.name,
            size: file.size,
            type: file.type,
            data: fileData
        });
    }
    return filesData;
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}
