# Owner: Dev A
"""Evaluation Harness and Benchmarking Framework (Feature F24)."""

from __future__ import annotations

from app.engine.eval.harness import evaluate
from app.engine.evaluation.benchmark import BenchmarkRunner
from app.engine.evaluation.datasets import EvaluationDataset
from app.engine.evaluation.metrics import (
    BinaryClassificationMetrics,
    SignalRuleMetrics,
    compute_binary_metrics,
    compute_roc,
)
from app.engine.evaluation.report import EvaluationReport
from app.engine.evaluation.service import EvaluationService

__all__ = [
    "BenchmarkRunner",
    "BinaryClassificationMetrics",
    "EvaluationDataset",
    "EvaluationReport",
    "EvaluationService",
    "SignalRuleMetrics",
    "compute_binary_metrics",
    "compute_roc",
    "evaluate",
]
