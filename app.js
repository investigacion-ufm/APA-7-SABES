const form = document.querySelector('#chat-form');
const input = document.querySelector('#prompt');
const messagesEl = document.querySelector('#messages');
const sendButton = document.querySelector('#send');
const suggestionButtons = document.querySelectorAll('.suggestion');
const systemPrompt = "Eres una especialista amable y precisa en redacción académica y Normas APA, 7.ª edición. Hablas siempre en español, salvo que el usuario pida otro idioma. Ayudas a crear y verificar referencias, citas parentéticas y narrativas, revisar redacción y ortografía académicas, orientar sobre tablas/figuras e identificar herramientas web cuando se soliciten.\n\nREGLAS:\n- Primero identifica la intención: referencia, citas, revisión de texto, tabla/figura o herramienta. Si no está clara, haz una pregunta breve.\n- Para una referencia, clasifica la fuente (libro, artículo, web, tesis, capítulo, informe, video u otra). Si faltan datos necesarios, solicita SOLO los datos faltantes y espera; no inventes autores, fechas, títulos, editoriales, DOI ni URL. Separa explícitamente datos confirmados de supuestos o datos por verificar.\n- Cuando la persona solicita crear o corregir una referencia, al tener datos suficientes entrega exactamente estos tres rótulos para cada fuente: **Referencia bibliográfica**, **Cita parentética** y **Cita narrativa**. Aplica cursivas APA donde correspondan. Añade una nota breve de verificación solo si hace falta. Para 3+ autores, usa et al. desde la primera cita; en libros no incluyas ciudad editorial; escribe los DOI como URL completa https://doi.org/… . No fabriques un DOI.\n- Usa las reglas APA 7 con cuidado. Si existe más de una interpretación, indica brevemente la duda y pregunta lo necesario. Para texto académico conserva el significado; señala la regla aplicada con una explicación concisa.\n- Pautas pedagógicas: no conviertas consultas de aprendizaje general en una lista de respuestas para copiar. En vez de resolver preguntas académicas amplias directamente, guía con una pregunta orientadora, una pista específica o un inicio de frase. Si la tarea explícita es elaborar/revisar una referencia o corregir un texto, realiza esa tarea siguiendo los pasos y explica brevemente lo esencial.\n- Recomienda herramientas gratuitas y confiables solo si las piden; aclara que toda salida automática debe revisarse manualmente.\n- Sé concisa, cálida y respetuosa. No afirmes haber consultado manuales o fuentes que no se te hayan proporcionado. No inventes datos para completar una respuesta.";
const history = [];
function escapeHTML(value) {
  return value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function formatText(text) {
  let safe = escapeHTML(text);
  safe = safe.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
  safe = safe.replace(/\\*(.+?)\\*/g, '<em>$1</em>');
  return safe.replace(/\\n/g, '<br>');
}
function addMessage(role, text, time) {
  const article = document.createElement('article');
  article.className = 'message ' + role;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = formatText(text);
  const stamp = document.createElement('time');
  stamp.textContent = time || 'Ahora';
  article.append(bubble, stamp);
  messagesEl.append(article);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return article;
}
function addTyping() {
  const article = document.createElement('article');
  article.className = 'message assistant';
  article.setAttribute('aria-label', 'Escribiendo respuesta');
  article.innerHTML = '<div class="bubble"><span class="typing"><i></i><i></i><i></i></span></div>';
  messagesEl.append(article);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return article;
}
function resizeInput() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 140) + 'px';
}
input.addEventListener('input', resizeInput);
input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});
suggestionButtons.forEach(button => button.addEventListener('click', () => {
  input.value = button.dataset.prompt;
  resizeInput();
  input.focus();
}));
form.addEventListener('submit', async event => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || sendButton.disabled) return;
  addMessage('user', text);
  history.push({ role: 'user', content: text });
  input.value = '';
  resizeInput();
  sendButton.disabled = true;
  const typing = addTyping();
  try {
    if (!window.websim || !window.websim.chat || !window.websim.chat.completions || !window.websim.chat.completions.create) throw new Error('El servicio de chat no está disponible en este momento.');
    const response = await window.websim.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }, ...history.slice(-12)]
    });
    const answer = response && response.content && response.content.trim();
    if (!answer) throw new Error('No llegó una respuesta. Intenta de nuevo.');
    history.push({ role: 'assistant', content: answer });
    typing.remove();
    addMessage('assistant', answer);
  } catch (error) {
    typing.remove();
    const message = error && error.message ? error.message : 'Hubo un problema al responder.';
    addMessage('assistant', message + ' Puedes intentarlo de nuevo en un momento.');
  } finally {
    sendButton.disabled = false;
    input.focus();
  }
});