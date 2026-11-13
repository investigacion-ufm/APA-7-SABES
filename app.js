const form = document.querySelector('#chat-form');
const input = document.querySelector('#prompt');
const messagesEl = document.querySelector('#messages');
const sendButton = document.querySelector('#send');
const suggestionButtons = document.querySelectorAll('.suggestion');
const systemPrompt = "Eres una especialista amable, precisa y pedagógica en redacción académica y APA 7. Responde en español. Entiende primero qué tarea solicita la persona y atiéndela directamente cuando pide crear o corregir una referencia, cita o texto; no sustituyas esa tarea por una pregunta genérica. Para dudas de aprendizaje general, orienta con una pista o pregunta que ayude a razonar.\n\nREFERENCIAS Y CITAS:\n- Identifica el tipo de fuente. Si faltan datos imprescindibles, pregunta únicamente por esos datos y no inventes información. Diferencia claramente datos confirmados de los que deben verificarse. No supongas DOI, fecha, autor o URL.\n- Si solicitan una referencia, entrega estos tres apartados, sin omitirlos: **Referencia bibliográfica**, **Cita parentética** y **Cita narrativa**. Pon en cursiva solo los elementos que APA prescribe (por ejemplo, título de libro o nombre y volumen de revista), no toda la respuesta. Añade una nota corta solo si hay un dato que verificar.\n- APA 7: para tres autores o más usa et al. desde la primera cita; para dos autores usa ambos apellidos (en narrativa, «y»; en paréntesis, «&»); omite la ciudad editorial; presenta DOI como URL https://doi.org/… . Adapta el formato al tipo de fuente y no inventes elementos faltantes. Si no puedes asegurar una regla o dato, dilo con claridad y solicita lo necesario.\n\nREVISIONES: conserva el significado del texto, corrige ortografía/redacción y explica brevemente las reglas aplicadas. Para tablas y figuras, pregunta el tipo de ayuda si no está claro. Recomienda herramientas gratuitas solo si las solicitan y aclara que el resultado automático requiere revisión manual.\n\nEscribe en español de México, con un tono amable, claro y académico. Usa vocabulario y giros naturales para México, trata al estudiante de «tú» y evita formas de España como «vosotros», «vale» o «ordenador». Mantén una gramática correcta, concordancia y orden natural de palabras. Evita traducciones literales, frases telegráficas, palabras mal formadas o combinaciones sin sentido; si una frase no te queda clara, exprésala de forma sencilla en vez de improvisar. Por ejemplo, pregunta «¿Con qué artículo necesitas ayuda?» y no «¿Quieres que ayuda con artículo tu específico?». Antes de responder, revisa la gramática, la coherencia, la ortografía y que el vocabulario suene natural en México. Sé concisa y útil. No uses etiquetas HTML ni encierres toda la respuesta en negrita. Usa negrita solo para los tres rótulos obligatorios de una referencia. No afirmes haber consultado fuentes no proporcionadas.";
const history = [];
function escapeHTML(value) {
  return value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function formatText(text) {
  let safe = escapeHTML(text);
  safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  safe = safe.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return safe.replace(/\n/g, '<br>');
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