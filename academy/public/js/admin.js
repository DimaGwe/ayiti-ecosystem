/**
 * Admin Dashboard - Haiti Skills Academy
 */

const Admin = {
    user: null,
    currentSection: 'dashboard',
    searchTimeout: null,
    currentCourseId: null,
    usersPage: 1,
    certsPage: 1,

    // Initialize
    async init() {
        await this.checkAuth();
        this.setupNavigation();
        this.setupTabs();
        this.loadSection('dashboard');
    },

    // Check authentication and admin role
    async checkAuth() {
        try {
            const response = await fetch('/api/user');
            const data = await response.json();

            if (!data.user || data.user.role !== 'admin') {
                alert('Access denied. Admin privileges required.');
                window.location.href = '/';
                return;
            }

            this.user = data.user;
            document.getElementById('admin-user-name').textContent = this.user.name;
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '/';
        }
    },

    // API Helper
    async api(endpoint, options = {}) {
        const config = {
            headers: { 'Content-Type': 'application/json' },
            ...options
        };

        if (options.body) {
            config.body = JSON.stringify(options.body);
        }

        const response = await fetch(`/api/admin${endpoint}`, config);
        return response.json();
    },

    // Navigation
    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.loadSection(section);
            });
        });

        // Handle hash changes
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1) || 'dashboard';
            this.loadSection(hash);
        });

        // Load from initial hash
        if (window.location.hash) {
            this.loadSection(window.location.hash.slice(1));
        }
    },

    loadSection(section) {
        this.currentSection = section;

        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        // Update sections
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.classList.toggle('active', sec.id === `section-${section}`);
        });

        // Update title
        const titles = {
            dashboard: 'Dashboard',
            courses: 'Course Management',
            users: 'User Management',
            teachers: 'Teacher Management',
            certifications: 'Certification Management',
            companies: 'Company Management',
            'ai-tutor': 'AI Tutor Configuration',
            'ai-teachers': 'AI Community Teachers'
        };
        document.getElementById('page-title').textContent = titles[section] || 'Dashboard';

        // Load data
        this.loadSectionData(section);
    },

    async loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'courses':
                await this.loadCourses();
                break;
            case 'users':
                await this.loadUsers();
                break;
            case 'teachers':
                await this.loadTeachers();
                break;
            case 'certifications':
                await this.loadCertifications();
                break;
            case 'companies':
                await this.loadCompanies();
                break;
            case 'ai-tutor':
                await this.loadAITutor();
                break;
            case 'ai-teachers':
                await this.loadAITeachers();
                break;
        }
    },

    // Tabs
    setupTabs() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;

                // Update tab buttons
                tab.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Update tab content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.toggle('active', content.id === `tab-${tabId}`);
                });
            });
        });
    },

    // ==================== DASHBOARD ====================

    async loadDashboard() {
        try {
            const data = await this.api('/stats');

            if (data.success) {
                const { stats } = data;

                document.getElementById('stat-users').textContent = stats.totalUsers;
                document.getElementById('stat-courses').textContent = stats.totalCourses;
                document.getElementById('stat-enrollments').textContent = stats.totalEnrollments;
                document.getElementById('stat-certifications').textContent = stats.totalCertifications;
                document.getElementById('stat-companies').textContent = stats.totalCompanies;

                // Recent users
                const usersContainer = document.getElementById('recent-users');
                if (stats.recentUsers.length > 0) {
                    usersContainer.innerHTML = stats.recentUsers.map(user => `
                        <div class="user-list-item">
                            ${user.avatar ? `<img src="${user.avatar}" class="user-avatar-small">` : '<span class="user-avatar-small">👤</span>'}
                            <div>
                                <strong>${user.name}</strong>
                                <br><small>${user.email}</small>
                            </div>
                            <span class="role-badge role-${user.role}">${user.role}</span>
                        </div>
                    `).join('');
                } else {
                    usersContainer.innerHTML = '<p>No users yet</p>';
                }

                // Enrollment status
                const statusContainer = document.getElementById('enrollment-status');
                if (stats.enrollmentsByStatus.length > 0) {
                    statusContainer.innerHTML = stats.enrollmentsByStatus.map(item => `
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border);">
                            <span>${this.formatStatus(item.status)}</span>
                            <strong>${item.count}</strong>
                        </div>
                    `).join('');
                } else {
                    statusContainer.innerHTML = '<p>No enrollments yet</p>';
                }
            }
        } catch (error) {
            console.error('Dashboard load error:', error);
        }
    },

    formatStatus(status) {
        const labels = {
            enrolled: 'Enrolled',
            in_progress: 'In Progress',
            completed: 'Theory Complete',
            practical: 'Practical Phase',
            testing: 'Testing',
            certified: 'Certified',
            dropped: 'Dropped'
        };
        return labels[status] || status;
    },

    // ==================== COURSES ====================

    async loadCourses() {
        try {
            const data = await this.api('/courses');
            const tbody = document.getElementById('courses-table');

            if (data.success && data.courses.length > 0) {
                tbody.innerHTML = data.courses.map(course => `
                    <tr>
                        <td>
                            <strong>${course.name}</strong>
                            <br><small>${course.Modules?.length || 0} modules</small>
                        </td>
                        <td>${course.enrolledCount}</td>
                        <td>${course.certifiedCount}</td>
                        <td>${course.theoryCompletionRequired}%</td>
                        <td>${course.practicalHoursRequired}h</td>
                        <td>
                            <span class="status-badge ${course.isActive ? 'status-active' : 'status-inactive'}">
                                ${course.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td class="action-buttons">
                            <button class="btn btn-small btn-secondary" onclick="Admin.editCourse(${course.id})">Edit</button>
                            <button class="btn btn-small btn-primary" onclick="Admin.manageModules(${course.id})">Modules</button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="7">No courses found</td></tr>';
            }
        } catch (error) {
            console.error('Courses load error:', error);
        }
    },

    showCourseModal(course = null) {
        document.getElementById('course-modal-title').textContent = course ? 'Edit Course' : 'Add Course';
        document.getElementById('course-form').reset();

        if (course) {
            document.getElementById('course-id').value = course.id;
            document.getElementById('course-name').value = course.name;
            document.getElementById('course-description').value = course.description || '';
            document.getElementById('course-theory').value = course.theoryCompletionRequired;
            document.getElementById('course-practical').value = course.practicalHoursRequired;
            document.getElementById('course-physical').checked = course.physicalTestRequired;
            document.getElementById('course-featured').checked = course.isFeatured;
        } else {
            document.getElementById('course-id').value = '';
        }

        this.openModal('course-modal');
    },

    async editCourse(id) {
        try {
            const data = await this.api('/courses');
            const course = data.courses.find(c => c.id === id);
            if (course) {
                this.showCourseModal(course);
            }
        } catch (error) {
            console.error('Load course error:', error);
        }
    },

    async saveCourse(event) {
        event.preventDefault();

        const form = event.target;
        const id = form.querySelector('#course-id').value;
        const courseData = {
            name: form.querySelector('#course-name').value,
            description: form.querySelector('#course-description').value,
            theoryCompletionRequired: parseInt(form.querySelector('#course-theory').value),
            practicalHoursRequired: parseInt(form.querySelector('#course-practical').value),
            physicalTestRequired: form.querySelector('#course-physical').checked,
            isFeatured: form.querySelector('#course-featured').checked
        };

        try {
            const endpoint = id ? `/courses/${id}` : '/courses';
            const method = id ? 'PUT' : 'POST';

            const data = await this.api(endpoint, { method, body: courseData });

            if (data.success) {
                this.closeModal();
                this.loadCourses();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Save course error:', error);
            alert('Failed to save course');
        }
    },

    async manageModules(courseId) {
        this.currentCourseId = courseId;
        // For now, just show an alert - we can expand this to a full module management view
        try {
            const data = await this.api(`/courses/${courseId}/modules`);
            if (data.success) {
                const moduleList = data.modules.map(m => `${m.order + 1}. ${m.name}`).join('\n');
                alert(`Modules for this course:\n\n${moduleList || 'No modules yet'}\n\nModule management UI coming soon!`);
            }
        } catch (error) {
            console.error('Load modules error:', error);
        }
    },

    // ==================== USERS ====================

    async loadUsers() {
        try {
            const role = document.getElementById('user-role-filter').value;
            const search = document.getElementById('user-search').value;

            const params = new URLSearchParams({
                page: this.usersPage,
                limit: 20,
                ...(role && { role }),
                ...(search && { search })
            });

            const data = await this.api(`/users?${params}`);
            const tbody = document.getElementById('users-table');

            if (data.success && data.users.length > 0) {
                tbody.innerHTML = data.users.map(user => `
                    <tr>
                        <td>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                ${user.avatar ? `<img src="${user.avatar}" class="user-avatar-small">` : '<span>👤</span>'}
                                <strong>${user.name}</strong>
                            </div>
                        </td>
                        <td>${user.email}</td>
                        <td><span class="role-badge role-${user.role}">${user.role}</span></td>
                        <td>${user.credits}</td>
                        <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                        <td class="action-buttons">
                            <button class="btn btn-small btn-secondary" onclick="Admin.editUser(${user.id})">Edit</button>
                        </td>
                    </tr>
                `).join('');

                this.renderPagination('users-pagination', data.pagination, (page) => {
                    this.usersPage = page;
                    this.loadUsers();
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
            }
        } catch (error) {
            console.error('Users load error:', error);
        }
    },

    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.usersPage = 1;
            this.loadUsers();
        }, 300);
    },

    async editUser(id) {
        try {
            const data = await this.api(`/users/${id}`);

            if (data.success) {
                const user = data.user;
                document.getElementById('user-id').value = user.id;
                document.getElementById('user-avatar').src = user.avatar || '';
                document.getElementById('user-display-name').textContent = user.name;
                document.getElementById('user-display-email').textContent = user.email;
                document.getElementById('user-role').value = user.role;
                document.getElementById('user-credits').value = user.credits;
                document.getElementById('user-active').checked = user.isActive;

                this.openModal('user-modal');
            }
        } catch (error) {
            console.error('Load user error:', error);
        }
    },

    async saveUser(event) {
        event.preventDefault();

        const form = event.target;
        const id = form.querySelector('#user-id').value;
        const userData = {
            role: form.querySelector('#user-role').value,
            credits: parseInt(form.querySelector('#user-credits').value),
            isActive: form.querySelector('#user-active').checked
        };

        try {
            const data = await this.api(`/users/${id}`, { method: 'PUT', body: userData });

            if (data.success) {
                this.closeModal();
                this.loadUsers();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Save user error:', error);
            alert('Failed to save user');
        }
    },

    // ==================== TEACHERS ====================

    async loadTeachers() {
        await Promise.all([
            this.loadCurrentTeachers(),
            this.loadPendingInvites(),
            this.loadPotentialTeachers()
        ]);
    },

    async loadCurrentTeachers() {
        try {
            const data = await this.api('/users?role=instructor&limit=50');
            const tbody = document.getElementById('teachers-table');

            if (data.success && data.users.length > 0) {
                tbody.innerHTML = data.users.map(teacher => `
                    <tr>
                        <td>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                ${teacher.avatar ? `<img src="${teacher.avatar}" class="user-avatar-small">` : '<span>👤</span>'}
                                <strong>${teacher.name}</strong>
                            </div>
                        </td>
                        <td>${teacher.email}</td>
                        <td>0</td>
                        <td>0</td>
                        <td>${new Date(teacher.createdAt).toLocaleDateString()}</td>
                        <td class="action-buttons">
                            <button class="btn btn-small btn-secondary" onclick="Admin.editUser(${teacher.id})">Edit</button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="6">No teachers yet</td></tr>';
            }
        } catch (error) {
            console.error('Teachers load error:', error);
        }
    },

    async loadPendingInvites() {
        try {
            const data = await this.api('/teachers/invites');
            const tbody = document.getElementById('invites-table');

            if (data.success && data.invites.length > 0) {
                tbody.innerHTML = data.invites.map(invite => `
                    <tr>
                        <td>${invite.email}</td>
                        <td>${invite.name || '-'}</td>
                        <td>Admin</td>
                        <td>${new Date(invite.expiresAt).toLocaleDateString()}</td>
                        <td class="action-buttons">
                            <button class="btn btn-small btn-secondary" onclick="Admin.copyLink('${invite.token}')">Copy Link</button>
                            <button class="btn btn-small btn-danger" onclick="Admin.revokeInvite('${invite.token}')">Revoke</button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="5">No pending invites</td></tr>';
            }
        } catch (error) {
            console.error('Invites load error:', error);
        }
    },

    async loadPotentialTeachers() {
        try {
            const data = await this.api('/teachers/applications');
            const tbody = document.getElementById('potential-teachers-table');

            if (data.success && data.applications.length > 0) {
                tbody.innerHTML = data.applications.map(user => `
                    <tr>
                        <td>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                ${user.avatar ? `<img src="${user.avatar}" class="user-avatar-small">` : '<span>👤</span>'}
                                <strong>${user.name}</strong>
                            </div>
                        </td>
                        <td>${user.email}</td>
                        <td>${user.Certifications?.length || 0}</td>
                        <td>${user.credits}</td>
                        <td class="action-buttons">
                            <button class="btn btn-small btn-success" onclick="Admin.promoteToTeacher(${user.id})">Make Teacher</button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="5">No potential teachers found</td></tr>';
            }
        } catch (error) {
            console.error('Potential teachers load error:', error);
        }
    },

    showInviteModal() {
        document.getElementById('invite-form').reset();
        document.getElementById('invite-result').style.display = 'none';
        this.openModal('invite-modal');
    },

    async sendInvite(event) {
        event.preventDefault();

        const form = event.target;
        const inviteData = {
            email: form.querySelector('#invite-email').value,
            name: form.querySelector('#invite-name').value,
            message: form.querySelector('#invite-message').value
        };

        try {
            const data = await this.api('/teachers/invite', { method: 'POST', body: inviteData });

            if (data.success) {
                document.getElementById('invite-link').value = data.inviteLink;
                document.getElementById('invite-result').style.display = 'block';
                form.style.display = 'none';
                this.loadPendingInvites();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Send invite error:', error);
            alert('Failed to send invite');
        }
    },

    copyInviteLink() {
        const input = document.getElementById('invite-link');
        input.select();
        document.execCommand('copy');
        alert('Invite link copied to clipboard!');
    },

    async revokeInvite(token) {
        if (!confirm('Revoke this invite?')) return;

        try {
            const data = await this.api(`/teachers/invites/${token}`, { method: 'DELETE' });

            if (data.success) {
                this.loadPendingInvites();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Revoke invite error:', error);
        }
    },

    async promoteToTeacher(userId) {
        if (!confirm('Make this user a teacher?')) return;

        try {
            const data = await this.api(`/teachers/promote/${userId}`, { method: 'POST' });

            if (data.success) {
                alert(data.message);
                this.loadTeachers();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Promote error:', error);
        }
    },

    // ==================== CERTIFICATIONS ====================

    async loadCertifications() {
        try {
            const status = document.getElementById('cert-status-filter').value;
            const params = new URLSearchParams({
                page: this.certsPage,
                limit: 20,
                ...(status && { status })
            });

            const data = await this.api(`/certifications?${params}`);
            const tbody = document.getElementById('certifications-table');

            if (data.success && data.certifications.length > 0) {
                tbody.innerHTML = data.certifications.map(cert => `
                    <tr>
                        <td><code>${cert.certificateNumber || '-'}</code></td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                ${cert.User?.avatar ? `<img src="${cert.User.avatar}" class="user-avatar-small">` : '<span>👤</span>'}
                                ${cert.User?.name || 'Unknown'}
                            </div>
                        </td>
                        <td>${cert.Course?.name || 'Unknown'}</td>
                        <td>${cert.overallGrade || '-'}</td>
                        <td>${cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : '-'}</td>
                        <td>
                            <span class="status-badge ${cert.isValid ? 'status-active' : 'status-inactive'}">
                                ${cert.isValid ? 'Valid' : 'Revoked'}
                            </span>
                        </td>
                        <td class="action-buttons">
                            ${cert.isValid ?
                                `<button class="btn btn-small btn-danger" onclick="Admin.revokeCert(${cert.id})">Revoke</button>` :
                                `<button class="btn btn-small btn-success" onclick="Admin.reinstateCert(${cert.id})">Reinstate</button>`
                            }
                        </td>
                    </tr>
                `).join('');

                this.renderPagination('certs-pagination', data.pagination, (page) => {
                    this.certsPage = page;
                    this.loadCertifications();
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="7">No certifications found</td></tr>';
            }
        } catch (error) {
            console.error('Certifications load error:', error);
        }
    },

    async revokeCert(id) {
        const reason = prompt('Reason for revoking this certification:');
        if (!reason) return;

        try {
            const data = await this.api(`/certifications/${id}`, {
                method: 'PUT',
                body: { isValid: false, revokedReason: reason }
            });

            if (data.success) {
                this.loadCertifications();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Revoke cert error:', error);
        }
    },

    async reinstateCert(id) {
        if (!confirm('Reinstate this certification?')) return;

        try {
            const data = await this.api(`/certifications/${id}`, {
                method: 'PUT',
                body: { isValid: true }
            });

            if (data.success) {
                this.loadCertifications();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Reinstate cert error:', error);
        }
    },

    // ==================== COMPANIES ====================

    async loadCompanies() {
        try {
            const data = await this.api('/companies');
            const tbody = document.getElementById('companies-table');

            if (data.success && data.companies.length > 0) {
                tbody.innerHTML = data.companies.map(company => `
                    <tr>
                        <td>
                            <strong>${company.name}</strong>
                            ${company.tagline ? `<br><small>${company.tagline}</small>` : ''}
                        </td>
                        <td>${company.type || '-'}</td>
                        <td>${company.JobPostings?.filter(j => j.status === 'active').length || 0}</td>
                        <td>${company.graduatesHired}</td>
                        <td>
                            <span class="status-badge ${company.isVerified ? 'status-verified' : 'status-pending'}">
                                ${company.isVerified ? 'Verified' : 'Pending'}
                            </span>
                        </td>
                        <td class="action-buttons">
                            ${!company.isVerified ?
                                `<button class="btn btn-small btn-success" onclick="Admin.verifyCompany(${company.id})">Verify</button>` :
                                ''
                            }
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="6">No companies found</td></tr>';
            }
        } catch (error) {
            console.error('Companies load error:', error);
        }
    },

    async verifyCompany(id) {
        if (!confirm('Verify this company?')) return;

        try {
            const data = await this.api(`/companies/${id}/verify`, { method: 'PUT' });

            if (data.success) {
                this.loadCompanies();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Verify company error:', error);
        }
    },

    // ==================== AI TUTOR ====================

    aiSettings: null,

    async loadAITutor() {
        try {
            // Load settings
            const settingsData = await this.api('/ai-tutor/settings');
            if (settingsData.success) {
                this.aiSettings = settingsData.settings;
                this.populateAISettingsForm();
            }

            // Load stats
            const statsData = await this.api('/ai-tutor/stats');
            if (statsData.success) {
                document.getElementById('ai-stat-conversations').textContent = statsData.stats.totalConversations || 0;
                document.getElementById('ai-stat-messages').textContent = statsData.stats.totalMessages || 0;
                document.getElementById('ai-stat-status').textContent = this.aiSettings?.enabled ? 'Active' : 'Disabled';
            }

            // Load courses for instructions
            await this.loadCourseInstructions();
        } catch (error) {
            console.error('AI Tutor load error:', error);
        }
    },

    populateAISettingsForm() {
        const settings = this.aiSettings;
        if (!settings) return;

        document.getElementById('ai-enabled').checked = settings.enabled !== false;
        document.getElementById('ai-model').value = settings.model || 'deepseek-chat';
        document.getElementById('ai-temperature').value = settings.temperature ?? 0.7;
        document.getElementById('temp-value').textContent = settings.temperature ?? 0.7;
        document.getElementById('ai-max-tokens').value = settings.maxTokens || 1000;
        document.getElementById('ai-personality').value = settings.personality || 'helpful';
        document.getElementById('ai-response-style').value = settings.responseStyle || 'conversational';
        document.getElementById('ai-system-prompt').value = settings.systemPrompt || '';
        document.getElementById('ai-welcome-message').value = settings.welcomeMessage || '';
    },

    async saveAISettings(event) {
        event.preventDefault();

        const settings = {
            enabled: document.getElementById('ai-enabled').checked,
            model: document.getElementById('ai-model').value,
            temperature: parseFloat(document.getElementById('ai-temperature').value),
            maxTokens: parseInt(document.getElementById('ai-max-tokens').value),
            personality: document.getElementById('ai-personality').value,
            responseStyle: document.getElementById('ai-response-style').value
        };

        try {
            const data = await this.api('/ai-tutor/settings', {
                method: 'PUT',
                body: settings
            });

            if (data.success) {
                this.aiSettings = data.settings;
                alert('Settings saved successfully!');
                document.getElementById('ai-stat-status').textContent = settings.enabled ? 'Active' : 'Disabled';
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Save AI settings error:', error);
            alert('Failed to save settings');
        }
    },

    async saveAIPrompt(event) {
        event.preventDefault();

        const settings = {
            systemPrompt: document.getElementById('ai-system-prompt').value,
            welcomeMessage: document.getElementById('ai-welcome-message').value
        };

        try {
            const data = await this.api('/ai-tutor/settings', {
                method: 'PUT',
                body: settings
            });

            if (data.success) {
                this.aiSettings = data.settings;
                alert('Instructions saved successfully!');
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Save AI prompt error:', error);
            alert('Failed to save instructions');
        }
    },

    resetAIPrompt() {
        if (!confirm('Reset to default instructions?')) return;

        const defaultPrompt = `You are an AI Tutor for Haiti Skills Academy, an educational platform teaching practical skills to students in Haiti.

Your role:
- Help students understand course material
- Answer questions about Agriculture, Mechanic, Fishing, Boat Building, and Recycling courses
- Provide encouragement and support
- Explain concepts in simple, clear language
- When relevant, connect lessons to real-world applications in Haiti

Guidelines:
- Be patient and supportive
- Use examples relevant to Haiti when possible
- If you don't know something, say so honestly
- Keep responses focused and helpful
- Respond in the same language the student uses (Creole, French, or English)`;

        document.getElementById('ai-system-prompt').value = defaultPrompt;
        document.getElementById('ai-welcome-message').value = "Hello! I'm your AI Tutor. How can I help you today with your studies?";
    },

    async loadCourseInstructions() {
        try {
            const coursesData = await fetch('/api/courses').then(r => r.json());
            const container = document.getElementById('course-instructions-container');

            if (coursesData.success && coursesData.courses.length > 0) {
                const courseInstructions = this.aiSettings?.courseInstructions || {};

                container.innerHTML = coursesData.courses.map(course => `
                    <div class="course-instruction-card">
                        <h4>${course.name}</h4>
                        <textarea
                            id="course-inst-${course.id}"
                            rows="4"
                            placeholder="Add specific instructions for ${course.name} course..."
                        >${courseInstructions[course.id] || ''}</textarea>
                        <button class="btn btn-small btn-secondary" onclick="Admin.saveCourseInstruction('${course.id}')">
                            Save
                        </button>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p>No courses available</p>';
            }
        } catch (error) {
            console.error('Load course instructions error:', error);
        }
    },

    async saveCourseInstruction(courseId) {
        const instructions = document.getElementById(`course-inst-${courseId}`).value;

        try {
            const data = await this.api(`/ai-tutor/course-instructions/${courseId}`, {
                method: 'PUT',
                body: { instructions }
            });

            if (data.success) {
                alert('Course instructions saved!');
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Save course instruction error:', error);
            alert('Failed to save');
        }
    },

    testAITutor() {
        const console = document.getElementById('ai-test-console');
        console.style.display = console.style.display === 'none' ? 'block' : 'none';
        document.getElementById('ai-test-messages').innerHTML = '';
    },

    async sendTestMessage() {
        const input = document.getElementById('ai-test-input');
        const message = input.value.trim();
        if (!message) return;

        const messagesContainer = document.getElementById('ai-test-messages');

        // Show user message
        messagesContainer.innerHTML += `
            <div class="ai-test-msg user">
                <strong>You:</strong> ${message}
            </div>
        `;

        input.value = '';
        input.disabled = true;

        // Show loading
        messagesContainer.innerHTML += `
            <div class="ai-test-msg ai" id="ai-loading">
                <strong>AI:</strong> <em>Thinking...</em>
            </div>
        `;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
            const data = await this.api('/ai-tutor/test', {
                method: 'POST',
                body: { message }
            });

            // Remove loading
            document.getElementById('ai-loading').remove();

            if (data.success && data.result) {
                messagesContainer.innerHTML += `
                    <div class="ai-test-msg ai">
                        <strong>AI:</strong> ${data.result.content}
                        ${data.result.metadata ? `<br><small style="color: var(--gray);">Tokens: ${data.result.metadata.totalTokens || 'N/A'}</small>` : ''}
                    </div>
                `;
            } else {
                messagesContainer.innerHTML += `
                    <div class="ai-test-msg ai error">
                        <strong>Error:</strong> ${data.result?.error || data.error || 'Unknown error'}
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('ai-loading')?.remove();
            messagesContainer.innerHTML += `
                <div class="ai-test-msg ai error">
                    <strong>Error:</strong> ${error.message}
                </div>
            `;
        }

        input.disabled = false;
        input.focus();
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    // ==================== AI TEACHERS ====================

    async loadAITeachers() {
        const container = document.getElementById('ai-teachers-list');
        container.innerHTML = '<div class="loading">Loading AI Teachers...</div>';

        try {
            const response = await fetch('/api/ai-teachers');
            const data = await response.json();

            if (data.success && data.teachers.length > 0) {
                let totalResponses = 0;
                let totalPosts = 0;

                container.innerHTML = data.teachers.map(teacher => {
                    totalResponses += teacher.totalResponses || 0;
                    totalPosts += teacher.totalPosts || 0;

                    return `
                        <div class="ai-teacher-card">
                            <div class="ai-teacher-header">
                                <img src="${teacher.avatar || '/img/ai-teacher.png'}" alt="${teacher.name}" class="ai-teacher-avatar">
                                <div class="ai-teacher-info">
                                    <h4>${teacher.name}</h4>
                                    <p class="ai-teacher-title">${teacher.title || 'AI Teacher'}</p>
                                    <p class="ai-teacher-expertise">${teacher.expertise}</p>
                                </div>
                                <span class="ai-teacher-status ${teacher.isActive ? 'active' : 'inactive'}">
                                    ${teacher.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div class="ai-teacher-stats">
                                <div class="ai-teacher-stat">
                                    <span class="stat-number">${teacher.totalResponses || 0}</span>
                                    <span class="stat-label">Responses</span>
                                </div>
                                <div class="ai-teacher-stat">
                                    <span class="stat-number">${teacher.totalPosts || 0}</span>
                                    <span class="stat-label">Posts</span>
                                </div>
                                <div class="ai-teacher-stat">
                                    <span class="stat-number">${teacher.community?.memberCount || 0}</span>
                                    <span class="stat-label">Students</span>
                                </div>
                            </div>
                            ${teacher.community ? `
                                <div class="ai-teacher-community">
                                    <span>Community: <a href="/#community/${teacher.community.slug}" target="_blank">${teacher.community.name}</a></span>
                                </div>
                            ` : ''}
                            <div class="ai-teacher-actions">
                                <button class="btn btn-small btn-secondary" onclick="Admin.editAITeacher(${teacher.id})">Edit</button>
                                <button class="btn btn-small btn-secondary" onclick="Admin.manageAICurriculum(${teacher.id})">Curriculum</button>
                                <button class="btn btn-small btn-secondary" onclick="Admin.testAITeacher(${teacher.id})">Test</button>
                                <button class="btn btn-small btn-primary" onclick="Admin.generateAILesson(${teacher.id})">Generate Lesson</button>
                            </div>
                        </div>
                    `;
                }).join('');

                // Update stats
                document.getElementById('ai-teachers-count').textContent = data.teachers.length;
                document.getElementById('ai-teachers-responses').textContent = totalResponses;
                document.getElementById('ai-teachers-posts').textContent = totalPosts;

            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>No AI Teachers yet</p>
                        <p class="hint">Create your first AI Teacher to start teaching with AI!</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Load AI Teachers error:', error);
            container.innerHTML = '<p class="error">Failed to load AI Teachers</p>';
        }
    },

    showCreateAITeacherModal() {
        // Get courses for dropdown
        this.loadCoursesForSelect().then(coursesHtml => {
            const modalHtml = `
                <div class="modal ai-teacher-modal active" id="ai-teacher-form-modal">
                    <div class="modal-header">
                        <h3>Create AI Teacher</h3>
                        <button class="modal-close" onclick="Admin.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="ai-teacher-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Name *</label>
                                    <input type="text" id="teacher-name" placeholder="Prof. Name" required>
                                </div>
                                <div class="form-group">
                                    <label>Title</label>
                                    <input type="text" id="teacher-title" placeholder="AI Instructor">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Expertise *</label>
                                <input type="text" id="teacher-expertise" placeholder="e.g., Agriculture, Technology, Business" required>
                            </div>
                            <div class="form-group">
                                <label>Linked Course</label>
                                <select id="teacher-course">
                                    <option value="">-- Select Course --</option>
                                    ${coursesHtml}
                                </select>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Teaching Style</label>
                                    <select id="teacher-style">
                                        <option value="helpful">Helpful</option>
                                        <option value="practical">Practical</option>
                                        <option value="friendly">Friendly</option>
                                        <option value="socratic">Socratic</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Tone</label>
                                    <select id="teacher-tone">
                                        <option value="encouraging">Encouraging</option>
                                        <option value="warm">Warm</option>
                                        <option value="professional">Professional</option>
                                        <option value="casual">Casual</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>System Prompt *</label>
                                <textarea id="teacher-prompt" rows="6" placeholder="Define the AI teacher's personality, expertise, and teaching approach..." required></textarea>
                            </div>
                            <div class="form-group">
                                <label>Welcome Message</label>
                                <textarea id="teacher-welcome" rows="3" placeholder="Welcome message for students joining the community..."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="Admin.closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="Admin.saveAITeacher()">Create Teacher</button>
                    </div>
                </div>
            `;

            document.getElementById('modal-overlay').classList.add('active');
            document.getElementById('modal-overlay').insertAdjacentHTML('afterend', modalHtml);
        });
    },

    async loadCoursesForSelect() {
        try {
            const response = await fetch('/api/courses');
            const data = await response.json();
            if (data.success) {
                return data.courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            }
        } catch (e) { }
        return '';
    },

    async saveAITeacher(teacherId = null) {
        const name = document.getElementById('teacher-name').value.trim();
        const expertise = document.getElementById('teacher-expertise').value.trim();
        const systemPrompt = document.getElementById('teacher-prompt').value.trim();

        if (!name || !expertise || !systemPrompt) {
            alert('Please fill in required fields: Name, Expertise, and System Prompt');
            return;
        }

        const data = {
            name,
            title: document.getElementById('teacher-title').value.trim() || 'AI Teacher',
            expertise,
            courseId: document.getElementById('teacher-course').value || null,
            personality: {
                style: document.getElementById('teacher-style').value,
                tone: document.getElementById('teacher-tone').value,
                language: 'multilingual'
            },
            systemPrompt,
            welcomeMessage: document.getElementById('teacher-welcome').value.trim()
        };

        try {
            const url = teacherId ? `/api/ai-teachers/${teacherId}` : '/api/ai-teachers';
            const method = teacherId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                alert(teacherId ? 'AI Teacher updated!' : 'AI Teacher created with community!');
                this.closeModal();
                document.getElementById('ai-teacher-form-modal')?.remove();
                this.loadAITeachers();
            } else {
                alert('Error: ' + (result.error || 'Failed to save'));
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    },

    async editAITeacher(teacherId) {
        try {
            const response = await fetch(`/api/ai-teachers/${teacherId}`);
            const data = await response.json();

            if (!data.success) {
                alert('Failed to load teacher');
                return;
            }

            const teacher = data.teacher;
            const coursesHtml = await this.loadCoursesForSelect();

            const modalHtml = `
                <div class="modal ai-teacher-modal active" id="ai-teacher-form-modal">
                    <div class="modal-header">
                        <h3>Edit AI Teacher: ${teacher.name}</h3>
                        <button class="modal-close" onclick="Admin.closeModal(); document.getElementById('ai-teacher-form-modal')?.remove();">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="ai-teacher-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Name *</label>
                                    <input type="text" id="teacher-name" value="${teacher.name}" required>
                                </div>
                                <div class="form-group">
                                    <label>Title</label>
                                    <input type="text" id="teacher-title" value="${teacher.title || ''}">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Expertise *</label>
                                <input type="text" id="teacher-expertise" value="${teacher.expertise}" required>
                            </div>
                            <div class="form-group">
                                <label>Linked Course</label>
                                <select id="teacher-course">
                                    <option value="">-- Select Course --</option>
                                    ${coursesHtml}
                                </select>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Teaching Style</label>
                                    <select id="teacher-style">
                                        <option value="helpful" ${teacher.personality?.style === 'helpful' ? 'selected' : ''}>Helpful</option>
                                        <option value="practical" ${teacher.personality?.style === 'practical' ? 'selected' : ''}>Practical</option>
                                        <option value="friendly" ${teacher.personality?.style === 'friendly' ? 'selected' : ''}>Friendly</option>
                                        <option value="socratic" ${teacher.personality?.style === 'socratic' ? 'selected' : ''}>Socratic</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Tone</label>
                                    <select id="teacher-tone">
                                        <option value="encouraging" ${teacher.personality?.tone === 'encouraging' ? 'selected' : ''}>Encouraging</option>
                                        <option value="warm" ${teacher.personality?.tone === 'warm' ? 'selected' : ''}>Warm</option>
                                        <option value="professional" ${teacher.personality?.tone === 'professional' ? 'selected' : ''}>Professional</option>
                                        <option value="casual" ${teacher.personality?.tone === 'casual' ? 'selected' : ''}>Casual</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Welcome Message</label>
                                <textarea id="teacher-welcome" rows="3">${teacher.welcomeMessage || ''}</textarea>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="teacher-active" ${teacher.isActive ? 'checked' : ''}>
                                    Active (visible to students)
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="Admin.closeModal(); document.getElementById('ai-teacher-form-modal')?.remove();">Cancel</button>
                        <button class="btn btn-primary" onclick="Admin.updateAITeacher(${teacherId})">Save Changes</button>
                    </div>
                </div>
            `;

            document.getElementById('modal-overlay').classList.add('active');
            document.getElementById('modal-overlay').insertAdjacentHTML('afterend', modalHtml);

            // Set course selection
            if (teacher.courseId) {
                document.getElementById('teacher-course').value = teacher.courseId;
            }
        } catch (error) {
            alert('Error loading teacher: ' + error.message);
        }
    },

    async updateAITeacher(teacherId) {
        const data = {
            name: document.getElementById('teacher-name').value.trim(),
            title: document.getElementById('teacher-title').value.trim(),
            expertise: document.getElementById('teacher-expertise').value.trim(),
            personality: {
                style: document.getElementById('teacher-style').value,
                tone: document.getElementById('teacher-tone').value,
                language: 'multilingual'
            },
            welcomeMessage: document.getElementById('teacher-welcome').value.trim(),
            isActive: document.getElementById('teacher-active').checked
        };

        try {
            const response = await fetch(`/api/ai-teachers/${teacherId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                alert('AI Teacher updated!');
                this.closeModal();
                document.getElementById('ai-teacher-form-modal')?.remove();
                this.loadAITeachers();
            } else {
                alert('Error: ' + (result.error || 'Failed to update'));
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    },

    async manageAICurriculum(teacherId) {
        try {
            const response = await fetch(`/api/ai-teachers/${teacherId}`);
            const data = await response.json();

            if (!data.success) {
                alert('Failed to load teacher');
                return;
            }

            const teacher = data.teacher;
            const curriculum = teacher.curriculum || { modules: [], keyTopics: [], resources: [] };

            const modalHtml = `
                <div class="modal ai-teacher-modal curriculum-modal active" id="curriculum-modal">
                    <div class="modal-header">
                        <h3>Curriculum: ${teacher.name}</h3>
                        <button class="modal-close" onclick="Admin.closeModal(); document.getElementById('curriculum-modal')?.remove();">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="curriculum-section">
                            <h4>Key Topics</h4>
                            <p class="hint">Main topics this AI teacher covers (one per line)</p>
                            <textarea id="curriculum-topics" rows="5">${(curriculum.keyTopics || []).join('\n')}</textarea>
                        </div>
                        <div class="curriculum-section">
                            <h4>Resources</h4>
                            <p class="hint">Reference materials and resources (one per line)</p>
                            <textarea id="curriculum-resources" rows="4">${(curriculum.resources || []).join('\n')}</textarea>
                        </div>
                        <div class="curriculum-section">
                            <h4>Modules (${curriculum.modules?.length || 0})</h4>
                            <div id="modules-list">
                                ${(curriculum.modules || []).map((m, i) => `
                                    <div class="module-item">
                                        <strong>${i + 1}. ${m.title}</strong>
                                        <p>${m.description || ''}</p>
                                        <small>Topics: ${(m.topics || []).join(', ')}</small>
                                    </div>
                                `).join('') || '<p>No modules defined</p>'}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="Admin.closeModal(); document.getElementById('curriculum-modal')?.remove();">Cancel</button>
                        <button class="btn btn-primary" onclick="Admin.saveCurriculum(${teacherId})">Save Curriculum</button>
                    </div>
                </div>
            `;

            document.getElementById('modal-overlay').classList.add('active');
            document.getElementById('modal-overlay').insertAdjacentHTML('afterend', modalHtml);
        } catch (error) {
            alert('Error: ' + error.message);
        }
    },

    async saveCurriculum(teacherId) {
        const keyTopics = document.getElementById('curriculum-topics').value.split('\n').filter(t => t.trim());
        const resources = document.getElementById('curriculum-resources').value.split('\n').filter(r => r.trim());

        try {
            const response = await fetch(`/api/ai-teachers/${teacherId}/curriculum`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyTopics, resources })
            });

            const result = await response.json();

            if (result.success) {
                alert('Curriculum saved!');
                this.closeModal();
                document.getElementById('curriculum-modal')?.remove();
            } else {
                alert('Error: ' + (result.error || 'Failed to save'));
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    },

    async testAITeacher(teacherId) {
        const question = prompt('Enter a test question for the AI teacher:');
        if (!question) return;

        try {
            const response = await fetch(`/api/ai-teachers/${teacherId}/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question })
            });

            const data = await response.json();

            if (data.success) {
                alert(`AI Response:\n\n${data.content}`);
            } else {
                alert('Error: ' + (data.error || 'No response'));
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    },

    async generateAILesson(teacherId) {
        const topic = prompt('Enter a topic for the AI to teach:');
        if (!topic) return;

        const type = prompt('Lesson type (lesson, exercise, or quiz):', 'lesson');
        if (!['lesson', 'exercise', 'quiz'].includes(type)) {
            alert('Invalid type. Use: lesson, exercise, or quiz');
            return;
        }

        try {
            const response = await fetch(`/api/ai-teachers/${teacherId}/generate-lesson`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, lessonType: type, autoPublish: confirm('Auto-publish to community?') })
            });

            const data = await response.json();

            if (data.success) {
                alert(`Lesson generated!\n\nTitle: ${data.lesson.title}\n\n${data.post ? 'Published to community!' : 'Ready to review.'}`);
                if (data.post) {
                    this.loadAITeachers(); // Refresh stats
                }
            } else {
                alert('Failed to generate lesson: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            alert('Error generating lesson: ' + error.message);
        }
    },

    // ==================== HELPERS ====================

    renderPagination(containerId, pagination, callback) {
        const container = document.getElementById(containerId);
        if (!container || pagination.pages <= 1) {
            if (container) container.innerHTML = '';
            return;
        }

        let html = '';
        for (let i = 1; i <= pagination.pages; i++) {
            html += `<button class="${i === pagination.page ? 'active' : ''}" onclick="(${callback})(${i})">${i}</button>`;
        }
        container.innerHTML = html;
    },

    openModal(modalId) {
        document.getElementById('modal-overlay').classList.add('active');
        document.getElementById(modalId).classList.add('active');
    },

    closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });

        // Reset invite modal state
        const inviteForm = document.getElementById('invite-form');
        const inviteResult = document.getElementById('invite-result');
        if (inviteForm) inviteForm.style.display = 'block';
        if (inviteResult) inviteResult.style.display = 'none';
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => Admin.init());
