/**
 * API Client for Haiti Skills Academy
 */

const API = {
    baseUrl: '/api',

    // Helper for fetch requests
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include',  // Include cookies for auth
            ...options
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    },

    // ==================== AUTH ====================
    async getUser() {
        return this.request('/user');
    },

    // ==================== COURSES ====================
    async getCourses() {
        return this.request('/courses');
    },

    async getCourse(id) {
        return this.request(`/courses/${id}`);
    },

    async enrollInCourse(courseId) {
        return this.request(`/courses/${courseId}/enroll`, {
            method: 'POST'
        });
    },

    // ==================== ENROLLMENTS ====================
    async getEnrollments() {
        return this.request('/enrollments');
    },

    async getEnrollment(id) {
        return this.request(`/enrollments/${id}`);
    },

    async completeModule(enrollmentId, moduleId, quizScore) {
        return this.request(`/enrollments/${enrollmentId}/complete-module`, {
            method: 'POST',
            body: { moduleId, quizScore }
        });
    },

    async logPracticalHours(enrollmentId, hours, activity, date) {
        return this.request(`/enrollments/${enrollmentId}/log-hours`, {
            method: 'POST',
            body: { hours, activity, date }
        });
    },

    // ==================== CERTIFICATIONS ====================
    async getCertifications() {
        return this.request('/certifications');
    },

    async verifyCertification(certificateNumber) {
        return this.request(`/certifications/verify/${certificateNumber}`);
    },

    // ==================== JOBS ====================
    async getJobs(filters = {}) {
        const params = new URLSearchParams();
        if (filters.courseId) params.append('courseId', filters.courseId);
        if (filters.companyId) params.append('companyId', filters.companyId);
        if (filters.level) params.append('level', filters.level);

        const query = params.toString() ? `?${params.toString()}` : '';
        return this.request(`/jobs${query}`);
    },

    async getJob(id) {
        return this.request(`/jobs/${id}`);
    },

    async applyToJob(jobId, data) {
        return this.request(`/jobs/${jobId}/apply`, {
            method: 'POST',
            body: data
        });
    },

    async getMyApplications() {
        return this.request('/jobs/applications/mine');
    },

    // ==================== COMPANIES ====================
    async getCompanies() {
        return this.request('/companies');
    },

    async getCompany(id) {
        return this.request(`/companies/${id}`);
    },

    // ==================== PIPELINE ====================
    async getPipeline() {
        return this.request('/pipeline');
    },

    async getPipelineStages() {
        return this.request('/pipeline/stages');
    },

    // ==================== MESSAGES (AI TUTOR) ====================
    async getConversations() {
        return this.request('/messages');
    },

    async getConversation(conversationId) {
        return this.request(`/messages/conversation/${conversationId}`);
    },

    async sendToAITutor(content, courseContext = null, conversationId = null) {
        return this.request('/messages/ai-tutor', {
            method: 'POST',
            body: { content, courseContext, conversationId }
        });
    },

    async getUnreadCount() {
        return this.request('/messages/unread-count');
    },

    async deleteConversation(conversationId) {
        return this.request(`/messages/conversation/${conversationId}`, {
            method: 'DELETE'
        });
    },

    // ==================== COMMUNITIES ====================
    async getCommunities(filters = {}) {
        const params = new URLSearchParams();
        if (filters.courseId) params.append('courseId', filters.courseId);
        if (filters.search) params.append('search', filters.search);
        if (filters.page) params.append('page', filters.page);

        const query = params.toString() ? `?${params.toString()}` : '';
        return this.request(`/communities${query}`);
    },

    async getCommunity(id) {
        return this.request(`/communities/${id}`);
    },

    async getCommunityBySlug(slug) {
        return this.request(`/communities/slug/${slug}`);
    },

    async getMyCommunities() {
        return this.request('/communities/my/memberships');
    },

    async getOwnedCommunities() {
        return this.request('/communities/my/owned');
    },

    async createCommunity(data) {
        return this.request('/communities', {
            method: 'POST',
            body: data
        });
    },

    async updateCommunity(id, data) {
        return this.request(`/communities/${id}`, {
            method: 'PUT',
            body: data
        });
    },

    async joinCommunity(id) {
        return this.request(`/communities/${id}/join`, {
            method: 'POST'
        });
    },

    async joinCommunityByCode(inviteCode) {
        return this.request(`/communities/join/${inviteCode}`, {
            method: 'POST'
        });
    },

    async leaveCommunity(id) {
        return this.request(`/communities/${id}/leave`, {
            method: 'POST'
        });
    },

    async getCommunityMembers(id, status = 'active') {
        return this.request(`/communities/${id}/members?status=${status}`);
    },

    async manageCommunityMember(communityId, userId, action, role = null) {
        return this.request(`/communities/${communityId}/members/${userId}`, {
            method: 'PUT',
            body: { action, role }
        });
    },

    // ==================== POSTS ====================
    async getCommunityPosts(communityId, filters = {}) {
        const params = new URLSearchParams();
        if (filters.type) params.append('type', filters.type);
        if (filters.page) params.append('page', filters.page);

        const query = params.toString() ? `?${params.toString()}` : '';
        return this.request(`/posts/community/${communityId}${query}`);
    },

    async getPost(postId) {
        return this.request(`/posts/${postId}`);
    },

    async createPost(communityId, data) {
        return this.request(`/posts/community/${communityId}`, {
            method: 'POST',
            body: data
        });
    },

    async updatePost(postId, data) {
        return this.request(`/posts/${postId}`, {
            method: 'PUT',
            body: data
        });
    },

    async deletePost(postId) {
        return this.request(`/posts/${postId}`, {
            method: 'DELETE'
        });
    },

    async likePost(postId) {
        return this.request(`/posts/${postId}/like`, {
            method: 'POST'
        });
    },

    async addComment(postId, content, parentId = null) {
        return this.request(`/posts/${postId}/comments`, {
            method: 'POST',
            body: { content, parentId }
        });
    },

    async deleteComment(commentId) {
        return this.request(`/posts/comments/${commentId}`, {
            method: 'DELETE'
        });
    },

    async likeComment(commentId) {
        return this.request(`/posts/comments/${commentId}/like`, {
            method: 'POST'
        });
    },

    async acceptAnswer(commentId) {
        return this.request(`/posts/comments/${commentId}/accept`, {
            method: 'POST'
        });
    }
};

// Export
window.API = API;
