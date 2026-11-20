import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createExperience } from '../services/experience.api'
import '../style/experiences.scss'

export const ExperienceForm = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ company: '', role: '', experience: '' })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  const submit = async (event) => {
    event.preventDefault(); setMessage('')
    if (!form.company.trim() || !form.role.trim() || !form.experience.trim()) return setMessage('Please complete all fields before sharing.')
    setSubmitting(true)
    try { await createExperience(form); navigate('/experiences') } catch (error) { setMessage(error.response?.data?.message || 'Unable to share your experience. Please try again.') } finally { setSubmitting(false) }
  }
  return <main className="experiences-page"><div className="experiences-container form-page-container"><nav className="community-nav"><button type="button" onClick={() => navigate('/experiences')}>← Back to community</button></nav><section className="share-card share-card--page"><p className="community-eyebrow">Contribute</p><h1>Share your interview experience</h1><p>Your original experience is preserved, then organized into rounds and topics to help the community prepare.</p><form onSubmit={submit}><div className="field-row"><label>Company<input name="company" value={form.company} onChange={change} maxLength="100" placeholder="e.g. Google" /></label><label>Role<input name="role" value={form.role} onChange={change} maxLength="100" placeholder="e.g. Frontend Developer" /></label></div><label>What was your interview like?<textarea name="experience" value={form.experience} onChange={change} maxLength="10000" placeholder="Describe the rounds, questions, what went well, and what you would do differently..." /></label><div className="form-footer"><small>{form.experience.length}/10000</small><button type="submit" disabled={submitting}>{submitting ? 'Structuring and sharing...' : 'Share experience'}</button></div></form>{message ? <p className="community-message">{message}</p> : null}</section></div></main>
}
