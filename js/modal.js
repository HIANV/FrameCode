document.addEventListener('DOMContentLoaded', () => {
  // DOM
  const editModal = document.getElementById('editReviewModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalStarRater = document.getElementById('modalStarRater');
  const modalRatingValue = document.getElementById('modalRatingValue');
  const modalCommentText = document.getElementById('modalCommentText');
  const modalSaveBtn = document.getElementById('modalSaveBtn');

  if (!editModal) {
    return; // se não houver modal nesta página, o script não faz nada.
  }

  // funções do modal
  function openEditModal(reviewId, comment, rating) {
    modalCommentText.value = comment;
    modalRatingValue.value = rating;
    modalSaveBtn.dataset.reviewId = reviewId;
    setupModalStarRating(parseFloat(rating));
    editModal.classList.add('visible');
  }

  function closeEditModal() {
    editModal.classList.remove('visible');
  }

  function setupModalStarRating(initialRating = 0) {
    if (!modalStarRater) return;
    modalStarRater.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const starImg = document.createElement('img');
        starImg.src = 'assets/empty-star.png';
        starImg.dataset.value = i;
        modalStarRater.appendChild(starImg);
    }
    const stars = Array.from(modalStarRater.children);
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
            modalRatingValue.value = index + (isHalf ? 0.5 : 1);
            updateStars(parseFloat(modalRatingValue.value));
        });
    });
    modalStarRater.addEventListener('mouseleave', () => updateStars(parseFloat(modalRatingValue.value) || 0));
    updateStars(initialRating);
  }
  
  async function updateReview(reviewId, newComment, newRating) {
    if (newRating < 0.5 || newComment.trim() === '') {
        return alert("Por favor, preencha todos os campos e selecione uma nota.");
    }
    const token = localStorage.getItem('framecode_token') || sessionStorage.getItem('framecode_token');
    try {
        const response = await fetch(`https://framecode-backend.onrender.com/api/reviews/me/${reviewId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            body: JSON.stringify({ comment: newComment, rating: newRating })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        alert('Avaliação atualizada com sucesso!');
        closeEditModal();
        document.dispatchEvent(new CustomEvent('reviewsUpdated'));
    } catch (error) {
        alert(`Erro: ${error.message}`);
    }
  }

  // eventos globais
  document.addEventListener('click', (e) => {
    const editButton = e.target.closest('.edit-review-btn');
    if (editButton) {
      const { reviewId, comment, rating } = editButton.dataset;
      openEditModal(reviewId, comment, rating);
    }
  });

  closeModalBtn.addEventListener('click', closeEditModal);
  editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });
  modalSaveBtn.addEventListener('click', () => {
      const reviewId = modalSaveBtn.dataset.reviewId;
      const newComment = modalCommentText.value;
      const newRating = parseFloat(modalRatingValue.value);
      updateReview(reviewId, newComment, newRating);
  });
});