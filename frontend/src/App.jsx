import React, { useEffect, useMemo, useState } from "react";
import { getRoadmap, getVideo, getQuiz } from "./api";
import {
  LearningSummary,
  ScoreCard,
  ExplainableRecommendation,
} from "./standoutExtension";

const STORAGE_KEYS = {
  completed: "alp_completed_v2",
  scores: "alp_scores_v2",
  profile: "alp_profile_v2",
};

const initialProfile = {
  goal: "",
  skills: [],
  experience: "Beginner",
  hours_per_week: 5,
  interests: [],
};

/* =========================================================
   ROADMAP LOADING COMPONENT
   ========================================================= */

function ALPRoadmapLoader() {
  const [message, setMessage] = useState(
    "Connecting to the AI engine..."
  );

  useEffect(() => {
    const messages = [
      "Connecting to the AI engine...",
      "Understanding your learning profile...",
      "Designing your personalized roadmap...",
      "Organizing topics and prerequisites...",
      "Almost there - preparing your learning path...",
    ];

    let index = 0;

    const timer = setInterval(() => {
      index = (index + 1) % messages.length;
      setMessage(messages[index]);
    }, 1800);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="alp-roadmap-loader"
      role="status"
      aria-live="polite"
    >
      <div className="alp-loader-spinner"></div>

      <div className="alp-loader-copy">
        <strong>Building your roadmap</strong>
        <span>{message}</span>
      </div>

      <div className="alp-loader-progress">
        <div className="alp-loader-progress-bar"></div>
      </div>

      <small>
        This may take a few seconds while the AI creates your
        personalized learning path.
      </small>
    </div>
  );
}

/* =========================================================
   STORAGE HELPER
   ========================================================= */

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/* =========================================================
   MAIN APP
   ========================================================= */

export default function App() {
  const [profile, setProfile] = useState(() =>
    readStorage(STORAGE_KEYS.profile, initialProfile)
  );

  const [skillsText, setSkillsText] = useState(() =>
    readStorage(STORAGE_KEYS.profile, initialProfile)
      .skills?.join(", ") || ""
  );

  const [interestText, setInterestText] = useState(() =>
    readStorage(STORAGE_KEYS.profile, initialProfile)
      .interests?.join(", ") || ""
  );

  const [roadmap, setRoadmap] = useState(null);
  const [selected, setSelected] = useState(null);
  const [video, setVideo] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);

  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  const [completed, setCompleted] = useState(() =>
    readStorage(STORAGE_KEYS.completed, [])
  );

  const [scoreMap, setScoreMap] = useState(() =>
    readStorage(STORAGE_KEYS.scores, {})
  );

  /* =========================================================
     SAVE PROGRESS
     ========================================================= */

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.completed,
      JSON.stringify(completed)
    );
  }, [completed]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.scores,
      JSON.stringify(scoreMap)
    );
  }, [scoreMap]);

  useEffect(() => {
    const savedProfile = {
      ...profile,
      skills: skillsText
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),

      interests: interestText
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    };

    localStorage.setItem(
      STORAGE_KEYS.profile,
      JSON.stringify(savedProfile)
    );
  }, [profile, skillsText, interestText]);

  /* =========================================================
     BUILD PROFILE
     ========================================================= */

  const buildProfile = () => ({
    ...profile,

    skills: skillsText
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),

    interests: interestText
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
  });

  /* =========================================================
     COMPLETION STATS
     ========================================================= */

  const completionStats = useMemo(() => {
    const steps = roadmap?.roadmap || [];

    const done = steps.filter((step) =>
      completed.includes(step.title)
    ).length;

    const progress = steps.length
      ? Math.round((done / steps.length) * 100)
      : 0;

    return {
      done,
      total: steps.length,
      progress,
    };
  }, [roadmap, completed]);

  /* =========================================================
     GENERATE ROADMAP
     ========================================================= */

  async function createRoadmap() {
    if (!profile.goal.trim()) return;

    setLoading("roadmap");
    setError("");

    setVideo(null);
    setQuiz(null);
    setScore(null);

    try {
      const data = await getRoadmap(buildProfile());

      setRoadmap(data);

      setSelected(data.roadmap?.[0] || null);

      if (data.roadmap?.[0]) {
        await loadTopic(data.roadmap[0]);
      }
    } catch (e) {
      setError(
        e.message || "Could not generate the roadmap."
      );
    } finally {
      setLoading("");
    }
  }

  /* =========================================================
     LOAD TOPIC / VIDEO
     ========================================================= */

  async function loadTopic(step) {
    setSelected(step);

    setLoading("video");
    setError("");

    setQuiz(null);
    setScore(null);
    setAnswers({});

    try {
      const data = await getVideo(
        step.title,
        buildProfile()
      );

      setVideo(data);
    } catch (e) {
      setError(
        e.message ||
        "Could not find a learning resource."
      );

      setVideo(null);
    } finally {
      setLoading("");
    }
  }

  /* =========================================================
     LOAD QUIZ
     ========================================================= */

  async function loadQuiz() {
    if (!selected) return;

    setLoading("quiz");
    setError("");

    setScore(null);
    setAnswers({});

    try {
      const data = await getQuiz(
        selected.title,
        buildProfile()
      );

      setQuiz(data);
    } catch (e) {
      setError(
        e.message ||
        "Could not generate the quiz."
      );
    } finally {
      setLoading("");
    }
  }

  /* =========================================================
     SUBMIT QUIZ
     ========================================================= */

  function submitQuiz() {
    if (!quiz?.questions?.length || !selected) return;

    let correct = 0;

    quiz.questions.forEach((q, i) => {
      if (
        Number(answers[i]) === Number(q.answer)
      ) {
        correct += 1;
      }
    });

    const total = quiz.questions.length;

    const pct = Math.round(
      (correct / total) * 100
    );

    setScore(correct);

    setScoreMap((prev) => ({
      ...prev,
      [selected.title]: pct,
    }));

    if (pct >= 70) {
      setCompleted((prev) =>
        prev.includes(selected.title)
          ? prev
          : [...prev, selected.title]
      );
    } else {
      setCompleted((prev) =>
        prev.filter(
          (topic) => topic !== selected.title
        )
      );
    }
  }

  /* =========================================================
     RESET PROGRESS
     ========================================================= */

  function resetProgress() {
    setCompleted([]);
    setScoreMap({});
  }

  const currentScore = selected
    ? scoreMap[selected.title]
    : undefined;

  /* =========================================================
     UI
     ========================================================= */

  return (
    <main>

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header>
        <div className="badge">
          AI LEARNING ASSISTANT
        </div>

        <h1>
          Build your{" "}
          <span>personal learning path.</span>
        </h1>

        <p>
          Goal → Personalized roadmap → Ranked
          learning resource → Assessment → Progress
        </p>
      </header>

      {/* =====================================================
          PROFILE SECTION
          ===================================================== */}

      <section className="card profile">

        <h2>
          1. Tell us about the learner
        </h2>

        <input
          placeholder="Goal (e.g. Become a Machine Learning Engineer)"
          value={profile.goal}
          onChange={(e) =>
            setProfile({
              ...profile,
              goal: e.target.value,
            })
          }
        />

        <input
          placeholder="Current skills, comma separated (e.g. Python, SQL)"
          value={skillsText}
          onChange={(e) =>
            setSkillsText(e.target.value)
          }
        />

        <div className="row">

          <select
            value={profile.experience}
            onChange={(e) =>
              setProfile({
                ...profile,
                experience: e.target.value,
              })
            }
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>

          <input
            type="number"
            min="1"
            max="80"
            value={profile.hours_per_week}
            onChange={(e) =>
              setProfile({
                ...profile,
                hours_per_week:
                  Number(e.target.value),
              })
            }
          />

        </div>

        <input
          placeholder="Interests, comma separated (e.g. AI, Computer Vision)"
          value={interestText}
          onChange={(e) =>
            setInterestText(e.target.value)
          }
        />

        {/* =================================================
            GENERATE BUTTON
            ================================================= */}

        <button
          onClick={createRoadmap}
          disabled={
            loading === "roadmap" ||
            !profile.goal.trim()
          }
        >
          {loading === "roadmap"
            ? "Generating..."
            : "Generate My Roadmap"}
        </button>

        {/* =================================================
            NEW ROADMAP LOADER
            ================================================= */}

        {loading === "roadmap" && (
          <ALPRoadmapLoader />
        )}

      </section>

      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {/* =====================================================
          ROADMAP
          ===================================================== */}

      {roadmap && (
        <section className="layout">

          {/* =================================================
              ROADMAP CARD
              ================================================= */}

          <div className="card">

            <h2>
              2. Your AI Roadmap
            </h2>

            <p className="muted">
              {roadmap.summary}
            </p>

            <LearningSummary
              roadmap={roadmap.roadmap}
              completed={completed}
              scoreMap={scoreMap}
              onReset={resetProgress}
            />

            <div className="steps">

              {roadmap.roadmap?.map(
                (step) => {

                  const done =
                    completed.includes(
                      step.title
                    );

                  const previousScore =
                    scoreMap[step.title];

                  return (
                    <button
                      className={`step ${selected?.step === step.step
                        ? "active"
                        : ""
                        }`}
                      key={step.step}
                      onClick={() =>
                        loadTopic(step)
                      }
                    >

                      <b>
                        {done
                          ? "✓"
                          : step.step}
                      </b>

                      <span>

                        <strong>
                          {step.title}
                        </strong>

                        <small>
                          {step.description}
                        </small>

                        <em>
                          {done
                            ? "Completed"
                            : previousScore !==
                              undefined
                              ? `Last score: ${previousScore}%`
                              : `${step.estimated_hours ||
                              "—"
                              } hrs · ${step.difficulty
                              }`}
                        </em>

                      </span>

                    </button>
                  );
                }
              )}

            </div>

          </div>

          {/* =================================================
              LEARNING AREA
              ================================================= */}

          <div>

            {/* =================================================
                SELECTED TOPIC
                ================================================= */}

            {selected && (
              <section className="card">

                <div className="topic-head">

                  <div>

                    <h2>
                      3. Learn:{" "}
                      {selected.title}
                    </h2>

                    <p>
                      {selected.why}
                    </p>

                  </div>

                  <span className="pill">
                    {selected.difficulty}
                  </span>

                </div>

                {/* VIDEO LOADING */}

                {loading === "video" && (
                  <p>
                    Finding the best video...
                  </p>
                )}

                {/* =================================================
                    RECOMMENDED VIDEO
                    ================================================= */}

                {video?.recommended && (
                  <>

                    <div className="video">

                      <img
                        src={
                          video.recommended
                            .thumbnail
                        }
                        alt="Recommended video thumbnail"
                      />

                      <div>

                        <h3>
                          {
                            video.recommended
                              .title
                          }
                        </h3>

                        <p>
                          {
                            video.recommended
                              .channel
                          }
                        </p>

                        <p className="stats">

                          {video.recommended.views.toLocaleString()}{" "}
                          views ·{" "}

                          {video.recommended.likes.toLocaleString()}{" "}
                          likes ·{" "}

                          {video.recommended.comments.toLocaleString()}{" "}
                          comments

                        </p>

                        <p>

                          <b>
                            AI ranking score:
                          </b>{" "}

                          {Number(
                            video.recommended
                              .score || 0
                          ).toFixed(2)}

                        </p>

                        <a
                          href={
                            video.recommended
                              .url
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          Watch on YouTube ↗
                        </a>

                      </div>

                    </div>

                    <ExplainableRecommendation
                      video={{
                        ...video.recommended,
                        ranking_note:
                          video.ranking_note,
                      }}
                    />

                  </>
                )}

                {/* =================================================
                    FEEDBACK
                    ================================================= */}

                {video?.recommended
                  ?.feedback_sample
                  ?.length > 0 && (
                    <details>

                      <summary>
                        See learner feedback samples
                      </summary>

                      <ul>

                        {video.recommended.feedback_sample.map(
                          (c, i) => (
                            <li key={i}>
                              {c}
                            </li>
                          )
                        )}

                      </ul>

                    </details>
                  )}

                {/* =================================================
                    QUIZ BUTTON
                    ================================================= */}

                <button
                  onClick={loadQuiz}
                  disabled={
                    loading === "quiz"
                  }
                >
                  {loading === "quiz"
                    ? "Generating quiz..."
                    : "Take Quiz"}
                </button>

              </section>
            )}

            {/* =================================================
                QUIZ
                ================================================= */}

            {quiz && (
              <section className="card">

                <h2>
                  4. Check your understanding
                </h2>

                <p className="muted">
                  Score 70% or higher to mark
                  this topic complete.
                </p>

                {quiz.questions.map(
                  (q, i) => (

                    <div
                      className="question"
                      key={i}
                    >

                      <b>
                        {i + 1}.{" "}
                        {q.question}
                      </b>

                      {q.options.map(
                        (o, j) => (

                          <label
                            key={j}
                          >

                            <input
                              type="radio"
                              name={`q${i}`}
                              value={j}
                              checked={
                                String(
                                  answers[i]
                                ) ===
                                String(j)
                              }
                              onChange={(e) =>
                                setAnswers({
                                  ...answers,
                                  [i]:
                                    e.target.value,
                                })
                              }
                            />

                            {o}

                          </label>

                        )
                      )}

                    </div>

                  )
                )}

                <button
                  onClick={submitQuiz}
                >
                  Submit Quiz
                </button>

                {/* =================================================
                    CURRENT SCORE
                    ================================================= */}

                {score !== null && (
                  <ScoreCard
                    score={score}
                    total={
                      quiz.questions.length
                    }
                    topic={
                      selected.title
                    }
                  />
                )}

                {currentScore !==
                  undefined &&
                  score === null && (
                    <div className="result">

                      Previous score for this topic:{" "}

                      <strong>
                        {currentScore}%
                      </strong>

                    </div>
                  )}

              </section>
            )}

          </div>

        </section>
      )}

      {/* =====================================================
          COMPLETION BANNER
          ===================================================== */}

      {roadmap &&
        completionStats.total > 0 &&
        completionStats.done ===
        completionStats.total && (

          <section className="card alp-complete-banner">

            <span className="alp-eyebrow">
              Path complete
            </span>

            <h2>
              🎉 You completed the
              learning path.
            </h2>

            <p>
              You finished all{" "}
              {completionStats.total}{" "}
              topics with a passing
              assessment.
            </p>

          </section>

        )}

    </main>
  );
}