/**
 * Laboratory Inventory Management System
 * Main Application Logic
 */

// --- Storage & Firebase Integration ---

const Storage = {
    getRef(path) {
        if (!db) return null;
        return db.ref('lab_inventory/' + path);
    },

    initSync(callback) {
        if (!db) {
            console.warn("Firebase not initialized");
            callback(null);
            return;
        }

        const rootRef = db.ref('lab_inventory');
        rootRef.on('value', (snapshot) => {
            const data = snapshot.val();
            callback(data);
        }, (error) => {
            console.error("Firebase Sync Error:", error);
            // Don't block login - just show warning and continue with empty data
            console.warn("Continuing with empty data. Please check Firebase Database setup.");
            callback(null);
        });
    },

    saveTeachers(teachers) {
        const ref = this.getRef('teachers');
        if (ref) return ref.set(teachers);
        return Promise.resolve();
    },

    saveLabInCharges(subject, incharges) {
        const ref = this.getRef(`lab_incharges/${subject}`);
        if (ref) return ref.set(incharges);
        return Promise.resolve();
    },

    saveInventory(subject, inventory) {
        const ref = this.getRef(`inventory/${subject}`);
        if (ref) return ref.set(inventory);
        return Promise.resolve();
    },

    saveItem(subject, item) {
        const ref = this.getRef(`inventory/${subject}/${item.id}`);
        if (ref) return ref.set(item);
        return Promise.resolve();
    },

    deleteItem(subject, itemId) {
        const ref = this.getRef(`inventory/${subject}/${itemId}`);
        if (ref) return ref.remove();
        return Promise.resolve();
    },

    addTransaction(subject, transaction) {
        const ref = this.getRef(`transactions/${subject}`);
        if (ref) {
            const newRef = ref.push();
            return newRef.set(transaction);
        }
        return Promise.resolve();
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

// --- Main Application ---

const App = {
    state: {
        currentUser: null,
        teachers: [],
        labInCharges: {
            general_science: [],
            biology: [],
            physics: [],
            chemistry: []
        },
        inventory: {
            general_science: [],
            biology: [],
            physics: [],
            chemistry: []
        },
        transactions: {
            general_science: [],
            biology: [],
            physics: [],
            chemistry: []
        },
        currentSubject: 'general_science',
        editingItem: null,
        editingSubject: null,
        currentStockItem: null
    },

    admins: [
        'mailsuren2019@gmail.com'
        // Add more admin emails here
    ],

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.setupTabs();
        this.setupAuth();
        Storage.initSync((data) => this.handleRemoteDataUpdate(data));
    },

    cacheDOM() {
        this.dom = {
            // Login
            loginOverlay: document.getElementById('login-overlay'),
            loginBtn: document.getElementById('google-login-btn'),
            logoutBtn: document.getElementById('logout-btn'),

            // Profile
            profileName: document.getElementById('profile-name'),
            profileEmail: document.getElementById('profile-email'),
            profileRole: document.getElementById('profile-role'),
            profilePic: document.getElementById('profile-pic'),

            // Teachers
            addTeacherBtn: document.getElementById('add-teacher-btn'),
            addTeacherForm: document.getElementById('add-teacher-form'),
            teacherName: document.getElementById('teacher-name'),
            teacherEmail: document.getElementById('teacher-email'),
            saveTeacherBtn: document.getElementById('save-teacher-btn'),
            teachersList: document.getElementById('teachers-list'),

            // Item Modal
            itemModal: document.getElementById('item-modal'),
            itemModalTitle: document.getElementById('item-modal-title'),
            itemNumber: document.getElementById('item-number'),
            itemParticulars: document.getElementById('item-particulars'),
            itemQuantity: document.getElementById('item-quantity'),
            itemPrice: document.getElementById('item-price'),
            itemMinStock: document.getElementById('item-min-stock'),
            itemRemarks: document.getElementById('item-remarks'),
            saveItemBtn: document.getElementById('save-item-btn'),
            cancelItemBtn: document.getElementById('cancel-item-btn'),

            // Stock Modal
            stockModal: document.getElementById('stock-modal'),
            stockModalTitle: document.getElementById('stock-modal-title'),
            stockItemName: document.getElementById('stock-item-name'),
            stockCurrentQty: document.getElementById('stock-current-qty'),
            stockAction: document.getElementById('stock-action'),
            stockQuantity: document.getElementById('stock-quantity'),
            stockReason: document.getElementById('stock-reason'),
            saveStockBtn: document.getElementById('save-stock-btn'),
            cancelStockBtn: document.getElementById('cancel-stock-btn'),

            // Lab In-Charge Modal
            inchargeModal: document.getElementById('incharge-modal'),
            inchargeModalTitle: document.getElementById('incharge-modal-title'),
            inchargeRows: document.getElementById('incharge-rows'),
            saveInchargeBtn: document.getElementById('save-incharge-btn'),
            cancelInchargeBtn: document.getElementById('cancel-incharge-btn'),

            // Reports
            reportSubject: document.getElementById('report-subject'),
            reportType: document.getElementById('report-type'),
            reportDateFrom: document.getElementById('report-date-from'),
            reportDateTo: document.getElementById('report-date-to'),
            dateRangeGroup: document.getElementById('date-range-group'),
            generateReportBtn: document.getElementById('generate-report-btn'),
            exportExcelBtn: document.getElementById('export-excel-btn'),
            printReportBtn: document.getElementById('print-report-btn'),
            reportContainer: document.getElementById('report-container'),

            // Toast
            toast: document.getElementById('toast-notification')
        };
    },

    bindEvents() {
        // Auth
        this.dom.loginBtn.addEventListener('click', () => this.login());
        this.dom.logoutBtn.addEventListener('click', () => this.logout());

        // Teachers
        if (this.dom.addTeacherBtn) {
            this.dom.addTeacherBtn.addEventListener('click', () => {
                this.dom.addTeacherForm.style.display =
                    this.dom.addTeacherForm.style.display === 'none' ? 'block' : 'none';
            });
        }
        if (this.dom.saveTeacherBtn) {
            this.dom.saveTeacherBtn.addEventListener('click', () => this.addTeacher());
        }

        // Item Modal
        this.dom.saveItemBtn.addEventListener('click', () => this.saveItem());
        this.dom.cancelItemBtn.addEventListener('click', () => this.closeItemModal());
        const itemModalClose = this.dom.itemModal.querySelector('.modal-close');
        if (itemModalClose) itemModalClose.addEventListener('click', () => this.closeItemModal());

        // Stock Modal
        this.dom.saveStockBtn.addEventListener('click', () => this.saveStock());
        this.dom.cancelStockBtn.addEventListener('click', () => this.closeStockModal());
        const stockModalClose = this.dom.stockModal.querySelector('.modal-close');
        if (stockModalClose) stockModalClose.addEventListener('click', () => this.closeStockModal());

        // Lab In-Charge Modal
        this.dom.saveInchargeBtn.addEventListener('click', () => this.saveLabInCharges());
        this.dom.cancelInchargeBtn.addEventListener('click', () => this.closeInchargeModal());
        const inchargeModalClose = this.dom.inchargeModal.querySelector('.modal-close');
        if (inchargeModalClose) inchargeModalClose.addEventListener('click', () => this.closeInchargeModal());

        // Reports
        this.dom.reportType.addEventListener('change', () => {
            if (this.dom.reportType.value === 'transactions') {
                this.dom.dateRangeGroup.style.display = 'block';
            } else {
                this.dom.dateRangeGroup.style.display = 'none';
            }
        });
        this.dom.generateReportBtn.addEventListener('click', () => this.generateReport());
        this.dom.exportExcelBtn.addEventListener('click', () => this.exportToExcel());
        this.dom.printReportBtn.addEventListener('click', () => window.print());

        // Add Item Buttons (for each subject)
        document.querySelectorAll('.add-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const subject = e.target.dataset.subject;
                this.openItemModal(subject);
            });
        });

        // Search Inputs
        document.querySelectorAll('.search-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const subject = e.target.dataset.subject;
                this.filterInventory(subject, e.target.value);
            });
        });

        // Filter Selects
        document.querySelectorAll('.filter-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const subject = e.target.dataset.subject;
                this.applyFilter(subject, e.target.value);
            });
        });

        // Manage Lab In-Charge Buttons
        document.querySelectorAll('.manage-incharge-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const subject = e.target.dataset.subject;
                this.openInchargeModal(subject);
            });
        });
    },

    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;

                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                const targetPane = document.getElementById(targetTab + '-tab');
                if (targetPane) targetPane.classList.add('active');
            });
        });
    },

    // --- Authentication ---

    setupAuth() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log("✅ User authenticated:", user.email);
                this.state.currentUser = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL
                };
                console.log("Hiding login overlay...");
                this.dom.loginOverlay.classList.add('hidden');
                this.updateProfile();
                this.updateUIVisibility();
            } else {
                console.log("❌ User not authenticated");
                this.state.currentUser = null;
                this.dom.loginOverlay.classList.remove('hidden');
            }
        });
    },

    async login() {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await auth.signInWithPopup(provider);
        } catch (error) {
            console.error("Login error:", error);
            alert("Login failed: " + error.message);
        }
    },

    async logout() {
        try {
            await auth.signOut();
        } catch (error) {
            console.error("Logout error:", error);
        }
    },

    getUserRole(subject = null) {
        if (!this.state.currentUser) return 'GUEST';

        const email = this.state.currentUser.email.toLowerCase();

        // Check if admin/teacher
        const isTeacher = this.state.teachers.some(t => t.email.toLowerCase() === email);
        if (isTeacher) return 'ADMIN';

        // Check if lab in-charge for specific subject
        if (subject) {
            const incharges = this.state.labInCharges[subject] || [];
            const isInCharge = incharges.some(ic => ic.email && ic.email.toLowerCase() === email);
            if (isInCharge) return 'LAB_INCHARGE';
        } else {
            // Check if lab in-charge for any subject
            for (const subj in this.state.labInCharges) {
                const incharges = this.state.labInCharges[subj] || [];
                const isInCharge = incharges.some(ic => ic.email && ic.email.toLowerCase() === email);
                if (isInCharge) return 'LAB_INCHARGE';
            }
        }

        return 'GUEST';
    },

    updateProfile() {
        if (!this.state.currentUser) return;

        this.dom.profileName.textContent = this.state.currentUser.displayName || 'No Name';
        this.dom.profileEmail.textContent = this.state.currentUser.email;

        // Display profile picture
        if (this.state.currentUser.photoURL) {
            this.dom.profilePic.src = this.state.currentUser.photoURL;
            this.dom.profilePic.style.display = 'block';
        } else {
            this.dom.profilePic.style.display = 'none';
        }

        const role = this.getUserRole();
        let roleText = 'Guest (View Only)';

        if (role === 'ADMIN') {
            roleText = 'Teacher (Admin)';
        } else if (role === 'LAB_INCHARGE') {
            const subjects = [];
            for (const subj in this.state.labInCharges) {
                const incharges = this.state.labInCharges[subj] || [];
                const isInCharge = incharges.some(ic =>
                    ic.email && ic.email.toLowerCase() === this.state.currentUser.email.toLowerCase()
                );
                if (isInCharge) {
                    subjects.push(subj.replace('_', ' '));
                }
            }
            roleText = `Lab In-Charge (${subjects.join(', ')})`;
        }

        this.dom.profileRole.textContent = roleText;
    },

    updateUIVisibility() {
        const role = this.getUserRole();

        // Elements to manage
        const addItemBtns = document.querySelectorAll('.add-item-btn');
        const settingsTabBtn = document.querySelector('[data-tab="settings"]');
        const subjectTabBtns = document.querySelectorAll('.tab-btn[data-tab="general-science"], .tab-btn[data-tab="biology"], .tab-btn[data-tab="physics"], .tab-btn[data-tab="chemistry"]');

        if (role === 'GUEST') {
            // Hide Actions
            addItemBtns.forEach(btn => btn.style.display = 'none');
            // Hide Tabs
            if (settingsTabBtn) settingsTabBtn.style.display = 'none';
            subjectTabBtns.forEach(btn => btn.style.display = 'none');

            // Redirect to Reports if on a hidden tab
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab && activeTab.dataset.tab !== 'reports' && activeTab.dataset.tab !== 'profile') {
                this.switchTab('reports');
            }
        } else if (role === 'LAB_INCHARGE') {
            addItemBtns.forEach(btn => btn.style.display = 'none');
            if (settingsTabBtn) settingsTabBtn.style.display = 'none';

            // Show tabs ONLY for assigned subjects
            subjectTabBtns.forEach(btn => {
                const subject = btn.dataset.tab.replace('-', '_'); // Handle 'general-science' vs 'general_science'
                const incharges = this.state.labInCharges[subject] || [];
                const isAssigned = incharges.some(ic =>
                    ic.email && ic.email.toLowerCase() === this.state.currentUser.email.toLowerCase()
                );

                if (isAssigned) {
                    btn.style.display = 'flex';
                } else {
                    btn.style.display = 'none';
                }
            });

            // Redirect if on an unassigned tab
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab) {
                const activeSubject = activeTab.dataset.tab.replace('-', '_');
                // Check if it's a subject tab and if user is assigned
                const isSubjectTab = ['general_science', 'biology', 'physics', 'chemistry'].includes(activeSubject);

                if (isSubjectTab) {
                    const incharges = this.state.labInCharges[activeSubject] || [];
                    const isAssigned = incharges.some(ic =>
                        ic.email && ic.email.toLowerCase() === this.state.currentUser.email.toLowerCase()
                    );
                    if (!isAssigned) {
                        this.switchTab('reports'); // Redirect to safe tab
                    }
                }
            }
        } else {
            // ADMIN
            addItemBtns.forEach(btn => btn.style.display = 'inline-flex');
            if (settingsTabBtn) settingsTabBtn.style.display = 'flex';
            subjectTabBtns.forEach(btn => btn.style.display = 'flex');
        }
    },

    // --- Data Sync ---

    handleRemoteDataUpdate(data) {
        if (!data) data = {};

        // Load teachers
        let teachersData = data.teachers || [];
        if (teachersData && typeof teachersData === 'object' && !Array.isArray(teachersData)) {
            teachersData = Object.values(teachersData);
        }

        // Auto-migrate hardcoded admins
        if (teachersData.length === 0 && this.admins.length > 0) {
            teachersData = this.admins.map(email => ({
                id: Storage.generateId(),
                name: email.split('@')[0],
                email: email
            }));
            Storage.saveTeachers(teachersData);
        }

        this.state.teachers = teachersData;

        // Load lab in-charges
        this.state.labInCharges = data.lab_incharges || {
            general_science: [],
            biology: [],
            physics: [],
            chemistry: []
        };

        // Load inventory
        this.state.inventory = data.inventory || {
            general_science: [],
            biology: [],
            physics: [],
            chemistry: []
        };

        // Convert objects to arrays if needed
        for (const subject in this.state.inventory) {
            let items = this.state.inventory[subject];
            if (items && typeof items === 'object' && !Array.isArray(items)) {
                this.state.inventory[subject] = Object.values(items);
            } else if (!items) {
                this.state.inventory[subject] = [];
            }
        }

        // Load transactions
        this.state.transactions = data.transactions || {
            general_science: [],
            biology: [],
            physics: [],
            chemistry: []
        };

        // Convert transactions to arrays
        for (const subject in this.state.transactions) {
            let trans = this.state.transactions[subject];
            if (trans && typeof trans === 'object' && !Array.isArray(trans)) {
                this.state.transactions[subject] = Object.values(trans);
            } else if (!trans) {
                this.state.transactions[subject] = [];
            }
        }

        // Render UI
        this.renderTeachersList();
        this.renderAllInventories();
        this.updateProfile();
        this.updateUIVisibility();
    },

    // --- Teachers Management ---

    async addTeacher() {
        const name = this.dom.teacherName.value.trim();
        const email = this.dom.teacherEmail.value.trim().toLowerCase();

        if (!email) {
            alert('Email is required');
            return;
        }

        if (!email.endsWith('@gmail.com')) {
            alert('Only @gmail.com email addresses are allowed');
            return;
        }

        const exists = this.state.teachers.some(t => t.email.toLowerCase() === email);
        if (exists) {
            alert('This teacher already exists');
            return;
        }

        const newTeacher = {
            id: Storage.generateId(),
            name: name || email.split('@')[0],
            email: email
        };

        this.state.teachers.push(newTeacher);
        await Storage.saveTeachers(this.state.teachers);

        this.dom.teacherName.value = '';
        this.dom.teacherEmail.value = '';
        this.dom.addTeacherForm.style.display = 'none';
        this.showToast('Teacher added successfully');
    },

    async deleteTeacher(id) {
        if (!confirm('Remove this teacher from admin list?')) return;

        this.state.teachers = this.state.teachers.filter(t => t.id !== id);
        await Storage.saveTeachers(this.state.teachers);
        this.showToast('Teacher removed');
    },

    renderTeachersList() {
        if (!this.dom.teachersList) return;

        this.dom.teachersList.innerHTML = '';

        if (this.state.teachers.length === 0) {
            this.dom.teachersList.innerHTML = '<p class="empty-state">No teachers added yet.</p>';
            return;
        }

        this.state.teachers.forEach(teacher => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `
                <div class="list-item-info">
                    <strong>${teacher.name}</strong>
                    <span>${teacher.email}</span>
                </div>
                <button class="btn btn-sm btn-danger" onclick="App.deleteTeacher('${teacher.id}')">
                    Remove
                </button>
            `;
            this.dom.teachersList.appendChild(div);
        });
    },

    // --- Lab In-Charge Management ---

    openInchargeModal(subject) {
        this.state.currentSubject = subject;
        const subjectName = subject.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        this.dom.inchargeModalTitle.textContent = `Manage Lab In-Charges - ${subjectName}`;

        // Populate existing in-charges
        const incharges = this.state.labInCharges[subject] || [];
        const rows = this.dom.inchargeRows.querySelectorAll('tr');

        rows.forEach((row, idx) => {
            const nameInput = row.querySelector('[data-incharge="name"]');
            const emailInput = row.querySelector('[data-incharge="email"]');

            if (incharges[idx]) {
                nameInput.value = incharges[idx].name || '';
                emailInput.value = incharges[idx].email || '';
            } else {
                nameInput.value = '';
                emailInput.value = '';
            }
        });

        this.dom.inchargeModal.classList.add('active');
    },

    closeInchargeModal() {
        this.dom.inchargeModal.classList.remove('active');
        this.state.currentSubject = null;
    },

    async saveLabInCharges() {
        const subject = this.state.currentSubject;
        if (!subject) return;

        const incharges = [];
        const rows = this.dom.inchargeRows.querySelectorAll('tr');

        rows.forEach(row => {
            const name = row.querySelector('[data-incharge="name"]').value.trim();
            const email = row.querySelector('[data-incharge="email"]').value.trim();

            if (email) {
                if (!email.endsWith('@gmail.com')) {
                    alert(`Invalid email: ${email}. Only @gmail.com addresses are allowed.`);
                    throw new Error('Validation failed');
                }
                incharges.push({ name: name || 'Lab Assistant', email: email });
            }
        });

        this.state.labInCharges[subject] = incharges;
        await Storage.saveLabInCharges(subject, incharges);

        this.closeInchargeModal();
        this.showToast('Lab in-charges updated successfully');
    },

    // --- Inventory Management ---

    renderAllInventories() {
        const subjects = ['general_science', 'biology', 'physics', 'chemistry'];
        subjects.forEach(subject => this.renderInventory(subject));
    },

    renderInventory(subject) {
        const tbody = document.querySelector(`.inventory-list[data-subject="${subject}"]`);
        if (!tbody) return;

        tbody.innerHTML = '';

        const items = this.state.inventory[subject] || [];

        if (items.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="6">No items in inventory. Click "+ Add Item" to get started.</td>
                </tr>
            `;
            return;
        }

        items.forEach(item => {
            const row = document.createElement('tr');

            // Determine stock status
            let stockClass = 'normal';
            if (item.quantity === 0) {
                stockClass = 'out';
            } else if (item.minStockLevel && item.quantity <= item.minStockLevel) {
                stockClass = 'low';
            }

            const role = this.getUserRole(subject);
            const canEdit = role === 'ADMIN';
            const canUpdate = role === 'ADMIN' || role === 'LAB_INCHARGE';

            row.innerHTML = `
                <td>${item.itemNumber}</td>
                <td>${item.particulars}</td>
                <td>
                    <span class="stock-status ${stockClass}">
                        ${item.quantity}
                    </span>
                </td>
                <td>₹${parseFloat(item.price || 0).toFixed(2)}</td>
                <td>${item.remarks || '-'}</td>
                <td class="table-actions">
                    ${canUpdate ? `<button class="btn-icon" onclick="App.openStockModal('${subject}', '${item.id}')" title="Update Stock">📦</button>` : ''}
                    ${canEdit ? `<button class="btn-icon" onclick="App.editItem('${subject}', '${item.id}')" title="Edit">✏️</button>` : ''}
                    ${canEdit ? `<button class="btn-icon" onclick="App.deleteItem('${subject}', '${item.id}')" title="Delete">🗑️</button>` : ''}
                </td>
            `;

            tbody.appendChild(row);
        });
    },

    openItemModal(subject, itemId = null) {
        this.state.editingSubject = subject;
        this.state.editingItem = null;

        if (itemId) {
            const item = this.state.inventory[subject].find(i => i.id === itemId);
            if (item) {
                this.state.editingItem = item;
                this.dom.itemModalTitle.textContent = 'Edit Item';
                this.dom.itemNumber.value = item.itemNumber;
                this.dom.itemParticulars.value = item.particulars;
                this.dom.itemQuantity.value = item.quantity;
                this.dom.itemPrice.value = item.price;
                this.dom.itemMinStock.value = item.minStockLevel || 10;
                this.dom.itemRemarks.value = item.remarks || '';
            }
        } else {
            this.dom.itemModalTitle.textContent = 'Add New Item';
            this.dom.itemNumber.value = '';
            this.dom.itemParticulars.value = '';
            this.dom.itemQuantity.value = '';
            this.dom.itemPrice.value = '';
            this.dom.itemMinStock.value = '10';
            this.dom.itemRemarks.value = '';
        }

        this.dom.itemModal.classList.add('active');
    },

    closeItemModal() {
        this.dom.itemModal.classList.remove('active');
        this.state.editingItem = null;
        this.state.editingSubject = null;
    },

    async saveItem() {
        const subject = this.state.editingSubject;
        if (!subject) return;

        const itemNumber = this.dom.itemNumber.value.trim();
        const particulars = this.dom.itemParticulars.value.trim();
        const quantity = parseInt(this.dom.itemQuantity.value) || 0;
        const price = parseFloat(this.dom.itemPrice.value) || 0;
        const minStockLevel = parseInt(this.dom.itemMinStock.value) || 10;
        const remarks = this.dom.itemRemarks.value.trim();

        if (!itemNumber || !particulars) {
            alert('Item Number and Particulars are required');
            return;
        }

        if (this.state.editingItem) {
            // Edit existing item
            const item = this.state.editingItem;
            item.itemNumber = itemNumber;
            item.particulars = particulars;
            item.quantity = quantity;
            item.price = price;
            item.minStockLevel = minStockLevel;
            item.remarks = remarks;

            await Storage.saveItem(subject, item);
            this.showToast('Item updated successfully');
        } else {
            // Add new item
            const newItem = {
                id: Storage.generateId(),
                itemNumber,
                particulars,
                quantity,
                price,
                minStockLevel,
                remarks,
                dateAdded: new Date().toISOString().split('T')[0]
            };

            if (!this.state.inventory[subject]) {
                this.state.inventory[subject] = [];
            }
            this.state.inventory[subject].push(newItem);

            await Storage.saveItem(subject, newItem);

            // Log transaction
            await this.logTransaction(subject, {
                itemId: newItem.id,
                itemNumber: newItem.itemNumber,
                particulars: newItem.particulars,
                type: 'addition',
                quantityChange: quantity,
                newQuantity: quantity,
                reason: 'Initial stock'
            });

            this.showToast('Item added successfully');
        }

        this.closeItemModal();
    },

    editItem(subject, itemId) {
        this.openItemModal(subject, itemId);
    },

    async deleteItem(subject, itemId) {
        if (!confirm('Are you sure you want to delete this item?')) return;

        this.state.inventory[subject] = this.state.inventory[subject].filter(i => i.id !== itemId);
        await Storage.deleteItem(subject, itemId);
        this.showToast('Item deleted');
    },

    // --- Stock Management ---

    openStockModal(subject, itemId) {
        const item = this.state.inventory[subject].find(i => i.id === itemId);
        if (!item) return;

        this.state.currentStockItem = { subject, item };

        this.dom.stockItemName.textContent = `${item.itemNumber} - ${item.particulars}`;
        this.dom.stockCurrentQty.textContent = item.quantity;
        this.dom.stockQuantity.value = '';
        this.dom.stockReason.value = '';
        this.dom.stockAction.value = 'add';

        this.dom.stockModal.classList.add('active');
    },

    closeStockModal() {
        this.dom.stockModal.classList.remove('active');
        this.state.currentStockItem = null;
    },

    async saveStock() {
        if (!this.state.currentStockItem) return;

        const { subject, item } = this.state.currentStockItem;
        const action = this.dom.stockAction.value;
        const quantity = parseInt(this.dom.stockQuantity.value) || 0;
        const reason = this.dom.stockReason.value.trim();

        if (quantity <= 0) {
            alert('Please enter a valid quantity');
            return;
        }

        if (!reason) {
            alert('Please provide a reason');
            return;
        }

        let newQuantity = item.quantity;
        let quantityChange = 0;

        if (action === 'add') {
            newQuantity += quantity;
            quantityChange = quantity;
        } else if (action === 'breakage') {
            if (quantity > item.quantity) {
                alert('Breakage quantity cannot exceed current stock');
                return;
            }
            newQuantity -= quantity;
            quantityChange = -quantity;
        }

        item.quantity = newQuantity;
        await Storage.saveItem(subject, item);

        // Log transaction
        await this.logTransaction(subject, {
            itemId: item.id,
            itemNumber: item.itemNumber,
            particulars: item.particulars,
            type: action,
            quantityChange,
            newQuantity,
            reason
        });

        this.closeStockModal();
        this.showToast('Stock updated successfully');
    },

    async logTransaction(subject, data) {
        const transaction = {
            id: Storage.generateId(),
            ...data,
            performedBy: this.state.currentUser.email,
            performedByName: this.state.currentUser.displayName || this.state.currentUser.email,
            timestamp: new Date().toISOString()
        };

        await Storage.addTransaction(subject, transaction);
    },

    // --- Search & Filter ---

    filterInventory(subject, searchTerm) {
        const tbody = document.querySelector(`.inventory-list[data-subject="${subject}"]`);
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr:not(.empty-state)');
        const term = searchTerm.toLowerCase();

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    },

    applyFilter(subject, filterType) {
        const items = this.state.inventory[subject] || [];
        const tbody = document.querySelector(`.inventory-list[data-subject="${subject}"]`);
        if (!tbody) return;

        tbody.innerHTML = '';

        let filteredItems = items;

        if (filterType === 'low-stock') {
            filteredItems = items.filter(item =>
                item.minStockLevel && item.quantity > 0 && item.quantity <= item.minStockLevel
            );
        } else if (filterType === 'out-of-stock') {
            filteredItems = items.filter(item => item.quantity === 0);
        }

        if (filteredItems.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="6">No items match this filter.</td>
                </tr>
            `;
            return;
        }

        // Re-render with filtered items
        const tempInventory = this.state.inventory[subject];
        this.state.inventory[subject] = filteredItems;
        this.renderInventory(subject);
        this.state.inventory[subject] = tempInventory;
    },

    // --- Reports ---

    generateReport() {
        const subject = this.dom.reportSubject.value;
        const reportType = this.dom.reportType.value;

        if (reportType === 'current-stock') {
            this.generateStockReport(subject);
        } else if (reportType === 'low-stock') {
            this.generateLowStockReport(subject);
        } else if (reportType === 'transactions') {
            this.generateTransactionReport(subject);
        }

        this.dom.exportExcelBtn.style.display = 'inline-flex';
        this.dom.printReportBtn.style.display = 'inline-flex';
    },

    generateStockReport(subjectFilter) {
        const subjects = subjectFilter === 'all'
            ? ['general_science', 'biology', 'physics', 'chemistry']
            : [subjectFilter];

        let html = '<div class="report-summary"><h3>Current Stock Report</h3></div>';

        subjects.forEach(subject => {
            const items = this.state.inventory[subject] || [];
            if (items.length === 0) return;

            const subjectName = subject.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

            html += `<h4 style="margin-top: 2rem;">${subjectName}</h4>`;
            html += `
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Item #</th>
                            <th>Particulars</th>
                            <th>Quantity</th>
                            <th>Price (₹)</th>
                            <th>Total Value (₹)</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            let totalValue = 0;

            items.forEach(item => {
                const itemValue = item.quantity * item.price;
                totalValue += itemValue;

                html += `
                    <tr>
                        <td>${item.itemNumber}</td>
                        <td>${item.particulars}</td>
                        <td>${item.quantity}</td>
                        <td>₹${parseFloat(item.price).toFixed(2)}</td>
                        <td>₹${itemValue.toFixed(2)}</td>
                        <td>${item.remarks || '-'}</td>
                    </tr>
                `;
            });

            html += `
                    <tr style="font-weight: bold; background: #f3f4f6;">
                        <td colspan="4">Total</td>
                        <td>₹${totalValue.toFixed(2)}</td>
                        <td></td>
                    </tr>
                    </tbody>
                </table>
            `;
        });

        this.dom.reportContainer.innerHTML = html;
    },

    generateLowStockReport(subjectFilter) {
        const subjects = subjectFilter === 'all'
            ? ['general_science', 'biology', 'physics', 'chemistry']
            : [subjectFilter];

        let html = '<div class="report-summary"><h3>Low Stock Alert Report</h3></div>';

        subjects.forEach(subject => {
            const items = (this.state.inventory[subject] || []).filter(item =>
                item.minStockLevel && item.quantity <= item.minStockLevel
            );

            if (items.length === 0) return;

            const subjectName = subject.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

            html += `<h4 style="margin-top: 2rem;">${subjectName}</h4>`;
            html += `
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Item #</th>
                            <th>Particulars</th>
                            <th>Current Qty</th>
                            <th>Min Level</th>
                            <th>Status</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            items.forEach(item => {
                const status = item.quantity === 0 ? '🔴 Out of Stock' : '🟡 Low Stock';

                html += `
                    <tr>
                        <td>${item.itemNumber}</td>
                        <td>${item.particulars}</td>
                        <td>${item.quantity}</td>
                        <td>${item.minStockLevel}</td>
                        <td>${status}</td>
                        <td>${item.remarks || '-'}</td>
                    </tr>
                `;
            });

            html += `</tbody></table>`;
        });

        if (html === '<div class="report-summary"><h3>Low Stock Alert Report</h3></div>') {
            html += '<p class="empty-state">No low stock items found.</p>';
        }

        this.dom.reportContainer.innerHTML = html;
    },

    generateTransactionReport(subjectFilter) {
        const subjects = subjectFilter === 'all'
            ? ['general_science', 'biology', 'physics', 'chemistry']
            : [subjectFilter];

        const dateFrom = this.dom.reportDateFrom.value;
        const dateTo = this.dom.reportDateTo.value;

        let html = '<div class="report-summary"><h3>Transaction History Report</h3></div>';

        subjects.forEach(subject => {
            let transactions = this.state.transactions[subject] || [];

            // Filter by date if provided
            if (dateFrom || dateTo) {
                transactions = transactions.filter(t => {
                    const tDate = t.timestamp.split('T')[0];
                    if (dateFrom && tDate < dateFrom) return false;
                    if (dateTo && tDate > dateTo) return false;
                    return true;
                });
            }

            if (transactions.length === 0) return;

            const subjectName = subject.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

            html += `<h4 style="margin-top: 2rem;">${subjectName}</h4>`;
            html += `
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Item #</th>
                            <th>Particulars</th>
                            <th>Type</th>
                            <th>Change</th>
                            <th>New Qty</th>
                            <th>Reason</th>
                            <th>By</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            transactions.forEach(t => {
                const date = new Date(t.timestamp).toLocaleDateString();
                const typeLabel = t.type === 'addition' ? '➕ Addition' : '❌ Breakage';
                const changeColor = t.quantityChange > 0 ? 'green' : 'red';

                html += `
                    <tr>
                        <td>${date}</td>
                        <td>${t.itemNumber}</td>
                        <td>${t.particulars}</td>
                        <td>${typeLabel}</td>
                        <td style="color: ${changeColor}; font-weight: bold;">${t.quantityChange > 0 ? '+' : ''}${t.quantityChange}</td>
                        <td>${t.newQuantity}</td>
                        <td>${t.reason}</td>
                        <td>${t.performedByName}</td>
                    </tr>
                `;
            });

            html += `</tbody></table>`;
        });

        if (html === '<div class="report-summary"><h3>Transaction History Report</h3></div>') {
            html += '<p class="empty-state">No transactions found.</p>';
        }

        this.dom.reportContainer.innerHTML = html;
    },

    exportToExcel() {
        const reportContainer = this.dom.reportContainer;
        const tables = reportContainer.querySelectorAll('table');

        if (tables.length === 0) {
            alert('No report to export');
            return;
        }

        const wb = XLSX.utils.book_new();

        tables.forEach((table, index) => {
            const ws = XLSX.utils.table_to_sheet(table);
            const sheetName = `Sheet${index + 1}`;
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });

        const filename = `Lab_Inventory_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);

        this.showToast('Report exported to Excel');
    },

    showToast(message, duration = 3000) {
        this.dom.toast.textContent = message;
        this.dom.toast.classList.add('show');
        setTimeout(() => {
            this.dom.toast.classList.remove('show');
        }, duration);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
