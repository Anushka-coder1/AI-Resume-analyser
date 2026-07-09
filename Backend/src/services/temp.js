const resume = {
  name: "Rahul Sharma",
  email: "rahul.sharma@example.com",
  phone: "+91-9876543210",
  location: "Bengaluru, India",

  education: [
    {
      degree: "Bachelor of Technology in Computer Science",
      college: "ABC Institute of Technology",
      cgpa: "8.7/10",
      year: "2025",
    },
  ],

  skills: [
    "JavaScript",
    "React.js",
    "Node.js",
    "Express.js",
    "MongoDB",
    "HTML",
    "CSS",
    "Tailwind CSS",
    "Git",
    "REST APIs",
    "SQL",
  ],

  experience: [
    {
      company: "TechNova Solutions",
      role: "Frontend Developer Intern",
      duration: "Jan 2025 - Jun 2025",
      responsibilities: [
        "Developed responsive React components.",
        "Integrated REST APIs with frontend.",
        "Collaborated with backend developers.",
        "Improved website performance by 20%.",
      ],
    },
  ],

  projects: [
    {
      title: "AI Resume Analyzer",
      description:
        "Developed a MERN application that analyzes resumes using Google's Gemini API and provides ATS score, strengths, weaknesses, and improvement suggestions.",
    },
    {
      title: "Chat Application",
      description:
        "Built a real-time chat application using Socket.io and MongoDB.",
    },
  ],

  certifications: [
    "JavaScript Algorithms",
    "React Fundamentals",
    "MongoDB Basics",
  ],
};

const selfDescription =
  "I am a passionate software developer with strong problem-solving skills and a keen interest in full-stack web development. I enjoy learning new technologies, collaborating with teams, and building scalable applications. I have experience working with the MERN stack and integrating AI APIs into web applications. I am eager to contribute to innovative projects while continuously improving my technical and communication skills.";

const jobDescription = {
  title: "Full Stack MERN Developer",
  company: "InnovateX Technologies",
  experienceRequired: "0-2 Years",
  location: "Bengaluru, India",

  requiredSkills: [
    "JavaScript",
    "React.js",
    "Node.js",
    "Express.js",
    "MongoDB",
    "REST APIs",
    "Git",
    "HTML",
    "CSS",
  ],

  preferredSkills: [
    "TypeScript",
    "Docker",
    "AWS",
    "CI/CD",
    "Redis",
  ],

  responsibilities: [
    "Develop scalable web applications.",
    "Build reusable React components.",
    "Design RESTful APIs.",
    "Collaborate with UI/UX designers.",
    "Optimize application performance.",
    "Write clean and maintainable code.",
  ],

  qualifications: [
    "Bachelor's degree in Computer Science or related field.",
    "Strong understanding of JavaScript and React.",
    "Knowledge of backend development using Node.js and Express.",
    "Basic understanding of databases and Git.",
  ],
};

module.exports = {
  resume,
  selfDescription,
  jobDescription,
};