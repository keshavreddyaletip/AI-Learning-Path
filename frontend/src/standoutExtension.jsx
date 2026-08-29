import React from "react";

export function ProgressBar({ value = 0 }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="alp-progress-wrap" aria-label={`Learning progress ${safe}%`}>
      <div className="alp-progress-track">
        <div className="alp-progress-fill" style={{ width: `${safe}%` }} />
      </div>
      <strong>{safe}%</strong>
    </div>
  );
}

export function LearningSummary({ roadmap = [], completed = [], scoreMap = {}, onReset }) {
  const steps = Array.isArray(roadmap) ? roadmap : [];
  const completedSet = new Set(completed);
  const total = steps.length;
  const done = steps.filter((step) => completedSet.has(step.title)).length;
  const progress = total ? Math.round((done / total) * 100) : 0;
  const reviewTopics = steps
    .filter((step) => scoreMap[step.title] !== undefined && Number(scoreMap[step.title]) < 70)
    .map((step) => step.title);
  const next = steps.find((step) => !completedSet.has(step.title));

  return (
    <section className="alp-summary" aria-label="Learning progress">
      <div className="alp-summary-top">
        <div>
          <span className="alp-eyebrow">Learning snapshot</span>
          <h2>Your path at a glance</h2>
        </div>
        <strong>{done}/{total} topics</strong>
      </div>
      <ProgressBar value={progress} />
      <div className="alp-summary-grid">
        <div><span>Progress</span><b>{progress}%</b></div>
        <div><span>Completed</span><b>{done}</b></div>
        <div><span>Needs review</span><b>{reviewTopics.length}</b></div>
      </div>
      {next && (
        <div className="alp-next-action">
          <b>Next recommended action</b>
          <p>{reviewTopics.length ? `Review ${reviewTopics[0]} before continuing.` : `Continue with ${next.title}.`}</p>
        </div>
      )}
      {onReset && (done > 0 || reviewTopics.length > 0) && (
        <button className="alp-reset" type="button" onClick={onReset}>Reset local progress</button>
      )}
    </section>
  );
}

export function ExplainableRecommendation({ video }) {
  if (!video) return null;
  const score = Number(video.score ?? 0);
  return (
    <div className="alp-explain-card">
      <div className="alp-card-heading">
        <div>
          <span className="alp-eyebrow">Explainable recommendation</span>
          <strong>Why this resource?</strong>
        </div>
        <span className="alp-score-badge">{score.toFixed(2)}</span>
      </div>
      <div className="alp-reasons">
        <span>✓ Topic relevance</span>
        <span>✓ Learner-level search</span>
        <span>✓ Engagement signals</span>
        <span>✓ Feedback availability</span>
      </div>
      {video.ranking_note && <p className="alp-note">{video.ranking_note}</p>}
    </div>
  );
}

export function ScoreCard({ score = 0, total = 0, topic = "" }) {
  const pct = total ? Math.round((score / total) * 100) : 0;
  const passed = pct >= 70;
  return (
    <div className={`alp-score-card ${passed ? "passed" : "review"}`}>
      <div>
        <span className="alp-eyebrow">Assessment result</span>
        <h3>{topic}</h3>
        <p><strong>{score}/{total} correct · {pct}%</strong></p>
        <p>{passed ? "Great! This topic is marked complete." : "Review this topic and try again."}</p>
      </div>
      <div className="alp-score-ring">{pct}%</div>
    </div>
  );
}
