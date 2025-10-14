document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('framecode_token') || sessionStorage.getItem('framecode_token');
    
    function parseJwt(token) {
        try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
    }

    if (!token) {
        alert('Acesso negado.');
        window.location.href = 'login.html';
        return;
    }

    const decodedToken = parseJwt(token);
    if (!decodedToken || decodedToken.user.role !== 'admin') {
        alert('Acesso negado. Esta página é apenas para administradores.');
        window.location.href = 'index.html';
        return;
    }

    const headers = { 'x-auth-token': token };

    let currentUserPage = 1;
    let currentReviewPage = 1;
    let userSearchTerm = '';
    let reviewSearchTerm = '';

    const totalUsersStat = document.getElementById('totalUsersStat');
    const totalReviewsStat = document.getElementById('totalReviewsStat');
    const usersTableBody = document.getElementById('usersTableBody');
    const reviewsList = document.getElementById('reviewsList');
    const userSearchForm = document.getElementById('userSearchForm');
    const userSearchInput = document.getElementById('userSearchInput');
    const reviewSearchForm = document.getElementById('reviewSearchForm');
    const reviewSearchInput = document.getElementById('reviewSearchInput');

    async function fetchUsers(page = 1, search = '') {
        try {
            const response = await fetch(`https://framecode-backend.onrender.com/api/users?page=${page}&limit=10&search=${search}`, { headers });
            const data = await response.json();

            totalUsersStat.textContent = data.total;
            
            usersTableBody.innerHTML = '';
            data.users.forEach(user => {
                const row = usersTableBody.insertRow();
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td>${new Date(user.created_at).toLocaleDateString()}</td>
                `;
            });
            
            updatePagination('users', data.currentPage, data.totalPages);
        } catch (error) { console.error('Erro ao buscar utilizadores:', error); }
    }

    async function fetchAllReviews(page = 1, search = '') {
        try {
            const response = await fetch(`https://framecode-backend.onrender.com/api/reviews/all/reviews?page=${page}&limit=10&search=${search}`, { headers });
            const data = await response.json();

            totalReviewsStat.textContent = data.total;

            reviewsList.innerHTML = '';
            data.reviews.forEach(review => {
                const item = document.createElement('li');
                item.className = 'admin-review-item';
                item.id = `review-item-${review.id}`;
                item.innerHTML = `
                    <header>
                        <div>
                            <strong>${review.movie_title}</strong> por <em>${review.userName}</em>
                        </div>
                        <button class="delete-review-btn" data-id="${review.id}">Excluir</button>
                    </header>
                    <p>"${review.comment}"</p>
                    <div class="meta">Nota: ${review.rating}/5 - ${new Date(review.created_at).toLocaleString()}</div>
                `;
                reviewsList.appendChild(item);
            });

            updatePagination('reviews', data.currentPage, data.totalPages);
        } catch (error) { console.error('Erro ao buscar avaliações:', error); }
    }

    function updatePagination(type, currentPage, totalPages) {
        const paginationContainer = document.getElementById(`${type}Pagination`);
        if (!paginationContainer) return;
        paginationContainer.innerHTML = `
            <button id="${type}PrevBtn" ${currentPage <= 1 ? 'disabled' : ''}>Anterior</button>
            <span>Página ${currentPage} de ${totalPages}</span>
            <button id="${type}NextBtn" ${currentPage >= totalPages ? 'disabled' : ''}>Próxima</button>
        `;

        document.getElementById(`${type}PrevBtn`)?.addEventListener('click', () => {
            if (type === 'users') {
                currentUserPage--;
                fetchUsers(currentUserPage, userSearchTerm);
            } else {
                currentReviewPage--;
                fetchAllReviews(currentReviewPage, reviewSearchTerm);
            }
        });
        document.getElementById(`${type}NextBtn`)?.addEventListener('click', () => {
            if (type === 'users') {
                currentUserPage++;
                fetchUsers(currentUserPage, userSearchTerm);
            } else {
                currentReviewPage++;
                fetchAllReviews(currentReviewPage, reviewSearchTerm);
            }
        });
    }
    
    userSearchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        currentUserPage = 1;
        userSearchTerm = userSearchInput.value;
        fetchUsers(currentUserPage, userSearchTerm);
    });

    reviewSearchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        currentReviewPage = 1;
        reviewSearchTerm = reviewSearchInput.value;
        fetchAllReviews(currentReviewPage, reviewSearchTerm);
    });

    reviewsList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-review-btn')) {
            const reviewId = e.target.dataset.id;
            if (confirm(`ADMIN: Tem certeza que deseja excluir a avaliação #${reviewId}?`)) {
                try {
                    const response = await fetch(`https://framecode-backend.onrender.com/api/reviews/${reviewId}`, {
                        method: 'DELETE',
                        headers: headers
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message || 'Falha ao apagar a avaliação.');
                    
                    alert('Avaliação excluída com sucesso!');
                    fetchAllReviews(currentReviewPage, reviewSearchTerm); 
                } catch (error) {
                    alert(error.message);
                }
            }
        }
    });

    fetchUsers();
    fetchAllReviews();
});