import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInterview } from '../hooks/useInterview'
import '../style/home.scss'

export const MyInterviews = () => {
  const navigate = useNavigate()
  const { reports, loading, error, getReports } = useInterview()
  const [message, setMessage] = useState('')
  useEffect(() => {
    getReports().catch(() => {})
  }, [getReports])

  return (
    <main className="home">
      <div className="home-container">
        <section className="history-panel">
          <div className="history-header">
            <h1>Reports</h1>
            <p>Open, rename, or remove saved preparation reports.</p>
          </div>
          {error || message ? (
            <p className="panel-message error">{error || message}</p>
          ) : null}
          {loading && !reports.length ? (
            <p className="feed-status">Loading your reports...</p>
          ) : (
            <div className="history-grid">
              {reports.length ? (
                reports.map((report) => (
                  <article key={report._id} className="history-card">
                    <button
                      type="button"
                      className="history-card__open"
                      onClick={() => navigate(`/interview/${report._id}`)}
                    >
                      <div>
                        <p className="history-title">{report.title}</p>
                        <p className="history-date">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="history-score">
                        {report.matchScore}%
                      </span>
                    </button>
                  </article>
                ))
              ) : (
                <div className="history-empty">
                  <h3>No reports yet</h3>
                  <p>
                    Create your first AI interview report from the dashboard.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
