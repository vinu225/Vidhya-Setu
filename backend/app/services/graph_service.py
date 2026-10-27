import networkx as nx
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.models import Enrolment, Student, Institution, Program
from app.security.security import mask_apaar_id

class IdentityGraphService:
    @staticmethod
    def build_cross_institution_graph(db: Session, max_nodes: int = 150) -> Dict[str, Any]:
        """
        Builds a NetworkX graph modeling:
        - Students (pseudonymized)
        - Institutions
        - Programs
        And detects multi-institution overlapping clusters.
        """
        G = nx.Graph()

        enrolments = db.query(Enrolment).all()
        institutions = {i.id: i for i in db.query(Institution).all()}
        programs = {p.id: p for p in db.query(Program).all()}
        students = {s.id: s for s in db.query(Student).all()}

        # 1. Add Institution Nodes
        for inst_id, inst in institutions.items():
            G.add_node(
                f"INST_{inst_id}",
                node_type="INSTITUTION",
                label=inst.name,
                code=inst.official_code,
                state=inst.state,
                color="#0B3B60"
            )

        # 2. Add Program Nodes & connect to Institution
        for prog_id, prog in programs.items():
            prog_node = f"PROG_{prog_id}"
            G.add_node(
                prog_node,
                node_type="PROGRAM",
                label=prog.program_name,
                code=prog.program_code,
                color="#0D9488"
            )
            G.add_edge(f"INST_{prog.institution_id}", prog_node, relation="OFFERS_PROGRAM")

        # 3. Add Student Nodes & Enrolment edges
        student_enrolment_map: Dict[str, List[Enrolment]] = {}
        for enr in enrolments:
            student_enrolment_map.setdefault(enr.student_id, []).append(enr)

        # Prioritize students with multi-institution enrolments for graph representation
        collision_student_ids = []
        regular_student_ids = []

        for student_id, enrs in student_enrolment_map.items():
            unique_insts = set(e.institution_id for e in enrs)
            if len(unique_insts) > 1:
                collision_student_ids.append(student_id)
            else:
                regular_student_ids.append(student_id)

        # Sample to keep graph clean and high performance
        selected_student_ids = (collision_student_ids + regular_student_ids)[:max_nodes]

        for s_id in selected_student_ids:
            student = students.get(s_id)
            if not student:
                continue

            enrs = student_enrolment_map.get(s_id, [])
            is_collision = len(set(e.institution_id for e in enrs)) > 1

            s_node = f"STUDENT_{s_id}"
            G.add_node(
                s_node,
                node_type="STUDENT",
                label=student.name,
                pseudonymous_id=mask_apaar_id(student.apaar_id),
                is_collision=is_collision,
                color="#E11D48" if is_collision else "#64748B"
            )

            for enr in enrs:
                prog_node = f"PROG_{enr.program_id}"
                if prog_node in G:
                    G.add_edge(
                        s_node,
                        prog_node,
                        relation="ENROLLED_IN",
                        year=enr.academic_year,
                        quota=enr.supernumerary_classification,
                        status=enr.enrolment_status
                    )

        # 4. Network Analysis: Detect Connected Components with collisions
        collision_clusters = []
        for component in nx.connected_components(G):
            students_in_comp = [n for n in component if n.startswith("STUDENT_") and G.nodes[n].get("is_collision")]
            if students_in_comp:
                insts_in_comp = [G.nodes[n].get("label") for n in component if n.startswith("INST_")]
                collision_clusters.append({
                    "cluster_size": len(component),
                    "affected_students": len(students_in_comp),
                    "institutions": insts_in_comp
                })

        # Format for frontend force graph / D3 / Canvas
        nodes_data = []
        for n, attrs in G.nodes(data=True):
            nodes_data.append({
                "id": n,
                **attrs
            })

        links_data = []
        for u, v, attrs in G.edges(data=True):
            links_data.append({
                "source": u,
                "target": v,
                **attrs
            })

        return {
            "total_nodes": len(nodes_data),
            "total_links": len(links_data),
            "collision_count": len(collision_student_ids),
            "collision_clusters": collision_clusters,
            "nodes": nodes_data,
            "links": links_data
        }
