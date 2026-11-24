import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Bot, ChevronDown, Flag, LoaderCircle, RotateCcw, Send, SkipForward, Trophy, User } from 'lucide-react'
import '../style/mock-interview.scss'
import { getInterviewReportById } from '../services/interview.api'
import {
  answerMockInterview,
  finishMockInterview,
  getMockInterview,
  getMockInterviewsForReport,
  skipMockQuestion,
  startMockInterview,
} from '../services/mock-interview.api'

const MODES = [
  { value: 'mixed', label: 'Mixed', hint: 'Technical and behavioral, alternating' },
  { value: 'technical', label: 'Technical', hint: 'Concepts, problem solving, tools' },
  { value: 'behavioral', label: 'Behavioral', hint: 'Teamwork, ownership, STAR stories' },
]
const COUNTS = [3, 5, 8, 10]
const CRITERIA = [
  ['relevance', 'Relevance'],
  ['depth', 'Depth'],
  ['structure', 'Structure'],
  ['communication', 'Communication'],
]

const errorMessage = (error, fallback) => error?.response?.data?.message || fallback
const isAnswered = (turn) => turn.userAnswer !== null && turn.userAnswer !== undefined
const scoreTone = (score, max = 10) => {
  const ratio = score / max
  return ratio >= 0.7 ? 'good' : ratio >= 0.5 ? 'ok' : 'low'
}
const formatDate = (value) => new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/* ------------------------------- Setup ------------------------------- */

function SetupScreen({ report, history, onStart, onOpen, starting }) {
  const [mode, setMode] = useState('mixed')
  const [count, setCount] = useState(5)
  const technical = report.technicalQuestions?.length || 0
  const behavioral = report.behavioralQuestions?.length || 0
  const available = mode === 'technical' ? technical : mode === 'behavioral' ? behavioral : technical + behavioral

  return (
    <section className="mock-setup">
      <header className="mock-header">
        <p className="mock-eyebrow">AI mock interview</p>
        <h1>Practise for <span>{report.title}</span></h1>
        <p>The AI interviewer asks questions from your report one at a time, grades each answer and may ask a follow-up — just like a real interview.</p>
      </header>

      <div className="mock-card">
        <h2>Interview type</h2>
        <div className="mock-modes" role="radiogroup" aria-label="Interview type">
          {MODES.map((item) => (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={mode === item.value}
              className={`mock-mode ${mode === item.value ? 'is-active' : ''}`}
              onClick={() => setMode(item.value)}
            >
              <strong>{item.label}</strong>
              <span>{item.hint}</span>
            </button>
          ))}
        </div>

        <h2>Number of questions</h2>
        <div className="mock-counts">
          {COUNTS.map((value) => (
            <button
              key={value}
              type="button"
              className={`mock-chip ${count === value ? 'is-active' : ''}`}
              onClick={() => setCount(value)}
              disabled={value > available && value !== COUNTS[0]}
            >
              {value}
            </button>
          ))}
        </div>
        <p className="mock-muted">{available} question{available === 1 ? '' : 's'} available for this type.</p>

        <button className="mock-button mock-button--primary" onClick={() => onStart({ mode, count })} disabled={starting || !available}>
          {starting ? <><LoaderCircle className="spin" size={18} /> Starting…</> : 'Start interview'}
        </button>
      </div>

      {history.length > 0 && (
        <div className="mock-card">
          <h2>Past attempts</h2>
          <ul className="mock-history">
            {history.map((item) => (
              <li key={item._id}>
                <button type="button" onClick={() => onOpen(item._id)}>
                  <span className="mock-history__meta">
                    <strong>{MODES.find((m) => m.value === item.mode)?.label || item.mode}</strong>
                    <span>{formatDate(item.createdAt)} · {item.questionsAnswered} answered</span>
                  </span>
                  {item.status === 'completed'
                    ? <span className={`mock-score-pill ${scoreTone(item.overallScore ?? 0, 100)}`}>{item.overallScore ?? 0}%</span>
                    : <span className="mock-score-pill resume">Resume</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

/* ------------------------------ Live chat ----------------------------- */

function Reveal({ title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`mock-reveal ${open ? 'is-open' : ''}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {title} <ChevronDown size={16} />
      </button>
      {open && <div className="mock-reveal__body">{children}</div>}
    </div>
  )
}

function FeedbackCard({ turn }) {
  return (
    <div className="mock-feedback">
      <div className="mock-feedback__top">
        <span className={`mock-score ${scoreTone(turn.score)}`}>{turn.score}<small>/10</small></span>
        <p>{turn.feedback}</p>
      </div>
      {turn.criteria && !turn.skipped && (
        <div className="mock-criteria">
          {CRITERIA.map(([key, label]) => (
            <div key={key} className="mock-criterion">
              <span>{label}</span>
              <div className="mock-bar"><div className={scoreTone(turn.criteria[key])} style={{ width: `${turn.criteria[key] * 10}%` }} /></div>
              <b>{turn.criteria[key]}</b>
            </div>
          ))}
        </div>
      )}
      {turn.improvedAnswer && !turn.skipped && turn.improvedAnswer !== turn.modelAnswer && (
        <Reveal title="Improved version of your answer"><p>{turn.improvedAnswer}</p></Reveal>
      )}
      {turn.modelAnswer && (
        <Reveal title="What a strong answer covers">
          {turn.intention && <p className="mock-muted"><b>Why they ask:</b> {turn.intention}</p>}
          <p>{turn.modelAnswer}</p>
        </Reveal>
      )}
    </div>
  )
}

function LiveInterview({ session, onAnswer, onSkip, onFinish, busy }) {
  const [answer, setAnswer] = useState('')
  const endRef = useRef(null)
  const turns = session.turns || []
  const current = turns.length && !isAnswered(turns[turns.length - 1]) ? turns[turns.length - 1] : null
  const mainAsked = turns.filter((t) => !t.isFollowUp).length
  const progress = session.totalQuestions ? Math.round(((mainAsked - (current && !current.isFollowUp ? 1 : 0)) / session.totalQuestions) * 100) : 0

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns.length, busy])

  const submit = async (event) => {
    event?.preventDefault()
    const text = answer.trim()
    if (!text || busy) return
    const ok = await onAnswer(text)
    if (ok) setAnswer('')
  }

  return (
    <section className="mock-live">
      <div className="mock-progress">
        <div className="mock-progress__label">
          <span>Question {Math.min(mainAsked, session.totalQuestions)} of {session.totalQuestions}</span>
          <button type="button" className="mock-link" onClick={onFinish} disabled={busy}><Flag size={15} /> End interview</button>
        </div>
        <div className="mock-bar mock-bar--large"><div style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="mock-chat" aria-live="polite">
        {turns.map((turn, index) => (
          <div key={index} className="mock-turn">
            <div className="mock-bubble mock-bubble--ai">
              <span className="mock-avatar"><Bot size={18} /></span>
              <div>
                <span className="mock-tag">{turn.isFollowUp ? 'Follow-up' : turn.type}</span>
                <p>{turn.question}</p>
              </div>
            </div>
            {isAnswered(turn) && (
              <>
                <div className="mock-bubble mock-bubble--user">
                  <div><p>{turn.skipped ? <em>Skipped</em> : turn.userAnswer}</p></div>
                  <span className="mock-avatar"><User size={18} /></span>
                </div>
                <FeedbackCard turn={turn} />
              </>
            )}
          </div>
        ))}
        {busy && (
          <div className="mock-bubble mock-bubble--ai mock-typing">
            <span className="mock-avatar"><Bot size={18} /></span>
            <div><p><LoaderCircle className="spin" size={16} /> Evaluating your answer…</p></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {current && (
        <form className="mock-composer" onSubmit={submit}>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(e) }}
            placeholder="Type your answer as you would say it in the interview…"
            maxLength={4000}
            rows={4}
            disabled={busy}
            aria-label="Your answer"
          />
          <div className="mock-composer__actions">
            <span className="mock-muted">{answer.length}/4000 · Ctrl+Enter to send</span>
            <div>
              <button type="button" className="mock-button mock-button--ghost" onClick={onSkip} disabled={busy}><SkipForward size={16} /> Skip</button>
              <button type="submit" className="mock-button mock-button--primary" disabled={busy || !answer.trim()}><Send size={16} /> Submit</button>
            </div>
          </div>
        </form>
      )}
    </section>
  )
}

/* ------------------------------ Scorecard ----------------------------- */

function Scorecard({ session, interviewId, onRestart }) {
  const score = session.overallScore ?? 0
  const summary = session.summary || {}
  const answered = (session.turns || []).filter(isAnswered)

  return (
    <section className="mock-scorecard">
      <div className="mock-card mock-result">
        <div className={`mock-ring ${scoreTone(score, 100)}`} style={{ '--value': score }}>
          <span>{score}<small>%</small></span>
        </div>
        <div>
          <p className="mock-eyebrow"><Trophy size={15} /> Interview complete</p>
          <h1>{summary.verdict || 'Here is how you did.'}</h1>
          <p className="mock-muted">{answered.length} answer{answered.length === 1 ? '' : 's'} · {MODES.find((m) => m.value === session.mode)?.label} interview</p>
        </div>
      </div>

      <div className="mock-grid">
        <div className="mock-card">
          <h2>Strengths</h2>
          {summary.strengths?.length ? <ul className="mock-list good">{summary.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul> : <p className="mock-muted">Answer more questions to see your strengths.</p>}
        </div>
        <div className="mock-card">
          <h2>Improve next time</h2>
          {summary.improvements?.length ? <ul className="mock-list low">{summary.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul> : <p className="mock-muted">Nothing major — great job.</p>}
        </div>
      </div>

      {summary.weakSkills?.length > 0 && (
        <div className="mock-card">
          <h2>Practise these skills</h2>
          <div className="mock-skills">
            {summary.weakSkills.map((skill) => (
              <Link key={skill} className="mock-chip is-link" to={`/interview/${interviewId}/skill-gap/${encodeURIComponent(skill)}`}>{skill} →</Link>
            ))}
          </div>
        </div>
      )}

      <div className="mock-card">
        <h2>Question review</h2>
        <div className="mock-review">
          {answered.map((turn, index) => (
            <Reveal
              key={index}
              title={<><span className={`mock-score-pill ${scoreTone(turn.score)}`}>{turn.score}/10</span> {turn.isFollowUp ? '↳ ' : ''}{turn.question}</>}
            >
              <p className="mock-muted"><b>Your answer:</b> {turn.skipped ? 'Skipped' : turn.userAnswer}</p>
              <FeedbackCard turn={turn} />
            </Reveal>
          ))}
        </div>
      </div>

      <div className="mock-actions">
        <button className="mock-button mock-button--primary" onClick={onRestart}><RotateCcw size={16} /> Practise again</button>
        <Link className="mock-button mock-button--ghost" to={`/interview/${interviewId}`}>Back to report</Link>
      </div>
    </section>
  )
}

/* -------------------------------- Page -------------------------------- */

export const MockInterview = () => {
  const { interviewId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const sessionId = searchParams.get('session')

  const [report, setReport] = useState(null)
  const [history, setHistory] = useState([])
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const loadHistory = useCallback(async () => {
    try {
      const data = await getMockInterviewsForReport({ reportId: interviewId })
      setHistory(data.mockInterviews || [])
    } catch {
      setHistory([])
    }
  }, [interviewId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getInterviewReportById({ interviewId })
      .then((data) => { if (!cancelled) setReport(data.interviewReport) })
      .catch((err) => { if (!cancelled) setError(errorMessage(err, 'Could not load this interview report.')) })
      .finally(() => { if (!cancelled) setLoading(false) })
    loadHistory()
    return () => { cancelled = true }
  }, [interviewId, loadHistory])

  // Load a session from the URL (?session=...) so refreshes and history links work.
  useEffect(() => {
    if (!sessionId) { setSession(null); return }
    if (session?._id === sessionId) return
    getMockInterview({ sessionId })
      .then((data) => setSession(data.mockInterview))
      .catch((err) => { setError(errorMessage(err, 'Could not load this mock interview.')); setSearchParams({}) })
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (action, fallback) => {
    setBusy(true)
    setError('')
    try {
      const data = await action()
      setSession(data.mockInterview)
      if (data.mockInterview?.status === 'completed') loadHistory()
      return data.mockInterview
    } catch (err) {
      setError(errorMessage(err, fallback))
      return null
    } finally {
      setBusy(false)
    }
  }

  const handleStart = async ({ mode, count }) => {
    const started = await run(() => startMockInterview({ reportId: interviewId, mode, count }), 'Could not start the interview.')
    if (started) setSearchParams({ session: started._id })
  }
  const handleAnswer = async (answer) => Boolean(await run(() => answerMockInterview({ sessionId: session._id, answer }), 'Could not submit your answer. Please try again.'))
  const handleSkip = () => run(() => skipMockQuestion({ sessionId: session._id }), 'Could not skip this question.')
  const handleFinish = () => {
    if (!window.confirm('End the interview now and see your scorecard?')) return
    run(() => finishMockInterview({ sessionId: session._id }), 'Could not finish the interview.')
  }
  const handleRestart = () => { setSession(null); setSearchParams({}) }

  let content
  if (loading) {
    content = <div className="mock-state"><LoaderCircle className="spin" size={28} /><p>Loading your interview…</p></div>
  } else if (!report) {
    content = <div className="mock-state"><h1>Interview unavailable</h1><p>{error || 'We could not find this interview report.'}</p></div>
  } else if (session?.status === 'completed') {
    content = <Scorecard session={session} interviewId={interviewId} onRestart={handleRestart} />
  } else if (session) {
    content = <LiveInterview session={session} onAnswer={handleAnswer} onSkip={handleSkip} onFinish={handleFinish} busy={busy} />
  } else if (sessionId) {
    content = <div className="mock-state"><LoaderCircle className="spin" size={28} /><p>Loading session…</p></div>
  } else {
    content = <SetupScreen report={report} history={history} onStart={handleStart} onOpen={(id) => setSearchParams({ session: id })} starting={busy} />
  }

  return (
    <main className="mock-page">
      <div className="mock-page__glow mock-page__glow--one" />
      <div className="mock-page__glow mock-page__glow--two" />
      <div className="mock-container">
        <Link className="mock-back" to={`/interview/${interviewId}`}><ArrowLeft size={16} /> Back to interview report</Link>
        {error && report && <div className="mock-error" role="alert">{error}</div>}
        {content}
      </div>
    </main>
  )
}
