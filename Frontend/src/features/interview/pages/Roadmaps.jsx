import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import '../style/roadmaps.scss'
import { generateRoadmap, getRoadmap, getRoadmaps, regenerateRoadmap, updateRoadmapTask, updateRoadmapTaskTime } from '../services/roadmap.api'

const today = new Date().toISOString().slice(0, 10)

export const Roadmaps = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [roadmaps, setRoadmaps] = useState([])
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [preferences, setPreferences] = useState({ durationInDays: 28, dailyStudyHours: 2, startDate: today })

  const loadRoadmaps = useCallback(async () => {
    const data = await getRoadmaps()
    setRoadmaps(data.roadmaps || [])
    return data.roadmaps || []
  }, [])

  const selectRoadmap = useCallback(async (id) => {
    setLoading(true)
    try { setDetail(await getRoadmap(id)) } catch (err) { setError(err.response?.data?.message || 'Unable to load this roadmap.') } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    let cancelled = false
    getRoadmaps()
      .then((data) => {
        if (!cancelled) setRoadmaps(data.roadmaps || [])
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load learning roadmaps.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const createRoadmap = async (reportId = searchParams.get('reportId')) => {
    if (!reportId) { setError('Open an interview report and select “Create learning roadmap” to generate a personalized plan.'); return }
    setCreating(true); setError('')
    try {
      const result = await generateRoadmap({ reportId, ...preferences })
      await loadRoadmaps()
      setDetail({ roadmap: result.roadmap, progress: result.progress, tasks: [] })
      await selectRoadmap(result.roadmap._id)
      navigate('/roadmaps', { replace: true })
    } catch (err) { setError(err.response?.data?.message || 'Unable to generate a roadmap. Seed the learning knowledge base first.') } finally { setCreating(false) }
  }

  const refreshDetail = async () => {
    if (detail?.roadmap?._id) await selectRoadmap(detail.roadmap._id)
    await loadRoadmaps()
  }

  const setTaskStatus = async (task, status) => {
    try { await updateRoadmapTask(detail.roadmap._id, task._id, status); await refreshDetail() } catch (err) { setError(err.response?.data?.message || 'Unable to update the task.') }
  }

  const saveTime = async (task, value) => {
    try { await updateRoadmapTaskTime(detail.roadmap._id, task._id, Number(value)); await refreshDetail() } catch (err) { setError(err.response?.data?.message || 'Unable to save time spent.') }
  }

  const reschedule = async () => {
    try { await regenerateRoadmap(detail.roadmap._id, preferences); await refreshDetail() } catch (err) { setError(err.response?.data?.message || 'Unable to reschedule this roadmap.') }
  }

  const tasksByDay = (detail?.tasks || []).reduce((days, task) => ({ ...days, [task.dayNumber]: [...(days[task.dayNumber] || []), task] }), {})

  return <main className="roadmaps-page">
    <div className="roadmaps-container">
      <header className="roadmaps-header"><div><p className="roadmaps-eyebrow">Personalized learning</p><h1>Learning Roadmaps</h1><p>Build skills that are missing or need improvement—without repeating skills you already match.</p></div></header>
      <section className="roadmap-preferences"><label>Duration (days)<input type="number" min="1" max="365" value={preferences.durationInDays} onChange={(e) => setPreferences((old) => ({ ...old, durationInDays: e.target.value }))} /></label><label>Daily study hours<input type="number" min="0.25" max="16" step="0.25" value={preferences.dailyStudyHours} onChange={(e) => setPreferences((old) => ({ ...old, dailyStudyHours: e.target.value }))} /></label><label>Start date<input type="date" value={preferences.startDate} onChange={(e) => setPreferences((old) => ({ ...old, startDate: e.target.value }))} /></label>{searchParams.get('reportId') ? <button className="roadmap-primary" onClick={() => createRoadmap()} disabled={creating}>{creating ? 'Generating…' : 'Generate roadmap'}</button> : null}</section>
      {error ? <p className="roadmap-error">{error}</p> : null}
      <div className="roadmaps-layout">
        <aside className="roadmap-list"><h2>Your roadmaps</h2>{loading ? <p>Loading…</p> : roadmaps.length ? roadmaps.map((roadmap) => <button key={roadmap._id} className={detail?.roadmap?._id === roadmap._id ? 'selected' : ''} onClick={() => selectRoadmap(roadmap._id)}><strong>{roadmap.targetRole}</strong><span>{roadmap.overallProgress}% complete</span></button>) : <p>No roadmaps yet. Generate one from an interview report.</p>}</aside>
        <section className="roadmap-detail">{detail ? <><div className="roadmap-overview"><div><p className="roadmaps-eyebrow">{detail.roadmap.targetRole}</p><h2>{detail.roadmap.title}</h2><p>{detail.roadmap.durationInDays} days · {detail.roadmap.dailyStudyHours} hours/day · target {new Date(detail.roadmap.targetDate).toLocaleDateString()}</p></div><div className="progress-ring"><strong>{detail.progress.overallProgress}%</strong><span>complete</span></div></div><div className="roadmap-skills"><h3>Skills being learned</h3>{detail.roadmap.skillsToLearn.map((skill) => <span key={skill.name} className={`roadmap-skill ${skill.importance}`}>{skill.name} · {skill.learningPathStatus === 'available' ? skill.importance : 'learning path needed'}</span>)}</div><div className="roadmap-actions"><button className="roadmap-secondary" onClick={reschedule}>Reschedule remaining tasks</button><span>{detail.progress.completedTasks}/{detail.progress.totalTasks} tasks · {detail.progress.timeSpent.toFixed(1)} study hours logged</span></div>{Object.entries(tasksByDay).map(([day, tasks]) => <section className="roadmap-day" key={day}><h3>Day {day}</h3>{tasks.map((task) => <article className={`roadmap-task ${task.status}`} key={task._id}><div><h4>{task.title}</h4><p>{task.description}</p><small>{task.estimatedHours}h planned · {new Date(task.scheduledDate).toLocaleDateString()}</small>{task.resources?.length ? <div className="task-resources">{task.resources.map((resource) => <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer">{resource.title} ↗</a>)}</div> : null}</div><div className="task-controls"><select value={task.status} onChange={(e) => setTaskStatus(task, e.target.value)}><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="skipped">Skipped</option></select><label>Hours<input type="number" min="0" step="0.25" defaultValue={task.timeSpent} onBlur={(e) => saveTime(task, e.target.value)} /></label></div></article>)}</section>)}</> : <div className="roadmap-empty"><h2>Select a roadmap</h2><p>Generate a roadmap from an interview report to schedule only your missing and partially matched skills.</p></div>}</section>
      </div>
    </div>
  </main>
}
