import numpy as np
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import Institution, Program, Enrolment, AnomalyAlert, ValidationIssue, DuplicateCase
from app.engine.anomaly.service import AnomalyDetectionService

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

        # 2. Unsupervised Scoring using Engine Isolation Forest with Explainability
        if len(feature_matrix) >= 4:
            engine_items = [
                {
                    "institution_id": meta["institution"].id,
                    "features": {
                        "seat_utilisation": meta["utilization_rate"],
                        "duplicate_rate": meta["duplicate_rate"],
                        "shared_contact_rate": meta["supernumerary_rate"],
                        "eligibility_violation_count": float(meta["issue_rate"] * 10),
                    }
                }
                for meta in inst_meta
            ]
            engine_svc = AnomalyDetectionService(contamination=0.25, random_state=42)
            results = engine_svc.fit_predict(engine_items)

            for idx, res in enumerate(results):
                if res.prediction == "anomalous":  # Outlier detected by Isolation Forest
                    meta = inst_meta[idx]
                    inst = meta["institution"]
                    score = float(res.score)
                    top_f = ", ".join(res.top_features) if res.top_features else "admission deviation"

                    alert_id = f"ALERT-ML-{inst.official_code}"
                    existing = db.query(AnomalyAlert).filter(AnomalyAlert.alert_id == alert_id).first()
                    if not existing:
                        alert = AnomalyAlert(
                            alert_id=alert_id,
                            alert_type="STATISTICAL_DISTRIBUTION_ANOMALY",
                            severity="MEDIUM",
                            title=f"Statistical Anomaly Flag: {inst.name}",
                            description=f"Multi-dimensional anomaly detected via Isolation Forest. Top deviating factors: {top_f}. Peer anomaly score: {round(score, 3)}.",
                            anomaly_score=round(score, 3),
                            triggering_features={
                                "top_features": res.top_features,
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
