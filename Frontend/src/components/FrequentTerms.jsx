import { frequentTerms } from '../utils/textAnalysis.js'

export default function FrequentTerms({ answers }) {
    const terms = frequentTerms(answers)
    if (terms.length === 0) return null
    const max = terms[0].count

    return (
    <div className="mb-2">
        <p className="text-muted mb-1" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Términos frecuentes
        </p>
        <div className="d-flex flex-wrap gap-2">
        {terms.map(t => (
            <span
            key={t.term}
            className="badge rounded-pill"
            style={{
                backgroundColor: '#eef3e0',
                color: '#3c5a2f',
                border: '1px solid #d4e0b8',
                fontWeight: 500,
              fontSize: `${(0.72 + 0.28 * (t.count / max)).toFixed(2)}rem`
            }}
            >
            {t.term} <span style={{ opacity: 0.55 }}>·{t.count}</span>
            </span>
        ))}
        </div>
    </div>
    )
}