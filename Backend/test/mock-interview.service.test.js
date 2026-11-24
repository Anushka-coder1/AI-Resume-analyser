const {
  pickQuestions,
  fallbackEvaluate,
  computeOverallScore,
  buildFallbackSummary,
  toPublicSession,
  normaliseCount,
  normaliseMode,
} = require('../src/services/mock-interview.service')

const report = {
  technicalQuestions: [
    { question: 'T1: Explain the virtual DOM.', intention: 'React rendering', answer: 'Virtual DOM diffing reconciliation batching updates performance' },
    { question: 'T2: What is a closure?', intention: 'JS scope', answer: 'Function retains lexical scope variables' },
    { question: 'T3: REST vs GraphQL?', intention: 'API design', answer: 'Endpoints versus single schema query' },
  ],
  behavioralQuestions: [
    { question: 'B1: Tell me about a conflict.', intention: 'Teamwork', answer: 'Situation task action result communication' },
    { question: 'B2: Describe a failure.', intention: 'Growth', answer: 'Ownership learning improvement' },
  ],
}

describe('pickQuestions', () => {
  test('mixed mode alternates technical and behavioral', () => {
    const picked = pickQuestions(report, { mode: 'mixed', count: 5 })
    expect(picked.map((q) => q.question.slice(0, 2))).toEqual(['T1', 'B1', 'T2', 'B2', 'T3'])
    expect(picked[0]).toMatchObject({ type: 'technical', intention: 'React rendering' })
    expect(picked[0].modelAnswer).toContain('Virtual DOM')
  })

  test('single-type modes and counts', () => {
    expect(pickQuestions(report, { mode: 'technical', count: 3 }).every((q) => q.type === 'technical')).toBe(true)
    expect(pickQuestions(report, { mode: 'behavioral', count: 10 })).toHaveLength(2)
    expect(pickQuestions({}, { mode: 'mixed' })).toEqual([])
  })

  test('invalid options fall back to safe defaults', () => {
    expect(normaliseMode('hack')).toBe('mixed')
    expect(normaliseCount('999')).toBe(5)
    expect(normaliseCount('8')).toBe(8)
  })
})

describe('fallbackEvaluate', () => {
  test('empty or very short answers score near zero', () => {
    expect(fallbackEvaluate({ type: 'technical', userAnswer: '' }).score).toBe(0)
    expect(fallbackEvaluate({ type: 'technical', userAnswer: 'I do not know' }).score).toBeLessThanOrEqual(1)
  })

  test('a relevant detailed answer beats an off-topic one', () => {
    const base = { type: 'technical', intention: 'React rendering', modelAnswer: report.technicalQuestions[0].answer }
    const good = fallbackEvaluate({
      ...base,
      userAnswer: 'The virtual DOM is an in-memory tree. React performs diffing and reconciliation against the previous tree, then batching updates so only changed nodes touch the real DOM. This improves performance for frequent updates.',
    })
    const bad = fallbackEvaluate({ ...base, userAnswer: 'I enjoy playing cricket on weekends with my friends and family.' })
    expect(good.score).toBeGreaterThan(bad.score)
    expect(good.evaluatedBy).toBe('fallback')
    for (const value of Object.values(good.criteria)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(10)
    }
  })

  test('behavioral answers missing STAR parts get a STAR tip', () => {
    const result = fallbackEvaluate({ type: 'behavioral', intention: 'Teamwork', modelAnswer: 'x', userAnswer: 'We had some issues in the team and it was fine eventually.' })
    expect(result.feedback).toMatch(/STAR/)
  })
})

describe('scoring and summary', () => {
  const turns = [
    { question: 'Explain React hooks', score: 8, isFollowUp: false, criteria: { relevance: 8, depth: 8, structure: 8, communication: 8 } },
    { question: 'Follow up', score: 4, isFollowUp: true, criteria: { relevance: 4, depth: 4, structure: 4, communication: 4 } },
    { question: 'Explain Docker networking', score: 0, isFollowUp: false, skipped: true },
  ]

  test('follow-ups count half and the result is 0-100', () => {
    // (8*1 + 4*0.5 + 0*1) / 2.5 = 4 -> 40
    expect(computeOverallScore(turns)).toBe(40)
    expect(computeOverallScore([])).toBe(0)
  })

  test('fallback summary links weak answers to skill gaps', () => {
    const summary = buildFallbackSummary({ turns, skillGaps: [{ skill: 'Docker', severity: 'low' }, { skill: 'AWS', severity: 'high' }] })
    expect(summary.weakSkills).toEqual(['Docker'])
    expect(summary.improvements.join(' ')).toMatch(/skipped 1 question/)
    expect(summary.verdict).toBeTruthy()
  })
})

describe('toPublicSession', () => {
  test('hides the model answer of the open question only', () => {
    const session = toPublicSession({
      _id: 's1',
      turns: [
        { question: 'Q1', modelAnswer: 'A1', intention: 'I1', userAnswer: 'mine', score: 7 },
        { question: 'Q2', modelAnswer: 'A2', intention: 'I2', userAnswer: null },
      ],
      pendingQuestions: [{ question: 'Q3' }],
    })
    expect(session.turns[0].modelAnswer).toBe('A1')
    expect(session.turns[1].modelAnswer).toBeUndefined()
    expect(session.turns[1].intention).toBeUndefined()
    expect(session.totalQuestions).toBe(3)
    expect(session.remainingQuestions).toBe(1)
  })
})
