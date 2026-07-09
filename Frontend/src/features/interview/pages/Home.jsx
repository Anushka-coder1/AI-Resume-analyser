import '../style/home.scss'

export const Home = () => {
  return (
    <main className="home">
      {/* Background Blur Effects */}
      <div className="bg-circle bg-circle-1"></div>
      <div className="bg-circle bg-circle-2"></div>

      <div className="home-container">
        <section className="hero">
          <h1>
            Create Your Custom <span> Interview Plan</span>
          </h1>

          <p>
            Let AI generate personalized interview questions, identify skill
            gaps and create your interview preparation roadmap.
          </p>
        </section>

        <section className="main-card">
          {/* LEFT SIDE */}

          <div className="left-panel">
            <div className="section-header">
              <div className="section-icon">💼</div>

              <div>
                <h3>Target Job Description</h3>

                <p>
                  Paste the complete job description for better AI analysis.
                </p>
              </div>
            </div>

            <textarea
              id="jobDescription"
              className="jobDescription"
              placeholder={`Example:

Senior Frontend Engineer

Requirements

• React.js
• TypeScript
• Node.js
• REST APIs
• Problem Solving
• System Design
• Team Collaboration`}
            />

            <div className="character-count">0 / 5000 Characters</div>
          </div>

          {/* RIGHT SIDE */}

          <div className="right-panel">
            <div className="section-header">
              <div className="section-icon">👤</div>

              <div>
                <h3>Your Profile</h3>

                <p>Upload your resume or describe yourself.</p>
              </div>
            </div>

            {/* Resume Upload */}

            <div className="upload-section">
              <label htmlFor="resume">
                Upload Resume
                <span> (Recommended)</span>
              </label>

              <label htmlFor="resume" className="upload-box">
                <div className="upload-icon">☁</div>

                <h4>Click to Upload</h4>

                <p>or Drag & Drop</p>

                <small>PDF (Max 5MB)</small>
              </label>

              <input type="file" id="resume" accept=".pdf" />
            </div>

            {/* Divider */}

            <div className="divider">
              <span>OR</span>
            </div>

            {/* Self Description */}

            <div className="self-description-section">
              <label htmlFor="selfDescription">Quick Self Description</label>

              <textarea
                id="selfDescription"
                className="selfDescription"
                placeholder={`Briefly describe yourself...

• Years of experience
• Technical skills
• Projects
• Achievements
• Career Goals`}
              />
            </div>

            {/* Info */}

            <div className="info-box">
              <span>ℹ</span>

              <p>
                Either <strong>Resume</strong> or{' '}
                <strong>Self Description</strong> is required for generating
                your personalized interview report.
              </p>
            </div>

            {/* Button */}

            <button className="generate-btn">
              ✨ Generate AI Interview Report
            </button>
          </div>
        </section>


        {/* ================= FOOTER ================= */}

        <footer className="footer">
          <a href="#">Privacy Policy</a>

          <a href="#">Terms of Service</a>

          <a href="#">Help Center</a>
        </footer>
      </div>
    </main>
  )
}
