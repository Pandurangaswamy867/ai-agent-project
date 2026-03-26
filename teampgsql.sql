--
-- PostgreSQL database dump
--

\restrict ZF46qqtfG7GkaGIywB3fN53xfMX4WhnwBWGFHYBOXM3p8BR6ZYARxupLkfCFBLu

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-03-02 23:57:55

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 890 (class 1247 OID 16622)
-- Name: claimstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.claimstatus AS ENUM (
    'pending',
    'verified',
    'rejected'
);


ALTER TYPE public.claimstatus OWNER TO postgres;

--
-- TOC entry 881 (class 1247 OID 16599)
-- Name: msestatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.msestatus AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.msestatus OWNER TO postgres;

--
-- TOC entry 893 (class 1247 OID 16630)
-- Name: partnershipstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.partnershipstatus AS ENUM (
    'pending',
    'active',
    'rejected',
    'closed'
);


ALTER TYPE public.partnershipstatus OWNER TO postgres;

--
-- TOC entry 884 (class 1247 OID 16606)
-- Name: snpstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.snpstatus AS ENUM (
    'active',
    'inactive'
);


ALTER TYPE public.snpstatus OWNER TO postgres;

--
-- TOC entry 887 (class 1247 OID 16612)
-- Name: transactionstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.transactionstatus AS ENUM (
    'completed',
    'pending',
    'verified',
    'failed'
);


ALTER TYPE public.transactionstatus OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 240 (class 1259 OID 16835)
-- Name: claim; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.claim (
    claim_id integer NOT NULL,
    mse_id integer,
    claim_type character varying,
    claim_data character varying,
    status public.claimstatus,
    comments character varying,
    verified_by character varying,
    created_at timestamp without time zone
);


ALTER TABLE public.claim OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 16834)
-- Name: claim_claim_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.claim_claim_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.claim_claim_id_seq OWNER TO postgres;

--
-- TOC entry 5209 (class 0 OID 0)
-- Dependencies: 239
-- Name: claim_claim_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.claim_claim_id_seq OWNED BY public.claim.claim_id;


--
-- TOC entry 230 (class 1259 OID 16708)
-- Name: mse; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mse (
    mse_id integer NOT NULL,
    user_id integer,
    name character varying(100) NOT NULL,
    contact_person character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    phone character varying(15) NOT NULL,
    address character varying(255) NOT NULL,
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    pincode character varying(10) NOT NULL,
    sector character varying(100) NOT NULL,
    description character varying(1000),
    status public.msestatus NOT NULL,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.mse OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16707)
-- Name: mse_mse_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mse_mse_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mse_mse_id_seq OWNER TO postgres;

--
-- TOC entry 5210 (class 0 OID 0)
-- Dependencies: 229
-- Name: mse_mse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mse_mse_id_seq OWNED BY public.mse.mse_id;


--
-- TOC entry 238 (class 1259 OID 16810)
-- Name: mse_product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mse_product (
    product_id integer NOT NULL,
    mse_id integer NOT NULL,
    product_name character varying(100) NOT NULL,
    description character varying(1000),
    category_id integer,
    attributes character varying,
    price double precision,
    unit character varying(20),
    is_active boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.mse_product OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 16809)
-- Name: mse_product_product_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mse_product_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mse_product_product_id_seq OWNER TO postgres;

--
-- TOC entry 5211 (class 0 OID 0)
-- Dependencies: 237
-- Name: mse_product_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mse_product_product_id_seq OWNED BY public.mse_product.product_id;


--
-- TOC entry 222 (class 1259 OID 16657)
-- Name: notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification (
    notification_id integer NOT NULL,
    user_role character varying,
    user_id integer,
    title character varying,
    message character varying,
    type character varying,
    is_read boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.notification OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16656)
-- Name: notification_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notification_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_notification_id_seq OWNER TO postgres;

--
-- TOC entry 5212 (class 0 OID 0)
-- Dependencies: 221
-- Name: notification_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notification_notification_id_seq OWNED BY public.notification.notification_id;


--
-- TOC entry 234 (class 1259 OID 16772)
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_preferences (
    id integer NOT NULL,
    user_id integer,
    email_enabled boolean,
    sms_enabled boolean,
    in_app_enabled boolean,
    marketing_enabled boolean
);


ALTER TABLE public.notification_preferences OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16771)
-- Name: notification_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notification_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_preferences_id_seq OWNER TO postgres;

--
-- TOC entry 5213 (class 0 OID 0)
-- Dependencies: 233
-- Name: notification_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notification_preferences_id_seq OWNED BY public.notification_preferences.id;


--
-- TOC entry 246 (class 1259 OID 16888)
-- Name: ocr_document; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ocr_document (
    document_id integer NOT NULL,
    mse_id integer,
    claim_id integer,
    document_type character varying,
    file_path character varying,
    ocr_status character varying,
    ocr_text character varying,
    extracted_data character varying,
    confidence_score double precision,
    is_verified boolean,
    verified_by character varying,
    verified_at timestamp without time zone,
    created_at timestamp without time zone
);


ALTER TABLE public.ocr_document OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 16887)
-- Name: ocr_document_document_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ocr_document_document_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ocr_document_document_id_seq OWNER TO postgres;

--
-- TOC entry 5214 (class 0 OID 0)
-- Dependencies: 245
-- Name: ocr_document_document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ocr_document_document_id_seq OWNED BY public.ocr_document.document_id;


--
-- TOC entry 228 (class 1259 OID 16696)
-- Name: otp_verification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_verification (
    id integer NOT NULL,
    email character varying(100),
    otp_code character varying,
    created_at timestamp without time zone,
    expires_at timestamp without time zone
);


ALTER TABLE public.otp_verification OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16695)
-- Name: otp_verification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.otp_verification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.otp_verification_id_seq OWNER TO postgres;

--
-- TOC entry 5215 (class 0 OID 0)
-- Dependencies: 227
-- Name: otp_verification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.otp_verification_id_seq OWNED BY public.otp_verification.id;


--
-- TOC entry 242 (class 1259 OID 16851)
-- Name: partnership; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.partnership (
    partnership_id integer NOT NULL,
    mse_id integer,
    snp_id integer,
    match_score double precision,
    status public.partnershipstatus,
    ai_reasoning character varying,
    mse_consent boolean,
    snp_consent boolean,
    initiated_by character varying,
    initiated_at timestamp without time zone,
    approved_by character varying,
    approved_at timestamp without time zone,
    feedback_rating double precision,
    feedback_text character varying,
    created_at timestamp without time zone
);


ALTER TABLE public.partnership OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 16850)
-- Name: partnership_partnership_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.partnership_partnership_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.partnership_partnership_id_seq OWNER TO postgres;

--
-- TOC entry 5216 (class 0 OID 0)
-- Dependencies: 241
-- Name: partnership_partnership_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.partnership_partnership_id_seq OWNED BY public.partnership.partnership_id;


--
-- TOC entry 220 (class 1259 OID 16640)
-- Name: product_category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_category (
    category_id integer NOT NULL,
    category_name character varying NOT NULL,
    parent_category_id integer,
    description character varying,
    sectoral_attributes character varying
);


ALTER TABLE public.product_category OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16639)
-- Name: product_category_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_category_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_category_category_id_seq OWNER TO postgres;

--
-- TOC entry 5217 (class 0 OID 0)
-- Dependencies: 219
-- Name: product_category_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_category_category_id_seq OWNED BY public.product_category.category_id;


--
-- TOC entry 244 (class 1259 OID 16872)
-- Name: product_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_version (
    version_id integer NOT NULL,
    product_id integer,
    version_number integer,
    product_data character varying,
    created_at timestamp without time zone
);


ALTER TABLE public.product_version OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 16871)
-- Name: product_version_version_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_version_version_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_version_version_id_seq OWNER TO postgres;

--
-- TOC entry 5218 (class 0 OID 0)
-- Dependencies: 243
-- Name: product_version_version_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_version_version_id_seq OWNED BY public.product_version.version_id;


--
-- TOC entry 232 (class 1259 OID 16737)
-- Name: snp; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.snp (
    snp_id integer NOT NULL,
    user_id integer,
    name character varying(100) NOT NULL,
    type character varying(100) NOT NULL,
    contact_person character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    phone character varying(15) NOT NULL,
    city character varying(100) NOT NULL,
    onboarding_fee double precision NOT NULL,
    commission_rate double precision NOT NULL,
    rating double precision NOT NULL,
    supported_sectors character varying NOT NULL,
    pincode_expertise character varying NOT NULL,
    capacity integer NOT NULL,
    current_load integer NOT NULL,
    settlement_speed double precision NOT NULL,
    fulfillment_reliability double precision NOT NULL,
    status public.snpstatus NOT NULL,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.snp OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16736)
-- Name: snp_snp_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.snp_snp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.snp_snp_id_seq OWNER TO postgres;

--
-- TOC entry 5219 (class 0 OID 0)
-- Dependencies: 231
-- Name: snp_snp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.snp_snp_id_seq OWNED BY public.snp.snp_id;


--
-- TOC entry 224 (class 1259 OID 16668)
-- Name: system_audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_audit_log (
    log_id integer NOT NULL,
    user_role character varying,
    user_id integer,
    action character varying,
    details character varying,
    ip_address character varying,
    "timestamp" timestamp without time zone
);


ALTER TABLE public.system_audit_log OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16667)
-- Name: system_audit_log_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_audit_log_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_audit_log_log_id_seq OWNER TO postgres;

--
-- TOC entry 5220 (class 0 OID 0)
-- Dependencies: 223
-- Name: system_audit_log_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_audit_log_log_id_seq OWNED BY public.system_audit_log.log_id;


--
-- TOC entry 236 (class 1259 OID 16788)
-- Name: transaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transaction (
    transaction_id integer NOT NULL,
    mse_id integer,
    snp_id integer,
    order_id character varying,
    amount double precision,
    transaction_date timestamp without time zone,
    updated_at timestamp without time zone,
    status public.transactionstatus
);


ALTER TABLE public.transaction OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 16909)
-- Name: transaction_conflict; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transaction_conflict (
    conflict_id integer NOT NULL,
    transaction_id integer,
    conflict_type character varying,
    description character varying,
    status character varying,
    created_at timestamp without time zone
);


ALTER TABLE public.transaction_conflict OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 16908)
-- Name: transaction_conflict_conflict_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transaction_conflict_conflict_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transaction_conflict_conflict_id_seq OWNER TO postgres;

--
-- TOC entry 5221 (class 0 OID 0)
-- Dependencies: 247
-- Name: transaction_conflict_conflict_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transaction_conflict_conflict_id_seq OWNED BY public.transaction_conflict.conflict_id;


--
-- TOC entry 235 (class 1259 OID 16787)
-- Name: transaction_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transaction_transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transaction_transaction_id_seq OWNER TO postgres;

--
-- TOC entry 5222 (class 0 OID 0)
-- Dependencies: 235
-- Name: transaction_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transaction_transaction_id_seq OWNED BY public.transaction.transaction_id;


--
-- TOC entry 226 (class 1259 OID 16679)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(100) NOT NULL,
    hashed_password character varying NOT NULL,
    role character varying NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16678)
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
-- TOC entry 5223 (class 0 OID 0)
-- Dependencies: 225
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4951 (class 2604 OID 16838)
-- Name: claim claim_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim ALTER COLUMN claim_id SET DEFAULT nextval('public.claim_claim_id_seq'::regclass);


--
-- TOC entry 4946 (class 2604 OID 16711)
-- Name: mse mse_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mse ALTER COLUMN mse_id SET DEFAULT nextval('public.mse_mse_id_seq'::regclass);


--
-- TOC entry 4950 (class 2604 OID 16813)
-- Name: mse_product product_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mse_product ALTER COLUMN product_id SET DEFAULT nextval('public.mse_product_product_id_seq'::regclass);


--
-- TOC entry 4942 (class 2604 OID 16660)
-- Name: notification notification_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification ALTER COLUMN notification_id SET DEFAULT nextval('public.notification_notification_id_seq'::regclass);


--
-- TOC entry 4948 (class 2604 OID 16775)
-- Name: notification_preferences id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences ALTER COLUMN id SET DEFAULT nextval('public.notification_preferences_id_seq'::regclass);


--
-- TOC entry 4954 (class 2604 OID 16891)
-- Name: ocr_document document_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ocr_document ALTER COLUMN document_id SET DEFAULT nextval('public.ocr_document_document_id_seq'::regclass);


--
-- TOC entry 4945 (class 2604 OID 16699)
-- Name: otp_verification id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_verification ALTER COLUMN id SET DEFAULT nextval('public.otp_verification_id_seq'::regclass);


--
-- TOC entry 4952 (class 2604 OID 16854)
-- Name: partnership partnership_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partnership ALTER COLUMN partnership_id SET DEFAULT nextval('public.partnership_partnership_id_seq'::regclass);


--
-- TOC entry 4941 (class 2604 OID 16643)
-- Name: product_category category_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_category ALTER COLUMN category_id SET DEFAULT nextval('public.product_category_category_id_seq'::regclass);


--
-- TOC entry 4953 (class 2604 OID 16875)
-- Name: product_version version_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_version ALTER COLUMN version_id SET DEFAULT nextval('public.product_version_version_id_seq'::regclass);


--
-- TOC entry 4947 (class 2604 OID 16740)
-- Name: snp snp_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.snp ALTER COLUMN snp_id SET DEFAULT nextval('public.snp_snp_id_seq'::regclass);


--
-- TOC entry 4943 (class 2604 OID 16671)
-- Name: system_audit_log log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_audit_log ALTER COLUMN log_id SET DEFAULT nextval('public.system_audit_log_log_id_seq'::regclass);


--
-- TOC entry 4949 (class 2604 OID 16791)
-- Name: transaction transaction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction ALTER COLUMN transaction_id SET DEFAULT nextval('public.transaction_transaction_id_seq'::regclass);


--
-- TOC entry 4955 (class 2604 OID 16912)
-- Name: transaction_conflict conflict_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_conflict ALTER COLUMN conflict_id SET DEFAULT nextval('public.transaction_conflict_conflict_id_seq'::regclass);


--
-- TOC entry 4944 (class 2604 OID 16682)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5195 (class 0 OID 16835)
-- Dependencies: 240
-- Data for Name: claim; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.claim (claim_id, mse_id, claim_type, claim_data, status, comments, verified_by, created_at) FROM stdin;
\.


--
-- TOC entry 5185 (class 0 OID 16708)
-- Dependencies: 230
-- Data for Name: mse; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mse (mse_id, user_id, name, contact_person, email, phone, address, city, state, pincode, sector, description, status, created_at) FROM stdin;
1	2	Bharat Green Textiles	Aravind Kumar	demo@mse.gov.in	9876543210	Sector 12, Industrial Area	Varanasi	Uttar Pradesh	221001	Textiles	Organic cotton processing and handloom weaving cooperative.	approved	2026-03-02 09:07:47.189139
2	7	Salem Other Collective	Authorized Rep	mse1@enterprise.in	9998887701	Industrial Area Phase 2	Salem	Tamil Nadu	750793	Other	Traditional Other production unit focused on local heritage.	approved	2026-03-02 09:07:47.283603
3	8	Surat Agri Collective	Authorized Rep	mse2@enterprise.in	9998887702	Industrial Area Phase 2	Surat	Gujarat	914928	Agri	Traditional Agri production unit focused on local heritage.	approved	2026-03-02 09:07:47.379714
4	9	Amritsar Food Processing Collective	Authorized Rep	mse3@enterprise.in	9998887703	Industrial Area Phase 1	Amritsar	Punjab	858032	Food Processing	Traditional Food Processing production unit focused on local heritage.	approved	2026-03-02 09:07:47.464842
5	10	Indore Textiles Collective	Authorized Rep	mse4@enterprise.in	9998887704	Industrial Area Phase 2	Indore	Madhya Pradesh	375615	Textiles	Traditional Textiles production unit focused on local heritage.	approved	2026-03-02 09:07:47.630739
6	11	Ludhiana Other Collective	Authorized Rep	mse5@enterprise.in	9998887705	Industrial Area Phase 3	Ludhiana	Punjab	468254	Other	Traditional Other production unit focused on local heritage.	approved	2026-03-02 09:07:47.779037
7	12	Surat Leather Collective	Authorized Rep	mse6@enterprise.in	9998887706	Industrial Area Phase 1	Surat	Gujarat	332560	Leather	Traditional Leather production unit focused on local heritage.	approved	2026-03-02 09:07:47.863818
8	13	Surat Handicrafts Collective	Authorized Rep	mse7@enterprise.in	9998887707	Industrial Area Phase 1	Surat	Gujarat	734594	Handicrafts	Traditional Handicrafts production unit focused on local heritage.	approved	2026-03-02 09:07:47.948433
9	14	Surat Other Collective	Authorized Rep	mse8@enterprise.in	9998887708	Industrial Area Phase 2	Surat	Gujarat	929203	Other	Traditional Other production unit focused on local heritage.	approved	2026-03-02 09:07:48.04217
10	15	Kanchipuram Leather Collective	Authorized Rep	mse9@enterprise.in	9998887709	Industrial Area Phase 2	Kanchipuram	Tamil Nadu	455129	Leather	Traditional Leather production unit focused on local heritage.	approved	2026-03-02 09:07:48.129138
11	16	Amritsar Textiles Collective	Authorized Rep	mse10@enterprise.in	9998887710	Industrial Area Phase 2	Amritsar	Punjab	948717	Textiles	Traditional Textiles production unit focused on local heritage.	approved	2026-03-02 09:07:48.214753
12	17	Amritsar Other Collective	Authorized Rep	mse11@enterprise.in	9998887711	Industrial Area Phase 4	Amritsar	Punjab	400304	Other	Traditional Other production unit focused on local heritage.	approved	2026-03-02 09:07:48.299663
13	18	Varanasi Textiles Collective	Authorized Rep	mse12@enterprise.in	9998887712	Industrial Area Phase 4	Varanasi	Uttar Pradesh	909409	Textiles	Traditional Textiles production unit focused on local heritage.	approved	2026-03-02 09:07:48.384426
14	19	Surat Agri Collective	Authorized Rep	mse13@enterprise.in	9998887713	Industrial Area Phase 4	Surat	Gujarat	448856	Agri	Traditional Agri production unit focused on local heritage.	approved	2026-03-02 09:07:48.470135
15	20	Nagpur Agri Collective	Authorized Rep	mse14@enterprise.in	9998887714	Industrial Area Phase 3	Nagpur	Maharashtra	653899	Agri	Traditional Agri production unit focused on local heritage.	approved	2026-03-02 09:07:48.553724
16	21	rotis co	sg	mse16@enterprise.in	9963695064	12334	chennai	tn	453423	Food Processing	we make rotis	pending	2026-03-02 14:53:14.544674
17	22	cotton enterprises	r vijay	bejawadaganesh29@gmail.com	9292929291	12334	chennai	tn	453423	Textiles	sarees, shirts	pending	2026-03-02 17:01:55.16825
\.


--
-- TOC entry 5193 (class 0 OID 16810)
-- Dependencies: 238
-- Data for Name: mse_product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mse_product (product_id, mse_id, product_name, description, category_id, attributes, price, unit, is_active, created_at) FROM stdin;
1	1	Woolen Shawl - 581	High quality Woolen Shawl from Varanasi.	\N	\N	805	pcs	t	2026-03-02 09:07:48.655995
2	1	Silk Saree - 146	High quality Silk Saree from Varanasi.	\N	\N	3071	pcs	t	2026-03-02 09:07:48.656
3	1	Cotton Tunic - 457	High quality Cotton Tunic from Varanasi.	\N	\N	333	pcs	t	2026-03-02 09:07:48.656001
4	2	LED Bulb - 196	High quality LED Bulb from Salem.	\N	\N	3056	pcs	t	2026-03-02 09:07:48.656002
5	2	Solar Lantern - 422	High quality Solar Lantern from Salem.	\N	\N	2684	pcs	t	2026-03-02 09:07:48.656004
6	2	Power Bank - 285	High quality Power Bank from Salem.	\N	\N	1006	pcs	t	2026-03-02 09:07:48.656005
7	2	Power Bank - 370	High quality Power Bank from Salem.	\N	\N	3497	pcs	t	2026-03-02 09:07:48.656006
8	3	Basmati Rice - 621	High quality Basmati Rice from Surat.	\N	\N	4424	pcs	t	2026-03-02 09:07:48.656007
9	3	Basmati Rice - 192	High quality Basmati Rice from Surat.	\N	\N	2673	pcs	t	2026-03-02 09:07:48.656009
10	4	Fruit Jam - 746	High quality Fruit Jam from Amritsar.	\N	\N	996	pcs	t	2026-03-02 09:07:48.65601
11	4	Fruit Jam - 527	High quality Fruit Jam from Amritsar.	\N	\N	3430	pcs	t	2026-03-02 09:07:48.656011
12	4	Fruit Jam - 948	High quality Fruit Jam from Amritsar.	\N	\N	2058	pcs	t	2026-03-02 09:07:48.656012
13	4	Fruit Jam - 921	High quality Fruit Jam from Amritsar.	\N	\N	3983	pcs	t	2026-03-02 09:07:48.656014
14	5	Silk Saree - 967	High quality Silk Saree from Indore.	\N	\N	812	pcs	t	2026-03-02 09:07:48.656015
15	5	Silk Saree - 241	High quality Silk Saree from Indore.	\N	\N	465	pcs	t	2026-03-02 09:07:48.656016
16	5	Cotton Tunic - 334	High quality Cotton Tunic from Indore.	\N	\N	341	pcs	t	2026-03-02 09:07:48.656017
17	6	Solar Lantern - 179	High quality Solar Lantern from Ludhiana.	\N	\N	3557	pcs	t	2026-03-02 09:07:48.656019
18	6	Power Bank - 831	High quality Power Bank from Ludhiana.	\N	\N	558	pcs	t	2026-03-02 09:07:48.65602
19	7	Leather Belt - 963	High quality Leather Belt from Surat.	\N	\N	1990	pcs	t	2026-03-02 09:07:48.656021
20	7	Leather Belt - 687	High quality Leather Belt from Surat.	\N	\N	1130	pcs	t	2026-03-02 09:07:48.656024
21	7	Handmade Wallet - 202	High quality Handmade Wallet from Surat.	\N	\N	1524	pcs	t	2026-03-02 09:07:48.656025
22	7	Leather Belt - 748	High quality Leather Belt from Surat.	\N	\N	459	pcs	t	2026-03-02 09:07:48.656027
23	8	Bamboo Basket - 444	High quality Bamboo Basket from Surat.	\N	\N	1228	pcs	t	2026-03-02 09:07:48.656028
24	8	Clay Pottery Set - 802	High quality Clay Pottery Set from Surat.	\N	\N	1016	pcs	t	2026-03-02 09:07:48.656029
25	8	Wood Carved Statue - 450	High quality Wood Carved Statue from Surat.	\N	\N	1671	pcs	t	2026-03-02 09:07:48.65603
26	9	Power Bank - 193	High quality Power Bank from Surat.	\N	\N	4859	pcs	t	2026-03-02 09:07:48.656032
27	9	Power Bank - 106	High quality Power Bank from Surat.	\N	\N	3858	pcs	t	2026-03-02 09:07:48.656033
28	9	Power Bank - 131	High quality Power Bank from Surat.	\N	\N	1562	pcs	t	2026-03-02 09:07:48.656034
29	9	Solar Lantern - 371	High quality Solar Lantern from Surat.	\N	\N	2605	pcs	t	2026-03-02 09:07:48.656035
30	10	Ethnic Jutti - 547	High quality Ethnic Jutti from Kanchipuram.	\N	\N	1287	pcs	t	2026-03-02 09:07:48.656036
31	10	Handmade Wallet - 774	High quality Handmade Wallet from Kanchipuram.	\N	\N	1934	pcs	t	2026-03-02 09:07:48.656038
32	11	Woolen Shawl - 639	High quality Woolen Shawl from Amritsar.	\N	\N	3219	pcs	t	2026-03-02 09:07:48.656039
33	11	Silk Saree - 861	High quality Silk Saree from Amritsar.	\N	\N	810	pcs	t	2026-03-02 09:07:48.65604
34	11	Cotton Tunic - 426	High quality Cotton Tunic from Amritsar.	\N	\N	2305	pcs	t	2026-03-02 09:07:48.656041
35	11	Silk Saree - 652	High quality Silk Saree from Amritsar.	\N	\N	3324	pcs	t	2026-03-02 09:07:48.656043
36	12	LED Bulb - 920	High quality LED Bulb from Amritsar.	\N	\N	2634	pcs	t	2026-03-02 09:07:48.656044
37	12	LED Bulb - 117	High quality LED Bulb from Amritsar.	\N	\N	341	pcs	t	2026-03-02 09:07:48.656045
38	12	Power Bank - 486	High quality Power Bank from Amritsar.	\N	\N	2196	pcs	t	2026-03-02 09:07:48.656046
39	13	Woolen Shawl - 720	High quality Woolen Shawl from Varanasi.	\N	\N	3855	pcs	t	2026-03-02 09:07:48.656048
40	13	Woolen Shawl - 684	High quality Woolen Shawl from Varanasi.	\N	\N	2696	pcs	t	2026-03-02 09:07:48.656049
41	13	Silk Saree - 599	High quality Silk Saree from Varanasi.	\N	\N	2412	pcs	t	2026-03-02 09:07:48.65605
42	13	Silk Saree - 593	High quality Silk Saree from Varanasi.	\N	\N	2385	pcs	t	2026-03-02 09:07:48.656051
43	14	Honey Jar - 378	High quality Honey Jar from Surat.	\N	\N	1524	pcs	t	2026-03-02 09:07:48.656052
44	14	Organic Turmeric - 189	High quality Organic Turmeric from Surat.	\N	\N	1993	pcs	t	2026-03-02 09:07:48.656054
45	14	Honey Jar - 483	High quality Honey Jar from Surat.	\N	\N	2562	pcs	t	2026-03-02 09:07:48.656055
46	14	Honey Jar - 896	High quality Honey Jar from Surat.	\N	\N	4713	pcs	t	2026-03-02 09:07:48.656056
47	15	Honey Jar - 487	High quality Honey Jar from Nagpur.	\N	\N	1508	pcs	t	2026-03-02 09:07:48.656057
48	15	Honey Jar - 130	High quality Honey Jar from Nagpur.	\N	\N	4137	pcs	t	2026-03-02 09:07:48.656058
\.


--
-- TOC entry 5177 (class 0 OID 16657)
-- Dependencies: 222
-- Data for Name: notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification (notification_id, user_role, user_id, title, message, type, is_read, created_at) FROM stdin;
\.


--
-- TOC entry 5189 (class 0 OID 16772)
-- Dependencies: 234
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_preferences (id, user_id, email_enabled, sms_enabled, in_app_enabled, marketing_enabled) FROM stdin;
\.


--
-- TOC entry 5201 (class 0 OID 16888)
-- Dependencies: 246
-- Data for Name: ocr_document; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ocr_document (document_id, mse_id, claim_id, document_type, file_path, ocr_status, ocr_text, extracted_data, confidence_score, is_verified, verified_by, verified_at, created_at) FROM stdin;
1	1	\N	aadhar	samples/aadhar.png	completed	\N	\N	0.834150758565765	t	\N	\N	2026-03-02 09:07:48.651786
2	1	\N	udyam	samples/udyam.png	completed	\N	\N	0.7883284438332065	t	\N	\N	2026-03-02 09:07:48.651791
3	2	\N	aadhar	samples/aadhar.png	completed	\N	\N	0.7566941782979063	t	\N	\N	2026-03-02 09:07:48.651793
4	2	\N	udyam	samples/udyam.png	completed	\N	\N	0.7696402857212674	t	\N	\N	2026-03-02 09:07:48.651795
5	3	\N	aadhar	samples/aadhar.png	completed	\N	\N	0.918638571810956	t	\N	\N	2026-03-02 09:07:48.651797
6	3	\N	udyam	samples/udyam.png	completed	\N	\N	0.9574580059373341	t	\N	\N	2026-03-02 09:07:48.651799
7	4	\N	aadhar	samples/aadhar.png	completed	\N	\N	0.9413660682142855	t	\N	\N	2026-03-02 09:07:48.651801
8	4	\N	udyam	samples/udyam.png	completed	\N	\N	0.9288966417132558	t	\N	\N	2026-03-02 09:07:48.651803
9	5	\N	aadhar	samples/aadhar.png	completed	\N	\N	0.8664955915884787	t	\N	\N	2026-03-02 09:07:48.651805
10	5	\N	udyam	samples/udyam.png	completed	\N	\N	0.8533596011064882	t	\N	\N	2026-03-02 09:07:48.651807
11	6	\N	aadhar	samples/aadhar.png	completed	\N	\N	0.9665336818031697	t	\N	\N	2026-03-02 09:07:48.651809
12	6	\N	udyam	samples/udyam.png	completed	\N	\N	0.8400781015249897	t	\N	\N	2026-03-02 09:07:48.651811
13	7	\N	aadhar	samples/aadhar.png	completed	\N	\N	0.8432472910916942	t	\N	\N	2026-03-02 09:07:48.651813
14	7	\N	udyam	samples/udyam.png	completed	\N	\N	0.9593735081729506	t	\N	\N	2026-03-02 09:07:48.651815
15	8	\N	aadhar	samples/aadhar.png	completed	\N	\N	0.8459679718577328	t	\N	\N	2026-03-02 09:07:48.651817
16	8	\N	udyam	samples/udyam.png	completed	\N	\N	0.9821470514675518	t	\N	\N	2026-03-02 09:07:48.651819
17	9	\N	aadhar	samples/aadhar.png	completed	\N	\N	0.9194002868304998	t	\N	\N	2026-03-02 09:07:48.651821
18	9	\N	udyam	samples/udyam.png	completed	\N	\N	0.8306773820241381	t	\N	\N	2026-03-02 09:07:48.651823
19	10	\N	aadhar	samples/aadhar.png	completed	\N	\N	0.8543717271984301	t	\N	\N	2026-03-02 09:07:48.651826
20	10	\N	udyam	samples/udyam.png	completed	\N	\N	0.7756701233642014	t	\N	\N	2026-03-02 09:07:48.651828
21	11	\N	aadhar	samples/aadhar.png	completed	\N	\N	0.9849861106165498	t	\N	\N	2026-03-02 09:07:48.65183
22	11	\N	udyam	samples/udyam.png	completed	\N	\N	0.9310116792703148	t	\N	\N	2026-03-02 09:07:48.651833
23	12	\N	aadhar	samples/aadhar.png	completed	\N	\N	0.9182274332209784	t	\N	\N	2026-03-02 09:07:48.651835
24	12	\N	udyam	samples/udyam.png	completed	\N	\N	0.8084406406469662	t	\N	\N	2026-03-02 09:07:48.651837
25	13	\N	aadhar	samples/aadhar.png	completed	\N	\N	0.8130339167620987	t	\N	\N	2026-03-02 09:07:48.65184
26	13	\N	udyam	samples/udyam.png	completed	\N	\N	0.8981520227681747	t	\N	\N	2026-03-02 09:07:48.651842
27	14	\N	aadhar	samples/aadhar.png	completed	\N	\N	0.8898883307699991	t	\N	\N	2026-03-02 09:07:48.651844
28	14	\N	udyam	samples/udyam.png	completed	\N	\N	0.9191995834328163	t	\N	\N	2026-03-02 09:07:48.651846
29	15	\N	aadhar	samples/aadhar.png	completed	\N	\N	0.8719114267799389	t	\N	\N	2026-03-02 09:07:48.651849
30	15	\N	udyam	samples/udyam.png	completed	\N	\N	0.780446885366192	t	\N	\N	2026-03-02 09:07:48.651851
\.


--
-- TOC entry 5183 (class 0 OID 16696)
-- Dependencies: 228
-- Data for Name: otp_verification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.otp_verification (id, email, otp_code, created_at, expires_at) FROM stdin;
\.


--
-- TOC entry 5197 (class 0 OID 16851)
-- Dependencies: 242
-- Data for Name: partnership; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.partnership (partnership_id, mse_id, snp_id, match_score, status, ai_reasoning, mse_consent, snp_consent, initiated_by, initiated_at, approved_by, approved_at, feedback_rating, feedback_text, created_at) FROM stdin;
1	1	3	88.93413467277924	active	Strong sectoral alignment and regional proximity.	t	t	mse	2026-02-06 09:07:48.841321	admin	2026-02-07 14:07:48.841321	\N	\N	2026-03-02 09:07:48.860995
2	1	2	82.54955772398488	active	Strong sectoral alignment and regional proximity.	t	t	mse	2026-02-14 09:07:48.843679	admin	2026-02-14 14:07:48.843679	\N	\N	2026-03-02 09:07:48.861
3	2	3	92.75959279574631	active	Strong sectoral alignment and regional proximity.	t	t	system	2026-02-19 09:07:48.844247	admin	2026-02-20 03:07:48.844247	\N	\N	2026-03-02 09:07:48.861003
4	2	1	68.4510096728909	active	Strong sectoral alignment and regional proximity.	t	t	mse	2026-02-10 09:07:48.844791	admin	2026-02-10 23:07:48.844791	\N	\N	2026-03-02 09:07:48.861005
5	3	3	80.18392531934717	active	Strong sectoral alignment and regional proximity.	t	t	system	2026-02-14 09:07:48.845542	admin	2026-02-14 16:07:48.845542	\N	\N	2026-03-02 09:07:48.861007
6	3	1	84.23988911411294	active	Strong sectoral alignment and regional proximity.	t	t	mse	2026-02-14 09:07:48.846506	admin	2026-02-14 11:07:48.846506	\N	\N	2026-03-02 09:07:48.86101
7	4	4	77.02623137350768	active	Strong sectoral alignment and regional proximity.	t	t	system	2026-02-19 09:07:48.846588	admin	2026-02-20 00:07:48.846588	\N	\N	2026-03-02 09:07:48.861012
8	4	2	91.41453635481099	active	Strong sectoral alignment and regional proximity.	t	t	mse	2026-02-18 09:07:48.847723	admin	2026-02-19 02:07:48.847723	\N	\N	2026-03-02 09:07:48.861014
9	5	3	86.49921816893549	active	Strong sectoral alignment and regional proximity.	t	t	system	2026-02-20 09:07:48.8478	admin	2026-02-21 10:07:48.8478	\N	\N	2026-03-02 09:07:48.861017
10	5	4	71.26398416830838	active	Strong sectoral alignment and regional proximity.	t	t	mse	2026-02-21 09:07:48.848361	snp	2026-02-22 07:07:48.848361	\N	\N	2026-03-02 09:07:48.861019
11	6	3	92.67193952451228	active	Strong sectoral alignment and regional proximity.	t	t	system	2026-02-24 09:07:48.848438	admin	2026-02-24 13:07:48.848438	\N	\N	2026-03-02 09:07:48.861021
12	6	4	85.68812247451189	active	Strong sectoral alignment and regional proximity.	t	t	system	2026-01-31 09:07:48.849016	admin	2026-02-02 01:07:48.849016	\N	\N	2026-03-02 09:07:48.861024
13	7	2	88.85177884483147	active	Strong sectoral alignment and regional proximity.	t	t	mse	2026-02-17 09:07:48.849093	snp	2026-02-17 21:07:48.849093	\N	\N	2026-03-02 09:07:48.861026
14	7	3	75.33008899876545	active	Strong sectoral alignment and regional proximity.	t	t	system	2026-02-05 09:07:48.849646	snp	2026-02-06 11:07:48.849646	\N	\N	2026-03-02 09:07:48.861029
15	8	4	87.58244450306054	active	Strong sectoral alignment and regional proximity.	t	t	system	2026-02-10 09:07:48.849726	admin	2026-02-12 09:07:48.849726	\N	\N	2026-03-02 09:07:48.861031
16	8	3	93.28118835618429	active	Strong sectoral alignment and regional proximity.	t	t	mse	2026-02-12 09:07:48.850269	admin	2026-02-13 16:07:48.850269	\N	\N	2026-03-02 09:07:48.861034
17	9	4	67.40944987673075	active	Strong sectoral alignment and regional proximity.	t	t	system	2026-01-31 09:07:48.850344	snp	2026-02-02 01:07:48.850344	\N	\N	2026-03-02 09:07:48.861036
18	9	1	92.07413807266667	active	Strong sectoral alignment and regional proximity.	t	t	mse	2026-02-12 09:07:48.850889	snp	2026-02-12 13:07:48.850889	\N	\N	2026-03-02 09:07:48.86104
19	10	4	66.39598033408798	active	Strong sectoral alignment and regional proximity.	t	t	mse	2026-02-08 09:07:48.850963	snp	2026-02-10 01:07:48.850963	\N	\N	2026-03-02 09:07:48.861043
20	10	3	88.41123110343187	active	Strong sectoral alignment and regional proximity.	t	t	system	2026-02-18 09:07:48.851511	snp	2026-02-20 05:07:48.851511	\N	\N	2026-03-02 09:07:48.861045
21	11	2	94.61863903217406	active	Strong sectoral alignment and regional proximity.	t	t	system	2026-02-12 09:07:48.851584	admin	2026-02-13 11:07:48.851584	\N	\N	2026-03-02 09:07:48.861048
22	11	1	94.35246245795997	active	Strong sectoral alignment and regional proximity.	t	t	system	2026-02-20 09:07:48.852639	snp	2026-02-21 20:07:48.852639	\N	\N	2026-03-02 09:07:48.86105
23	12	2	68.24489278954755	active	Strong sectoral alignment and regional proximity.	t	t	system	2026-02-14 09:07:48.852794	admin	2026-02-15 06:07:48.852794	\N	\N	2026-03-02 09:07:48.861052
24	12	3	85.16692636300242	active	Strong sectoral alignment and regional proximity.	t	t	system	2026-02-20 09:07:48.85373	snp	2026-02-21 04:07:48.85373	\N	\N	2026-03-02 09:07:48.861055
25	13	3	73.69885034759957	active	Strong sectoral alignment and regional proximity.	t	t	system	2026-02-09 09:07:48.853854	admin	2026-02-10 13:07:48.853854	\N	\N	2026-03-02 09:07:48.861057
26	13	2	83.68460145954636	active	Strong sectoral alignment and regional proximity.	t	t	system	2026-02-07 09:07:48.854675	admin	2026-02-08 01:07:48.854675	\N	\N	2026-03-02 09:07:48.86106
27	14	1	69.54536634270683	active	Strong sectoral alignment and regional proximity.	t	t	system	2026-02-16 09:07:48.854797	snp	2026-02-16 20:07:48.854797	\N	\N	2026-03-02 09:07:48.861062
28	14	3	97.84450856708571	active	Strong sectoral alignment and regional proximity.	t	t	mse	2026-02-08 09:07:48.855595	admin	2026-02-10 06:07:48.855595	\N	\N	2026-03-02 09:07:48.861065
29	15	4	77.37773903180792	active	Strong sectoral alignment and regional proximity.	t	t	system	2026-02-15 09:07:48.855719	admin	2026-02-16 06:07:48.855719	\N	\N	2026-03-02 09:07:48.861067
30	15	2	73.19560804934171	active	Strong sectoral alignment and regional proximity.	t	t	system	2026-02-05 09:07:48.856511	snp	2026-02-06 22:07:48.856511	\N	\N	2026-03-02 09:07:48.86107
\.


--
-- TOC entry 5175 (class 0 OID 16640)
-- Dependencies: 220
-- Data for Name: product_category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_category (category_id, category_name, parent_category_id, description, sectoral_attributes) FROM stdin;
\.


--
-- TOC entry 5199 (class 0 OID 16872)
-- Dependencies: 244
-- Data for Name: product_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_version (version_id, product_id, version_number, product_data, created_at) FROM stdin;
\.


--
-- TOC entry 5187 (class 0 OID 16737)
-- Dependencies: 232
-- Data for Name: snp; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.snp (snp_id, user_id, name, type, contact_person, email, phone, city, onboarding_fee, commission_rate, rating, supported_sectors, pincode_expertise, capacity, current_load, settlement_speed, fulfillment_reliability, status, created_at) FROM stdin;
2	4	Gramin Digital Hub	Seller App	Manager	seller@gramin.in	9876543210	Multi-city	0	5	4	["Handicrafts", "Textiles", "Agri", "Food Processing", "Leather", "Other"]	["141001", "636001", "395001"]	1000	0	0.95	0.98	active	2026-03-02 09:07:46.799655
3	5	Kisaan Connect Node	Seller App	Manager	node@kisaan.org	9876543210	Multi-city	0	5	4	["Handicrafts", "Textiles", "Agri", "Food Processing", "Leather", "Other"]	["440001", "143001", "452001"]	1000	0	0.95	0.98	active	2026-03-02 09:07:46.928073
4	6	PayVillage Solutions	Payments	Manager	pay@village.com	9876543210	Multi-city	0	5	4	["Handicrafts", "Textiles", "Agri", "Food Processing", "Leather", "Other"]	["110001", "400001", "560001"]	1000	0	0.95	0.98	active	2026-03-02 09:07:47.101029
1	3	Bharat Logistics HQ	Logistics	Manager	logistics@bharat.in	9876543210	Multi-city	500	5	4	["Handicrafts", "Textiles", "Agri", "Food Processing", "Leather", "Other"]	["221001", "302001", "631501"]	1000	0	0.95	0.98	active	2026-03-02 09:07:46.650794
\.


--
-- TOC entry 5179 (class 0 OID 16668)
-- Dependencies: 224
-- Data for Name: system_audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_audit_log (log_id, user_role, user_id, action, details, ip_address, "timestamp") FROM stdin;
1	mse	2	LOGIN_SUCCESS	User demo@mse.gov.in successfully authenticated.	127.0.0.1	2026-03-02 09:11:43.579335
2	mse	7	LOGIN_SUCCESS	User mse1@enterprise.in successfully authenticated.	127.0.0.1	2026-03-02 11:28:14.698378
3	mse	7	LOGIN_SUCCESS	User mse1@enterprise.in successfully authenticated.	127.0.0.1	2026-03-02 15:12:55.810655
4	mse	21	LOGIN_FAILED	User mse16@enterprise.in failed to authenticate via password.	127.0.0.1	2026-03-02 15:14:27.337172
5	mse	21	LOGIN_FAILED	User mse16@enterprise.in failed to authenticate via password.	127.0.0.1	2026-03-02 15:14:36.452652
6	mse	21	LOGIN_FAILED	User mse16@enterprise.in failed to authenticate via password.	127.0.0.1	2026-03-02 15:14:38.492834
7	mse	21	LOGIN_FAILED	User mse16@enterprise.in failed to authenticate via password.	127.0.0.1	2026-03-02 15:16:11.711584
8	mse	21	LOGIN_FAILED	User mse16@enterprise.in failed to authenticate via password.	127.0.0.1	2026-03-02 15:16:12.817043
9	mse	21	LOGIN_FAILED	User mse16@enterprise.in failed to authenticate via password.	127.0.0.1	2026-03-02 15:16:13.658284
10	mse	21	LOGIN_FAILED	User mse16@enterprise.in failed to authenticate via password.	127.0.0.1	2026-03-02 15:16:13.892391
11	mse	21	LOGIN_SUCCESS	User mse16@enterprise.in successfully authenticated.	127.0.0.1	2026-03-02 15:17:09.094887
12	mse	7	LOGIN_SUCCESS	User mse1@enterprise.in successfully authenticated.	127.0.0.1	2026-03-02 16:52:37.987378
13	mse	7	LOGIN_SUCCESS	User mse1@enterprise.in successfully authenticated.	127.0.0.1	2026-03-02 16:54:19.689773
14	snp	3	LOGIN_SUCCESS	User logistics@bharat.in successfully authenticated.	127.0.0.1	2026-03-02 16:55:12.815349
15	mse	7	LOGIN_SUCCESS	User mse1@enterprise.in successfully authenticated.	127.0.0.1	2026-03-02 16:58:46.80487
16	snp	3	LOGIN_SUCCESS	User logistics@bharat.in successfully authenticated.	127.0.0.1	2026-03-02 16:59:59.468077
\.


--
-- TOC entry 5191 (class 0 OID 16788)
-- Dependencies: 236
-- Data for Name: transaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transaction (transaction_id, mse_id, snp_id, order_id, amount, transaction_date, updated_at, status) FROM stdin;
1	9	1	ONDC-TX-31445	13816	2026-02-01 09:07:48.738489	2026-03-02 09:07:48.755999	verified
2	7	3	ONDC-TX-54567	16055	2026-02-26 09:07:48.739408	2026-03-02 09:07:48.756004	verified
3	10	1	ONDC-TX-36590	3059	2026-01-30 09:07:48.740173	2026-03-02 09:07:48.756007	verified
4	5	1	ONDC-TX-50227	5702	2026-02-09 09:07:48.740921	2026-03-02 09:07:48.75601	pending
5	12	3	ONDC-TX-63076	7593	2026-01-12 09:07:48.741665	2026-03-02 09:07:48.756012	verified
6	9	3	ONDC-TX-96868	17267	2026-01-07 09:07:48.742369	2026-03-02 09:07:48.756015	verified
7	7	3	ONDC-TX-96998	22608	2026-01-22 09:07:48.742462	2026-03-02 09:07:48.756017	verified
8	14	2	ONDC-TX-90544	6006	2026-02-01 09:07:48.742542	2026-03-02 09:07:48.756019	verified
9	5	3	ONDC-TX-45775	14270	2026-02-08 09:07:48.743235	2026-03-02 09:07:48.756022	verified
10	2	1	ONDC-TX-80841	11780	2026-02-05 09:07:48.74332	2026-03-02 09:07:48.756024	verified
11	9	2	ONDC-TX-15424	7992	2026-01-17 09:07:48.744001	2026-03-02 09:07:48.756026	verified
12	10	2	ONDC-TX-58687	14775	2026-02-21 09:07:48.744089	2026-03-02 09:07:48.756028	verified
13	13	3	ONDC-TX-56077	21594	2026-02-25 09:07:48.744168	2026-03-02 09:07:48.756031	verified
14	1	1	ONDC-TX-74306	2437	2026-02-16 09:07:48.744844	2026-03-02 09:07:48.756033	completed
15	11	3	ONDC-TX-86312	1117	2026-01-28 09:07:48.745525	2026-03-02 09:07:48.756035	verified
16	12	3	ONDC-TX-36414	22112	2026-01-16 09:07:48.746198	2026-03-02 09:07:48.756038	pending
17	11	2	ONDC-TX-82486	8230	2026-02-05 09:07:48.746283	2026-03-02 09:07:48.75604	verified
18	10	2	ONDC-TX-56442	20329	2026-01-19 09:07:48.74636	2026-03-02 09:07:48.756043	verified
19	15	2	ONDC-TX-93615	16456	2026-01-11 09:07:48.746435	2026-03-02 09:07:48.756045	completed
20	7	2	ONDC-TX-91293	9974	2026-02-02 09:07:48.747112	2026-03-02 09:07:48.756047	completed
21	5	1	ONDC-TX-38783	17044	2026-02-09 09:07:48.747198	2026-03-02 09:07:48.756049	pending
22	15	2	ONDC-TX-93014	16638	2026-02-14 09:07:48.747275	2026-03-02 09:07:48.756051	verified
23	2	1	ONDC-TX-48709	10486	2026-02-11 09:07:48.747351	2026-03-02 09:07:48.756053	pending
24	2	1	ONDC-TX-15958	8389	2026-02-13 09:07:48.747422	2026-03-02 09:07:48.756055	pending
25	5	1	ONDC-TX-47503	19889	2026-02-21 09:07:48.747499	2026-03-02 09:07:48.756058	verified
26	10	3	ONDC-TX-75956	6993	2026-02-08 09:07:48.747571	2026-03-02 09:07:48.75606	verified
27	6	2	ONDC-TX-60824	8341	2026-01-17 09:07:48.747644	2026-03-02 09:07:48.756062	verified
28	15	2	ONDC-TX-84585	21191	2026-01-30 09:07:48.748352	2026-03-02 09:07:48.756064	verified
29	1	1	ONDC-TX-35837	19762	2026-02-06 09:07:48.748436	2026-03-02 09:07:48.756071	verified
30	7	3	ONDC-TX-71413	7191	2026-01-21 09:07:48.748513	2026-03-02 09:07:48.756073	completed
31	6	3	ONDC-TX-12589	17068	2026-01-10 09:07:48.748592	2026-03-02 09:07:48.756076	verified
32	13	2	ONDC-TX-76011	20780	2026-01-28 09:07:48.748666	2026-03-02 09:07:48.756078	pending
33	13	3	ONDC-TX-72474	20524	2026-01-08 09:07:48.748741	2026-03-02 09:07:48.756081	verified
34	4	1	ONDC-TX-74195	5690	2026-02-17 09:07:48.748811	2026-03-02 09:07:48.756083	verified
35	4	3	ONDC-TX-10824	6847	2026-02-11 09:07:48.749536	2026-03-02 09:07:48.756085	verified
36	3	1	ONDC-TX-65041	20031	2026-02-12 09:07:48.749624	2026-03-02 09:07:48.756088	pending
37	4	3	ONDC-TX-46273	15315	2026-01-19 09:07:48.750301	2026-03-02 09:07:48.75609	verified
38	5	3	ONDC-TX-93510	15921	2026-02-09 09:07:48.750388	2026-03-02 09:07:48.756093	verified
39	14	2	ONDC-TX-37297	24682	2026-01-30 09:07:48.750465	2026-03-02 09:07:48.756095	completed
40	11	3	ONDC-TX-16859	6886	2026-01-06 09:07:48.750539	2026-03-02 09:07:48.756097	verified
41	8	3	ONDC-TX-76447	7056	2026-03-01 09:07:48.750613	2026-03-02 09:07:48.7561	completed
42	15	2	ONDC-TX-69913	21124	2026-02-11 09:07:48.751295	2026-03-02 09:07:48.756102	completed
43	10	3	ONDC-TX-88845	12954	2026-02-25 09:07:48.751385	2026-03-02 09:07:48.756104	verified
44	13	3	ONDC-TX-51559	3774	2026-01-31 09:07:48.751464	2026-03-02 09:07:48.756107	completed
45	5	1	ONDC-TX-31429	9749	2026-02-24 09:07:48.751544	2026-03-02 09:07:48.756109	pending
46	10	3	ONDC-TX-37506	22123	2026-02-17 09:07:48.751619	2026-03-02 09:07:48.756111	pending
47	11	3	ONDC-TX-36654	22737	2026-01-28 09:07:48.751695	2026-03-02 09:07:48.756114	verified
48	14	3	ONDC-TX-58439	13125	2026-01-11 09:07:48.751767	2026-03-02 09:07:48.756116	pending
49	7	1	ONDC-TX-38081	21205	2026-02-12 09:07:48.751837	2026-03-02 09:07:48.756118	verified
50	3	2	ONDC-TX-48538	22514	2026-01-21 09:07:48.751908	2026-03-02 09:07:48.756121	verified
\.


--
-- TOC entry 5203 (class 0 OID 16909)
-- Dependencies: 248
-- Data for Name: transaction_conflict; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transaction_conflict (conflict_id, transaction_id, conflict_type, description, status, created_at) FROM stdin;
\.


--
-- TOC entry 5181 (class 0 OID 16679)
-- Dependencies: 226
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, hashed_password, role, is_active, created_at) FROM stdin;
1	admin@nsic.gov.in	$pbkdf2-sha256$29000$8x6jlHLOuVfqHUOIsVbKWQ$OR7uebGjx0CorTNbZX/s9gMyGGVba3MJHwfyfwhQMJ0	nsic	t	2026-03-02 09:07:46.491119
2	demo@mse.gov.in	$pbkdf2-sha256$29000$uRfCGMO4d44RAiBkbG2t1Q$9g7gHS/7Ll7lMI/RO50DJcXsKYFuSqG1OImJpd7P1iU	mse	t	2026-03-02 09:07:46.49113
3	logistics@bharat.in	$pbkdf2-sha256$29000$8x6jlHLOuVfqHUOIsVbKWQ$OR7uebGjx0CorTNbZX/s9gMyGGVba3MJHwfyfwhQMJ0	snp	t	2026-03-02 09:07:46.568123
4	seller@gramin.in	$pbkdf2-sha256$29000$8x6jlHLOuVfqHUOIsVbKWQ$OR7uebGjx0CorTNbZX/s9gMyGGVba3MJHwfyfwhQMJ0	snp	t	2026-03-02 09:07:46.64749
5	node@kisaan.org	$pbkdf2-sha256$29000$8x6jlHLOuVfqHUOIsVbKWQ$OR7uebGjx0CorTNbZX/s9gMyGGVba3MJHwfyfwhQMJ0	snp	t	2026-03-02 09:07:46.777609
6	pay@village.com	$pbkdf2-sha256$29000$8x6jlHLOuVfqHUOIsVbKWQ$OR7uebGjx0CorTNbZX/s9gMyGGVba3MJHwfyfwhQMJ0	snp	t	2026-03-02 09:07:46.926268
7	mse1@enterprise.in	$pbkdf2-sha256$29000$8x6jlHLOuVfqHUOIsVbKWQ$OR7uebGjx0CorTNbZX/s9gMyGGVba3MJHwfyfwhQMJ0	mse	t	2026-03-02 09:07:47.186257
8	mse2@enterprise.in	$pbkdf2-sha256$29000$8x6jlHLOuVfqHUOIsVbKWQ$OR7uebGjx0CorTNbZX/s9gMyGGVba3MJHwfyfwhQMJ0	mse	t	2026-03-02 09:07:47.282233
9	mse3@enterprise.in	$pbkdf2-sha256$29000$8x6jlHLOuVfqHUOIsVbKWQ$OR7uebGjx0CorTNbZX/s9gMyGGVba3MJHwfyfwhQMJ0	mse	t	2026-03-02 09:07:47.378525
10	mse4@enterprise.in	$pbkdf2-sha256$29000$8x6jlHLOuVfqHUOIsVbKWQ$OR7uebGjx0CorTNbZX/s9gMyGGVba3MJHwfyfwhQMJ0	mse	t	2026-03-02 09:07:47.463535
11	mse5@enterprise.in	$pbkdf2-sha256$29000$8x6jlHLOuVfqHUOIsVbKWQ$OR7uebGjx0CorTNbZX/s9gMyGGVba3MJHwfyfwhQMJ0	mse	t	2026-03-02 09:07:47.626975
12	mse6@enterprise.in	$pbkdf2-sha256$29000$8x6jlHLOuVfqHUOIsVbKWQ$OR7uebGjx0CorTNbZX/s9gMyGGVba3MJHwfyfwhQMJ0	mse	t	2026-03-02 09:07:47.777741
13	mse7@enterprise.in	$pbkdf2-sha256$29000$8x6jlHLOuVfqHUOIsVbKWQ$OR7uebGjx0CorTNbZX/s9gMyGGVba3MJHwfyfwhQMJ0	mse	t	2026-03-02 09:07:47.862527
14	mse8@enterprise.in	$pbkdf2-sha256$29000$8x6jlHLOuVfqHUOIsVbKWQ$OR7uebGjx0CorTNbZX/s9gMyGGVba3MJHwfyfwhQMJ0	mse	t	2026-03-02 09:07:47.947296
15	mse9@enterprise.in	$pbkdf2-sha256$29000$8x6jlHLOuVfqHUOIsVbKWQ$OR7uebGjx0CorTNbZX/s9gMyGGVba3MJHwfyfwhQMJ0	mse	t	2026-03-02 09:07:48.03193
16	mse10@enterprise.in	$pbkdf2-sha256$29000$8x6jlHLOuVfqHUOIsVbKWQ$OR7uebGjx0CorTNbZX/s9gMyGGVba3MJHwfyfwhQMJ0	mse	t	2026-03-02 09:07:48.127908
17	mse11@enterprise.in	$pbkdf2-sha256$29000$8x6jlHLOuVfqHUOIsVbKWQ$OR7uebGjx0CorTNbZX/s9gMyGGVba3MJHwfyfwhQMJ0	mse	t	2026-03-02 09:07:48.213524
18	mse12@enterprise.in	$pbkdf2-sha256$29000$8x6jlHLOuVfqHUOIsVbKWQ$OR7uebGjx0CorTNbZX/s9gMyGGVba3MJHwfyfwhQMJ0	mse	t	2026-03-02 09:07:48.298435
19	mse13@enterprise.in	$pbkdf2-sha256$29000$8x6jlHLOuVfqHUOIsVbKWQ$OR7uebGjx0CorTNbZX/s9gMyGGVba3MJHwfyfwhQMJ0	mse	t	2026-03-02 09:07:48.383328
20	mse14@enterprise.in	$pbkdf2-sha256$29000$8x6jlHLOuVfqHUOIsVbKWQ$OR7uebGjx0CorTNbZX/s9gMyGGVba3MJHwfyfwhQMJ0	mse	t	2026-03-02 09:07:48.468661
21	mse16@enterprise.in	$pbkdf2-sha256$29000$8x6jlHLOuVfqHUOIsVbKWQ$OR7uebGjx0CorTNbZX/s9gMyGGVba3MJHwfyfwhQMJ0	mse	t	2026-03-02 14:53:14.539408
22	bejawadaganesh29@gmail.com	$pbkdf2-sha256$29000$UoqxlnLOeU.plXIuxTgn5A$PjnHsX.Jc2QJw/V9Fgs/Fc7spR1K2jurRUDeW1N68OY	mse	t	2026-03-02 17:01:55.163267
\.


--
-- TOC entry 5224 (class 0 OID 0)
-- Dependencies: 239
-- Name: claim_claim_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.claim_claim_id_seq', 1, true);


--
-- TOC entry 5225 (class 0 OID 0)
-- Dependencies: 229
-- Name: mse_mse_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mse_mse_id_seq', 17, true);


--
-- TOC entry 5226 (class 0 OID 0)
-- Dependencies: 237
-- Name: mse_product_product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mse_product_product_id_seq', 48, true);


--
-- TOC entry 5227 (class 0 OID 0)
-- Dependencies: 221
-- Name: notification_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notification_notification_id_seq', 1, true);


--
-- TOC entry 5228 (class 0 OID 0)
-- Dependencies: 233
-- Name: notification_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notification_preferences_id_seq', 1, true);


--
-- TOC entry 5229 (class 0 OID 0)
-- Dependencies: 245
-- Name: ocr_document_document_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ocr_document_document_id_seq', 30, true);


--
-- TOC entry 5230 (class 0 OID 0)
-- Dependencies: 227
-- Name: otp_verification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.otp_verification_id_seq', 1, true);


--
-- TOC entry 5231 (class 0 OID 0)
-- Dependencies: 241
-- Name: partnership_partnership_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.partnership_partnership_id_seq', 30, true);


--
-- TOC entry 5232 (class 0 OID 0)
-- Dependencies: 219
-- Name: product_category_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_category_category_id_seq', 1, true);


--
-- TOC entry 5233 (class 0 OID 0)
-- Dependencies: 243
-- Name: product_version_version_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_version_version_id_seq', 1, true);


--
-- TOC entry 5234 (class 0 OID 0)
-- Dependencies: 231
-- Name: snp_snp_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.snp_snp_id_seq', 4, true);


--
-- TOC entry 5235 (class 0 OID 0)
-- Dependencies: 223
-- Name: system_audit_log_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_audit_log_log_id_seq', 16, true);


--
-- TOC entry 5236 (class 0 OID 0)
-- Dependencies: 247
-- Name: transaction_conflict_conflict_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transaction_conflict_conflict_id_seq', 1, true);


--
-- TOC entry 5237 (class 0 OID 0)
-- Dependencies: 235
-- Name: transaction_transaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transaction_transaction_id_seq', 50, true);


--
-- TOC entry 5238 (class 0 OID 0)
-- Dependencies: 225
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 22, true);


--
-- TOC entry 4993 (class 2606 OID 16822)
-- Name: mse_product _mse_product_uc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mse_product
    ADD CONSTRAINT _mse_product_uc UNIQUE (mse_id, product_name);


--
-- TOC entry 4998 (class 2606 OID 16843)
-- Name: claim claim_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim
    ADD CONSTRAINT claim_pkey PRIMARY KEY (claim_id);


--
-- TOC entry 4977 (class 2606 OID 16727)
-- Name: mse mse_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mse
    ADD CONSTRAINT mse_pkey PRIMARY KEY (mse_id);


--
-- TOC entry 4996 (class 2606 OID 16820)
-- Name: mse_product mse_product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mse_product
    ADD CONSTRAINT mse_product_pkey PRIMARY KEY (product_id);


--
-- TOC entry 4961 (class 2606 OID 16665)
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (notification_id);


--
-- TOC entry 4985 (class 2606 OID 16778)
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- TOC entry 4987 (class 2606 OID 16780)
-- Name: notification_preferences notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);


--
-- TOC entry 5008 (class 2606 OID 16896)
-- Name: ocr_document ocr_document_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ocr_document
    ADD CONSTRAINT ocr_document_pkey PRIMARY KEY (document_id);


--
-- TOC entry 4972 (class 2606 OID 16704)
-- Name: otp_verification otp_verification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_verification
    ADD CONSTRAINT otp_verification_pkey PRIMARY KEY (id);


--
-- TOC entry 5002 (class 2606 OID 16859)
-- Name: partnership partnership_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partnership
    ADD CONSTRAINT partnership_pkey PRIMARY KEY (partnership_id);


--
-- TOC entry 4958 (class 2606 OID 16649)
-- Name: product_category product_category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_category
    ADD CONSTRAINT product_category_pkey PRIMARY KEY (category_id);


--
-- TOC entry 5005 (class 2606 OID 16880)
-- Name: product_version product_version_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_version
    ADD CONSTRAINT product_version_pkey PRIMARY KEY (version_id);


--
-- TOC entry 4982 (class 2606 OID 16762)
-- Name: snp snp_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.snp
    ADD CONSTRAINT snp_pkey PRIMARY KEY (snp_id);


--
-- TOC entry 4964 (class 2606 OID 16676)
-- Name: system_audit_log system_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_audit_log
    ADD CONSTRAINT system_audit_log_pkey PRIMARY KEY (log_id);


--
-- TOC entry 5011 (class 2606 OID 16917)
-- Name: transaction_conflict transaction_conflict_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_conflict
    ADD CONSTRAINT transaction_conflict_pkey PRIMARY KEY (conflict_id);


--
-- TOC entry 4991 (class 2606 OID 16796)
-- Name: transaction transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction
    ADD CONSTRAINT transaction_pkey PRIMARY KEY (transaction_id);


--
-- TOC entry 4968 (class 2606 OID 16692)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4999 (class 1259 OID 16849)
-- Name: ix_claim_claim_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_claim_claim_id ON public.claim USING btree (claim_id);


--
-- TOC entry 4973 (class 1259 OID 16733)
-- Name: ix_mse_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_mse_email ON public.mse USING btree (email);


--
-- TOC entry 4974 (class 1259 OID 16734)
-- Name: ix_mse_mse_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_mse_mse_id ON public.mse USING btree (mse_id);


--
-- TOC entry 4975 (class 1259 OID 16735)
-- Name: ix_mse_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_mse_name ON public.mse USING btree (name);


--
-- TOC entry 4994 (class 1259 OID 16833)
-- Name: ix_mse_product_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_mse_product_product_id ON public.mse_product USING btree (product_id);


--
-- TOC entry 4959 (class 1259 OID 16666)
-- Name: ix_notification_notification_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_notification_notification_id ON public.notification USING btree (notification_id);


--
-- TOC entry 4983 (class 1259 OID 16786)
-- Name: ix_notification_preferences_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_notification_preferences_id ON public.notification_preferences USING btree (id);


--
-- TOC entry 5006 (class 1259 OID 16907)
-- Name: ix_ocr_document_document_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_ocr_document_document_id ON public.ocr_document USING btree (document_id);


--
-- TOC entry 4969 (class 1259 OID 16706)
-- Name: ix_otp_verification_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_otp_verification_email ON public.otp_verification USING btree (email);


--
-- TOC entry 4970 (class 1259 OID 16705)
-- Name: ix_otp_verification_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_otp_verification_id ON public.otp_verification USING btree (id);


--
-- TOC entry 5000 (class 1259 OID 16870)
-- Name: ix_partnership_partnership_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_partnership_partnership_id ON public.partnership USING btree (partnership_id);


--
-- TOC entry 4956 (class 1259 OID 16655)
-- Name: ix_product_category_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_product_category_category_id ON public.product_category USING btree (category_id);


--
-- TOC entry 5003 (class 1259 OID 16886)
-- Name: ix_product_version_version_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_product_version_version_id ON public.product_version USING btree (version_id);


--
-- TOC entry 4978 (class 1259 OID 16769)
-- Name: ix_snp_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_snp_email ON public.snp USING btree (email);


--
-- TOC entry 4979 (class 1259 OID 16768)
-- Name: ix_snp_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_snp_name ON public.snp USING btree (name);


--
-- TOC entry 4980 (class 1259 OID 16770)
-- Name: ix_snp_snp_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_snp_snp_id ON public.snp USING btree (snp_id);


--
-- TOC entry 4962 (class 1259 OID 16677)
-- Name: ix_system_audit_log_log_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_system_audit_log_log_id ON public.system_audit_log USING btree (log_id);


--
-- TOC entry 5009 (class 1259 OID 16923)
-- Name: ix_transaction_conflict_conflict_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_transaction_conflict_conflict_id ON public.transaction_conflict USING btree (conflict_id);


--
-- TOC entry 4988 (class 1259 OID 16808)
-- Name: ix_transaction_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_transaction_order_id ON public.transaction USING btree (order_id);


--
-- TOC entry 4989 (class 1259 OID 16807)
-- Name: ix_transaction_transaction_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_transaction_transaction_id ON public.transaction USING btree (transaction_id);


--
-- TOC entry 4965 (class 1259 OID 16693)
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- TOC entry 4966 (class 1259 OID 16694)
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- TOC entry 5020 (class 2606 OID 16844)
-- Name: claim claim_mse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim
    ADD CONSTRAINT claim_mse_id_fkey FOREIGN KEY (mse_id) REFERENCES public.mse(mse_id) ON DELETE CASCADE;


--
-- TOC entry 5018 (class 2606 OID 16828)
-- Name: mse_product mse_product_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mse_product
    ADD CONSTRAINT mse_product_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.product_category(category_id);


--
-- TOC entry 5019 (class 2606 OID 16823)
-- Name: mse_product mse_product_mse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mse_product
    ADD CONSTRAINT mse_product_mse_id_fkey FOREIGN KEY (mse_id) REFERENCES public.mse(mse_id) ON DELETE CASCADE;


--
-- TOC entry 5013 (class 2606 OID 16728)
-- Name: mse mse_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mse
    ADD CONSTRAINT mse_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5015 (class 2606 OID 16781)
-- Name: notification_preferences notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5024 (class 2606 OID 16902)
-- Name: ocr_document ocr_document_claim_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ocr_document
    ADD CONSTRAINT ocr_document_claim_id_fkey FOREIGN KEY (claim_id) REFERENCES public.claim(claim_id) ON DELETE SET NULL;


--
-- TOC entry 5025 (class 2606 OID 16897)
-- Name: ocr_document ocr_document_mse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ocr_document
    ADD CONSTRAINT ocr_document_mse_id_fkey FOREIGN KEY (mse_id) REFERENCES public.mse(mse_id) ON DELETE CASCADE;


--
-- TOC entry 5021 (class 2606 OID 16860)
-- Name: partnership partnership_mse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partnership
    ADD CONSTRAINT partnership_mse_id_fkey FOREIGN KEY (mse_id) REFERENCES public.mse(mse_id) ON DELETE CASCADE;


--
-- TOC entry 5022 (class 2606 OID 16865)
-- Name: partnership partnership_snp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partnership
    ADD CONSTRAINT partnership_snp_id_fkey FOREIGN KEY (snp_id) REFERENCES public.snp(snp_id) ON DELETE CASCADE;


--
-- TOC entry 5012 (class 2606 OID 16650)
-- Name: product_category product_category_parent_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_category
    ADD CONSTRAINT product_category_parent_category_id_fkey FOREIGN KEY (parent_category_id) REFERENCES public.product_category(category_id);


--
-- TOC entry 5023 (class 2606 OID 16881)
-- Name: product_version product_version_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_version
    ADD CONSTRAINT product_version_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.mse_product(product_id) ON DELETE CASCADE;


--
-- TOC entry 5014 (class 2606 OID 16763)
-- Name: snp snp_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.snp
    ADD CONSTRAINT snp_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5026 (class 2606 OID 16918)
-- Name: transaction_conflict transaction_conflict_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_conflict
    ADD CONSTRAINT transaction_conflict_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transaction(transaction_id) ON DELETE CASCADE;


--
-- TOC entry 5016 (class 2606 OID 16797)
-- Name: transaction transaction_mse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction
    ADD CONSTRAINT transaction_mse_id_fkey FOREIGN KEY (mse_id) REFERENCES public.mse(mse_id) ON DELETE CASCADE;


--
-- TOC entry 5017 (class 2606 OID 16802)
-- Name: transaction transaction_snp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction
    ADD CONSTRAINT transaction_snp_id_fkey FOREIGN KEY (snp_id) REFERENCES public.snp(snp_id) ON DELETE CASCADE;


-- Completed on 2026-03-02 23:57:55

--
-- PostgreSQL database dump complete
--

\unrestrict ZF46qqtfG7GkaGIywB3fN53xfMX4WhnwBWGFHYBOXM3p8BR6ZYARxupLkfCFBLu

