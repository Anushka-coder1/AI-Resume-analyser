import { useState } from 'react'
import { InterviewContext } from './interview.context'

export const InterviewProvider = ({ children }) => {
  const [report, setReport] = useState(null)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  return (
    <InterviewContext.Provider
      value={{
        report,
        setReport,
        reports,
        setReports,
        loading,
        setLoading,
        error,
        setError,
      }}
    >
      {children}
    </InterviewContext.Provider>
  )
}
