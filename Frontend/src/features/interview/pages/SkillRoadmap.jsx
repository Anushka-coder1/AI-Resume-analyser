import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import '../style/skill-roadmap.scss'
import { useInterview } from '../hooks/useInterview'

const normalise = (value = '') => value.toLowerCase().replace(/[^a-z0-9+#.]/g, '')

export const SkillRoadmap = () => {
  const { interviewId, skillName } = useParams()
  const navigate = useNavigate()
  const { report, loading, error, getReportById } = useInterview()
  const skill = skillName || 'this skill'

  useEffect(() => {
    if (interviewId && report?._id !== interviewId) {
      getReportById({ interviewId }).catch(() => {})
    }
  }, [getReportById, interviewId, report?._id])

  if (loading && !report) {
    return <main className="skill-roadmap-page"><section className="skill-roadmap-state"><div className="spinner" /><h1>Building your learning roadmap...</h1></section></main>
  }

  if (!report) {
    return (
      <main className="skill-roadmap-page">
        <section className="skill-roadmap-state">
          <h1>Roadmap unavailable</h1>
          <p>{error || 'We could not find the interview report for this skill gap.'}</p>
          <button className="roadmap-button" onClick={() => navigate('/')}>Back to Home</button>
        </section>
      </main>
    )
  }

  const requestedSkill = normalise(skill)
  const relevantDays = (report.preparationPlan || []).filter((day) =>
    normalise(`${day.focus} ${(day.task || []).join(' ')}`).includes(requestedSkill),
  )
  const roadmap = relevantDays.length ? relevantDays : report.preparationPlan || []
  const gap = (report.skillGaps || []).find((item) => normalise(item.skill) === requestedSkill)

  return (
    <main className="skill-roadmap-page">
      <div className="skill-roadmap-page__glow skill-roadmap-page__glow--one" />
      <div className="skill-roadmap-page__glow skill-roadmap-page__glow--two" />
      <div className="skill-roadmap-container">
        <Link className="back-link" to={`/interview/${interviewId}`}>← Back to interview dashboard</Link>
        <header className="skill-roadmap-header">
          <p className="roadmap-eyebrow">Personalized skill-gap roadmap</p>
          <h1>Learn <span>{skill}</span></h1>
          <p>Use this plan alongside your interview preparation to turn this gap into a strength for {report.title}.</p>
          {gap ? <span className={`roadmap-severity severity ${gap.severity}`}>{gap.severity} priority</span> : null}
        </header>

        {roadmap.length ? (
          <section className="roadmap-timeline" aria-label={`${skill} learning roadmap`}>
            {roadmap.map((day, index) => (
              <article className="roadmap-step" key={`${day.day}-${index}`}>
                <div className="roadmap-step__day">Day {day.day}</div>
                <div className="roadmap-step__content">
                  <p className="roadmap-step__number">Step {index + 1}</p>
                  <h2>{day.focus}</h2>
                  <ul>{(day.task || []).map((task, taskIndex) => <li key={taskIndex}>{task}</li>)}</ul>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="skill-roadmap-state">
            <h2>No roadmap has been generated yet</h2>
            <p>Generate a new interview report to receive a day-by-day preparation plan.</p>
          </section>
        )}
      </div>
    </main>
  )
}
