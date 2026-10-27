import numpy as np
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sklearn.ensemble import IsolationForest
from app.models.models import Institution, Program, Enrolment, AnomalyAlert, ValidationIssue, DuplicateCase

class AnomalyService:
    @staticmethod
    def run_explainable_anomaly_detection(db: Session) -> List[AnomalyAlert]:
        """
        Hybrid rule-based and unsupervised anomaly scoring module.
        Generates explainable alerts with feature importances and actionable investigation guides.
        """
        institutions = db.query(Institution).all()
        if not institutions:
            return []

        alerts = []
        feature_matrix = []
        inst_meta = []

        # 1. Compute Aggregated Non-Identifying Features per Institution
        for inst in institutions:
            programs = db.query(Program).filter(Program.institution_id == inst.id).all()
            enrolments = db.query(Enrolment).filter(Enrolment.institution_id == inst.id).all()
            issues = db.query(ValidationIssue).filter(ValidationIssue.institution_id == inst.id).all()
            duplicates = db.query(DuplicateCase).filter(
                (DuplicateCase.primary_institution_id == inst.id) |
                (DuplicateCase.secondary_institution_id == inst.id)
            ).all()

            total_approved_intake = sum(p.approved_regular_intake for p in programs) or 1
            total_enrolled = len(enrolments)
            utilization_rate = total_enrolled / total_approved_intake
            duplicate_rate = len(duplicates) / max(total_enrolled, 1)
            issue_rate = len(issues) / max(total_enrolled, 1)
            supernumerary_rate = sum(1 for e in enrolments if e.supernumerary_classification != "NONE") / max(total_enrolled, 1)

            feature_vector = [utilization_rate, duplicate_rate, issue_rate, supernumerary_rate]
            feature_matrix.append(feature_vector)
            inst_meta.append({
                "institution": inst,
                "utilization_rate": utilization_rate,
                "duplicate_rate": duplicate_rate,
                "issue_rate": issue_rate,
                "supernumerary_rate": supernumerary_rate,
                "total_enrolled": total_enrolled,
                "total_approved_intake": total_approved_intake
            })

            # --- Deterministic Rule 1: Intake Violation ---
            if utilization_rate > 1.05:
                alert_id = f"ALERT-INTAKE-{inst.official_code}"
                existing = db.query(AnomalyAlert).filter(AnomalyAlert.alert_id == alert_id).first()
                if not existing:
                    alert = AnomalyAlert(
                        alert_id=alert_id,
                        alert_type="INTAKE_CAPACITY_BREACH",
                        severity="CRITICAL",
                        title=f"Intake Capacity Breach: {inst.name}",
                        description=f"Actual enrolment ({total_enrolled}) exceeds total approved sanctioned intake ({total_approved_intake}) by {round((utilization_rate - 1) * 100, 1)}%.",
                        anomaly_score=0.95,
                        triggering_features={"utilization_rate": round(utilization_rate, 2), "excess_seats": total_enrolled - total_approved_intake},
                        affected_institutions=[inst.name]
                    )
                    db.add(alert)
                    alerts.append(alert)

            # --- Deterministic Rule 2: High Duplicate Rate ---
            if len(duplicates) > 0:
                alert_id = f"ALERT-DUP-{inst.official_code}"
                existing = db.query(AnomalyAlert).filter(AnomalyAlert.alert_id == alert_id).first()
                if not existing:
                    alert = AnomalyAlert(
                        alert_id=alert_id,
                        alert_type="CROSS_INSTITUTION_COLLISION_CLUSTER",
                        severity="HIGH",
                        title=f"Multi-Institution Enrolment Collision: {inst.name}",
                        description=f"{len(duplicates)} cross-institution duplicate enrolment case(s) detected linked to this institution.",
                        anomaly_score=0.88,
                        triggering_features={"duplicate_cases": len(duplicates)},
                        affected_institutions=[inst.name]
                    )
                    db.add(alert)
                    alerts.append(alert)

        # 2. Unsupervised Scoring using IsolationForest
        if len(feature_matrix) >= 4:
            X = np.array(feature_matrix)
            clf = IsolationForest(contamination=0.25, random_state=42)
            preds = clf.fit_predict(X)
            scores = -clf.score_samples(X)  # Higher score = more anomalous

            for idx, pred in enumerate(preds):
                if pred == -1:  # Outlier detected
                    meta = inst_meta[idx]
                    inst = meta["institution"]
                    score = float(scores[idx])

                    alert_id = f"ALERT-ML-{inst.official_code}"
                    existing = db.query(AnomalyAlert).filter(AnomalyAlert.alert_id == alert_id).first()
                    if not existing:
                        alert = AnomalyAlert(
                            alert_id=alert_id,
                            alert_type="STATISTICAL_DISTRIBUTION_ANOMALY",
                            severity="MEDIUM",
                            title=f"Statistical Anomaly Flag: {inst.name}",
                            description=f"Multi-dimensional anomaly detected via Isolation Forest. Supernumerary ratio ({round(meta['supernumerary_rate']*100, 1)}%) or validation issue rate ({round(meta['issue_rate']*100, 1)}%) deviates significantly from national peer group.",
                            anomaly_score=round(score, 3),
                            triggering_features={
                                "supernumerary_rate": round(meta['supernumerary_rate'], 3),
                                "issue_rate": round(meta['issue_rate'], 3),
                                "utilization_rate": round(meta['utilization_rate'], 3)
                            },
                            affected_institutions=[inst.name]
                        )
                        db.add(alert)
                        alerts.append(alert)

        db.commit()
        return db.query(AnomalyAlert).all()
