document.addEventListener('DOMContentLoaded', () => {
    // Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.page-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-target');
            
            // Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');

            // Hide all sections
            sections.forEach(section => {
                section.classList.add('hidden');
                section.classList.remove('active');
            });

            // Show target section
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
                targetSection.classList.add('active'); 
            }

            if (targetId === 'documents') {
                loadDocuments();
            }
            if (targetId === 'analysis') {
                loadSpendingAnalysis();
            }
            if (targetId === 'recurring') {
                loadRecurring();
            }
            if (targetId === 'upcoming') {
                loadUpcoming();
            }
            if (targetId === 'budget') {
                loadBudget();
            }
            if (targetId === 'ai-insights') {
                loadAIInsights();
            }
            
            // Restart Auto Refresh for new page
            startAutoRefresh();
            
            // On mobile, close sidebar after selection
            const sidebar = document.querySelector('.sidebar');
            if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.sidebar');
            const isClickInsideSidebar = sidebar.contains(e.target);
            
            if (!isClickInsideSidebar && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        }
    });

    // --- CHART.JS INITIALIZATION ---
    initCharts();
    initAnalysisCharts();

    // --- INITIAL DATA LOAD ---
    loadDashboardData();
    initTransactionsPage();
    initAIInsights();
    initRiskScore();

    // --- DOCUMENTS PAGE LOGIC ---
    initDocumentsPage();

    // View All Link in Dashboard
    const viewAllLink = document.getElementById('dash-view-all');
    if (viewAllLink) {
        viewAllLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Trigger click on Transactions nav item
            const txNavItem = document.querySelector('.nav-item[data-target="transactions"]');
            if (txNavItem) {
                txNavItem.click();
            }
        });
    }

    // Start Auto Refresh
    startAutoRefresh();
});

// --- AUTO REFRESH & POLLING ---
let autoRefreshInterval = null;

function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    
    // Refresh every 30 seconds
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
            // Only refresh if not searching/filtering to avoid disrupting user
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
        }, 500); // Small delay to make it visible
    }
}

// --- API HELPERS ---
const API_BASE = 'http://localhost:8000';

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${message}`;
    document.body.appendChild(toast);
    
    // Simple toast styles
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

// --- DASHBOARD LOGIC ---
async function loadDashboardData() {
    // 1. Fetch Summary for Hero Card (Income, Expense, Balance)
    // We call transactions/summary to get the full picture including credits
    const txSummaryRes = await fetchAPI('/transactions/summary');
    if (txSummaryRes) {
        const incomeEl = document.getElementById('dash-total-income');
        const heroIncomeEl = document.getElementById('hero-total-income');
        const expenseEl = document.getElementById('dash-total-spent');
        const savingsEl = document.getElementById('hero-total-savings');
        const balanceEl = document.getElementById('dash-balance');

        if (incomeEl) incomeEl.textContent = formatCurrency(txSummaryRes.total_credit);
        if (heroIncomeEl) heroIncomeEl.textContent = formatCurrency(txSummaryRes.total_credit);
        if (expenseEl) expenseEl.textContent = formatCurrency(txSummaryRes.total_debit);
        if (balanceEl) balanceEl.textContent = formatCurrency(txSummaryRes.net_balance);
        
        // Calculate simplistic savings
        if (savingsEl) savingsEl.textContent = formatCurrency(txSummaryRes.net_balance);
    }

    // 2. Charts Data
    const categories = await fetchAPI('/dashboard/categories');
    const trends = await fetchAPI('/dashboard/monthly-trend');
    
    if (categories && trends) {
        updateDashboardCharts(categories, trends);
    }

    // 3. Recent Transactions
    const recentTx = await fetchAPI('/transactions?limit=5');
    if (recentTx) {
        const txList = recentTx.transactions || recentTx;
        renderRecentTransactions(txList);
    }
}

function updateDashboardCharts(categories, trends) {
    // Update Category Chart (Donut) - Moved to Right Panel
    if (window.categoryChart) {
        window.categoryChart.data.labels = categories.map(c => c.category);
        window.categoryChart.data.datasets[0].data = categories.map(c => c.percentage);
        window.categoryChart.update();

        const legendContainer = document.getElementById('category-legend');
        if (legendContainer && categories && categories.length > 0) {
            const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#3b82f6','#ec4899','#64748b'];
            legendContainer.innerHTML = categories.slice(0,8).map((c,i) => `
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="width:8px;height:8px;border-radius:50%;background:${colors[i%colors.length]};flex-shrink:0;"></span>
                    <span style="font-size:11px;color:#94a3b8;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.category}</span>
                    <span style="font-size:11px;color:#e2e8f0;font-weight:600;">${c.percentage?c.percentage.toFixed(1):0}%</span>
                </div>
            `).join('');
        }
    }

    // Update Spending Trend Chart (Line) - In Main Dashboard
    if (window.spendingChart) {
        // Light Theme Colors
        window.spendingChart.options.scales.y.grid.color = 'rgba(0, 0, 0, 0.05)';
        window.spendingChart.options.scales.x.ticks.color = '#9ca3af';
        window.spendingChart.options.scales.y.ticks.color = '#9ca3af';
        window.spendingChart.data.datasets[0].borderColor = '#6366f1'; // Indigo
        window.spendingChart.data.datasets[0].pointBackgroundColor = '#ffffff';
        window.spendingChart.data.datasets[0].pointBorderColor = '#6366f1';
        
        // Update Data
        window.spendingChart.data.labels = trends.map(t => t.month);
        window.spendingChart.data.datasets[0].data = trends.map(t => t.total_amount);
        window.spendingChart.update();
    }
}

function renderRecentTransactions(transactions) {
    const container = document.getElementById('dash-recent-transactions');
    if (!container) return;
    container.innerHTML = '';

    if (!transactions || transactions.length === 0) {
        container.innerHTML = '<tr><td colspan="4" class="text-center p-4 text-muted">No recent transactions</td></tr>';
        return;
    }

    transactions.forEach(tx => {
        const isCredit = tx.transaction_type === 'credit';
        const amountSign = isCredit ? '+' : '-';
        
        let catClass = 'cat-others';
        const cat = (tx.category || '').toLowerCase();
        if (cat === 'food') catClass = 'cat-food';
        else if (cat === 'transport') catClass = 'cat-transport';
        else if (cat === 'shopping') catClass = 'cat-shopping';
        else if (cat === 'housing') catClass = 'cat-housing';

        const tr = document.createElement('tr');
        tr.className = 'tx-row';
        tr.innerHTML = `
            <td>
                <div style="font-weight: 500; color: var(--text-primary);">${tx.merchant || 'Unknown'}</div>
            </td>
            <td><span class="cat-pill ${catClass}">${tx.category || 'Uncategorized'}</span></td>
            <td style="color: var(--text-muted); font-size: 0.85rem;">${formatDate(tx.date)}</td>
            <td style="font-weight: 600; color: ${isCredit ? 'var(--success)' : 'var(--text-primary)'};">
                ${amountSign}${formatCurrency(Math.abs(tx.amount))}
            </td>
        `;
        container.appendChild(tr);
    });
}

// --- TRANSACTIONS PAGE LOGIC ---
let allTransactions = [];
let filteredTransactions = [];
let currentTxPage = 1;
const txPerPage = 10;
let totalTransactionsCount = 0; // Store total DB count

async function initTransactionsPage() {
    // 1. Fetch Summary for Total Count & Stats (PROBLEM 1 FIX)
    loadTransactionSummary();

    // 2. Load Transactions Table (PROBLEM 2 FIX)
    loadTransactions(1);
    
    // Filters
    const searchInput = document.getElementById('tx-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            loadTransactions(1);
        });
    }
    
    const categorySelect = document.getElementById('tx-category-filter');
    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            loadTransactions(1);
        });
    }
    
    // Pagination
    const prevBtn = document.getElementById('btn-prev-page');
    const nextBtn = document.getElementById('btn-next-page');
    
    if (prevBtn) {
        // Clone to remove old listeners
        const newPrev = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrev, prevBtn);
        newPrev.addEventListener('click', () => {
            if (currentTxPage > 1) {
                loadTransactions(currentTxPage - 1);
            }
        });
    }
    
    if (nextBtn) {
        const newNext = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNext, nextBtn);
        newNext.addEventListener('click', () => {
            // Check if we have more data
            // Since we load per page now, we can check if current result size == limit
            // But better to use total count if available
            const maxPage = Math.ceil(totalTransactionsCount / 10);
            if (currentTxPage < maxPage) {
                loadTransactions(currentTxPage + 1);
            }
        });
    }
}

async function loadTransactionSummary() {
    try {
        const res = await fetch('http://localhost:8000/api/transactions/summary');
        const data = await res.json();
        
        const debitEl = document.getElementById('tx-total-debits');
        const creditEl = document.getElementById('tx-total-credits');
        const netEl = document.getElementById('tx-net-balance');
        
        if (debitEl) debitEl.textContent = '₹' + Number(data.total_debit || 0).toLocaleString('en-IN');
        if (creditEl) creditEl.textContent = '₹' + Number(data.total_credit || 0).toLocaleString('en-IN');
        if (netEl) netEl.textContent = '₹' + Number(data.net_balance || 0).toLocaleString('en-IN');
        
        totalTransactionsCount = data.transaction_count || 0;
            
    } catch (err) {
        console.error('Summary error:', err);
    }
}

async function loadTransactions(page = 1) {
    currentTxPage = page;
    const search = document.getElementById('tx-search-input')?.value || '';
    const category = document.getElementById('tx-category-filter')?.value || '';
    
    let url = `http://localhost:8000/api/transactions?limit=10&offset=${(page-1)*10}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (category && category !== 'all') url += `&category=${encodeURIComponent(category)}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        // Handle array or object wrapper
        const transactions = Array.isArray(data) ? data : (data.transactions || []);
        
        const tbody = document.getElementById('transactions-table-body');
        if (!tbody) return;
        
        if (!transactions || transactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center;padding:40px;color:#9ca3af;">
                        No transactions found. Upload a document first.
                    </td>
                </tr>`;
            
            // Update pagination info even if empty
            const info = document.getElementById('tx-pagination-info');
            if (info) info.textContent = `Showing 0-0 of 0 transactions`;
            return;
        }
        
        tbody.innerHTML = transactions.map(tx => {
            const cat = (tx.category || 'others').toLowerCase();
            const isDebit = tx.transaction_type === 'debit';
            const amount = Number(tx.amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2});
            const date = formatDate(tx.date); // Use helper
            
            // Badge logic matching CSS
            let badgeClass = 'badge-others';
            if (cat === 'food') badgeClass = 'badge-food';
            else if (cat === 'transport') badgeClass = 'badge-transport';
            else if (cat === 'shopping') badgeClass = 'badge-shopping';
            else if (cat === 'housing') badgeClass = 'badge-housing';
            else if (cat === 'health') badgeClass = 'badge-health';
            else if (cat === 'entertainment') badgeClass = 'badge-entertainment';
            else if (cat === 'investment') badgeClass = 'badge-investment';
            
            return `<tr>
                <td>${date}</td>
                <td><div style="font-weight: 500; color: #e2e8f0;">${tx.merchant || tx.description || '—'}</div></td>
                <td><span class="badge ${badgeClass}">${tx.category || 'Others'}</span></td>
                <td><span class="badge-type">${tx.transaction_type || '—'}</span></td>
                <td style="color:${isDebit ? '#ef4444' : '#10b981'};font-weight:600;">
                    ${isDebit ? '-' : '+'}₹${amount}
                </td>
            </tr>`;
        }).join('');
        
        // Update pagination info
        const info = document.getElementById('tx-pagination-info');
        if (info) {
            const total = totalTransactionsCount;
            const start = (page - 1) * 10 + 1;
            const end = Math.min(start + 9, total > 0 ? total : start + transactions.length - 1);
            info.textContent = `Showing ${start}-${end} of ${total} transactions`;
        }

    } catch (err) {
        console.error('Transactions error:', err);
    }
}

function initCharts() {
    // Only init charts if the canvas elements exist
    const ctxLine = document.getElementById('spendingChart');
    if (!ctxLine) return;

    // Common Chart Options for Light Theme
    Chart.defaults.color = '#6b7280'; // Gray 500
    Chart.defaults.borderColor = '#e5e7eb'; // Gray 200
    Chart.defaults.font.family = "'DM Sans', sans-serif";

    // 1. Line Chart: Spending Trend
    const ctxLineContext = ctxLine.getContext('2d');
    
    // Gradient Fill
    const gradientLine = ctxLineContext.createLinearGradient(0, 0, 0, 400);
    gradientLine.addColorStop(0, 'rgba(99, 102, 241, 0.2)'); // Indigo 500 low opacity
    gradientLine.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    window.spendingChart = new Chart(ctxLineContext, {
        type: 'bar', // Changed to Bar chart as per design request ("Three grouped bars per week" was requested, but let's stick to simple bar for trend if data structure allows, or keep line if simpler. User said "Bar chart card... Three grouped bars per week". But existing data is monthly trend. I'll stick to Line for now to preserve data mapping, or switch to Bar if simple.)
        // User explicitly asked: "Bar chart card... Three grouped bars per week". 
        // Existing data `dashboard/monthly-trend` returns `[{month: 'Jan', total_amount: 1000}, ...]`. It only has total amount.
        // I cannot create "Income/Expense/Savings" grouped bars without fetching that breakdown per month.
        // Existing API `/dashboard/monthly-trend` might only give total spent.
        // Constraint: "Keep all existing JavaScript logic". I can't write new complex data transformation logic if the API doesn't support it.
        // I will stick to a Line Chart or simple Bar Chart of "Total Spending" to be safe and accurate to the data I have. 
        // A simple Bar chart is closer to the visual request than a Line chart.
        type: 'bar', 
        data: {
            labels: [], 
            datasets: [{
                label: 'Total Spending',
                data: [], 
                backgroundColor: '#6366f1', // Indigo
                borderRadius: 4,
                barThickness: 40,
                hoverBackgroundColor: '#4f46e5'
            }]
        },
        options: {
            animation: {
                y: {
                    duration: 2000,
                    easing: 'easeOutQuart'
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#ffffff',
                    titleColor: '#111827',
                    bodyColor: '#6b7280',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return '₹' + context.parsed.y.toLocaleString('en-IN');
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f3f4f6', drawBorder: false },
                    ticks: {
                        color: '#9ca3af',
                        font: { size: 11 },
                        callback: function(value) { return '₹' + (value / 1000) + 'k'; }
                    },
                    border: { display: false }
                },
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: '#9ca3af', font: { size: 11 } },
                    border: { display: false }
                }
            }
        }
    });

    // 2. Donut Chart: Category Breakdown
    const ctxDonutEl = document.getElementById('categoryChart');
    if (ctxDonutEl) {
        const ctxDonut = ctxDonutEl.getContext('2d');
        window.categoryChart = new Chart(ctxDonut, {
            type: 'doughnut',
            width: 120,
            height: 120,
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#3b82f6','#ec4899','#64748b','#14b8a6','#f97316'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#ffffff',
                        bodyColor: '#111827',
                        borderColor: '#e5e7eb',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + '%';
                            }
                        }
                    }
                }
            }
        });
    }
}

async function loadSpendingAnalysis() {
    try {
        // 1. Fetch Data
        const summaryRes = await fetch('http://localhost:8000/api/dashboard/summary');
        const summary = await summaryRes.json();
        
        const catRes = await fetch('http://localhost:8000/api/dashboard/categories');
        const categories = await catRes.json();
        
        const txRes = await fetch('http://localhost:8000/api/transactions?limit=500');
        const txData = await txRes.json();
        const transactions = txData.transactions || txData || [];

        // 2. Update Stats
        // Total Spent
        const totalSpent = summary.total_spent || 0;
        // The stat card in Analysis section uses specific text content matching
        // We need to find the specific elements.
        // Looking at HTML (not provided but assumed structure based on "Find where these 3 values are hardcoded")
        // I will search for the specific values in HTML first to be sure or use a robust selector.
        // User prompt says: "Find where these 3 values are hardcoded... Replace with a function"
        // I'll assume I need to target them via selectors.
        // Let's look for the stat cards in the "analysis" section.
        
        // Since I can't see the HTML of analysis section in previous turn (it was truncated or I didn't read it fully),
        // I will assume standard structure or add IDs if needed.
        // Wait, I read index.html in previous turn?
        // Yes, let me check the `read` output from previous turn.
        // Lines 441-464 of index.html show the stats grid in #analysis.
        // They don't have IDs.
        // <div class="stat-value">₹42,850</div>
        // <div class="stat-value" data-stat="avg-daily">₹1,530</div>
        // <div class="stat-value">₹8,500</div>
        
        // I should add IDs or data-attributes to these elements in HTML first to be safe, 
        // or use complex selectors like `#analysis .stat-card:nth-child(1) .stat-value`.
        
        const analysisSection = document.getElementById('analysis');
        if (analysisSection) {
            const statValues = analysisSection.querySelectorAll('.stat-value');
            if (statValues.length >= 3) {
                // 1. Total Spent
                statValues[0].textContent = formatCurrency(totalSpent);
                
                // 2. Avg Daily
                const avgDaily = Math.round(totalSpent / 28);
                statValues[1].textContent = formatCurrency(avgDaily);
                
                // 3. Highest Single Day
                const dailyTotals = {};
                transactions.forEach(t => {
                    if (t.transaction_type === 'debit') {
                        const date = t.date; // assuming YYYY-MM-DD
                        dailyTotals[date] = (dailyTotals[date] || 0) + t.amount;
                    }
                });
                const highestDayAmount = Math.max(...Object.values(dailyTotals), 0);
                statValues[2].textContent = formatCurrency(highestDayAmount);
            }
        }

        // 3. Update Category Chart
        if (window.analysisCategoryChart) {
            window.analysisCategoryChart.data.labels = categories.map(c => c.category);
            window.analysisCategoryChart.data.datasets[0].data = categories.map(c => c.total_amount);
            window.analysisCategoryChart.update();
        }

        // 4. Update Top Merchants Table
        // Group by merchant, sum debits
        const merchantTotals = {};
        transactions.forEach(t => {
            if (t.transaction_type === 'debit' && t.merchant) {
                merchantTotals[t.merchant] = (merchantTotals[t.merchant] || 0) + t.amount;
            }
        });
        
        // Convert to array and sort
        const topMerchants = Object.entries(merchantTotals)
            .map(([merchant, amount]) => ({ merchant, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 6); // Top 6
            
        // Rebuild Table
        const merchantTableBody = document.querySelector('#analysis .simple-table tbody');
        if (merchantTableBody) {
            merchantTableBody.innerHTML = topMerchants.map(m => {
                const pct = totalSpent > 0 ? Math.round((m.amount / totalSpent) * 100) : 0;
                // Guess category for merchant (naive) or find from transactions
                // Let's find the first transaction for this merchant to get category
                const sampleTx = transactions.find(t => t.merchant === m.merchant);
                const category = sampleTx ? sampleTx.category : 'Others';
                
                // Badge class logic
                let badgeClass = 'badge-gray';
                const catLower = category.toLowerCase();
                if (catLower === 'food') badgeClass = 'badge-food';
                else if (catLower === 'transport') badgeClass = 'badge-transport';
                else if (catLower === 'shopping') badgeClass = 'badge-shopping';
                else if (catLower === 'housing') badgeClass = 'badge-housing';
                else if (catLower === 'health') badgeClass = 'badge-health';
                else if (catLower === 'entertainment') badgeClass = 'badge-entertainment';
                else if (catLower === 'utilities') badgeClass = 'badge-others';
                else if (catLower === 'investment') badgeClass = 'badge-investment';

                // Format row as requested in FIX 6
                return `
                    <tr>
                        <td>${m.merchant}</td>
                        <td><span class="badge ${badgeClass}">${category}</span></td>
                        <td style="font-weight:600;">${formatCurrency(m.amount)}</td>
                        <td>
                            <div style="display:flex;align-items:center;gap:8px;">
                                <div style="background:#f3f4f6;border-radius:99px;height:6px;width:80px;overflow:hidden;">
                                    <div style="background:#6366f1;height:100%;width:${pct}%;border-radius:99px;"></div>
                                </div>
                                <span style="font-size:12px;color:#6b7280;">${pct}%</span>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

    } catch (error) {
        console.error('Spending Analysis Load Error:', error);
    }
}

function initAnalysisCharts() {
    const ctxCatBar = document.getElementById('analysisCategoryChart');
    const ctxWeekly = document.getElementById('analysisWeeklyChart');

    if (!ctxCatBar || !ctxWeekly) return;

    // 1. Horizontal Bar Chart: Spending by Category
    window.analysisCategoryChart = new Chart(ctxCatBar.getContext('2d'), {
        type: 'bar',
        indexAxis: 'y',
        data: {
            labels: ['Food', 'Housing', 'Shopping', 'Transport', 'Investment', 'Utilities', 'Entertainment', 'Health'],
            datasets: [{
                data: [8540, 11200, 6540, 4680, 15000, 3420, 2800, 1240],
                backgroundColor: [
                    '#f87171', // Food
                    '#60a5fa', // Housing
                    '#a78bfa', // Shopping
                    '#fbbf24', // Transport
                    '#6366f1', // Investment
                    '#eab308', // Utilities
                    '#ec4899', // Entertainment
                    '#14b8a6'  // Health
                ],
                borderRadius: 4,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f8fafc',
                    bodyColor: '#94a3b8',
                    callbacks: {
                        label: function(context) {
                            return '₹' + context.parsed.x.toLocaleString('en-IN');
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { display: false }
                },
                y: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: '#94a3b8', font: { size: 11 } }
                }
            },
            animation: {
                onComplete: function() {
                    // Optional: Draw values at end of bars if needed custom, 
                    // but tooltip is usually enough for cleaner look.
                    // For this request "Show amount at end of each bar", we can try a plugin or just rely on tooltips/axis.
                    // Let's keep it clean with tooltips for now as drawing text on canvas manually is complex.
                }
            }
        },
        plugins: [{
            id: 'customLabels',
            afterDatasetsDraw: function(chart) {
                const ctx = chart.ctx;
                chart.data.datasets.forEach((dataset, i) => {
                    const meta = chart.getDatasetMeta(i);
                    meta.data.forEach((bar, index) => {
                        const value = dataset.data[index];
                        ctx.fillStyle = '#94a3b8';
                        ctx.font = '11px Inter';
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('₹' + value.toLocaleString('en-IN'), bar.x + 5, bar.y);
                    });
                });
            }
        }]
    });

    // 2. Weekly Breakdown Bar Chart
    new Chart(ctxWeekly.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                data: [12400, 8200, 15800, 6450],
                backgroundColor: '#6366f1', // Indigo
                borderRadius: 6,
                barPercentage: 0.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f8fafc',
                    bodyColor: '#94a3b8',
                    callbacks: {
                        label: function(context) {
                            return '₹' + context.parsed.y.toLocaleString('en-IN');
                        }
                    }
                }
            },
            scales: {
                y: {
                    display: false,
                    grid: { display: false }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        },
        plugins: [{
            id: 'topLabels',
            afterDatasetsDraw: function(chart) {
                const ctx = chart.ctx;
                chart.data.datasets.forEach((dataset, i) => {
                    const meta = chart.getDatasetMeta(i);
                    meta.data.forEach((bar, index) => {
                        const value = dataset.data[index];
                        ctx.fillStyle = '#94a3b8';
                        ctx.font = '11px Inter';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        ctx.fillText('₹' + value.toLocaleString('en-IN'), bar.x, bar.y - 5);
                    });
                });
            }
        }]
    });
}

function initDocumentsPage() {
    // 1. Document Type Selector Logic
    const docCards = document.querySelectorAll('.doc-card');
    docCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove active class from all
            docCards.forEach(c => c.classList.remove('active'));
            // Add active to clicked
            card.classList.add('active');
        });
    });

    // 2. File Upload Handling
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.getElementById('upload-area');
    
    // Drag & Drop visual feedback
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#6366f1';
            uploadArea.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = ''; // Reverts to CSS default
            uploadArea.style.backgroundColor = '';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload(files[0]);
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });
    }
}

async function loadDocuments() {
    const documents = await fetchAPI('/upload/documents');
    const tbody = document.getElementById('documents-table-body');
    
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!documents || documents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">No documents found</td></tr>';
        return;
    }

    documents.forEach(doc => {
        const tr = document.createElement('tr');
        
        // Status Badge Logic
        let statusBadge = `<span class="badge badge-others">${doc.status || 'Unknown'}</span>`;
        if (doc.status === 'processed' || doc.status === 'Done') {
            statusBadge = `<span class="badge badge-done"><i class="fa-solid fa-check"></i> Done</span>`;
        } else if (doc.status === 'processing') {
            statusBadge = `<span class="badge badge-processing"><i class="fa-solid fa-circle-notch fa-spin"></i> Processing</span>`;
        } else if (doc.status === 'failed') {
            statusBadge = `<span class="badge badge-failed"><i class="fa-solid fa-triangle-exclamation"></i> Failed</span>`;
        }

        tr.innerHTML = `
            <td>
                <div class="doc-name" style="display: flex; align-items: center; gap: 8px; font-weight: 500;">
                    <i class="fa-regular fa-file-pdf text-danger"></i>
                    <span style="color: #e2e8f0;">${doc.original_filename || doc.filename}</span>
                </div>
            </td>
            <td><span class="badge badge-others">${doc.document_type || 'General'}</span></td>
            <td style="color: #94a3b8; font-size: 0.9rem;">${formatDate(doc.upload_time)}</td>
            <td style="font-weight: 600; color: #e2e8f0;">${doc.transaction_count || 0}</td>
            <td>${statusBadge}</td>
            <td>
                <button onclick="deleteDocument(${doc.id})" style="border:none; background:none; cursor:pointer; color: #ef4444; font-size: 1rem; padding: 4px;">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function deleteDocument(docId) {
    if (confirm("Delete this document and all its transactions? This cannot be undone.")) {
        try {
            const response = await fetch(`http://localhost:8000/api/upload/documents/${docId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showToast("Document deleted");
                loadDocuments(); // Reload table
                loadDashboardData(); // Refresh stats
            } else {
                alert("Failed to delete document");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("Error deleting document");
        }
    }
}

async function handleFileUpload(file) {
    const uploadArea = document.getElementById('upload-area');
    const processingCard = document.getElementById('processing-card');
    const filenameDisplay = document.getElementById('processing-filename');
    const progressBar = document.getElementById('progress-bar');
    const successBanner = document.getElementById('success-banner');

    // 1. Hide upload, show processing
    uploadArea.classList.add('hidden');
    processingCard.classList.remove('hidden');
    
    // 2. Set Filename
    filenameDisplay.textContent = file.name;

    // 3. Reset Animation State
    progressBar.style.width = '0%';
    successBanner.classList.add('hidden');
    
    // Reset steps
    const steps = [1, 2, 3, 4, 5, 6];
    steps.forEach(id => {
        let stepEl = document.getElementById(`step-${id}`);
        // If step doesn't exist, create it (Problem 1: steps animation not showing)
        // Ensure steps HTML is present.
        // Actually, let's inject the steps HTML dynamically to be sure.
        // But for now, let's assume we need to populate them if missing or reset them.
    });
    
    // Re-render steps list to match requirements
    const stepsList = document.querySelector('.processing-steps');
    stepsList.innerHTML = `
        <li class="step" id="step-1" style="display:none;"><span class="step-icon"><i class="fa-solid fa-circle-notch fa-spin" style="color:#6366f1;"></i></span><span class="step-text">Uploading file...</span></li>
        <li class="step" id="step-2" style="display:none;"><span class="step-icon"><i class="fa-solid fa-circle-notch fa-spin" style="color:#6366f1;"></i></span><span class="step-text">Extracting text from document...</span></li>
        <li class="step" id="step-3" style="display:none;"><span class="step-icon"><i class="fa-solid fa-circle-notch fa-spin" style="color:#6366f1;"></i></span><span class="step-text">Sending to AI for analysis...</span></li>
        <li class="step" id="step-4" style="display:none;"><span class="step-icon"><i class="fa-solid fa-circle-notch fa-spin" style="color:#6366f1;"></i></span><span class="step-text">Structuring transactions...</span></li>
        <li class="step" id="step-5" style="display:none;"><span class="step-icon"><i class="fa-solid fa-circle-notch fa-spin" style="color:#6366f1;"></i></span><span class="step-text">Categorizing entries...</span></li>
        <li class="step" id="step-6" style="display:none;"><span class="step-icon"><i class="fa-solid fa-circle-notch fa-spin" style="color:#6366f1;"></i></span><span class="step-text">Detecting patterns...</span></li>
    `;

    // 4. Prepare Data
    const formData = new FormData();
    formData.append('file', file);
    
    // Get selected document type
    const activeCard = document.querySelector('.doc-card.active');
    const docType = activeCard ? activeCard.getAttribute('data-type') : 'General';
    formData.append('document_type', docType);

    // 5. Start Upload
    try {
        // Show first step
        const activateStep = (id) => {
            const el = document.getElementById(`step-${id}`);
            if (el) {
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.gap = '10px';
                el.style.padding = '6px 0';
                el.style.color = '#818cf8';
            }
        };

        const completeStep = (id) => {
            const el = document.getElementById(`step-${id}`);
            if (el) {
                el.style.color = '#10b981';
                const icon = el.querySelector('.step-icon');
                if (icon) icon.innerHTML = '<i class="fa-solid fa-check" style="color:#10b981;"></i>';
            }
        };

        activateStep(1);
        
        // Start Progress Bar Animation (Problem 3)
        let width = 0;
        const progressInterval = setInterval(() => {
            if (width >= 90) {
                clearInterval(progressInterval);
            } else {
                width += 5;
                progressBar.style.width = width + '%';
            }
        }, 1000);

        const response = await fetch('http://localhost:8000/api/upload/document', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            clearInterval(progressInterval);
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Upload initiated:', result);
        
        completeStep(1); // Upload done

        // Start Steps Animation (Problem 1)
        let currentStep = 2;
        const stepInterval = setInterval(() => {
            if (currentStep > 6) {
                clearInterval(stepInterval);
                return;
            }
            if (currentStep > 2) completeStep(currentStep - 1);
            activateStep(currentStep);
            currentStep++;
        }, 1800);

        // Check if we need to poll
        if (result.id && result.status !== 'done') {
            // Start Polling (Problem 2)
            pollDocumentStatus(result.id, progressBar, successBanner, progressInterval, stepInterval);
        } else {
            // Immediate Success
            finalizeUpload(progressBar, successBanner, progressInterval, stepInterval, result.transaction_count);
        }

    } catch (error) {
        console.error('Upload Error:', error);
        alert('Upload failed: ' + error.message);
        // Reset UI
        uploadArea.classList.remove('hidden');
        processingCard.classList.add('hidden');
    }
}

async function pollDocumentStatus(documentId, progressBar, successBanner, progressInterval, stepInterval, maxRetries = 20) {
    let retries = 0;
    
    const poll = async () => {
        if (retries >= maxRetries) {
            clearInterval(progressInterval);
            clearInterval(stepInterval);
            alert('Processing timed out. Please try again.');
            return;
        }
        
        try {
            const res = await fetch(`http://localhost:8000/api/upload/documents/${documentId}`);
            const doc = await res.json();
            
            console.log('Polling status:', doc.status);

            if (doc.status === 'done' || doc.status === 'processed') {
                // Success
                finalizeUpload(progressBar, successBanner, progressInterval, stepInterval, doc.transaction_count);
                return;
            }
            
            if (doc.status === 'failed') {
                clearInterval(progressInterval);
                clearInterval(stepInterval);
                alert('Processing failed. Please try again.');
                // Reset UI
                document.getElementById('processing-card').classList.add('hidden');
                document.getElementById('upload-area').classList.remove('hidden');
                return;
            }
            
            // Still processing — check again in 3 seconds
            retries++;
            setTimeout(poll, 3000);
            
        } catch (err) {
            console.error('Polling error:', err);
            retries++;
            setTimeout(poll, 3000);
        }
    };
    
    poll();
}

function finalizeUpload(progressBar, successBanner, progressInterval, stepInterval, txCount) {
    clearInterval(progressInterval);
    clearInterval(stepInterval);

    // Complete all steps visually
    for(let i=1; i<=6; i++) {
        const el = document.getElementById(`step-${i}`);
        if(el) {
            el.classList.remove('hidden', 'active');
            el.classList.add('completed');
            const icon = el.querySelector('.step-icon');
            if(icon) icon.innerHTML = '<i class="fa-solid fa-check" style="color: #10b981;"></i>';
        }
    }

    // Set progress bar to 100% immediately
    progressBar.style.width = '100%';

    // Show success banner
    successBanner.classList.remove('hidden');
    successBanner.innerHTML = `<i class="fa-solid fa-check-circle"></i>  ${txCount || 0} transactions extracted!`;
    
    setTimeout(() => {
        loadDocuments(); // Refresh the list
        refreshAllData(); // INSTANT UPDATE: Refresh all pages
    }, 1000);
}

// --- RECURRING PAGE LOGIC ---
let recurringItems = [];

async function loadRecurring() {
    try {
        // 1. Fetch Transactions (using limit 500)
        const txRes = await fetch('http://localhost:8000/api/transactions?limit=500');
        const txData = await txRes.json();
        const transactions = txData.transactions || txData || [];
        
        // 2. Filter for Recurring
        // In a real app, we'd have a specific API or a flag.
        // For now, we simulate finding recurring items from the transaction list
        // OR we use a local list if we added new ones via the UI (since backend might not persist "recurring" flag yet)
        
        // However, the prompt says: "Filter where is_recurring = true".
        // Let's assume the transaction object has this field.
        
        // Merge fetched recurring with locally added ones (for demo purposes if backend doesn't save them)
        // But the prompt implies fetching from backend.
        
        const fetchedRecurring = transactions.filter(t => t.is_recurring === true);
        
        // If we want to support the "Add New" feature persisting only in frontend session (since no backend endpoint for creating recurring items was mentioned),
        // we can merge with a global list.
        // Let's rely on the global `recurringItems` array which we will populate initially from backend,
        // but since we can't save back to backend (no POST endpoint provided in prompt), we'll keep them in memory.
        
        // Wait, if I reload, data is lost.
        // The prompt says "On Save: Just add the item to the displayed list". It doesn't explicitly say "save to backend".
        // So client-side list management is acceptable for this task.
        
        // To avoid duplicates on re-load, we should clear and rebuild, but we need to keep user-added ones.
        // Let's just use the `recurringItems` as the source of truth. 
        // If it's empty, we populate from backend.
        
        if (recurringItems.length === 0) {
            // Initial population from backend transactions
            // Group by merchant to avoid duplicates (showing same recurring txn multiple times)
            const seenMerchants = new Set();
            fetchedRecurring.forEach(t => {
                if (!seenMerchants.has(t.merchant)) {
                    seenMerchants.add(t.merchant);
                    recurringItems.push({
                        id: t.id,
                        merchant: t.merchant,
                        amount: Math.abs(t.amount),
                        category: t.category,
                        frequency: 'Monthly', // Default inferred
                        status: 'Active',
                        last_date: t.date
                    });
                }
            });
        }
        
        renderRecurringList();
        updateRecurringStats();
        
    } catch (error) {
        console.error('Load Recurring Error:', error);
    }
}

function renderRecurringList() {
    const container = document.getElementById('recurring-list-container');
    if (!container) return;
    container.innerHTML = '';
    
    if (recurringItems.length === 0) {
        container.innerHTML = '<div class="text-center p-4 text-muted">No recurring subscriptions found</div>';
        return;
    }
    
    recurringItems.forEach((item, index) => {
        let iconClass = 'fa-solid fa-receipt';
        let bgClass = 'category-others';
        const cat = (item.category || '').toLowerCase();
        
        // Simple icon mapping
        if (cat === 'entertainment') { iconClass = 'fa-brands fa-youtube'; bgClass = 'category-entertainment'; }
        else if (cat === 'utilities') { iconClass = 'fa-solid fa-bolt'; bgClass = 'category-utilities'; }
        else if (cat === 'housing') { iconClass = 'fa-solid fa-house'; bgClass = 'category-housing'; }
        else if (cat === 'investment') { iconClass = 'fa-solid fa-chart-line'; bgClass = 'category-investment'; }
        else if (cat === 'shopping') { iconClass = 'fa-solid fa-bag-shopping'; bgClass = 'category-shopping'; }
        else if (cat === 'food') { iconClass = 'fa-solid fa-utensils'; bgClass = 'category-food'; }
        else if (cat === 'transport') { iconClass = 'fa-solid fa-car'; bgClass = 'category-transport'; }
        else if (cat === 'health') { iconClass = 'fa-solid fa-heart-pulse'; bgClass = 'category-health'; }

        // Icon override for specific merchants
        const merch = item.merchant.toLowerCase();
        if (merch.includes('netflix')) iconClass = 'fa-brands fa-netflix';
        else if (merch.includes('spotify')) iconClass = 'fa-brands fa-spotify';
        else if (merch.includes('prime') || merch.includes('amazon')) iconClass = 'fa-brands fa-amazon';

        const div = document.createElement('div');
        div.className = 'recurring-item';
        div.innerHTML = `
            <div class="rec-icon-wrapper ${bgClass}">
                <i class="${iconClass}"></i>
            </div>
            <div class="rec-info">
                <h4>${item.merchant}</h4>
                <p>${item.category} • ${item.frequency}</p>
            </div>
            <div class="rec-details">
                <div class="rec-amount">${formatCurrency(item.amount)}</div>
                <div class="rec-date">Active</div>
            </div>
            <div class="rec-status">
                <span class="status-pill active">Active</span>
                <button class="btn-icon-danger ml-2" onclick="removeRecurringItem(${index})">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

function updateRecurringStats() {
    const totalMonthly = recurringItems.reduce((sum, item) => {
        // Normalize to monthly amount
        let amount = item.amount;
        if (item.frequency === 'Quarterly') amount = amount / 3;
        if (item.frequency === 'Yearly') amount = amount / 12;
        return sum + amount;
    }, 0);
    
    const count = recurringItems.length;
    const yearlyProj = totalMonthly * 12;
    
    const elTotal = document.getElementById('rec-total-monthly');
    const elCount = document.getElementById('rec-active-count');
    const elYearly = document.getElementById('rec-yearly-proj');
    
    if (elTotal) elTotal.textContent = formatCurrency(totalMonthly);
    if (elCount) elCount.textContent = count;
    if (elYearly) elYearly.textContent = formatCurrency(yearlyProj);
}

// Modal Functions
function openRecurringModal() {
    const modal = document.getElementById('add-recurring-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeRecurringModal() {
    const modal = document.getElementById('add-recurring-modal');
    if (modal) modal.classList.add('hidden');
    // Clear inputs
    document.getElementById('rec-input-merchant').value = '';
    document.getElementById('rec-input-amount').value = '';
}

function saveRecurringItem() {
    const merchant = document.getElementById('rec-input-merchant').value;
    const amount = parseFloat(document.getElementById('rec-input-amount').value);
    const category = document.getElementById('rec-input-category').value;
    const frequency = document.getElementById('rec-input-frequency').value;
    
    if (!merchant || isNaN(amount)) {
        alert("Please enter valid details");
        return;
    }
    
    recurringItems.push({
        merchant,
        amount,
        category,
        frequency,
        status: 'Active'
    });
    
    renderRecurringList();
    updateRecurringStats();
    closeRecurringModal();
    showToast("Subscription added");
}

function removeRecurringItem(index) {
    recurringItems.splice(index, 1);
    renderRecurringList();
    updateRecurringStats();
    showToast("Subscription removed");
}

// --- UPCOMING PAYMENTS LOGIC ---

async function loadUpcoming() {
    // Ensure recurring items are loaded
    if (recurringItems.length === 0) {
        await loadRecurring();
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate next due dates and status
    const upcomingItems = recurringItems.map(item => {
        const nextDue = calculateNextDueDate(item.last_date, item.frequency);
        const daysLeft = Math.ceil((nextDue - today) / (1000 * 60 * 60 * 24));
        
        let status = 'upcoming';
        if (daysLeft < 0) status = 'overdue';
        else if (daysLeft <= 7) status = 'due-soon';

        return {
            ...item,
            nextDue,
            daysLeft,
            status
        };
    });

    // Sort by due date (soonest first)
    upcomingItems.sort((a, b) => a.nextDue - b.nextDue);

    renderUpcomingList(upcomingItems);
    updateUpcomingStats(upcomingItems);
    updateUpcomingAlert(upcomingItems);
}

function calculateNextDueDate(lastDateStr, frequency) {
    if (!lastDateStr) return new Date(); // Default to today if missing
    
    const lastDate = new Date(lastDateStr);
    const nextDate = new Date(lastDate);

    if (frequency === 'Monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (frequency === 'Quarterly') {
        nextDate.setMonth(nextDate.getMonth() + 3);
    } else if (frequency === 'Yearly') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
    } else {
        nextDate.setMonth(nextDate.getMonth() + 1); // Default Monthly
    }

    return nextDate;
}

function renderUpcomingList(items) {
    const container = document.getElementById('upcoming-list-view');
    if (!container) return;
    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = '<div class="text-center p-4 text-muted">No upcoming payments found</div>';
        return;
    }

    items.forEach(item => {
        let statusClass = 'border-l-4 border-green-500'; // Default
        let statusBadge = '<span class="badge badge-success">Upcoming</span>';
        let dueText = `Due in ${item.daysLeft} days`;

        if (item.status === 'overdue') {
            statusClass = 'border-l-4 border-red-500';
            statusBadge = '<span class="badge badge-danger">Overdue</span>';
            dueText = `Overdue by ${Math.abs(item.daysLeft)} days`;
        } else if (item.status === 'due-soon') {
            statusClass = 'border-l-4 border-amber-500';
            statusBadge = '<span class="badge badge-warning">Due Soon</span>';
            if (item.daysLeft === 0) dueText = 'Due Today';
            else dueText = `Due in ${item.daysLeft} days`;
        }

        // Card Structure
        const card = document.createElement('div');
        card.className = `upcoming-card panel-card mb-3 p-4`;
        
        // Inline styles for border color since we don't have tailwind/custom classes confirmed
        const borderColor = item.status === 'overdue' ? '#ef4444' : 
                           item.status === 'due-soon' ? '#f59e0b' : '#10b981';
        
        card.style.borderLeft = `4px solid ${borderColor}`;
        card.style.display = 'flex';
        card.style.justifyContent = 'space-between';
        card.style.alignItems = 'center';
        card.style.marginBottom = '1rem';

        const dateStr = item.nextDue.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });

        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div class="rec-icon-wrapper ${getCategoryClass(item.category)}">
                    <i class="${getCategoryIcon(item.category)}"></i>
                </div>
                <div>
                    <h4 style="margin: 0; font-weight: bold;">${item.merchant}</h4>
                    <div style="font-size: 0.875rem; color: #94a3b8;">${item.category} • ${item.frequency}</div>
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: bold; font-size: 1.125rem;">${formatCurrency(item.amount)}</div>
                <div style="font-size: 0.875rem;" class="${getStatusColor(item.status)}">${dateStr}</div>
                <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem;">${dueText}</div>
            </div>
        `;

        container.appendChild(card);
    });
}

function getCategoryClass(category) {
    const cat = (category || '').toLowerCase();
    if (cat === 'food') return 'category-food';
    if (cat === 'transport') return 'category-transport';
    if (cat === 'shopping') return 'category-shopping';
    if (cat === 'housing') return 'category-housing';
    if (cat === 'entertainment') return 'category-entertainment';
    if (cat === 'utilities') return 'category-utilities';
    if (cat === 'investment') return 'category-investment';
    if (cat === 'health') return 'category-health';
    return 'category-others';
}

function getCategoryIcon(category) {
    const cat = (category || '').toLowerCase();
    if (cat === 'food') return 'fa-solid fa-utensils';
    if (cat === 'transport') return 'fa-solid fa-car';
    if (cat === 'shopping') return 'fa-solid fa-bag-shopping';
    if (cat === 'housing') return 'fa-solid fa-house';
    if (cat === 'entertainment') return 'fa-brands fa-youtube'; // Generic
    if (cat === 'utilities') return 'fa-solid fa-bolt';
    if (cat === 'investment') return 'fa-solid fa-chart-line';
    if (cat === 'health') return 'fa-solid fa-heart-pulse';
    return 'fa-solid fa-receipt';
}

function getStatusColor(status) {
    if (status === 'overdue') return 'text-danger';
    if (status === 'due-soon') return 'text-amber';
    return 'text-success';
}

function updateUpcomingStats(items) {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Calculate end of week (next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    // Calculate end of month
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    let dueWeek = 0;
    let dueMonth = 0;
    let overdue = 0;

    items.forEach(item => {
        // Reset time for comparison
        const d = new Date(item.nextDue);
        d.setHours(0,0,0,0);

        if (item.status === 'overdue') {
            overdue += item.amount;
        } else {
            // Only count future payments for "Due" stats
            if (d >= today && d <= nextWeek) {
                dueWeek += item.amount;
            }
            if (d >= today && d <= endOfMonth) {
                dueMonth += item.amount;
            }
        }
    });

    const elDueWeek = document.getElementById('up-due-week');
    const elDueMonth = document.getElementById('up-due-month');
    const elOverdue = document.getElementById('up-overdue');

    if (elDueWeek) elDueWeek.textContent = formatCurrency(dueWeek);
    if (elDueMonth) elDueMonth.textContent = formatCurrency(dueMonth);
    if (elOverdue) elOverdue.textContent = formatCurrency(overdue);
}

function updateUpcomingAlert(items) {
    const alertBanner = document.getElementById('upcoming-alert');
    if (!alertBanner) return;

    const overdueItems = items.filter(i => i.status === 'overdue');
    
    if (overdueItems.length > 0) {
        alertBanner.classList.remove('hidden');
        alertBanner.style.display = 'flex'; // Ensure visible
        
        const count = overdueItems.length;
        const total = overdueItems.reduce((sum, i) => sum + i.amount, 0);
        
        const content = alertBanner.querySelector('.alert-content span');
        if (content) {
            content.innerHTML = `<strong>${count} payment${count > 1 ? 's' : ''} overdue</strong> — Total ${formatCurrency(total)}`;
        }
        
        // Setup dismiss
        const dismissBtn = alertBanner.querySelector('.alert-dismiss');
        if(dismissBtn) {
            dismissBtn.onclick = () => {
                alertBanner.classList.add('hidden');
                alertBanner.style.display = 'none';
            };
        }
    } else {
        alertBanner.classList.add('hidden');
        alertBanner.style.display = 'none';
    }
}

// --- BUDGET PAGE LOGIC ---

const defaultBudgets = {
    'Others': 30000,
    'Transport': 5000,
    'Food': 6000,
    'Shopping': 5000,
    'Education': 3000,
    'Utilities': 3000,
    'Housing': 12000,
    'Health': 3000,
    'Entertainment': 3000,
    'Investment': 15000,
    'Income': 0
};

async function loadBudget() {
    try {
        // 1. Fetch Categories
        const catRes = await fetch('http://localhost:8000/api/dashboard/categories');
        const categories = await catRes.json();
        
        // 2. Get User Budgets from LocalStorage
        const savedBudgets = JSON.parse(localStorage.getItem('userBudgets')) || {};
        const budgets = { ...defaultBudgets, ...savedBudgets };

        // 3. Render Cards
        renderBudgetCards(categories, budgets);

        // 4. Update Summary
        updateBudgetSummary(categories, budgets);

    } catch (error) {
        console.error('Load Budget Error:', error);
    }
}

function renderBudgetCards(categories, budgets) {
    const grid = document.querySelector('.budget-grid');
    if (!grid) return;
    grid.innerHTML = '';

    categories.forEach(cat => {
        const categoryName = cat.category;
        const spent = cat.total_amount;
        const budget = budgets[categoryName] || 0; // Default to 0 if not found
        
        const percentage = budget > 0 ? (spent / budget) * 100 : (spent > 0 ? 100 : 0);
        
        let progressColor = 'bg-green';
        let statusText = `${formatCurrency(budget - spent)} remaining`;
        let statusClass = 'text-success';

        if (percentage >= 100) {
            progressColor = 'bg-red';
            statusText = `<i class="fa-solid fa-triangle-exclamation"></i> Over by ${formatCurrency(spent - budget)}`;
            statusClass = 'text-danger';
        } else if (percentage >= 80) {
            progressColor = 'bg-amber';
            statusClass = 'text-amber';
        }

        const card = document.createElement('div');
        card.className = 'budget-card';
        card.innerHTML = `
            <div class="budget-card-header">
                <div class="budget-cat-info">
                    <span class="cat-emoji">${getCategoryEmoji(categoryName)}</span>
                    <h4>${categoryName}</h4>
                </div>
                <i class="fa-solid fa-pencil edit-icon" onclick="openEditBudget('${categoryName}', ${budget})"></i>
            </div>
            <div class="budget-values">
                <span>Budget: ${formatCurrency(budget)}</span>
                <span>Spent: ${formatCurrency(spent)}</span>
            </div>
            <div class="budget-progress-container">
                <div class="budget-progress-bar ${progressColor}" style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
            <div class="budget-status ${statusClass}">
                ${statusText}
            </div>
        `;
        grid.appendChild(card);
    });
}

function getCategoryEmoji(category) {
    const map = {
        'Food': '🍔', 'Housing': '🏠', 'Transport': '🚗', 'Shopping': '🛍️',
        'Investment': '📈', 'Health': '💊', 'Entertainment': '🎬', 'Utilities': '💡',
        'Education': '🎓', 'Others': '📦', 'Income': '💰'
    };
    return map[category] || '📦';
}

function updateBudgetSummary(categories, budgets) {
    let totalBudgeted = 0;
    let totalSpent = 0;
    let onTrackCount = 0;
    let overBudgetCount = 0;
    let totalCount = 0;
    
    // Calculate totals based on all budgets (defaults + overrides)
    Object.values(budgets).forEach(b => totalBudgeted += b);

    // Calculate stats based on API categories
    categories.forEach(c => {
        totalSpent += c.total_amount;
        
        const budget = budgets[c.category] || 0;
        if (budget > 0) {
            const pct = (c.total_amount / budget) * 100;
            if (pct < 80) onTrackCount++;
            if (pct >= 100) overBudgetCount++;
        }
        totalCount++;
    });
    
    const healthScore = totalCount > 0 ? Math.round((onTrackCount / totalCount) * 100) : 100;
    const remaining = totalBudgeted - totalSpent;

    // Update Ring
    const circle = document.querySelector('.progress-ring__circle');
    if (circle) {
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (healthScore / 100) * circumference;
        
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = offset;
    }
    
    const ringValue = document.querySelector('.ring-value');
    if (ringValue) ringValue.textContent = `${healthScore}%`;

    // Update Mini Stats
    const miniStats = document.querySelectorAll('.mini-stat-value');
    if (miniStats.length >= 2) {
        miniStats[0].textContent = `${onTrackCount} categories`;
        miniStats[1].textContent = `${overBudgetCount} categories`;
    }

    // Update Total Bar
    const totalVals = document.querySelectorAll('.budget-total-bar .total-val');
    if (totalVals.length >= 3) {
        totalVals[0].textContent = formatCurrency(totalBudgeted);
        totalVals[1].textContent = formatCurrency(totalSpent);
        
        const remEl = totalVals[2];
        remEl.textContent = formatCurrency(remaining);
        if (remaining < 0) remEl.classList.add('text-danger');
        else remEl.classList.remove('text-danger');
    }

    // Update Total Progress Bar
    const totalProgress = document.querySelector('.total-progress-bar .total-fill');
    if (totalProgress) {
        const pct = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
        totalProgress.style.width = `${Math.min(pct, 100)}%`;
        if (pct > 100) totalProgress.style.backgroundColor = '#ef4444';
        else totalProgress.style.backgroundColor = '#6366f1';
    }
}

// Edit Budget Logic
function openEditBudget(category, currentAmount) {
    // Find the card header for this category
    const headers = document.querySelectorAll('.budget-card-header');
    let targetHeader = null;
    headers.forEach(h => {
        if (h.querySelector('h4').textContent === category) {
            targetHeader = h;
        }
    });

    if (!targetHeader) return;

    // Check if input already exists
    if (targetHeader.querySelector('.edit-budget-input')) return;

    const pencil = targetHeader.querySelector('.edit-icon');
    if(pencil) pencil.classList.add('hidden');

    // Create inline input container
    const container = document.createElement('div');
    container.className = 'edit-budget-container';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '8px';
    
    container.innerHTML = `
        <input type="number" class="edit-budget-input form-input" value="${currentAmount}" style="width: 80px; padding: 4px;">
        <button class="btn-icon-success" style="color: #10b981; background: none; border: none; cursor: pointer;"><i class="fa-solid fa-check"></i></button>
        <button class="btn-icon-danger" style="color: #ef4444; background: none; border: none; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
    `;

    targetHeader.appendChild(container);

    // Handlers
    const input = container.querySelector('input');
    const saveBtn = container.querySelector('.btn-icon-success');
    const cancelBtn = container.querySelector('.btn-icon-danger');

    const save = () => {
        const newAmount = parseFloat(input.value);
        if (!isNaN(newAmount) && newAmount >= 0) {
            saveBudget(category, newAmount);
        }
        cleanup();
    };

    const cleanup = () => {
        container.remove();
        if(pencil) pencil.classList.remove('hidden');
    };

    saveBtn.onclick = save;
    cancelBtn.onclick = cleanup;
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') save();
    });
}

function saveBudget(category, amount) {
    const savedBudgets = JSON.parse(localStorage.getItem('userBudgets')) || {};
    savedBudgets[category] = amount;
    localStorage.setItem('userBudgets', JSON.stringify(savedBudgets));
    
    // Reload to reflect changes
    loadBudget();
    showToast(`Budget for ${category} updated`);
}

// --- AI INSIGHTS LOGIC ---

function initAIInsights() {
    const runBtn = document.getElementById('btn-run-analysis');
    if (runBtn) {
        runBtn.addEventListener('click', handleRunAnalysis);
    }
}

async function loadAIInsights() {
    try {
        // 1. Load Insights
        const res = await fetchAPI('/insights');
        const data = res || { insights: [] }; 
        
        renderInsightCards(data.insights || []);
        
        // 2. Load Summary
        updateInsightsSummary();
        
    } catch (error) {
        console.error('Load AI Insights Error:', error);
        renderInsightCards([]);
    }
}

async function updateInsightsSummary() {
    try {
        const summary = await fetchAPI('/dashboard/summary');
        if (!summary) return;

        const container = document.querySelector('.ai-summary-body p');
        if (container) {
            container.innerHTML = `
                This month you spent <strong>${formatCurrency(summary.total_spent)}</strong> across 
                <strong>${summary.transaction_count} transactions</strong> with a savings rate of 
                <strong>${summary.savings_rate.toFixed(1)}%</strong>
            `;
        }
        
        // Update timestamp footer
        const footer = document.querySelector('.ai-summary-footer');
        if (footer) {
            const now = new Date();
            footer.textContent = `Generated by Gemini AI · ${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
        }

    } catch (error) {
        console.error('Update Insights Summary Error:', error);
    }
}

function renderInsightCards(insights) {
    const container = document.getElementById('insights-grid-container');
    if (!container) return;
    
    container.innerHTML = '';

    if (!insights || insights.length === 0) {
        container.innerHTML = `
            <div class="text-center p-4 text-muted" style="grid-column: 1/-1;">
                <i class="fa-solid fa-lightbulb fa-2x mb-3" style="color: #cbd5e1;"></i>
                <p>No insights yet. Click "Run Full Analysis" to generate insights from your transactions.</p>
            </div>
        `;
        return;
    }

    insights.forEach(insight => {
        const type = (insight.insight_type || 'PATTERN').toUpperCase();
        let badgeColor = 'blue';
        let badgeText = type.replace('_', ' ');
        
        if (type === 'OVERSPENDING') badgeColor = 'red';
        else if (type === 'HIDDEN_COST') badgeColor = 'purple';
        else if (type === 'OPPORTUNITY') badgeColor = 'green';
        else if (type === 'RISK') badgeColor = 'amber';
        else if (type === 'POSITIVE') badgeColor = 'teal';

        // Map colors manually 
        const colors = {
            'red': '#ef4444',
            'purple': '#a855f7',
            'blue': '#3b82f6',
            'green': '#10b981',
            'amber': '#f59e0b',
            'teal': '#14b8a6'
        };
        const colorHex = colors[badgeColor] || colors['blue'];

        const card = document.createElement('div');
        card.className = 'insight-card';
        card.style.borderLeft = `4px solid ${colorHex}`;
        card.style.marginBottom = '1rem';

        card.innerHTML = `
            <div class="card-header" style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                <div class="insight-badge" style="background-color: ${colorHex}20; color: ${colorHex}; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                    ${badgeText}
                </div>
                <span class="text-muted text-xs" style="color: #64748b; font-size: 0.75rem;">${formatDate(insight.generated_at)}</span>
            </div>
            <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; color: #f8fafc;">${insight.headline}</h3>
            <p class="insight-text" style="color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin-bottom: 1rem;">
                ${insight.body_text}
            </p>
            <div class="insight-actions" style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.75rem;">
                <span class="text-sm" style="color: ${colorHex}; font-size: 0.875rem; cursor: pointer;">
                    <i class="fa-solid fa-arrow-right"></i> ${insight.action_text || 'View Details'}
                </span>
            </div>
        `;
        
        container.appendChild(card);
    });
}

async function handleRunAnalysis() {
    const btn = document.getElementById('btn-run-analysis');
    const originalText = btn.innerHTML;
    
    // 1. Loading State
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Analyzing...';
    
    try {
        // 2. Call Generate API
        const response = await fetchAPI('/insights/generate', {
            method: 'POST'
        });
        
        if (response) {
            // 3. Success
            showToast('Analysis complete!', 'success');
            await loadAIInsights(); // Refresh data
        } else {
            throw new Error('Analysis failed');
        }
        
    } catch (error) {
        console.error('Analysis Error:', error);
        showToast('Analysis failed, try again', 'error');
    } finally {
        // 4. Reset Button
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// --- RISK SCORE LOGIC ---

function initRiskScore() {
    // Initialize empty chart
    const ctx = document.getElementById('riskHistoryChart');
    if (ctx) {
        window.riskHistoryChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Risk Score',
                    data: [],
                    borderColor: '#6366f1',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(99, 102, 241, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
}

async function loadRiskScore() {
    try {
        // 1. Fetch Data
        const [summary, txData] = await Promise.all([
            fetchAPI('/dashboard/summary'),
            fetchAPI('/transactions?limit=500')
        ]);
        
        const transactions = txData.transactions || txData || [];
        
        // Calculate Income
        // If API doesn't return income, derive it: Income = Spent / (1 - SavingsRate)
        let income = summary.total_income;
        if (!income || income === 0) {
            const savingsRate = summary.savings_rate / 100;
            if (savingsRate < 1) {
                income = summary.total_spent / (1 - savingsRate);
            } else {
                income = summary.total_spent; // Fallback
            }
        }
        
        // 2. Calculate Factors
        const factors = calculateRiskFactors(summary, transactions, income);
        
        // 3. Calculate Final Score
        const finalScore = Math.round(
            (factors.debt.score + factors.payment.score + factors.savings.score + factors.volatility.score + factors.investment.score) / 5
        );
        
        // 4. Update UI
        renderRiskScore(finalScore);
        renderRiskFactors(factors);
        renderImprovementRoadmap(factors);
        updateRiskHistory(finalScore);
        
    } catch (error) {
        console.error('Load Risk Score Error:', error);
    }
}

function calculateRiskFactors(summary, transactions, income) {
    // FACTOR 1: Debt to Income (Housing)
    const housingTx = transactions.filter(t => (t.category || '').toLowerCase() === 'housing');
    const housingTotal = housingTx.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const debtRatio = income > 0 ? (housingTotal / income) * 100 : 0;
    
    let debtScore = 80;
    let debtColor = 'green';
    if (debtRatio > 40) { debtScore = 30; debtColor = 'red'; }
    else if (debtRatio > 30) { debtScore = 55; debtColor = 'amber'; }
    
    // FACTOR 2: Payment Consistency (Recurring Count)
    // Assume we can identify recurring by 'is_recurring' or just use 'Subscriptions' logic if available.
    // For now, let's use the 'recurringItems' array if populated, or filter transactions.
    // Since 'recurringItems' might be empty if we haven't visited that page, let's re-filter.
    // Assuming 'is_recurring' flag exists in transaction object as per previous tasks.
    const recurringCount = transactions.filter(t => t.is_recurring).length;
    // Note: If 'is_recurring' isn't on the transaction object from this endpoint, 
    // we might need to rely on the logic used in 'loadRecurring' (unique merchants).
    // Let's use unique merchants of recurring transactions to be safe.
    const uniqueRecurring = new Set(transactions.filter(t => t.is_recurring).map(t => t.merchant)).size;
    
    let payScore = 90; 
    let payColor = 'green';
    if (uniqueRecurring === 0) { payScore = 40; payColor = 'red'; }
    else if (uniqueRecurring <= 3) { payScore = 60; payColor = 'amber'; }

    // FACTOR 3: Savings Rate
    const savingsRate = summary.savings_rate;
    let saveScore = 85;
    let saveColor = 'green';
    if (savingsRate < 0) { saveScore = 20; saveColor = 'red'; }
    else if (savingsRate <= 20) { saveScore = 50; saveColor = 'amber'; }

    // FACTOR 4: Spending Volatility
    // Group by week
    const weeklySpends = {};
    transactions.forEach(t => {
        if (t.transaction_type === 'debit') {
            const date = new Date(t.date);
            // Simple week number: (Day of month - 1) / 7
            // Or ISO week. Let's use simple 4-week buckets for the month.
            const bucket = Math.floor((date.getDate() - 1) / 7); 
            weeklySpends[bucket] = (weeklySpends[bucket] || 0) + Math.abs(t.amount);
        }
    });
    const weeks = Object.values(weeklySpends);
    let volatilityScore = 80;
    let volatilityColor = 'green';
    let variance = 0;
    
    if (weeks.length > 0) {
        const max = Math.max(...weeks);
        const min = Math.min(...weeks);
        const avg = weeks.reduce((a,b)=>a+b,0) / weeks.length;
        variance = avg > 0 ? ((max - min) / avg) * 100 : 0;
        
        if (variance > 100) { volatilityScore = 30; volatilityColor = 'red'; }
        else if (variance > 50) { volatilityScore = 55; volatilityColor = 'amber'; }
    }

    // FACTOR 5: Investment Discipline
    const investTx = transactions.filter(t => (t.category || '').toLowerCase() === 'investment');
    const investTotal = investTx.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const investRate = income > 0 ? (investTotal / income) * 100 : 0;
    
    let investScore = 90;
    let investColor = 'green';
    if (investRate < 5) { investScore = 30; investColor = 'red'; }
    else if (investRate < 15) { investScore = 60; investColor = 'amber'; }

    return {
        debt: { score: debtScore, color: debtColor, val: debtRatio, label: 'Debt-to-Income', desc: `Housing uses ${debtRatio.toFixed(1)}% of income`, impact: 'High' },
        payment: { score: payScore, color: payColor, val: uniqueRecurring, label: 'Payment Consistency', desc: `${uniqueRecurring} recurring payments tracked`, impact: 'High' },
        savings: { score: saveScore, color: saveColor, val: savingsRate, label: 'Savings Rate', desc: `Saving ${savingsRate.toFixed(1)}% of income`, impact: 'High' },
        volatility: { score: volatilityScore, color: volatilityColor, val: variance, label: 'Spending Volatility', desc: `Weekly variance is ${variance.toFixed(0)}%`, impact: 'Medium' },
        investment: { score: investScore, color: investColor, val: investRate, label: 'Investment Discipline', desc: `Investing ${investRate.toFixed(1)}% of income`, impact: 'Medium' }
    };
}

function renderRiskScore(score) {
    // 1. Gauge Needle
    const needle = document.querySelector('.risk-needle'); 
    if (needle) { 
      const angle = (score / 100) * 180 - 90; 
      const rad = angle * Math.PI / 180; 
      const x2 = (100 + 72 * Math.cos(rad)).toFixed(1); 
      const y2 = (100 + 72 * Math.sin(rad)).toFixed(1); 
      needle.setAttribute('x2', x2); 
      needle.setAttribute('y2', y2); 
    } 
    const scoreBig = document.querySelector('.score-big'); 
    if (scoreBig) scoreBig.textContent = score;
    
    // 3. Risk Label & Color
    const label = document.querySelector('.score-label');
    let riskText = 'LOW RISK';
    let riskClass = 'text-success';
    let riskPills = document.querySelectorAll('.risk-pill');
    
    // Reset pills
    riskPills.forEach(p => p.classList.remove('active'));

    if (score <= 40) {
        riskText = 'HIGH RISK';
        riskClass = 'text-danger';
        if(riskPills[0]) riskPills[0].classList.add('active');
    } else if (score <= 70) {
        riskText = 'MODERATE RISK';
        riskClass = 'text-amber';
        if(riskPills[1]) riskPills[1].classList.add('active');
    } else {
        if(riskPills[2]) riskPills[2].classList.add('active');
    }

    if (label) {
        label.textContent = riskText;
        label.className = `score-label ${riskClass}`;
    }
    
    // 4. Summary Text
    const summaryText = document.querySelector('.risk-summary');
    if (summaryText) {
        summaryText.innerHTML = `Your financial health score is <strong>${score}/100</strong> based on 5 key factors.`;
    }
}

function renderRiskFactors(factors) {
    const list = document.querySelector('.breakdown-list');
    if (!list) return;
    list.innerHTML = '';

    Object.values(factors).forEach(f => {
        // Map color names to classes
        const bgClass = f.color === 'red' ? 'bg-red' : (f.color === 'amber' ? 'bg-amber' : 'bg-green');
        const textClass = f.color === 'red' ? 'text-danger' : (f.color === 'amber' ? 'text-amber' : 'text-success');
        const iconWrapper = f.color; // 'red', 'amber', 'green' classes exist in CSS
        
        // Icon mapping
        let icon = 'fa-chart-simple';
        if (f.label.includes('Debt')) icon = 'fa-building-columns';
        if (f.label.includes('Payment')) icon = 'fa-check-double';
        if (f.label.includes('Savings')) icon = 'fa-piggy-bank';
        if (f.label.includes('Volatility')) icon = 'fa-chart-column';
        if (f.label.includes('Investment')) icon = 'fa-arrow-trend-up';

        // Points (diff from 100 or raw score?)
        // User prompt says "Points value". Let's just show the Score.
        const pointsSign = f.score >= 80 ? '+' : '';
        
        const row = document.createElement('div');
        row.className = 'factor-row';
        row.innerHTML = `
            <div class="factor-icon-wrapper ${iconWrapper}">
                <i class="fa-solid ${icon}"></i>
            </div>
            <div class="factor-content">
                <div class="factor-header">
                    <h4>${f.label}</h4>
                    <span class="impact-badge badge-${f.impact === 'High' ? 'high' : 'medium'}">${f.impact} Impact</span>
                </div>
                <p class="factor-desc">${f.desc}</p>
                <div class="factor-bar-container">
                    <div class="factor-bar ${bgClass}" style="width: ${f.score}%"></div>
                </div>
            </div>
            <div class="factor-points ${textClass}">${pointsSign}${f.score} pts</div>
        `;
        list.appendChild(row);
    });
}

function renderImprovementRoadmap(factors) {
    const grid = document.querySelector('.roadmap-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Sort factors by score ascending (lowest first)
    const sorted = Object.entries(factors)
        .sort(([,a], [,b]) => a.score - b.score)
        .slice(0, 3);

    sorted.forEach(([key, f]) => {
        let advice = [];
        if (key === 'debt') {
            advice = ['Consider refinancing high-interest loans', 'Avoid new EMIs for 6 months', 'Use bonuses to prepay principal'];
        } else if (key === 'payment') {
            advice = ['Automate bill payments', 'Set calendar reminders', 'Consolidate subscriptions'];
        } else if (key === 'savings') {
            advice = ['Review discretionary spending', 'Set a weekly savings goal', 'Use the 50/30/20 rule'];
        } else if (key === 'volatility') {
            advice = ['Set weekly spending caps', 'Plan big expenses in advance', 'Track daily spending'];
        } else if (key === 'investment') {
            advice = ['Start a small SIP', 'Increase contributions by 5%', 'Review asset allocation'];
        }

        const card = document.createElement('div');
        card.className = 'action-card';
        card.innerHTML = `
            <div class="action-impact-badge">+${100 - f.score} potential</div>
            <div class="action-icon">💡</div>
            <h4>Improve ${f.label}</h4>
            <ul class="action-steps">
                ${advice.map(a => `<li>${a}</li>`).join('')}
            </ul>
        `;
        grid.appendChild(card);
    });
}

function updateRiskHistory(currentScore) {
    if (window.riskHistoryChart) {
        const now = new Date();
        const label = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        // Since we only have current data, we just show one point
        // Or we can simulate a small history if we had trend data.
        // Prompt says: "Show a single point on the chart for current month"
        
        window.riskHistoryChart.data.labels = [label];
        window.riskHistoryChart.data.datasets[0].data = [currentScore];
        window.riskHistoryChart.update();
        
        // Update text
        const note = document.querySelector('.history-note');
        if (note) note.innerHTML = `Current Score: <strong>${currentScore}</strong>`;
    }
}
