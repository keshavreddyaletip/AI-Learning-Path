# Standout Extension

This extension intentionally avoids changing the backend contract.

## Added
- Browser-local learning progress persistence.
- Learning snapshot with completion count and progress percentage.
- Topic score memory.
- Explainable recommendation panel for the existing YouTube result.
- Reusable score/progress UI components.

## Design principle
The existing project already has the core journey:

Goal → Profile → AI Roadmap → Resource → Quiz → Score.

The extension makes that journey visible as a product loop without introducing a database or a new external service.

## Important
The current prototype remains assessment-aware rather than fully adaptive:
quiz results are stored locally and surfaced in the UI, but they do not automatically regenerate the AI roadmap.
