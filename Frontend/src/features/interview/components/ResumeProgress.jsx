import { useEffect, useState } from 'react'
import { getInterviewReportVersions } from '../services/interview.api'

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

const formatDelta = (delta) => (delta > 0 ? `+${delta}` : `${delta}`)

/**
 * Match score of every resume version analysed against the same job description.
 * Reloads whenever the viewed report changes (including right after a re-upload).
 */
export const ResumeProgress = ({ currentId, onSelect }) => {
  // `forId` records which report the loaded data belongs to.
  const [result, setResult] = useState({ forId: null, versions: [], error: false })

  useEffect(() => {
    if (!currentId) return
    let cancelled = false

    getInterviewReportVersions({ interviewId: currentId })
      .then((data) => {
        if (!cancelled) setResult({ forId: currentId, versions: data.versions || [], error: false })
      })
      .catch(() => {
        if (!cancelled) setResult((prev) => ({ ...prev, forId: currentId, error: true }))
      })

    return () => {
      cancelled = true
    }
  }, [currentId])

  const versions = result.versions
  const status = result.forId !== currentId ? 'loading' : result.error ? 'error' : 'ready'

  if (status === 'error') {
    return (
      <section className="progress-card">
        <p className="progress-muted">Couldn&apos;t load resume versions.</p>
      </section>
    )
  }

  if (status === 'loading' && versions.length === 0) {
    return (
      <section className="progress-card">
        <p className="progress-muted">Loading resume versions…</p>
      </section>
    )
  }

  const currentIndex = Math.max(0, versions.findIndex((item) => item._id === currentId))
  const current = versions[currentIndex]
  const previous = currentIndex > 0 ? versions[currentIndex - 1] : null
  const first = versions[0]
  const latest = versions[versions.length - 1]

  const gained = previous
    ? current.matchedSkills.filter((skill) => !previous.matchedSkills.includes(skill))
    : []
  const lost = previous
    ? previous.matchedSkills.filter((skill) => !current.matchedSkills.includes(skill))
    : []
  const overallDelta = latest && first ? latest.matchScore - first.matchScore : 0

  return (
    <section className="progress-card">
      <div className="progress-header">
        <div>
          <span className="match-label">Resume progress · same job description</span>
          <h3>
            {versions.length === 1
              ? 'Version 1'
              : `${versions.length} versions · v1 ${first.matchScore}% → v${latest.version} ${latest.matchScore}%`}
          </h3>
        </div>
        {versions.length > 1 && (
          <span className={`delta-pill ${overallDelta > 0 ? 'up' : overallDelta < 0 ? 'down' : 'flat'}`}>
            {formatDelta(overallDelta)} pts overall
          </span>
        )}
      </div>

      <div className="progress-body">
        <div className="progress-chart" role="list" aria-label="Match score by resume version">
          <div className="chart-grid" aria-hidden="true">
            <span data-label="100%"></span>
            <span data-label="50%"></span>
            <span data-label="0%"></span>
          </div>

          <div className="chart-bars">
            {versions.map((item) => {
              const isCurrent = item._id === currentId
              return (
                <button
                  key={item._id}
                  type="button"
                  role="listitem"
                  className={`chart-col${isCurrent ? ' current' : ''}`}
                  onClick={() => !isCurrent && onSelect(item._id)}
                  aria-label={`Version ${item.version}: ${item.matchScore}% match, ${item.matchedSkills.length} of ${item.totalSkills} skills${isCurrent ? ' (viewing)' : ''}`}
                >
                  <span className="chart-track">
                    {isCurrent && <span className="chart-value">{item.matchScore}%</span>}
                    <span className="chart-bar" style={{ height: `${Math.max(item.matchScore, 2)}%` }}></span>
                  </span>
                  <span className="chart-x">v{item.version}</span>

                  <span className="chart-tooltip" role="tooltip">
                    <strong>Version {item.version}{isCurrent ? ' · viewing' : ''}</strong>
                    <span>{item.matchScore}% match</span>
                    <span>{item.matchedSkills.length} / {item.totalSkills} skills</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="progress-details">
          {versions.length === 1 ? (
            <p className="progress-muted">
              This is your first resume for this job description. Improve your resume and use
              <strong> Re-upload Resume</strong> to see how your match score changes version by version.
            </p>
          ) : previous ? (
            <>
              <p className="progress-compare">
                <strong>v{current.version}</strong> vs v{previous.version}:{' '}
                <span className={current.matchScore - previous.matchScore >= 0 ? 'text-up' : 'text-down'}>
                  {formatDelta(current.matchScore - previous.matchScore)} pts
                </span>
              </p>
              {gained.length === 0 && lost.length === 0 ? (
                <p className="progress-muted">Same skills matched as the previous version.</p>
              ) : (
                <ul className="skill-diff">
                  {gained.map((skill) => (
                    <li key={`g-${skill}`} className="gained">+ {skill}</li>
                  ))}
                  {lost.map((skill) => (
                    <li key={`l-${skill}`} className="lost">− {skill}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="progress-muted">
              You&apos;re viewing the first version. Click a later bar to see what changed.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
