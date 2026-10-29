CREATE TABLE anomaly_alerts (
	id VARCHAR(36) NOT NULL, 
	alert_id VARCHAR(50) NOT NULL, 
	alert_type VARCHAR(50) NOT NULL, 
	severity VARCHAR(20), 
	title VARCHAR(255) NOT NULL, 
	description TEXT NOT NULL, 
	anomaly_score FLOAT, 
	triggering_features JSON, 
	affected_institutions JSON, 
	status VARCHAR(20), 
	resolved_by VARCHAR(100), 
	action_notes TEXT, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE TABLE audit_events (
	id VARCHAR(36) NOT NULL, 
	actor_username VARCHAR(100) NOT NULL, 
	actor_role VARCHAR(50) NOT NULL, 
	action VARCHAR(100) NOT NULL, 
	description TEXT NOT NULL, 
	institution_id VARCHAR(36), 
	ip_address VARCHAR(45), 
	tamper_hash VARCHAR(64), 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE TABLE institutions (
	id VARCHAR(36) NOT NULL, 
	official_code VARCHAR(50) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	state VARCHAR(100) NOT NULL, 
	district VARCHAR(100), 
	approval_status VARCHAR(50), 
	institution_type VARCHAR(50), 
	nirf_rank INTEGER, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE TABLE integration_jobs (
	id VARCHAR(36) NOT NULL, 
	provider_name VARCHAR(50) NOT NULL, 
	job_type VARCHAR(50) NOT NULL, 
	status VARCHAR(20), 
	request_summary TEXT, 
	response_summary TEXT, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE TABLE students (
	id VARCHAR(36) NOT NULL, 
	apaar_id VARCHAR(20) NOT NULL, 
	apaar_lookup_hash VARCHAR(64) NOT NULL, 
	student_id VARCHAR(50) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	dob VARCHAR(20), 
	gender VARCHAR(20), 
	category VARCHAR(50), 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE TABLE duplicate_cases (
	id VARCHAR(36) NOT NULL, 
	case_id VARCHAR(50) NOT NULL, 
	pseudonymous_id VARCHAR(64) NOT NULL, 
	student_name VARCHAR(255), 
	primary_institution_id VARCHAR(36) NOT NULL, 
	secondary_institution_id VARCHAR(36) NOT NULL, 
	academic_year VARCHAR(20), 
	detection_reason VARCHAR(100), 
	evidence_summary TEXT NOT NULL, 
	severity VARCHAR(20), 
	review_status VARCHAR(50), 
	resolution_notes TEXT, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(primary_institution_id) REFERENCES institutions (id), 
	FOREIGN KEY(secondary_institution_id) REFERENCES institutions (id)
);

CREATE TABLE programs (
	id VARCHAR(36) NOT NULL, 
	institution_id VARCHAR(36) NOT NULL, 
	program_name VARCHAR(255) NOT NULL, 
	program_code VARCHAR(50) NOT NULL, 
	qualification_level VARCHAR(50), 
	academic_year VARCHAR(20), 
	approved_regular_intake INTEGER NOT NULL, 
	tfw_quota INTEGER, 
	ews_quota INTEGER, 
	nri_quota INTEGER, 
	fn_oci_quota INTEGER, 
	pmsss_quota INTEGER, 
	approval_reference VARCHAR(100), 
	effective_period VARCHAR(50), 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(institution_id) REFERENCES institutions (id)
);

CREATE TABLE users (
	id VARCHAR(36) NOT NULL, 
	username VARCHAR(100) NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	hashed_password VARCHAR(255) NOT NULL, 
	role VARCHAR(50) NOT NULL, 
	institution_id VARCHAR(36), 
	is_active BOOLEAN, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(institution_id) REFERENCES institutions (id)
);

CREATE TABLE enrolments (
	id VARCHAR(36) NOT NULL, 
	student_id VARCHAR(36) NOT NULL, 
	institution_id VARCHAR(36) NOT NULL, 
	program_id VARCHAR(36) NOT NULL, 
	academic_year VARCHAR(20) NOT NULL, 
	admission_date VARCHAR(20) NOT NULL, 
	enrolment_status VARCHAR(50), 
	seat_category VARCHAR(50), 
	is_nri BOOLEAN, 
	is_oci BOOLEAN, 
	is_fn BOOLEAN, 
	supernumerary_classification VARCHAR(50), 
	submission_source VARCHAR(50), 
	tamper_hash VARCHAR(64), 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(student_id) REFERENCES students (id), 
	FOREIGN KEY(institution_id) REFERENCES institutions (id), 
	FOREIGN KEY(program_id) REFERENCES programs (id)
);

CREATE TABLE upload_batches (
	id VARCHAR(36) NOT NULL, 
	institution_id VARCHAR(36) NOT NULL, 
	uploaded_by_user_id VARCHAR(36), 
	file_name VARCHAR(255) NOT NULL, 
	file_size INTEGER, 
	total_rows INTEGER, 
	processed_rows INTEGER, 
	successful_rows INTEGER, 
	failed_rows INTEGER, 
	status VARCHAR(50), 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(institution_id) REFERENCES institutions (id), 
	FOREIGN KEY(uploaded_by_user_id) REFERENCES users (id)
);

CREATE TABLE issued_credentials (
	id VARCHAR(36) NOT NULL, 
	credential_id VARCHAR(64) NOT NULL, 
	student_id VARCHAR(36) NOT NULL, 
	enrolment_id VARCHAR(36) NOT NULL, 
	institution_id VARCHAR(36) NOT NULL, 
	program_name VARCHAR(255) NOT NULL, 
	qualification VARCHAR(50), 
	academic_period VARCHAR(50), 
	digital_signature TEXT NOT NULL, 
	public_key_ref VARCHAR(100), 
	issued_at TIMESTAMP WITHOUT TIME ZONE, 
	expires_at TIMESTAMP WITHOUT TIME ZONE, 
	status VARCHAR(20), 
	revocation_reason TEXT, 
	revoked_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(student_id) REFERENCES students (id), 
	FOREIGN KEY(enrolment_id) REFERENCES enrolments (id), 
	FOREIGN KEY(institution_id) REFERENCES institutions (id)
);

CREATE TABLE upload_row_results (
	id VARCHAR(36) NOT NULL, 
	batch_id VARCHAR(36) NOT NULL, 
	row_number INTEGER NOT NULL, 
	apaar_id VARCHAR(20), 
	status VARCHAR(50), 
	error_message TEXT, 
	raw_data JSON, 
	PRIMARY KEY (id), 
	FOREIGN KEY(batch_id) REFERENCES upload_batches (id)
);

CREATE TABLE validation_issues (
	id VARCHAR(36) NOT NULL, 
	batch_id VARCHAR(36), 
	student_id VARCHAR(36), 
	institution_id VARCHAR(36), 
	program_id VARCHAR(36), 
	rule_code VARCHAR(50) NOT NULL, 
	severity VARCHAR(20), 
	explanation TEXT NOT NULL, 
	supporting_evidence TEXT, 
	recommended_action TEXT, 
	status VARCHAR(20), 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(batch_id) REFERENCES upload_batches (id), 
	FOREIGN KEY(student_id) REFERENCES students (id), 
	FOREIGN KEY(institution_id) REFERENCES institutions (id), 
	FOREIGN KEY(program_id) REFERENCES programs (id)
);