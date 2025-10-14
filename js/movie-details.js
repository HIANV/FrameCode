const apiKey    = "3b08d5dfa29024b5dcb74e8bff23f984";
const apiBase   = "https://api.themoviedb.org/3";
const imageBase = "https://image.tmdb.org/t/p/w500";

// DOM
const detailsContainer = document.querySelector('.container');
const movieTitle       = document.getElementById("movieTitle");
const movieOverview    = document.getElementById("movieOverview");
const movieReleaseDate = document.getElementById("movieReleaseDate");
const movieGenres      = document.getElementById("movieGenres");
const movieCast        = document.getElementById("movieCast");
const moviePoster      = document.querySelector(".movie-poster");
const reviewForm       = document.getElementById('reviewForm');
const reviewsList      = document.getElementById('reviewsList');
const avgRatingEl      = document.getElementById('avgRating');
const reviewSectionTitle = document.querySelector('.review-section h2');
const starRatingContainer = document.querySelector('.new-star-rating');
const ratingValueInput = document.getElementById('ratingValue');
const favoriteBtn = document.getElementById('favoriteBtn');

const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');

const searchResultsSection = document.getElementById('searchResultsSection');
const searchResultsGrid = document.getElementById('searchResultsGrid');
const searchResultsTitle = document.getElementById('searchResultsTitle');

const usersGridSection = document.getElementById('usersGridSection');
const usersTitle = document.getElementById("usersTitle");
const usersGrid = document.getElementById("usersGrid");

const reviewsPagination = document.getElementById('reviewsPagination');
const reviewsPrevBtn = document.getElementById('reviewsPrevBtn');
const reviewsNextBtn = document.getElementById('reviewsNextBtn');
const reviewsPageInfo = document.getElementById('reviewsPageInfo');

let currentMovieData = null;
let reviewsCurrentPage = 1;
const reviewsPerPage = 10; 

// funções auxiliares e de criação de cards

function createMovieCard(movie) {
  const card = document.createElement("div");
  card.classList.add("movie-card");
  const title = movie.title || movie.name || "Título Desconhecido";
  const posterPath = movie.poster_path ? `${imageBase}${movie.poster_path}` : "https://via.placeholder.com/500x750?text=Sem+Imagem";

  card.innerHTML = `
    <a href="movie.html?id=${movie.id}">
      <img src="${posterPath}" alt="${title}">
    </a>
    <h3>${title}</h3>
  `;
  return card;
}

function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'user-card';
    const avatarSrc = user.avatar_url ? `https://framecode-backend.onrender.com${user.avatar_url}` : 'assets/user icon.png';

    card.innerHTML = `
        <a href="profile.html?id=${user.id}">
            <img src="${avatarSrc}" alt="Avatar de ${user.name}">
            <h3>${user.name}</h3>
        </a>
    `;
    return card;
}

function generateStarsHTML(rating) {
    let starsHTML = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    for (let i = 0; i < fullStars; i++) { starsHTML += `<img src="assets/star.png" alt="Estrela cheia">`; }
    if (hasHalfStar) { starsHTML += `<img src="assets/half-star.png" alt="Meia estrela">`; }
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) { starsHTML += `<img src="assets/empty-star.png" alt="Estrela vazia">`; }
    return starsHTML;
}

function parseJwt(token) {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

// lógica principal da página
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const movieId   = urlParams.get("id");
    const token = localStorage.getItem('framecode_token') || sessionStorage.getItem('framecode_token');
    let loggedInUser = null;

    if (token) {
        const decodedToken = parseJwt(token);
        if (decodedToken && decodedToken.user) {
            loggedInUser = decodedToken.user;
        }
    }

    if (!movieId) {
        movieTitle.textContent = "Filme não encontrado";
        return;
    }

    async function loadMovieDetails(id) {
        const url = `${apiBase}/movie/${id}?api_key=${apiKey}&language=pt-BR`;
        try {
            const resp = await fetch(url);
            const data = await resp.json();
            currentMovieData = data;
            movieTitle.textContent       = data.title || data.name;
            movieOverview.textContent    = data.overview || "Sem sinopse disponível.";
            movieReleaseDate.textContent = data.release_date || "Data não disponível.";
            movieGenres.textContent      = data.genres.map(g => g.name).join(", ") || "Gêneros não informados.";
            moviePoster.src              = data.poster_path ? `${imageBase}${data.poster_path}` : "https://via.placeholder.com/500x750?text=Sem+Imagem";
            moviePoster.alt              = data.title || "Sem título";
        } catch (err) {
            movieTitle.textContent    = "Erro ao carregar detalhes.";
        }
    }

    async function loadMovieCredits(id) {
        const url = `${apiBase}/movie/${id}/credits?api_key=${apiKey}&language=pt-BR`;
        try {
            const resp = await fetch(url);
            const data = await resp.json();
            const topCast = data.cast.slice(0, 5).map(a => a.name);
            movieCast.textContent = topCast.join(", ") || "Elenco não disponível.";
        } catch {
            movieCast.textContent = "Erro ao carregar elenco.";
        }
    }

    function setupStarRating() {
        if (!starRatingContainer) return;
        starRatingContainer.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const starImg = document.createElement('img');
            starImg.src = 'assets/empty-star.png';
            starImg.dataset.value = i;
            starRatingContainer.appendChild(starImg);
        }
        const stars = Array.from(starRatingContainer.children);
        const updateStars = (rating) => {
            stars.forEach((star, index) => {
                const starValue = index + 1;
                if (rating >= starValue) star.src = 'assets/star.png';
                else if (rating >= starValue - 0.5) star.src = 'assets/half-star.png';
                else star.src = 'assets/empty-star.png';
            });
        };
        stars.forEach((star, index) => {
            star.addEventListener('mousemove', (e) => {
                const rect = star.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const isHalf = mouseX < rect.width / 2;
                updateStars(index + (isHalf ? 0.5 : 1));
            });
            star.addEventListener('click', (e) => {
                const rect = star.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const isHalf = mouseX < rect.width / 2;
                ratingValueInput.value = index + (isHalf ? 0.5 : 1);
                updateStars(parseFloat(ratingValueInput.value));
            });
        });
        starRatingContainer.addEventListener('mouseleave', () => updateStars(parseFloat(ratingValueInput.value) || 0));
        updateStars(parseFloat(ratingValueInput.value) || 0);
    }


async function renderReviews(page = 1) {
    reviewsCurrentPage = page;
    reviewsList.innerHTML = "<li>Carregando avaliações...</li>";
    
    const token = localStorage.getItem('framecode_token') || sessionStorage.getItem('framecode_token');
    const headers = {};
    if (token) {
        headers['x-auth-token'] = token;
    }

    try {
        const response = await fetch(`https://framecode-backend.onrender.com/api/reviews/${movieId}?page=${page}&limit=${reviewsPerPage}`, { headers });
        
        const data = await response.json();
        if (!response.ok) throw new Error('Não foi possível carregar as avaliações.');
        
        const reviewsForThisMovie = data.reviews;
        reviewsList.innerHTML = "";
        let sumOfRatings = 0;
        let userHasAlreadyReviewed = false;

        if (reviewsForThisMovie.length === 0) {
            reviewsList.innerHTML = "<h4 id='no-reviews-h4'>Nenhuma avaliação ainda. Seja o primeiro!</h4>";
            reviewsPagination.style.display = 'none'; 
        } else {
            reviewsPagination.style.display = 'flex'; 
        }

        reviewsForThisMovie.forEach(review => {
            sumOfRatings += parseFloat(review.rating);
            const avatarSrc = review.avatar_url ? `https://framecode-backend.onrender.com${review.avatar_url}` : 'assets/user icon.png';
            
            if (loggedInUser && loggedInUser.id == review.user_id) {
                userHasAlreadyReviewed = true;
            }

            const li = document.createElement('li');
            li.className = "review-item";
            li.id = `review-${review.id}`;
            let buttons = '';

            if (loggedInUser) {
                if (loggedInUser.id == review.user_id) {
                    buttons = `<button class="edit-review-btn" data-review-id="${review.id}" data-comment="${review.comment.replace(/"/g, '&quot;')}" data-rating="${review.rating}"><img src="assets/edit.png"> Editar</button>
                               <button class="delete-review-btn" data-review-id="${review.id}"><img src="assets/delete.png"> Excluir</button>`;
                } else if (loggedInUser.role === 'admin') {
                    buttons = `<button class="delete-review-btn admin-delete" data-review-id="${review.id}"><img src="assets/delete.png"> Excluir (Admin)</button>`;
                }
            }

            let profileLinkHTML = '';
            if (loggedInUser && loggedInUser.id == review.user_id) {
                profileLinkHTML = `<strong><a href="profile.html" class="profile-link">${review.userName || 'Anônimo'}</a></strong>`;
            } else {
                profileLinkHTML = `<strong><a href="profile.html?id=${review.user_id}" class="profile-link">${review.userName || 'Anônimo'}</a></strong>`;
            }

            const likeBtnClass = review.user_has_liked ? 'like-btn liked' : 'like-btn';
            const likeBtnDisabled = !loggedInUser ? 'disabled' : '';

            li.innerHTML = `
                                <header class="review-item-header">
                                    <div class="review-author-container">
                                        <img src="${avatarSrc}" alt="Avatar de ${review.userName}" class="review-avatar">
                                        <div class="review-author-details">
                                            <div class="review-author-name">${profileLinkHTML}</div>
                                            <div class="review-actions">${buttons}</div>
                                        </div>
                                    </div>
                                    <div class="review-meta-container">
                                        <span class="meta">${parseFloat(review.rating)}/5⭐</span>
                                        <div class="like-section">
                                            <button class="${likeBtnClass}" data-review-id="${review.id}" ${likeBtnDisabled}>❤</button>
                                            <span id="like-count-${review.id}">${review.like_count || 0}</span>
                                        </div>
                                    </div>
                                </header>
                                <p>${review.comment}</p>
                            `;

            reviewsList.appendChild(li);
        });
        
        updateReviewsPagination(data.currentPage, data.totalPages);

            if (reviewsForThisMovie.length > 0) {
                const avg = sumOfRatings / reviewsForThisMovie.length;
                const formattedAvg = parseFloat(avg.toFixed(1));
                avgRatingEl.innerHTML = `<div style="font-size: 1.5rem; font-weight: bold;">${formattedAvg}</div><div class="static-stars">${generateStarsHTML(formattedAvg)}</div>`;
            } else {
                avgRatingEl.textContent = '—';
            }

            if (userHasAlreadyReviewed) {
                reviewForm.style.display = 'none';
                if (reviewSectionTitle) reviewSectionTitle.textContent = 'Você já avaliou esse filme.';
            } else if (loggedInUser) {
                reviewForm.style.display = 'flex';
                if (reviewSectionTitle) reviewSectionTitle.textContent = 'Deixe sua Avaliação:';
            } else {
                reviewForm.style.display = 'none';
                if (reviewSectionTitle) reviewSectionTitle.textContent = 'Faça login para deixar sua avaliação';
            }
        } catch (error) {
            reviewsList.innerHTML = `<li>Erro ao carregar avaliações: ${error.message}</li>`;
            avgRatingEl.textContent = '—';
        }
    }

function updateReviewsPagination(currentPage, totalPages) {
    if (totalPages <= 1) {
        reviewsPagination.style.display = 'none';
        return;
    }
    
    reviewsPageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    reviewsPrevBtn.style.display = currentPage > 1 ? 'inline-block' : 'none';
    reviewsNextBtn.style.display = currentPage < totalPages ? 'inline-block' : 'none';
}

    async function searchMovies(query) {
        const url = `${apiBase}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=pt-BR`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            searchResultsGrid.innerHTML = "";
            if (!data.results || data.results.length === 0) {
                searchResultsGrid.innerHTML = "<p>Nenhum filme encontrado com este termo.</p>";
                return;
            }
            data.results.forEach((movie) => {
                const card = createMovieCard(movie);
                searchResultsGrid.appendChild(card);
            });
        } catch (error) {
            searchResultsGrid.innerHTML = "<p>Erro ao buscar filmes.</p>";
        }
    }

    async function searchUsers(query) {
        if (!token) {
            usersGridSection.style.display = 'none';
            return;
        }
        const url = `https://framecode-backend.onrender.com/api/users?search=${encodeURIComponent(query)}`;
        try {
            const response = await fetch(url, { headers: { 'x-auth-token': token } });
            if (!response.ok) throw new Error('Falha na busca de usuários');
            const data = await response.json();
            usersGrid.innerHTML = '';
            if (data.users.length > 0) {
                usersGridSection.style.display = 'block';
                usersTitle.textContent = "Usuários Encontrados";
                data.users.forEach(user => {
                    const card = createUserCard(user);
                    usersGrid.appendChild(card);
                });
            } else {
                usersGridSection.style.display = 'none';
            }
        } catch (error) {
            console.error(error);
            usersGridSection.style.display = 'none';
        }
    }
    
    // event listeners globais da página
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();
            if (searchTerm) {
                detailsContainer.style.display = 'none';
                searchResultsSection.style.display = 'block';
                usersGridSection.style.display = 'block';
                searchResultsTitle.textContent = `Resultados da busca por Filmes: "${searchTerm}"`;
                searchMovies(searchTerm);
                searchUsers(searchTerm);
            } else {
                searchResultsSection.style.display = 'none';
                usersGridSection.style.display = 'none';
                detailsContainer.style.display = 'block';
            }
        });
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => e.preventDefault());
        }
    }

    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rating = parseFloat(ratingValueInput.value);
        const comment = document.getElementById('text').value.trim();
        if (rating === 0 || !comment) alert('Selecione uma nota e escreva sua resenha.');
        try {
            const response = await fetch('https://framecode-backend.onrender.com/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ rating, comment, movieId: movieId, movieTitle: currentMovieData?.title || 'Título desconhecido' })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            reviewForm.reset();
            ratingValueInput.value = "0";
            setupStarRating();
            renderReviews();
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    });

    async function deleteReview(reviewId, isAdminDelete) {
        const confirmationText = isAdminDelete ? "ADMIN: Tem certeza que deseja excluir esta avaliação?" : "Tem certeza que deseja excluir sua avaliação?";
        if (!confirm(confirmationText)) return;
        const url = isAdminDelete ? `https://framecode-backend.onrender.com/api/reviews/${reviewId}` : `https://framecode-backend.onrender.com/api/reviews/me/${reviewId}`;
        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            alert('Avaliação excluída!');
            renderReviews();
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    }
    
    reviewsList.addEventListener('click', (e) => {
        const deleteButton = e.target.closest('.delete-review-btn');
        if (deleteButton) {
            const reviewId = deleteButton.dataset.reviewId;
            const isAdmin = deleteButton.classList.contains('admin-delete');
            deleteReview(reviewId, isAdmin);
        }
    });
    
    document.addEventListener('reviewsUpdated', renderReviews);
    
    let favoriteMovieIds = [];

    async function checkFavoriteStatus() {
        if (!token) {
            favoriteBtn.style.display = 'none'; 
            return;
        }
        try {
            const res = await fetch('https://framecode-backend.onrender.com/api/favorites/ids', { headers: { 'x-auth-token': token } });
            if (!res.ok) throw new Error('Não foi possível verificar os favoritos.');
            
            favoriteMovieIds = await res.json();
            
            if (favoriteMovieIds.includes(movieId)) {
                favoriteBtn.classList.add('favorited');
            } else {
                favoriteBtn.classList.remove('favorited');
            }
        } catch (error) {
            console.error("Erro ao verificar favoritos:", error);
        }
    }

    favoriteBtn.addEventListener('click', async () => {
        if (!token) {
            return alert('Você precisa estar logado para favoritar filmes.');
        }

        const isFavorited = favoriteBtn.classList.contains('favorited');
        const url = `https://framecode-backend.onrender.com/api/favorites/${isFavorited ? movieId : ''}`;
        const method = isFavorited ? 'DELETE' : 'POST';
        
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: isFavorited ? null : JSON.stringify({
                    movieId: movieId,
                    movieTitle: currentMovieData.title,
                    moviePosterPath: currentMovieData.poster_path
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message);
            }
            
            favoriteBtn.classList.toggle('favorited');

        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    });

        document.addEventListener('click', async (e) => {
        const likeButton = e.target.closest('.like-btn');
        if (likeButton) {
            if (!token) {
                alert('Você precisa estar logado para curtir uma avaliação.');
            }
            
            const reviewId = likeButton.dataset.reviewId;
            const isLiked = likeButton.classList.contains('liked');
            const url = `https://framecode-backend.onrender.com/api/reviews/${reviewId}/like`;
            const method = isLiked ? 'DELETE' : 'POST';

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'x-auth-token': token }
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message);
                }

                likeButton.classList.toggle('liked');
                const likeCountSpan = document.getElementById(`like-count-${reviewId}`);
                const currentCount = parseInt(likeCountSpan.textContent);
                likeCountSpan.textContent = isLiked ? currentCount - 1 : currentCount + 1;

            } catch (error) {
                alert(`Erro: ${error.message}`);
            }
        }
    });

    reviewsPrevBtn.addEventListener('click', () => {
        if (reviewsCurrentPage > 1) {
            renderReviews(reviewsCurrentPage - 1);
        }
    });

    reviewsNextBtn.addEventListener('click', () => {
        renderReviews(reviewsCurrentPage + 1);
    });

// inicialização
    async function initializePage() {
        await loadMovieDetails(movieId); 
        await loadMovieCredits(movieId);
        renderReviews(reviewsCurrentPage);
        checkFavoriteStatus(); 
        setupStarRating();
    }

    initializePage();
});