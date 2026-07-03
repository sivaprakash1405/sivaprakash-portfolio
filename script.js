// ==========================================
// FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCjQjiu-_6X9k2JjK_SpaBiGmsIHxOmOzs",
  authDomain: "sivaprakah-portfolios.firebaseapp.com",
  projectId: "sivaprakah-portfolios",
  storageBucket: "sivaprakah-portfolios.firebasestorage.app",
  messagingSenderId: "839147683310",
  appId: "1:839147683310:web:de973dd09c0cd27e01e2ff"
};

// Initialize Firebase using Compat SDK
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', async () => {

    // --- Slide Navigation ---
    const slide1 = document.getElementById('slide1');
    const slide2 = document.getElementById('slide2');
    const aboutBtn = document.getElementById('aboutBtn');
    const backBtn = document.getElementById('backBtn');

    aboutBtn.addEventListener('click', () => {
        slide1.classList.remove('active');
        slide2.classList.add('active');
    });
    backBtn.addEventListener('click', () => {
        slide2.classList.remove('active');
        slide1.classList.add('active');
    });

    // --- Category Tabs ---
    const catBtns = document.querySelectorAll('.cat-btn');
    const catContents = document.querySelectorAll('.cat-content');
    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            catBtns.forEach(b => b.classList.remove('active'));
            catContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-target')).classList.add('active');
        });
    });

    // --- Lightbox Modal ---
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImg");
    const closeModal = document.getElementById("closeModal");

    function setupGalleryImages() {
        document.querySelectorAll('.gallery img').forEach(img => {
            img.onclick = function () {
                modal.classList.add('show');
                modalImg.src = this.src;
            };
        });
    }
    closeModal.onclick = () => modal.classList.remove('show');
    modal.onclick = (e) => { if (e.target !== modalImg) modal.classList.remove('show'); };

    // --- Load Data from Firebase ---
    const certGallery = document.getElementById('certGallery');
    const saveContainers = document.querySelectorAll('[data-save-container]');

    async function loadData() {
        try {
            const docSnap = await db.collection("portfolio").doc("data").get();
            if (docSnap.exists) {
                const data = docSnap.data();

                // Load single text fields
                document.querySelectorAll('[data-edit]').forEach(el => {
                    const key = el.getAttribute('data-edit');
                    if (data.texts && data.texts[key]) el.innerHTML = data.texts[key];
                });

                // Load containers
                saveContainers.forEach(container => {
                    const key = container.getAttribute('data-save-container');
                    if (data.containers && data.containers[key]) {
                        container.innerHTML = data.containers[key];
                        attachRemoveListeners(container);
                    }
                });

                // Load images
                if (data.certs && Array.isArray(data.certs)) {
                    data.certs.forEach(src => addImageToGallery(src));
                }

                console.log("✅ Data loaded from Firebase!");
            } else {
                console.log("No saved data yet — showing default content.");
            }
        } catch (e) {
            console.error("Firebase load error:", e);
        }

        setupGalleryImages();
        injectProjectButtons();
    }

    await loadData();

    // --- Image Upload ---
    const certUpload = document.getElementById('certUpload');
    certUpload.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    addImageToGallery(ev.target.result);
                    setupGalleryImages();
                };
                reader.readAsDataURL(file);
            });
        }
    });

    function addImageToGallery(src) {
        const img = document.createElement('img');
        img.src = src;
        certGallery.appendChild(img);
    }

    // --- Inject Project View Buttons ---
    function injectProjectButtons() {
        document.querySelectorAll('.project-card').forEach(card => {
            if (!card.querySelector('.project-view-btn')) {
                const title = card.querySelector('.proj-title')?.textContent || '';
                let link = 'https://github.com/sivaprakash1405';
                if (title.includes('Library Management System')) {
                    link = 'https://github.com/sivaprakash1405/Library-management-system';
                }
                const removeBtn = card.querySelector('.remove-btn');
                const btnHtml = `<a href="${link}" target="_blank" class="project-view-btn">Project View</a>`;
                if (removeBtn) {
                    removeBtn.insertAdjacentHTML('beforebegin', btnHtml);
                } else {
                    card.insertAdjacentHTML('beforeend', btnHtml);
                }
            }
        });
    }

    // --- Edit Mode & All Save ---
    const editBtn = document.getElementById('editBtn');
    const allSaveBtn = document.getElementById('allSaveBtn');
    let isEditMode = false;

    editBtn.addEventListener('click', () => {
        if (!isEditMode) {
            const pwd = prompt("Enter Admin Password:");
            if (pwd !== "king") { alert("Incorrect password!"); return; }

            isEditMode = true;
            editBtn.textContent = 'Edit Mode: ON';
            editBtn.classList.add('active');
            allSaveBtn.style.display = 'block';
            document.body.classList.add('edit-mode-active');
            makeElementsEditable(true);
        } else {
            isEditMode = false;
            editBtn.textContent = 'Edit Mode: OFF';
            editBtn.classList.remove('active');
            allSaveBtn.style.display = 'none';
            document.body.classList.remove('edit-mode-active');
            makeElementsEditable(false);
        }
    });

    allSaveBtn.addEventListener('click', async () => {
        if (!isEditMode) return;

        allSaveBtn.textContent = 'Saving...';
        allSaveBtn.style.pointerEvents = 'none';

        // Temporarily turn off editable to capture clean HTML
        makeElementsEditable(false);

        const payload = {
            texts: {},
            containers: {},
            certs: []
        };

        document.querySelectorAll('[data-edit]').forEach(el => {
            payload.texts[el.getAttribute('data-edit')] = el.innerHTML;
        });

        saveContainers.forEach(container => {
            payload.containers[container.getAttribute('data-save-container')] = container.innerHTML;
        });

        document.querySelectorAll('.gallery img').forEach(img => {
            payload.certs.push(img.src);
        });

        try {
            await db.collection("portfolio").doc("data").set(payload);
            allSaveBtn.textContent = 'Saved! ✓';
            console.log("✅ Saved to Firebase!");
        } catch (e) {
            console.error("Save error:", e);
            allSaveBtn.textContent = 'Error! Try again';
        }

        // Re-enable editable mode
        makeElementsEditable(true);

        setTimeout(() => {
            allSaveBtn.textContent = 'All Save';
            allSaveBtn.style.pointerEvents = 'auto';
        }, 2000);
    });

    function makeElementsEditable(editable) {
        document.querySelectorAll('[data-edit]').forEach(el => {
            if (editable) {
                el.setAttribute('contenteditable', 'true');
                if (el.tagName === 'A') el.addEventListener('click', preventDefaultClick);
            } else {
                el.removeAttribute('contenteditable');
                if (el.tagName === 'A') el.removeEventListener('click', preventDefaultClick);
            }
        });

        saveContainers.forEach(container => {
            container.querySelectorAll('span.tag, a, h3, p, li').forEach(el => {
                if (editable) {
                    el.setAttribute('contenteditable', 'true');
                    if (el.tagName === 'A') el.addEventListener('click', preventDefaultClick);
                } else {
                    el.removeAttribute('contenteditable');
                    if (el.tagName === 'A') el.removeEventListener('click', preventDefaultClick);
                }
            });
            container.querySelectorAll('.remove-btn').forEach(btn => {
                btn.style.display = editable ? 'flex' : 'none';
            });
        });
    }

    function preventDefaultClick(e) { e.preventDefault(); }

    // --- Dynamic Addition Logic ---
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-type');
            let targetContainer;
            if (type === 'skill-item') {
                targetContainer = btn.previousElementSibling;
            } else {
                targetContainer = document.getElementById(btn.getAttribute('data-target'));
            }

            let newEl;
            switch (type) {
                case 'tag':
                    newEl = document.createElement('span');
                    newEl.className = 'tag';
                    newEl.textContent = 'NEW TAG';
                    break;
                case 'social':
                    newEl = document.createElement('a');
                    newEl.href = '#';
                    newEl.textContent = 'New Link';
                    break;
                case 'education':
                    newEl = document.createElement('div');
                    newEl.className = 'edu-card relative-card';
                    newEl.innerHTML = `<h3 class="big-font">Institution Name</h3><p class="medium-font">Degree/Course Details</p><p class="medium-font">Year & Grades</p><button class="remove-btn">&times;</button>`;
                    break;
                case 'skill-group':
                    newEl = document.createElement('div');
                    newEl.className = 'skill-group relative-card';
                    newEl.innerHTML = `<h3>New Category</h3><ul><li>Skill 1</li></ul><button class="add-btn small-btn" data-type="skill-item">+ Add Skill</button><button class="remove-btn">&times;</button>`;
                    const innerAddBtn = newEl.querySelector('.add-btn');
                    innerAddBtn.addEventListener('click', () => {
                        const ul = innerAddBtn.previousElementSibling;
                        const li = document.createElement('li');
                        li.textContent = 'New Skill';
                        li.setAttribute('contenteditable', 'true');
                        li.innerHTML += '<button class="remove-btn">&times;</button>';
                        ul.appendChild(li);
                        attachRemoveListeners(li);
                    });
                    break;
                case 'skill-item':
                    newEl = document.createElement('li');
                    newEl.textContent = 'New Skill';
                    newEl.innerHTML += '<button class="remove-btn">&times;</button>';
                    break;
                case 'project':
                    newEl = document.createElement('div');
                    newEl.className = 'project-card relative-card';
                    newEl.innerHTML = `<h3 class="proj-title">Project Title</h3><p class="proj-desc">Project description...</p><a href="https://github.com/sivaprakash1405" target="_blank" class="project-view-btn">Project View</a><button class="remove-btn">&times;</button>`;
                    break;
                case 'info':
                    newEl = document.createElement('div');
                    newEl.className = 'info-group relative-card';
                    newEl.innerHTML = `<h3 class="large-font">New Info</h3><p class="medium-font">Info Details</p><button class="remove-btn">&times;</button>`;
                    break;
            }

            if (newEl) {
                targetContainer.appendChild(newEl);
                makeElementsEditable(true);
                attachRemoveListeners(newEl);
            }
        });
    });

    function attachRemoveListeners(context) {
        if (context.querySelectorAll) {
            context.querySelectorAll('.remove-btn').forEach(b => {
                b.onclick = function () { this.parentElement.remove(); };
            });
        }
        if (context.classList && context.classList.contains('remove-btn')) {
            context.onclick = function () { this.parentElement.remove(); };
        }
    }
});
