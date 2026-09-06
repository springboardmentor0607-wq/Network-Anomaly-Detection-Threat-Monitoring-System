--
-- PostgreSQL database dump
--

\restrict TK5GqV0NgVpeXNDuw1RamsKjckIUb2Yw6QPzTiNgCQReZYiQ5pEOUQkt2P7f1cY

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(255) NOT NULL,
    module character varying(100) NOT NULL,
    ip_address character varying(50) DEFAULT '127.0.0.1'::character varying,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: datasets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.datasets (
    id integer NOT NULL,
    filename character varying(255) NOT NULL,
    dataset_type character varying(100) NOT NULL,
    rows_count integer DEFAULT 0 NOT NULL,
    columns_count integer DEFAULT 0 NOT NULL,
    uploaded_by integer,
    upload_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    has_ground_truth boolean DEFAULT false,
    status character varying(50) DEFAULT 'PROCESSED'::character varying
);


ALTER TABLE public.datasets OWNER TO postgres;

--
-- Name: datasets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.datasets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.datasets_id_seq OWNER TO postgres;

--
-- Name: datasets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.datasets_id_seq OWNED BY public.datasets.id;


--
-- Name: incidents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.incidents (
    id integer NOT NULL,
    alert_id integer,
    title character varying(255) NOT NULL,
    description text,
    priority character varying(20) DEFAULT 'MEDIUM'::character varying NOT NULL,
    assigned_to integer,
    status character varying(50) DEFAULT 'OPEN'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    resolved_at timestamp without time zone,
    resolution text
);


ALTER TABLE public.incidents OWNER TO postgres;

--
-- Name: incidents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.incidents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.incidents_id_seq OWNER TO postgres;

--
-- Name: incidents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.incidents_id_seq OWNED BY public.incidents.id;


--
-- Name: network_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.network_logs (
    id integer NOT NULL,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    source_ip character varying(50) DEFAULT '127.0.0.1'::character varying,
    destination_ip character varying(50) DEFAULT '127.0.0.1'::character varying,
    protocol character varying(20) DEFAULT 'TCP'::character varying,
    packets integer DEFAULT 0,
    bytes bigint DEFAULT 0,
    duration double precision DEFAULT 0.0,
    traffic_rate double precision DEFAULT 0.0,
    status character varying(50) DEFAULT 'NORMAL'::character varying
);


ALTER TABLE public.network_logs OWNER TO postgres;

--
-- Name: network_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.network_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.network_logs_id_seq OWNER TO postgres;

--
-- Name: network_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.network_logs_id_seq OWNED BY public.network_logs.id;


--
-- Name: network_traffic; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.network_traffic (
    id integer NOT NULL,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    source_ip character varying(50) DEFAULT 'Not available'::character varying,
    destination_ip character varying(50) DEFAULT 'Not available'::character varying,
    protocol character varying(20) DEFAULT 'TCP'::character varying,
    packets integer DEFAULT 0,
    bytes bigint DEFAULT 0,
    duration double precision DEFAULT 0.0,
    traffic_rate double precision DEFAULT 0.0
);


ALTER TABLE public.network_traffic OWNER TO postgres;

--
-- Name: network_traffic_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.network_traffic_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.network_traffic_id_seq OWNER TO postgres;

--
-- Name: network_traffic_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.network_traffic_id_seq OWNED BY public.network_traffic.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    alert_id integer,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    severity character varying(20) DEFAULT 'LOW'::character varying NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: predictions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.predictions (
    id integer NOT NULL,
    dataset_id integer,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actual_label character varying(100) DEFAULT 'N/A'::character varying,
    predicted_label character varying(100) NOT NULL,
    confidence double precision DEFAULT 0.0 NOT NULL,
    risk_score integer DEFAULT 0 NOT NULL,
    severity character varying(20) DEFAULT 'LOW'::character varying NOT NULL
);


ALTER TABLE public.predictions OWNER TO postgres;

--
-- Name: predictions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.predictions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.predictions_id_seq OWNER TO postgres;

--
-- Name: predictions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.predictions_id_seq OWNED BY public.predictions.id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    id integer NOT NULL,
    report_type character varying(100) NOT NULL,
    filename character varying(255) NOT NULL,
    generated_by integer,
    generated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    data_summary jsonb
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reports_id_seq OWNER TO postgres;

--
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- Name: security_alerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.security_alerts (
    id integer NOT NULL,
    threat_id integer,
    title character varying(255) NOT NULL,
    description text,
    severity character varying(20) DEFAULT 'LOW'::character varying NOT NULL,
    alert_type character varying(100) NOT NULL,
    status character varying(50) DEFAULT 'NEW'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at timestamp without time zone,
    resolved_at timestamp without time zone
);


ALTER TABLE public.security_alerts OWNER TO postgres;

--
-- Name: security_alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.security_alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.security_alerts_id_seq OWNER TO postgres;

--
-- Name: security_alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.security_alerts_id_seq OWNED BY public.security_alerts.id;


--
-- Name: threat_intelligence; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.threat_intelligence (
    id integer NOT NULL,
    attack_type character varying(100) NOT NULL,
    severity character varying(20) DEFAULT 'LOW'::character varying NOT NULL,
    risk_score integer DEFAULT 0 NOT NULL,
    description text NOT NULL,
    recommended_response text NOT NULL,
    detection_count integer DEFAULT 0 NOT NULL,
    last_detected_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.threat_intelligence OWNER TO postgres;

--
-- Name: threat_intelligence_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.threat_intelligence_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.threat_intelligence_id_seq OWNER TO postgres;

--
-- Name: threat_intelligence_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.threat_intelligence_id_seq OWNED BY public.threat_intelligence.id;


--
-- Name: threats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.threats (
    id integer NOT NULL,
    prediction_id integer,
    attack_type character varying(100) NOT NULL,
    source_ip character varying(50) DEFAULT 'Not available'::character varying,
    destination_ip character varying(50) DEFAULT 'Not available'::character varying,
    protocol character varying(20) DEFAULT 'TCP'::character varying,
    confidence double precision DEFAULT 0.0 NOT NULL,
    risk_score integer DEFAULT 0 NOT NULL,
    severity character varying(20) DEFAULT 'LOW'::character varying NOT NULL,
    detected_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50) DEFAULT 'NEW'::character varying
);


ALTER TABLE public.threats OWNER TO postgres;

--
-- Name: threats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.threats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.threats_id_seq OWNER TO postgres;

--
-- Name: threats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.threats_id_seq OWNED BY public.threats.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'SECURITY_ANALYST'::character varying NOT NULL,
    status character varying(50) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: datasets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.datasets ALTER COLUMN id SET DEFAULT nextval('public.datasets_id_seq'::regclass);


--
-- Name: incidents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incidents ALTER COLUMN id SET DEFAULT nextval('public.incidents_id_seq'::regclass);


--
-- Name: network_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_logs ALTER COLUMN id SET DEFAULT nextval('public.network_logs_id_seq'::regclass);


--
-- Name: network_traffic id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_traffic ALTER COLUMN id SET DEFAULT nextval('public.network_traffic_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: predictions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictions ALTER COLUMN id SET DEFAULT nextval('public.predictions_id_seq'::regclass);


--
-- Name: reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- Name: security_alerts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_alerts ALTER COLUMN id SET DEFAULT nextval('public.security_alerts_id_seq'::regclass);


--
-- Name: threat_intelligence id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.threat_intelligence ALTER COLUMN id SET DEFAULT nextval('public.threat_intelligence_id_seq'::regclass);


--
-- Name: threats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.threats ALTER COLUMN id SET DEFAULT nextval('public.threats_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action, module, ip_address, "timestamp") FROM stdin;
1	1	SYSTEM_INITIALIZATION	DATABASE	127.0.0.1	2026-09-05 14:34:55
2	3	PUBLIC_USER_REGISTERED	AUTH	172.18.0.1	2026-09-05 15:12:12
3	3	USER_LOGIN	AUTH	172.18.0.1	2026-09-05 15:12:34
4	3	DATASET_UPLOAD_sample_network_traffic.csv	UPLOAD	172.18.0.1	2026-09-05 15:25:12
5	3	REPORT_GENERATED_report_security_audit_report_20260905_152559.json	REPORTS	172.18.0.1	2026-09-05 15:25:59
6	3	DATASET_UPLOAD_ftp_patator_sample.csv	UPLOAD	172.18.0.1	2026-09-05 16:21:49
7	3	USER_LOGIN	AUTH	172.18.0.1	2026-09-06 05:02:07
8	3	DATASET_UPLOAD_benign_sample.csv	UPLOAD	172.18.0.1	2026-09-06 05:03:54
9	3	DATASET_UPLOAD_ssh_patator_sample.csv	UPLOAD	172.18.0.1	2026-09-06 05:04:26
10	3	DATASET_UPLOAD_ftp_patator_sample.csv	UPLOAD	172.18.0.1	2026-09-06 05:04:49
11	3	ALERT_STATUS_UPDATE_4_FROM_NEW_TO_ACKNOWLEDGED	ALERTS	172.18.0.1	2026-09-06 05:05:11
12	3	ALERT_STATUS_UPDATE_4_FROM_ACKNOWLEDGED_TO_INVESTIGATING	ALERTS	172.18.0.1	2026-09-06 05:05:14
13	3	ALERT_STATUS_UPDATE_4_FROM_INVESTIGATING_TO_RESOLVED	ALERTS	172.18.0.1	2026-09-06 05:05:16
14	3	INCIDENT_UPDATED_2_STATUS_INVESTIGATING	INCIDENTS	172.18.0.1	2026-09-06 05:05:25
15	3	INCIDENT_UPDATED_2_STATUS_CONTAINED	INCIDENTS	172.18.0.1	2026-09-06 05:05:27
16	1	USER_LOGIN	AUTH	127.0.0.1	2026-09-06 06:32:22
17	1	ALERT_STATUS_UPDATE_4_FROM_RESOLVED_TO_INVESTIGATING	ALERTS	127.0.0.1	2026-09-06 06:32:22
18	1	INCIDENT_CREATED_3	INCIDENTS	127.0.0.1	2026-09-06 06:32:22
19	1	INCIDENT_UPDATED_3_STATUS_RESOLVED	INCIDENTS	127.0.0.1	2026-09-06 06:32:22
20	1	REPORT_GENERATED_report_threat_detection_security_report_20260906_063222.json	REPORTS	127.0.0.1	2026-09-06 06:32:22
21	3	USER_LOGIN	AUTH	172.18.0.1	2026-09-06 08:27:45
22	3	DATASET_UPLOAD_sample_network_traffic.csv	UPLOAD	172.18.0.1	2026-09-06 08:57:01
23	1	USER_LOGIN	AUTH	172.18.0.1	2026-09-06 10:50:14.251775
24	1	USER_LOGIN	AUTH	172.18.0.1	2026-09-06 10:50:30.087251
25	1	USER_LOGIN	AUTH	172.18.0.1	2026-09-06 10:50:54.888679
26	1	USER_LOGIN	AUTH	172.18.0.1	2026-09-06 10:51:13.05354
27	1	USER_LOGIN	AUTH	172.18.0.1	2026-09-06 10:51:35.18269
28	1	PostgreSQL Primary Verification Test	Database Migration	127.0.0.1	2026-09-06 10:52:31.056873
29	1	USER_LOGIN	AUTH	172.18.0.1	2026-09-06 10:53:06.905438
30	1	USER_LOGIN	AUTH	172.18.0.1	2026-09-06 10:53:23.952834
31	1	USER_LOGIN	AUTH	172.18.0.1	2026-09-06 10:57:07.299309
32	1	USER_LOGIN	AUTH	172.18.0.1	2026-09-06 10:57:42.834095
33	1	USER_LOGIN	AUTH	172.18.0.1	2026-09-06 10:58:14.679544
34	3	USER_LOGIN	AUTH	172.18.0.1	2026-09-06 11:04:05.261411
35	1	USER_LOGIN	AUTH	172.18.0.1	2026-09-06 12:28:42.727795
36	1	USER_LOGIN	AUTH	172.18.0.1	2026-09-06 12:33:10.384346
37	1	USER_LOGIN	AUTH	172.18.0.1	2026-09-06 12:45:57.081478
38	1	USER_LOGIN	AUTH	172.18.0.1	2026-09-06 12:47:40.508682
39	3	DATASET_UPLOAD_ddos_sample.csv	UPLOAD	172.18.0.1	2026-09-06 12:49:53.808127
40	1	USER_LOGIN	AUTH	172.18.0.1	2026-09-06 12:54:58.666407
\.


--
-- Data for Name: datasets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.datasets (id, filename, dataset_type, rows_count, columns_count, uploaded_by, upload_time, has_ground_truth, status) FROM stdin;
1	sample_network_traffic.csv	CICIDS2017	500	82	3	2026-09-05 15:25:12	t	PROCESSED
2	ftp_patator_sample.csv	CICIDS2017	42	82	3	2026-09-05 16:21:49	t	PROCESSED
3	benign_sample.csv	CICIDS2017	50	82	3	2026-09-06 05:03:54	t	PROCESSED
4	ssh_patator_sample.csv	CICIDS2017	43	82	3	2026-09-06 05:04:26	t	PROCESSED
5	ftp_patator_sample.csv	CICIDS2017	42	82	3	2026-09-06 05:04:49	t	PROCESSED
6	sample_network_traffic.csv	CICIDS2017	500	82	3	2026-09-06 08:57:01	t	PROCESSED
7	ddos_sample.csv	CICIDS2017	50	82	3	2026-09-06 12:49:53.803462	t	PROCESSED
\.


--
-- Data for Name: incidents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.incidents (id, alert_id, title, description, priority, assigned_to, status, created_at, updated_at, resolved_at, resolution) FROM stdin;
1	1	DDoS Attack Escalation	Target system: 10.0.0.14.	CRITICAL	2	OPEN	2026-09-05 15:25:19	2026-09-05 15:25:19	\N	\N
2	3	SSH-Patator Attack Escalation	Target system: 10.0.0.15.	CRITICAL	2	CONTAINED	2026-09-06 05:04:27	2026-09-06 05:05:27	\N	\N
3	\N	Test Escalated DDoS Incident	Automated test incident tracking	CRITICAL	1	RESOLVED	2026-09-06 06:32:22	2026-09-06 06:32:22	2026-09-06 06:32:22	Blocked source IPs on border firewall and mitigation completed.
4	5	DDoS Attack Escalation	Target system: 10.0.0.14.	CRITICAL	2	OPEN	2026-09-06 08:57:11	2026-09-06 08:57:11	\N	\N
5	6	DDoS Attack Escalation	Target system: 10.0.0.8.	CRITICAL	2	OPEN	2026-09-06 12:49:54.120404	2026-09-06 12:49:54.120404	\N	\N
\.


--
-- Data for Name: network_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.network_logs (id, "timestamp", source_ip, destination_ip, protocol, packets, bytes, duration, traffic_rate, status) FROM stdin;
\.


--
-- Data for Name: network_traffic; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.network_traffic (id, "timestamp", source_ip, destination_ip, protocol, packets, bytes, duration, traffic_rate) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, alert_id, title, message, severity, is_read, created_at) FROM stdin;
1	1	1	CRITICAL Dataset Analysis Complete	DDoS Threat Detected	CRITICAL	t	2026-09-05 15:25:19
2	2	1	CRITICAL Dataset Analysis Complete	DDoS Threat Detected	CRITICAL	f	2026-09-05 15:25:19
3	3	1	CRITICAL Dataset Analysis Complete	DDoS Threat Detected	CRITICAL	f	2026-09-05 15:25:19
4	1	2	HIGH Dataset Analysis Complete	Threat Threat Detected	HIGH	t	2026-09-05 16:21:50
5	2	2	HIGH Dataset Analysis Complete	Threat Threat Detected	HIGH	f	2026-09-05 16:21:50
6	3	2	HIGH Dataset Analysis Complete	Threat Threat Detected	HIGH	f	2026-09-05 16:21:50
7	1	3	CRITICAL Dataset Analysis Complete	SSH-Patator Threat Detected	CRITICAL	t	2026-09-06 05:04:27
8	2	3	CRITICAL Dataset Analysis Complete	SSH-Patator Threat Detected	CRITICAL	f	2026-09-06 05:04:27
9	3	3	CRITICAL Dataset Analysis Complete	SSH-Patator Threat Detected	CRITICAL	f	2026-09-06 05:04:27
10	1	4	HIGH Dataset Analysis Complete	Threat Threat Detected	HIGH	t	2026-09-06 05:04:50
11	2	4	HIGH Dataset Analysis Complete	Threat Threat Detected	HIGH	f	2026-09-06 05:04:50
12	3	4	HIGH Dataset Analysis Complete	Threat Threat Detected	HIGH	f	2026-09-06 05:04:50
13	1	5	CRITICAL Dataset Analysis Complete	DDoS Threat Detected	CRITICAL	f	2026-09-06 08:57:11
14	2	5	CRITICAL Dataset Analysis Complete	DDoS Threat Detected	CRITICAL	f	2026-09-06 08:57:11
15	3	5	CRITICAL Dataset Analysis Complete	DDoS Threat Detected	CRITICAL	f	2026-09-06 08:57:11
16	2	6	CRITICAL Dataset Analysis Complete	DDoS Threat Detected	CRITICAL	f	2026-09-06 12:49:54.123676
17	3	6	CRITICAL Dataset Analysis Complete	DDoS Threat Detected	CRITICAL	f	2026-09-06 12:49:54.126327
18	1	6	CRITICAL Dataset Analysis Complete	DDoS Threat Detected	CRITICAL	f	2026-09-06 12:49:54.128006
\.


--
-- Data for Name: predictions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.predictions (id, dataset_id, "timestamp", actual_label, predicted_label, confidence, risk_score, severity) FROM stdin;
1	1	2026-09-05 15:25:13	DDoS	DDoS	1	95	CRITICAL
2	1	2026-09-05 15:25:13	DDoS	DDoS	1	95	CRITICAL
3	1	2026-09-05 15:25:13	FTP-Patator	FTP-Patator	0.83	65	MEDIUM
4	1	2026-09-05 15:25:13	BENIGN	BENIGN	1	5	LOW
5	1	2026-09-05 15:25:13	DDoS	DDoS	1	95	CRITICAL
6	1	2026-09-05 15:25:13	BENIGN	BENIGN	1	5	LOW
7	1	2026-09-05 15:25:13	DDoS	DDoS	1	95	CRITICAL
8	1	2026-09-05 15:25:13	BENIGN	BENIGN	1	5	LOW
9	1	2026-09-05 15:25:13	BENIGN	BENIGN	1	5	LOW
10	1	2026-09-05 15:25:13	BENIGN	BENIGN	0.99	5	LOW
11	1	2026-09-05 15:25:13	BENIGN	BENIGN	1	5	LOW
12	1	2026-09-05 15:25:13	BENIGN	BENIGN	0.99	5	LOW
13	1	2026-09-05 15:25:13	BENIGN	BENIGN	1	5	LOW
14	1	2026-09-05 15:25:13	BENIGN	BENIGN	1	5	LOW
15	1	2026-09-05 15:25:13	FTP-Patator	FTP-Patator	0.99	65	MEDIUM
16	1	2026-09-05 15:25:13	BENIGN	BENIGN	1	5	LOW
17	1	2026-09-05 15:25:13	DDoS	DDoS	1	95	CRITICAL
18	1	2026-09-05 15:25:13	BENIGN	BENIGN	1	5	LOW
19	1	2026-09-05 15:25:13	SSH-Patator	SSH-Patator	0.94	80	HIGH
20	1	2026-09-05 15:25:13	BENIGN	BENIGN	1	5	LOW
21	1	2026-09-05 15:25:13	DDoS	DDoS	1	95	CRITICAL
22	1	2026-09-05 15:25:13	DDoS	DDoS	1	95	CRITICAL
23	1	2026-09-05 15:25:13	FTP-Patator	FTP-Patator	0.97	65	MEDIUM
24	1	2026-09-05 15:25:13	FTP-Patator	FTP-Patator	0.91	65	MEDIUM
25	1	2026-09-05 15:25:13	BENIGN	BENIGN	1	5	LOW
26	1	2026-09-05 15:25:13	BENIGN	BENIGN	0.96	5	LOW
27	1	2026-09-05 15:25:13	BENIGN	BENIGN	1	5	LOW
28	1	2026-09-05 15:25:13	BENIGN	BENIGN	1	5	LOW
29	1	2026-09-05 15:25:13	DDoS	DDoS	1	95	CRITICAL
30	1	2026-09-05 15:25:13	SSH-Patator	SSH-Patator	0.91	80	HIGH
31	1	2026-09-05 15:25:13	BENIGN	BENIGN	1	5	LOW
32	1	2026-09-05 15:25:13	FTP-Patator	FTP-Patator	0.95	65	MEDIUM
33	1	2026-09-05 15:25:13	DDoS	DDoS	1	95	CRITICAL
34	1	2026-09-05 15:25:13	BENIGN	BENIGN	0.99	5	LOW
35	1	2026-09-05 15:25:13	BENIGN	BENIGN	1	5	LOW
36	1	2026-09-05 15:25:13	SSH-Patator	SSH-Patator	1	80	HIGH
37	1	2026-09-05 15:25:13	DDoS	DDoS	1	95	CRITICAL
38	1	2026-09-05 15:25:13	BENIGN	BENIGN	0.95	5	LOW
39	1	2026-09-05 15:25:13	DDoS	DDoS	1	95	CRITICAL
40	1	2026-09-05 15:25:13	BENIGN	BENIGN	1	5	LOW
41	1	2026-09-05 15:25:13	FTP-Patator	FTP-Patator	0.98	65	MEDIUM
42	1	2026-09-05 15:25:13	BENIGN	BENIGN	1	5	LOW
43	1	2026-09-05 15:25:14	SSH-Patator	SSH-Patator	0.99	80	HIGH
44	1	2026-09-05 15:25:14	BENIGN	BENIGN	0.98	5	LOW
45	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
46	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
47	1	2026-09-05 15:25:14	BENIGN	BENIGN	0.9	5	LOW
48	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
49	1	2026-09-05 15:25:14	SSH-Patator	SSH-Patator	0.93	80	HIGH
50	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
51	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
52	1	2026-09-05 15:25:14	FTP-Patator	FTP-Patator	0.84	65	MEDIUM
53	1	2026-09-05 15:25:14	BENIGN	BENIGN	0.95	5	LOW
54	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
55	1	2026-09-05 15:25:14	SSH-Patator	SSH-Patator	0.86	80	HIGH
56	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
57	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
58	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
59	1	2026-09-05 15:25:14	BENIGN	BENIGN	0.99	5	LOW
60	1	2026-09-05 15:25:14	BENIGN	BENIGN	0.97	5	LOW
61	1	2026-09-05 15:25:14	BENIGN	BENIGN	0.96	5	LOW
62	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
63	1	2026-09-05 15:25:14	BENIGN	BENIGN	0.94	5	LOW
64	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
65	1	2026-09-05 15:25:14	FTP-Patator	FTP-Patator	0.98	65	MEDIUM
66	1	2026-09-05 15:25:14	SSH-Patator	SSH-Patator	0.96	80	HIGH
67	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
68	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
69	1	2026-09-05 15:25:14	FTP-Patator	FTP-Patator	0.99	65	MEDIUM
70	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
71	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
72	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
73	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
74	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
75	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
76	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
77	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
78	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
79	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
80	1	2026-09-05 15:25:14	FTP-Patator	FTP-Patator	0.95	65	MEDIUM
81	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
82	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
83	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
84	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
85	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
86	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
87	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
88	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
89	1	2026-09-05 15:25:14	FTP-Patator	FTP-Patator	0.91	65	MEDIUM
90	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
91	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
92	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
93	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
94	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
95	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
96	1	2026-09-05 15:25:14	FTP-Patator	FTP-Patator	0.97	65	MEDIUM
97	1	2026-09-05 15:25:14	SSH-Patator	SSH-Patator	0.97	80	HIGH
98	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
99	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
100	1	2026-09-05 15:25:14	BENIGN	BENIGN	0.99	5	LOW
101	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
102	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
103	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
104	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
105	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
106	1	2026-09-05 15:25:14	BENIGN	BENIGN	0.99	5	LOW
107	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
108	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
109	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
110	1	2026-09-05 15:25:14	DDoS	DDoS	1	95	CRITICAL
111	1	2026-09-05 15:25:14	BENIGN	BENIGN	0.99	5	LOW
112	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
113	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
114	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
115	1	2026-09-05 15:25:14	FTP-Patator	FTP-Patator	1	65	MEDIUM
116	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
117	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
118	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
119	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
120	1	2026-09-05 15:25:14	BENIGN	BENIGN	1	5	LOW
121	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
122	1	2026-09-05 15:25:15	DDoS	DDoS	1	95	CRITICAL
123	1	2026-09-05 15:25:15	BENIGN	BENIGN	0.99	5	LOW
124	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
125	1	2026-09-05 15:25:15	FTP-Patator	FTP-Patator	0.97	65	MEDIUM
126	1	2026-09-05 15:25:15	BENIGN	BENIGN	0.94	5	LOW
127	1	2026-09-05 15:25:15	BENIGN	BENIGN	0.99	5	LOW
128	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
129	1	2026-09-05 15:25:15	SSH-Patator	SSH-Patator	0.97	80	HIGH
130	1	2026-09-05 15:25:15	BENIGN	BENIGN	0.98	5	LOW
131	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
132	1	2026-09-05 15:25:15	FTP-Patator	FTP-Patator	0.99	65	MEDIUM
133	1	2026-09-05 15:25:15	SSH-Patator	SSH-Patator	0.98	80	HIGH
134	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
135	1	2026-09-05 15:25:15	DDoS	DDoS	1	95	CRITICAL
136	1	2026-09-05 15:25:15	BENIGN	BENIGN	0.99	5	LOW
137	1	2026-09-05 15:25:15	DDoS	DDoS	1	95	CRITICAL
138	1	2026-09-05 15:25:15	BENIGN	BENIGN	0.99	5	LOW
139	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
140	1	2026-09-05 15:25:15	BENIGN	BENIGN	0.99	5	LOW
141	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
142	1	2026-09-05 15:25:15	BENIGN	BENIGN	0.98	5	LOW
143	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
144	1	2026-09-05 15:25:15	DDoS	DDoS	1	95	CRITICAL
145	1	2026-09-05 15:25:15	FTP-Patator	FTP-Patator	0.97	65	MEDIUM
146	1	2026-09-05 15:25:15	DDoS	DDoS	1	95	CRITICAL
147	1	2026-09-05 15:25:15	BENIGN	BENIGN	0.99	5	LOW
148	1	2026-09-05 15:25:15	BENIGN	BENIGN	0.99	5	LOW
149	1	2026-09-05 15:25:15	DDoS	DDoS	1	95	CRITICAL
150	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
151	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
152	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
153	1	2026-09-05 15:25:15	BENIGN	BENIGN	0.99	5	LOW
154	1	2026-09-05 15:25:15	BENIGN	BENIGN	0.99	5	LOW
155	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
156	1	2026-09-05 15:25:15	BENIGN	BENIGN	0.99	5	LOW
157	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
158	1	2026-09-05 15:25:15	DDoS	DDoS	1	95	CRITICAL
159	1	2026-09-05 15:25:15	DDoS	DDoS	1	95	CRITICAL
160	1	2026-09-05 15:25:15	DDoS	DDoS	1	95	CRITICAL
161	1	2026-09-05 15:25:15	BENIGN	BENIGN	0.97	5	LOW
162	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
163	1	2026-09-05 15:25:15	DDoS	DDoS	1	95	CRITICAL
164	1	2026-09-05 15:25:15	DDoS	DDoS	1	95	CRITICAL
165	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
166	1	2026-09-05 15:25:15	SSH-Patator	SSH-Patator	0.96	80	HIGH
167	1	2026-09-05 15:25:15	SSH-Patator	SSH-Patator	0.97	80	HIGH
168	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
169	1	2026-09-05 15:25:15	DDoS	DDoS	1	95	CRITICAL
170	1	2026-09-05 15:25:15	DDoS	DDoS	1	95	CRITICAL
171	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
172	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
173	1	2026-09-05 15:25:15	BENIGN	BENIGN	0.94	5	LOW
174	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
175	1	2026-09-05 15:25:15	DDoS	DDoS	1	95	CRITICAL
176	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
177	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
178	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
179	1	2026-09-05 15:25:15	DDoS	DDoS	1	95	CRITICAL
180	1	2026-09-05 15:25:15	BENIGN	BENIGN	0.99	5	LOW
181	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
182	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
183	1	2026-09-05 15:25:15	BENIGN	BENIGN	0.99	5	LOW
184	1	2026-09-05 15:25:15	BENIGN	BENIGN	0.96	5	LOW
185	1	2026-09-05 15:25:15	BENIGN	BENIGN	0.96	5	LOW
186	1	2026-09-05 15:25:15	DDoS	DDoS	1	95	CRITICAL
187	1	2026-09-05 15:25:15	BENIGN	BENIGN	0.99	5	LOW
188	1	2026-09-05 15:25:15	FTP-Patator	FTP-Patator	0.8	65	MEDIUM
189	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
190	1	2026-09-05 15:25:15	DDoS	DDoS	1	95	CRITICAL
191	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
192	1	2026-09-05 15:25:15	DDoS	DDoS	1	95	CRITICAL
193	1	2026-09-05 15:25:15	DDoS	DDoS	1	95	CRITICAL
194	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
195	1	2026-09-05 15:25:15	DDoS	DDoS	1	95	CRITICAL
196	1	2026-09-05 15:25:15	DDoS	DDoS	1	95	CRITICAL
197	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
198	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
199	1	2026-09-05 15:25:15	BENIGN	BENIGN	1	5	LOW
200	1	2026-09-05 15:25:15	FTP-Patator	FTP-Patator	1	65	MEDIUM
201	1	2026-09-05 15:25:16	SSH-Patator	SSH-Patator	1	80	HIGH
202	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
203	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
204	1	2026-09-05 15:25:16	BENIGN	BENIGN	0.99	5	LOW
205	1	2026-09-05 15:25:16	SSH-Patator	SSH-Patator	0.88	80	HIGH
206	1	2026-09-05 15:25:16	DDoS	DDoS	1	95	CRITICAL
207	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
208	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
209	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
210	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
211	1	2026-09-05 15:25:16	DDoS	DDoS	1	95	CRITICAL
212	1	2026-09-05 15:25:16	SSH-Patator	SSH-Patator	0.91	80	HIGH
213	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
214	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
215	1	2026-09-05 15:25:16	DDoS	DDoS	1	95	CRITICAL
216	1	2026-09-05 15:25:16	DDoS	DDoS	1	95	CRITICAL
217	1	2026-09-05 15:25:16	BENIGN	BENIGN	0.98	5	LOW
218	1	2026-09-05 15:25:16	FTP-Patator	FTP-Patator	0.98	65	MEDIUM
219	1	2026-09-05 15:25:16	BENIGN	BENIGN	0.96	5	LOW
220	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
221	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
222	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
223	1	2026-09-05 15:25:16	FTP-Patator	FTP-Patator	0.85	65	MEDIUM
224	1	2026-09-05 15:25:16	DDoS	DDoS	1	95	CRITICAL
225	1	2026-09-05 15:25:16	FTP-Patator	FTP-Patator	0.94	65	MEDIUM
226	1	2026-09-05 15:25:16	DDoS	DDoS	1	95	CRITICAL
227	1	2026-09-05 15:25:16	DDoS	DDoS	1	95	CRITICAL
228	1	2026-09-05 15:25:16	FTP-Patator	FTP-Patator	0.99	65	MEDIUM
229	1	2026-09-05 15:25:16	FTP-Patator	FTP-Patator	0.98	65	MEDIUM
230	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
231	1	2026-09-05 15:25:16	BENIGN	BENIGN	0.98	5	LOW
232	1	2026-09-05 15:25:16	BENIGN	BENIGN	0.99	5	LOW
233	1	2026-09-05 15:25:16	SSH-Patator	SSH-Patator	0.99	80	HIGH
234	1	2026-09-05 15:25:16	SSH-Patator	SSH-Patator	0.98	80	HIGH
235	1	2026-09-05 15:25:16	DDoS	DDoS	1	95	CRITICAL
236	1	2026-09-05 15:25:16	DDoS	DDoS	1	95	CRITICAL
237	1	2026-09-05 15:25:16	DDoS	DDoS	1	95	CRITICAL
238	1	2026-09-05 15:25:16	FTP-Patator	FTP-Patator	0.95	65	MEDIUM
239	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
240	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
241	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
242	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
243	1	2026-09-05 15:25:16	DDoS	DDoS	1	95	CRITICAL
244	1	2026-09-05 15:25:16	DDoS	DDoS	0.96	95	CRITICAL
245	1	2026-09-05 15:25:16	DDoS	DDoS	1	95	CRITICAL
246	1	2026-09-05 15:25:16	BENIGN	BENIGN	0.92	5	LOW
247	1	2026-09-05 15:25:16	FTP-Patator	FTP-Patator	0.91	65	MEDIUM
248	1	2026-09-05 15:25:16	BENIGN	BENIGN	0.99	5	LOW
249	1	2026-09-05 15:25:16	SSH-Patator	SSH-Patator	0.91	80	HIGH
250	1	2026-09-05 15:25:16	DDoS	DDoS	1	95	CRITICAL
251	1	2026-09-05 15:25:16	FTP-Patator	FTP-Patator	0.94	65	MEDIUM
252	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
253	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
254	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
255	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
256	1	2026-09-05 15:25:16	DDoS	DDoS	1	95	CRITICAL
257	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
258	1	2026-09-05 15:25:16	SSH-Patator	SSH-Patator	0.95	80	HIGH
259	1	2026-09-05 15:25:16	SSH-Patator	SSH-Patator	0.98	80	HIGH
260	1	2026-09-05 15:25:16	FTP-Patator	FTP-Patator	0.96	65	MEDIUM
261	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
262	1	2026-09-05 15:25:16	SSH-Patator	SSH-Patator	0.92	80	HIGH
263	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
264	1	2026-09-05 15:25:16	DDoS	DDoS	1	95	CRITICAL
265	1	2026-09-05 15:25:16	BENIGN	BENIGN	0.98	5	LOW
266	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
267	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
268	1	2026-09-05 15:25:16	DDoS	DDoS	1	95	CRITICAL
269	1	2026-09-05 15:25:16	SSH-Patator	SSH-Patator	0.99	80	HIGH
270	1	2026-09-05 15:25:16	BENIGN	BENIGN	1	5	LOW
271	1	2026-09-05 15:25:16	DDoS	DDoS	1	95	CRITICAL
272	1	2026-09-05 15:25:16	DDoS	DDoS	1	95	CRITICAL
273	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
274	1	2026-09-05 15:25:17	BENIGN	BENIGN	0.96	5	LOW
275	1	2026-09-05 15:25:17	FTP-Patator	FTP-Patator	0.43	65	MEDIUM
276	1	2026-09-05 15:25:17	BENIGN	BENIGN	0.98	5	LOW
277	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
278	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
279	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
280	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
281	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
282	1	2026-09-05 15:25:17	BENIGN	BENIGN	0.96	5	LOW
283	1	2026-09-05 15:25:17	SSH-Patator	SSH-Patator	0.92	80	HIGH
284	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
285	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
286	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
287	1	2026-09-05 15:25:17	FTP-Patator	FTP-Patator	0.81	65	MEDIUM
288	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
289	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
290	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
291	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
292	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
293	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
294	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
295	1	2026-09-05 15:25:17	BENIGN	BENIGN	0.99	5	LOW
296	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
297	1	2026-09-05 15:25:17	BENIGN	BENIGN	0.98	5	LOW
298	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
299	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
300	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
301	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
302	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
303	1	2026-09-05 15:25:17	SSH-Patator	SSH-Patator	0.81	80	HIGH
304	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
305	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
306	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
307	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
308	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
309	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
310	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
311	1	2026-09-05 15:25:17	BENIGN	BENIGN	0.98	5	LOW
312	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
313	1	2026-09-05 15:25:17	FTP-Patator	FTP-Patator	0.71	65	MEDIUM
314	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
315	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
316	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
317	1	2026-09-05 15:25:17	BENIGN	BENIGN	0.95	5	LOW
318	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
319	1	2026-09-05 15:25:17	BENIGN	BENIGN	0.96	5	LOW
320	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
321	1	2026-09-05 15:25:17	FTP-Patator	FTP-Patator	0.94	65	MEDIUM
322	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
323	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
324	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
325	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
326	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
327	1	2026-09-05 15:25:17	BENIGN	BENIGN	0.99	5	LOW
328	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
329	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
330	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
331	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
332	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
333	1	2026-09-05 15:25:17	FTP-Patator	FTP-Patator	0.97	65	MEDIUM
334	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
335	1	2026-09-05 15:25:17	DDoS	DDoS	0.96	95	CRITICAL
336	1	2026-09-05 15:25:17	BENIGN	BENIGN	0.97	5	LOW
337	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
338	1	2026-09-05 15:25:17	BENIGN	BENIGN	0.97	5	LOW
339	1	2026-09-05 15:25:17	BENIGN	BENIGN	0.99	5	LOW
340	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
341	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
342	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
343	1	2026-09-05 15:25:17	BENIGN	BENIGN	0.92	5	LOW
344	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
345	1	2026-09-05 15:25:17	SSH-Patator	SSH-Patator	0.99	80	HIGH
346	1	2026-09-05 15:25:17	DDoS	DDoS	1	95	CRITICAL
347	1	2026-09-05 15:25:17	BENIGN	BENIGN	1	5	LOW
348	1	2026-09-05 15:25:17	BENIGN	BENIGN	0.97	5	LOW
349	1	2026-09-05 15:25:17	FTP-Patator	FTP-Patator	0.85	65	MEDIUM
350	1	2026-09-05 15:25:18	SSH-Patator	SSH-Patator	0.98	80	HIGH
351	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
352	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
353	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
354	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
355	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
356	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
357	1	2026-09-05 15:25:18	FTP-Patator	FTP-Patator	0.98	65	MEDIUM
358	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
359	1	2026-09-05 15:25:18	FTP-Patator	FTP-Patator	1	65	MEDIUM
360	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
361	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
362	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
363	1	2026-09-05 15:25:18	BENIGN	BENIGN	0.97	5	LOW
364	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
365	1	2026-09-05 15:25:18	SSH-Patator	SSH-Patator	0.69	80	HIGH
366	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
367	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
368	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
369	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
370	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
371	1	2026-09-05 15:25:18	SSH-Patator	SSH-Patator	0.89	80	HIGH
372	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
373	1	2026-09-05 15:25:18	SSH-Patator	SSH-Patator	1	80	HIGH
374	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
375	1	2026-09-05 15:25:18	BENIGN	BENIGN	0.99	5	LOW
376	1	2026-09-05 15:25:18	SSH-Patator	SSH-Patator	0.95	80	HIGH
377	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
378	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
379	1	2026-09-05 15:25:18	BENIGN	BENIGN	0.78	5	LOW
380	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
381	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
382	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
383	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
384	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
385	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
386	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
387	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
388	1	2026-09-05 15:25:18	FTP-Patator	FTP-Patator	0.99	65	MEDIUM
389	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
390	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
391	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
392	1	2026-09-05 15:25:18	DDoS	DDoS	0.99	95	CRITICAL
393	1	2026-09-05 15:25:18	DDoS	DDoS	0.99	95	CRITICAL
394	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
395	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
396	1	2026-09-05 15:25:18	BENIGN	BENIGN	0.93	5	LOW
397	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
398	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
399	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
400	1	2026-09-05 15:25:18	BENIGN	BENIGN	0.97	5	LOW
401	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
402	1	2026-09-05 15:25:18	SSH-Patator	SSH-Patator	0.98	80	HIGH
403	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
404	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
405	1	2026-09-05 15:25:18	SSH-Patator	SSH-Patator	0.97	80	HIGH
406	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
407	1	2026-09-05 15:25:18	SSH-Patator	SSH-Patator	0.98	80	HIGH
408	1	2026-09-05 15:25:18	SSH-Patator	SSH-Patator	0.94	80	HIGH
409	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
410	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
411	1	2026-09-05 15:25:18	BENIGN	BENIGN	0.99	5	LOW
412	1	2026-09-05 15:25:18	FTP-Patator	FTP-Patator	0.88	65	MEDIUM
413	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
414	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
415	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
416	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
417	1	2026-09-05 15:25:18	FTP-Patator	FTP-Patator	1	65	MEDIUM
418	1	2026-09-05 15:25:18	BENIGN	BENIGN	0.99	5	LOW
419	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
420	1	2026-09-05 15:25:18	BENIGN	BENIGN	1	5	LOW
421	1	2026-09-05 15:25:18	BENIGN	BENIGN	0.97	5	LOW
422	1	2026-09-05 15:25:18	DDoS	DDoS	1	95	CRITICAL
423	1	2026-09-05 15:25:19	DDoS	DDoS	1	95	CRITICAL
424	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
425	1	2026-09-05 15:25:19	SSH-Patator	SSH-Patator	0.94	80	HIGH
426	1	2026-09-05 15:25:19	DDoS	DDoS	1	95	CRITICAL
427	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
428	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
429	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
430	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
431	1	2026-09-05 15:25:19	DDoS	DDoS	1	95	CRITICAL
432	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
433	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
434	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
435	1	2026-09-05 15:25:19	FTP-Patator	FTP-Patator	0.94	65	MEDIUM
436	1	2026-09-05 15:25:19	SSH-Patator	SSH-Patator	0.54	80	HIGH
437	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
438	1	2026-09-05 15:25:19	DDoS	DDoS	1	95	CRITICAL
439	1	2026-09-05 15:25:19	BENIGN	BENIGN	0.99	5	LOW
440	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
441	1	2026-09-05 15:25:19	SSH-Patator	SSH-Patator	0.89	80	HIGH
442	1	2026-09-05 15:25:19	FTP-Patator	FTP-Patator	0.94	65	MEDIUM
443	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
444	1	2026-09-05 15:25:19	BENIGN	BENIGN	0.99	5	LOW
445	1	2026-09-05 15:25:19	DDoS	DDoS	1	95	CRITICAL
446	1	2026-09-05 15:25:19	SSH-Patator	SSH-Patator	0.92	80	HIGH
447	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
448	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
449	1	2026-09-05 15:25:19	BENIGN	BENIGN	0.99	5	LOW
450	1	2026-09-05 15:25:19	DDoS	DDoS	1	95	CRITICAL
451	1	2026-09-05 15:25:19	BENIGN	BENIGN	0.99	5	LOW
452	1	2026-09-05 15:25:19	BENIGN	BENIGN	0.99	5	LOW
453	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
454	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
455	1	2026-09-05 15:25:19	SSH-Patator	SSH-Patator	0.82	80	HIGH
456	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
457	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
458	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
459	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
460	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
461	1	2026-09-05 15:25:19	BENIGN	BENIGN	0.99	5	LOW
462	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
463	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
464	1	2026-09-05 15:25:19	DDoS	DDoS	1	95	CRITICAL
465	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
466	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
467	1	2026-09-05 15:25:19	DDoS	DDoS	1	95	CRITICAL
468	1	2026-09-05 15:25:19	SSH-Patator	SSH-Patator	1	80	HIGH
469	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
470	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
471	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
472	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
473	1	2026-09-05 15:25:19	DDoS	DDoS	1	95	CRITICAL
474	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
475	1	2026-09-05 15:25:19	BENIGN	BENIGN	0.99	5	LOW
476	1	2026-09-05 15:25:19	SSH-Patator	SSH-Patator	0.76	80	HIGH
477	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
478	1	2026-09-05 15:25:19	FTP-Patator	FTP-Patator	0.92	65	MEDIUM
479	1	2026-09-05 15:25:19	DDoS	DDoS	1	95	CRITICAL
480	1	2026-09-05 15:25:19	DDoS	DDoS	1	95	CRITICAL
481	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
482	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
483	1	2026-09-05 15:25:19	DDoS	DDoS	1	95	CRITICAL
484	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
485	1	2026-09-05 15:25:19	BENIGN	BENIGN	0.99	5	LOW
486	1	2026-09-05 15:25:19	DDoS	DDoS	1	95	CRITICAL
487	1	2026-09-05 15:25:19	BENIGN	BENIGN	0.94	5	LOW
488	1	2026-09-05 15:25:19	DDoS	DDoS	1	95	CRITICAL
489	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
490	1	2026-09-05 15:25:19	SSH-Patator	SSH-Patator	0.94	80	HIGH
491	1	2026-09-05 15:25:19	FTP-Patator	FTP-Patator	0.64	65	MEDIUM
492	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
493	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
494	1	2026-09-05 15:25:19	DDoS	DDoS	1	95	CRITICAL
495	1	2026-09-05 15:25:19	SSH-Patator	SSH-Patator	0.84	80	HIGH
496	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
497	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
498	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
499	1	2026-09-05 15:25:19	BENIGN	BENIGN	1	5	LOW
500	1	2026-09-05 15:25:19	DDoS	DDoS	1	95	CRITICAL
501	2	2026-09-05 16:21:49	FTP-Patator	FTP-Patator	0.83	65	MEDIUM
502	2	2026-09-05 16:21:49	FTP-Patator	FTP-Patator	0.99	65	MEDIUM
503	2	2026-09-05 16:21:49	FTP-Patator	FTP-Patator	0.97	65	MEDIUM
504	2	2026-09-05 16:21:49	FTP-Patator	FTP-Patator	0.91	65	MEDIUM
505	2	2026-09-05 16:21:49	FTP-Patator	FTP-Patator	0.95	65	MEDIUM
506	2	2026-09-05 16:21:49	FTP-Patator	FTP-Patator	0.98	65	MEDIUM
507	2	2026-09-05 16:21:49	FTP-Patator	FTP-Patator	0.84	65	MEDIUM
508	2	2026-09-05 16:21:49	FTP-Patator	FTP-Patator	0.98	65	MEDIUM
509	2	2026-09-05 16:21:49	FTP-Patator	FTP-Patator	0.99	65	MEDIUM
510	2	2026-09-05 16:21:49	FTP-Patator	FTP-Patator	0.95	65	MEDIUM
511	2	2026-09-05 16:21:49	FTP-Patator	FTP-Patator	0.91	65	MEDIUM
512	2	2026-09-05 16:21:49	FTP-Patator	FTP-Patator	0.97	65	MEDIUM
513	2	2026-09-05 16:21:49	FTP-Patator	FTP-Patator	1	65	MEDIUM
514	2	2026-09-05 16:21:49	FTP-Patator	FTP-Patator	0.97	65	MEDIUM
515	2	2026-09-05 16:21:49	FTP-Patator	FTP-Patator	0.99	65	MEDIUM
516	2	2026-09-05 16:21:49	FTP-Patator	FTP-Patator	0.97	65	MEDIUM
517	2	2026-09-05 16:21:49	FTP-Patator	FTP-Patator	0.8	65	MEDIUM
518	2	2026-09-05 16:21:49	FTP-Patator	FTP-Patator	1	65	MEDIUM
519	2	2026-09-05 16:21:49	FTP-Patator	FTP-Patator	0.98	65	MEDIUM
520	2	2026-09-05 16:21:49	FTP-Patator	FTP-Patator	0.85	65	MEDIUM
521	2	2026-09-05 16:21:49	FTP-Patator	FTP-Patator	0.94	65	MEDIUM
522	2	2026-09-05 16:21:49	FTP-Patator	FTP-Patator	0.99	65	MEDIUM
523	2	2026-09-05 16:21:50	FTP-Patator	FTP-Patator	0.98	65	MEDIUM
524	2	2026-09-05 16:21:50	FTP-Patator	FTP-Patator	0.95	65	MEDIUM
525	2	2026-09-05 16:21:50	FTP-Patator	FTP-Patator	0.91	65	MEDIUM
526	2	2026-09-05 16:21:50	FTP-Patator	FTP-Patator	0.94	65	MEDIUM
527	2	2026-09-05 16:21:50	FTP-Patator	FTP-Patator	0.96	65	MEDIUM
528	2	2026-09-05 16:21:50	FTP-Patator	FTP-Patator	0.43	65	MEDIUM
529	2	2026-09-05 16:21:50	FTP-Patator	FTP-Patator	0.81	65	MEDIUM
530	2	2026-09-05 16:21:50	FTP-Patator	FTP-Patator	0.71	65	MEDIUM
531	2	2026-09-05 16:21:50	FTP-Patator	FTP-Patator	0.94	65	MEDIUM
532	2	2026-09-05 16:21:50	FTP-Patator	FTP-Patator	0.97	65	MEDIUM
533	2	2026-09-05 16:21:50	FTP-Patator	FTP-Patator	0.85	65	MEDIUM
534	2	2026-09-05 16:21:50	FTP-Patator	FTP-Patator	0.98	65	MEDIUM
535	2	2026-09-05 16:21:50	FTP-Patator	FTP-Patator	1	65	MEDIUM
536	2	2026-09-05 16:21:50	FTP-Patator	FTP-Patator	0.99	65	MEDIUM
537	2	2026-09-05 16:21:50	FTP-Patator	FTP-Patator	0.88	65	MEDIUM
538	2	2026-09-05 16:21:50	FTP-Patator	FTP-Patator	1	65	MEDIUM
539	2	2026-09-05 16:21:50	FTP-Patator	FTP-Patator	0.94	65	MEDIUM
540	2	2026-09-05 16:21:50	FTP-Patator	FTP-Patator	0.94	65	MEDIUM
541	2	2026-09-05 16:21:50	FTP-Patator	FTP-Patator	0.92	65	MEDIUM
542	2	2026-09-05 16:21:50	FTP-Patator	FTP-Patator	0.64	65	MEDIUM
543	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
544	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
545	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
546	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
547	3	2026-09-06 05:03:55	BENIGN	BENIGN	0.99	5	LOW
548	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
549	3	2026-09-06 05:03:55	BENIGN	BENIGN	0.99	5	LOW
550	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
551	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
552	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
553	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
554	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
555	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
556	3	2026-09-06 05:03:55	BENIGN	BENIGN	0.96	5	LOW
557	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
558	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
559	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
560	3	2026-09-06 05:03:55	BENIGN	BENIGN	0.99	5	LOW
561	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
562	3	2026-09-06 05:03:55	BENIGN	BENIGN	0.95	5	LOW
563	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
564	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
565	3	2026-09-06 05:03:55	BENIGN	BENIGN	0.98	5	LOW
566	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
567	3	2026-09-06 05:03:55	BENIGN	BENIGN	0.9	5	LOW
568	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
569	3	2026-09-06 05:03:55	BENIGN	BENIGN	0.95	5	LOW
570	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
571	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
572	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
573	3	2026-09-06 05:03:55	BENIGN	BENIGN	0.99	5	LOW
574	3	2026-09-06 05:03:55	BENIGN	BENIGN	0.97	5	LOW
575	3	2026-09-06 05:03:55	BENIGN	BENIGN	0.96	5	LOW
576	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
577	3	2026-09-06 05:03:55	BENIGN	BENIGN	0.94	5	LOW
578	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
579	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
580	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
581	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
582	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
583	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
584	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
585	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
586	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
587	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
588	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
589	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
590	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
591	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
592	3	2026-09-06 05:03:55	BENIGN	BENIGN	1	5	LOW
593	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.94	80	HIGH
594	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.91	80	HIGH
595	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	1	80	HIGH
596	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.99	80	HIGH
597	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.93	80	HIGH
598	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.86	80	HIGH
599	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.96	80	HIGH
600	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.97	80	HIGH
601	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.97	80	HIGH
602	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.98	80	HIGH
603	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.96	80	HIGH
604	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.97	80	HIGH
605	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	1	80	HIGH
606	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.88	80	HIGH
607	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.91	80	HIGH
608	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.99	80	HIGH
609	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.98	80	HIGH
610	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.91	80	HIGH
611	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.95	80	HIGH
612	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.98	80	HIGH
613	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.92	80	HIGH
614	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.99	80	HIGH
615	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.92	80	HIGH
616	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.81	80	HIGH
617	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.99	80	HIGH
618	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.98	80	HIGH
619	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.69	80	HIGH
620	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.89	80	HIGH
621	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	1	80	HIGH
622	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.95	80	HIGH
623	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.98	80	HIGH
624	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.97	80	HIGH
625	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.98	80	HIGH
626	4	2026-09-06 05:04:26	SSH-Patator	SSH-Patator	0.94	80	HIGH
627	4	2026-09-06 05:04:27	SSH-Patator	SSH-Patator	0.94	80	HIGH
628	4	2026-09-06 05:04:27	SSH-Patator	SSH-Patator	0.54	80	HIGH
629	4	2026-09-06 05:04:27	SSH-Patator	SSH-Patator	0.89	80	HIGH
630	4	2026-09-06 05:04:27	SSH-Patator	SSH-Patator	0.92	80	HIGH
631	4	2026-09-06 05:04:27	SSH-Patator	SSH-Patator	0.82	80	HIGH
632	4	2026-09-06 05:04:27	SSH-Patator	SSH-Patator	1	80	HIGH
633	4	2026-09-06 05:04:27	SSH-Patator	SSH-Patator	0.76	80	HIGH
634	4	2026-09-06 05:04:27	SSH-Patator	SSH-Patator	0.94	80	HIGH
635	4	2026-09-06 05:04:27	SSH-Patator	SSH-Patator	0.84	80	HIGH
636	5	2026-09-06 05:04:49	FTP-Patator	FTP-Patator	0.83	65	MEDIUM
637	5	2026-09-06 05:04:49	FTP-Patator	FTP-Patator	0.99	65	MEDIUM
638	5	2026-09-06 05:04:49	FTP-Patator	FTP-Patator	0.97	65	MEDIUM
639	5	2026-09-06 05:04:49	FTP-Patator	FTP-Patator	0.91	65	MEDIUM
640	5	2026-09-06 05:04:49	FTP-Patator	FTP-Patator	0.95	65	MEDIUM
641	5	2026-09-06 05:04:49	FTP-Patator	FTP-Patator	0.98	65	MEDIUM
642	5	2026-09-06 05:04:49	FTP-Patator	FTP-Patator	0.84	65	MEDIUM
643	5	2026-09-06 05:04:49	FTP-Patator	FTP-Patator	0.98	65	MEDIUM
644	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.99	65	MEDIUM
645	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.95	65	MEDIUM
646	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.91	65	MEDIUM
647	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.97	65	MEDIUM
648	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	1	65	MEDIUM
649	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.97	65	MEDIUM
650	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.99	65	MEDIUM
651	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.97	65	MEDIUM
652	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.8	65	MEDIUM
653	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	1	65	MEDIUM
654	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.98	65	MEDIUM
655	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.85	65	MEDIUM
656	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.94	65	MEDIUM
657	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.99	65	MEDIUM
658	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.98	65	MEDIUM
659	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.95	65	MEDIUM
660	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.91	65	MEDIUM
661	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.94	65	MEDIUM
662	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.96	65	MEDIUM
663	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.43	65	MEDIUM
664	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.81	65	MEDIUM
665	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.71	65	MEDIUM
666	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.94	65	MEDIUM
667	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.97	65	MEDIUM
668	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.85	65	MEDIUM
669	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.98	65	MEDIUM
670	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	1	65	MEDIUM
671	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.99	65	MEDIUM
672	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.88	65	MEDIUM
673	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	1	65	MEDIUM
674	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.94	65	MEDIUM
675	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.94	65	MEDIUM
676	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.92	65	MEDIUM
677	5	2026-09-06 05:04:50	FTP-Patator	FTP-Patator	0.64	65	MEDIUM
678	6	2026-09-06 08:57:02	DDoS	DDoS	1	95	CRITICAL
679	6	2026-09-06 08:57:02	DDoS	DDoS	1	95	CRITICAL
680	6	2026-09-06 08:57:02	FTP-Patator	FTP-Patator	0.83	65	MEDIUM
681	6	2026-09-06 08:57:02	BENIGN	BENIGN	1	5	LOW
682	6	2026-09-06 08:57:02	DDoS	DDoS	1	95	CRITICAL
683	6	2026-09-06 08:57:02	BENIGN	BENIGN	1	5	LOW
684	6	2026-09-06 08:57:02	DDoS	DDoS	1	95	CRITICAL
685	6	2026-09-06 08:57:02	BENIGN	BENIGN	1	5	LOW
686	6	2026-09-06 08:57:02	BENIGN	BENIGN	1	5	LOW
687	6	2026-09-06 08:57:02	BENIGN	BENIGN	0.99	5	LOW
688	6	2026-09-06 08:57:02	BENIGN	BENIGN	1	5	LOW
689	6	2026-09-06 08:57:02	BENIGN	BENIGN	0.99	5	LOW
690	6	2026-09-06 08:57:02	BENIGN	BENIGN	1	5	LOW
691	6	2026-09-06 08:57:02	BENIGN	BENIGN	1	5	LOW
692	6	2026-09-06 08:57:02	FTP-Patator	FTP-Patator	0.99	65	MEDIUM
693	6	2026-09-06 08:57:02	BENIGN	BENIGN	1	5	LOW
694	6	2026-09-06 08:57:02	DDoS	DDoS	1	95	CRITICAL
695	6	2026-09-06 08:57:02	BENIGN	BENIGN	1	5	LOW
696	6	2026-09-06 08:57:02	SSH-Patator	SSH-Patator	0.94	80	HIGH
697	6	2026-09-06 08:57:02	BENIGN	BENIGN	1	5	LOW
698	6	2026-09-06 08:57:02	DDoS	DDoS	1	95	CRITICAL
699	6	2026-09-06 08:57:02	DDoS	DDoS	1	95	CRITICAL
700	6	2026-09-06 08:57:02	FTP-Patator	FTP-Patator	0.97	65	MEDIUM
701	6	2026-09-06 08:57:02	FTP-Patator	FTP-Patator	0.91	65	MEDIUM
702	6	2026-09-06 08:57:02	BENIGN	BENIGN	1	5	LOW
703	6	2026-09-06 08:57:02	BENIGN	BENIGN	0.96	5	LOW
704	6	2026-09-06 08:57:02	BENIGN	BENIGN	1	5	LOW
705	6	2026-09-06 08:57:02	BENIGN	BENIGN	1	5	LOW
706	6	2026-09-06 08:57:02	DDoS	DDoS	1	95	CRITICAL
707	6	2026-09-06 08:57:02	SSH-Patator	SSH-Patator	0.91	80	HIGH
708	6	2026-09-06 08:57:02	BENIGN	BENIGN	1	5	LOW
709	6	2026-09-06 08:57:02	FTP-Patator	FTP-Patator	0.95	65	MEDIUM
710	6	2026-09-06 08:57:02	DDoS	DDoS	1	95	CRITICAL
711	6	2026-09-06 08:57:02	BENIGN	BENIGN	0.99	5	LOW
712	6	2026-09-06 08:57:02	BENIGN	BENIGN	1	5	LOW
713	6	2026-09-06 08:57:03	SSH-Patator	SSH-Patator	1	80	HIGH
714	6	2026-09-06 08:57:03	DDoS	DDoS	1	95	CRITICAL
715	6	2026-09-06 08:57:03	BENIGN	BENIGN	0.95	5	LOW
716	6	2026-09-06 08:57:03	DDoS	DDoS	1	95	CRITICAL
717	6	2026-09-06 08:57:03	BENIGN	BENIGN	1	5	LOW
718	6	2026-09-06 08:57:03	FTP-Patator	FTP-Patator	0.98	65	MEDIUM
719	6	2026-09-06 08:57:03	BENIGN	BENIGN	1	5	LOW
720	6	2026-09-06 08:57:03	SSH-Patator	SSH-Patator	0.99	80	HIGH
721	6	2026-09-06 08:57:03	BENIGN	BENIGN	0.98	5	LOW
722	6	2026-09-06 08:57:03	DDoS	DDoS	1	95	CRITICAL
723	6	2026-09-06 08:57:03	BENIGN	BENIGN	1	5	LOW
724	6	2026-09-06 08:57:03	BENIGN	BENIGN	0.9	5	LOW
725	6	2026-09-06 08:57:03	BENIGN	BENIGN	1	5	LOW
726	6	2026-09-06 08:57:03	SSH-Patator	SSH-Patator	0.93	80	HIGH
727	6	2026-09-06 08:57:03	DDoS	DDoS	1	95	CRITICAL
728	6	2026-09-06 08:57:03	DDoS	DDoS	1	95	CRITICAL
729	6	2026-09-06 08:57:03	FTP-Patator	FTP-Patator	0.84	65	MEDIUM
730	6	2026-09-06 08:57:03	BENIGN	BENIGN	0.95	5	LOW
731	6	2026-09-06 08:57:03	BENIGN	BENIGN	1	5	LOW
732	6	2026-09-06 08:57:03	SSH-Patator	SSH-Patator	0.86	80	HIGH
733	6	2026-09-06 08:57:03	BENIGN	BENIGN	1	5	LOW
734	6	2026-09-06 08:57:03	DDoS	DDoS	1	95	CRITICAL
735	6	2026-09-06 08:57:03	BENIGN	BENIGN	1	5	LOW
736	6	2026-09-06 08:57:03	BENIGN	BENIGN	0.99	5	LOW
737	6	2026-09-06 08:57:03	BENIGN	BENIGN	0.97	5	LOW
738	6	2026-09-06 08:57:03	BENIGN	BENIGN	0.96	5	LOW
739	6	2026-09-06 08:57:03	BENIGN	BENIGN	1	5	LOW
740	6	2026-09-06 08:57:03	BENIGN	BENIGN	0.94	5	LOW
741	6	2026-09-06 08:57:03	DDoS	DDoS	1	95	CRITICAL
742	6	2026-09-06 08:57:03	FTP-Patator	FTP-Patator	0.98	65	MEDIUM
743	6	2026-09-06 08:57:03	SSH-Patator	SSH-Patator	0.96	80	HIGH
744	6	2026-09-06 08:57:03	DDoS	DDoS	1	95	CRITICAL
745	6	2026-09-06 08:57:03	DDoS	DDoS	1	95	CRITICAL
746	6	2026-09-06 08:57:03	FTP-Patator	FTP-Patator	0.99	65	MEDIUM
747	6	2026-09-06 08:57:03	BENIGN	BENIGN	1	5	LOW
748	6	2026-09-06 08:57:03	DDoS	DDoS	1	95	CRITICAL
749	6	2026-09-06 08:57:03	BENIGN	BENIGN	1	5	LOW
750	6	2026-09-06 08:57:03	BENIGN	BENIGN	1	5	LOW
751	6	2026-09-06 08:57:03	DDoS	DDoS	1	95	CRITICAL
752	6	2026-09-06 08:57:03	DDoS	DDoS	1	95	CRITICAL
753	6	2026-09-06 08:57:03	BENIGN	BENIGN	1	5	LOW
754	6	2026-09-06 08:57:03	DDoS	DDoS	1	95	CRITICAL
755	6	2026-09-06 08:57:03	DDoS	DDoS	1	95	CRITICAL
756	6	2026-09-06 08:57:03	BENIGN	BENIGN	1	5	LOW
757	6	2026-09-06 08:57:03	FTP-Patator	FTP-Patator	0.95	65	MEDIUM
758	6	2026-09-06 08:57:03	DDoS	DDoS	1	95	CRITICAL
759	6	2026-09-06 08:57:03	DDoS	DDoS	1	95	CRITICAL
760	6	2026-09-06 08:57:03	BENIGN	BENIGN	1	5	LOW
761	6	2026-09-06 08:57:03	DDoS	DDoS	1	95	CRITICAL
762	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
763	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
764	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
765	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
766	6	2026-09-06 08:57:04	FTP-Patator	FTP-Patator	0.91	65	MEDIUM
767	6	2026-09-06 08:57:04	DDoS	DDoS	1	95	CRITICAL
768	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
769	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
770	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
771	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
772	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
773	6	2026-09-06 08:57:04	FTP-Patator	FTP-Patator	0.97	65	MEDIUM
774	6	2026-09-06 08:57:04	SSH-Patator	SSH-Patator	0.97	80	HIGH
775	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
776	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
777	6	2026-09-06 08:57:04	BENIGN	BENIGN	0.99	5	LOW
778	6	2026-09-06 08:57:04	DDoS	DDoS	1	95	CRITICAL
779	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
780	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
781	6	2026-09-06 08:57:04	DDoS	DDoS	1	95	CRITICAL
782	6	2026-09-06 08:57:04	DDoS	DDoS	1	95	CRITICAL
783	6	2026-09-06 08:57:04	BENIGN	BENIGN	0.99	5	LOW
784	6	2026-09-06 08:57:04	DDoS	DDoS	1	95	CRITICAL
785	6	2026-09-06 08:57:04	DDoS	DDoS	1	95	CRITICAL
786	6	2026-09-06 08:57:04	DDoS	DDoS	1	95	CRITICAL
787	6	2026-09-06 08:57:04	DDoS	DDoS	1	95	CRITICAL
788	6	2026-09-06 08:57:04	BENIGN	BENIGN	0.99	5	LOW
789	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
790	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
791	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
792	6	2026-09-06 08:57:04	FTP-Patator	FTP-Patator	1	65	MEDIUM
793	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
794	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
795	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
796	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
797	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
798	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
799	6	2026-09-06 08:57:04	DDoS	DDoS	1	95	CRITICAL
800	6	2026-09-06 08:57:04	BENIGN	BENIGN	0.99	5	LOW
801	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
802	6	2026-09-06 08:57:04	FTP-Patator	FTP-Patator	0.97	65	MEDIUM
803	6	2026-09-06 08:57:04	BENIGN	BENIGN	0.94	5	LOW
804	6	2026-09-06 08:57:04	BENIGN	BENIGN	0.99	5	LOW
805	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
806	6	2026-09-06 08:57:04	SSH-Patator	SSH-Patator	0.97	80	HIGH
807	6	2026-09-06 08:57:04	BENIGN	BENIGN	0.98	5	LOW
808	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
809	6	2026-09-06 08:57:04	FTP-Patator	FTP-Patator	0.99	65	MEDIUM
810	6	2026-09-06 08:57:04	SSH-Patator	SSH-Patator	0.98	80	HIGH
811	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
812	6	2026-09-06 08:57:04	DDoS	DDoS	1	95	CRITICAL
813	6	2026-09-06 08:57:04	BENIGN	BENIGN	0.99	5	LOW
814	6	2026-09-06 08:57:04	DDoS	DDoS	1	95	CRITICAL
815	6	2026-09-06 08:57:04	BENIGN	BENIGN	0.99	5	LOW
816	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
817	6	2026-09-06 08:57:04	BENIGN	BENIGN	0.99	5	LOW
818	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
819	6	2026-09-06 08:57:04	BENIGN	BENIGN	0.98	5	LOW
820	6	2026-09-06 08:57:04	BENIGN	BENIGN	1	5	LOW
821	6	2026-09-06 08:57:04	DDoS	DDoS	1	95	CRITICAL
822	6	2026-09-06 08:57:04	FTP-Patator	FTP-Patator	0.97	65	MEDIUM
823	6	2026-09-06 08:57:05	DDoS	DDoS	1	95	CRITICAL
824	6	2026-09-06 08:57:05	BENIGN	BENIGN	0.99	5	LOW
825	6	2026-09-06 08:57:05	BENIGN	BENIGN	0.99	5	LOW
826	6	2026-09-06 08:57:05	DDoS	DDoS	1	95	CRITICAL
827	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
828	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
829	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
830	6	2026-09-06 08:57:05	BENIGN	BENIGN	0.99	5	LOW
831	6	2026-09-06 08:57:05	BENIGN	BENIGN	0.99	5	LOW
832	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
833	6	2026-09-06 08:57:05	BENIGN	BENIGN	0.99	5	LOW
834	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
835	6	2026-09-06 08:57:05	DDoS	DDoS	1	95	CRITICAL
836	6	2026-09-06 08:57:05	DDoS	DDoS	1	95	CRITICAL
837	6	2026-09-06 08:57:05	DDoS	DDoS	1	95	CRITICAL
838	6	2026-09-06 08:57:05	BENIGN	BENIGN	0.97	5	LOW
839	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
840	6	2026-09-06 08:57:05	DDoS	DDoS	1	95	CRITICAL
841	6	2026-09-06 08:57:05	DDoS	DDoS	1	95	CRITICAL
842	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
843	6	2026-09-06 08:57:05	SSH-Patator	SSH-Patator	0.96	80	HIGH
844	6	2026-09-06 08:57:05	SSH-Patator	SSH-Patator	0.97	80	HIGH
845	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
846	6	2026-09-06 08:57:05	DDoS	DDoS	1	95	CRITICAL
847	6	2026-09-06 08:57:05	DDoS	DDoS	1	95	CRITICAL
848	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
849	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
850	6	2026-09-06 08:57:05	BENIGN	BENIGN	0.94	5	LOW
851	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
852	6	2026-09-06 08:57:05	DDoS	DDoS	1	95	CRITICAL
853	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
854	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
855	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
856	6	2026-09-06 08:57:05	DDoS	DDoS	1	95	CRITICAL
857	6	2026-09-06 08:57:05	BENIGN	BENIGN	0.99	5	LOW
858	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
859	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
860	6	2026-09-06 08:57:05	BENIGN	BENIGN	0.99	5	LOW
861	6	2026-09-06 08:57:05	BENIGN	BENIGN	0.96	5	LOW
862	6	2026-09-06 08:57:05	BENIGN	BENIGN	0.96	5	LOW
863	6	2026-09-06 08:57:05	DDoS	DDoS	1	95	CRITICAL
864	6	2026-09-06 08:57:05	BENIGN	BENIGN	0.99	5	LOW
865	6	2026-09-06 08:57:05	FTP-Patator	FTP-Patator	0.8	65	MEDIUM
866	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
867	6	2026-09-06 08:57:05	DDoS	DDoS	1	95	CRITICAL
868	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
869	6	2026-09-06 08:57:05	DDoS	DDoS	1	95	CRITICAL
870	6	2026-09-06 08:57:05	DDoS	DDoS	1	95	CRITICAL
871	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
872	6	2026-09-06 08:57:05	DDoS	DDoS	1	95	CRITICAL
873	6	2026-09-06 08:57:05	DDoS	DDoS	1	95	CRITICAL
874	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
875	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
876	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
877	6	2026-09-06 08:57:05	FTP-Patator	FTP-Patator	1	65	MEDIUM
878	6	2026-09-06 08:57:05	SSH-Patator	SSH-Patator	1	80	HIGH
879	6	2026-09-06 08:57:05	BENIGN	BENIGN	1	5	LOW
880	6	2026-09-06 08:57:06	BENIGN	BENIGN	1	5	LOW
881	6	2026-09-06 08:57:06	BENIGN	BENIGN	0.99	5	LOW
882	6	2026-09-06 08:57:06	SSH-Patator	SSH-Patator	0.88	80	HIGH
883	6	2026-09-06 08:57:06	DDoS	DDoS	1	95	CRITICAL
884	6	2026-09-06 08:57:06	BENIGN	BENIGN	1	5	LOW
885	6	2026-09-06 08:57:06	BENIGN	BENIGN	1	5	LOW
886	6	2026-09-06 08:57:06	BENIGN	BENIGN	1	5	LOW
887	6	2026-09-06 08:57:06	BENIGN	BENIGN	1	5	LOW
888	6	2026-09-06 08:57:06	DDoS	DDoS	1	95	CRITICAL
889	6	2026-09-06 08:57:06	SSH-Patator	SSH-Patator	0.91	80	HIGH
890	6	2026-09-06 08:57:06	BENIGN	BENIGN	1	5	LOW
891	6	2026-09-06 08:57:06	BENIGN	BENIGN	1	5	LOW
892	6	2026-09-06 08:57:06	DDoS	DDoS	1	95	CRITICAL
893	6	2026-09-06 08:57:06	DDoS	DDoS	1	95	CRITICAL
894	6	2026-09-06 08:57:06	BENIGN	BENIGN	0.98	5	LOW
895	6	2026-09-06 08:57:06	FTP-Patator	FTP-Patator	0.98	65	MEDIUM
896	6	2026-09-06 08:57:06	BENIGN	BENIGN	0.96	5	LOW
897	6	2026-09-06 08:57:06	BENIGN	BENIGN	1	5	LOW
898	6	2026-09-06 08:57:06	BENIGN	BENIGN	1	5	LOW
899	6	2026-09-06 08:57:06	BENIGN	BENIGN	1	5	LOW
900	6	2026-09-06 08:57:06	FTP-Patator	FTP-Patator	0.85	65	MEDIUM
901	6	2026-09-06 08:57:06	DDoS	DDoS	1	95	CRITICAL
902	6	2026-09-06 08:57:06	FTP-Patator	FTP-Patator	0.94	65	MEDIUM
903	6	2026-09-06 08:57:06	DDoS	DDoS	1	95	CRITICAL
904	6	2026-09-06 08:57:06	DDoS	DDoS	1	95	CRITICAL
905	6	2026-09-06 08:57:06	FTP-Patator	FTP-Patator	0.99	65	MEDIUM
906	6	2026-09-06 08:57:06	FTP-Patator	FTP-Patator	0.98	65	MEDIUM
907	6	2026-09-06 08:57:06	BENIGN	BENIGN	1	5	LOW
908	6	2026-09-06 08:57:06	BENIGN	BENIGN	0.98	5	LOW
909	6	2026-09-06 08:57:06	BENIGN	BENIGN	0.99	5	LOW
910	6	2026-09-06 08:57:06	SSH-Patator	SSH-Patator	0.99	80	HIGH
911	6	2026-09-06 08:57:06	SSH-Patator	SSH-Patator	0.98	80	HIGH
912	6	2026-09-06 08:57:06	DDoS	DDoS	1	95	CRITICAL
913	6	2026-09-06 08:57:06	DDoS	DDoS	1	95	CRITICAL
914	6	2026-09-06 08:57:06	DDoS	DDoS	1	95	CRITICAL
915	6	2026-09-06 08:57:06	FTP-Patator	FTP-Patator	0.95	65	MEDIUM
916	6	2026-09-06 08:57:06	BENIGN	BENIGN	1	5	LOW
917	6	2026-09-06 08:57:06	BENIGN	BENIGN	1	5	LOW
918	6	2026-09-06 08:57:06	BENIGN	BENIGN	1	5	LOW
919	6	2026-09-06 08:57:06	BENIGN	BENIGN	1	5	LOW
920	6	2026-09-06 08:57:06	DDoS	DDoS	1	95	CRITICAL
921	6	2026-09-06 08:57:06	DDoS	DDoS	0.96	95	CRITICAL
922	6	2026-09-06 08:57:06	DDoS	DDoS	1	95	CRITICAL
923	6	2026-09-06 08:57:06	BENIGN	BENIGN	0.92	5	LOW
924	6	2026-09-06 08:57:06	FTP-Patator	FTP-Patator	0.91	65	MEDIUM
925	6	2026-09-06 08:57:06	BENIGN	BENIGN	0.99	5	LOW
926	6	2026-09-06 08:57:06	SSH-Patator	SSH-Patator	0.91	80	HIGH
927	6	2026-09-06 08:57:06	DDoS	DDoS	1	95	CRITICAL
928	6	2026-09-06 08:57:06	FTP-Patator	FTP-Patator	0.94	65	MEDIUM
929	6	2026-09-06 08:57:06	BENIGN	BENIGN	1	5	LOW
930	6	2026-09-06 08:57:06	BENIGN	BENIGN	1	5	LOW
931	6	2026-09-06 08:57:06	BENIGN	BENIGN	1	5	LOW
932	6	2026-09-06 08:57:06	BENIGN	BENIGN	1	5	LOW
933	6	2026-09-06 08:57:06	DDoS	DDoS	1	95	CRITICAL
934	6	2026-09-06 08:57:07	BENIGN	BENIGN	1	5	LOW
935	6	2026-09-06 08:57:07	SSH-Patator	SSH-Patator	0.95	80	HIGH
936	6	2026-09-06 08:57:07	SSH-Patator	SSH-Patator	0.98	80	HIGH
937	6	2026-09-06 08:57:07	FTP-Patator	FTP-Patator	0.96	65	MEDIUM
938	6	2026-09-06 08:57:07	BENIGN	BENIGN	1	5	LOW
939	6	2026-09-06 08:57:07	SSH-Patator	SSH-Patator	0.92	80	HIGH
940	6	2026-09-06 08:57:07	BENIGN	BENIGN	1	5	LOW
941	6	2026-09-06 08:57:07	DDoS	DDoS	1	95	CRITICAL
942	6	2026-09-06 08:57:07	BENIGN	BENIGN	0.98	5	LOW
943	6	2026-09-06 08:57:07	BENIGN	BENIGN	1	5	LOW
944	6	2026-09-06 08:57:07	BENIGN	BENIGN	1	5	LOW
945	6	2026-09-06 08:57:07	DDoS	DDoS	1	95	CRITICAL
946	6	2026-09-06 08:57:07	SSH-Patator	SSH-Patator	0.99	80	HIGH
947	6	2026-09-06 08:57:07	BENIGN	BENIGN	1	5	LOW
948	6	2026-09-06 08:57:07	DDoS	DDoS	1	95	CRITICAL
949	6	2026-09-06 08:57:07	DDoS	DDoS	1	95	CRITICAL
950	6	2026-09-06 08:57:07	DDoS	DDoS	1	95	CRITICAL
951	6	2026-09-06 08:57:07	BENIGN	BENIGN	0.96	5	LOW
952	6	2026-09-06 08:57:07	FTP-Patator	FTP-Patator	0.43	65	MEDIUM
953	6	2026-09-06 08:57:07	BENIGN	BENIGN	0.98	5	LOW
954	6	2026-09-06 08:57:07	DDoS	DDoS	1	95	CRITICAL
955	6	2026-09-06 08:57:07	DDoS	DDoS	1	95	CRITICAL
956	6	2026-09-06 08:57:07	DDoS	DDoS	1	95	CRITICAL
957	6	2026-09-06 08:57:07	BENIGN	BENIGN	1	5	LOW
958	6	2026-09-06 08:57:07	BENIGN	BENIGN	1	5	LOW
959	6	2026-09-06 08:57:07	BENIGN	BENIGN	0.96	5	LOW
960	6	2026-09-06 08:57:07	SSH-Patator	SSH-Patator	0.92	80	HIGH
961	6	2026-09-06 08:57:07	BENIGN	BENIGN	1	5	LOW
962	6	2026-09-06 08:57:07	DDoS	DDoS	1	95	CRITICAL
963	6	2026-09-06 08:57:07	BENIGN	BENIGN	1	5	LOW
964	6	2026-09-06 08:57:07	FTP-Patator	FTP-Patator	0.81	65	MEDIUM
965	6	2026-09-06 08:57:07	DDoS	DDoS	1	95	CRITICAL
966	6	2026-09-06 08:57:07	BENIGN	BENIGN	1	5	LOW
967	6	2026-09-06 08:57:07	BENIGN	BENIGN	1	5	LOW
968	6	2026-09-06 08:57:07	DDoS	DDoS	1	95	CRITICAL
969	6	2026-09-06 08:57:07	BENIGN	BENIGN	1	5	LOW
970	6	2026-09-06 08:57:07	BENIGN	BENIGN	1	5	LOW
971	6	2026-09-06 08:57:07	DDoS	DDoS	1	95	CRITICAL
972	6	2026-09-06 08:57:07	BENIGN	BENIGN	0.99	5	LOW
973	6	2026-09-06 08:57:07	DDoS	DDoS	1	95	CRITICAL
974	6	2026-09-06 08:57:07	BENIGN	BENIGN	0.98	5	LOW
975	6	2026-09-06 08:57:07	BENIGN	BENIGN	1	5	LOW
976	6	2026-09-06 08:57:07	BENIGN	BENIGN	1	5	LOW
977	6	2026-09-06 08:57:07	BENIGN	BENIGN	1	5	LOW
978	6	2026-09-06 08:57:07	BENIGN	BENIGN	1	5	LOW
979	6	2026-09-06 08:57:07	DDoS	DDoS	1	95	CRITICAL
980	6	2026-09-06 08:57:07	SSH-Patator	SSH-Patator	0.81	80	HIGH
981	6	2026-09-06 08:57:07	DDoS	DDoS	1	95	CRITICAL
982	6	2026-09-06 08:57:07	BENIGN	BENIGN	1	5	LOW
983	6	2026-09-06 08:57:07	DDoS	DDoS	1	95	CRITICAL
984	6	2026-09-06 08:57:07	DDoS	DDoS	1	95	CRITICAL
985	6	2026-09-06 08:57:07	DDoS	DDoS	1	95	CRITICAL
986	6	2026-09-06 08:57:07	BENIGN	BENIGN	1	5	LOW
987	6	2026-09-06 08:57:07	BENIGN	BENIGN	1	5	LOW
988	6	2026-09-06 08:57:07	BENIGN	BENIGN	0.98	5	LOW
989	6	2026-09-06 08:57:07	DDoS	DDoS	1	95	CRITICAL
990	6	2026-09-06 08:57:08	FTP-Patator	FTP-Patator	0.71	65	MEDIUM
991	6	2026-09-06 08:57:08	BENIGN	BENIGN	1	5	LOW
992	6	2026-09-06 08:57:08	BENIGN	BENIGN	1	5	LOW
993	6	2026-09-06 08:57:08	DDoS	DDoS	1	95	CRITICAL
994	6	2026-09-06 08:57:08	BENIGN	BENIGN	0.95	5	LOW
995	6	2026-09-06 08:57:08	BENIGN	BENIGN	1	5	LOW
996	6	2026-09-06 08:57:08	BENIGN	BENIGN	0.96	5	LOW
997	6	2026-09-06 08:57:08	BENIGN	BENIGN	1	5	LOW
998	6	2026-09-06 08:57:08	FTP-Patator	FTP-Patator	0.94	65	MEDIUM
999	6	2026-09-06 08:57:08	DDoS	DDoS	1	95	CRITICAL
1000	6	2026-09-06 08:57:08	BENIGN	BENIGN	1	5	LOW
1001	6	2026-09-06 08:57:08	BENIGN	BENIGN	1	5	LOW
1002	6	2026-09-06 08:57:08	BENIGN	BENIGN	1	5	LOW
1003	6	2026-09-06 08:57:08	DDoS	DDoS	1	95	CRITICAL
1004	6	2026-09-06 08:57:08	BENIGN	BENIGN	0.99	5	LOW
1005	6	2026-09-06 08:57:08	BENIGN	BENIGN	1	5	LOW
1006	6	2026-09-06 08:57:08	BENIGN	BENIGN	1	5	LOW
1007	6	2026-09-06 08:57:08	BENIGN	BENIGN	1	5	LOW
1008	6	2026-09-06 08:57:08	DDoS	DDoS	1	95	CRITICAL
1009	6	2026-09-06 08:57:08	BENIGN	BENIGN	1	5	LOW
1010	6	2026-09-06 08:57:08	FTP-Patator	FTP-Patator	0.97	65	MEDIUM
1011	6	2026-09-06 08:57:08	DDoS	DDoS	1	95	CRITICAL
1012	6	2026-09-06 08:57:08	DDoS	DDoS	0.96	95	CRITICAL
1013	6	2026-09-06 08:57:08	BENIGN	BENIGN	0.97	5	LOW
1014	6	2026-09-06 08:57:08	DDoS	DDoS	1	95	CRITICAL
1015	6	2026-09-06 08:57:08	BENIGN	BENIGN	0.97	5	LOW
1016	6	2026-09-06 08:57:08	BENIGN	BENIGN	0.99	5	LOW
1017	6	2026-09-06 08:57:08	DDoS	DDoS	1	95	CRITICAL
1018	6	2026-09-06 08:57:08	BENIGN	BENIGN	1	5	LOW
1019	6	2026-09-06 08:57:08	BENIGN	BENIGN	1	5	LOW
1020	6	2026-09-06 08:57:08	BENIGN	BENIGN	0.92	5	LOW
1021	6	2026-09-06 08:57:08	DDoS	DDoS	1	95	CRITICAL
1022	6	2026-09-06 08:57:08	SSH-Patator	SSH-Patator	0.99	80	HIGH
1023	6	2026-09-06 08:57:08	DDoS	DDoS	1	95	CRITICAL
1024	6	2026-09-06 08:57:08	BENIGN	BENIGN	1	5	LOW
1025	6	2026-09-06 08:57:08	BENIGN	BENIGN	0.97	5	LOW
1026	6	2026-09-06 08:57:08	FTP-Patator	FTP-Patator	0.85	65	MEDIUM
1027	6	2026-09-06 08:57:08	SSH-Patator	SSH-Patator	0.98	80	HIGH
1028	6	2026-09-06 08:57:08	DDoS	DDoS	1	95	CRITICAL
1029	6	2026-09-06 08:57:08	DDoS	DDoS	1	95	CRITICAL
1030	6	2026-09-06 08:57:08	DDoS	DDoS	1	95	CRITICAL
1031	6	2026-09-06 08:57:08	DDoS	DDoS	1	95	CRITICAL
1032	6	2026-09-06 08:57:08	DDoS	DDoS	1	95	CRITICAL
1033	6	2026-09-06 08:57:08	DDoS	DDoS	1	95	CRITICAL
1034	6	2026-09-06 08:57:08	FTP-Patator	FTP-Patator	0.98	65	MEDIUM
1035	6	2026-09-06 08:57:08	BENIGN	BENIGN	1	5	LOW
1036	6	2026-09-06 08:57:08	FTP-Patator	FTP-Patator	1	65	MEDIUM
1037	6	2026-09-06 08:57:09	BENIGN	BENIGN	1	5	LOW
1038	6	2026-09-06 08:57:09	BENIGN	BENIGN	1	5	LOW
1039	6	2026-09-06 08:57:09	DDoS	DDoS	1	95	CRITICAL
1040	6	2026-09-06 08:57:09	BENIGN	BENIGN	0.97	5	LOW
1041	6	2026-09-06 08:57:09	DDoS	DDoS	1	95	CRITICAL
1042	6	2026-09-06 08:57:09	SSH-Patator	SSH-Patator	0.69	80	HIGH
1043	6	2026-09-06 08:57:09	DDoS	DDoS	1	95	CRITICAL
1044	6	2026-09-06 08:57:09	BENIGN	BENIGN	1	5	LOW
1045	6	2026-09-06 08:57:09	DDoS	DDoS	1	95	CRITICAL
1046	6	2026-09-06 08:57:09	BENIGN	BENIGN	1	5	LOW
1047	6	2026-09-06 08:57:09	DDoS	DDoS	1	95	CRITICAL
1048	6	2026-09-06 08:57:09	SSH-Patator	SSH-Patator	0.89	80	HIGH
1049	6	2026-09-06 08:57:09	DDoS	DDoS	1	95	CRITICAL
1050	6	2026-09-06 08:57:09	SSH-Patator	SSH-Patator	1	80	HIGH
1051	6	2026-09-06 08:57:09	DDoS	DDoS	1	95	CRITICAL
1052	6	2026-09-06 08:57:09	BENIGN	BENIGN	0.99	5	LOW
1053	6	2026-09-06 08:57:09	SSH-Patator	SSH-Patator	0.95	80	HIGH
1054	6	2026-09-06 08:57:09	DDoS	DDoS	1	95	CRITICAL
1055	6	2026-09-06 08:57:09	DDoS	DDoS	1	95	CRITICAL
1056	6	2026-09-06 08:57:09	BENIGN	BENIGN	0.78	5	LOW
1057	6	2026-09-06 08:57:09	BENIGN	BENIGN	1	5	LOW
1058	6	2026-09-06 08:57:09	BENIGN	BENIGN	1	5	LOW
1059	6	2026-09-06 08:57:09	BENIGN	BENIGN	1	5	LOW
1060	6	2026-09-06 08:57:09	BENIGN	BENIGN	1	5	LOW
1061	6	2026-09-06 08:57:09	DDoS	DDoS	1	95	CRITICAL
1062	6	2026-09-06 08:57:09	BENIGN	BENIGN	1	5	LOW
1063	6	2026-09-06 08:57:09	DDoS	DDoS	1	95	CRITICAL
1064	6	2026-09-06 08:57:09	DDoS	DDoS	1	95	CRITICAL
1065	6	2026-09-06 08:57:09	FTP-Patator	FTP-Patator	0.99	65	MEDIUM
1066	6	2026-09-06 08:57:09	BENIGN	BENIGN	1	5	LOW
1067	6	2026-09-06 08:57:09	DDoS	DDoS	1	95	CRITICAL
1068	6	2026-09-06 08:57:09	DDoS	DDoS	1	95	CRITICAL
1069	6	2026-09-06 08:57:09	DDoS	DDoS	0.99	95	CRITICAL
1070	6	2026-09-06 08:57:09	DDoS	DDoS	0.99	95	CRITICAL
1071	6	2026-09-06 08:57:09	DDoS	DDoS	1	95	CRITICAL
1072	6	2026-09-06 08:57:09	BENIGN	BENIGN	1	5	LOW
1073	6	2026-09-06 08:57:09	BENIGN	BENIGN	0.93	5	LOW
1074	6	2026-09-06 08:57:09	BENIGN	BENIGN	1	5	LOW
1075	6	2026-09-06 08:57:09	BENIGN	BENIGN	1	5	LOW
1076	6	2026-09-06 08:57:09	BENIGN	BENIGN	1	5	LOW
1077	6	2026-09-06 08:57:09	BENIGN	BENIGN	0.97	5	LOW
1078	6	2026-09-06 08:57:09	BENIGN	BENIGN	1	5	LOW
1079	6	2026-09-06 08:57:09	SSH-Patator	SSH-Patator	0.98	80	HIGH
1080	6	2026-09-06 08:57:09	BENIGN	BENIGN	1	5	LOW
1081	6	2026-09-06 08:57:09	BENIGN	BENIGN	1	5	LOW
1082	6	2026-09-06 08:57:09	SSH-Patator	SSH-Patator	0.97	80	HIGH
1083	6	2026-09-06 08:57:10	DDoS	DDoS	1	95	CRITICAL
1084	6	2026-09-06 08:57:10	SSH-Patator	SSH-Patator	0.98	80	HIGH
1085	6	2026-09-06 08:57:10	SSH-Patator	SSH-Patator	0.94	80	HIGH
1086	6	2026-09-06 08:57:10	BENIGN	BENIGN	1	5	LOW
1087	6	2026-09-06 08:57:10	BENIGN	BENIGN	1	5	LOW
1088	6	2026-09-06 08:57:10	BENIGN	BENIGN	0.99	5	LOW
1089	6	2026-09-06 08:57:10	FTP-Patator	FTP-Patator	0.88	65	MEDIUM
1090	6	2026-09-06 08:57:10	BENIGN	BENIGN	1	5	LOW
1091	6	2026-09-06 08:57:10	BENIGN	BENIGN	1	5	LOW
1092	6	2026-09-06 08:57:10	BENIGN	BENIGN	1	5	LOW
1093	6	2026-09-06 08:57:10	DDoS	DDoS	1	95	CRITICAL
1094	6	2026-09-06 08:57:10	FTP-Patator	FTP-Patator	1	65	MEDIUM
1095	6	2026-09-06 08:57:10	BENIGN	BENIGN	0.99	5	LOW
1096	6	2026-09-06 08:57:10	BENIGN	BENIGN	1	5	LOW
1097	6	2026-09-06 08:57:10	BENIGN	BENIGN	1	5	LOW
1098	6	2026-09-06 08:57:10	BENIGN	BENIGN	0.97	5	LOW
1099	6	2026-09-06 08:57:10	DDoS	DDoS	1	95	CRITICAL
1100	6	2026-09-06 08:57:10	DDoS	DDoS	1	95	CRITICAL
1101	6	2026-09-06 08:57:10	BENIGN	BENIGN	1	5	LOW
1102	6	2026-09-06 08:57:10	SSH-Patator	SSH-Patator	0.94	80	HIGH
1103	6	2026-09-06 08:57:10	DDoS	DDoS	1	95	CRITICAL
1104	6	2026-09-06 08:57:10	BENIGN	BENIGN	1	5	LOW
1105	6	2026-09-06 08:57:10	BENIGN	BENIGN	1	5	LOW
1106	6	2026-09-06 08:57:10	BENIGN	BENIGN	1	5	LOW
1107	6	2026-09-06 08:57:10	BENIGN	BENIGN	1	5	LOW
1108	6	2026-09-06 08:57:10	DDoS	DDoS	1	95	CRITICAL
1109	6	2026-09-06 08:57:10	BENIGN	BENIGN	1	5	LOW
1110	6	2026-09-06 08:57:10	BENIGN	BENIGN	1	5	LOW
1111	6	2026-09-06 08:57:10	BENIGN	BENIGN	1	5	LOW
1112	6	2026-09-06 08:57:10	FTP-Patator	FTP-Patator	0.94	65	MEDIUM
1113	6	2026-09-06 08:57:10	SSH-Patator	SSH-Patator	0.54	80	HIGH
1114	6	2026-09-06 08:57:10	BENIGN	BENIGN	1	5	LOW
1115	6	2026-09-06 08:57:10	DDoS	DDoS	1	95	CRITICAL
1116	6	2026-09-06 08:57:10	BENIGN	BENIGN	0.99	5	LOW
1117	6	2026-09-06 08:57:10	BENIGN	BENIGN	1	5	LOW
1118	6	2026-09-06 08:57:10	SSH-Patator	SSH-Patator	0.89	80	HIGH
1119	6	2026-09-06 08:57:10	FTP-Patator	FTP-Patator	0.94	65	MEDIUM
1120	6	2026-09-06 08:57:10	BENIGN	BENIGN	1	5	LOW
1121	6	2026-09-06 08:57:10	BENIGN	BENIGN	0.99	5	LOW
1122	6	2026-09-06 08:57:10	DDoS	DDoS	1	95	CRITICAL
1123	6	2026-09-06 08:57:10	SSH-Patator	SSH-Patator	0.92	80	HIGH
1124	6	2026-09-06 08:57:10	BENIGN	BENIGN	1	5	LOW
1125	6	2026-09-06 08:57:10	BENIGN	BENIGN	1	5	LOW
1126	6	2026-09-06 08:57:10	BENIGN	BENIGN	0.99	5	LOW
1127	6	2026-09-06 08:57:11	DDoS	DDoS	1	95	CRITICAL
1128	6	2026-09-06 08:57:11	BENIGN	BENIGN	0.99	5	LOW
1129	6	2026-09-06 08:57:11	BENIGN	BENIGN	0.99	5	LOW
1130	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1131	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1132	6	2026-09-06 08:57:11	SSH-Patator	SSH-Patator	0.82	80	HIGH
1133	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1134	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1135	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1136	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1137	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1138	6	2026-09-06 08:57:11	BENIGN	BENIGN	0.99	5	LOW
1139	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1140	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1141	6	2026-09-06 08:57:11	DDoS	DDoS	1	95	CRITICAL
1142	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1143	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1144	6	2026-09-06 08:57:11	DDoS	DDoS	1	95	CRITICAL
1145	6	2026-09-06 08:57:11	SSH-Patator	SSH-Patator	1	80	HIGH
1146	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1147	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1148	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1149	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1150	6	2026-09-06 08:57:11	DDoS	DDoS	1	95	CRITICAL
1151	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1152	6	2026-09-06 08:57:11	BENIGN	BENIGN	0.99	5	LOW
1153	6	2026-09-06 08:57:11	SSH-Patator	SSH-Patator	0.76	80	HIGH
1154	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1155	6	2026-09-06 08:57:11	FTP-Patator	FTP-Patator	0.92	65	MEDIUM
1156	6	2026-09-06 08:57:11	DDoS	DDoS	1	95	CRITICAL
1157	6	2026-09-06 08:57:11	DDoS	DDoS	1	95	CRITICAL
1158	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1159	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1160	6	2026-09-06 08:57:11	DDoS	DDoS	1	95	CRITICAL
1161	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1162	6	2026-09-06 08:57:11	BENIGN	BENIGN	0.99	5	LOW
1163	6	2026-09-06 08:57:11	DDoS	DDoS	1	95	CRITICAL
1164	6	2026-09-06 08:57:11	BENIGN	BENIGN	0.94	5	LOW
1165	6	2026-09-06 08:57:11	DDoS	DDoS	1	95	CRITICAL
1166	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1167	6	2026-09-06 08:57:11	SSH-Patator	SSH-Patator	0.94	80	HIGH
1168	6	2026-09-06 08:57:11	FTP-Patator	FTP-Patator	0.64	65	MEDIUM
1169	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1170	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1171	6	2026-09-06 08:57:11	DDoS	DDoS	1	95	CRITICAL
1172	6	2026-09-06 08:57:11	SSH-Patator	SSH-Patator	0.84	80	HIGH
1173	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1174	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1175	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1176	6	2026-09-06 08:57:11	BENIGN	BENIGN	1	5	LOW
1177	6	2026-09-06 08:57:11	DDoS	DDoS	1	95	CRITICAL
1178	7	2026-09-06 12:49:53.895068	DDoS	DDoS	1	95	CRITICAL
1179	7	2026-09-06 12:49:53.905304	DDoS	DDoS	1	95	CRITICAL
1180	7	2026-09-06 12:49:53.909516	DDoS	DDoS	1	95	CRITICAL
1181	7	2026-09-06 12:49:53.91372	DDoS	DDoS	1	95	CRITICAL
1182	7	2026-09-06 12:49:53.918612	DDoS	DDoS	1	95	CRITICAL
1183	7	2026-09-06 12:49:53.92318	DDoS	DDoS	1	95	CRITICAL
1184	7	2026-09-06 12:49:53.927869	DDoS	DDoS	1	95	CRITICAL
1185	7	2026-09-06 12:49:53.931247	DDoS	DDoS	1	95	CRITICAL
1186	7	2026-09-06 12:49:53.935721	DDoS	DDoS	1	95	CRITICAL
1187	7	2026-09-06 12:49:53.940071	DDoS	DDoS	1	95	CRITICAL
1188	7	2026-09-06 12:49:53.945555	DDoS	DDoS	1	95	CRITICAL
1189	7	2026-09-06 12:49:53.950655	DDoS	DDoS	1	95	CRITICAL
1190	7	2026-09-06 12:49:53.955594	DDoS	DDoS	1	95	CRITICAL
1191	7	2026-09-06 12:49:53.960555	DDoS	DDoS	1	95	CRITICAL
1192	7	2026-09-06 12:49:53.96547	DDoS	DDoS	1	95	CRITICAL
1193	7	2026-09-06 12:49:53.97056	DDoS	DDoS	1	95	CRITICAL
1194	7	2026-09-06 12:49:53.975538	DDoS	DDoS	1	95	CRITICAL
1195	7	2026-09-06 12:49:53.980448	DDoS	DDoS	1	95	CRITICAL
1196	7	2026-09-06 12:49:53.985514	DDoS	DDoS	1	95	CRITICAL
1197	7	2026-09-06 12:49:53.989942	DDoS	DDoS	1	95	CRITICAL
1198	7	2026-09-06 12:49:53.995083	DDoS	DDoS	1	95	CRITICAL
1199	7	2026-09-06 12:49:53.999347	DDoS	DDoS	1	95	CRITICAL
1200	7	2026-09-06 12:49:54.003263	DDoS	DDoS	1	95	CRITICAL
1201	7	2026-09-06 12:49:54.00864	DDoS	DDoS	1	95	CRITICAL
1202	7	2026-09-06 12:49:54.012538	DDoS	DDoS	1	95	CRITICAL
1203	7	2026-09-06 12:49:54.016578	DDoS	DDoS	1	95	CRITICAL
1204	7	2026-09-06 12:49:54.020601	DDoS	DDoS	1	95	CRITICAL
1205	7	2026-09-06 12:49:54.025049	DDoS	DDoS	1	95	CRITICAL
1206	7	2026-09-06 12:49:54.029624	DDoS	DDoS	1	95	CRITICAL
1207	7	2026-09-06 12:49:54.034139	DDoS	DDoS	1	95	CRITICAL
1208	7	2026-09-06 12:49:54.038306	DDoS	DDoS	1	95	CRITICAL
1209	7	2026-09-06 12:49:54.04302	DDoS	DDoS	1	95	CRITICAL
1210	7	2026-09-06 12:49:54.047342	DDoS	DDoS	1	95	CRITICAL
1211	7	2026-09-06 12:49:54.051873	DDoS	DDoS	1	95	CRITICAL
1212	7	2026-09-06 12:49:54.055794	DDoS	DDoS	1	95	CRITICAL
1213	7	2026-09-06 12:49:54.060149	DDoS	DDoS	1	95	CRITICAL
1214	7	2026-09-06 12:49:54.064526	DDoS	DDoS	1	95	CRITICAL
1215	7	2026-09-06 12:49:54.068955	DDoS	DDoS	1	95	CRITICAL
1216	7	2026-09-06 12:49:54.073339	DDoS	DDoS	1	95	CRITICAL
1217	7	2026-09-06 12:49:54.077538	DDoS	DDoS	1	95	CRITICAL
1218	7	2026-09-06 12:49:54.081502	DDoS	DDoS	1	95	CRITICAL
1219	7	2026-09-06 12:49:54.085459	DDoS	DDoS	1	95	CRITICAL
1220	7	2026-09-06 12:49:54.088786	DDoS	DDoS	1	95	CRITICAL
1221	7	2026-09-06 12:49:54.092033	DDoS	DDoS	1	95	CRITICAL
1222	7	2026-09-06 12:49:54.095812	DDoS	DDoS	1	95	CRITICAL
1223	7	2026-09-06 12:49:54.099256	DDoS	DDoS	1	95	CRITICAL
1224	7	2026-09-06 12:49:54.102923	DDoS	DDoS	1	95	CRITICAL
1225	7	2026-09-06 12:49:54.106265	DDoS	DDoS	1	95	CRITICAL
1226	7	2026-09-06 12:49:54.109518	DDoS	DDoS	1	95	CRITICAL
1227	7	2026-09-06 12:49:54.113491	DDoS	DDoS	1	95	CRITICAL
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (id, report_type, filename, generated_by, generated_at, data_summary) FROM stdin;
1	Security Audit Report	report_security_audit_report_20260905_152559.json	3	2026-09-05 15:25:59	{"title": "NetShield AI ΓÇö Security Audit Report", "generated_at": "2026-09-05T15:25:59.299747+00:00", "generated_by": "nandini", "total_traffic": 500, "alerts_summary": [{"count": 1, "status": "NEW"}], "benign_traffic": 274, "attack_breakdown": [{"count": 274, "attack_type": "BENIGN"}, {"count": 141, "attack_type": "DDoS"}, {"count": 42, "attack_type": "FTP-Patator"}, {"count": 43, "attack_type": "SSH-Patator"}], "incidents_summary": [{"count": 1, "status": "OPEN"}], "malicious_traffic": 226, "resolved_incidents": 0, "severity_breakdown": [{"count": 274, "severity": "LOW"}, {"count": 42, "severity": "MEDIUM"}, {"count": 43, "severity": "HIGH"}, {"count": 141, "severity": "CRITICAL"}], "unresolved_incidents": 1, "total_threats_detected": 226, "latest_dataset_analyzed": "sample_network_traffic.csv"}
2	Threat Detection Security Report	report_threat_detection_security_report_20260906_063222.json	1	2026-09-06 06:32:22	{"title": "NetShield AI ΓÇö Threat Detection Security Report", "generated_at": "2026-09-06T06:32:22.901153+00:00", "generated_by": "System Admin", "total_traffic": 677, "alerts_summary": [{"count": 3, "status": "NEW"}, {"count": 1, "status": "INVESTIGATING"}], "benign_traffic": 324, "attack_breakdown": [{"count": 324, "attack_type": "BENIGN"}, {"count": 141, "attack_type": "DDoS"}, {"count": 126, "attack_type": "FTP-Patator"}, {"count": 86, "attack_type": "SSH-Patator"}], "incidents_summary": [{"count": 1, "status": "OPEN"}, {"count": 1, "status": "CONTAINED"}, {"count": 1, "status": "RESOLVED"}], "malicious_traffic": 353, "resolved_incidents": 1, "severity_breakdown": [{"count": 324, "severity": "LOW"}, {"count": 126, "severity": "MEDIUM"}, {"count": 86, "severity": "HIGH"}, {"count": 141, "severity": "CRITICAL"}], "unresolved_incidents": 2, "total_threats_detected": 353, "latest_dataset_analyzed": "ftp_patator_sample.csv"}
\.


--
-- Data for Name: security_alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.security_alerts (id, threat_id, title, description, severity, alert_type, status, created_at, acknowledged_at, resolved_at) FROM stdin;
1	1	DDoS Threat Detected	Detected DDoS on destination IP 10.0.0.14 with risk score 95/100.	CRITICAL	Threat Detection	NEW	2026-09-05 15:25:19	\N	\N
2	227	Threat Threat Detected	Detected anomaly on destination IP target with risk score 90/100.	HIGH	Threat Detection	NEW	2026-09-05 16:21:50	\N	\N
3	269	SSH-Patator Threat Detected	Detected SSH-Patator on destination IP 10.0.0.15 with risk score 80/100.	CRITICAL	Threat Detection	NEW	2026-09-06 05:04:27	\N	\N
4	312	Threat Threat Detected	Detected anomaly on destination IP target with risk score 90/100.	HIGH	Threat Detection	INVESTIGATING	2026-09-06 05:04:50	2026-09-06 05:05:11	2026-09-06 05:05:16
5	354	DDoS Threat Detected	Detected DDoS on destination IP 10.0.0.14 with risk score 95/100.	CRITICAL	Threat Detection	NEW	2026-09-06 08:57:11	\N	\N
6	580	DDoS Threat Detected	Detected DDoS on destination IP 10.0.0.8 with risk score 95/100.	CRITICAL	Threat Detection	NEW	2026-09-06 12:49:54.117884	\N	\N
\.


--
-- Data for Name: threat_intelligence; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.threat_intelligence (id, attack_type, severity, risk_score, description, recommended_response, detection_count, last_detected_at, created_at, updated_at) FROM stdin;
1	BENIGN	LOW	5	Normal network traffic exhibiting standard protocol behaviors with no malicious payload signatures.	Continue routine passive telemetry monitoring. No defensive action needed.	0	\N	2026-09-05 14:34:55	2026-09-05 14:34:55
2	FTP-Patator	MEDIUM	65	Automated brute-force password guessing attack targeting FTP services to gain unauthorized access.	Enforce rate-limiting on port 21, temporarily block attacking IPs via firewall, and enforce strong password policies.	0	\N	2026-09-05 14:34:55	2026-09-05 14:34:55
3	SSH-Patator	HIGH	80	Brute-force SSH attack attempting dictionary credentials against administrative remote terminals.	Disable password authentication on SSH (enforce Ed25519 keys), bind SSH to non-standard port or VPN, and ban source IP via Fail2Ban.	0	\N	2026-09-05 14:34:55	2026-09-05 14:34:55
4	DDoS	CRITICAL	95	Distributed Denial of Service attack flooding bandwidth and connection pools to bring down mission-critical services.	Trigger BGP Anycast scrubbing, activate Cloudflare/AWS Shield DDoS mitigation rate-limits, blackhole spoofed subnet traffic, and engage incident response team.	0	\N	2026-09-05 14:34:55	2026-09-05 14:34:55
\.


--
-- Data for Name: threats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.threats (id, prediction_id, attack_type, source_ip, destination_ip, protocol, confidence, risk_score, severity, detected_at, status) FROM stdin;
1	1	DDoS	172.16.9.8	10.0.0.9	TCP	1	95	CRITICAL	2026-09-05 15:25:13	NEW
2	2	DDoS	172.16.88.72	10.0.0.8	TCP	1	95	CRITICAL	2026-09-05 15:25:13	NEW
3	3	FTP-Patator	192.168.10.110	10.0.0.9	TCP	0.83	65	MEDIUM	2026-09-05 15:25:13	NEW
4	5	DDoS	172.16.98.70	10.0.0.20	TCP	1	95	CRITICAL	2026-09-05 15:25:13	NEW
5	7	DDoS	172.16.40.161	10.0.0.8	TCP	1	95	CRITICAL	2026-09-05 15:25:13	NEW
6	15	FTP-Patator	192.168.10.111	10.0.0.15	TCP	0.99	65	MEDIUM	2026-09-05 15:25:13	NEW
7	17	DDoS	172.16.173.221	10.0.0.17	TCP	1	95	CRITICAL	2026-09-05 15:25:13	NEW
8	19	SSH-Patator	192.168.12.133	10.0.0.15	TCP	0.94	80	HIGH	2026-09-05 15:25:13	NEW
9	21	DDoS	172.16.213.71	10.0.0.9	TCP	1	95	CRITICAL	2026-09-05 15:25:13	NEW
10	22	DDoS	172.16.150.142	10.0.0.1	TCP	1	95	CRITICAL	2026-09-05 15:25:13	NEW
11	23	FTP-Patator	192.168.10.152	10.0.0.12	TCP	0.97	65	MEDIUM	2026-09-05 15:25:13	NEW
12	24	FTP-Patator	192.168.10.120	10.0.0.6	TCP	0.91	65	MEDIUM	2026-09-05 15:25:13	NEW
13	29	DDoS	172.16.202.149	10.0.0.13	TCP	1	95	CRITICAL	2026-09-05 15:25:13	NEW
14	30	SSH-Patator	192.168.12.111	10.0.0.6	TCP	0.91	80	HIGH	2026-09-05 15:25:13	NEW
15	32	FTP-Patator	192.168.10.171	10.0.0.14	TCP	0.95	65	MEDIUM	2026-09-05 15:25:13	NEW
16	33	DDoS	172.16.67.193	10.0.0.17	TCP	1	95	CRITICAL	2026-09-05 15:25:13	NEW
17	36	SSH-Patator	192.168.12.128	10.0.0.18	TCP	1	80	HIGH	2026-09-05 15:25:13	NEW
18	37	DDoS	172.16.22.165	10.0.0.15	TCP	1	95	CRITICAL	2026-09-05 15:25:13	NEW
19	39	DDoS	172.16.33.122	10.0.0.1	TCP	1	95	CRITICAL	2026-09-05 15:25:13	NEW
20	41	FTP-Patator	192.168.10.184	10.0.0.4	TCP	0.98	65	MEDIUM	2026-09-05 15:25:13	NEW
21	43	SSH-Patator	192.168.12.143	10.0.0.15	TCP	0.99	80	HIGH	2026-09-05 15:25:14	NEW
22	45	DDoS	172.16.142.136	10.0.0.10	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
23	49	SSH-Patator	192.168.12.199	10.0.0.8	TCP	0.93	80	HIGH	2026-09-05 15:25:14	NEW
24	50	DDoS	172.16.170.21	10.0.0.20	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
25	51	DDoS	172.16.176.60	10.0.0.2	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
26	52	FTP-Patator	192.168.10.156	10.0.0.2	TCP	0.84	65	MEDIUM	2026-09-05 15:25:14	NEW
27	55	SSH-Patator	192.168.12.141	10.0.0.18	TCP	0.86	80	HIGH	2026-09-05 15:25:14	NEW
28	57	DDoS	172.16.216.234	10.0.0.6	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
29	64	DDoS	172.16.234.150	10.0.0.6	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
30	65	FTP-Patator	192.168.10.144	10.0.0.10	TCP	0.98	65	MEDIUM	2026-09-05 15:25:14	NEW
31	66	SSH-Patator	192.168.12.173	10.0.0.16	TCP	0.96	80	HIGH	2026-09-05 15:25:14	NEW
32	67	DDoS	172.16.57.163	10.0.0.2	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
33	68	DDoS	172.16.84.192	10.0.0.15	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
34	69	FTP-Patator	192.168.10.118	10.0.0.16	TCP	0.99	65	MEDIUM	2026-09-05 15:25:14	NEW
35	71	DDoS	172.16.30.36	10.0.0.20	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
36	74	DDoS	172.16.213.196	10.0.0.1	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
37	75	DDoS	172.16.34.4	10.0.0.5	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
38	77	DDoS	172.16.126.183	10.0.0.15	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
39	78	DDoS	172.16.204.180	10.0.0.11	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
40	80	FTP-Patator	192.168.10.152	10.0.0.2	TCP	0.95	65	MEDIUM	2026-09-05 15:25:14	NEW
41	81	DDoS	172.16.30.196	10.0.0.5	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
42	82	DDoS	172.16.223.37	10.0.0.6	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
43	84	DDoS	172.16.111.29	10.0.0.20	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
44	89	FTP-Patator	192.168.10.197	10.0.0.4	TCP	0.91	65	MEDIUM	2026-09-05 15:25:14	NEW
45	90	DDoS	172.16.113.18	10.0.0.19	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
46	96	FTP-Patator	192.168.10.120	10.0.0.11	TCP	0.97	65	MEDIUM	2026-09-05 15:25:14	NEW
47	97	SSH-Patator	192.168.12.200	10.0.0.10	TCP	0.97	80	HIGH	2026-09-05 15:25:14	NEW
48	101	DDoS	172.16.199.74	10.0.0.3	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
49	104	DDoS	172.16.209.165	10.0.0.19	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
50	105	DDoS	172.16.239.80	10.0.0.2	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
51	107	DDoS	172.16.83.27	10.0.0.3	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
52	108	DDoS	172.16.20.172	10.0.0.15	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
53	109	DDoS	172.16.99.244	10.0.0.15	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
54	110	DDoS	172.16.246.30	10.0.0.5	TCP	1	95	CRITICAL	2026-09-05 15:25:14	NEW
55	115	FTP-Patator	192.168.10.144	10.0.0.5	TCP	1	65	MEDIUM	2026-09-05 15:25:14	NEW
56	122	DDoS	172.16.19.99	10.0.0.2	TCP	1	95	CRITICAL	2026-09-05 15:25:15	NEW
57	125	FTP-Patator	192.168.10.192	10.0.0.11	TCP	0.97	65	MEDIUM	2026-09-05 15:25:15	NEW
58	129	SSH-Patator	192.168.12.148	10.0.0.9	TCP	0.97	80	HIGH	2026-09-05 15:25:15	NEW
59	132	FTP-Patator	192.168.10.183	10.0.0.7	TCP	0.99	65	MEDIUM	2026-09-05 15:25:15	NEW
60	133	SSH-Patator	192.168.12.104	10.0.0.13	TCP	0.98	80	HIGH	2026-09-05 15:25:15	NEW
61	135	DDoS	172.16.103.172	10.0.0.20	TCP	1	95	CRITICAL	2026-09-05 15:25:15	NEW
62	137	DDoS	172.16.246.35	10.0.0.10	TCP	1	95	CRITICAL	2026-09-05 15:25:15	NEW
63	144	DDoS	172.16.154.173	10.0.0.1	TCP	1	95	CRITICAL	2026-09-05 15:25:15	NEW
64	145	FTP-Patator	192.168.10.173	10.0.0.5	TCP	0.97	65	MEDIUM	2026-09-05 15:25:15	NEW
65	146	DDoS	172.16.242.165	10.0.0.6	TCP	1	95	CRITICAL	2026-09-05 15:25:15	NEW
66	149	DDoS	172.16.55.240	10.0.0.18	TCP	1	95	CRITICAL	2026-09-05 15:25:15	NEW
67	158	DDoS	172.16.151.37	10.0.0.18	TCP	1	95	CRITICAL	2026-09-05 15:25:15	NEW
68	159	DDoS	172.16.14.26	10.0.0.11	TCP	1	95	CRITICAL	2026-09-05 15:25:15	NEW
69	160	DDoS	172.16.175.150	10.0.0.15	TCP	1	95	CRITICAL	2026-09-05 15:25:15	NEW
70	163	DDoS	172.16.69.78	10.0.0.8	TCP	1	95	CRITICAL	2026-09-05 15:25:15	NEW
71	164	DDoS	172.16.28.35	10.0.0.9	TCP	1	95	CRITICAL	2026-09-05 15:25:15	NEW
72	166	SSH-Patator	192.168.12.114	10.0.0.8	TCP	0.96	80	HIGH	2026-09-05 15:25:15	NEW
73	167	SSH-Patator	192.168.12.152	10.0.0.7	TCP	0.97	80	HIGH	2026-09-05 15:25:15	NEW
74	169	DDoS	172.16.248.204	10.0.0.20	TCP	1	95	CRITICAL	2026-09-05 15:25:15	NEW
75	170	DDoS	172.16.7.124	10.0.0.8	TCP	1	95	CRITICAL	2026-09-05 15:25:15	NEW
76	175	DDoS	172.16.31.62	10.0.0.10	TCP	1	95	CRITICAL	2026-09-05 15:25:15	NEW
77	179	DDoS	172.16.113.222	10.0.0.8	TCP	1	95	CRITICAL	2026-09-05 15:25:15	NEW
78	186	DDoS	172.16.123.20	10.0.0.8	TCP	1	95	CRITICAL	2026-09-05 15:25:15	NEW
79	188	FTP-Patator	192.168.10.156	10.0.0.5	TCP	0.8	65	MEDIUM	2026-09-05 15:25:15	NEW
80	190	DDoS	172.16.133.156	10.0.0.20	TCP	1	95	CRITICAL	2026-09-05 15:25:15	NEW
81	192	DDoS	172.16.237.16	10.0.0.3	TCP	1	95	CRITICAL	2026-09-05 15:25:15	NEW
82	193	DDoS	172.16.138.84	10.0.0.20	TCP	1	95	CRITICAL	2026-09-05 15:25:15	NEW
83	195	DDoS	172.16.198.231	10.0.0.9	TCP	1	95	CRITICAL	2026-09-05 15:25:15	NEW
84	196	DDoS	172.16.41.66	10.0.0.15	TCP	1	95	CRITICAL	2026-09-05 15:25:15	NEW
85	200	FTP-Patator	192.168.10.126	10.0.0.1	TCP	1	65	MEDIUM	2026-09-05 15:25:15	NEW
86	201	SSH-Patator	192.168.12.195	10.0.0.17	TCP	1	80	HIGH	2026-09-05 15:25:16	NEW
87	205	SSH-Patator	192.168.12.117	10.0.0.15	TCP	0.88	80	HIGH	2026-09-05 15:25:16	NEW
88	206	DDoS	172.16.51.232	10.0.0.3	TCP	1	95	CRITICAL	2026-09-05 15:25:16	NEW
89	211	DDoS	172.16.152.82	10.0.0.8	TCP	1	95	CRITICAL	2026-09-05 15:25:16	NEW
90	212	SSH-Patator	192.168.12.111	10.0.0.16	TCP	0.91	80	HIGH	2026-09-05 15:25:16	NEW
91	215	DDoS	172.16.164.145	10.0.0.13	TCP	1	95	CRITICAL	2026-09-05 15:25:16	NEW
92	216	DDoS	172.16.3.68	10.0.0.3	TCP	1	95	CRITICAL	2026-09-05 15:25:16	NEW
93	218	FTP-Patator	192.168.10.121	10.0.0.1	TCP	0.98	65	MEDIUM	2026-09-05 15:25:16	NEW
94	223	FTP-Patator	192.168.10.138	10.0.0.18	TCP	0.85	65	MEDIUM	2026-09-05 15:25:16	NEW
95	224	DDoS	172.16.33.11	10.0.0.5	TCP	1	95	CRITICAL	2026-09-05 15:25:16	NEW
96	225	FTP-Patator	192.168.10.150	10.0.0.11	TCP	0.94	65	MEDIUM	2026-09-05 15:25:16	NEW
97	226	DDoS	172.16.237.28	10.0.0.17	TCP	1	95	CRITICAL	2026-09-05 15:25:16	NEW
98	227	DDoS	172.16.10.102	10.0.0.20	TCP	1	95	CRITICAL	2026-09-05 15:25:16	NEW
99	228	FTP-Patator	192.168.10.138	10.0.0.10	TCP	0.99	65	MEDIUM	2026-09-05 15:25:16	NEW
100	229	FTP-Patator	192.168.10.108	10.0.0.16	TCP	0.98	65	MEDIUM	2026-09-05 15:25:16	NEW
101	233	SSH-Patator	192.168.12.132	10.0.0.9	TCP	0.99	80	HIGH	2026-09-05 15:25:16	NEW
102	234	SSH-Patator	192.168.12.108	10.0.0.12	TCP	0.98	80	HIGH	2026-09-05 15:25:16	NEW
103	235	DDoS	172.16.175.36	10.0.0.5	TCP	1	95	CRITICAL	2026-09-05 15:25:16	NEW
104	236	DDoS	172.16.130.77	10.0.0.7	TCP	1	95	CRITICAL	2026-09-05 15:25:16	NEW
105	237	DDoS	172.16.58.191	10.0.0.6	TCP	1	95	CRITICAL	2026-09-05 15:25:16	NEW
106	238	FTP-Patator	192.168.10.124	10.0.0.2	TCP	0.95	65	MEDIUM	2026-09-05 15:25:16	NEW
107	243	DDoS	172.16.151.130	10.0.0.13	TCP	1	95	CRITICAL	2026-09-05 15:25:16	NEW
108	244	DDoS	172.16.177.30	10.0.0.2	TCP	0.96	95	CRITICAL	2026-09-05 15:25:16	NEW
109	245	DDoS	172.16.108.213	10.0.0.1	TCP	1	95	CRITICAL	2026-09-05 15:25:16	NEW
110	247	FTP-Patator	192.168.10.132	10.0.0.16	TCP	0.91	65	MEDIUM	2026-09-05 15:25:16	NEW
111	249	SSH-Patator	192.168.12.151	10.0.0.3	TCP	0.91	80	HIGH	2026-09-05 15:25:16	NEW
112	250	DDoS	172.16.234.152	10.0.0.5	TCP	1	95	CRITICAL	2026-09-05 15:25:16	NEW
113	251	FTP-Patator	192.168.10.105	10.0.0.5	TCP	0.94	65	MEDIUM	2026-09-05 15:25:16	NEW
114	256	DDoS	172.16.88.91	10.0.0.12	TCP	1	95	CRITICAL	2026-09-05 15:25:16	NEW
115	258	SSH-Patator	192.168.12.184	10.0.0.19	TCP	0.95	80	HIGH	2026-09-05 15:25:16	NEW
116	259	SSH-Patator	192.168.12.188	10.0.0.19	TCP	0.98	80	HIGH	2026-09-05 15:25:16	NEW
117	260	FTP-Patator	192.168.10.143	10.0.0.13	TCP	0.96	65	MEDIUM	2026-09-05 15:25:16	NEW
118	262	SSH-Patator	192.168.12.171	10.0.0.18	TCP	0.92	80	HIGH	2026-09-05 15:25:16	NEW
119	264	DDoS	172.16.61.131	10.0.0.12	TCP	1	95	CRITICAL	2026-09-05 15:25:16	NEW
120	268	DDoS	172.16.170.85	10.0.0.14	TCP	1	95	CRITICAL	2026-09-05 15:25:16	NEW
121	269	SSH-Patator	192.168.12.105	10.0.0.4	TCP	0.99	80	HIGH	2026-09-05 15:25:16	NEW
122	271	DDoS	172.16.192.176	10.0.0.14	TCP	1	95	CRITICAL	2026-09-05 15:25:16	NEW
123	272	DDoS	172.16.162.104	10.0.0.3	TCP	1	95	CRITICAL	2026-09-05 15:25:16	NEW
124	273	DDoS	172.16.202.176	10.0.0.19	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
125	275	FTP-Patator	192.168.10.170	10.0.0.4	TCP	0.43	65	MEDIUM	2026-09-05 15:25:17	NEW
126	277	DDoS	172.16.172.168	10.0.0.4	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
127	278	DDoS	172.16.2.81	10.0.0.19	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
128	279	DDoS	172.16.45.166	10.0.0.16	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
129	283	SSH-Patator	192.168.12.183	10.0.0.13	TCP	0.92	80	HIGH	2026-09-05 15:25:17	NEW
130	285	DDoS	172.16.39.48	10.0.0.5	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
131	287	FTP-Patator	192.168.10.176	10.0.0.2	TCP	0.81	65	MEDIUM	2026-09-05 15:25:17	NEW
132	288	DDoS	172.16.43.186	10.0.0.16	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
133	291	DDoS	172.16.73.154	10.0.0.19	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
134	294	DDoS	172.16.42.100	10.0.0.6	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
135	296	DDoS	172.16.173.10	10.0.0.17	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
136	302	DDoS	172.16.218.124	10.0.0.4	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
137	303	SSH-Patator	192.168.12.167	10.0.0.13	TCP	0.81	80	HIGH	2026-09-05 15:25:17	NEW
138	304	DDoS	172.16.173.54	10.0.0.4	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
139	306	DDoS	172.16.38.205	10.0.0.4	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
140	307	DDoS	172.16.26.177	10.0.0.11	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
141	308	DDoS	172.16.106.32	10.0.0.12	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
142	312	DDoS	172.16.59.64	10.0.0.4	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
143	313	FTP-Patator	192.168.10.117	10.0.0.16	TCP	0.71	65	MEDIUM	2026-09-05 15:25:17	NEW
144	316	DDoS	172.16.73.167	10.0.0.13	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
145	321	FTP-Patator	192.168.10.121	10.0.0.4	TCP	0.94	65	MEDIUM	2026-09-05 15:25:17	NEW
146	322	DDoS	172.16.176.159	10.0.0.20	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
147	326	DDoS	172.16.134.169	10.0.0.20	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
148	331	DDoS	172.16.93.247	10.0.0.11	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
149	333	FTP-Patator	192.168.10.172	10.0.0.8	TCP	0.97	65	MEDIUM	2026-09-05 15:25:17	NEW
150	334	DDoS	172.16.200.15	10.0.0.4	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
151	335	DDoS	172.16.79.135	10.0.0.20	TCP	0.96	95	CRITICAL	2026-09-05 15:25:17	NEW
152	337	DDoS	172.16.124.144	10.0.0.13	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
153	340	DDoS	172.16.121.6	10.0.0.10	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
154	344	DDoS	172.16.242.143	10.0.0.17	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
155	345	SSH-Patator	192.168.12.139	10.0.0.8	TCP	0.99	80	HIGH	2026-09-05 15:25:17	NEW
156	346	DDoS	172.16.168.239	10.0.0.5	TCP	1	95	CRITICAL	2026-09-05 15:25:17	NEW
157	349	FTP-Patator	192.168.10.152	10.0.0.16	TCP	0.85	65	MEDIUM	2026-09-05 15:25:18	NEW
158	350	SSH-Patator	192.168.12.154	10.0.0.20	TCP	0.98	80	HIGH	2026-09-05 15:25:18	NEW
159	351	DDoS	172.16.117.212	10.0.0.17	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
160	352	DDoS	172.16.43.109	10.0.0.7	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
161	353	DDoS	172.16.83.116	10.0.0.6	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
162	354	DDoS	172.16.22.135	10.0.0.6	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
163	355	DDoS	172.16.79.80	10.0.0.5	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
164	356	DDoS	172.16.56.151	10.0.0.15	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
165	357	FTP-Patator	192.168.10.118	10.0.0.20	TCP	0.98	65	MEDIUM	2026-09-05 15:25:18	NEW
166	359	FTP-Patator	192.168.10.115	10.0.0.14	TCP	1	65	MEDIUM	2026-09-05 15:25:18	NEW
167	362	DDoS	172.16.164.52	10.0.0.14	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
168	364	DDoS	172.16.214.134	10.0.0.5	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
169	365	SSH-Patator	192.168.12.148	10.0.0.12	TCP	0.69	80	HIGH	2026-09-05 15:25:18	NEW
170	366	DDoS	172.16.96.116	10.0.0.11	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
171	368	DDoS	172.16.80.239	10.0.0.7	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
172	370	DDoS	172.16.147.63	10.0.0.7	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
173	371	SSH-Patator	192.168.12.122	10.0.0.4	TCP	0.89	80	HIGH	2026-09-05 15:25:18	NEW
174	372	DDoS	172.16.25.117	10.0.0.3	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
175	373	SSH-Patator	192.168.12.162	10.0.0.6	TCP	1	80	HIGH	2026-09-05 15:25:18	NEW
176	374	DDoS	172.16.143.167	10.0.0.19	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
177	376	SSH-Patator	192.168.12.171	10.0.0.16	TCP	0.95	80	HIGH	2026-09-05 15:25:18	NEW
178	377	DDoS	172.16.210.36	10.0.0.13	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
179	378	DDoS	172.16.184.252	10.0.0.7	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
180	384	DDoS	172.16.232.88	10.0.0.3	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
181	386	DDoS	172.16.34.158	10.0.0.10	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
182	387	DDoS	172.16.47.205	10.0.0.15	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
183	388	FTP-Patator	192.168.10.173	10.0.0.14	TCP	0.99	65	MEDIUM	2026-09-05 15:25:18	NEW
184	390	DDoS	172.16.70.69	10.0.0.4	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
185	391	DDoS	172.16.173.3	10.0.0.7	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
186	392	DDoS	172.16.182.246	10.0.0.7	TCP	0.99	95	CRITICAL	2026-09-05 15:25:18	NEW
187	393	DDoS	172.16.170.240	10.0.0.6	TCP	0.99	95	CRITICAL	2026-09-05 15:25:18	NEW
188	394	DDoS	172.16.86.16	10.0.0.6	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
189	402	SSH-Patator	192.168.12.113	10.0.0.4	TCP	0.98	80	HIGH	2026-09-05 15:25:18	NEW
190	405	SSH-Patator	192.168.12.188	10.0.0.19	TCP	0.97	80	HIGH	2026-09-05 15:25:18	NEW
191	406	DDoS	172.16.108.2	10.0.0.20	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
192	407	SSH-Patator	192.168.12.135	10.0.0.8	TCP	0.98	80	HIGH	2026-09-05 15:25:18	NEW
193	408	SSH-Patator	192.168.12.178	10.0.0.12	TCP	0.94	80	HIGH	2026-09-05 15:25:18	NEW
194	412	FTP-Patator	192.168.10.129	10.0.0.6	TCP	0.88	65	MEDIUM	2026-09-05 15:25:18	NEW
195	416	DDoS	172.16.229.177	10.0.0.15	TCP	1	95	CRITICAL	2026-09-05 15:25:18	NEW
196	417	FTP-Patator	192.168.10.146	10.0.0.2	TCP	1	65	MEDIUM	2026-09-05 15:25:18	NEW
197	422	DDoS	172.16.78.146	10.0.0.16	TCP	1	95	CRITICAL	2026-09-05 15:25:19	NEW
198	423	DDoS	172.16.47.250	10.0.0.5	TCP	1	95	CRITICAL	2026-09-05 15:25:19	NEW
199	425	SSH-Patator	192.168.12.194	10.0.0.5	TCP	0.94	80	HIGH	2026-09-05 15:25:19	NEW
200	426	DDoS	172.16.231.11	10.0.0.5	TCP	1	95	CRITICAL	2026-09-05 15:25:19	NEW
201	431	DDoS	172.16.7.203	10.0.0.10	TCP	1	95	CRITICAL	2026-09-05 15:25:19	NEW
202	435	FTP-Patator	192.168.10.145	10.0.0.10	TCP	0.94	65	MEDIUM	2026-09-05 15:25:19	NEW
203	436	SSH-Patator	192.168.12.171	10.0.0.4	TCP	0.54	80	HIGH	2026-09-05 15:25:19	NEW
204	438	DDoS	172.16.5.199	10.0.0.5	TCP	1	95	CRITICAL	2026-09-05 15:25:19	NEW
205	441	SSH-Patator	192.168.12.190	10.0.0.18	TCP	0.89	80	HIGH	2026-09-05 15:25:19	NEW
206	442	FTP-Patator	192.168.10.197	10.0.0.14	TCP	0.94	65	MEDIUM	2026-09-05 15:25:19	NEW
207	445	DDoS	172.16.60.215	10.0.0.6	TCP	1	95	CRITICAL	2026-09-05 15:25:19	NEW
208	446	SSH-Patator	192.168.12.198	10.0.0.16	TCP	0.92	80	HIGH	2026-09-05 15:25:19	NEW
209	450	DDoS	172.16.101.68	10.0.0.18	TCP	1	95	CRITICAL	2026-09-05 15:25:19	NEW
210	455	SSH-Patator	192.168.12.175	10.0.0.8	TCP	0.82	80	HIGH	2026-09-05 15:25:19	NEW
211	464	DDoS	172.16.164.246	10.0.0.2	TCP	1	95	CRITICAL	2026-09-05 15:25:19	NEW
212	467	DDoS	172.16.1.103	10.0.0.1	TCP	1	95	CRITICAL	2026-09-05 15:25:19	NEW
213	468	SSH-Patator	192.168.12.161	10.0.0.5	TCP	1	80	HIGH	2026-09-05 15:25:19	NEW
214	473	DDoS	172.16.233.91	10.0.0.3	TCP	1	95	CRITICAL	2026-09-05 15:25:19	NEW
215	476	SSH-Patator	192.168.12.123	10.0.0.15	TCP	0.76	80	HIGH	2026-09-05 15:25:19	NEW
216	478	FTP-Patator	192.168.10.123	10.0.0.19	TCP	0.92	65	MEDIUM	2026-09-05 15:25:19	NEW
217	479	DDoS	172.16.21.118	10.0.0.4	TCP	1	95	CRITICAL	2026-09-05 15:25:19	NEW
218	480	DDoS	172.16.221.13	10.0.0.11	TCP	1	95	CRITICAL	2026-09-05 15:25:19	NEW
219	483	DDoS	172.16.132.88	10.0.0.12	TCP	1	95	CRITICAL	2026-09-05 15:25:19	NEW
220	486	DDoS	172.16.151.186	10.0.0.13	TCP	1	95	CRITICAL	2026-09-05 15:25:19	NEW
221	488	DDoS	172.16.206.78	10.0.0.20	TCP	1	95	CRITICAL	2026-09-05 15:25:19	NEW
222	490	SSH-Patator	192.168.12.131	10.0.0.15	TCP	0.94	80	HIGH	2026-09-05 15:25:19	NEW
223	491	FTP-Patator	192.168.10.104	10.0.0.14	TCP	0.64	65	MEDIUM	2026-09-05 15:25:19	NEW
224	494	DDoS	172.16.171.124	10.0.0.16	TCP	1	95	CRITICAL	2026-09-05 15:25:19	NEW
225	495	SSH-Patator	192.168.12.133	10.0.0.8	TCP	0.84	80	HIGH	2026-09-05 15:25:19	NEW
226	500	DDoS	172.16.114.38	10.0.0.14	TCP	1	95	CRITICAL	2026-09-05 15:25:19	NEW
227	501	FTP-Patator	192.168.10.110	10.0.0.9	TCP	0.83	65	MEDIUM	2026-09-05 16:21:49	NEW
228	502	FTP-Patator	192.168.10.111	10.0.0.15	TCP	0.99	65	MEDIUM	2026-09-05 16:21:49	NEW
229	503	FTP-Patator	192.168.10.152	10.0.0.12	TCP	0.97	65	MEDIUM	2026-09-05 16:21:49	NEW
230	504	FTP-Patator	192.168.10.120	10.0.0.6	TCP	0.91	65	MEDIUM	2026-09-05 16:21:49	NEW
231	505	FTP-Patator	192.168.10.171	10.0.0.14	TCP	0.95	65	MEDIUM	2026-09-05 16:21:49	NEW
232	506	FTP-Patator	192.168.10.184	10.0.0.4	TCP	0.98	65	MEDIUM	2026-09-05 16:21:49	NEW
233	507	FTP-Patator	192.168.10.156	10.0.0.2	TCP	0.84	65	MEDIUM	2026-09-05 16:21:49	NEW
234	508	FTP-Patator	192.168.10.144	10.0.0.10	TCP	0.98	65	MEDIUM	2026-09-05 16:21:49	NEW
235	509	FTP-Patator	192.168.10.118	10.0.0.16	TCP	0.99	65	MEDIUM	2026-09-05 16:21:49	NEW
236	510	FTP-Patator	192.168.10.152	10.0.0.2	TCP	0.95	65	MEDIUM	2026-09-05 16:21:49	NEW
237	511	FTP-Patator	192.168.10.197	10.0.0.4	TCP	0.91	65	MEDIUM	2026-09-05 16:21:49	NEW
238	512	FTP-Patator	192.168.10.120	10.0.0.11	TCP	0.97	65	MEDIUM	2026-09-05 16:21:49	NEW
239	513	FTP-Patator	192.168.10.144	10.0.0.5	TCP	1	65	MEDIUM	2026-09-05 16:21:49	NEW
240	514	FTP-Patator	192.168.10.192	10.0.0.11	TCP	0.97	65	MEDIUM	2026-09-05 16:21:49	NEW
241	515	FTP-Patator	192.168.10.183	10.0.0.7	TCP	0.99	65	MEDIUM	2026-09-05 16:21:49	NEW
242	516	FTP-Patator	192.168.10.173	10.0.0.5	TCP	0.97	65	MEDIUM	2026-09-05 16:21:49	NEW
243	517	FTP-Patator	192.168.10.156	10.0.0.5	TCP	0.8	65	MEDIUM	2026-09-05 16:21:49	NEW
244	518	FTP-Patator	192.168.10.126	10.0.0.1	TCP	1	65	MEDIUM	2026-09-05 16:21:49	NEW
245	519	FTP-Patator	192.168.10.121	10.0.0.1	TCP	0.98	65	MEDIUM	2026-09-05 16:21:49	NEW
246	520	FTP-Patator	192.168.10.138	10.0.0.18	TCP	0.85	65	MEDIUM	2026-09-05 16:21:49	NEW
247	521	FTP-Patator	192.168.10.150	10.0.0.11	TCP	0.94	65	MEDIUM	2026-09-05 16:21:49	NEW
248	522	FTP-Patator	192.168.10.138	10.0.0.10	TCP	0.99	65	MEDIUM	2026-09-05 16:21:50	NEW
249	523	FTP-Patator	192.168.10.108	10.0.0.16	TCP	0.98	65	MEDIUM	2026-09-05 16:21:50	NEW
250	524	FTP-Patator	192.168.10.124	10.0.0.2	TCP	0.95	65	MEDIUM	2026-09-05 16:21:50	NEW
251	525	FTP-Patator	192.168.10.132	10.0.0.16	TCP	0.91	65	MEDIUM	2026-09-05 16:21:50	NEW
252	526	FTP-Patator	192.168.10.105	10.0.0.5	TCP	0.94	65	MEDIUM	2026-09-05 16:21:50	NEW
253	527	FTP-Patator	192.168.10.143	10.0.0.13	TCP	0.96	65	MEDIUM	2026-09-05 16:21:50	NEW
254	528	FTP-Patator	192.168.10.170	10.0.0.4	TCP	0.43	65	MEDIUM	2026-09-05 16:21:50	NEW
255	529	FTP-Patator	192.168.10.176	10.0.0.2	TCP	0.81	65	MEDIUM	2026-09-05 16:21:50	NEW
256	530	FTP-Patator	192.168.10.117	10.0.0.16	TCP	0.71	65	MEDIUM	2026-09-05 16:21:50	NEW
257	531	FTP-Patator	192.168.10.121	10.0.0.4	TCP	0.94	65	MEDIUM	2026-09-05 16:21:50	NEW
258	532	FTP-Patator	192.168.10.172	10.0.0.8	TCP	0.97	65	MEDIUM	2026-09-05 16:21:50	NEW
259	533	FTP-Patator	192.168.10.152	10.0.0.16	TCP	0.85	65	MEDIUM	2026-09-05 16:21:50	NEW
260	534	FTP-Patator	192.168.10.118	10.0.0.20	TCP	0.98	65	MEDIUM	2026-09-05 16:21:50	NEW
261	535	FTP-Patator	192.168.10.115	10.0.0.14	TCP	1	65	MEDIUM	2026-09-05 16:21:50	NEW
262	536	FTP-Patator	192.168.10.173	10.0.0.14	TCP	0.99	65	MEDIUM	2026-09-05 16:21:50	NEW
263	537	FTP-Patator	192.168.10.129	10.0.0.6	TCP	0.88	65	MEDIUM	2026-09-05 16:21:50	NEW
264	538	FTP-Patator	192.168.10.146	10.0.0.2	TCP	1	65	MEDIUM	2026-09-05 16:21:50	NEW
265	539	FTP-Patator	192.168.10.145	10.0.0.10	TCP	0.94	65	MEDIUM	2026-09-05 16:21:50	NEW
266	540	FTP-Patator	192.168.10.197	10.0.0.14	TCP	0.94	65	MEDIUM	2026-09-05 16:21:50	NEW
267	541	FTP-Patator	192.168.10.123	10.0.0.19	TCP	0.92	65	MEDIUM	2026-09-05 16:21:50	NEW
268	542	FTP-Patator	192.168.10.104	10.0.0.14	TCP	0.64	65	MEDIUM	2026-09-05 16:21:50	NEW
269	593	SSH-Patator	192.168.12.133	10.0.0.15	TCP	0.94	80	HIGH	2026-09-06 05:04:26	NEW
270	594	SSH-Patator	192.168.12.111	10.0.0.6	TCP	0.91	80	HIGH	2026-09-06 05:04:26	NEW
271	595	SSH-Patator	192.168.12.128	10.0.0.18	TCP	1	80	HIGH	2026-09-06 05:04:26	NEW
272	596	SSH-Patator	192.168.12.143	10.0.0.15	TCP	0.99	80	HIGH	2026-09-06 05:04:26	NEW
273	597	SSH-Patator	192.168.12.199	10.0.0.8	TCP	0.93	80	HIGH	2026-09-06 05:04:26	NEW
274	598	SSH-Patator	192.168.12.141	10.0.0.18	TCP	0.86	80	HIGH	2026-09-06 05:04:26	NEW
275	599	SSH-Patator	192.168.12.173	10.0.0.16	TCP	0.96	80	HIGH	2026-09-06 05:04:26	NEW
276	600	SSH-Patator	192.168.12.200	10.0.0.10	TCP	0.97	80	HIGH	2026-09-06 05:04:26	NEW
277	601	SSH-Patator	192.168.12.148	10.0.0.9	TCP	0.97	80	HIGH	2026-09-06 05:04:26	NEW
278	602	SSH-Patator	192.168.12.104	10.0.0.13	TCP	0.98	80	HIGH	2026-09-06 05:04:26	NEW
279	603	SSH-Patator	192.168.12.114	10.0.0.8	TCP	0.96	80	HIGH	2026-09-06 05:04:26	NEW
280	604	SSH-Patator	192.168.12.152	10.0.0.7	TCP	0.97	80	HIGH	2026-09-06 05:04:26	NEW
281	605	SSH-Patator	192.168.12.195	10.0.0.17	TCP	1	80	HIGH	2026-09-06 05:04:26	NEW
282	606	SSH-Patator	192.168.12.117	10.0.0.15	TCP	0.88	80	HIGH	2026-09-06 05:04:26	NEW
283	607	SSH-Patator	192.168.12.111	10.0.0.16	TCP	0.91	80	HIGH	2026-09-06 05:04:26	NEW
284	608	SSH-Patator	192.168.12.132	10.0.0.9	TCP	0.99	80	HIGH	2026-09-06 05:04:26	NEW
285	609	SSH-Patator	192.168.12.108	10.0.0.12	TCP	0.98	80	HIGH	2026-09-06 05:04:26	NEW
286	610	SSH-Patator	192.168.12.151	10.0.0.3	TCP	0.91	80	HIGH	2026-09-06 05:04:26	NEW
287	611	SSH-Patator	192.168.12.184	10.0.0.19	TCP	0.95	80	HIGH	2026-09-06 05:04:26	NEW
288	612	SSH-Patator	192.168.12.188	10.0.0.19	TCP	0.98	80	HIGH	2026-09-06 05:04:26	NEW
289	613	SSH-Patator	192.168.12.171	10.0.0.18	TCP	0.92	80	HIGH	2026-09-06 05:04:26	NEW
290	614	SSH-Patator	192.168.12.105	10.0.0.4	TCP	0.99	80	HIGH	2026-09-06 05:04:26	NEW
291	615	SSH-Patator	192.168.12.183	10.0.0.13	TCP	0.92	80	HIGH	2026-09-06 05:04:26	NEW
292	616	SSH-Patator	192.168.12.167	10.0.0.13	TCP	0.81	80	HIGH	2026-09-06 05:04:26	NEW
293	617	SSH-Patator	192.168.12.139	10.0.0.8	TCP	0.99	80	HIGH	2026-09-06 05:04:26	NEW
294	618	SSH-Patator	192.168.12.154	10.0.0.20	TCP	0.98	80	HIGH	2026-09-06 05:04:26	NEW
295	619	SSH-Patator	192.168.12.148	10.0.0.12	TCP	0.69	80	HIGH	2026-09-06 05:04:26	NEW
296	620	SSH-Patator	192.168.12.122	10.0.0.4	TCP	0.89	80	HIGH	2026-09-06 05:04:26	NEW
297	621	SSH-Patator	192.168.12.162	10.0.0.6	TCP	1	80	HIGH	2026-09-06 05:04:26	NEW
298	622	SSH-Patator	192.168.12.171	10.0.0.16	TCP	0.95	80	HIGH	2026-09-06 05:04:26	NEW
299	623	SSH-Patator	192.168.12.113	10.0.0.4	TCP	0.98	80	HIGH	2026-09-06 05:04:26	NEW
300	624	SSH-Patator	192.168.12.188	10.0.0.19	TCP	0.97	80	HIGH	2026-09-06 05:04:26	NEW
301	625	SSH-Patator	192.168.12.135	10.0.0.8	TCP	0.98	80	HIGH	2026-09-06 05:04:26	NEW
302	626	SSH-Patator	192.168.12.178	10.0.0.12	TCP	0.94	80	HIGH	2026-09-06 05:04:27	NEW
303	627	SSH-Patator	192.168.12.194	10.0.0.5	TCP	0.94	80	HIGH	2026-09-06 05:04:27	NEW
304	628	SSH-Patator	192.168.12.171	10.0.0.4	TCP	0.54	80	HIGH	2026-09-06 05:04:27	NEW
305	629	SSH-Patator	192.168.12.190	10.0.0.18	TCP	0.89	80	HIGH	2026-09-06 05:04:27	NEW
306	630	SSH-Patator	192.168.12.198	10.0.0.16	TCP	0.92	80	HIGH	2026-09-06 05:04:27	NEW
307	631	SSH-Patator	192.168.12.175	10.0.0.8	TCP	0.82	80	HIGH	2026-09-06 05:04:27	NEW
308	632	SSH-Patator	192.168.12.161	10.0.0.5	TCP	1	80	HIGH	2026-09-06 05:04:27	NEW
309	633	SSH-Patator	192.168.12.123	10.0.0.15	TCP	0.76	80	HIGH	2026-09-06 05:04:27	NEW
310	634	SSH-Patator	192.168.12.131	10.0.0.15	TCP	0.94	80	HIGH	2026-09-06 05:04:27	NEW
311	635	SSH-Patator	192.168.12.133	10.0.0.8	TCP	0.84	80	HIGH	2026-09-06 05:04:27	NEW
312	636	FTP-Patator	192.168.10.110	10.0.0.9	TCP	0.83	65	MEDIUM	2026-09-06 05:04:49	NEW
313	637	FTP-Patator	192.168.10.111	10.0.0.15	TCP	0.99	65	MEDIUM	2026-09-06 05:04:49	NEW
314	638	FTP-Patator	192.168.10.152	10.0.0.12	TCP	0.97	65	MEDIUM	2026-09-06 05:04:49	NEW
315	639	FTP-Patator	192.168.10.120	10.0.0.6	TCP	0.91	65	MEDIUM	2026-09-06 05:04:49	NEW
316	640	FTP-Patator	192.168.10.171	10.0.0.14	TCP	0.95	65	MEDIUM	2026-09-06 05:04:49	NEW
317	641	FTP-Patator	192.168.10.184	10.0.0.4	TCP	0.98	65	MEDIUM	2026-09-06 05:04:49	NEW
318	642	FTP-Patator	192.168.10.156	10.0.0.2	TCP	0.84	65	MEDIUM	2026-09-06 05:04:49	NEW
319	643	FTP-Patator	192.168.10.144	10.0.0.10	TCP	0.98	65	MEDIUM	2026-09-06 05:04:49	NEW
320	644	FTP-Patator	192.168.10.118	10.0.0.16	TCP	0.99	65	MEDIUM	2026-09-06 05:04:50	NEW
321	645	FTP-Patator	192.168.10.152	10.0.0.2	TCP	0.95	65	MEDIUM	2026-09-06 05:04:50	NEW
322	646	FTP-Patator	192.168.10.197	10.0.0.4	TCP	0.91	65	MEDIUM	2026-09-06 05:04:50	NEW
323	647	FTP-Patator	192.168.10.120	10.0.0.11	TCP	0.97	65	MEDIUM	2026-09-06 05:04:50	NEW
324	648	FTP-Patator	192.168.10.144	10.0.0.5	TCP	1	65	MEDIUM	2026-09-06 05:04:50	NEW
325	649	FTP-Patator	192.168.10.192	10.0.0.11	TCP	0.97	65	MEDIUM	2026-09-06 05:04:50	NEW
326	650	FTP-Patator	192.168.10.183	10.0.0.7	TCP	0.99	65	MEDIUM	2026-09-06 05:04:50	NEW
327	651	FTP-Patator	192.168.10.173	10.0.0.5	TCP	0.97	65	MEDIUM	2026-09-06 05:04:50	NEW
328	652	FTP-Patator	192.168.10.156	10.0.0.5	TCP	0.8	65	MEDIUM	2026-09-06 05:04:50	NEW
329	653	FTP-Patator	192.168.10.126	10.0.0.1	TCP	1	65	MEDIUM	2026-09-06 05:04:50	NEW
330	654	FTP-Patator	192.168.10.121	10.0.0.1	TCP	0.98	65	MEDIUM	2026-09-06 05:04:50	NEW
331	655	FTP-Patator	192.168.10.138	10.0.0.18	TCP	0.85	65	MEDIUM	2026-09-06 05:04:50	NEW
332	656	FTP-Patator	192.168.10.150	10.0.0.11	TCP	0.94	65	MEDIUM	2026-09-06 05:04:50	NEW
333	657	FTP-Patator	192.168.10.138	10.0.0.10	TCP	0.99	65	MEDIUM	2026-09-06 05:04:50	NEW
334	658	FTP-Patator	192.168.10.108	10.0.0.16	TCP	0.98	65	MEDIUM	2026-09-06 05:04:50	NEW
335	659	FTP-Patator	192.168.10.124	10.0.0.2	TCP	0.95	65	MEDIUM	2026-09-06 05:04:50	NEW
336	660	FTP-Patator	192.168.10.132	10.0.0.16	TCP	0.91	65	MEDIUM	2026-09-06 05:04:50	NEW
337	661	FTP-Patator	192.168.10.105	10.0.0.5	TCP	0.94	65	MEDIUM	2026-09-06 05:04:50	NEW
338	662	FTP-Patator	192.168.10.143	10.0.0.13	TCP	0.96	65	MEDIUM	2026-09-06 05:04:50	NEW
339	663	FTP-Patator	192.168.10.170	10.0.0.4	TCP	0.43	65	MEDIUM	2026-09-06 05:04:50	NEW
340	664	FTP-Patator	192.168.10.176	10.0.0.2	TCP	0.81	65	MEDIUM	2026-09-06 05:04:50	NEW
341	665	FTP-Patator	192.168.10.117	10.0.0.16	TCP	0.71	65	MEDIUM	2026-09-06 05:04:50	NEW
342	666	FTP-Patator	192.168.10.121	10.0.0.4	TCP	0.94	65	MEDIUM	2026-09-06 05:04:50	NEW
343	667	FTP-Patator	192.168.10.172	10.0.0.8	TCP	0.97	65	MEDIUM	2026-09-06 05:04:50	NEW
344	668	FTP-Patator	192.168.10.152	10.0.0.16	TCP	0.85	65	MEDIUM	2026-09-06 05:04:50	NEW
345	669	FTP-Patator	192.168.10.118	10.0.0.20	TCP	0.98	65	MEDIUM	2026-09-06 05:04:50	NEW
346	670	FTP-Patator	192.168.10.115	10.0.0.14	TCP	1	65	MEDIUM	2026-09-06 05:04:50	NEW
347	671	FTP-Patator	192.168.10.173	10.0.0.14	TCP	0.99	65	MEDIUM	2026-09-06 05:04:50	NEW
348	672	FTP-Patator	192.168.10.129	10.0.0.6	TCP	0.88	65	MEDIUM	2026-09-06 05:04:50	NEW
349	673	FTP-Patator	192.168.10.146	10.0.0.2	TCP	1	65	MEDIUM	2026-09-06 05:04:50	NEW
350	674	FTP-Patator	192.168.10.145	10.0.0.10	TCP	0.94	65	MEDIUM	2026-09-06 05:04:50	NEW
351	675	FTP-Patator	192.168.10.197	10.0.0.14	TCP	0.94	65	MEDIUM	2026-09-06 05:04:50	NEW
352	676	FTP-Patator	192.168.10.123	10.0.0.19	TCP	0.92	65	MEDIUM	2026-09-06 05:04:50	NEW
353	677	FTP-Patator	192.168.10.104	10.0.0.14	TCP	0.64	65	MEDIUM	2026-09-06 05:04:50	NEW
354	678	DDoS	172.16.9.8	10.0.0.9	TCP	1	95	CRITICAL	2026-09-06 08:57:02	NEW
355	679	DDoS	172.16.88.72	10.0.0.8	TCP	1	95	CRITICAL	2026-09-06 08:57:02	NEW
356	680	FTP-Patator	192.168.10.110	10.0.0.9	TCP	0.83	65	MEDIUM	2026-09-06 08:57:02	NEW
357	682	DDoS	172.16.98.70	10.0.0.20	TCP	1	95	CRITICAL	2026-09-06 08:57:02	NEW
358	684	DDoS	172.16.40.161	10.0.0.8	TCP	1	95	CRITICAL	2026-09-06 08:57:02	NEW
359	692	FTP-Patator	192.168.10.111	10.0.0.15	TCP	0.99	65	MEDIUM	2026-09-06 08:57:02	NEW
360	694	DDoS	172.16.173.221	10.0.0.17	TCP	1	95	CRITICAL	2026-09-06 08:57:02	NEW
361	696	SSH-Patator	192.168.12.133	10.0.0.15	TCP	0.94	80	HIGH	2026-09-06 08:57:02	NEW
362	698	DDoS	172.16.213.71	10.0.0.9	TCP	1	95	CRITICAL	2026-09-06 08:57:02	NEW
363	699	DDoS	172.16.150.142	10.0.0.1	TCP	1	95	CRITICAL	2026-09-06 08:57:02	NEW
364	700	FTP-Patator	192.168.10.152	10.0.0.12	TCP	0.97	65	MEDIUM	2026-09-06 08:57:02	NEW
365	701	FTP-Patator	192.168.10.120	10.0.0.6	TCP	0.91	65	MEDIUM	2026-09-06 08:57:02	NEW
366	706	DDoS	172.16.202.149	10.0.0.13	TCP	1	95	CRITICAL	2026-09-06 08:57:02	NEW
367	707	SSH-Patator	192.168.12.111	10.0.0.6	TCP	0.91	80	HIGH	2026-09-06 08:57:02	NEW
368	709	FTP-Patator	192.168.10.171	10.0.0.14	TCP	0.95	65	MEDIUM	2026-09-06 08:57:02	NEW
369	710	DDoS	172.16.67.193	10.0.0.17	TCP	1	95	CRITICAL	2026-09-06 08:57:02	NEW
370	713	SSH-Patator	192.168.12.128	10.0.0.18	TCP	1	80	HIGH	2026-09-06 08:57:03	NEW
371	714	DDoS	172.16.22.165	10.0.0.15	TCP	1	95	CRITICAL	2026-09-06 08:57:03	NEW
372	716	DDoS	172.16.33.122	10.0.0.1	TCP	1	95	CRITICAL	2026-09-06 08:57:03	NEW
373	718	FTP-Patator	192.168.10.184	10.0.0.4	TCP	0.98	65	MEDIUM	2026-09-06 08:57:03	NEW
374	720	SSH-Patator	192.168.12.143	10.0.0.15	TCP	0.99	80	HIGH	2026-09-06 08:57:03	NEW
375	722	DDoS	172.16.142.136	10.0.0.10	TCP	1	95	CRITICAL	2026-09-06 08:57:03	NEW
376	726	SSH-Patator	192.168.12.199	10.0.0.8	TCP	0.93	80	HIGH	2026-09-06 08:57:03	NEW
377	727	DDoS	172.16.170.21	10.0.0.20	TCP	1	95	CRITICAL	2026-09-06 08:57:03	NEW
378	728	DDoS	172.16.176.60	10.0.0.2	TCP	1	95	CRITICAL	2026-09-06 08:57:03	NEW
379	729	FTP-Patator	192.168.10.156	10.0.0.2	TCP	0.84	65	MEDIUM	2026-09-06 08:57:03	NEW
380	732	SSH-Patator	192.168.12.141	10.0.0.18	TCP	0.86	80	HIGH	2026-09-06 08:57:03	NEW
381	734	DDoS	172.16.216.234	10.0.0.6	TCP	1	95	CRITICAL	2026-09-06 08:57:03	NEW
382	741	DDoS	172.16.234.150	10.0.0.6	TCP	1	95	CRITICAL	2026-09-06 08:57:03	NEW
383	742	FTP-Patator	192.168.10.144	10.0.0.10	TCP	0.98	65	MEDIUM	2026-09-06 08:57:03	NEW
384	743	SSH-Patator	192.168.12.173	10.0.0.16	TCP	0.96	80	HIGH	2026-09-06 08:57:03	NEW
385	744	DDoS	172.16.57.163	10.0.0.2	TCP	1	95	CRITICAL	2026-09-06 08:57:03	NEW
386	745	DDoS	172.16.84.192	10.0.0.15	TCP	1	95	CRITICAL	2026-09-06 08:57:03	NEW
387	746	FTP-Patator	192.168.10.118	10.0.0.16	TCP	0.99	65	MEDIUM	2026-09-06 08:57:03	NEW
388	748	DDoS	172.16.30.36	10.0.0.20	TCP	1	95	CRITICAL	2026-09-06 08:57:03	NEW
389	751	DDoS	172.16.213.196	10.0.0.1	TCP	1	95	CRITICAL	2026-09-06 08:57:03	NEW
390	752	DDoS	172.16.34.4	10.0.0.5	TCP	1	95	CRITICAL	2026-09-06 08:57:03	NEW
391	754	DDoS	172.16.126.183	10.0.0.15	TCP	1	95	CRITICAL	2026-09-06 08:57:03	NEW
392	755	DDoS	172.16.204.180	10.0.0.11	TCP	1	95	CRITICAL	2026-09-06 08:57:03	NEW
393	757	FTP-Patator	192.168.10.152	10.0.0.2	TCP	0.95	65	MEDIUM	2026-09-06 08:57:03	NEW
394	758	DDoS	172.16.30.196	10.0.0.5	TCP	1	95	CRITICAL	2026-09-06 08:57:03	NEW
395	759	DDoS	172.16.223.37	10.0.0.6	TCP	1	95	CRITICAL	2026-09-06 08:57:03	NEW
396	761	DDoS	172.16.111.29	10.0.0.20	TCP	1	95	CRITICAL	2026-09-06 08:57:04	NEW
397	766	FTP-Patator	192.168.10.197	10.0.0.4	TCP	0.91	65	MEDIUM	2026-09-06 08:57:04	NEW
398	767	DDoS	172.16.113.18	10.0.0.19	TCP	1	95	CRITICAL	2026-09-06 08:57:04	NEW
399	773	FTP-Patator	192.168.10.120	10.0.0.11	TCP	0.97	65	MEDIUM	2026-09-06 08:57:04	NEW
400	774	SSH-Patator	192.168.12.200	10.0.0.10	TCP	0.97	80	HIGH	2026-09-06 08:57:04	NEW
401	778	DDoS	172.16.199.74	10.0.0.3	TCP	1	95	CRITICAL	2026-09-06 08:57:04	NEW
402	781	DDoS	172.16.209.165	10.0.0.19	TCP	1	95	CRITICAL	2026-09-06 08:57:04	NEW
403	782	DDoS	172.16.239.80	10.0.0.2	TCP	1	95	CRITICAL	2026-09-06 08:57:04	NEW
404	784	DDoS	172.16.83.27	10.0.0.3	TCP	1	95	CRITICAL	2026-09-06 08:57:04	NEW
405	785	DDoS	172.16.20.172	10.0.0.15	TCP	1	95	CRITICAL	2026-09-06 08:57:04	NEW
406	786	DDoS	172.16.99.244	10.0.0.15	TCP	1	95	CRITICAL	2026-09-06 08:57:04	NEW
407	787	DDoS	172.16.246.30	10.0.0.5	TCP	1	95	CRITICAL	2026-09-06 08:57:04	NEW
408	792	FTP-Patator	192.168.10.144	10.0.0.5	TCP	1	65	MEDIUM	2026-09-06 08:57:04	NEW
409	799	DDoS	172.16.19.99	10.0.0.2	TCP	1	95	CRITICAL	2026-09-06 08:57:04	NEW
410	802	FTP-Patator	192.168.10.192	10.0.0.11	TCP	0.97	65	MEDIUM	2026-09-06 08:57:04	NEW
411	806	SSH-Patator	192.168.12.148	10.0.0.9	TCP	0.97	80	HIGH	2026-09-06 08:57:04	NEW
412	809	FTP-Patator	192.168.10.183	10.0.0.7	TCP	0.99	65	MEDIUM	2026-09-06 08:57:04	NEW
413	810	SSH-Patator	192.168.12.104	10.0.0.13	TCP	0.98	80	HIGH	2026-09-06 08:57:04	NEW
414	812	DDoS	172.16.103.172	10.0.0.20	TCP	1	95	CRITICAL	2026-09-06 08:57:04	NEW
415	814	DDoS	172.16.246.35	10.0.0.10	TCP	1	95	CRITICAL	2026-09-06 08:57:04	NEW
416	821	DDoS	172.16.154.173	10.0.0.1	TCP	1	95	CRITICAL	2026-09-06 08:57:04	NEW
417	822	FTP-Patator	192.168.10.173	10.0.0.5	TCP	0.97	65	MEDIUM	2026-09-06 08:57:05	NEW
418	823	DDoS	172.16.242.165	10.0.0.6	TCP	1	95	CRITICAL	2026-09-06 08:57:05	NEW
419	826	DDoS	172.16.55.240	10.0.0.18	TCP	1	95	CRITICAL	2026-09-06 08:57:05	NEW
420	835	DDoS	172.16.151.37	10.0.0.18	TCP	1	95	CRITICAL	2026-09-06 08:57:05	NEW
421	836	DDoS	172.16.14.26	10.0.0.11	TCP	1	95	CRITICAL	2026-09-06 08:57:05	NEW
422	837	DDoS	172.16.175.150	10.0.0.15	TCP	1	95	CRITICAL	2026-09-06 08:57:05	NEW
423	840	DDoS	172.16.69.78	10.0.0.8	TCP	1	95	CRITICAL	2026-09-06 08:57:05	NEW
424	841	DDoS	172.16.28.35	10.0.0.9	TCP	1	95	CRITICAL	2026-09-06 08:57:05	NEW
425	843	SSH-Patator	192.168.12.114	10.0.0.8	TCP	0.96	80	HIGH	2026-09-06 08:57:05	NEW
426	844	SSH-Patator	192.168.12.152	10.0.0.7	TCP	0.97	80	HIGH	2026-09-06 08:57:05	NEW
427	846	DDoS	172.16.248.204	10.0.0.20	TCP	1	95	CRITICAL	2026-09-06 08:57:05	NEW
428	847	DDoS	172.16.7.124	10.0.0.8	TCP	1	95	CRITICAL	2026-09-06 08:57:05	NEW
429	852	DDoS	172.16.31.62	10.0.0.10	TCP	1	95	CRITICAL	2026-09-06 08:57:05	NEW
430	856	DDoS	172.16.113.222	10.0.0.8	TCP	1	95	CRITICAL	2026-09-06 08:57:05	NEW
431	863	DDoS	172.16.123.20	10.0.0.8	TCP	1	95	CRITICAL	2026-09-06 08:57:05	NEW
432	865	FTP-Patator	192.168.10.156	10.0.0.5	TCP	0.8	65	MEDIUM	2026-09-06 08:57:05	NEW
433	867	DDoS	172.16.133.156	10.0.0.20	TCP	1	95	CRITICAL	2026-09-06 08:57:05	NEW
434	869	DDoS	172.16.237.16	10.0.0.3	TCP	1	95	CRITICAL	2026-09-06 08:57:05	NEW
435	870	DDoS	172.16.138.84	10.0.0.20	TCP	1	95	CRITICAL	2026-09-06 08:57:05	NEW
436	872	DDoS	172.16.198.231	10.0.0.9	TCP	1	95	CRITICAL	2026-09-06 08:57:05	NEW
437	873	DDoS	172.16.41.66	10.0.0.15	TCP	1	95	CRITICAL	2026-09-06 08:57:05	NEW
438	877	FTP-Patator	192.168.10.126	10.0.0.1	TCP	1	65	MEDIUM	2026-09-06 08:57:05	NEW
439	878	SSH-Patator	192.168.12.195	10.0.0.17	TCP	1	80	HIGH	2026-09-06 08:57:05	NEW
440	882	SSH-Patator	192.168.12.117	10.0.0.15	TCP	0.88	80	HIGH	2026-09-06 08:57:06	NEW
441	883	DDoS	172.16.51.232	10.0.0.3	TCP	1	95	CRITICAL	2026-09-06 08:57:06	NEW
442	888	DDoS	172.16.152.82	10.0.0.8	TCP	1	95	CRITICAL	2026-09-06 08:57:06	NEW
443	889	SSH-Patator	192.168.12.111	10.0.0.16	TCP	0.91	80	HIGH	2026-09-06 08:57:06	NEW
444	892	DDoS	172.16.164.145	10.0.0.13	TCP	1	95	CRITICAL	2026-09-06 08:57:06	NEW
445	893	DDoS	172.16.3.68	10.0.0.3	TCP	1	95	CRITICAL	2026-09-06 08:57:06	NEW
446	895	FTP-Patator	192.168.10.121	10.0.0.1	TCP	0.98	65	MEDIUM	2026-09-06 08:57:06	NEW
447	900	FTP-Patator	192.168.10.138	10.0.0.18	TCP	0.85	65	MEDIUM	2026-09-06 08:57:06	NEW
448	901	DDoS	172.16.33.11	10.0.0.5	TCP	1	95	CRITICAL	2026-09-06 08:57:06	NEW
449	902	FTP-Patator	192.168.10.150	10.0.0.11	TCP	0.94	65	MEDIUM	2026-09-06 08:57:06	NEW
450	903	DDoS	172.16.237.28	10.0.0.17	TCP	1	95	CRITICAL	2026-09-06 08:57:06	NEW
451	904	DDoS	172.16.10.102	10.0.0.20	TCP	1	95	CRITICAL	2026-09-06 08:57:06	NEW
452	905	FTP-Patator	192.168.10.138	10.0.0.10	TCP	0.99	65	MEDIUM	2026-09-06 08:57:06	NEW
453	906	FTP-Patator	192.168.10.108	10.0.0.16	TCP	0.98	65	MEDIUM	2026-09-06 08:57:06	NEW
454	910	SSH-Patator	192.168.12.132	10.0.0.9	TCP	0.99	80	HIGH	2026-09-06 08:57:06	NEW
455	911	SSH-Patator	192.168.12.108	10.0.0.12	TCP	0.98	80	HIGH	2026-09-06 08:57:06	NEW
456	912	DDoS	172.16.175.36	10.0.0.5	TCP	1	95	CRITICAL	2026-09-06 08:57:06	NEW
457	913	DDoS	172.16.130.77	10.0.0.7	TCP	1	95	CRITICAL	2026-09-06 08:57:06	NEW
458	914	DDoS	172.16.58.191	10.0.0.6	TCP	1	95	CRITICAL	2026-09-06 08:57:06	NEW
459	915	FTP-Patator	192.168.10.124	10.0.0.2	TCP	0.95	65	MEDIUM	2026-09-06 08:57:06	NEW
460	920	DDoS	172.16.151.130	10.0.0.13	TCP	1	95	CRITICAL	2026-09-06 08:57:06	NEW
461	921	DDoS	172.16.177.30	10.0.0.2	TCP	0.96	95	CRITICAL	2026-09-06 08:57:06	NEW
462	922	DDoS	172.16.108.213	10.0.0.1	TCP	1	95	CRITICAL	2026-09-06 08:57:06	NEW
463	924	FTP-Patator	192.168.10.132	10.0.0.16	TCP	0.91	65	MEDIUM	2026-09-06 08:57:06	NEW
464	926	SSH-Patator	192.168.12.151	10.0.0.3	TCP	0.91	80	HIGH	2026-09-06 08:57:06	NEW
465	927	DDoS	172.16.234.152	10.0.0.5	TCP	1	95	CRITICAL	2026-09-06 08:57:06	NEW
466	928	FTP-Patator	192.168.10.105	10.0.0.5	TCP	0.94	65	MEDIUM	2026-09-06 08:57:06	NEW
467	933	DDoS	172.16.88.91	10.0.0.12	TCP	1	95	CRITICAL	2026-09-06 08:57:07	NEW
468	935	SSH-Patator	192.168.12.184	10.0.0.19	TCP	0.95	80	HIGH	2026-09-06 08:57:07	NEW
469	936	SSH-Patator	192.168.12.188	10.0.0.19	TCP	0.98	80	HIGH	2026-09-06 08:57:07	NEW
470	937	FTP-Patator	192.168.10.143	10.0.0.13	TCP	0.96	65	MEDIUM	2026-09-06 08:57:07	NEW
471	939	SSH-Patator	192.168.12.171	10.0.0.18	TCP	0.92	80	HIGH	2026-09-06 08:57:07	NEW
472	941	DDoS	172.16.61.131	10.0.0.12	TCP	1	95	CRITICAL	2026-09-06 08:57:07	NEW
473	945	DDoS	172.16.170.85	10.0.0.14	TCP	1	95	CRITICAL	2026-09-06 08:57:07	NEW
474	946	SSH-Patator	192.168.12.105	10.0.0.4	TCP	0.99	80	HIGH	2026-09-06 08:57:07	NEW
475	948	DDoS	172.16.192.176	10.0.0.14	TCP	1	95	CRITICAL	2026-09-06 08:57:07	NEW
476	949	DDoS	172.16.162.104	10.0.0.3	TCP	1	95	CRITICAL	2026-09-06 08:57:07	NEW
477	950	DDoS	172.16.202.176	10.0.0.19	TCP	1	95	CRITICAL	2026-09-06 08:57:07	NEW
478	952	FTP-Patator	192.168.10.170	10.0.0.4	TCP	0.43	65	MEDIUM	2026-09-06 08:57:07	NEW
479	954	DDoS	172.16.172.168	10.0.0.4	TCP	1	95	CRITICAL	2026-09-06 08:57:07	NEW
480	955	DDoS	172.16.2.81	10.0.0.19	TCP	1	95	CRITICAL	2026-09-06 08:57:07	NEW
481	956	DDoS	172.16.45.166	10.0.0.16	TCP	1	95	CRITICAL	2026-09-06 08:57:07	NEW
482	960	SSH-Patator	192.168.12.183	10.0.0.13	TCP	0.92	80	HIGH	2026-09-06 08:57:07	NEW
483	962	DDoS	172.16.39.48	10.0.0.5	TCP	1	95	CRITICAL	2026-09-06 08:57:07	NEW
484	964	FTP-Patator	192.168.10.176	10.0.0.2	TCP	0.81	65	MEDIUM	2026-09-06 08:57:07	NEW
485	965	DDoS	172.16.43.186	10.0.0.16	TCP	1	95	CRITICAL	2026-09-06 08:57:07	NEW
486	968	DDoS	172.16.73.154	10.0.0.19	TCP	1	95	CRITICAL	2026-09-06 08:57:07	NEW
487	971	DDoS	172.16.42.100	10.0.0.6	TCP	1	95	CRITICAL	2026-09-06 08:57:07	NEW
488	973	DDoS	172.16.173.10	10.0.0.17	TCP	1	95	CRITICAL	2026-09-06 08:57:07	NEW
489	979	DDoS	172.16.218.124	10.0.0.4	TCP	1	95	CRITICAL	2026-09-06 08:57:07	NEW
490	980	SSH-Patator	192.168.12.167	10.0.0.13	TCP	0.81	80	HIGH	2026-09-06 08:57:07	NEW
491	981	DDoS	172.16.173.54	10.0.0.4	TCP	1	95	CRITICAL	2026-09-06 08:57:07	NEW
492	983	DDoS	172.16.38.205	10.0.0.4	TCP	1	95	CRITICAL	2026-09-06 08:57:07	NEW
493	984	DDoS	172.16.26.177	10.0.0.11	TCP	1	95	CRITICAL	2026-09-06 08:57:07	NEW
494	985	DDoS	172.16.106.32	10.0.0.12	TCP	1	95	CRITICAL	2026-09-06 08:57:07	NEW
495	989	DDoS	172.16.59.64	10.0.0.4	TCP	1	95	CRITICAL	2026-09-06 08:57:08	NEW
496	990	FTP-Patator	192.168.10.117	10.0.0.16	TCP	0.71	65	MEDIUM	2026-09-06 08:57:08	NEW
497	993	DDoS	172.16.73.167	10.0.0.13	TCP	1	95	CRITICAL	2026-09-06 08:57:08	NEW
498	998	FTP-Patator	192.168.10.121	10.0.0.4	TCP	0.94	65	MEDIUM	2026-09-06 08:57:08	NEW
499	999	DDoS	172.16.176.159	10.0.0.20	TCP	1	95	CRITICAL	2026-09-06 08:57:08	NEW
500	1003	DDoS	172.16.134.169	10.0.0.20	TCP	1	95	CRITICAL	2026-09-06 08:57:08	NEW
501	1008	DDoS	172.16.93.247	10.0.0.11	TCP	1	95	CRITICAL	2026-09-06 08:57:08	NEW
502	1010	FTP-Patator	192.168.10.172	10.0.0.8	TCP	0.97	65	MEDIUM	2026-09-06 08:57:08	NEW
503	1011	DDoS	172.16.200.15	10.0.0.4	TCP	1	95	CRITICAL	2026-09-06 08:57:08	NEW
504	1012	DDoS	172.16.79.135	10.0.0.20	TCP	0.96	95	CRITICAL	2026-09-06 08:57:08	NEW
505	1014	DDoS	172.16.124.144	10.0.0.13	TCP	1	95	CRITICAL	2026-09-06 08:57:08	NEW
506	1017	DDoS	172.16.121.6	10.0.0.10	TCP	1	95	CRITICAL	2026-09-06 08:57:08	NEW
507	1021	DDoS	172.16.242.143	10.0.0.17	TCP	1	95	CRITICAL	2026-09-06 08:57:08	NEW
508	1022	SSH-Patator	192.168.12.139	10.0.0.8	TCP	0.99	80	HIGH	2026-09-06 08:57:08	NEW
509	1023	DDoS	172.16.168.239	10.0.0.5	TCP	1	95	CRITICAL	2026-09-06 08:57:08	NEW
510	1026	FTP-Patator	192.168.10.152	10.0.0.16	TCP	0.85	65	MEDIUM	2026-09-06 08:57:08	NEW
511	1027	SSH-Patator	192.168.12.154	10.0.0.20	TCP	0.98	80	HIGH	2026-09-06 08:57:08	NEW
512	1028	DDoS	172.16.117.212	10.0.0.17	TCP	1	95	CRITICAL	2026-09-06 08:57:08	NEW
513	1029	DDoS	172.16.43.109	10.0.0.7	TCP	1	95	CRITICAL	2026-09-06 08:57:08	NEW
514	1030	DDoS	172.16.83.116	10.0.0.6	TCP	1	95	CRITICAL	2026-09-06 08:57:08	NEW
515	1031	DDoS	172.16.22.135	10.0.0.6	TCP	1	95	CRITICAL	2026-09-06 08:57:08	NEW
516	1032	DDoS	172.16.79.80	10.0.0.5	TCP	1	95	CRITICAL	2026-09-06 08:57:08	NEW
517	1033	DDoS	172.16.56.151	10.0.0.15	TCP	1	95	CRITICAL	2026-09-06 08:57:08	NEW
518	1034	FTP-Patator	192.168.10.118	10.0.0.20	TCP	0.98	65	MEDIUM	2026-09-06 08:57:08	NEW
519	1036	FTP-Patator	192.168.10.115	10.0.0.14	TCP	1	65	MEDIUM	2026-09-06 08:57:08	NEW
520	1039	DDoS	172.16.164.52	10.0.0.14	TCP	1	95	CRITICAL	2026-09-06 08:57:09	NEW
521	1041	DDoS	172.16.214.134	10.0.0.5	TCP	1	95	CRITICAL	2026-09-06 08:57:09	NEW
522	1042	SSH-Patator	192.168.12.148	10.0.0.12	TCP	0.69	80	HIGH	2026-09-06 08:57:09	NEW
523	1043	DDoS	172.16.96.116	10.0.0.11	TCP	1	95	CRITICAL	2026-09-06 08:57:09	NEW
524	1045	DDoS	172.16.80.239	10.0.0.7	TCP	1	95	CRITICAL	2026-09-06 08:57:09	NEW
525	1047	DDoS	172.16.147.63	10.0.0.7	TCP	1	95	CRITICAL	2026-09-06 08:57:09	NEW
526	1048	SSH-Patator	192.168.12.122	10.0.0.4	TCP	0.89	80	HIGH	2026-09-06 08:57:09	NEW
527	1049	DDoS	172.16.25.117	10.0.0.3	TCP	1	95	CRITICAL	2026-09-06 08:57:09	NEW
528	1050	SSH-Patator	192.168.12.162	10.0.0.6	TCP	1	80	HIGH	2026-09-06 08:57:09	NEW
529	1051	DDoS	172.16.143.167	10.0.0.19	TCP	1	95	CRITICAL	2026-09-06 08:57:09	NEW
530	1053	SSH-Patator	192.168.12.171	10.0.0.16	TCP	0.95	80	HIGH	2026-09-06 08:57:09	NEW
531	1054	DDoS	172.16.210.36	10.0.0.13	TCP	1	95	CRITICAL	2026-09-06 08:57:09	NEW
532	1055	DDoS	172.16.184.252	10.0.0.7	TCP	1	95	CRITICAL	2026-09-06 08:57:09	NEW
533	1061	DDoS	172.16.232.88	10.0.0.3	TCP	1	95	CRITICAL	2026-09-06 08:57:09	NEW
534	1063	DDoS	172.16.34.158	10.0.0.10	TCP	1	95	CRITICAL	2026-09-06 08:57:09	NEW
535	1064	DDoS	172.16.47.205	10.0.0.15	TCP	1	95	CRITICAL	2026-09-06 08:57:09	NEW
536	1065	FTP-Patator	192.168.10.173	10.0.0.14	TCP	0.99	65	MEDIUM	2026-09-06 08:57:09	NEW
537	1067	DDoS	172.16.70.69	10.0.0.4	TCP	1	95	CRITICAL	2026-09-06 08:57:09	NEW
538	1068	DDoS	172.16.173.3	10.0.0.7	TCP	1	95	CRITICAL	2026-09-06 08:57:09	NEW
539	1069	DDoS	172.16.182.246	10.0.0.7	TCP	0.99	95	CRITICAL	2026-09-06 08:57:09	NEW
540	1070	DDoS	172.16.170.240	10.0.0.6	TCP	0.99	95	CRITICAL	2026-09-06 08:57:09	NEW
541	1071	DDoS	172.16.86.16	10.0.0.6	TCP	1	95	CRITICAL	2026-09-06 08:57:09	NEW
542	1079	SSH-Patator	192.168.12.113	10.0.0.4	TCP	0.98	80	HIGH	2026-09-06 08:57:09	NEW
543	1082	SSH-Patator	192.168.12.188	10.0.0.19	TCP	0.97	80	HIGH	2026-09-06 08:57:10	NEW
544	1083	DDoS	172.16.108.2	10.0.0.20	TCP	1	95	CRITICAL	2026-09-06 08:57:10	NEW
545	1084	SSH-Patator	192.168.12.135	10.0.0.8	TCP	0.98	80	HIGH	2026-09-06 08:57:10	NEW
546	1085	SSH-Patator	192.168.12.178	10.0.0.12	TCP	0.94	80	HIGH	2026-09-06 08:57:10	NEW
547	1089	FTP-Patator	192.168.10.129	10.0.0.6	TCP	0.88	65	MEDIUM	2026-09-06 08:57:10	NEW
548	1093	DDoS	172.16.229.177	10.0.0.15	TCP	1	95	CRITICAL	2026-09-06 08:57:10	NEW
549	1094	FTP-Patator	192.168.10.146	10.0.0.2	TCP	1	65	MEDIUM	2026-09-06 08:57:10	NEW
550	1099	DDoS	172.16.78.146	10.0.0.16	TCP	1	95	CRITICAL	2026-09-06 08:57:10	NEW
551	1100	DDoS	172.16.47.250	10.0.0.5	TCP	1	95	CRITICAL	2026-09-06 08:57:10	NEW
552	1102	SSH-Patator	192.168.12.194	10.0.0.5	TCP	0.94	80	HIGH	2026-09-06 08:57:10	NEW
553	1103	DDoS	172.16.231.11	10.0.0.5	TCP	1	95	CRITICAL	2026-09-06 08:57:10	NEW
554	1108	DDoS	172.16.7.203	10.0.0.10	TCP	1	95	CRITICAL	2026-09-06 08:57:10	NEW
555	1112	FTP-Patator	192.168.10.145	10.0.0.10	TCP	0.94	65	MEDIUM	2026-09-06 08:57:10	NEW
556	1113	SSH-Patator	192.168.12.171	10.0.0.4	TCP	0.54	80	HIGH	2026-09-06 08:57:10	NEW
557	1115	DDoS	172.16.5.199	10.0.0.5	TCP	1	95	CRITICAL	2026-09-06 08:57:10	NEW
558	1118	SSH-Patator	192.168.12.190	10.0.0.18	TCP	0.89	80	HIGH	2026-09-06 08:57:10	NEW
559	1119	FTP-Patator	192.168.10.197	10.0.0.14	TCP	0.94	65	MEDIUM	2026-09-06 08:57:10	NEW
560	1122	DDoS	172.16.60.215	10.0.0.6	TCP	1	95	CRITICAL	2026-09-06 08:57:10	NEW
561	1123	SSH-Patator	192.168.12.198	10.0.0.16	TCP	0.92	80	HIGH	2026-09-06 08:57:10	NEW
562	1127	DDoS	172.16.101.68	10.0.0.18	TCP	1	95	CRITICAL	2026-09-06 08:57:11	NEW
563	1132	SSH-Patator	192.168.12.175	10.0.0.8	TCP	0.82	80	HIGH	2026-09-06 08:57:11	NEW
564	1141	DDoS	172.16.164.246	10.0.0.2	TCP	1	95	CRITICAL	2026-09-06 08:57:11	NEW
565	1144	DDoS	172.16.1.103	10.0.0.1	TCP	1	95	CRITICAL	2026-09-06 08:57:11	NEW
566	1145	SSH-Patator	192.168.12.161	10.0.0.5	TCP	1	80	HIGH	2026-09-06 08:57:11	NEW
567	1150	DDoS	172.16.233.91	10.0.0.3	TCP	1	95	CRITICAL	2026-09-06 08:57:11	NEW
568	1153	SSH-Patator	192.168.12.123	10.0.0.15	TCP	0.76	80	HIGH	2026-09-06 08:57:11	NEW
569	1155	FTP-Patator	192.168.10.123	10.0.0.19	TCP	0.92	65	MEDIUM	2026-09-06 08:57:11	NEW
570	1156	DDoS	172.16.21.118	10.0.0.4	TCP	1	95	CRITICAL	2026-09-06 08:57:11	NEW
571	1157	DDoS	172.16.221.13	10.0.0.11	TCP	1	95	CRITICAL	2026-09-06 08:57:11	NEW
572	1160	DDoS	172.16.132.88	10.0.0.12	TCP	1	95	CRITICAL	2026-09-06 08:57:11	NEW
573	1163	DDoS	172.16.151.186	10.0.0.13	TCP	1	95	CRITICAL	2026-09-06 08:57:11	NEW
574	1165	DDoS	172.16.206.78	10.0.0.20	TCP	1	95	CRITICAL	2026-09-06 08:57:11	NEW
575	1167	SSH-Patator	192.168.12.131	10.0.0.15	TCP	0.94	80	HIGH	2026-09-06 08:57:11	NEW
576	1168	FTP-Patator	192.168.10.104	10.0.0.14	TCP	0.64	65	MEDIUM	2026-09-06 08:57:11	NEW
577	1171	DDoS	172.16.171.124	10.0.0.16	TCP	1	95	CRITICAL	2026-09-06 08:57:11	NEW
578	1172	SSH-Patator	192.168.12.133	10.0.0.8	TCP	0.84	80	HIGH	2026-09-06 08:57:11	NEW
579	1177	DDoS	172.16.114.38	10.0.0.14	TCP	1	95	CRITICAL	2026-09-06 08:57:11	NEW
580	1178	DDoS	172.16.9.8	10.0.0.9	TCP	1	95	CRITICAL	2026-09-06 12:49:53.900352	NEW
581	1179	DDoS	172.16.88.72	10.0.0.8	TCP	1	95	CRITICAL	2026-09-06 12:49:53.907298	NEW
582	1180	DDoS	172.16.98.70	10.0.0.20	TCP	1	95	CRITICAL	2026-09-06 12:49:53.911487	NEW
583	1181	DDoS	172.16.40.161	10.0.0.8	TCP	1	95	CRITICAL	2026-09-06 12:49:53.915908	NEW
584	1182	DDoS	172.16.173.221	10.0.0.17	TCP	1	95	CRITICAL	2026-09-06 12:49:53.920741	NEW
585	1183	DDoS	172.16.213.71	10.0.0.9	TCP	1	95	CRITICAL	2026-09-06 12:49:53.925464	NEW
586	1184	DDoS	172.16.150.142	10.0.0.1	TCP	1	95	CRITICAL	2026-09-06 12:49:53.929458	NEW
587	1185	DDoS	172.16.202.149	10.0.0.13	TCP	1	95	CRITICAL	2026-09-06 12:49:53.933381	NEW
588	1186	DDoS	172.16.67.193	10.0.0.17	TCP	1	95	CRITICAL	2026-09-06 12:49:53.937922	NEW
589	1187	DDoS	172.16.22.165	10.0.0.15	TCP	1	95	CRITICAL	2026-09-06 12:49:53.942714	NEW
590	1188	DDoS	172.16.33.122	10.0.0.1	TCP	1	95	CRITICAL	2026-09-06 12:49:53.947841	NEW
591	1189	DDoS	172.16.142.136	10.0.0.10	TCP	1	95	CRITICAL	2026-09-06 12:49:53.953281	NEW
592	1190	DDoS	172.16.170.21	10.0.0.20	TCP	1	95	CRITICAL	2026-09-06 12:49:53.957941	NEW
593	1191	DDoS	172.16.176.60	10.0.0.2	TCP	1	95	CRITICAL	2026-09-06 12:49:53.963177	NEW
594	1192	DDoS	172.16.216.234	10.0.0.6	TCP	1	95	CRITICAL	2026-09-06 12:49:53.968127	NEW
595	1193	DDoS	172.16.234.150	10.0.0.6	TCP	1	95	CRITICAL	2026-09-06 12:49:53.973172	NEW
596	1194	DDoS	172.16.57.163	10.0.0.2	TCP	1	95	CRITICAL	2026-09-06 12:49:53.97834	NEW
597	1195	DDoS	172.16.84.192	10.0.0.15	TCP	1	95	CRITICAL	2026-09-06 12:49:53.983155	NEW
598	1196	DDoS	172.16.30.36	10.0.0.20	TCP	1	95	CRITICAL	2026-09-06 12:49:53.98776	NEW
599	1197	DDoS	172.16.213.196	10.0.0.1	TCP	1	95	CRITICAL	2026-09-06 12:49:53.992592	NEW
600	1198	DDoS	172.16.34.4	10.0.0.5	TCP	1	95	CRITICAL	2026-09-06 12:49:53.997211	NEW
601	1199	DDoS	172.16.126.183	10.0.0.15	TCP	1	95	CRITICAL	2026-09-06 12:49:54.001437	NEW
602	1200	DDoS	172.16.204.180	10.0.0.11	TCP	1	95	CRITICAL	2026-09-06 12:49:54.0059	NEW
603	1201	DDoS	172.16.30.196	10.0.0.5	TCP	1	95	CRITICAL	2026-09-06 12:49:54.010701	NEW
604	1202	DDoS	172.16.223.37	10.0.0.6	TCP	1	95	CRITICAL	2026-09-06 12:49:54.014472	NEW
605	1203	DDoS	172.16.111.29	10.0.0.20	TCP	1	95	CRITICAL	2026-09-06 12:49:54.018652	NEW
606	1204	DDoS	172.16.113.18	10.0.0.19	TCP	1	95	CRITICAL	2026-09-06 12:49:54.022706	NEW
607	1205	DDoS	172.16.199.74	10.0.0.3	TCP	1	95	CRITICAL	2026-09-06 12:49:54.027129	NEW
608	1206	DDoS	172.16.209.165	10.0.0.19	TCP	1	95	CRITICAL	2026-09-06 12:49:54.031731	NEW
609	1207	DDoS	172.16.239.80	10.0.0.2	TCP	1	95	CRITICAL	2026-09-06 12:49:54.036201	NEW
610	1208	DDoS	172.16.83.27	10.0.0.3	TCP	1	95	CRITICAL	2026-09-06 12:49:54.040436	NEW
611	1209	DDoS	172.16.20.172	10.0.0.15	TCP	1	95	CRITICAL	2026-09-06 12:49:54.045297	NEW
612	1210	DDoS	172.16.99.244	10.0.0.15	TCP	1	95	CRITICAL	2026-09-06 12:49:54.049468	NEW
613	1211	DDoS	172.16.246.30	10.0.0.5	TCP	1	95	CRITICAL	2026-09-06 12:49:54.053743	NEW
614	1212	DDoS	172.16.19.99	10.0.0.2	TCP	1	95	CRITICAL	2026-09-06 12:49:54.058072	NEW
615	1213	DDoS	172.16.103.172	10.0.0.20	TCP	1	95	CRITICAL	2026-09-06 12:49:54.062124	NEW
616	1214	DDoS	172.16.246.35	10.0.0.10	TCP	1	95	CRITICAL	2026-09-06 12:49:54.066855	NEW
617	1215	DDoS	172.16.154.173	10.0.0.1	TCP	1	95	CRITICAL	2026-09-06 12:49:54.071033	NEW
618	1216	DDoS	172.16.242.165	10.0.0.6	TCP	1	95	CRITICAL	2026-09-06 12:49:54.07541	NEW
619	1217	DDoS	172.16.55.240	10.0.0.18	TCP	1	95	CRITICAL	2026-09-06 12:49:54.079469	NEW
620	1218	DDoS	172.16.151.37	10.0.0.18	TCP	1	95	CRITICAL	2026-09-06 12:49:54.08327	NEW
621	1219	DDoS	172.16.14.26	10.0.0.11	TCP	1	95	CRITICAL	2026-09-06 12:49:54.087122	NEW
622	1220	DDoS	172.16.175.150	10.0.0.15	TCP	1	95	CRITICAL	2026-09-06 12:49:54.090383	NEW
623	1221	DDoS	172.16.69.78	10.0.0.8	TCP	1	95	CRITICAL	2026-09-06 12:49:54.094042	NEW
624	1222	DDoS	172.16.28.35	10.0.0.9	TCP	1	95	CRITICAL	2026-09-06 12:49:54.097424	NEW
625	1223	DDoS	172.16.248.204	10.0.0.20	TCP	1	95	CRITICAL	2026-09-06 12:49:54.100904	NEW
626	1224	DDoS	172.16.7.124	10.0.0.8	TCP	1	95	CRITICAL	2026-09-06 12:49:54.104613	NEW
627	1225	DDoS	172.16.31.62	10.0.0.10	TCP	1	95	CRITICAL	2026-09-06 12:49:54.107947	NEW
628	1226	DDoS	172.16.113.222	10.0.0.8	TCP	1	95	CRITICAL	2026-09-06 12:49:54.111044	NEW
629	1227	DDoS	172.16.123.20	10.0.0.8	TCP	1	95	CRITICAL	2026-09-06 12:49:54.115521	NEW
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password_hash, role, status, created_at, last_login) FROM stdin;
2	Security Analyst	analyst@netshield.ai	scrypt:32768:8:1$bS8wK0tdCfAJAH7E$859141465e3bfeba438c73deb1d18e8b61bcc9092ed40b8952c8af9d1a42a21e073ecb2d00ebaadb74426c2737caed233d23ac67e9efd51474848fdbceaa817d	SECURITY_ANALYST	ACTIVE	2026-09-05 14:34:55	\N
3	nandini	nandini67@gmail.com	scrypt:32768:8:1$FOR5rgcvAYHcaAoV$72fcbee2890a38943587cb373005f31e6a10e8a5d4e488094afdf37e6a8add9415ce91b7ab678bb29b9c49578cc6ae0ffff2623ccd10a41b0a93785070907737	SECURITY_ANALYST	ACTIVE	2026-09-05 15:12:12	2026-09-06 11:04:05.258311
1	System Admin	admin@netshield.ai	scrypt:32768:8:1$QdWHcvJFjnod7ZEM$26a186315f9236b6d1387dfd68924f7eff9463be7a390dc1fc86e6b683ef52721f6c292f580390fc2f4ae200262e965d0606b2b8838af120b575da93f02996b7	ADMIN	ACTIVE	2026-09-05 14:34:55	2026-09-06 12:54:58.662854
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 40, true);


--
-- Name: datasets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.datasets_id_seq', 7, true);


--
-- Name: incidents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.incidents_id_seq', 5, true);


--
-- Name: network_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.network_logs_id_seq', 1, false);


--
-- Name: network_traffic_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.network_traffic_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 18, true);


--
-- Name: predictions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.predictions_id_seq', 1227, true);


--
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reports_id_seq', 2, true);


--
-- Name: security_alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.security_alerts_id_seq', 6, true);


--
-- Name: threat_intelligence_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.threat_intelligence_id_seq', 4, true);


--
-- Name: threats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.threats_id_seq', 629, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: datasets datasets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.datasets
    ADD CONSTRAINT datasets_pkey PRIMARY KEY (id);


--
-- Name: incidents incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_pkey PRIMARY KEY (id);


--
-- Name: network_logs network_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_logs
    ADD CONSTRAINT network_logs_pkey PRIMARY KEY (id);


--
-- Name: network_traffic network_traffic_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.network_traffic
    ADD CONSTRAINT network_traffic_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: predictions predictions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictions
    ADD CONSTRAINT predictions_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: security_alerts security_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_alerts
    ADD CONSTRAINT security_alerts_pkey PRIMARY KEY (id);


--
-- Name: threat_intelligence threat_intelligence_attack_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.threat_intelligence
    ADD CONSTRAINT threat_intelligence_attack_type_key UNIQUE (attack_type);


--
-- Name: threat_intelligence threat_intelligence_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.threat_intelligence
    ADD CONSTRAINT threat_intelligence_pkey PRIMARY KEY (id);


--
-- Name: threats threats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.threats
    ADD CONSTRAINT threats_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_alerts_severity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alerts_severity ON public.security_alerts USING btree (severity);


--
-- Name: idx_alerts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alerts_status ON public.security_alerts USING btree (status);


--
-- Name: idx_audit_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_timestamp ON public.audit_logs USING btree ("timestamp");


--
-- Name: idx_audit_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_user ON public.audit_logs USING btree (user_id);


--
-- Name: idx_datasets_uploaded_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_datasets_uploaded_by ON public.datasets USING btree (uploaded_by);


--
-- Name: idx_incidents_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_incidents_priority ON public.incidents USING btree (priority);


--
-- Name: idx_incidents_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_incidents_status ON public.incidents USING btree (status);


--
-- Name: idx_network_logs_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_network_logs_timestamp ON public.network_logs USING btree ("timestamp");


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id, is_read);


--
-- Name: idx_predictions_dataset; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_predictions_dataset ON public.predictions USING btree (dataset_id);


--
-- Name: idx_predictions_label; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_predictions_label ON public.predictions USING btree (predicted_label);


--
-- Name: idx_predictions_severity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_predictions_severity ON public.predictions USING btree (severity);


--
-- Name: idx_threats_attack; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_threats_attack ON public.threats USING btree (attack_type);


--
-- Name: idx_threats_detected; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_threats_detected ON public.threats USING btree (detected_at);


--
-- Name: idx_threats_severity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_threats_severity ON public.threats USING btree (severity);


--
-- Name: idx_traffic_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_traffic_timestamp ON public.network_traffic USING btree ("timestamp");


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: datasets datasets_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.datasets
    ADD CONSTRAINT datasets_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: incidents incidents_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.security_alerts(id) ON DELETE SET NULL;


--
-- Name: incidents incidents_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.security_alerts(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: predictions predictions_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictions
    ADD CONSTRAINT predictions_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES public.datasets(id) ON DELETE CASCADE;


--
-- Name: reports reports_generated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: security_alerts security_alerts_threat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.security_alerts
    ADD CONSTRAINT security_alerts_threat_id_fkey FOREIGN KEY (threat_id) REFERENCES public.threats(id) ON DELETE CASCADE;


--
-- Name: threats threats_prediction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.threats
    ADD CONSTRAINT threats_prediction_id_fkey FOREIGN KEY (prediction_id) REFERENCES public.predictions(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict TK5GqV0NgVpeXNDuw1RamsKjckIUb2Yw6QPzTiNgCQReZYiQ5pEOUQkt2P7f1cY

