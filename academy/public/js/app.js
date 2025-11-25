/**
 * Haiti Skills Academy - Main Application
 */

const App = {
    user: null,
    currentPage: 'home',
    currentConversationId: null,
    unreadCount: 0,

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

        // Load initial page from hash (supports community/slug, course/id etc)
        const { page, param } = this.parseHash();
        this.navigateTo(page || 'home', param);

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
                    ${this.user.role === 'admin' ? '<a href="/admin.html" class="nav-link admin-link">Admin</a>' : ''}
                    <a href="#inbox" data-page="inbox" class="nav-link inbox-link">
                        <span class="inbox-icon">💬</span>
                        <span class="inbox-badge" id="inbox-badge" style="display: none;">0</span>
                    </a>
                    <a href="#dashboard" data-page="dashboard" class="nav-link">Dashboard</a>
                    ${this.user.avatar ? `<img src="${this.user.avatar}" alt="${this.user.name}" class="user-avatar">` : ''}
                    <a href="/auth/logout" class="btn btn-secondary btn-small">Logout</a>
                </div>
            `;
            // Load unread count
            this.loadUnreadCount();
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
            const { page, param } = this.parseHash();
            this.navigateTo(page || 'home', param);
        });
    },

    // Parse URL hash into page and param
    parseHash() {
        const hash = window.location.hash.slice(1);
        if (!hash) return { page: null, param: null };

        const parts = hash.split('/');
        let page = parts[0];
        let param = parts[1] || null;

        // Map shorthand routes to full page names
        if (page === 'community' && param) {
            page = 'community-detail';
        } else if (page === 'course' && param) {
            page = 'course-detail';
        }

        return { page, param };
    },

    // Get page from URL hash (legacy support)
    getPageFromHash() {
        return this.parseHash().page;
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
            case 'inbox':
                if (!this.user) {
                    this.navigateTo('login');
                    return;
                }
                await this.loadInbox();
                break;
            case 'communities':
                await this.loadCommunities();
                break;
            case 'community-detail':
                await this.loadCommunityDetail(param);
                break;
            case 'learn':
                await this.loadLearnPage(param);
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
                    <div class="enrollment-card" style="padding: 15px 0; border-bottom: 1px solid var(--border);">
                        <strong>${e.course?.name || e.courseId}</strong>
                        <div class="progress-bar" style="margin: 10px 0;">
                            <div class="progress-fill" style="width: ${e.progress || 0}%"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.85rem; color: var(--gray);">${e.progress || 0}% complete</span>
                            <button class="btn btn-primary btn-small" onclick="App.startLearning(${e.id})">
                                ${e.progress > 0 ? 'Continue Learning' : 'Start Learning'}
                            </button>
                        </div>
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
    },

    // ==================== INBOX / AI TUTOR ====================

    async loadUnreadCount() {
        try {
            const response = await API.getUnreadCount();
            if (response.success) {
                this.unreadCount = response.count;
                const badge = document.getElementById('inbox-badge');
                if (badge) {
                    badge.textContent = response.count;
                    badge.style.display = response.count > 0 ? 'inline-block' : 'none';
                }
            }
        } catch (error) {
            console.log('Could not load unread count');
        }
    },

    async loadInbox() {
        await this.loadConversations();
        this.showWelcomeMessage();
    },

    async loadConversations() {
        const container = document.getElementById('conversations-list');

        try {
            const response = await API.getConversations();

            if (response.success && response.conversations.length > 0) {
                container.innerHTML = response.conversations.map(conv => `
                    <div class="conversation-item ${conv.conversationId === this.currentConversationId ? 'active' : ''}"
                         onclick="App.openConversation('${conv.conversationId}')">
                        <div class="conversation-avatar">${conv.isAIConversation ? '🤖' : '👤'}</div>
                        <div class="conversation-info">
                            <div class="conversation-name">${conv.isAIConversation ? 'Pwofesè Lespri' : 'Chat'}</div>
                            <div class="conversation-preview">${this.truncate(conv.lastMessage?.content || '', 40)}</div>
                        </div>
                        ${conv.unreadCount > 0 ? `<span class="unread-badge">${conv.unreadCount}</span>` : ''}
                    </div>
                `).join('');
            } else {
                container.innerHTML = `
                    <div class="empty-conversations">
                        <p>No conversations yet</p>
                        <p style="font-size: 0.85rem; color: var(--gray);">Start chatting with AI Tutor!</p>
                    </div>
                `;
            }
        } catch (error) {
            container.innerHTML = '<p class="error">Unable to load conversations</p>';
        }
    },

    showWelcomeMessage() {
        const container = document.getElementById('chat-messages');
        container.innerHTML = `
            <div class="chat-welcome">
                <div class="welcome-avatar">🤖</div>
                <h3>Bonjou! Mwen se Pwofesè Lespri</h3>
                <p>I'm your AI tutor. Ask me anything about your courses!</p>
                <div class="quick-questions">
                    <button class="quick-question" onclick="App.askQuestion('How do I start learning Agriculture?')">
                        How do I start Agriculture?
                    </button>
                    <button class="quick-question" onclick="App.askQuestion('What are the certification requirements?')">
                        Certification requirements?
                    </button>
                    <button class="quick-question" onclick="App.askQuestion('Ki jan mwen ka jwenn travay?')">
                        Ki jan mwen ka jwenn travay?
                    </button>
                </div>
            </div>
        `;
        this.currentConversationId = null;
    },

    async openConversation(conversationId) {
        this.currentConversationId = conversationId;
        const container = document.getElementById('chat-messages');
        container.innerHTML = '<div class="loading">Loading messages...</div>';

        // Update active state in list
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.toggle('active', item.onclick.toString().includes(conversationId));
        });

        try {
            const response = await API.getConversation(conversationId);

            if (response.success && response.messages.length > 0) {
                container.innerHTML = response.messages.map(msg => this.renderMessage(msg)).join('');
                container.scrollTop = container.scrollHeight;

                // Update unread count
                this.loadUnreadCount();
            } else {
                this.showWelcomeMessage();
            }
        } catch (error) {
            container.innerHTML = '<p class="error">Unable to load messages</p>';
        }
    },

    renderMessage(msg) {
        const isAI = msg.isFromAI;
        const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="chat-message ${isAI ? 'ai-message' : 'user-message'}">
                <div class="message-avatar">${isAI ? '🤖' : '👤'}</div>
                <div class="message-content">
                    <div class="message-text">${this.formatMessage(msg.content)}</div>
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `;
    },

    formatMessage(text) {
        // Simple markdown-like formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    },

    truncate(text, length) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    },

    startNewConversation() {
        this.currentConversationId = null;
        this.showWelcomeMessage();

        // Clear active state
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
    },

    askQuestion(question) {
        document.getElementById('chat-input').value = question;
        this.sendMessage();
    },

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const courseSelect = document.getElementById('course-context');
        const sendBtn = document.getElementById('send-btn');

        const content = input.value.trim();
        if (!content) return;

        const courseContext = courseSelect.value || null;

        // Disable input while sending
        input.disabled = true;
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<span>Sending...</span>';

        // Show user message immediately
        const container = document.getElementById('chat-messages');

        // If this is welcome screen, clear it
        if (container.querySelector('.chat-welcome')) {
            container.innerHTML = '';
        }

        // Add user message
        container.innerHTML += this.renderMessage({
            content: content,
            isFromAI: false,
            createdAt: new Date().toISOString()
        });

        // Add loading indicator for AI
        container.innerHTML += `
            <div class="chat-message ai-message" id="ai-loading">
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <div class="message-text typing-indicator">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        `;
        container.scrollTop = container.scrollHeight;

        // Clear input
        input.value = '';

        try {
            const response = await API.sendToAITutor(content, courseContext, this.currentConversationId);

            // Remove loading indicator
            const loadingEl = document.getElementById('ai-loading');
            if (loadingEl) loadingEl.remove();

            if (response.success) {
                // Update conversation ID
                this.currentConversationId = response.conversationId;

                // Add AI response
                container.innerHTML += this.renderMessage(response.aiMessage);
                container.scrollTop = container.scrollHeight;

                // Refresh conversations list
                this.loadConversations();
            } else {
                container.innerHTML += this.renderMessage({
                    content: "Sorry, I couldn't process your message. Please try again.",
                    isFromAI: true,
                    createdAt: new Date().toISOString()
                });
            }
        } catch (error) {
            // Remove loading indicator
            const loadingEl = document.getElementById('ai-loading');
            if (loadingEl) loadingEl.remove();

            container.innerHTML += this.renderMessage({
                content: "Sorry, there was an error. Please try again later.",
                isFromAI: true,
                createdAt: new Date().toISOString()
            });
        }

        // Re-enable input
        input.disabled = false;
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<span>Send</span>';
        input.focus();
    },

    // ==================== COMMUNITIES ====================

    currentCommunity: null,
    currentCommunityTab: 'about',
    currentPost: null,

    async loadCommunities() {
        const container = document.getElementById('communities-list');
        container.innerHTML = '<div class="loading">Loading communities...</div>';

        // Show/hide create button for instructors
        const createBtn = document.getElementById('create-community-btn');
        if (createBtn) {
            createBtn.style.display = this.user && ['instructor', 'admin'].includes(this.user.role) ? 'block' : 'none';
        }

        // Show my communities section if logged in
        if (this.user) {
            document.getElementById('my-communities-section').style.display = 'block';
            this.loadMyCommunities();
        }

        try {
            const response = await API.getCommunities();

            if (response.success && response.communities.length > 0) {
                container.innerHTML = response.communities.map(c => this.renderCommunityCard(c)).join('');
            } else {
                container.innerHTML = `
                    <div class="empty-community">
                        <div class="empty-community-icon">👥</div>
                        <p>No communities yet</p>
                        <p style="font-size: 0.9rem; color: var(--gray);">Be the first to create a learning community!</p>
                    </div>
                `;
            }
        } catch (error) {
            container.innerHTML = '<p class="error">Failed to load communities</p>';
        }
    },

    async loadMyCommunities() {
        const container = document.getElementById('my-communities-list');

        try {
            const response = await API.getMyCommunities();

            if (response.success && response.memberships.length > 0) {
                container.innerHTML = response.memberships.map(c => this.renderCommunityCard(c, true)).join('');
            } else {
                container.innerHTML = '<p style="color: var(--gray);">You haven\'t joined any communities yet</p>';
            }
        } catch (error) {
            container.innerHTML = '<p>Unable to load your communities</p>';
        }
    },

    renderCommunityCard(community, isMember = false) {
        const typeIcons = {
            'learning': '📚',
            'discussion': '💬',
            'project': '🔨',
            'mentorship': '🎓'
        };
        const icon = typeIcons[community.type] || '👥';
        const membership = community.membership;
        const isAIOwned = community.isAIOwned;
        const aiTeacher = community.aiTeacher;

        // For AI communities, show AI teacher as owner
        const ownerName = isAIOwned && aiTeacher
            ? `🤖 ${aiTeacher.name}`
            : (community.owner?.name || 'Unknown');

        return `
            <div class="community-card ${isAIOwned ? 'ai-community' : ''}" data-page="community-detail" data-param="${community.slug || community.id}">
                <div class="community-cover">
                    ${community.coverImage ? `<img src="${community.coverImage}" alt="">` : ''}
                    <div class="community-avatar">${isAIOwned && aiTeacher?.avatar ? `<img src="${aiTeacher.avatar}" alt="" class="ai-avatar-img">` : icon}</div>
                </div>
                <div class="community-content">
                    <div class="community-name">${community.name}</div>
                    <div class="community-owner">by ${ownerName}</div>
                    <div class="community-description">${community.description || 'A learning community'}</div>
                    <div class="community-stats">
                        <span class="community-stat">👥 ${community.memberCount || 0} members</span>
                        <span class="community-stat">📝 ${community.postCount || 0} posts</span>
                    </div>
                </div>
                <div class="community-actions">
                    ${membership ? `
                        <span class="community-badge ${membership.role}">${membership.role}</span>
                    ` : `
                        <span class="community-badge">${community.type || 'learning'}</span>
                    `}
                    ${!isMember && !membership ? `
                        <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); App.joinCommunity('${community.id}')">
                            Join
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    },

    async loadCommunityDetail(slugOrId) {
        const container = document.getElementById('community-detail');
        container.innerHTML = '<div class="loading">Loading community...</div>';

        try {
            // Try by slug first, then by ID
            let response;
            try {
                response = await API.getCommunityBySlug(slugOrId);
            } catch {
                response = await API.getCommunity(slugOrId);
            }

            if (response.success && response.community) {
                const community = response.community;
                const membership = response.membership;
                const isOwner = this.user && community.ownerId === this.user.id;
                const isMember = membership && membership.status === 'active';
                const canPost = isMember && (membership.role !== 'member' || community.settings?.allowMemberPosts);

                // Store current community for reference
                this.currentCommunity = community;
                this.currentCommunity.membership = membership;
                this.currentCommunity.isMember = isMember;
                this.currentCommunity.isOwner = isOwner;
                this.currentCommunity.canPost = canPost;

                const typeIcons = {
                    'learning': '📚',
                    'discussion': '💬',
                    'project': '🔨',
                    'mentorship': '🎓'
                };
                const icon = typeIcons[community.type] || '👥';

                // Check if AI-owned community
                const isAIOwned = community.isAIOwned;
                const aiTeacher = community.aiTeacher;
                const ownerDisplay = isAIOwned && aiTeacher
                    ? `<span class="ai-badge">🤖 AI Teacher</span> ${aiTeacher.name}`
                    : (community.owner?.name || 'Unknown');
                const avatarDisplay = isAIOwned && aiTeacher?.avatar
                    ? `<img src="${aiTeacher.avatar}" alt="${aiTeacher.name}" class="ai-teacher-avatar">`
                    : icon;

                container.innerHTML = `
                    <div class="community-hero ${isAIOwned ? 'ai-community' : ''}">
                        <div class="container">
                            <div class="community-hero-content">
                                <div class="community-hero-avatar">${avatarDisplay}</div>
                                <div class="community-hero-info">
                                    <h1>${community.name} ${isAIOwned ? '<span class="ai-community-badge">🤖 AI Community</span>' : ''}</h1>
                                    <div class="community-hero-owner">by ${ownerDisplay}</div>
                                    <div class="community-hero-stats">
                                        <span class="community-hero-stat">👥 ${community.memberCount || 0} members</span>
                                        <span class="community-hero-stat">📝 ${community.postCount || 0} posts</span>
                                        ${community.linkedCourse ? `<span class="community-hero-stat">📚 ${community.linkedCourse.name}</span>` : ''}
                                    </div>
                                </div>
                                <div class="community-hero-actions">
                                    ${!this.user ? `
                                        <a href="/auth/google" class="btn btn-primary">Sign In to Join</a>
                                    ` : isMember ? `
                                        ${isAIOwned ? `<button class="btn btn-primary" onclick="App.openAskAITeacher()">💬 Ask ${aiTeacher?.name || 'AI Teacher'}</button>` : ''}
                                        <button class="btn btn-secondary" onclick="App.leaveCommunity('${community.id}')">Leave Community</button>
                                    ` : `
                                        <button class="btn btn-primary" onclick="App.joinCommunity('${community.id}')">Join Community</button>
                                    `}
                                </div>
                            </div>
                        </div>
                    </div>

                    ${isMember || isOwner || community.isPublic ? `
                        <div class="community-tabs">
                            <button class="community-tab active" onclick="App.switchCommunityTab('about')">About</button>
                            <button class="community-tab" onclick="App.switchCommunityTab('posts')">Posts</button>
                            <button class="community-tab" onclick="App.switchCommunityTab('members')">Members</button>
                            ${isOwner ? '<button class="community-tab" onclick="App.switchCommunityTab(\'settings\')">Settings</button>' : ''}
                        </div>

                        <div id="community-content-area" class="community-content-area">
                            <!-- Tab content loaded here -->
                        </div>
                    ` : `
                        <div class="empty-community">
                            <div class="empty-community-icon">🔒</div>
                            <p>Join this community to see posts and participate</p>
                        </div>
                    `}

                    <div style="margin-top: 30px;">
                        <a href="#communities" data-page="communities" class="btn btn-secondary">← Back to Communities</a>
                    </div>
                `;

                // Load default tab
                if (isMember || isOwner || community.isPublic) {
                    this.switchCommunityTab('about');
                }
            } else {
                container.innerHTML = '<p class="error">Community not found</p>';
            }
        } catch (error) {
            container.innerHTML = '<p class="error">Failed to load community</p>';
        }
    },

    switchCommunityTab(tab) {
        this.currentCommunityTab = tab;

        // Update tab active state
        document.querySelectorAll('.community-tab').forEach(t => {
            t.classList.toggle('active', t.textContent.toLowerCase() === tab);
        });

        const container = document.getElementById('community-content-area');
        if (!container) return;

        switch (tab) {
            case 'about':
                this.renderCommunityAbout(container);
                break;
            case 'posts':
                this.renderCommunityPosts(container);
                break;
            case 'members':
                this.renderCommunityMembers(container);
                break;
            case 'settings':
                this.renderCommunitySettings(container);
                break;
        }
    },

    renderCommunityAbout(container) {
        const c = this.currentCommunity;
        container.innerHTML = `
            <div class="community-about">
                <div class="about-section">
                    <h3>About this Community</h3>
                    <p>${c.description || 'No description provided.'}</p>
                </div>
                ${c.linkedCourse ? `
                    <div class="about-section">
                        <h3>Linked Course</h3>
                        <div class="linked-course-card" data-page="course-detail" data-param="${c.linkedCourse.id}">
                            <span class="course-icon">${this.courseIcons[c.linkedCourse.id] || '📚'}</span>
                            <span>${c.linkedCourse.name}</span>
                        </div>
                    </div>
                ` : ''}
                <div class="about-section">
                    <h3>Community Rules</h3>
                    <ul class="community-rules">
                        <li>Be respectful and supportive of fellow learners</li>
                        <li>Stay on topic and contribute meaningfully</li>
                        <li>No spam or self-promotion without permission</li>
                        <li>Help others when you can - we grow together!</li>
                    </ul>
                </div>
            </div>
        `;
    },

    async renderCommunityPosts(container) {
        container.innerHTML = '<div class="loading">Loading posts...</div>';

        try {
            const response = await API.getCommunityPosts(this.currentCommunity.id);

            const canPost = this.currentCommunity.canPost;

            let html = '';

            // Create post button/form
            if (canPost) {
                html += `
                    <div class="create-post-section">
                        <button class="create-post-btn" onclick="App.showCreatePostModal()">
                            <span class="create-post-icon">✍️</span>
                            <span>Create a new post...</span>
                        </button>
                    </div>
                `;
            }

            // Filter tabs
            html += `
                <div class="posts-filter">
                    <button class="posts-filter-btn active" onclick="App.filterPosts(null)">All</button>
                    <button class="posts-filter-btn" onclick="App.filterPosts('discussion')">💬 Discussions</button>
                    <button class="posts-filter-btn" onclick="App.filterPosts('question')">❓ Questions</button>
                    <button class="posts-filter-btn" onclick="App.filterPosts('announcement')">📢 Announcements</button>
                    <button class="posts-filter-btn" onclick="App.filterPosts('resource')">📎 Resources</button>
                </div>
            `;

            if (response.success && response.posts.length > 0) {
                html += '<div class="posts-list" id="posts-list">';
                html += response.posts.map(post => this.renderPostCard(post)).join('');
                html += '</div>';
            } else {
                html += `
                    <div class="empty-posts">
                        <div class="empty-posts-icon">📝</div>
                        <p>No posts yet</p>
                        <p style="font-size: 0.9rem; color: var(--gray);">
                            ${canPost ? 'Be the first to start a discussion!' : 'Check back later for updates.'}
                        </p>
                    </div>
                `;
            }

            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = '<p class="error">Failed to load posts</p>';
        }
    },

    renderPostCard(post) {
        const typeIcons = {
            'discussion': '💬',
            'question': '❓',
            'announcement': '📢',
            'resource': '📎',
            'poll': '📊'
        };
        const icon = typeIcons[post.type] || '📝';
        const timeAgo = this.getTimeAgo(post.createdAt);

        return `
            <div class="post-card ${post.status === 'pinned' ? 'pinned' : ''}" onclick="App.openPost(${post.id})">
                ${post.status === 'pinned' ? '<div class="post-pinned-badge">📌 Pinned</div>' : ''}
                <div class="post-header">
                    <img src="${post.author?.avatar || '/img/default-avatar.png'}" alt="" class="post-author-avatar">
                    <div class="post-author-info">
                        <span class="post-author-name">${post.author?.name || 'Anonymous'}</span>
                        <span class="post-time">${timeAgo}</span>
                    </div>
                    <span class="post-type-badge">${icon} ${post.type}</span>
                </div>
                <h3 class="post-title">${post.title}</h3>
                <p class="post-preview">${this.truncate(post.content, 200)}</p>
                <div class="post-footer">
                    <span class="post-stat ${post.isLiked ? 'liked' : ''}">❤️ ${post.likesCount || 0}</span>
                    <span class="post-stat">💬 ${post.commentsCount || 0}</span>
                    <span class="post-stat">👁️ ${post.viewsCount || 0}</span>
                    ${post.type === 'question' && post.isAnswered ? '<span class="post-answered">✅ Answered</span>' : ''}
                </div>
            </div>
        `;
    },

    async filterPosts(type) {
        // Update filter button states
        document.querySelectorAll('.posts-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        const listContainer = document.getElementById('posts-list');
        if (!listContainer) {
            this.renderCommunityPosts(document.getElementById('community-content-area'));
            return;
        }

        listContainer.innerHTML = '<div class="loading">Loading...</div>';

        try {
            const response = await API.getCommunityPosts(this.currentCommunity.id, { type });

            if (response.success && response.posts.length > 0) {
                listContainer.innerHTML = response.posts.map(post => this.renderPostCard(post)).join('');
            } else {
                listContainer.innerHTML = `
                    <div class="empty-posts">
                        <div class="empty-posts-icon">📝</div>
                        <p>No ${type || ''} posts found</p>
                    </div>
                `;
            }
        } catch (error) {
            listContainer.innerHTML = '<p class="error">Failed to load posts</p>';
        }
    },

    showCreatePostModal() {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'create-post-modal';
        modal.innerHTML = `
            <div class="modal create-post-modal">
                <div class="modal-header">
                    <h2>Create Post</h2>
                    <button class="modal-close" onclick="App.closeModal('create-post-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Post Type</label>
                        <select id="post-type" class="form-control">
                            <option value="discussion">💬 Discussion</option>
                            <option value="question">❓ Question</option>
                            <option value="announcement">📢 Announcement</option>
                            <option value="resource">📎 Resource</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" id="post-title" class="form-control" placeholder="Enter a descriptive title...">
                    </div>
                    <div class="form-group">
                        <label>Content</label>
                        <textarea id="post-content" class="form-control" rows="6" placeholder="Write your post content..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="App.closeModal('create-post-modal')">Cancel</button>
                    <button class="btn btn-primary" onclick="App.createPost()">Post</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.remove();
    },

    // AI Teacher Chat Modal
    openAskAITeacher() {
        const community = this.currentCommunity;
        if (!community?.isAIOwned || !community?.aiTeacher) {
            alert('AI Teacher not available');
            return;
        }

        const teacher = community.aiTeacher;
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'ai-teacher-modal';
        modal.innerHTML = `
            <div class="modal ai-teacher-modal">
                <div class="modal-header ai-teacher-header">
                    <div class="ai-teacher-info">
                        ${teacher.avatar ? `<img src="${teacher.avatar}" alt="${teacher.name}" class="ai-teacher-chat-avatar">` : '<span class="ai-avatar-icon">🤖</span>'}
                        <div>
                            <h2>${teacher.name}</h2>
                            <span class="ai-teacher-expertise">${teacher.expertise || 'AI Instructor'}</span>
                        </div>
                    </div>
                    <button class="modal-close" onclick="App.closeModal('ai-teacher-modal')">&times;</button>
                </div>
                <div class="modal-body ai-chat-body">
                    <div id="ai-chat-messages" class="ai-chat-messages">
                        <div class="ai-message ai-teacher-message">
                            <div class="message-avatar">🤖</div>
                            <div class="message-content">${teacher.welcomeMessage || `Hello! I'm ${teacher.name}. How can I help you today?`}</div>
                        </div>
                    </div>
                    <div class="ai-chat-input-area">
                        <textarea id="ai-question-input" class="form-control" placeholder="Ask ${teacher.name} a question..." rows="2"></textarea>
                        <button class="btn btn-primary" onclick="App.askAITeacher()" id="ask-ai-btn">
                            <span class="btn-text">Send</span>
                            <span class="btn-loading" style="display:none;">...</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Focus input
        document.getElementById('ai-question-input').focus();

        // Enter key to submit
        document.getElementById('ai-question-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.askAITeacher();
            }
        });
    },

    async askAITeacher() {
        const input = document.getElementById('ai-question-input');
        const messagesContainer = document.getElementById('ai-chat-messages');
        const btn = document.getElementById('ask-ai-btn');
        const question = input.value.trim();

        if (!question) return;

        const community = this.currentCommunity;
        if (!community?.aiTeacher) return;

        // Disable input while processing
        input.disabled = true;
        btn.querySelector('.btn-text').style.display = 'none';
        btn.querySelector('.btn-loading').style.display = 'inline';
        btn.disabled = true;

        // Add user message
        messagesContainer.innerHTML += `
            <div class="ai-message user-message">
                <div class="message-content">${this.escapeHtml(question)}</div>
                <div class="message-avatar">👤</div>
            </div>
        `;
        input.value = '';
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Add typing indicator
        const typingId = 'typing-' + Date.now();
        messagesContainer.innerHTML += `
            <div class="ai-message ai-teacher-message typing-indicator" id="${typingId}">
                <div class="message-avatar">🤖</div>
                <div class="message-content"><span class="typing-dots">...</span></div>
            </div>
        `;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
            const response = await fetch(`/api/ai-teachers/${community.aiTeacher.id}/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question })
            });

            const data = await response.json();

            // Remove typing indicator
            document.getElementById(typingId)?.remove();

            if (data.success) {
                messagesContainer.innerHTML += `
                    <div class="ai-message ai-teacher-message">
                        <div class="message-avatar">🤖</div>
                        <div class="message-content">${this.formatAIResponse(data.content)}</div>
                    </div>
                `;
            } else {
                messagesContainer.innerHTML += `
                    <div class="ai-message ai-teacher-message error-message">
                        <div class="message-avatar">🤖</div>
                        <div class="message-content">Sorry, I couldn't process your question. Please try again.</div>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById(typingId)?.remove();
            messagesContainer.innerHTML += `
                <div class="ai-message ai-teacher-message error-message">
                    <div class="message-avatar">🤖</div>
                    <div class="message-content">Connection error. Please try again.</div>
                </div>
            `;
        }

        // Re-enable input
        input.disabled = false;
        btn.querySelector('.btn-text').style.display = 'inline';
        btn.querySelector('.btn-loading').style.display = 'none';
        btn.disabled = false;
        input.focus();
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    formatAIResponse(content) {
        // Basic markdown-like formatting
        return content
            .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    },

    async createPost() {
        const type = document.getElementById('post-type').value;
        const title = document.getElementById('post-title').value.trim();
        const content = document.getElementById('post-content').value.trim();

        if (!title || !content) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const response = await API.createPost(this.currentCommunity.id, {
                type,
                title,
                content
            });

            if (response.success) {
                this.closeModal('create-post-modal');
                this.renderCommunityPosts(document.getElementById('community-content-area'));
            }
        } catch (error) {
            alert(error.message || 'Failed to create post');
        }
    },

    async openPost(postId) {
        const container = document.getElementById('community-content-area');
        container.innerHTML = '<div class="loading">Loading post...</div>';

        try {
            const response = await API.getPost(postId);

            if (response.success && response.post) {
                const post = response.post;
                this.currentPost = post;

                const timeAgo = this.getTimeAgo(post.createdAt);
                const isOwner = this.user && post.authorId === this.user.id;
                const canComment = this.currentCommunity.isMember;

                let html = `
                    <div class="post-detail">
                        <button class="back-btn" onclick="App.switchCommunityTab('posts')">← Back to Posts</button>

                        <div class="post-full">
                            <div class="post-header">
                                <img src="${post.author?.avatar || '/img/default-avatar.png'}" alt="" class="post-author-avatar">
                                <div class="post-author-info">
                                    <span class="post-author-name">${post.author?.name || 'Anonymous'}</span>
                                    <span class="post-time">${timeAgo}</span>
                                </div>
                                ${isOwner ? `
                                    <div class="post-actions">
                                        <button class="btn btn-small btn-secondary" onclick="App.editPost(${post.id})">Edit</button>
                                        <button class="btn btn-small btn-danger" onclick="App.deletePost(${post.id})">Delete</button>
                                    </div>
                                ` : ''}
                            </div>

                            <h1 class="post-title">${post.title}</h1>
                            <div class="post-content">${this.formatMessage(post.content)}</div>

                            <div class="post-interactions">
                                <button class="interaction-btn ${post.isLiked ? 'liked' : ''}" onclick="App.likePost(${post.id})">
                                    ❤️ <span id="post-likes-count">${post.likesCount || 0}</span>
                                </button>
                                <span class="interaction-stat">💬 ${post.commentsCount || 0} comments</span>
                                <span class="interaction-stat">👁️ ${post.viewsCount || 0} views</span>
                            </div>
                        </div>

                        <div class="comments-section">
                            <h3>Comments</h3>

                            ${canComment ? `
                                <div class="add-comment">
                                    <textarea id="comment-input" placeholder="Write a comment..." rows="2"></textarea>
                                    <button class="btn btn-primary btn-small" onclick="App.addComment(${post.id})">Comment</button>
                                </div>
                            ` : ''}

                            <div id="comments-list" class="comments-list">
                                ${this.renderComments(post.comments || [])}
                            </div>
                        </div>
                    </div>
                `;

                container.innerHTML = html;
            } else {
                container.innerHTML = '<p class="error">Post not found</p>';
            }
        } catch (error) {
            container.innerHTML = '<p class="error">Failed to load post</p>';
        }
    },

    renderComments(comments, isReply = false) {
        if (!comments || comments.length === 0) {
            return isReply ? '' : '<p class="no-comments">No comments yet. Be the first to comment!</p>';
        }

        return comments.map(comment => {
            const timeAgo = this.getTimeAgo(comment.createdAt);
            const isOwner = this.user && comment.authorId === this.user.id;
            const isPostOwner = this.user && this.currentPost.authorId === this.user.id;
            const canAccept = isPostOwner && this.currentPost.type === 'question' && !isReply;

            return `
                <div class="comment ${comment.isAcceptedAnswer ? 'accepted-answer' : ''} ${isReply ? 'reply' : ''}">
                    ${comment.isAcceptedAnswer ? '<div class="accepted-badge">✅ Accepted Answer</div>' : ''}
                    <div class="comment-header">
                        <img src="${comment.author?.avatar || '/img/default-avatar.png'}" alt="" class="comment-avatar">
                        <div class="comment-author-info">
                            <span class="comment-author">${comment.author?.name || 'Anonymous'}</span>
                            <span class="comment-time">${timeAgo}</span>
                        </div>
                    </div>
                    <div class="comment-content">${this.formatMessage(comment.content)}</div>
                    <div class="comment-actions">
                        <button class="comment-action ${comment.isLiked ? 'liked' : ''}" onclick="App.likeComment(${comment.id})">
                            ❤️ ${comment.likesCount || 0}
                        </button>
                        ${!isReply ? `<button class="comment-action" onclick="App.showReplyForm(${comment.id})">Reply</button>` : ''}
                        ${canAccept && !comment.isAcceptedAnswer ? `<button class="comment-action accept" onclick="App.acceptAnswer(${comment.id})">✓ Accept</button>` : ''}
                        ${isOwner ? `<button class="comment-action delete" onclick="App.deleteComment(${comment.id})">Delete</button>` : ''}
                    </div>
                    <div id="reply-form-${comment.id}" class="reply-form" style="display: none;">
                        <textarea placeholder="Write a reply..." rows="2"></textarea>
                        <div>
                            <button class="btn btn-primary btn-small" onclick="App.addReply(${this.currentPost.id}, ${comment.id})">Reply</button>
                            <button class="btn btn-secondary btn-small" onclick="App.hideReplyForm(${comment.id})">Cancel</button>
                        </div>
                    </div>
                    ${comment.replies && comment.replies.length > 0 ? `
                        <div class="replies">
                            ${this.renderComments(comment.replies, true)}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    },

    showReplyForm(commentId) {
        document.getElementById(`reply-form-${commentId}`).style.display = 'block';
    },

    hideReplyForm(commentId) {
        document.getElementById(`reply-form-${commentId}`).style.display = 'none';
    },

    async likePost(postId) {
        if (!this.user) {
            window.location.href = '/auth/google';
            return;
        }

        try {
            const response = await API.likePost(postId);
            if (response.success) {
                const countEl = document.getElementById('post-likes-count');
                if (countEl) countEl.textContent = response.likesCount;

                const btn = event.target.closest('.interaction-btn');
                if (btn) btn.classList.toggle('liked', response.liked);
            }
        } catch (error) {
            alert(error.message || 'Failed to like post');
        }
    },

    async likeComment(commentId) {
        if (!this.user) {
            window.location.href = '/auth/google';
            return;
        }

        try {
            const response = await API.likeComment(commentId);
            if (response.success) {
                const btn = event.target.closest('.comment-action');
                if (btn) {
                    btn.classList.toggle('liked', response.liked);
                    btn.innerHTML = `❤️ ${response.likesCount}`;
                }
            }
        } catch (error) {
            alert(error.message || 'Failed to like comment');
        }
    },

    async addComment(postId) {
        const input = document.getElementById('comment-input');
        const content = input.value.trim();

        if (!content) {
            alert('Please enter a comment');
            return;
        }

        try {
            const response = await API.addComment(postId, content);
            if (response.success) {
                input.value = '';
                // Reload comments
                this.openPost(postId);
            }
        } catch (error) {
            alert(error.message || 'Failed to add comment');
        }
    },

    async addReply(postId, parentId) {
        const form = document.getElementById(`reply-form-${parentId}`);
        const textarea = form.querySelector('textarea');
        const content = textarea.value.trim();

        if (!content) {
            alert('Please enter a reply');
            return;
        }

        try {
            const response = await API.addComment(postId, content, parentId);
            if (response.success) {
                // Reload comments
                this.openPost(postId);
            }
        } catch (error) {
            alert(error.message || 'Failed to add reply');
        }
    },

    async acceptAnswer(commentId) {
        try {
            const response = await API.acceptAnswer(commentId);
            if (response.success) {
                // Reload post to show accepted answer
                this.openPost(this.currentPost.id);
            }
        } catch (error) {
            alert(error.message || 'Failed to accept answer');
        }
    },

    async deleteComment(commentId) {
        if (!confirm('Delete this comment?')) return;

        try {
            const response = await API.deleteComment(commentId);
            if (response.success) {
                this.openPost(this.currentPost.id);
            }
        } catch (error) {
            alert(error.message || 'Failed to delete comment');
        }
    },

    async deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const response = await API.deletePost(postId);
            if (response.success) {
                this.switchCommunityTab('posts');
            }
        } catch (error) {
            alert(error.message || 'Failed to delete post');
        }
    },

    async renderCommunityMembers(container) {
        container.innerHTML = '<div class="loading">Loading members...</div>';

        try {
            const response = await API.getCommunityMembers(this.currentCommunity.id);

            if (response.success && response.members.length > 0) {
                container.innerHTML = `
                    <div class="members-list">
                        ${response.members.map(m => `
                            <div class="member-card">
                                <img src="${m.user?.avatar || '/img/default-avatar.png'}" alt="" class="member-avatar">
                                <div class="member-info">
                                    <span class="member-name">${m.user?.name || 'Unknown'}</span>
                                    <span class="member-role ${m.role}">${m.role}</span>
                                </div>
                                <div class="member-stats">
                                    <span>📝 ${m.postsCount || 0} posts</span>
                                    <span>💬 ${m.commentsCount || 0} comments</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                container.innerHTML = '<p class="empty-state">No members found</p>';
            }
        } catch (error) {
            container.innerHTML = '<p class="error">Failed to load members</p>';
        }
    },

    renderCommunitySettings(container) {
        const c = this.currentCommunity;
        container.innerHTML = `
            <div class="community-settings">
                <h3>Community Settings</h3>
                <p style="color: var(--gray); margin-bottom: 20px;">Manage your community settings here.</p>

                <div class="settings-section">
                    <h4>General</h4>
                    <div class="form-group">
                        <label>Allow Members to Post</label>
                        <select id="setting-allow-posts" class="form-control">
                            <option value="true" ${c.settings?.allowMemberPosts ? 'selected' : ''}>Yes</option>
                            <option value="false" ${!c.settings?.allowMemberPosts ? 'selected' : ''}>No (Only moderators)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Community Visibility</label>
                        <select id="setting-visibility" class="form-control">
                            <option value="true" ${c.isPublic ? 'selected' : ''}>Public</option>
                            <option value="false" ${!c.isPublic ? 'selected' : ''}>Private</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" onclick="App.saveCommunitySettings()">Save Settings</button>
                </div>

                <div class="settings-section danger-zone">
                    <h4>Danger Zone</h4>
                    <button class="btn btn-danger" onclick="App.deleteCommunity()">Delete Community</button>
                </div>
            </div>
        `;
    },

    async saveCommunitySettings() {
        const allowMemberPosts = document.getElementById('setting-allow-posts').value === 'true';
        const isPublic = document.getElementById('setting-visibility').value === 'true';

        try {
            const response = await API.updateCommunity(this.currentCommunity.id, {
                settings: { allowMemberPosts },
                isPublic
            });
            if (response.success) {
                alert('Settings saved!');
                this.loadCommunityDetail(this.currentCommunity.slug || this.currentCommunity.id);
            }
        } catch (error) {
            alert(error.message || 'Failed to save settings');
        }
    },

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    },

    async joinCommunity(communityId) {
        if (!this.user) {
            window.location.href = '/auth/google';
            return;
        }

        try {
            const response = await API.joinCommunity(communityId);
            if (response.success) {
                alert(response.message || 'Joined successfully!');
                // Reload current page
                if (this.currentPage === 'communities') {
                    this.loadCommunities();
                } else {
                    this.loadCommunityDetail(communityId);
                }
            }
        } catch (error) {
            alert(error.message || 'Failed to join community');
        }
    },

    async leaveCommunity(communityId) {
        if (!confirm('Are you sure you want to leave this community?')) return;

        try {
            const response = await API.leaveCommunity(communityId);
            if (response.success) {
                alert(response.message || 'Left community');
                this.navigateTo('communities');
            }
        } catch (error) {
            alert(error.message || 'Failed to leave community');
        }
    },

    showCreateCommunityModal() {
        // For now, show a simple alert. Full modal to be implemented
        alert('Community creation coming soon! Use the Admin dashboard to create communities.');
    },

    // ==================== LEARNING PAGE ====================
    currentEnrollment: null,
    currentModule: null,
    quizAnswers: {},

    async loadLearnPage(enrollmentId) {
        if (!this.user) {
            this.navigateTo('login');
            return;
        }

        try {
            const response = await API.getEnrollment(enrollmentId);
            if (!response.success || !response.enrollment) {
                alert('Enrollment not found');
                this.navigateTo('dashboard');
                return;
            }

            this.currentEnrollment = response.enrollment;
            const course = this.currentEnrollment.course;
            const modules = course.modules || [];
            const completedIds = this.currentEnrollment.modulesCompleted || [];

            // Update course name
            document.getElementById('learn-course-name').textContent = course.name;

            // Render modules list
            const modulesList = document.getElementById('learn-modules-list');
            if (modules.length > 0) {
                modulesList.innerHTML = modules.map(m => {
                    const isCompleted = completedIds.includes(m.id);
                    return `
                        <div class="module-item ${isCompleted ? 'completed' : ''}"
                             data-module-id="${m.id}"
                             onclick="App.loadModule(${m.id})">
                            <span class="module-order">Module ${m.order}</span>
                            ${m.name}
                        </div>
                    `;
                }).join('');
            } else {
                modulesList.innerHTML = '<p style="color: var(--gray);">No modules available</p>';
            }

            // Update progress
            const progress = modules.length > 0 ? Math.round((completedIds.length / modules.length) * 100) : 0;
            document.getElementById('learn-progress-fill').style.width = `${progress}%`;
            document.getElementById('learn-progress-text').textContent = `${progress}%`;

            // Show welcome or load first uncompleted module
            const firstUncompleted = modules.find(m => !completedIds.includes(m.id));
            if (firstUncompleted) {
                this.loadModule(firstUncompleted.id);
            } else if (modules.length > 0) {
                this.loadModule(modules[0].id);
            }

        } catch (error) {
            console.error('Failed to load learning page:', error);
            alert('Failed to load course');
            this.navigateTo('dashboard');
        }
    },

    async loadModule(moduleId) {
        const course = this.currentEnrollment.course;
        const module = course.modules.find(m => m.id === moduleId);

        if (!module) {
            console.error('Module not found');
            return;
        }

        this.currentModule = module;
        this.quizAnswers = {};

        // Update sidebar active state
        document.querySelectorAll('.module-item').forEach(el => {
            el.classList.toggle('active', parseInt(el.dataset.moduleId) === moduleId);
        });

        const completedIds = this.currentEnrollment.modulesCompleted || [];
        const isCompleted = completedIds.includes(moduleId);
        const quizScores = this.currentEnrollment.quizScores || {};
        const moduleScore = quizScores[moduleId];

        // Parse markdown-like content
        const contentHtml = this.parseContent(module.content || 'No content available');

        // Render module content
        const container = document.getElementById('learn-module-content');
        container.innerHTML = `
            <div class="module-header">
                <h2>${module.name}</h2>
                <div class="module-meta">
                    <span>📚 Module ${module.order}</span>
                    <span>⏱️ ${module.estimatedMinutes || 30} minutes</span>
                    ${isCompleted ? '<span style="color: #28a745;">✓ Completed</span>' : ''}
                </div>
            </div>
            <div class="module-body">
                ${contentHtml}
            </div>
            ${module.quizQuestions && module.quizQuestions.length > 0 ? this.renderQuiz(module, moduleScore) : ''}
        `;
    },

    parseContent(content) {
        // Simple markdown-like parser
        return content
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
            .replace(/\\n/g, '<br>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(.+)$/gm, '<p>$1</p>')
            .replace(/<p><h/g, '<h')
            .replace(/<\/h(\d)><\/p>/g, '</h$1>')
            .replace(/<p><ul>/g, '<ul>')
            .replace(/<\/ul><\/p>/g, '</ul>')
            .replace(/<p><\/p>/g, '');
    },

    renderQuiz(module, previousScore) {
        const questions = module.quizQuestions || [];
        if (questions.length === 0) return '';

        return `
            <div class="quiz-section">
                <h3>📝 Quiz - Test Your Knowledge</h3>
                ${previousScore ? `
                    <div class="quiz-result ${previousScore.score >= 70 ? 'passed' : 'failed'}">
                        <h4>Previous Score: ${previousScore.score}%</h4>
                        <p>${previousScore.score >= 70 ? 'You passed! Feel free to review or retake.' : 'Keep learning and try again!'}</p>
                    </div>
                ` : ''}
                <div id="quiz-questions">
                    ${questions.map((q, idx) => `
                        <div class="quiz-question" data-question="${q.id}">
                            <p>${idx + 1}. ${q.question}</p>
                            <div class="quiz-options">
                                ${q.options.map((opt, optIdx) => `
                                    <label class="quiz-option" onclick="App.selectAnswer(${q.id}, ${optIdx})">
                                        <input type="radio" name="q_${q.id}" value="${optIdx}">
                                        ${opt}
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="quiz-actions">
                    <button class="btn btn-primary" onclick="App.submitQuiz()">Submit Quiz</button>
                </div>
                <div id="quiz-result"></div>
            </div>
        `;
    },

    selectAnswer(questionId, optionIndex) {
        this.quizAnswers[questionId] = optionIndex;

        // Update visual selection
        document.querySelectorAll(`.quiz-question[data-question="${questionId}"] .quiz-option`).forEach((el, idx) => {
            el.classList.toggle('selected', idx === optionIndex);
        });
    },

    async submitQuiz() {
        const questions = this.currentModule.quizQuestions || [];

        // Check if all questions answered
        if (Object.keys(this.quizAnswers).length < questions.length) {
            alert('Please answer all questions before submitting.');
            return;
        }

        // Calculate score
        let correct = 0;
        questions.forEach(q => {
            const selectedAnswer = this.quizAnswers[q.id];
            if (selectedAnswer === q.correctIndex) {
                correct++;
            }
        });

        const score = Math.round((correct / questions.length) * 100);
        const passed = score >= 70;

        // Show correct/incorrect on options
        questions.forEach(q => {
            const selectedAnswer = this.quizAnswers[q.id];
            const options = document.querySelectorAll(`.quiz-question[data-question="${q.id}"] .quiz-option`);
            options.forEach((el, idx) => {
                el.classList.remove('selected');
                if (idx === q.correctIndex) {
                    el.classList.add('correct');
                } else if (idx === selectedAnswer && selectedAnswer !== q.correctIndex) {
                    el.classList.add('incorrect');
                }
            });
        });

        // Show result
        const resultContainer = document.getElementById('quiz-result');
        resultContainer.innerHTML = `
            <div class="quiz-result ${passed ? 'passed' : 'failed'}">
                <h4>${passed ? '🎉 Congratulations!' : '📚 Keep Learning!'}</h4>
                <p>You scored ${score}% (${correct}/${questions.length} correct)</p>
                <p>${passed ? 'Module completed! Move on to the next one.' : 'You need 70% to pass. Review the content and try again.'}</p>
            </div>
        `;

        // Submit to server
        try {
            const response = await API.completeModule(
                this.currentEnrollment.id,
                this.currentModule.id,
                score,
                this.quizAnswers
            );

            if (response.success) {
                // Update local enrollment data
                if (!this.currentEnrollment.modulesCompleted) {
                    this.currentEnrollment.modulesCompleted = [];
                }
                if (!this.currentEnrollment.modulesCompleted.includes(this.currentModule.id)) {
                    this.currentEnrollment.modulesCompleted.push(this.currentModule.id);
                }

                // Update sidebar
                const moduleEl = document.querySelector(`.module-item[data-module-id="${this.currentModule.id}"]`);
                if (moduleEl && passed) {
                    moduleEl.classList.add('completed');
                }

                // Update progress
                const modules = this.currentEnrollment.course.modules || [];
                const completedIds = this.currentEnrollment.modulesCompleted;
                const progress = modules.length > 0 ? Math.round((completedIds.length / modules.length) * 100) : 0;
                document.getElementById('learn-progress-fill').style.width = `${progress}%`;
                document.getElementById('learn-progress-text').textContent = `${progress}%`;

                // Show credits earned
                if (response.creditsAwarded > 0) {
                    resultContainer.innerHTML += `<p style="margin-top: 10px; color: var(--primary);">+${response.creditsAwarded} credits earned!</p>`;
                }
            }
        } catch (error) {
            console.error('Failed to save quiz result:', error);
        }
    },

    startLearning(enrollmentId) {
        window.location.hash = `learn/${enrollmentId}`;
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => App.init());
