/**
 * Haiti Skills Academy - Main Application
 */

const App = {
    user: null,
    currentPage: 'home',

    // Course icons mapping
    courseIcons: {
        'agriculture': '🌾',
        'mechanic': '🔧',
        'fishing': '🐟',
        'boat-building': '⛵',
        'recycling': '♻️'
    },

    // Initialize app
    async init() {
        console.log('Haiti Skills Academy initializing...');

        // Check authentication
        await this.checkAuth();

        // Setup navigation
        this.setupNavigation();

        // Load initial page
        this.navigateTo(this.getPageFromHash() || 'home');

        // Load courses on home page
        this.loadHomeCourses();
    },

    // Check if user is logged in
    async checkAuth() {
        try {
            const response = await API.getUser();
            if (response.success && response.user) {
                this.user = response.user;
                this.updateAuthUI();
            }
        } catch (error) {
            console.log('Not authenticated');
        }
    },

    // Update UI based on auth state
    updateAuthUI() {
        const authSection = document.getElementById('auth-section');

        if (this.user) {
            authSection.innerHTML = `
                <div class="user-menu">
                    <a href="#dashboard" data-page="dashboard" class="nav-link">Dashboard</a>
                    ${this.user.avatar ? `<img src="${this.user.avatar}" alt="${this.user.name}" class="user-avatar">` : ''}
                    <a href="/auth/logout" class="btn btn-secondary btn-small">Logout</a>
                </div>
            `;
        } else {
            authSection.innerHTML = `<a href="/auth/google" class="btn btn-primary">Sign In</a>`;
        }
    },

    // Setup navigation handlers
    setupNavigation() {
        // Handle all navigation clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-page]');
            if (link) {
                e.preventDefault();
                const page = link.dataset.page;
                const param = link.dataset.param;
                this.navigateTo(page, param);
            }
        });

        // Handle back/forward
        window.addEventListener('hashchange', () => {
            this.navigateTo(this.getPageFromHash() || 'home');
        });
    },

    // Get page from URL hash
    getPageFromHash() {
        const hash = window.location.hash.slice(1);
        if (!hash) return null;
        return hash.split('/')[0];
    },

    // Navigate to a page
    navigateTo(page, param) {
        console.log(`Navigating to: ${page}`, param);

        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

        // Show target page
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = page;

            // Update hash
            window.location.hash = param ? `${page}/${param}` : page;

            // Update nav active state
            document.querySelectorAll('.nav-links a').forEach(a => {
                a.classList.toggle('active', a.dataset.page === page);
            });

            // Load page data
            this.loadPageData(page, param);
        }
    },

    // Load data for a page
    async loadPageData(page, param) {
        switch (page) {
            case 'courses':
                await this.loadCourses();
                break;
            case 'course-detail':
                await this.loadCourseDetail(param);
                break;
            case 'jobs':
                await this.loadJobs();
                break;
            case 'companies':
                await this.loadCompanies();
                break;
            case 'dashboard':
                if (!this.user) {
                    this.navigateTo('login');
                    return;
                }
                await this.loadDashboard();
                break;
        }
    },

    // Load courses for home page
    async loadHomeCourses() {
        try {
            const response = await API.getCourses();
            const container = document.getElementById('home-courses');

            if (response.success && response.courses.length > 0) {
                container.innerHTML = response.courses.map(course => this.renderCourseCard(course)).join('');
            } else {
                container.innerHTML = '<p class="empty-state">No courses available</p>';
            }
        } catch (error) {
            console.error('Failed to load home courses:', error);
        }
    },

    // Load all courses
    async loadCourses() {
        const container = document.getElementById('courses-list');
        container.innerHTML = '<div class="loading">Loading courses...</div>';

        try {
            const response = await API.getCourses();

            if (response.success && response.courses.length > 0) {
                container.innerHTML = response.courses.map(course => this.renderCourseCard(course)).join('');
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📚</div>
                        <p>No courses available yet</p>
                    </div>
                `;
            }
        } catch (error) {
            container.innerHTML = '<p class="error">Failed to load courses</p>';
        }
    },

    // Render course card
    renderCourseCard(course) {
        const icon = this.courseIcons[course.id] || '📖';
        return `
            <div class="course-card" data-page="course-detail" data-param="${course.id}">
                <div class="course-header">
                    <div class="course-icon">${icon}</div>
                    <h3>${course.name}</h3>
                </div>
                <div class="course-body">
                    <p class="course-description">${course.description || 'Learn practical skills for real careers.'}</p>
                    <div class="course-meta">
                        <span>📚 ${course.moduleCount || 5} modules</span>
                        <span>⏱️ ${course.practicalHoursRequired || 40}h practical</span>
                        <span>👥 ${course.enrolledCount || 0} enrolled</span>
                    </div>
                </div>
            </div>
        `;
    },

    // Load course detail
    async loadCourseDetail(courseId) {
        const container = document.getElementById('course-detail');
        container.innerHTML = '<div class="loading">Loading course...</div>';

        try {
            const response = await API.getCourse(courseId);

            if (response.success && response.course) {
                const course = response.course;
                const icon = this.courseIcons[course.id] || '📖';

                container.innerHTML = `
                    <div class="course-detail-header">
                        <div class="container">
                            <div class="course-icon" style="font-size: 4rem; margin-bottom: 20px;">${icon}</div>
                            <h1>${course.name}</h1>
                            <p style="color: rgba(255,255,255,0.8); font-size: 1.2rem;">${course.description || ''}</p>
                        </div>
                    </div>

                    <div class="course-requirements">
                        <div class="requirement-card">
                            <div class="requirement-value">${course.theoryCompletionRequired || 100}%</div>
                            <div class="requirement-label">Theory Completion</div>
                        </div>
                        <div class="requirement-card">
                            <div class="requirement-value">${course.practicalHoursRequired || 40}h</div>
                            <div class="requirement-label">Practical Hours</div>
                        </div>
                        <div class="requirement-card">
                            <div class="requirement-value">✓</div>
                            <div class="requirement-label">Physical Test Required</div>
                        </div>
                    </div>

                    ${this.user ? `
                        <button class="btn btn-large btn-primary" onclick="App.enrollInCourse('${course.id}')">
                            Enroll Now
                        </button>
                    ` : `
                        <a href="/auth/google" class="btn btn-large btn-primary">Sign In to Enroll</a>
                    `}

                    <div class="modules-list">
                        <h2 style="margin-bottom: 20px;">Course Modules</h2>
                        ${(course.modules || []).map((module, i) => `
                            <div class="module-item">
                                <div class="module-number">${i + 1}</div>
                                <div class="module-info">
                                    <h4>${module.name}</h4>
                                    <p>${module.description || `Learn about ${module.name}`}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    ${course.hiringCompany ? `
                        <div style="margin-top: 40px; padding: 30px; background: white; border-radius: 16px; border: 1px solid var(--border);">
                            <h3>Hiring Company</h3>
                            <p style="color: var(--gray); margin: 10px 0;">${course.hiringCompany.name} - ${course.hiringCompany.tagline}</p>
                            <p><strong>${course.hiringCompany.openPositions || 0}</strong> open positions</p>
                        </div>
                    ` : ''}

                    <div style="margin-top: 20px;">
                        <a href="#courses" data-page="courses" class="btn btn-secondary">← Back to Courses</a>
                    </div>
                `;
            } else {
                container.innerHTML = '<p class="error">Course not found</p>';
            }
        } catch (error) {
            container.innerHTML = '<p class="error">Failed to load course</p>';
        }
    },

    // Enroll in course
    async enrollInCourse(courseId) {
        if (!this.user) {
            window.location.href = '/auth/google';
            return;
        }

        try {
            const response = await API.enrollInCourse(courseId);
            if (response.success) {
                alert(response.message || 'Successfully enrolled!');
                this.navigateTo('dashboard');
            }
        } catch (error) {
            alert(error.message || 'Failed to enroll');
        }
    },

    // Load jobs
    async loadJobs() {
        const container = document.getElementById('jobs-list');
        container.innerHTML = '<div class="loading">Loading jobs...</div>';

        try {
            const response = await API.getJobs();

            if (response.success && response.jobs.length > 0) {
                container.innerHTML = response.jobs.map(job => `
                    <div class="job-card">
                        <h3>${job.title}</h3>
                        <p class="job-company">${job.company?.name || 'Unknown Company'}</p>
                        <div class="job-meta">
                            <span>📍 ${job.location || 'Haiti'}</span>
                            <span>💼 ${job.experienceLevel || 'entry'} level</span>
                            <span class="job-salary">💰 $${job.salaryMin || 0}-${job.salaryMax || 0}/mo</span>
                        </div>
                        <p>${job.description?.substring(0, 150) || 'No description'}...</p>
                        ${this.user ? `
                            <button class="btn btn-primary" onclick="App.applyToJob(${job.id})">Apply Now</button>
                        ` : `
                            <a href="/auth/google" class="btn btn-primary">Sign In to Apply</a>
                        `}
                    </div>
                `).join('');
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">💼</div>
                        <p>No jobs available yet</p>
                    </div>
                `;
            }
        } catch (error) {
            container.innerHTML = '<p class="error">Failed to load jobs</p>';
        }
    },

    // Apply to job
    async applyToJob(jobId) {
        if (!this.user) {
            window.location.href = '/auth/google';
            return;
        }

        try {
            const response = await API.applyToJob(jobId, {});
            if (response.success) {
                alert(response.message || 'Application submitted!');
            }
        } catch (error) {
            alert(error.message || 'Failed to apply');
        }
    },

    // Load companies
    async loadCompanies() {
        const container = document.getElementById('companies-list');
        container.innerHTML = '<div class="loading">Loading companies...</div>';

        try {
            const response = await API.getCompanies();

            if (response.success && response.companies.length > 0) {
                const icons = {
                    'ayiti-farms': '🌾',
                    'ayiti-motors': '🔧',
                    'ayiti-catch': '🐟',
                    'ayiti-boats': '⛵',
                    'ayiti-green': '♻️'
                };

                container.innerHTML = response.companies.map(company => `
                    <div class="company-card">
                        <div class="company-icon">${icons[company.id] || '🏢'}</div>
                        <h3>${company.name}</h3>
                        <p class="company-tagline">${company.tagline || ''}</p>
                        <ul class="company-services">
                            ${(company.services || []).slice(0, 4).map(s => `<li>${s}</li>`).join('')}
                        </ul>
                        <p><strong>${company.activeJobsCount || 0}</strong> open positions</p>
                    </div>
                `).join('');
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🏢</div>
                        <p>No companies yet</p>
                    </div>
                `;
            }
        } catch (error) {
            container.innerHTML = '<p class="error">Failed to load companies</p>';
        }
    },

    // Load dashboard
    async loadDashboard() {
        document.getElementById('user-credits').textContent = this.user.credits || 0;

        // Load pipeline
        this.loadPipelineProgress();

        // Load enrollments
        this.loadMyEnrollments();

        // Load certifications
        this.loadMyCertifications();

        // Load applications
        this.loadMyApplications();
    },

    async loadPipelineProgress() {
        const container = document.getElementById('pipeline-progress');
        try {
            const response = await API.getPipeline();
            if (response.success) {
                container.innerHTML = `
                    <p style="margin-bottom: 10px;">Stage ${response.currentStage} of 9</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${response.progressPercent}%"></div>
                    </div>
                    <p style="font-size: 0.9rem; color: var(--gray); margin-top: 10px;">
                        ${response.stages?.find(s => s.stage === response.currentStage)?.displayName || 'Not started'}
                    </p>
                `;
            }
        } catch (error) {
            container.innerHTML = '<p>Unable to load pipeline</p>';
        }
    },

    async loadMyEnrollments() {
        const container = document.getElementById('my-enrollments');
        try {
            const response = await API.getEnrollments();
            if (response.success && response.enrollments.length > 0) {
                container.innerHTML = response.enrollments.map(e => `
                    <div style="padding: 15px 0; border-bottom: 1px solid var(--border);">
                        <strong>${e.course?.name || e.courseId}</strong>
                        <div class="progress-bar" style="margin: 10px 0;">
                            <div class="progress-fill" style="width: ${e.progress || 0}%"></div>
                        </div>
                        <span style="font-size: 0.85rem; color: var(--gray);">${e.progress || 0}% complete</span>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p>No enrollments yet. <a href="#courses" data-page="courses">Browse courses</a></p>';
            }
        } catch (error) {
            container.innerHTML = '<p>Unable to load enrollments</p>';
        }
    },

    async loadMyCertifications() {
        const container = document.getElementById('my-certifications');
        try {
            const response = await API.getCertifications();
            if (response.success && response.certifications.length > 0) {
                container.innerHTML = response.certifications.map(c => `
                    <div style="padding: 15px 0; border-bottom: 1px solid var(--border);">
                        <strong>${c.course?.name || c.courseId}</strong>
                        <p style="font-size: 0.85rem; color: var(--gray);">
                            #${c.certificateNumber} | Grade: ${c.overallGrade}
                        </p>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p>No certifications yet</p>';
            }
        } catch (error) {
            container.innerHTML = '<p>Unable to load certifications</p>';
        }
    },

    async loadMyApplications() {
        const container = document.getElementById('my-applications');
        try {
            const response = await API.getMyApplications();
            if (response.success && response.applications.length > 0) {
                container.innerHTML = response.applications.map(a => `
                    <div style="padding: 15px 0; border-bottom: 1px solid var(--border);">
                        <strong>${a.jobPosting?.title || 'Job'}</strong>
                        <p style="font-size: 0.85rem; color: var(--gray);">
                            ${a.jobPosting?.company?.name || ''} | Status: ${a.status}
                        </p>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p>No applications yet. <a href="#jobs" data-page="jobs">Browse jobs</a></p>';
            }
        } catch (error) {
            container.innerHTML = '<p>Unable to load applications</p>';
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => App.init());
