const form = document.getElementById("studentForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const departmentInput = document.getElementById("department");
const rows = document.getElementById("studentRows");
const count = document.getElementById("count");
const message = document.getElementById("message");
const formTitle = document.getElementById("formTitle");
const submitButton = document.getElementById("submitButton");
const cancelButton = document.getElementById("cancelButton");
let editingId = null;

function showMessage(text, type = "") {
  message.textContent = text;
  message.className = `message ${type}`;
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function makeCell(text) {
  const td = document.createElement("td");
  td.textContent = text ?? "";
  return td;
}

async function loadStudents() {
  rows.replaceChildren();
  const loading = document.createElement("tr");
  const loadingCell = makeCell("Loading students…");
  loadingCell.colSpan = 5;
  loadingCell.className = "empty";
  loading.appendChild(loadingCell);
  rows.appendChild(loading);

  try {
    const students = await api("/api/students");
    rows.replaceChildren();
    count.textContent = `${students.length} student${students.length === 1 ? "" : "s"} saved`;
    if (!students.length) {
      const tr = document.createElement("tr");
      const td = makeCell("No students yet. Add the first student above.");
      td.colSpan = 5;
      td.className = "empty";
      tr.appendChild(td);
      rows.appendChild(tr);
      return;
    }

    students.forEach(student => {
      const tr = document.createElement("tr");
      tr.append(makeCell(student.id), makeCell(student.name), makeCell(student.email), makeCell(student.department));
      const actionCell = document.createElement("td");
      const actionWrap = document.createElement("div");
      actionWrap.className = "row-actions";
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "secondary";
      edit.textContent = "Edit";
      edit.addEventListener("click", () => beginEdit(student));
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "danger";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => deleteStudent(student.id, student.name));
      actionWrap.append(edit, remove);
      actionCell.appendChild(actionWrap);
      tr.appendChild(actionCell);
      rows.appendChild(tr);
    });
  } catch (error) {
    rows.replaceChildren();
    const tr = document.createElement("tr");
    const td = makeCell(error.message);
    td.colSpan = 5;
    td.className = "empty";
    tr.appendChild(td);
    rows.appendChild(tr);
    count.textContent = "Could not load records";
  }
}

function beginEdit(student) {
  editingId = student.id;
  nameInput.value = student.name;
  emailInput.value = student.email;
  departmentInput.value = student.department;
  formTitle.textContent = `Edit student #${student.id}`;
  submitButton.textContent = "Save changes";
  cancelButton.classList.remove("hidden");
  showMessage("Update the fields and choose Save changes.");
  nameInput.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  editingId = null;
  form.reset();
  formTitle.textContent = "Add a student";
  submitButton.textContent = "Add student";
  cancelButton.classList.add("hidden");
}

cancelButton.addEventListener("click", () => {
  resetForm();
  showMessage("");
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const student = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    department: departmentInput.value.trim()
  };

  if (student.name.length < 2 || student.department.length < 2) {
    showMessage("Name and department must contain at least 2 characters.", "error");
    return;
  }

  submitButton.disabled = true;
  try {
    const url = editingId ? `/api/students/${editingId}` : "/api/students";
    const method = editingId ? "PUT" : "POST";
    const result = await api(url, { method, body: JSON.stringify(student) });
    resetForm();
    showMessage(result.message, "success");
    await loadStudents();
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    submitButton.disabled = false;
  }
});

async function deleteStudent(id, name) {
  if (!window.confirm(`Delete student "${name}"? This cannot be undone.`)) return;
  try {
    const result = await api(`/api/students/${id}`, { method: "DELETE" });
    if (editingId === id) resetForm();
    showMessage(result.message, "success");
    await loadStudents();
  } catch (error) {
    showMessage(error.message, "error");
  }
}

document.getElementById("refreshButton").addEventListener("click", loadStudents);
loadStudents();
