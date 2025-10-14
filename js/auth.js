const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const emailInput = document.getElementById('email');
const senhaInput = document.getElementById('senha');
const messageArea = document.getElementById('messageArea');
const cpfInput = document.getElementById('cpf');
const data_nascimentoInput = document.getElementById('data_nascimento');

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showMessage(message, type) {
  if (!messageArea) return;
  messageArea.textContent = message;
  messageArea.className = 'message-area';
  messageArea.classList.add(type);
  messageArea.style.display = 'block';
  messageArea.style.color = '#e5e5e5';
  messageArea.style.marginBottom = '0.8rem';
}

function clearMessage() {
  if (!messageArea) return;
  messageArea.textContent = '';
  messageArea.className = 'message-area';
  messageArea.style.display = 'none';
}

//login
if (loginForm) {
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    clearMessage();
    const email = emailInput.value.trim();
    const password = senhaInput.value;
    
    // 1. captura o estado do checkbox
    const rememberMeCheckbox = document.getElementById('remember-me-checkbox');
    const rememberMe = rememberMeCheckbox.checked;

    if (!email || !password) return showMessage('Por favor, preencha todos os campos.', 'error');
    if (!isValidEmail(email)) return showMessage('E‑mail inválido.', 'error');

    try {
      const response = await fetch('https://framecode-backend.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 2. envia o estado do 'rememberMe' para o backend
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Ocorreu um erro no login.');
      }
      
      localStorage.removeItem('framecode_token');
      sessionStorage.removeItem('framecode_token');

      // 3. guarda o token no local correto
      if (rememberMe) {
        // se "lembrar de mim" estiver marcado, guarda de forma persistente
        localStorage.setItem('framecode_token', data.token);
      } else {
        // se não, guarda apenas para a sessão atual
        sessionStorage.setItem('framecode_token', data.token);
      }

      showMessage('Login realizado com sucesso!', 'success');
      setTimeout(() => location.href = 'index.html', 1000);

    } catch (err) {
      showMessage(err.message, 'error');
    }
  });
  emailInput.addEventListener('input', clearMessage);
  senhaInput.addEventListener('input', clearMessage);
}

function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, ''); // remove tudo que não for número

    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let dig1 = 11 - (soma % 11);
    if (dig1 >= 10) dig1 = 0;

    if (dig1 !== parseInt(cpf.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    let dig2 = 11 - (soma % 11);
    if (dig2 >= 10) dig2 = 0;

    if (dig2 !== parseInt(cpf.charAt(10))) return false;

    return true;
}

// Registro
if (registerForm) {
  registerForm.addEventListener('submit', async function(e) { 
    e.preventDefault();
    clearMessage();
    
    // 1. coletar dados do formulário
    const name = this.name.value.trim();
    const email = this.email.value.trim();
    const cpf = this.cpf.value.trim();
    const data_nascimento = this.data_nascimento.value.trim();
    const password = this.password.value;
    const confirmPassword = this.confirmPassword.value;

    // 2. validações no frontend
    if (!name || !email || !password || !confirmPassword || !cpf || !data_nascimento) return showMessage('Preencha todos os campos.', 'error');
    if (password.length < 6) return showMessage('A senha deve ter pelo menos 6 caracteres.', 'error');
    if (!isValidEmail(email)) return showMessage('E‑mail inválido.', 'error');
    if (password !== confirmPassword) return showMessage('Senhas não conferem.', 'error');

    // 3. enviar dados para a API
    try {
      const response = await fetch('https://framecode-backend.onrender.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, cpf, data_nascimento, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // se a API retornar um erro (ex: e-mail já existe), mostramos a mensagem dela
        throw new Error(data.message || 'Ocorreu um erro.');
      }

      // 4. sucesso!
      showMessage('Conta criada com sucesso!', 'success');
      setTimeout(() => location.href = 'login.html', 1500);

    } catch (error) {
      // captura erros da API ou de conexão
      showMessage(error.message, 'error');
    }
  });
}

function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  const button = input.parentElement.querySelector('.toggle-password-btn');
  const icon = button.querySelector('img');

  if (input.type === 'password') {
    input.type = 'text';
    icon.src = 'assets/hidden.png';
    icon.alt = 'Ocultar senha';
  } else {
    input.type = 'password';
    icon.src = 'assets/show.png';
    icon.alt = 'Mostrar senha';
  }
}

document.querySelectorAll('.toggle-password-btn').forEach(button => {
  button.addEventListener('click', function() {
    const targetId = this.getAttribute('data-target');
    togglePasswordVisibility(targetId);
  });
});