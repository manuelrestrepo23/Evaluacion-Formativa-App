// Analisis simple de texto para respuestas abiertas (en el cliente, sin IA)

// Palabras vacias en español + muletillas del dominio que no aportan
const STOPWORDS = new Set([
    'el','la','los','las','un','una','unos','unas','de','del','al','a','ante','con','contra',
    'en','entre','hacia','hasta','para','por','segun','sin','sobre','tras','y','e','o','u','ni',
    'que','se','su','sus','le','les','lo','me','mi','mis','te','tu','tus','nos','es','son','ser',
    'muy','mas','pero','como','porque','cuando','donde','tambien','ya','si','no','mucho','poco',
    'todo','todos','toda','todas','algo','este','esta','estos','estas','ese','esa','esos','esas',
    'hay','ha','han','he','fue','era','yo','profe','profesor','profesora','clase','clases',
    'curso','cursos','estudiante','estudiantes'
])

// minusculas y sin tildes
function normalize(word) {
    return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zñ]/g, '')
}

// Terminos mas frecuentes de una lista de respuestas de texto
export function frequentTerms(answers, topN = 8, minLength = 4) {
    const counts = {}
    ;(answers || []).forEach(text => {
    if (!text) return
    text.split(/\s+/).forEach(raw => {
        const w = normalize(raw)
        if (w.length < minLength || STOPWORDS.has(w)) return
        counts[w] = (counts[w] || 0) + 1
    })
    })
    return Object.entries(counts)
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
}