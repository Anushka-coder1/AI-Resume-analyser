import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import '../style/roadmaps.scss'
import {
  deleteRoadmap,
  generateRoadmap,
  getRoadmap,
  getRoadmaps,
  regenerateRoadmap,
  updateRoadmap,
  updateRoadmapTask,
  updateRoadmapTaskTime,
} from '../services/roadmap.api'

const dateValue = (value) => new Date(value).toISOString().slice(0, 10)

export const Roadmaps = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [roadmaps, setRoadmaps] = useState([])
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [settings, setSettings] = useState(null)

  const loadRoadmaps = useCallback(async () => {
    const data = await getRoadmaps()
    setRoadmaps(data.roadmaps || [])
    return data.roadmaps || []
  }, [])
  const selectRoadmap = useCallback(async (id) => {
    setLoading(true)
    try {
      const data = await getRoadmap(id)
      setDetail(data)
      setSettings({
        title: data.roadmap.title,
        startDate: dateValue(data.roadmap.startDate),
        targetDate: dateValue(data.roadmap.targetDate),
        durationInDays: data.roadmap.durationInDays,
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load this roadmap.')
    } finally {
      setLoading(false)
    }
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
    return () => {
      cancelled = true
    }
  }, [])
  useEffect(() => {
    const id = searchParams.get('roadmapId')
    if (!id) return undefined
    let cancelled = false
    getRoadmap(id)
      .then((data) => {
        if (!cancelled) {
          setDetail(data)
          setSettings({
            title: data.roadmap.title,
            startDate: dateValue(data.roadmap.startDate),
            targetDate: dateValue(data.roadmap.targetDate),
            durationInDays: data.roadmap.durationInDays,
          })
        }
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err.response?.data?.message || 'Unable to load this roadmap.',
          )
      })
    return () => {
      cancelled = true
    }
  }, [searchParams])

  const refresh = async () => {
    if (detail?.roadmap?._id) await selectRoadmap(detail.roadmap._id)
    await loadRoadmaps()
  }
  const createRoadmap = async () => {
    const reportId = searchParams.get('reportId')
    const skillName = searchParams.get('skill')
    if (!reportId || !skillName) return
    try {
      const result = await generateRoadmap({ reportId, skillName })
      navigate(`/roadmaps?roadmapId=${result.roadmap._id}`, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to generate roadmap.')
    }
  }
  const saveSettings = async () => {
    try {
      await updateRoadmap(detail.roadmap._id, settings)
      await refresh()
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to save roadmap settings.',
      )
    }
  }
  const regenerate = async () => {
    try {
      await regenerateRoadmap(detail.roadmap._id, {})
      await refresh()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to regenerate roadmap.')
    }
  }
  const removeRoadmap = async () => {
    if (
      !window.confirm(
        `Delete “${detail.roadmap.title}”? This cannot be undone.`,
      )
    )
      return
    try {
      await deleteRoadmap(detail.roadmap._id)
      setDetail(null)
      setSettings(null)
      await loadRoadmaps()
      navigate('/roadmaps', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete roadmap.')
    }
  }
  const setTaskStatus = async (task, status) => {
    try {
      await updateRoadmapTask(detail.roadmap._id, task._id, status)
      await refresh()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update task.')
    }
  }
  const saveTime = async (task, value) => {
    try {
      await updateRoadmapTaskTime(detail.roadmap._id, task._id, Number(value))
      await refresh()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save time.')
    }
  }
  const tasksByDay = (detail?.tasks || []).reduce(
    (days, task) => ({
      ...days,
      [task.dayNumber]: [...(days[task.dayNumber] || []), task],
    }),
    {},
  )

  return (
    <main className="roadmaps-page">
      <div className="roadmaps-container">
        <header className="roadmaps-header">
          <p className="roadmaps-eyebrow">Personalized learning</p>
          <h1>Learning Roadmaps</h1>
        </header>
        {searchParams.get('skill') && !detail ? (
          <button className="roadmap-primary" onClick={createRoadmap}>
            Generate {searchParams.get('skill')} roadmap
          </button>
        ) : null}
        {error ? <p className="roadmap-error">{error}</p> : null}
        <div className="roadmaps-layout">
          <aside className="roadmap-list">
            <h2>Your roadmaps</h2>
            {loading && !roadmaps.length ? (
              <p>Loading…</p>
            ) : (
              roadmaps.map((roadmap) => (
                <button
                  key={roadmap._id}
                  className={
                    detail?.roadmap?._id === roadmap._id ? 'selected' : ''
                  }
                  onClick={() => selectRoadmap(roadmap._id)}
                >
                  <strong>{roadmap.title}</strong>
                  <span>{roadmap.overallProgress}% complete</span>
                </button>
              ))
            )}
          </aside>
          <section className="roadmap-detail">
            {detail && settings ? (
              <>
                <div className="roadmap-overview">
                  <div>
                    <p className="roadmaps-eyebrow">
                      {detail.roadmap.targetRole}
                    </p>
                    <h2>{detail.roadmap.title}</h2>
                  </div>
                  <div className="progress-ring">
                    <strong>{detail.progress.overallProgress}%</strong>
                    <span>complete</span>
                  </div>
                </div>
                <section className="roadmap-preferences roadmap-settings">
                  <label>
                    Roadmap name
                    <input
                      value={settings.title}
                      onChange={(e) =>
                        setSettings({ ...settings, title: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Start date
                    <input
                      type="date"
                      value={settings.startDate}
                      onChange={(e) =>
                        setSettings({ ...settings, startDate: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Target date
                    <input
                      type="date"
                      value={settings.targetDate}
                      onChange={(e) =>
                        setSettings({ ...settings, targetDate: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Duration (days)
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={settings.durationInDays}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          durationInDays: e.target.value,
                        })
                      }
                    />
                  </label>
                  <button className="roadmap-secondary" onClick={saveSettings}>
                    Save changes
                  </button>
                </section>
                <div className="roadmap-actions">
                  <button className="roadmap-primary" onClick={regenerate}>
                    Regenerate roadmap
                  </button>
                  <button className="roadmap-primary" onClick={removeRoadmap}>
                    Delete roadmap
                  </button>
                  <span>
                    {detail.progress.completedTasks}/
                    {detail.progress.totalTasks} tasks ·{' '}
                    {detail.progress.timeSpent.toFixed(1)} hours logged
                  </span>
                </div>
                <div className="roadmap-skills">
                  <h3>Skills being learned</h3>
                  {detail.roadmap.skillsToLearn.map((skill) => (
                    <span
                      key={skill.name}
                      className={`roadmap-skill ${skill.importance}`}
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
                {Object.entries(tasksByDay).map(([day, tasks]) => (
                  <section className="roadmap-day" key={day}>
                    <h3>Day {day}</h3>
                    {tasks.map((task) => (
                      <article
                        className={`roadmap-task ${task.status}`}
                        key={task._id}
                      >
                        <div>
                          <h4>{task.title}</h4>
                          <p>{task.description}</p>
                          <small>{task.estimatedHours}h planned</small>
                          {task.resources?.length ? (
                            <div className="task-resources">
                              {task.resources.map((resource) => (
                                <a
                                  key={resource.url}
                                  href={resource.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {resource.title} ↗
                                </a>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="task-controls">
                          <select
                            value={task.status}
                            onChange={(e) =>
                              setTaskStatus(task, e.target.value)
                            }
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In progress</option>
                            <option value="completed">Completed</option>
                            <option value="skipped">Skipped</option>
                          </select>
                          <label>
                            Hours
                            <input
                              type="number"
                              min="0"
                              step="0.25"
                              defaultValue={task.timeSpent}
                              onBlur={(e) => saveTime(task, e.target.value)}
                            />
                          </label>
                        </div>
                      </article>
                    ))}
                  </section>
                ))}
              </>
            ) : (
              <div className="roadmap-empty">
                <h2>Select a roadmap</h2>
                <p>
                  Click a skill gap in an interview to generate its roadmap.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
