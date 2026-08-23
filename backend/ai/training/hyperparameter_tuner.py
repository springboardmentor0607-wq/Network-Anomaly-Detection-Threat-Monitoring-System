import numpy as np
import logging
from typing import Dict, Any, List, Tuple

logger = logging.getLogger(__name__)

class HyperparameterTuner:
    """Simple random‑search hyper‑parameter tuner.

    Works with any scikit‑learn compatible estimator that follows the ``fit`` / ``predict`` API.
    It samples random combinations from a provided grid, trains on a train split,
    evaluates on a validation split using a user‑provided evaluation function, and
    returns the best parameters and model.
    """

    def __init__(self, param_grid: Dict[str, List[Any]], n_trials: int = 20, random_state: int = 42):
        self.param_grid = param_grid
        self.n_trials = n_trials
        self.rng = np.random.default_rng(random_state)
        self.best_score = -np.inf
        self.best_params: Dict[str, Any] = {}
        self.best_model = None

    def _sample_params(self) -> Dict[str, Any]:
        """Sample a random combination from ``self.param_grid``."""
        return {k: self.rng.choice(v) for k, v in self.param_grid.items()}

    def tune(self, model_cls, X_train, y_train, eval_fn) -> Tuple[Dict[str, Any], Any]:
        """Run random search.

        Parameters
        ----------
        model_cls: callable
            Callable that returns a fresh model instance when called with ``**params``.
        X_train, y_train: np.ndarray
            Training data.
        eval_fn: callable
            Function ``eval_fn(model, X_val, y_val) -> float`` returning a metric (higher is better).
        """
        # Simple train/validation split (80/20)
        n = X_train.shape[0]
        indices = np.arange(n)
        self.rng.shuffle(indices)
        split = int(0.8 * n)
        train_idx, val_idx = indices[:split], indices[split:]
        X_tr, X_val = X_train[train_idx], X_train[val_idx]
        y_tr, y_val = y_train[train_idx], y_train[val_idx]

        for trial in range(self.n_trials):
            params = self._sample_params()
            try:
                model = model_cls(**params)
                # Train using .train if present, otherwise fallback to .fit
                if hasattr(model, "train"):
                    model.train(X_tr, y_tr)
                else:
                    model.fit(X_tr, y_tr)
                score = eval_fn(model, X_val, y_val)
                logger.debug(f"Trial {trial+1}/{self.n_trials} params={params} score={score:.4f}")
                if score > self.best_score:
                    self.best_score = score
                    self.best_params = params
                    self.best_model = model
            except Exception as e:
                logger.warning(f"Trial failed with params={params}: {e}")
                continue
        return self.best_params, self.best_model
