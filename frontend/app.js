document.addEventListener('DOMContentLoaded', () => {

    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.page-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-target');

            navItems.forEach(nav => nav.classList.remove('active'));

            item.classList.add('active');

            sections.forEach(section => {
                section.classList.add('hidden');
                section.classList.remove('active');
            });

            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
                targetSection.classList.add('active'); 
            }

            if (targetId === 'documents') loadDocuments();
            if (targetId === 'analysis') loadSpendingAnalysis();
            if (targetId === 'recurring') loadRecurring();
            if (targetId === 'upcoming') loadUpcoming();
            if (targetId === 'budget') loadBudget();
            if (targetId === 'ai-insights') loadAIInsights();

            startAutoRefresh();

            const sidebar = document.querySelector('.sidebar');
            if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.sidebar');
            const isClickInsideSidebar = sidebar.contains(e.target);

            if (!isClickInsideSidebar && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        }
    });

    initCharts();
    initAnalysisCharts();

    loadDashboardData();
    initTransactionsPage();
    initAIInsights();
    initRiskScore();

    initDocumentsPage();

    const viewAllLink = document.getElementById('dash-view-all');
    if (viewAllLink) {
        viewAllLink.addEventListener('click', (e) => {
            e.preventDefault();

            const txNavItem = document.querySelector('.nav-item[data-target="transactions"]');
            if (txNavItem) {
                txNavItem.click();
            }
        });
    }

    startAutoRefresh();
});


let autoRefreshInterval = null;

function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);

    autoRefreshInterval = setInterval(() => {
        loadCurrentPageData();
    }, 30000);
}

function loadCurrentPageData() {
    const activeItem = document.querySelector('.nav-item.active');
    const targetId = activeItem ? activeItem.getAttribute('data-target') : 'dashboard';

    console.log(`Auto-refreshing: ${targetId}`);

    switch(targetId) {
        case 'dashboard': loadDashboardData(); break;
        case 'transactions': 
            const searchInput = document.getElementById('tx-search-input');
            if (!searchInput || searchInput.value === '') initTransactionsPage(); 
            break;
        case 'documents': loadDocuments(); break;
        case 'analysis': loadSpendingAnalysis(); break;
        case 'recurring': loadRecurring(); break;
        case 'upcoming': loadUpcoming(); break;
        case 'budget': loadBudget(); break;
        case 'ai-insights': loadAIInsights(); break;
        case 'risk-score': loadRiskScore(); break;
    }
}

function refreshAllData() {
    loadDashboardData();
    initTransactionsPage();
    loadSpendingAnalysis();
    loadBudget();
    loadRecurring();
    loadUpcoming();
    loadRiskScore();
}

function setFetchStatus(isFetching) {
    const dot = document.querySelector('.live-dot');
    if (!dot) return;

    if (isFetching) {
        dot.classList.add('fetching');
    } else {
        setTimeout(() => {
            dot.classList.remove('fetching');
        }, 500); 
    }
}


const API_BASE = 'https://finzo-1.onrender.com';

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${message}`;
    document.body.appendChild(toast);

    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.background = '#10b981';
    toast.style.color = 'white';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '8px';
    toast.style.zIndex = '9999';
    toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

async function fetchAPI(endpoint, options = {}) {
    setFetchStatus(true);
    try {
        const config = {
            method: options.method || 'GET',
            headers: options.headers || {},
            ...options
        };
        if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
            config.headers['Content-Type'] = 'application/json';
            config.body = JSON.stringify(options.body);
        }
        const response = await fetch(`${API_BASE}/api${endpoint}`, config);
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    } finally {
        setFetchStatus(false);
    }
}

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(amount);
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
