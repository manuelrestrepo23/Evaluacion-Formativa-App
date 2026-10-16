// Texto que se guarda cuando una pregunta abierta se deja en blanco.
// Las preguntas abiertas son opcionales; las de escala (likert) siguen siendo obligatorias.
export const SIN_RESPUESTA = 'N/A'

// true si la respuesta abierta esta vacia o solo tiene espacios
export const estaEnBlanco = (texto) => typeof texto !== 'string' || !texto.trim()