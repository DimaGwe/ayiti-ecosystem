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
    }
};

// Export
window.API = API;
