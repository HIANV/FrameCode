const apiKey = "3b08d5dfa29024b5dcb74e8bff23f984";
const apiBase = "https://api.themoviedb.org/3";
const imageBase = "https://image.tmdb.org/t/p/w500";

// DOM
const banner = document.querySelector(".banner");
const searchInput = document.getElementById("searchInput");

const moviesGridSection = document.getElementById('moviesGridSection');
const moviesTitle = document.getElementById("moviesTitle");
const moviesGrid = document.getElementById("moviesGrid");

const usersGridSection = document.getElementById('usersGridSection');
const usersTitle = document.getElementById("usersTitle");
const usersGrid = document.getElementById("usersGrid");

// função de criação de cards

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

// função de criação de cards de usuários
function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'user-card';
    
    // lógica para decidir qual imagem usar (a do usuário ou a padrão)
    const avatarSrc = user.avatar_url 
        ? `https://framecode-backend.onrender.com${user.avatar_url}` 
        : 'assets/user icon.png';

    card.innerHTML = `
        <a href="profile.html?id=${user.id}">
            <img src="${avatarSrc}" alt="Avatar de ${user.name}">
            <h3>${user.name}</h3>
        </a>
    `;
    return card;
}

// funções de busca na API

async function fetchPopularMovies() {
  moviesTitle.textContent = "Carregando...";
  let popularMovies = [];
  let currentPage = 1;

  try {
    // continua buscando filmes até ter pelo menos 24 com pôster
    while (popularMovies.length < 24 && currentPage <= 5) { // limita a 5 páginas para evitar loops infinitos
      const url = `${apiBase}/movie/popular?api_key=${apiKey}&language=pt-BR&page=${currentPage}`;
      const response = await fetch(url);
      const data = await response.json();

      // filtra os filmes para incluir apenas os que tem um pôster
      const moviesWithPosters = data.results.filter(movie => movie.poster_path);
      
      popularMovies = [...popularMovies, ...moviesWithPosters];
      currentPage++;
    }

    // pega exatamente os primeiros 24 filmes da lista filtrada
    const moviesToDisplay = popularMovies.slice(0, 24);

    moviesGrid.innerHTML = ""; // limpa o grid
    moviesTitle.textContent = "Populares";

    moviesToDisplay.forEach((movie) => {
      const card = createMovieCard(movie);
      moviesGrid.appendChild(card);
    });

  } catch (error) {
    console.error("Erro ao carregar os filmes populares:", error);
    moviesGrid.innerHTML = "<p>Erro ao carregar os filmes populares.</p>";
  }
}

async function searchMovies(query) {
  const url = `${apiBase}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=pt-BR`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    moviesGrid.innerHTML = "";
    if (!data.results || data.results.length === 0) {
      moviesGrid.innerHTML = "<p>Nenhum filme encontrado com este termo.</p>";
      return;
    }
    data.results.forEach((movie) => {
      const card = createMovieCard(movie);
      moviesGrid.appendChild(card);
    });
  } catch (error) {
    moviesGrid.innerHTML = "<p>Erro ao buscar filmes.</p>";
  }
}

// função para buscar usuários
async function searchUsers(query) {
    const token = localStorage.getItem('framecode_token') || sessionStorage.getItem('framecode_token');
    if (!token) {
        usersGridSection.style.display = 'none'; // esconde a seção se não estiver logado
        return;
    }

    const url = `https://framecode-backend.onrender.com/api/users?search=${encodeURIComponent(query)}`;
    try {
        const response = await fetch(url, {
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) throw new Error('Falha na busca de usuários');

        const data = await response.json();
        usersGrid.innerHTML = '';

        if (data.users.length > 0) {
            usersGridSection.style.display = 'block'; // mostra a seção de usuários
            usersTitle.textContent = "Usuários Encontrados";
            data.users.forEach(user => {
                const card = createUserCard(user);
                usersGrid.appendChild(card);
            });
        } else {
            usersGridSection.style.display = 'none'; // esconde a seção se não houver resultados
        }
    } catch (error) {
        console.error(error);
        usersGridSection.style.display = 'none';
    }
}


// lógica de eventos

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');

    if (searchQuery) {
        searchInput.value = searchQuery;
        banner.style.display = 'none';
        moviesTitle.textContent = `Resultados da busca por Filmes: "${searchQuery}"`;
        searchMovies(searchQuery);
        searchUsers(searchQuery); 
    } else {
        fetchPopularMovies();
    }
});

searchInput.addEventListener("input", (event) => {
  const searchTerm = event.target.value.trim();

  if (searchTerm.length >= 1) {
    banner.style.display = 'none';
    moviesTitle.textContent = `Resultados da busca por Filmes: "${searchTerm}"`;
    searchMovies(searchTerm);
    searchUsers(searchTerm); 
  } else {
    banner.style.display = 'flex';
    usersGridSection.style.display = 'none'; 
    fetchPopularMovies();
  }
});