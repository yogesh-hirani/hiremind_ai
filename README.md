# 🚀 HireMind AI

A smart candidate screening and ranking system that helps recruiters evaluate resumes efficiently using a hybrid AI + rule-based approach.

---

## 🧠 Problem

Recruiters receive hundreds of resumes for a single role.

Challenges:

* Manual screening is slow and inefficient
* AI-only solutions are inconsistent
* Good candidates often get overlooked

---

## ⚙️ Solution

HireMind AI simplifies hiring by:

* Uploading resumes (PDF/DOCX)
* Analyzing job descriptions
* Automatically:

  * Parsing resumes
  * Extracting candidate data
  * Scoring candidates (0–100)
  * Ranking candidates
  * Comparing candidates side-by-side

---

## 🧩 Architecture (Key Insight)

This system uses a **Hybrid Approach**:

* Gemini API → Resume parsing + job understanding
* Custom scoring engine → Candidate scoring, ranking, comparison

### Why hybrid?

AI is great at understanding text, but not reliable for consistent scoring.

So instead of relying fully on AI:

* AI handles interpretation
* Code handles decision-making

👉 Result:

* Faster
* More consistent
* More explainable

---

## 🚀 Features

* Resume parsing (PDF/DOCX)
* Job description analysis
* Candidate scoring (0–100)
* Candidate ranking dashboard
* Side-by-side candidate comparison
* Explainable decision output

---

## 🛠 Tech Stack

* Next.js 15
* React 19
* Tailwind CSS
* Node.js
* Gemini API
* Custom scoring engine

---


## ⚡ How It Works

1. Upload resumes
2. Enter job description
3. System parses data using Gemini
4. Scoring engine evaluates candidates
5. Dashboard displays ranked results

---

## 🧪 Future Improvements

* Multi-job management
* Interview scheduling
* AI-generated interview questions
* SaaS deployment

---

## 📦 Installation

```bash
npm install
npm run dev
```

Open http://localhost:4028

---

## 🤝 Contributing

Open to feedback and improvements!

---

## ⭐ If you like this project, consider starring it!
