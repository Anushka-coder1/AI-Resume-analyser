import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInterview } from '../hooks/useInterview'
import '../style/home.scss'

export const MyInterviews = () => {
  const navigate = useNavigate()
  const { reports, loading, error, getReports } = useInterview()
  useEffect(() => { getReports().catch(() => {}) }, [getReports])

  return <main className="home"><div className="home-container"><section className="history-panel"><div className="history-header"><h1>My Interviews</h1><p>Open a saved preparation report or create a new one from your dashboard.</p></div>{error ? <p className="panel-message error">{error}</p> : null}{loading && !reports.length ? <p className="feed-status">Loading your reports...</p> : <div className="history-grid">{reports.length ? reports.map((report) => <button key={report._id} type="button" className="history-card" onClick={() => navigate(`/interview/${report._id}`)}><div><p className="history-title">{report.title}</p><p className="history-date">{new Date(report.createdAt).toLocaleDateString()}</p></div><span className="history-score">{report.matchScore}%</span></button>) : <div className="history-empty"><h3>No reports yet</h3><p>Create your first AI interview report from the dashboard.</p></div>}</div>}</section></div></main>
}
