// =========================================================
// 1. CONFIGURAÇÕES FIXAS E VARIÁVEIS DE ESTADO
// =========================================================

// Horários de aluguel fixos disponíveis
const horariosFixos = [
    "09:00", "10:00", "11:00",
    "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00",
    "21:00", "22:00", "23:00"
];

// Inicialização das variáveis de estado (o que está sendo visualizado/selecionado)
let dataAtual = new Date();
let mesExibido = dataAtual.getMonth(); // Mês atual (0 a 11)
let anoExibido = dataAtual.getFullYear(); // Ano atual
let diaSelecionado = dataAtual.getDate(); // Dia atual (1 a 31)

let quadraSelecionada = 'society'; // Inicia com "society"
let reservaAtual = null; // Armazena os detalhes da reserva antes da confirmação

// Carrega as reservas salvas no navegador (ou um objeto vazio se não houver)
const reservas = JSON.parse(localStorage.getItem("reservas")) || {};


// =========================================================
// 2. REFERÊNCIAS AO DOM (ELEMENTOS HTML)
// =========================================================

const calendarDiv = document.getElementById("calendar");
const monthYearH3 = document.getElementById("month-year");
const prevMonthButton = document.getElementById("prev-month");
const nextMonthButton = document.getElementById("next-month");
const horariosDiv = document.getElementById("horarios");
const modalDiv = document.getElementById("modal");
const resumoP = document.getElementById("resumo");
const formReserva = document.getElementById("formReserva");
const cancelarButton = document.getElementById("cancelar");
const quadraBotoes = document.querySelectorAll(".quadra-btn");


// =========================================================
// 3. FUNÇÕES PRINCIPAIS (RENDERIZAÇÃO)
// =========================================================

/**
 * Desenha o calendário na tela para o mês e ano em exibição.
 */
function renderizarCalendario() {
    calendarDiv.innerHTML = "";
    const hoje = new Date();
    
    const primeiroDia = new Date(anoExibido, mesExibido, 1);
    const ultimoDia = new Date(anoExibido, mesExibido + 1, 0);
    
    // Formata o cabeçalho do mês/ano
    const mesNome = primeiroDia.toLocaleString("pt-BR", { month: "long" }).toUpperCase();
    monthYearH3.textContent = `${mesNome} ${anoExibido}`;

    // === Lógica para que a semana comece na Segunda-feira ===
    let diaSemana = primeiroDia.getDay(); // 0=Dom, 1=Seg...
    let espacosVazios;

    // Se o mês começa no Domingo (0), precisamos de 6 espaços vazios
    if (diaSemana === 0) {
        espacosVazios = 6;
    } else {
        // Se começa na Segunda (1), 1-1=0 espaços; Terça (2), 2-1=1 espaço, etc.
        espacosVazios = diaSemana - 1;
    }

    // 1. Adiciona os blocos vazios (dias do mês anterior)
    for (let i = 0; i < espacosVazios; i++) {
        const div = document.createElement("div");
        div.classList.add("day", "disabled");
        calendarDiv.appendChild(div);
    }

    // 2. Adiciona os dias do mês
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
        const div = document.createElement("div");
        div.classList.add("day");
        div.textContent = dia;

        const isMesAtual = (mesExibido === hoje.getMonth() && anoExibido === hoje.getFullYear());
        const isDiaPassado = isMesAtual && dia < hoje.getDate();
        const isDiaSelecionado = dia === diaSelecionado;

        if (isDiaPassado) {
            div.classList.add("disabled");
        } else {
            if (isDiaSelecionado) {
                div.classList.add("selected");
            }
            
            // Adiciona a função de clique
            div.addEventListener("click", function(event) {
                aoClicarNoDia(dia, event.target);
            });
        }

        calendarDiv.appendChild(div);
    }
}

/**
 * Lida com a seleção de um novo dia.
 * @param {number} dia - O número do dia que foi clicado.
 * @param {HTMLElement} elemento - O elemento HTML do dia clicado.
 */
function aoClicarNoDia(dia, elemento) {
    diaSelecionado = dia;
    
    // Remove a classe 'selected' de todos os dias
    document.querySelectorAll(".day").forEach(d => d.classList.remove("selected"));
    
    // Adiciona a classe 'selected' ao dia clicado
    elemento.classList.add("selected");
    
    mostrarHorarios();
}


/**
 * Desenha os horários disponíveis (ou reservados) na tela.
 */
function mostrarHorarios() {
    horariosDiv.innerHTML = "";
    
    if (diaSelecionado === null || quadraSelecionada === null) return;

    // Constrói a string da data no formato YYYY-MM-DD
    const mesStr = (mesExibido + 1).toString().padStart(2, "0");
    const diaStr = diaSelecionado.toString().padStart(2, "0");
    const dataFormatada = `${anoExibido}-${mesStr}-${diaStr}`;

    horariosFixos.forEach(hora => {
        const idReserva = `${quadraSelecionada}-${dataFormatada}-${hora}`;
        const div = document.createElement("div");
        div.classList.add("horario");
        div.textContent = hora;

        const dataHoraReserva = new Date(`${dataFormatada}T${hora}:00`);
        const agora = new Date();
        const isPassado = dataHoraReserva <= agora;
        const isReservado = !!reservas[idReserva];

        if (isReservado) {
            div.classList.add("reservado");
            div.textContent += " (Reservado)";
            div.style.cursor = "not-allowed";
        } else if (isPassado) {
            // Desabilita horários que já passaram
            div.classList.add("reservado"); 
            div.style.cursor = "not-allowed";
        } else {
            // Se estiver disponível e no futuro, adiciona o clique
            div.addEventListener("click", function() {
                abrirModal(dataFormatada, hora);
            });
        }

        horariosDiv.appendChild(div);
    });
}


// =========================================================
// 4. FUNÇÕES DE NAVEGAÇÃO E AÇÃO
// =========================================================

/**
 * Altera o mês exibido para o anterior.
 */
function navegarMesAnterior() {
    mesExibido--;
    if (mesExibido < 0) {
        mesExibido = 11;
        anoExibido--;
    }
    // Ao mudar o mês, deseleciona o dia
    diaSelecionado = null; 
    
    mostrarHorarios(); 
    renderizarCalendario();
}

/**
 * Altera o mês exibido para o próximo.
 */
function navegarMesProximo() {
    mesExibido++;
    if (mesExibido > 11) {
        mesExibido = 0;
        anoExibido++;
    }
    // Ao mudar o mês, deseleciona o dia
    diaSelecionado = null; 
    
    mostrarHorarios(); 
    renderizarCalendario();
}


/**
 * Abre o modal para preenchimento dos dados da reserva.
 * @param {string} data - Data da reserva (YYYY-MM-DD).
 * @param {string} hora - Hora da reserva (HH:MM).
 */
function abrirModal(data, hora) {
    reservaAtual = { quadra: quadraSelecionada, data, hora };
    resumoP.textContent = `Quadra: ${quadraSelecionada.toUpperCase()} • Dia: ${data} • Horário: ${hora}`;
    modalDiv.style.display = "flex";
}

/**
 * Função chamada ao enviar o formulário de reserva.
 */
function confirmarReserva(event) {
    event.preventDefault(); // Impede o recarregamento da página

    const nome = document.getElementById("nome").value;
    const cpf = document.getElementById("cpf").value;
    const telefone = document.getElementById("telefone").value;

    if (!reservaAtual) return;

    const { quadra, data, hora } = reservaAtual;
    const idReserva = `${quadra}-${data}-${hora}`;
    
    // Salva a reserva no objeto global
    reservas[idReserva] = { nome, cpf, telefone, quadra, data, hora };
    
    // Salva o objeto atualizado no navegador
    localStorage.setItem("reservas", JSON.stringify(reservas));

    alert("Reserva confirmada com sucesso!");
    modalDiv.style.display = "none";
    formReserva.reset();
    
    // Atualiza a lista de horários para mostrar o novo horário como "Reservado"
    mostrarHorarios();
}

/**
 * Função chamada ao cancelar a reserva no modal.
 */
function cancelarReserva() {
    modalDiv.style.display = "none";
    formReserva.reset();
}

/**
 * Inicializa os botões de quadra e define a quadra inicial (society).
 */
function inicializarQuadras() {
    quadraBotoes.forEach(btn => {
        // 1. Configuração inicial
        if (btn.dataset.quadra === quadraSelecionada) {
            btn.classList.add("active");
        }
        
        // 2. Adiciona o clique
        btn.addEventListener("click", function() {
            // Remove a seleção de todos os botões
            quadraBotoes.forEach(b => b.classList.remove("active"));
            
            // Adiciona a seleção ao botão clicado
            btn.classList.add("active");
            
            // Atualiza o estado e renderiza
            quadraSelecionada = btn.dataset.quadra;
            mostrarHorarios();
        });
    });
}


// =========================================================
// 5. INICIALIZAÇÃO DA APLICAÇÃO
// =========================================================

function inicializarAplicacao() {
    // 1. Configura a navegação do calendário
    prevMonthButton.addEventListener("click", navegarMesAnterior);
    nextMonthButton.addEventListener("click", navegarMesProximo);

    // 2. Configura o formulário e o botão de cancelar do modal
    formReserva.addEventListener("submit", confirmarReserva);
    cancelarButton.addEventListener("click", cancelarReserva);

    // 3. Renderiza a interface inicial
    renderizarCalendario();
    inicializarQuadras();
    
    // 4. Garante que o dia e a quadra inicial estejam selecionados e mostra os horários
    // Se o dia inicial não foi selecionado via clique, garantimos a seleção aqui
    const diaElementoInicial = Array.from(calendarDiv.children).find(el => 
        el.textContent.trim() === diaSelecionado.toString() && !el.classList.contains('disabled')
    );
    if (diaElementoInicial) {
        // Chamamos a função de seleção, passando o elemento para que ele seja destacado
        aoClicarNoDia(diaSelecionado, diaElementoInicial);
    } else {
         mostrarHorarios();
    }
}

// Inicia todo o processo quando o HTML for totalmente carregado
document.addEventListener('DOMContentLoaded', inicializarAplicacao);